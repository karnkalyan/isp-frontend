"use client"

import { useState, useEffect, useCallback } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search, Filter, MoreVertical, Router, ExternalLink, AlertCircle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Power, PowerOff, Signal, SignalHigh, SignalMedium, SignalLow, X, RefreshCw,
  User, UserPlus, UserMinus, Link2, Info, CheckCircle2, Trash2
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiRequest } from "@/lib/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { CustomerLinkDialog } from "./customer-link-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Device = {
  id: number
  device: string
  ipAddress: string
  username: string
  status: string
  signal: string
  lastContact: string
  uptime: string
  ProductClass: string
  Manufacturer: string
  SerialNumber: string
  OUI: string
  leadId: number | null
  lead?: {
    id: number
    firstName: string
    lastName: string
    phoneNumber: string
    status: string
    customers?: Array<{
      id: number
    }>
  }
}

type ApiResponse = {
  success: boolean
  total: number
  devices: Device[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type FilterOptions = {
  status: string[]
  signalStatus: string[]
  manufacturer: string[]
  productClass: string[]
  linked: string // "all" | "linked" | "unlinked"
}

type SignalInfo = {
  percent: number
  color: string
  textColor: string
  status: string
  icon: typeof AlertCircle | null
  signalValue: number | null
}

export function TR069DeviceList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [devices, setDevices] = useState<Device[]>([])
  const [totalDevices, setTotalDevices] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [rebootInProgress, setRebootInProgress] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    signalStatus: [],
    manufacturer: [],
    productClass: [],
    linked: "all"
  })

  // Dialog states
  const [rebootDialogOpen, setRebootDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  // Available filter options
  const [availableFilters, setAvailableFilters] = useState<Omit<FilterOptions, 'linked'>>({
    status: [],
    signalStatus: [],
    manufacturer: [],
    productClass: []
  })

  const fetchDevices = useCallback(async () => {
    try {
      setIsLoading(true)
      const fetchLimit = 500
      const firstPage = await apiRequest<ApiResponse>(`/tr069-devices?page=1&limit=${fetchLimit}`)
      const totalPages = firstPage.pagination?.totalPages || 1
      const remainingPages = totalPages > 1
        ? await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
              apiRequest<ApiResponse>(`/tr069-devices?page=${index + 2}&limit=${fetchLimit}`)
            )
          )
        : []
      const data: ApiResponse = {
        ...firstPage,
        total: firstPage.total,
        devices: [firstPage, ...remainingPages].flatMap(page => page.devices || [])
      }
      if (data.success) {
        setDevices(data.devices)
        setTotalDevices(data.total || data.devices.length)

        // Extract available filter options
        const manufacturers = Array.from(new Set(data.devices.map(d => d.Manufacturer).filter(Boolean)))
        const productClasses = Array.from(new Set(data.devices.map(d => d.ProductClass).filter(Boolean)))
        const statuses = Array.from(new Set(data.devices.map(d => d.status).filter(Boolean)))
        const signalStatuses = ["Good", "Warning", "Critical", "N/A"]

        setAvailableFilters({
          status: statuses,
          signalStatus: signalStatuses,
          manufacturer: manufacturers,
          productClass: productClasses
        })
      }
    } catch (err) {
      console.error("Failed to load devices:", err)
      toast.error("Failed to load devices from local database")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  const syncDevices = async () => {
    try {
      setIsSyncing(true)
      toast.loading("Syncing with GenieACS...", { id: "sync" })
      const response = await apiRequest<{ success: boolean; message: string; count?: number; stats?: { total: number; removed?: number } }>("/tr069-devices/sync", {
        method: 'POST'
      })
      if (response.success) {
        const removed = response.stats?.removed ? `, removed ${response.stats.removed} stale` : ""
        toast.success(`Synced ${response.stats?.total ?? 0} devices${removed}`, { id: "sync" })
        await fetchDevices()
      } else {
        toast.error(response.message || "Sync failed", { id: "sync" })
      }
    } catch (err) {
      console.error("Sync error:", err)
      toast.error("Failed to sync with GenieACS", { id: "sync" })
    } finally {
      setIsSyncing(false)
    }
  }

  const rebootDevice = async (serialNumber: string) => {
    if (!selectedDevice) return
    try {
      setRebootInProgress(serialNumber)
      const response = await apiRequest<{ success: boolean; message: string }>(
        `/services/genieacs/devices/${serialNumber}/reboot`,
        { method: 'POST' }
      )

      if (response.success) {
        toast.success(`Reboot command sent successfully to ${selectedDevice.device}`)
        setDevices(prev => prev.map(d => d.SerialNumber === serialNumber ? { ...d, status: 'Rebooting...' } : d))
      } else {
        toast.error(response.message || 'Failed to reboot device')
      }
    } catch (error) {
      console.error('Reboot error:', error)
      toast.error('Failed to send reboot command')
    } finally {
      setRebootInProgress(null)
      setRebootDialogOpen(false)
      setSelectedDevice(null)
    }
  }

  const handleUnlink = async (device: Device) => {
    if (!confirm(`Are you sure you want to unlink lead from device ${device.device || device.SerialNumber}?`)) return
    try {
      const response = await apiRequest<{ success: boolean; message: string }>(
        `/tr069-devices/${device.SerialNumber}/unlink-lead`,
        { method: 'POST' }
      )
      if (response.success) {
        toast.success("Lead unlinked successfully")
        fetchDevices()
      } else {
        toast.error(response.message || "Failed to unlink lead")
      }
    } catch (err) {
      toast.error("Error unlinking lead")
    }
  }

  const handleDeleteDevice = async (device: Device) => {
    const label = device.device || device.SerialNumber
    if (!confirm(`Delete ${label} from the local TR069 list? You can sync from GenieACS again if the device still exists there.`)) return

    try {
      const response = await apiRequest<{ success: boolean; message?: string; error?: string }>(
        `/tr069-devices/${device.SerialNumber}`,
        { method: 'DELETE' }
      )

      if (response.success) {
        toast.success(response.message || "Device deleted")
        setDevices(prev => prev.filter(item => item.SerialNumber !== device.SerialNumber))
        setTotalDevices(prev => Math.max(0, prev - 1))
      } else {
        toast.error(response.error || response.message || "Failed to delete device")
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting device")
    }
  }

  // Parse signal strength and helpers
  const parseSignalStrength = (signal: string): number | null => {
    if (signal === "N/A dBm" || !signal || signal === "N/A") return null
    const match = signal.match(/([+-]?\d+(?:\.\d+)?)/)
    return match ? parseFloat(match[1]) : null
  }

  const getSignalInfo = (signal: string): SignalInfo => {
    const signalValue = parseSignalStrength(signal)
    if (signalValue === null) {
      return { percent: 0, color: "bg-gray-500", textColor: "text-gray-500", status: "N/A", icon: null, signalValue: null }
    }
    const percentage = Math.min(100, Math.max(0, ((signalValue + 90) * (100 / 70))))
    const percent = Math.round(percentage)
    if (signalValue < -24 || signalValue > -18) {
      return { percent, color: "bg-red-500", textColor: "text-red-500", status: "Critical", icon: AlertCircle, signalValue }
    } else if (signalValue < -22 || signalValue > -19) {
      return { percent, color: "bg-amber-500", textColor: "text-amber-500", status: "Warning", icon: null, signalValue }
    } else {
      return { percent, color: "bg-green-500", textColor: "text-green-500", status: "Good", icon: null, signalValue }
    }
  }

  const getStatusVariant = (status: string): "success" | "warning" | "destructive" | "secondary" => {
    const s = status.toLowerCase()
    if (s.includes("online")) return "success"
    if (s.includes("offline")) return "destructive"
    if (s.includes("reboot") || s.includes("pending") || s.includes("provisioning")) return "warning"
    return "secondary"
  }

  const toggleFilter = (type: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: (type === 'linked') ? value : 
              (prev[type as keyof Omit<FilterOptions, 'linked'>].includes(value)
                ? (prev[type as keyof Omit<FilterOptions, 'linked'>] as string[]).filter(v => v !== value)
                : [...(prev[type as keyof Omit<FilterOptions, 'linked'>] as string[]), value])
    }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({ status: [], signalStatus: [], manufacturer: [], productClass: [], linked: "all" })
    setCurrentPage(1)
  }

  const hasActiveFilters = () => {
    return filters.status.length > 0 || filters.signalStatus.length > 0 || 
           filters.manufacturer.length > 0 || filters.productClass.length > 0 || 
           filters.linked !== "all"
  }

  const filteredDevices = devices.filter(d => {
    const search = searchQuery.toLowerCase()
    if (searchQuery && !(d.device || "").toLowerCase().includes(search) && 
        !(d.SerialNumber || "").toLowerCase().includes(search) && 
        !(d.ipAddress || "").toLowerCase().includes(search) && 
        !(d.username || "").toLowerCase().includes(search) &&
        !(d.ProductClass || "").toLowerCase().includes(search) &&
        !(d.Manufacturer || "").toLowerCase().includes(search) &&
        !(d.lead?.firstName || "").toLowerCase().includes(search) &&
        !(d.lead?.lastName || "").toLowerCase().includes(search)
    ) return false

    if (filters.status.length > 0 && !filters.status.includes(d.status)) return false
    if (filters.signalStatus.length > 0 && !filters.signalStatus.includes(getSignalInfo(d.signal).status)) return false
    if (filters.manufacturer.length > 0 && !filters.manufacturer.includes(d.Manufacturer)) return false
    if (filters.productClass.length > 0 && !filters.productClass.includes(d.ProductClass)) return false
    
    if (filters.linked === "linked" && !d.leadId) return false
    if (filters.linked === "unlinked" && d.leadId) return false

    return true
  })

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage)
  const paginatedDevices = filteredDevices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return (
    <TooltipProvider>
      <CardContainer
        title="Network Devices (TR069)"
        description="Monitor and manage customer premises equipment synced from GenieACS"
        gradientColor="#4f46e5"
      >
        <div className="flex flex-col gap-5">
          {/* Header Actions */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by device, SN, IP or lead..."
                  className="pl-9 h-10 border-slate-200 focus-visible:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 px-3 gap-2 border-slate-200">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="hidden sm:inline">Filters</span>
                    {hasActiveFilters() && <Badge variant="default" className="ml-1 h-5 px-1.5 min-w-[20px] bg-indigo-600">!</Badge>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <DropdownMenuLabel className="flex justify-between items-center">
                    Filter Options
                    {hasActiveFilters() && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700">
                        Reset
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <div className="p-1 space-y-4">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Linking Status</p>
                      <div className="flex flex-wrap gap-1">
                        {["all", "linked", "unlinked"].map(val => (
                          <Badge 
                            key={val} 
                            variant={filters.linked === val ? "default" : "outline"}
                            className={`cursor-pointer capitalize ${filters.linked === val ? "bg-indigo-600" : "text-slate-600"}`}
                            onClick={() => toggleFilter('linked', val)}
                          >
                            {val}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Connection Status</p>
                      <div className="grid grid-cols-2 gap-1">
                        {availableFilters.status.map(s => (
                          <div key={s} className="flex items-center gap-2 px-1">
                            <DropdownMenuCheckboxItem
                              checked={filters.status.includes(s)}
                              onCheckedChange={() => toggleFilter('status', s)}
                              className="text-xs p-1 h-8"
                            >
                              {s}
                            </DropdownMenuCheckboxItem>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={syncDevices} 
                disabled={isSyncing}
                variant="outline"
                className="h-10 gap-2 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? "Syncing..." : "Sync from GenieACS"}
              </Button>
              <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden lg:block" />
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500">Total Devices</p>
                <p className="text-sm font-bold text-slate-900">{filteredDevices.length} <span className="text-[10px] font-normal text-slate-400">of {totalDevices}</span></p>
              </div>
            </div>
          </div>

          {/* Device Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-200">
                    <TableHead className="font-semibold text-slate-700">Device Info</TableHead>
                    <TableHead className="font-semibold text-slate-700">Username</TableHead>
                    <TableHead className="font-semibold text-slate-700">Assigned User (Lead)</TableHead>
                    <TableHead className="font-semibold text-slate-700">IP & Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Signal Strength</TableHead>
                    <TableHead className="font-semibold text-slate-700">Last Active</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="relative">
                            <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                            <Router className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-indigo-200" />
                          </div>
                          <p className="text-sm text-slate-500 animate-pulse">Fetching devices...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedDevices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                            <Search className="h-6 w-6 text-slate-300" />
                          </div>
                          <p className="text-sm font-medium text-slate-900">No devices found</p>
                          <p className="text-xs text-slate-500">Try adjusting your filters or search query</p>
                          {hasActiveFilters() && (
                            <Button variant="link" size="sm" onClick={clearFilters} className="text-indigo-600 mt-2">
                              Clear all filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDevices.map((device) => {
                      const signal = getSignalInfo(device.signal)
                      const isRebooting = rebootInProgress === device.SerialNumber
                      const statusVariant = getStatusVariant(device.status)

                      return (
                        <TableRow key={device.id} className={`group hover:bg-slate-50/50 transition-colors ${isRebooting ? "opacity-50" : ""}`}>
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-slate-200 transition-all shadow-sm">
                                <Router className="h-5 w-5 text-slate-500" />
                              </div>
                              <div className="space-y-0.5">
                                <Link
                                  href={`/tr069/device/${device.SerialNumber}`}
                                  className="font-semibold text-slate-900 hover:underline hover:text-indigo-600 block"
                                >
                                  {device.device}
                                </Link>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                  <span className="font-mono">SN: {device.SerialNumber}</span>
                                  <span className="h-1 w-1 rounded-full bg-slate-200" />
                                  <span>{device.ProductClass}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-slate-700">
                              {device.username && device.username !== "N/A" ? device.username : "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {device.lead ? (
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                  <User className="h-4 w-4 text-indigo-600" />
                                </div>
                                <div className="space-y-0.5">
                                  <Link 
                                    href={
                                      (device.lead.status === 'converted' && device.lead.customers?.[0]?.id)
                                        ? `/customers/${device.lead.customers[0].id}`
                                        : `/leads/${device.leadId}`
                                    }
                                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                  >
                                    {device.lead.firstName} {device.lead.lastName}
                                  </Link>
                                  <p className="text-[10px] font-mono text-slate-400 uppercase">{device.lead.status}</p>
                                </div>
                              </div>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 text-indigo-600 bg-indigo-50/30 hover:bg-indigo-50 border border-dashed border-indigo-200 rounded-lg text-xs"
                                onClick={() => { setSelectedDevice(device); setLinkDialogOpen(true); }}
                              >
                                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                Link Lead
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1.5">
                              {device.ipAddress !== "N/A" ? (
                                <a
                                  href={`http://${device.ipAddress}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-mono text-slate-600 hover:text-indigo-600 flex items-center gap-1 group/ip"
                                >
                                  {device.ipAddress}
                                  <ExternalLink className="h-3 w-3 opacity-0 group-hover/ip:opacity-100 transition-opacity" />
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400 italic">No IP info</span>
                              )}
                              <Badge variant={statusVariant} className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider">
                                {isRebooting ? "Rebooting..." : device.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="w-32 space-y-1.5">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className={`font-bold ${signal.textColor}`}>{device.signal.replace(' dBm', ' dB')}</span>
                                <span className="text-slate-400 capitalize">{signal.status}</span>
                              </div>
                              <Progress value={signal.percent} className="h-1.5" indicatorClassName={signal.color} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="text-xs text-slate-700 font-medium">
                                {new Date(device.lastContact).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <Tooltip>
                                <TooltipTrigger className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Link2 className="h-3 w-3" /> Uptime: {device.uptime}
                                </TooltipTrigger>
                                <TooltipContent>Total system uptime from device</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                  <Link href={`/tr069/device/${device.SerialNumber}`} className="cursor-pointer">
                                    <Info className="h-4 w-4 mr-2" /> Device Details
                                  </Link>
                                </DropdownMenuItem>
                                {device.leadId ? (
                                  <DropdownMenuItem 
                                    className="text-amber-600 focus:text-amber-600"
                                    onClick={() => handleUnlink(device)}
                                  >
                                    <UserMinus className="h-4 w-4 mr-2" /> Unlink Lead
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => { setSelectedDevice(device); setLinkDialogOpen(true); }}>
                                    <UserPlus className="h-4 w-4 mr-2" /> Link Lead
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => { setSelectedDevice(device); setRebootDialogOpen(true); }}
                                  disabled={isRebooting || device.status.toLowerCase().includes('offline')}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" /> Reboot Device
                                </DropdownMenuItem>
                                <DropdownMenuItem>Run Diagnostics</DropdownMenuItem>
                                <DropdownMenuItem>Update Firmware</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteDevice(device)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Device
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!isLoading && filteredDevices.length > 0 && (
              <div className="p-4 bg-slate-50/30 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    Showing {(currentPage-1)*itemsPerPage + 1} to {Math.min(currentPage*itemsPerPage, filteredDevices.length)} of {filteredDevices.length}
                  </span>
                  <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[70px] h-8 text-xs border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map(v => <SelectItem key={v} value={v.toString()} className="text-xs">{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <div className="px-4 text-xs font-semibold text-slate-700">Page {currentPage} of {totalPages}</div>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dialogs */}
        <Dialog open={rebootDialogOpen} onOpenChange={setRebootDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-destructive" />
                Confirm Device Reboot
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to reboot <strong>{selectedDevice?.device || selectedDevice?.SerialNumber}</strong>? 
                This will interrupt internet service for the user for several minutes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setRebootDialogOpen(false)}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedDevice && rebootDevice(selectedDevice.SerialNumber)}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Reboot Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedDevice && (
          <CustomerLinkDialog
            open={linkDialogOpen}
            onOpenChange={setLinkDialogOpen}
            serialNumber={selectedDevice.SerialNumber}
            deviceName={selectedDevice.device}
            onLinked={fetchDevices}
          />
        )}
      </CardContainer>
    </TooltipProvider>
  )
}
