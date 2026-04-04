"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search, Filter, MoreVertical, Router, ExternalLink, AlertCircle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Power, PowerOff, Signal, SignalHigh, SignalMedium, SignalLow, X, RefreshCw
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

type Device = {
  device: string
  ipAddress: string
  status: string
  signal: string
  lastContact: string
  uptime: string
  ProductClass: string
  Manufacturer: string
  SerialNumber: string
  OUI: string
}

type ApiResponse = {
  success: boolean
  total: number
  devices: Device[]
}

type FilterOptions = {
  status: string[]
  signalStatus: string[]
  manufacturer: string[]
  productClass: string[]
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
  const [isLoading, setIsLoading] = useState(true)
  const [rebootInProgress, setRebootInProgress] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    signalStatus: [],
    manufacturer: [],
    productClass: []
  })

  // Reboot confirmation dialog state
  const [rebootDialogOpen, setRebootDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  // Available filter options
  const [availableFilters, setAvailableFilters] = useState<FilterOptions>({
    status: [],
    signalStatus: [],
    manufacturer: [],
    productClass: []
  })

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setIsLoading(true)
        const data = await apiRequest<ApiResponse>("/services/genieacs/devices")
        if (data.success) {
          setDevices(data.devices)

          // Extract available filter options from devices
          const manufacturers = [...new Set(data.devices.map(d => d.Manufacturer).filter(Boolean))]
          const productClasses = [...new Set(data.devices.map(d => d.ProductClass).filter(Boolean))]
          const statuses = [...new Set(data.devices.map(d => d.status).filter(Boolean))]
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
        toast.error("Failed to load devices")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDevices()
  }, [])

  // Reboot device function
  const rebootDevice = async (serialNumber: string) => {
    try {
      setRebootInProgress(serialNumber)

      const response = await apiRequest<{ success: boolean; message: string }>(
        `/services/genieacs/devices/${serialNumber}/reboot`,
        {
          method: 'POST',
        }
      )

      if (response.success) {
        toast.success(`Reboot command sent successfully to ${selectedDevice?.device || 'device'}`)

        // Update device status to show reboot in progress
        setDevices(prevDevices =>
          prevDevices.map(device =>
            device.SerialNumber === serialNumber
              ? { ...device, status: 'Rebooting...' }
              : device
          )
        )
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

  // Handle reboot confirmation
  const confirmReboot = (device: Device) => {
    setSelectedDevice(device)
    setRebootDialogOpen(true)
  }

  // Parse signal strength to numeric value
  const parseSignalStrength = (signal: string): number | null => {
    if (signal === "N/A dBm" || !signal || signal === "N/A") return null
    const match = signal.match(/([+-]?\d+(?:\.\d+)?)/)
    return match ? parseFloat(match[1]) : null
  }

  // Get signal status, color, and percentage for display
  const getSignalInfo = (signal: string): SignalInfo => {
    const signalValue = parseSignalStrength(signal)

    if (signalValue === null) {
      return {
        percent: 0,
        color: "bg-gray-500",
        textColor: "text-gray-500",
        status: "N/A",
        icon: null,
        signalValue: null
      }
    }

    const percentage = Math.min(100, Math.max(0, ((signalValue + 90) * (100 / 70))))
    const percent = Math.round(percentage)

    // Critical: below -24 dBm or above -18 dBm
    if (signalValue < -24 || signalValue > -18) {
      return {
        percent,
        color: "bg-red-500",
        textColor: "text-red-500",
        status: "Critical",
        icon: AlertCircle,
        signalValue
      }
    }
    // Warning: between -24 to -22 dBm OR -19 to -18 dBm
    else if (signalValue < -22 || signalValue > -19) {
      return {
        percent,
        color: "bg-amber-500",
        textColor: "text-amber-500",
        status: "Warning",
        icon: null,
        signalValue
      }
    }
    // Good: between -22 to -19 dBm
    else {
      return {
        percent,
        color: "bg-green-500",
        textColor: "text-green-500",
        status: "Good",
        icon: null,
        signalValue
      }
    }
  }

  // Get signal status from signal string
  const getSignalStatus = (signal: string): string => {
    const signalInfo = getSignalInfo(signal)
    return signalInfo.status
  }

  // Format last contact time
  const formatLastContact = (lastContact: string): string => {
    const date = new Date(lastContact)
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(',', '')
  }

  // Format uptime display
  const formatUptime = (uptime: string): string => {
    if (uptime === "N/A") return "0d 0h 0m"
    return uptime
  }

  const getStatusVariant = (status: string): "success" | "warning" | "destructive" | "secondary" => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes("online")) return "success"
    if (statusLower.includes("offline")) return "destructive"
    if (statusLower.includes("reboot")) return "warning"
    if (statusLower.includes("pending") || statusLower.includes("provisioning")) return "warning"
    return "secondary"
  }

  const getSignalIcon = (signalStatus: string) => {
    switch (signalStatus) {
      case "Good":
        return <SignalHigh className="h-4 w-4 text-green-500" />
      case "Warning":
        return <SignalMedium className="h-4 w-4 text-amber-500" />
      case "Critical":
        return <SignalLow className="h-4 w-4 text-red-500" />
      default:
        return <Signal className="h-4 w-4 text-gray-500" />
    }
  }

  // Toggle filter
  const toggleFilter = (type: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }))
    setCurrentPage(1) // Reset to first page when filter changes
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: [],
      signalStatus: [],
      manufacturer: [],
      productClass: []
    })
    setCurrentPage(1)
  }

  // Check if any filters are active
  const hasActiveFilters = () => {
    return Object.values(filters).some(arr => arr.length > 0)
  }

  // Apply filters to devices
  const applyFilters = (devices: Device[]) => {
    return devices.filter(device => {
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(device.status)) {
        return false
      }

      // Signal status filter
      if (filters.signalStatus.length > 0) {
        const signalStatus = getSignalStatus(device.signal)
        if (!filters.signalStatus.includes(signalStatus)) {
          return false
        }
      }

      // Manufacturer filter
      if (filters.manufacturer.length > 0 && !filters.manufacturer.includes(device.Manufacturer)) {
        return false
      }

      // Product class filter
      if (filters.productClass.length > 0 && !filters.productClass.includes(device.ProductClass)) {
        return false
      }

      return true
    })
  }

  // Apply search and filters to devices
  const filterDevices = (devices: Device[]) => {
    // First apply search
    let filtered = devices.filter(
      (device) =>
        device.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.SerialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.ipAddress !== "N/A" && device.ipAddress.includes(searchQuery)) ||
        device.ProductClass.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Then apply filters
    filtered = applyFilters(filtered)

    return filtered
  }

  const filteredDevices = filterDevices(devices)

  // Pagination calculations
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDevices = filteredDevices.slice(startIndex, endIndex)

  // Handle page changes
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <>
      <CardContainer
        title="Device Status"
        description="View and manage all customer premises equipment"
        gradientColor="#6366f1"
      >
        <div className="flex flex-col gap-4">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices by name, serial, IP or model..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>

              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Filter className="h-4 w-4" />
                    {hasActiveFilters() && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter Devices</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Status Filters */}
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Status
                  </DropdownMenuLabel>
                  {availableFilters.status.map(status => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={filters.status.includes(status)}
                      onCheckedChange={() => toggleFilter('status', status)}
                    >
                      <div className="flex items-center gap-2">
                        {status.toLowerCase().includes('online') ? (
                          <Power className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <PowerOff className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span>{status}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator />

                  {/* Signal Status Filters */}
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Signal Strength
                  </DropdownMenuLabel>
                  {availableFilters.signalStatus.map(status => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={filters.signalStatus.includes(status)}
                      onCheckedChange={() => toggleFilter('signalStatus', status)}
                    >
                      <div className="flex items-center gap-2">
                        {getSignalIcon(status)}
                        <span className={`
                          ${status === 'Good' ? 'text-green-500' : ''}
                          ${status === 'Warning' ? 'text-amber-500' : ''}
                          ${status === 'Critical' ? 'text-red-500' : ''}
                          ${status === 'N/A' ? 'text-gray-500' : ''}
                        `}>
                          {status}
                        </span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator />

                  {/* Manufacturer Filters */}
                  {availableFilters.manufacturer.length > 0 && (
                    <>
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Manufacturer
                      </DropdownMenuLabel>
                      {availableFilters.manufacturer.slice(0, 5).map(mfr => (
                        <DropdownMenuCheckboxItem
                          key={mfr}
                          checked={filters.manufacturer.includes(mfr)}
                          onCheckedChange={() => toggleFilter('manufacturer', mfr)}
                        >
                          {mfr}
                        </DropdownMenuCheckboxItem>
                      ))}
                      {availableFilters.manufacturer.length > 5 && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          +{availableFilters.manufacturer.length - 5} more
                        </div>
                      )}
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* Clear Filters */}
                  {hasActiveFilters() && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearFilters} className="text-destructive">
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-4">
              {/* Active Filters Display */}
              {hasActiveFilters() && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Filters:</span>
                  <div className="flex gap-1 flex-wrap">
                    {filters.status.map(status => (
                      <Badge key={status} variant="secondary" className="text-xs">
                        {status}
                        <button
                          className="ml-1 hover:text-foreground"
                          onClick={() => toggleFilter('status', status)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {filters.signalStatus.map(status => (
                      <Badge key={status} variant="secondary" className="text-xs">
                        {status}
                        <button
                          className="ml-1 hover:text-foreground"
                          onClick={() => toggleFilter('signalStatus', status)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {filters.manufacturer.map(mfr => (
                      <Badge key={mfr} variant="secondary" className="text-xs">
                        {mfr}
                        <button
                          className="ml-1 hover:text-foreground"
                          onClick={() => toggleFilter('manufacturer', mfr)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                Total: {filteredDevices.length} devices
                {filteredDevices.length !== devices.length && (
                  <span className="text-xs ml-1">(filtered)</span>
                )}
              </div>
            </div>
          </div>

          {/* Devices Table */}
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                        <p className="text-muted-foreground mt-2">Loading devices...</p>
                      </TableCell>
                    </TableRow>
                  ) : paginatedDevices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        {devices.length === 0 ? "No devices found." : "No matching devices found."}
                        {hasActiveFilters() && (
                          <Button
                            variant="link"
                            className="ml-2"
                            onClick={clearFilters}
                          >
                            Clear filters
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDevices.map((device) => {
                      const signalInfo = getSignalInfo(device.signal)
                      const lastContactFormatted = formatLastContact(device.lastContact)
                      const uptimeFormatted = formatUptime(device.uptime)
                      const statusVariant = getStatusVariant(device.status)
                      const SignalIcon = signalInfo.icon
                      const isRebooting = rebootInProgress === device.SerialNumber

                      return (
                        <TableRow key={device.SerialNumber} className={isRebooting ? "opacity-50" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="rounded-md bg-slate-100 dark:bg-slate-800 p-1.5">
                                <Router className="h-5 w-5 text-slate-500" />
                              </div>
                              <div>
                                <Link
                                  href={`/tr069/device/${device.SerialNumber}`}
                                  className="font-medium hover:underline"
                                >
                                  {device.device}
                                </Link>
                                <div className="text-xs text-muted-foreground">
                                  {device.ProductClass}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  SN: {device.SerialNumber}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {device.ipAddress === "N/A" ? (
                              <span className="text-muted-foreground">N/A</span>
                            ) : (
                              <a
                                href={`https://${device.ipAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline group"
                              >
                                {device.ipAddress}
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusVariant}
                              className="capitalize"
                            >
                              {isRebooting ? 'Rebooting...' : device.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Progress
                                  value={signalInfo.percent}
                                  className="w-16 h-2"
                                  indicatorClassName={signalInfo.color}
                                />
                                {SignalIcon && (
                                  <AlertCircle className="absolute -top-1 -right-1 h-3 w-3 text-red-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`text-xs ${signalInfo.textColor} font-medium`}>
                                  {device.signal === "N/A dBm" ? "N/A" : device.signal.replace(' dBm', '')}
                                </span>
                                {signalInfo.status !== "N/A" && signalInfo.status !== "Good" && (
                                  <span className={`text-[10px] ${signalInfo.textColor}`}>
                                    ({signalInfo.status})
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{lastContactFormatted}</TableCell>
                          <TableCell>{uptimeFormatted}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isRebooting}
                                >
                                  {isRebooting ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Link href={`/tr069/device/${device.SerialNumber}`} className="w-full">
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => confirmReboot(device)}
                                  disabled={isRebooting || device.status.toLowerCase().includes('offline')}
                                  className={device.status.toLowerCase().includes('offline') ? 'text-muted-foreground' : 'text-destructive'}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reboot Device
                                </DropdownMenuItem>
                                <DropdownMenuItem>Update Firmware</DropdownMenuItem>
                                <DropdownMenuItem>Run Diagnostics</DropdownMenuItem>
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
          </div>

          {/* Pagination Controls */}
          {!isLoading && filteredDevices.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredDevices.length)} of {filteredDevices.length} devices
                </span>

                {/* Items per page selector */}
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContainer>

      {/* Reboot Confirmation Dialog */}
      <Dialog open={rebootDialogOpen} onOpenChange={setRebootDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reboot Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to reboot {selectedDevice?.device}?
              {selectedDevice?.status.toLowerCase().includes('online') ? (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  ⚠️ The device is currently online. Rebooting will cause temporary service interruption.
                </span>
              ) : (
                <span className="block mt-2 text-muted-foreground">
                  The device appears to be offline. The reboot command will be sent when the device reconnects.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRebootDialogOpen(false)
                setSelectedDevice(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedDevice && rebootDevice(selectedDevice.SerialNumber)}
              disabled={rebootInProgress === selectedDevice?.SerialNumber}
            >
              {rebootInProgress === selectedDevice?.SerialNumber ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Rebooting...
                </>
              ) : (
                'Reboot Device'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}