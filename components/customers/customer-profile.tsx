"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CustomerInvoices } from "@/components/customers/customer-invoices"
import { CustomerTickets } from "@/components/customers/customer-tickets"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Wifi,
  FileText,
  LifeBuoy,
  Activity,
  Clock,
  Network,
  Cable,
  Router,
  Settings,
  AlertCircle,
  Trash2,
  Loader2,
  Package,
  RefreshCw,
  Shield,
  Award,
  Users,
  FileCheck,
  Link,
  Globe,
  HardDrive,
  Box,
  Server,
  Split,
  Cpu,
  Zap,
  BarChart,
  Play,
  Pause,
  ArrowRightLeft,
  Plus,
  Search,
  Check,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  RotateCcw,
  Eye,
  EyeOff,
  Key
} from "lucide-react"
import { apiRequest, getDynamicBaseUrl } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

// TR-069 components
import { TR069DeviceDetails } from "@/components/tr069/device-details"
import { TR069DeviceWanConnections } from "@/components/tr069/device-wan-connections"
import { TR069DeviceWifi } from "@/components/tr069/device-wifi"
import { TR069DeviceLanInfo } from "@/components/tr069/device-lan"
import { TR069DeviceNeighbors } from "@/components/tr069/device-neighbors"

// Realtime Usage Chart
import { RealtimeUsageChart } from "@/components/customers/realtime-charts"
import { CustomerBillingManagement } from "@/components/customers/customer-billing-management"

import { SearchableSelect } from "@/components/ui/searchable-select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Chart.js (for DataUsageHistory)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { useTheme } from "next-themes"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// ========== Types ==========

interface OLT {
  id: number
  name: string
  ipAddress: string
  model: string
  ports: number
  serviceBoards?: Array<{
    id: string
    slot: number
    type: string
    portCount: number
    usedPorts: number
    availablePorts: number
    status: string
  }>
  vlans?: Array<{
    id: string
    vlanId: number
    name: string
    description?: string
    gemIndex?: number
    priority?: number
    status: string
  }>
  profiles?: Array<{
    id: string
    profileId: string
    name: string
    type: string
    description?: string
  }>
}

interface Splitter {
  id: number
  name: string
  splitterId: string
  splitRatio: string
  portCount: number
  oltId?: number
  location?: {
    latitude?: number
    longitude?: number
    site?: string
  }
  status?: string
  splitterType?: string
  availablePorts?: number
  distance?: number // for nearest calculation
  olt?: {
    id: number
    name: string
    ipAddress: string
  } | null
  connectedServiceBoard?: {
    oltId: string
    oltName: string
    boardPort: string
    boardSlot: number
    boardType?: string // to determine EPON/GPON
  } | null
  isMaster?: boolean
  masterSplitterId?: string | null
}

interface CustomerDevice {
  id?: number
  deviceType: string
  brand: string
  model: string
  serialNumber: string
  macAddress: string
  ponSerial?: string
  notes: string
  inventoryItemId?: number
  provisioningStatus?: string
}

interface Customer {

  id: number
  customerUniqueId: string | null
  panNo?: string
  idNumber: string
  leadId?: number
  membershipId: number | null
  branchId: number | null
  ispId: number
  isRechargeable: boolean
  installedById: number | null
  oltId: number | null
  splitterId: number | null
  existingISPId: number | null
  assignedPkg: number
  subscribedPkgId: number
  status: string
  isDeleted: boolean
  onboardStatus: string
  createdAt: string
  updatedAt: string
  packagePrice: {
    id: number
    planId: number
    price: number
    packageDuration: string
    referenceId: string
    packageName: string
    isTrial: boolean
    isActive: boolean
    isDeleted: boolean
    packagePlanDetails: {
      id: number
      planName: string
      planCode: string
      connectionType: number
      dataLimit: number
      downSpeed: number
      upSpeed: number
      deviceLimit: number
      isPopular: boolean
      description: string
      isActive: boolean
      isDeleted: boolean
    }
  }
  subscribedPkg: {
    id: number
    planId: number
    price: number
    packageDuration: string
    referenceId: string
    packageName: string
    isTrial: boolean
    isActive: boolean
    isDeleted: boolean
    packagePlanDetails: {
      id: number
      planName: string
      planCode: string
      connectionType: number
      dataLimit: number
      downSpeed: number
      upSpeed: number
      deviceLimit: number
      isPopular: boolean
      description: string
      isActive: boolean
      isDeleted: boolean
    }
  }
  membership: {
    id: number
    name: string
    code: string
    description: string | null
    address: string
    details: string | null
    newMemberEnabled: boolean
    newMemberIsPercent: boolean
    newMemberValue: number
    renewalEnabled: boolean
    renewalIsPercent: boolean
    renewalValue: number
    isActive: boolean
    isDeleted: boolean
  } | null
  installedBy?: {
    name: string
    email: string
  } | null
  referencedById?: number | null
  referencedBy?: {
    firstName: string
    lastName: string
    email: string
  } | null
  inventoryItems?: any[]
  existingISP?: {
    id: number
    name: string
  } | null
  documents: Array<{
    id: number
    documentType: string
    fileName: string
    filePath: string
    mimeType: string
    size: number
    uploadedAt: string
    isDeleted: boolean
  }>
  connectionUsers: Array<{
    id: number
    username: string
    password: string
    isActive: boolean
    isDeleted: boolean
    createdAt: string
  }>
  customerSubscriptions: Array<{
    id: number
    package: number
    isTrial: boolean
    planStart: string
    planEnd: string
    isActive: boolean
    isInvoicing: boolean
    packagePrice: {
      id: number
      planId: number
      price: number
      packageDuration: string
      referenceId: string
      packageName: string
      isTrial: boolean
      packagePlanDetails: {
        id: number
        planName: string
        planCode: string
        downSpeed: number
        upSpeed: number
        deviceLimit: number
      }
    }
  }>
  orders: Array<{
    id: number
    totalAmount: number
    orderDate: string
    packageStart: string
    packageEnd: string
    isPaid: boolean
    isActive: boolean
    items: Array<{
      id: number
      itemName: string
      referenceId: string
      itemPrice: number
      createdAt: string
    }>
    packagePrice: {
      id: number
      planId: number
      price: number
      packageDuration: string
      referenceId: string
      packageName: string
      isTrial: boolean
      packagePlanDetails: {
        id: number
        planName: string
        planCode: string
        downSpeed: number
        upSpeed: number
        deviceLimit: number
      }
    }
  }>
  isp: {
    companyName: string
    phoneNumber: string
    masterEmail: string
  }
  firstName: string
  lastName: string
  middleName: string | null
  email: string
  phoneNumber: string
  secondaryPhone?: string
  gender?: string
  street?: string
  district?: string
  state?: string
  devices: Array<{
    id: number
    deviceType: string
    brand: string
    model: string
    serialNumber: string
    macAddress: string
    ponSerial: string
    provisioningStatus: string
    notes: string | null
    createdAt: string
    updatedAt: string
  }>
  serviceDetails: Array<{
    id: number
    oltId: number
    splitterId: number
    oltPort: string
    splitterPort: string
    vlanId: string
    vlanPriority: string
    connectionType: string
    status: string
    provisioningNotes: string | null
    createdAt: string
    updatedAt: string
    olt?: any
    splitter?: any
    vlanDetails?: Array<{
      id: number
      oltId: number
      vlanId: number
      name: string
      description?: string
      gemIndex?: number
      vlanType?: string
      priority?: number
      status: string
      createdAt: string
      updatedAt: string
    }>
  }>
  subscribedApps: Array<{
    id: number
    customerId: number
    serviceId: number
    status: string
    validUntil: string | null
    serviceData: any
    createdAt: string
    updatedAt: string
    service: {
      id: number
      name: string
      code: string
      description: string
      iconUrl: string
      category: string
      isDeleted: boolean
    }
  }>
  portalUser?: {
    id: number
    email: string
    name: string | null
    status: string
    createdAt: string
    updatedAt: string
  } | null
}

interface PackageOption {
  id: number
  packageName: string
  price: number
  packageDuration: string
  packagePlanDetails: {
    planName: string
    downSpeed: number
    upSpeed: number
  }
}

interface RadiusSession {
  radacctid: number
  acctsessionid: string
  acctuniqueid: string
  username: string
  realm: string
  nasipaddress: string
  nasportid: string
  nasporttype: string
  acctstarttime: string | null
  acctupdatetime: string | null
  acctstoptime: string | null
  acctinterval: number | null
  acctsessiontime: number | null
  acctauthentic: string
  connectinfo_start: string
  connectinfo_stop: string
  acctinputoctets: number
  acctoutputoctets: number
  calledstationid: string
  callingstationid: string
  acctterminatecause: string
  servicetype: string
  framedprotocol: string
  framedipaddress: string
  framedipv6address: string
  framedipv6prefix: string
  framedinterfaceid: string
  delegatedipv6prefix: string
  class: any
}

// ========== Helper Functions ==========
function formatDuration(seconds: number | null): string {
  if (!seconds) return "N/A"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatBytesToGB(bytes: number): string {
  if (bytes === 0) return "0 GB"
  const gb = bytes / (1024 * 1024 * 1024)
  return gb.toFixed(2) + " GB"
}

type AggregateBy = "daily" | "weekly" | "monthly"

function aggregateSessions(sessions: RadiusSession[], by: AggregateBy): any[] {
  const grouped: { [key: string]: { download: number; upload: number; count: number } } = {}

  sessions.forEach(s => {
    if (!s.acctstarttime) return
    const date = new Date(s.acctstarttime)
    let key: string
    if (by === "daily") {
      key = date.toISOString().split('T')[0] // YYYY-MM-DD
    } else if (by === "weekly") {
      const d = new Date(date)
      d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)) // Monday
      key = d.toISOString().split('T')[0]
    } else {
      key = date.toISOString().slice(0, 7) // YYYY-MM
    }

    if (!grouped[key]) {
      grouped[key] = { download: 0, upload: 0, count: 0 }
    }
    grouped[key].download += s.acctoutputoctets / (1024 * 1024) // MB
    grouped[key].upload += s.acctinputoctets / (1024 * 1024)
    grouped[key].count += 1
  })

  return Object.entries(grouped)
    .map(([date, values]) => ({
      date,
      download: values.download,
      upload: values.upload,
      sessions: values.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ========== Data Usage History Component (Chart.js version) ==========
interface DataUsageHistoryProps {
  usernames: string[]
}

function DataUsageHistory({ usernames }: DataUsageHistoryProps) {
  const { resolvedTheme } = useTheme()
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [sessions, setSessions] = useState<RadiusSession[]>([])
  const [loading, setLoading] = useState(false)
  const [liveUpdate, setLiveUpdate] = useState(false)
  const [intervalSec, setIntervalSec] = useState<number>(60)
  const [aggregateBy, setAggregateBy] = useState<AggregateBy>("daily")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (usernames.length > 0 && !selectedUser) {
      setSelectedUser(usernames[0])
    }
  }, [usernames, selectedUser])

  const fetchSessions = useCallback(async (username: string) => {
    if (!username) return
    setLoading(true)
    try {
      const response = await apiRequest<{ success: boolean; data: RadiusSession[] }>(
        `/services/radius/act/${username}`
      )
      if (response.success && response.data) {
        setSessions(response.data)
        if (response.data.length > 0) {
          const dates = response.data
            .map(s => s.acctstarttime ? new Date(s.acctstarttime).toISOString().slice(0, 7) : "")
            .filter(Boolean)
          if (dates.length > 0) {
            const latest = dates.sort().pop() || ""
            setSelectedMonth(latest)
          }
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch usage data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching RADIUS sessions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch usage data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedUser) {
      fetchSessions(selectedUser)
    }
  }, [selectedUser, fetchSessions])

  useEffect(() => {
    if (liveUpdate && selectedUser) {
      intervalRef.current = setInterval(() => {
        fetchSessions(selectedUser)
      }, intervalSec * 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [liveUpdate, intervalSec, selectedUser, fetchSessions])

  const toggleLiveUpdate = () => setLiveUpdate(prev => !prev)

  const availableMonths = React.useMemo(() => {
    const months = sessions
      .map(s => s.acctstarttime ? new Date(s.acctstarttime).toISOString().slice(0, 7) : "")
      .filter(Boolean)
    return [...new Set(months)].sort().reverse()
  }, [sessions])

  const filteredSessions = React.useMemo(() => {
    if (!selectedMonth) return sessions
    return sessions.filter(s => {
      if (!s.acctstarttime) return false
      const month = new Date(s.acctstarttime).toISOString().slice(0, 7)
      return month === selectedMonth
    })
  }, [sessions, selectedMonth])

  // Group by date and convert to GB (ascending order)
  const groupedByDate = React.useMemo(() => {
    const groups: { [date: string]: { totalDownload: number; totalUpload: number; sessions: RadiusSession[] } } = {}
    filteredSessions.forEach(session => {
      if (!session.acctstarttime) return
      const date = new Date(session.acctstarttime).toLocaleDateString()
      if (!groups[date]) {
        groups[date] = { totalDownload: 0, totalUpload: 0, sessions: [] }
      }
      groups[date].totalDownload += session.acctoutputoctets
      groups[date].totalUpload += session.acctinputoctets
      groups[date].sessions.push(session)
    })
    return Object.entries(groups)
      .map(([date, data]) => ({
        date,
        totalDownloadGB: data.totalDownload / (1024 * 1024 * 1024),
        totalUploadGB: data.totalUpload / (1024 * 1024 * 1024),
        sessionCount: data.sessions.length,
        sampleIP: data.sessions[0]?.framedipaddress || "N/A",
        sampleNAS: data.sessions[0]?.nasipaddress || "N/A",
        sampleMAC: data.sessions[0]?.callingstationid || "N/A",
        sampleCause: data.sessions[0]?.acctterminatecause || "N/A",
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // ascending
  }, [filteredSessions])

  const chartData = aggregateSessions(filteredSessions, aggregateBy)
  const isDarkMode = resolvedTheme === "dark"

  const chartLabels = chartData.map(d => d.date)
  const chartDatasets = [
    {
      label: "Download (MB)",
      data: chartData.map(d => d.download),
      borderColor: "rgb(59, 130, 246)",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      fill: true,
      tension: 0.4,
    },
    {
      label: "Upload (MB)",
      data: chartData.map(d => d.upload),
      borderColor: "rgb(16, 185, 129)",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      fill: true,
      tension: 0.4,
    },
  ]

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: isDarkMode ? "#e2e8f0" : "#334155",
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || ""
            if (label) label += ": "
            if (context.parsed.y !== null) label += context.parsed.y.toFixed(2) + " MB"
            return label
          },
        },
        backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.8)",
        titleColor: isDarkMode ? "#e2e8f0" : "#334155",
        bodyColor: isDarkMode ? "#e2e8f0" : "#334155",
        borderColor: isDarkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(203, 213, 225, 0.5)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: isDarkMode ? "rgba(71, 85, 105, 0.3)" : "rgba(203, 213, 225, 0.5)",
        },
        ticks: {
          color: isDarkMode ? "#94a3b8" : "#64748b",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "MB",
          color: isDarkMode ? "#94a3b8" : "#64748b",
        },
        grid: {
          color: isDarkMode ? "rgba(71, 85, 105, 0.3)" : "rgba(203, 213, 225, 0.5)",
        },
        ticks: {
          color: isDarkMode ? "#94a3b8" : "#64748b",
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  }

  if (usernames.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No connection users available</div>
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-48">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {usernames.map((user) => (
                <SelectItem key={user} value={user}>
                  {user}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant={liveUpdate ? "default" : "outline"} onClick={toggleLiveUpdate} className="gap-2">
            {liveUpdate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {liveUpdate ? "Stop" : "Start"} Live Update
          </Button>

          <Select value={intervalSec.toString()} onValueChange={(val) => setIntervalSec(parseInt(val))} disabled={!liveUpdate}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 sec</SelectItem>
              <SelectItem value="60">1 min</SelectItem>
              <SelectItem value="300">5 min</SelectItem>
            </SelectContent>
          </Select>

          <Select value={aggregateBy} onValueChange={(val: AggregateBy) => setAggregateBy(val)}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {availableMonths.length > 0 && (
          <div className="flex items-center gap-2">
            <Label htmlFor="month" className="text-sm">Month:</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <div className="h-80 w-full">
          <Line data={{ labels: chartLabels, datasets: chartDatasets }} options={chartOptions} />
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {!loading && filteredSessions.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">No sessions found for this period</div>
      )}

      {/* Grouped Table with GB */}
      {!loading && groupedByDate.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Total Download (GB)</th>
                <th className="p-2 text-left">Total Upload (GB)</th>
                <th className="p-2 text-left">Sessions</th>
                <th className="p-2 text-left">Sample IP</th>
                <th className="p-2 text-left">Sample NAS IP</th>
                <th className="p-2 text-left">Sample MAC</th>
                <th className="p-2 text-left">Sample Cause</th>
              </tr>
            </thead>
            <tbody>
              {groupedByDate.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="p-2">{row.date}</td>
                  <td className="p-2">{row.totalDownloadGB.toFixed(2)} GB</td>
                  <td className="p-2">{row.totalUploadGB.toFixed(2)} GB</td>
                  <td className="p-2">{row.sessionCount}</td>
                  <td className="p-2">{row.sampleIP}</td>
                  <td className="p-2">{row.sampleNAS}</td>
                  <td className="p-2">{row.sampleMAC}</td>
                  <td className="p-2">{row.sampleCause}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ==================== Device Dialog Component (with MAC formatting) ====================
interface DeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: CustomerDevice
  onSave: (device: CustomerDevice) => void
}

function formatMacAddress(value: string): string {
  const cleaned = value.replace(/[^a-fA-F0-9]/g, '').toLowerCase()
  const groups = cleaned.match(/.{1,4}/g)
  if (!groups) return value
  return groups.join('.')
}

function normalizeIdentifier(value?: string | null): string {
  return (value || "").replace(/[^a-fA-F0-9]/g, "").toLowerCase()
}

function DeviceDialog({ open, onOpenChange, device, onSave }: DeviceDialogProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<CustomerDevice & { ponSerial?: string }>({
    deviceType: "ONT",
    brand: "",
    model: "",
    serialNumber: "",
    macAddress: "",
    ponSerial: "",
    notes: "",
  })

  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [loadingInventory, setLoadingInventory] = useState(false)

  useEffect(() => {
    if (device) {
      setFormData({
        ...device,
        ponSerial: (device as any).ponSerial || "",
        macAddress: device.macAddress ? formatMacAddress(device.macAddress) : "",
      })
    } else {
      setFormData({
        deviceType: "ONT",
        brand: "",
        model: "",
        serialNumber: "",
        macAddress: "",
        ponSerial: "",
        notes: "",
        id: undefined,
        inventoryItemId: undefined,
      })
    }
  }, [device, open])

  // Fetch branch stock
  useEffect(() => {
    if (open && user?.id) {
      setLoadingInventory(true)
      apiRequest<any[]>(`/inventory?type=${encodeURIComponent(formData.deviceType)}&status=ASSIGNED_TO_USER&userId=${user.id}`)
        .then(data => {
          const available = (data || []).filter((item: any) =>
            item.status === "ASSIGNED_TO_USER" && Number(item.userId) === Number(user.id) && !item.customerId
          )
          setInventoryItems(available)
        })
        .catch(console.error)
        .finally(() => setLoadingInventory(false))
    }
  }, [open, user?.id, formData.deviceType])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleInventorySelect = (value: string | string[]) => {
    const serialNumber = Array.isArray(value) ? value[0] : value
    const selectedIdentifier = normalizeIdentifier(serialNumber)
    const item = inventoryItems.find(i =>
      i.serialNumber === serialNumber ||
      normalizeIdentifier(i.serialNumber) === selectedIdentifier ||
      normalizeIdentifier(i.ponSerialNumber) === selectedIdentifier ||
      normalizeIdentifier(i.macAddress) === selectedIdentifier
    )
    if (item) {
      setFormData(prev => ({
        ...prev,
        serialNumber: item.serialNumber,
        macAddress: item.macAddress || prev.macAddress,
        ponSerial: item.ponSerialNumber || prev.ponSerial,
        brand: item.name || prev.brand,
        model: item.model || item.type || prev.model,
        inventoryItemId: item.id,
      }))
    }
  }

  const handleMacBlur = () => {
    if (formData.macAddress) {
      setFormData(prev => ({ ...prev, macAddress: formatMacAddress(prev.macAddress) }))
    }
  }

  const handleSubmit = () => {
    if (!formData.brand || !formData.model || !formData.serialNumber) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" })
      return
    }
    onSave(formData as CustomerDevice)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{device ? "Edit Device" : "Add Provisioned Device"}</DialogTitle>
          <DialogDescription>
            Assign an ONT/Device from your branch's inventory to this customer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="deviceType">Device Type *</Label>
            <SearchableSelect
              options={[
                { value: "ONT", label: "ONT (Optical Network Terminal)" },
                { value: "Router", label: "Router" },
                { value: "STB", label: "Set-Top Box" },
              ]}
              value={formData.deviceType}
              onValueChange={(value) => handleChange("deviceType", Array.isArray(value) ? value[0] : value)}
              placeholder="Select device type"
            />
          </div>

          <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 rounded-lg">
            <Label>Select Available Stock *</Label>
            <SearchableSelect
              options={inventoryItems.map(i => ({
                value: i.serialNumber,
                label: `${i.name} (${i.serialNumber})`
              }))}
              value={formData.serialNumber}
              onValueChange={handleInventorySelect}
              placeholder={loadingInventory ? "Loading inventory..." : "Select from branch stock"}
              disabled={loadingInventory}
            />
            <p className="text-[10px] text-muted-foreground">Only showing devices assigned to your user from your active branch.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                placeholder="e.g., TP-Link"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleChange("model", e.target.value)}
                placeholder="e.g., Archer C7"
                disabled
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleChange("serialNumber", e.target.value)}
                placeholder="SN123456"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="macAddress">MAC Address</Label>
              <Input
                id="macAddress"
                value={formData.macAddress}
                onChange={(e) => handleChange("macAddress", e.target.value)}
                onBlur={handleMacBlur}
                placeholder="xxxx.xxxx.xxxx"
                disabled
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ponSerial">PON-SN (GPON)</Label>
              <Input
                id="ponSerial"
                value={formData.ponSerial}
                onChange={(e) => handleChange("ponSerial", e.target.value)}
                placeholder="e.g., ALCLF12345678"
                disabled
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional info..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSubmit}>Save Device</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========== Edit Assigned Device Dialog Component ==========
interface EditAssignedDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: any | null
  customerId: number
  onSaveSuccess: () => void
}

function EditAssignedDeviceDialog({ open, onOpenChange, device, customerId, onSaveSuccess }: EditAssignedDeviceDialogProps) {
  const [formData, setFormData] = useState({
    deviceType: "ONT",
    brand: "",
    model: "",
    serialNumber: "",
    macAddress: "",
    ponSerial: "",
    provisioningStatus: "pending",
    notes: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (device) {
      setFormData({
        deviceType: device.deviceType || "ONT",
        brand: device.brand || "",
        model: device.model || "",
        serialNumber: device.serialNumber || "",
        macAddress: device.macAddress || "",
        ponSerial: device.ponSerial || "",
        provisioningStatus: device.provisioningStatus || "pending",
        notes: device.notes || "",
      })
    }
  }, [device, open])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!device) return
    setLoading(true)
    try {
      await apiRequest(`/customer/${customerId}/devices/${device.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      })
      toast({ title: "Success", description: "Device updated successfully" })
      onSaveSuccess()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to update device", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Assigned Device</DialogTitle>
          <DialogDescription>Modify device details and status.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="edit-deviceType">Device Type *</Label>
            <Select value={formData.deviceType} onValueChange={(val) => handleChange("deviceType", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONT">ONT (Optical Network Terminal)</SelectItem>
                <SelectItem value="Router">Router</SelectItem>
                <SelectItem value="STB">Set-Top Box</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand *</Label>
              <Input id="edit-brand" value={formData.brand} onChange={(e) => handleChange("brand", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model">Model *</Label>
              <Input id="edit-model" value={formData.model} onChange={(e) => handleChange("model", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-serialNumber">Serial Number *</Label>
              <Input id="edit-serialNumber" value={formData.serialNumber} onChange={(e) => handleChange("serialNumber", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-macAddress">MAC Address</Label>
              <Input id="edit-macAddress" value={formData.macAddress} onChange={(e) => handleChange("macAddress", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-ponSerial">PON-SN (GPON)</Label>
              <Input id="edit-ponSerial" value={formData.ponSerial} onChange={(e) => handleChange("ponSerial", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status *</Label>
              <Select value={formData.provisioningStatus} onValueChange={(val) => handleChange("provisioningStatus", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">PENDING</SelectItem>
                  <SelectItem value="active">ACTIVE</SelectItem>
                  <SelectItem value="suspended">SUSPENDED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========== Main Component ==========
interface CustomerProfileProps {
  customerId?: string
}

export function CustomerProfile({ customerId: customerIdProp }: CustomerProfileProps = {}) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [packages, setPackages] = useState<PackageOption[]>([])

  // Removed duplicate state definition

  // Additional service details
  const [tshulDetails, setTshulDetails] = useState<any>(null)
  const [nettvDetails, setNettvDetails] = useState<any>(null)
  const [tshulMessage, setTshulMessage] = useState("")
  const [nettvMessage, setNettvMessage] = useState("")
  const [loadingTshul, setLoadingTshul] = useState(false)
  const [loadingNettv, setLoadingNettv] = useState(false)

  // Modal states
  const [changeUsernameOpen, setChangeUsernameOpen] = useState(false)
  const [changePackageOpen, setChangePackageOpen] = useState(false)
  const [resetMacOpen, setResetMacOpen] = useState(false)
  const [renewPackageOpen, setRenewPackageOpen] = useState(false)
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false)
  const [returnHardwareOpen, setReturnHardwareOpen] = useState(false)
  const [editDeviceOpen, setEditDeviceOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<any | null>(null)
  const [deleteDeviceOpen, setDeleteDeviceOpen] = useState(false)
  const [deletingDevice, setDeletingDevice] = useState<any | null>(null)

  // Form states
  const [newUsername, setNewUsername] = useState("")
  const [selectedConnectionUser, setSelectedConnectionUser] = useState("")
  const [selectedPackage, setSelectedPackage] = useState("")
  const [newMacAddress, setNewMacAddress] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [renewLoading, setRenewLoading] = useState(false)
  const [assignHardwareOpen, setAssignHardwareOpen] = useState(false)
  const [hardwareSearch, setHardwareSearch] = useState("")
  const [availableStock, setAvailableStock] = useState<any[]>([])
  const [selectedHardwareId, setSelectedHardwareId] = useState<number | null>(null)
  const [returnHardwareItem, setReturnHardwareItem] = useState<any | null>(null)
  const [voipEnabled, setVoipEnabled] = useState(false)

  // ========== Radius Login Details ==========
  const [radiusAuthLogs, setRadiusAuthLogs] = useState<any[]>([])
  const [radiusAuthLoading, setRadiusAuthLoading] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({})

  // ========== Portal Password Dialog States ==========
  const [portalPasswordOpen, setPortalPasswordOpen] = useState(false)
  const [newPortalEmail, setNewPortalEmail] = useState("")
  const [newPortalPassword, setNewPortalPassword] = useState("")
  const [portalPasswordSubmitting, setPortalPasswordSubmitting] = useState(false)
  const [showPortalPassword, setShowPortalPassword] = useState(false)
  const [radiusPasswordOpen, setRadiusPasswordOpen] = useState(false)
  const [radiusPasswordUser, setRadiusPasswordUser] = useState<{ id: number; username: string } | null>(null)
  const [newRadiusPassword, setNewRadiusPassword] = useState("")
  const [radiusPasswordSubmitting, setRadiusPasswordSubmitting] = useState(false)

  const getFallbackPortalEmail = useCallback((cust: Customer | null) => {
    if (!cust) return ""
    if (cust.email) {
      const email = cust.email.trim().replace(/\s+/g, '').toLowerCase()
      if (email.includes('@')) {
        return email
      }
    }
    const username = String(cust.customerUniqueId || `customer-${cust.id}`).trim().replace(/\s+/g, '').toLowerCase()
    return `${username}@customer.local`
  }, [])


  // ========== Hardware Dialog Steps ==========
  const [hwDialogStep, setHwDialogStep] = useState<1 | 2>(1)
  const [selectedDeviceType, setSelectedDeviceType] = useState<"ONT" | "STB" | "ONU" | "Router" | "Other">("ONT")

  // ========== Fiber Provisioning State (for Add Hardware) ==========
  const [olts, setOlts] = useState<OLT[]>([])
  const [splitters, setSplitters] = useState<Splitter[]>([])
  const [loadingOlts, setLoadingOlts] = useState(false)
  const [loadingSplitters, setLoadingSplitters] = useState(false)
  const [hwProvisionDetails, setHwProvisionDetails] = useState({
    useSplitter: true,
    useDirectOLT: false,
    oltId: "",
    splitterId: "",
    splitterPort: "",
    oltPort: "",
    selectedVlanIds: [] as string[],
    selectedProfileIds: [] as string[],
  })
  const [hwDevices, setHwDevices] = useState<CustomerDevice[]>([])
  const [hwDeviceDialogOpen, setHwDeviceDialogOpen] = useState(false)
  const [hwEditingDeviceIndex, setHwEditingDeviceIndex] = useState<number | null>(null)
  const [discoveredOnts, setDiscoveredOnts] = useState<any[]>([])
  const [selectedDiscoveredOnt, setSelectedDiscoveredOnt] = useState<any | null>(null)
  const [matchedDeviceForOnt, setMatchedDeviceForOnt] = useState<CustomerDevice | null>(null)
  const [isAutoFinding, setIsAutoFinding] = useState(false)
  const [autoFindError, setAutoFindError] = useState<string | null>(null)
  const [hwProvisionLoading, setHwProvisionLoading] = useState(false)

  const hasOntDevices = hwDevices.some(d => d.deviceType === "ONT")
  const hasPendingOnt = hwDevices.some(d => d.deviceType === "ONT" && d.provisioningStatus !== "active")
  const isAlreadyProvisioned = hasOntDevices && !hasPendingOnt

  // ========== OLT/Splitter helpers ==========
  const findUltimateOltForSplitter = useCallback((splitterId: string): OLT | null => {
    if (!splitterId) return null
    const findRoot = (sId: string): Splitter | null => {
      const splitter = splitters.find(s => s.id.toString() === sId)
      if (!splitter) return null
      if (!splitter.masterSplitterId) return splitter
      const parent = splitters.find(s => s.splitterId === splitter.masterSplitterId)
      if (!parent) return splitter
      return findRoot(parent.id.toString())
    }
    const rootSplitter = findRoot(splitterId)
    if (!rootSplitter?.connectedServiceBoard) return null
    return olts.find(o => o.id.toString() === rootSplitter.connectedServiceBoard?.oltId) || null
  }, [splitters, olts])

  const getSplitterPath = useCallback((splitterId: string): Splitter[] => {
    const path: Splitter[] = []
    let current = splitters.find(s => s.id.toString() === splitterId)
    while (current) {
      path.unshift(current)
      if (!current.masterSplitterId) break
      const parent = splitters.find(s => s.splitterId === current!.masterSplitterId)
      if (!parent) break
      current = parent
    }
    return path
  }, [splitters])

  const handleHwProvisionChange = (field: string, value: any) => {
    setHwProvisionDetails(prev => ({ ...prev, [field]: value }))
  }

  const fetchOltsAndSplitters = useCallback(async () => {
    setLoadingOlts(true)
    setLoadingSplitters(true)
    try {
      const [oltData, splitterData] = await Promise.all([
        apiRequest<any>("/olt?limit=1000"),
        apiRequest<any>("/splitters?limit=1000"),
      ])
      setOlts(Array.isArray(oltData?.data) ? oltData.data : [])
      setSplitters(Array.isArray(splitterData?.data) ? splitterData.data : [])
    } catch (e) {
      console.error("Failed to load OLTs/splitters", e)
    } finally {
      setLoadingOlts(false)
      setLoadingSplitters(false)
    }
  }, [])

  useEffect(() => {
    if (assignHardwareOpen) {
      fetchOltsAndSplitters()
      const sd = customer?.serviceDetails?.[0]
      if (sd) {
        let selectedVlanIds: string[] = []
        if (sd.vlanId) {
          selectedVlanIds = sd.vlanId.split(',').filter(Boolean)
        }
        setHwProvisionDetails({
          useSplitter: !!sd.splitterId,
          useDirectOLT: !sd.splitterId,
          oltId: sd.oltId?.toString() || "",
          splitterId: sd.splitterId?.toString() || "",
          splitterPort: sd.splitterPort || "",
          oltPort: sd.oltPort || "",
          selectedVlanIds,
          selectedProfileIds: [],
        })
      } else {
        setHwProvisionDetails({
          useSplitter: true,
          useDirectOLT: false,
          oltId: "",
          splitterId: "",
          splitterPort: "",
          oltPort: "",
          selectedVlanIds: [],
          selectedProfileIds: [],
        })
      }
      const mappedDevices: CustomerDevice[] = (customer?.devices || []).map((dev) => ({
        id: dev.id,
        deviceType: dev.deviceType,
        brand: dev.brand,
        model: dev.model,
        serialNumber: dev.serialNumber,
        macAddress: dev.macAddress,
        ponSerial: dev.ponSerial || undefined,
        notes: dev.notes || "",
        provisioningStatus: dev.provisioningStatus || "pending",
      }))
      setHwDevices(mappedDevices)
      setSelectedDiscoveredOnt(null)
      setMatchedDeviceForOnt(null)
      setAutoFindError(null)
    } else {
      setHwDevices([])
      setHwProvisionDetails({
        useSplitter: true,
        useDirectOLT: false,
        oltId: "",
        splitterId: "",
        splitterPort: "",
        oltPort: "",
        selectedVlanIds: [],
        selectedProfileIds: [],
      })
      setSelectedDiscoveredOnt(null)
      setMatchedDeviceForOnt(null)
      setAutoFindError(null)
      setDiscoveredOnts([])
    }
  }, [assignHardwareOpen, customer, fetchOltsAndSplitters])

  const openDeviceDialogForEdit = useCallback((index: number) => {
    setHwEditingDeviceIndex(index)
    setHwDeviceDialogOpen(true)
  }, [])

  const removeDevice = useCallback((index: number) => {
    setHwDevices(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleDeviceSave = useCallback((device: CustomerDevice) => {
    if (hwEditingDeviceIndex !== null) {
      setHwDevices(prev => {
        const updated = [...prev]
        updated[hwEditingDeviceIndex] = device
        return updated
      })
      setHwEditingDeviceIndex(null)
    } else {
      setHwDevices(prev => [...prev, device])
    }
  }, [hwEditingDeviceIndex])

  // Helper to convert a serial (e.g., "ALCLB2C804B0") to hex format ("414C434CB2C804B0")
  const convertToPonHex = useCallback((serial: string): string => {
    if (!serial) return ""
    // If it's already all hex digits, return as is (upper case)
    if (/^[0-9A-Fa-f]+$/.test(serial)) return serial.toUpperCase()
    // First 4 chars are vendor ID, convert each to hex ASCII
    const vendor = serial.slice(0, 4)
    const rest = serial.slice(4)
    const hexVendor = vendor.split('').map(ch => ch.charCodeAt(0).toString(16).toUpperCase()).join('')
    return hexVendor + rest.toUpperCase()
  }, [])

  // Helper to get serial for OLT registration
  const getOntSerialForRegistration = useCallback((device: CustomerDevice, isEpon: boolean): string => {
    if (isEpon) {
      // EPON: use MAC address without dots
      return device.macAddress
    } else {
      // GPON: use ponSerial if available, else convert serialNumber to hex
      return device.ponSerial ? convertToPonHex(device.ponSerial) : convertToPonHex(device.serialNumber)
    }
  }, [convertToPonHex])

  // OLT Provisioning function
  const registerOntOnOlt = useCallback(async (): Promise<boolean> => {
    if (!hwProvisionDetails.oltId) {
      toast({ title: "No OLT selected", variant: "destructive" })
      return false
    }
    if (!matchedDeviceForOnt || !selectedDiscoveredOnt) {
      toast({ title: "No matched ONT device", variant: "destructive" })
      return false
    }

    const selectedOlt = olts.find(o => o.id.toString() === hwProvisionDetails.oltId)
    if (!selectedOlt) {
      toast({ title: "Please select a valid OLT", variant: "destructive" })
      return false
    }

    let boardPortStr = hwProvisionDetails.oltPort || ""
    let boardType = selectedOlt.serviceBoards?.[0]?.type

    if (hwProvisionDetails.useSplitter) {
      const ultimateOlt = findUltimateOltForSplitter(hwProvisionDetails.splitterId)
      if (!ultimateOlt) {
        toast({ title: "Could not determine OLT from selected splitter", variant: "destructive" })
        return false
      }

      const path = getSplitterPath(hwProvisionDetails.splitterId)
      const lastSplitter = path[path.length - 1]
      boardPortStr = lastSplitter?.connectedServiceBoard?.boardPort || ""
      const selectedSplitter = splitters.find(s => s.id.toString() === hwProvisionDetails.splitterId)
      boardType = selectedSplitter?.connectedServiceBoard?.boardType || ultimateOlt.serviceBoards?.[0]?.type
    }

    // boardPortStr format like "0/0/1"
    const [frame, slot, port] = boardPortStr.split('/').map(Number)
    if ([frame, slot, port].some(part => Number.isNaN(part) || part === undefined)) {
      toast({ title: "Invalid OLT port format. Use frame/slot/port, for example 0/0/1.", variant: "destructive" })
      return false
    }

    // Determine board type
    const isEpon = !!boardType?.toUpperCase().includes("EPON")

    // Build serial
    const serial = getOntSerialForRegistration(matchedDeviceForOnt, isEpon)
    if (!serial) {
      toast({ title: "No serial/MAC available for ONT", variant: "destructive" })
      return false
    }

    // Get VLANs
    const vlans = hwProvisionDetails.selectedVlanIds
      .map(vlanId => {
        const vlan = selectedOlt?.vlans?.find(v => v.id.toString() === vlanId.toString())
        if (!vlan) return null
        return {
          vlan: vlan.vlanId,
          gemport: vlan.gemIndex || 1, // fallback if gemIndex missing
        }
      })
      .filter(Boolean)

    // Get profiles (line_profile_id and service_profile_id)
    const profiles = selectedOlt?.profiles?.filter(p => hwProvisionDetails.selectedProfileIds.includes(p.id.toString())) || []
    const lineProfile = profiles.find(p => p.type === "line" || p.type === "LINE")
    const serviceProfile = profiles.find(p => p.type === "service" || p.type === "SERVICE")
    const lineProfileId = lineProfile ? (lineProfile.profileId || lineProfile.id) : null
    const serviceProfileId = serviceProfile ? (serviceProfile.profileId || serviceProfile.id) : null
    if (!isEpon) {
      if (!lineProfileId || !serviceProfileId) {
        toast({ title: "Please select both line and service profiles", variant: "destructive" })
        return false
      }
    }

    const payload = {
      action: "registerONT",
      params: {
        frame,
        slot,
        port,
        serial,
        line_profile_id: lineProfileId,
        service_profile_id: serviceProfileId,
        description: `${customer?.firstName || "Customer"}_${customer?.lastName || ""}_${customer?.street || ""}`.replace(/\s+/g, '_'),
        vlans,
      },
    }

    try {
      const response = await apiRequest<any>(`/device/${hwProvisionDetails.oltId}/action`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      })
      if (response?.success) {
        toast({ title: "ONT registered on OLT successfully" })
        return true
      } else {
        toast({ title: "ONT registration failed", description: response?.error || "Failed to register ONT", variant: "destructive" })
        return false
      }
    } catch (error: any) {
      toast({ title: "ONT registration error", description: error?.message || "Error", variant: "destructive" })
      return false
    }
  }, [hwProvisionDetails, matchedDeviceForOnt, selectedDiscoveredOnt, findUltimateOltForSplitter, getSplitterPath, splitters, olts, customer, getOntSerialForRegistration])

  const handleAutoFindOnt = useCallback(async () => {
    if (!hwProvisionDetails.oltId) {
      toast({ title: "Please select an OLT first", variant: "destructive" })
      return
    }

    let frame: number, slot: number, port: number

    if (hwProvisionDetails.useSplitter) {
      if (!hwProvisionDetails.splitterId) {
        toast({ title: "Please select a splitter first", variant: "destructive" })
        return
      }

      const selectedSplitter = splitters.find(s => s.id.toString() === hwProvisionDetails.splitterId)
      const ultimateOlt = findUltimateOltForSplitter(hwProvisionDetails.splitterId)
      const path = getSplitterPath(hwProvisionDetails.splitterId)
      const lastSplitter = path[path.length - 1]
      const boardPortStr = lastSplitter?.connectedServiceBoard?.boardPort || ""

      if (!boardPortStr) {
        toast({ title: "Unable to determine board port from splitter", variant: "destructive" })
        return
      }

      const parts = boardPortStr.split('/').map(Number)
      if (parts.length !== 3 || parts.some(isNaN)) {
        toast({ title: `Invalid board port format from splitter: ${boardPortStr}`, variant: "destructive" })
        return
      }
      [frame, slot, port] = parts
    } else {
      // Direct OLT mode
      if (!hwProvisionDetails.oltPort) {
        toast({ title: "Please enter the OLT port (frame/slot/port) for direct connection", variant: "destructive" })
        return
      }
      const parts = hwProvisionDetails.oltPort.split('/').map(Number)
      if (parts.length !== 3 || parts.some(isNaN)) {
        toast({ title: "OLT port must be in format frame/slot/port (e.g., 0/0/1)", variant: "destructive" })
        return
      }
      [frame, slot, port] = parts
    }

    setIsAutoFinding(true)
    setAutoFindError(null)
    setDiscoveredOnts([])
    setSelectedDiscoveredOnt(null)
    setMatchedDeviceForOnt(null)

    try {
      const response = await apiRequest<any>(`/device/${hwProvisionDetails.oltId}/action`, {
        method: "POST",
        body: JSON.stringify({
          action: "autofind",
          params: [frame, slot, port],
        }),
        headers: { "Content-Type": "application/json" },
      })

      if (response?.success && response.data) {
        setDiscoveredOnts(response.data)
      } else {
        setAutoFindError(response?.error || "Failed to discover ONTs")
      }
    } catch (error: any) {
      setAutoFindError(error?.message || "Error during autofind")
    } finally {
      setIsAutoFinding(false)
    }
  }, [hwProvisionDetails, splitters, findUltimateOltForSplitter, getSplitterPath, toast])

  const handleSelectDiscoveredOnt = useCallback((ontId: string) => {
    const ont = discoveredOnts.find(o => o.ont_id_details === ontId)
    setSelectedDiscoveredOnt(ont || null)

    if (!ont) {
      setMatchedDeviceForOnt(null)
      return
    }

    if (!hwDevices.length) {
      setMatchedDeviceForOnt(null)
      toast({ title: "No devices added. Please add a device first.", variant: "destructive" })
      return
    }

    const selectedSplitter = splitters.find(s => s.id.toString() === hwProvisionDetails.splitterId)
    const ultimateOlt = findUltimateOltForSplitter(hwProvisionDetails.splitterId)
    const boardType = selectedSplitter?.connectedServiceBoard?.boardType || ultimateOlt?.serviceBoards?.[0]?.type
    const isEpon = boardType?.toUpperCase().includes("EPON")

    const ontIdentifier = ont.ont_id_details  // e.g., "414C434CB2C804B0" for GPON
    const normalizedOnt = normalizeIdentifier(ontIdentifier)

    // Try to match with any added ONT device
    for (const device of hwDevices) {
      if (device.deviceType !== "ONT") continue

      const candidateIdentifiers = [
        device.macAddress,
        device.serialNumber,
        device.ponSerial,
        convertToPonHex(device.serialNumber || ""),
        convertToPonHex(device.ponSerial || ""),
      ]
        .map(normalizeIdentifier)
        .filter(Boolean)

      if (candidateIdentifiers.includes(normalizedOnt)) {
        setMatchedDeviceForOnt(device)
        setSelectedDiscoveredOnt((prev: any) => prev ? ({ ...prev, ont_id: ont.ont_id }) : null)
        toast({ title: `Matched with device: ${device.brand} ${device.model}` })
        return
      }

      if (isEpon) {
        // EPON: match by MAC
        const normalizedMac = normalizeIdentifier(device.macAddress)
        if (normalizedMac && normalizedMac === normalizedOnt) {
          setMatchedDeviceForOnt(device)
          setSelectedDiscoveredOnt((prev: any) => prev ? ({ ...prev, ont_id: ont.ont_id }) : null)
          toast({ title: `Matched with device: ${device.brand} ${device.model}` })
          return
        }
      } else {
        // GPON: match by serialNumber or ponSerial after converting to hex
        const deviceSerialHex = convertToPonHex(device.serialNumber || "")
        const devicePonHex = convertToPonHex(device.ponSerial || "")
        if ((devicePonHex && devicePonHex === ontIdentifier) || (deviceSerialHex && deviceSerialHex === ontIdentifier)) {
          setMatchedDeviceForOnt(device)
          setSelectedDiscoveredOnt((prev: any) => prev ? ({ ...prev, ont_id: ont.ont_id }) : null)
          toast({ title: `Matched with device: ${device.brand} ${device.model}` })
          return
        }
      }
    }

    // No match found
    setMatchedDeviceForOnt(null)
    toast({ title: "No matching device found", variant: "destructive" })
  }, [hwDevices, hwProvisionDetails.splitterId, splitters, findUltimateOltForSplitter, discoveredOnts, convertToPonHex, toast])

  const handleHwProvisionSave = async () => {
    if (!customer) return
    setHwProvisionLoading(true)
    try {
      const selectedOlt = olts.find(o => o.id.toString() === hwProvisionDetails.oltId)
      const ultimateOlt = hwProvisionDetails.useSplitter
        ? findUltimateOltForSplitter(hwProvisionDetails.splitterId)
        : selectedOlt

      // Step 1: Register ONT on OLT (if fiber, and discovery/matching is set)
      if (selectedDiscoveredOnt && matchedDeviceForOnt) {
        const ontRegistered = await registerOntOnOlt()
        if (!ontRegistered) {
          setHwProvisionLoading(false)
          return
        }
      }

      // Step 2: Save connection details to customer
      // vlanId field needs to be a comma-separated string of the selected VLAN IDs (database IDs)
      const vlanIdStr = hwProvisionDetails.selectedVlanIds.join(',')

      await apiRequest(`/customer/${customer.id}`, {
        method: "PUT",
        body: JSON.stringify({
          connectionType: "fiber",
          oltId: ultimateOlt?.id || hwProvisionDetails.oltId ? Number(ultimateOlt?.id || hwProvisionDetails.oltId) : null,
          splitterId: hwProvisionDetails.splitterId ? Number(hwProvisionDetails.splitterId) : null,
          oltPort: hwProvisionDetails.oltPort || null,
          splitterPort: hwProvisionDetails.splitterPort || null,
          vlanId: vlanIdStr,
        }),
        headers: { "Content-Type": "application/json" },
      })

      // Step 3: Assign new devices to customer
      const newDevices = hwDevices.filter(d => !d.id && d.inventoryItemId)
      for (const dev of newDevices) {
        await apiRequest(`/inventory/${dev.inventoryItemId}/assign`, {
          method: "PUT",
          body: JSON.stringify({ customerId: customer.id })
        })
      }

      // Step 3.5: Activate ONT Devices in database
      // Fetch fresh customer details to get IDs of newly assigned devices
      const freshData = await apiRequest<any>(`/customer/${customer.id}`)
      if (freshData) {
        const freshDevices = freshData.devices || []
        const ontDevicesToActivate = freshDevices.filter((d: any) => d.deviceType === "ONT" && d.provisioningStatus !== "active")
        for (const dev of ontDevicesToActivate) {
          await apiRequest(`/customer/${customer.id}/devices/${dev.id}`, {
            method: "PUT",
            body: JSON.stringify({ provisioningStatus: "active" }),
            headers: { "Content-Type": "application/json" }
          })
        }
      }

      toast({ title: "Fiber provisioning saved successfully" })
      setAssignHardwareOpen(false)
      fetchCustomerData()
    } catch (e: any) {
      toast({ title: "Error saving provision", description: e?.message, variant: "destructive" })
    } finally {
      setHwProvisionLoading(false)
    }
  }

  const handleOutboundCall = async (phoneNumber?: string | null) => {
    if (!voipEnabled) {
      toast({ title: "Calling is disabled because no VOIP service is enabled", variant: "destructive" })
      return
    }
    if (!phoneNumber) {
      toast({ title: "Phone number is not available", variant: "destructive" })
      return
    }
    const extension = String(user?.yeastarExt || user?.extId || "").trim()
    if (!extension) {
      toast({ title: "No VoIP extension is assigned to your user account", variant: "destructive" })
      return
    }

    try {
      await apiRequest(`/yeaster/calls/make`, {
        method: "POST",
        body: JSON.stringify({
          extension,
          caller: extension,
          callee: phoneNumber,
          number: phoneNumber,
          autoanswer: "yes",
        })
      })
      toast({ title: `Calling ${phoneNumber}` })
    } catch (error: any) {
      const message = String(error?.message || "")
      toast({
        title: /yeastar|yeaster|asterisk|voip|configured|enabled/i.test(message) ? "Calling is disabled because no VOIP service is enabled" : "Failed to initiate call",
        description: /yeastar|yeaster|asterisk|voip|configured|enabled/i.test(message) ? undefined : message,
        variant: "destructive"
      })
    }
  }

  const fetchVoipStatus = useCallback(async () => {
    const [yeastar, asterisk] = await Promise.all([
      apiRequest<any>("/services/isp/status/YEASTAR", { suppressToast: true }).catch(() => null),
      apiRequest<any>("/services/isp/status/ASTERISK", { suppressToast: true }).catch(() => null),
    ])
    const statuses = [yeastar?.data, asterisk?.data]
    setVoipEnabled(statuses.some((status) => status?.enabled === true && status?.configured === true))
  }, [])

  useEffect(() => {
    fetchVoipStatus()
  }, [fetchVoipStatus])
  const [stockLoading, setStockLoading] = useState(false)

  const fetchAvailableStock = async () => {
    setStockLoading(true)
    try {
      const params = new URLSearchParams()
      if (hardwareSearch) params.set("search", hardwareSearch)
      if (!hardwareSearch && customer?.branchId) params.set("branchId", customer.branchId.toString())
      const queryString = params.toString()
      const data = await apiRequest<any>(`/inventory${queryString ? `?${queryString}` : ""}`)
      const rows = Array.isArray(data) ? data : (data?.data || [])
      const assignableStatuses = new Set(["IN_STOCK", "ASSIGNED_TO_BRANCH", "ASSIGNED_TO_USER", "ASSIGNED_TO_ROLE", "RETURNED"])
      setAvailableStock(rows.filter((item: any) => assignableStatuses.has(item.status) && !item.customerId && (item.availableQty ?? 1) > 0))
    } catch (e) {
      console.error(e)
    } finally {
      setStockLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (assignHardwareOpen) fetchAvailableStock()
    }, 300)
    return () => clearTimeout(timer)
  }, [assignHardwareOpen, hardwareSearch, customer?.branchId])

  const handleAssignHardware = async () => {
    if (!selectedHardwareId) return;
    setActionLoading(true)
    try {
      await apiRequest(`/inventory/${selectedHardwareId}/assign`, {
        method: "POST",
        body: JSON.stringify({ customerId: customer?.id })
      })
      toast({ title: "Hardware assigned successfully" })
      setAssignHardwareOpen(false)
      setSelectedHardwareId(null)
      fetchCustomerData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const params = useParams()
  const router = useRouter()
  const customerId = customerIdProp || (params.id as string)

  const [networkSettings, setNetworkSettings] = useState({
    dnd: false,
    autoRenew: true,
    dontSuspend: false,
    excludeMACBind: false,
    bindMAC: true,
    bindIP: true,
    bindNASPORT: false,
  })

  const fetchCustomerData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest<Customer>(`/customer/${customerId}`)
      if (data) {
        setCustomer(data)
        if (data.connectionUsers.length > 0) {
          setSelectedConnectionUser(data.connectionUsers[0].id.toString())
        }
        const currentMac = data.devices?.[0]?.macAddress || ""
        setNewMacAddress(currentMac)
      } else {
        setError("Customer not found")
        toast({ title: "Error", description: "Customer not found", variant: "destructive" })
      }
    } catch (error: any) {
      console.error("Error fetching customer:", error)
      setError(error.message || "Failed to fetch customer data")
      toast({ title: "Error", description: "Failed to load customer data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (customerId) fetchCustomerData()
  }, [customerId])

  // ========== Fetch Radius Auth Logs ==========
  const fetchRadiusAuthLogs = useCallback(async () => {
    if (!customerId) return
    setRadiusAuthLoading(true)
    try {
      const data = await apiRequest<{ success: boolean; data: any[]; message?: string }>(`/customer/${customerId}/radius/auth-logs`)
      if (data?.success && data.data) {
        setRadiusAuthLogs(data.data)
      } else {
        setRadiusAuthLogs([])
      }
    } catch (error) {
      console.error("Error fetching radius auth logs:", error)
      setRadiusAuthLogs([])
    } finally {
      setRadiusAuthLoading(false)
    }
  }, [customerId])

  const handleChangePortalPassword = async () => {
    const isEditing = !!customer?.portalUser;
    if (!isEditing && (!newPortalPassword.trim() || newPortalPassword.length < 4)) {
      toast({ title: "Validation Error", description: "Password must be at least 4 characters", variant: "destructive" });
      return;
    }
    if (newPortalPassword.trim() && newPortalPassword.length < 4) {
      toast({ title: "Validation Error", description: "Password must be at least 4 characters", variant: "destructive" });
      return;
    }
    if (!newPortalEmail.trim() || !newPortalEmail.includes("@")) {
      toast({ title: "Validation Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    setPortalPasswordSubmitting(true);
    try {
      await apiRequest(`/customer/${customerId}/portal-password`, {
        method: "PUT",
        body: JSON.stringify({ 
          email: newPortalEmail.trim(), 
          newPassword: newPortalPassword.trim() || undefined 
        })
      });
      toast({ title: "Success", description: isEditing ? "Portal credentials updated successfully" : "Portal account created successfully" });
      setPortalPasswordOpen(false);
      setNewPortalPassword("");
      fetchCustomerData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update portal account", variant: "destructive" });
    } finally {
      setPortalPasswordSubmitting(false);
    }
  };

  const openRadiusPasswordDialog = (connectionUser: { id: number; username: string }) => {
    setRadiusPasswordUser({ id: connectionUser.id, username: connectionUser.username })
    setNewRadiusPassword("")
    setRadiusPasswordOpen(true)
  }

  const handleChangeRadiusPassword = async () => {
    if (!radiusPasswordUser) return
    if (!newRadiusPassword.trim() || newRadiusPassword.length < 4) {
      toast({ title: "Validation Error", description: "Password must be at least 4 characters", variant: "destructive" })
      return
    }
    setRadiusPasswordSubmitting(true)
    try {
      const response = await apiRequest<any>(`/customer/${customerId}/connection-users/${radiusPasswordUser.id}/password`, {
        method: "PUT",
        body: JSON.stringify({ newPassword: newRadiusPassword })
      })
      toast({
        title: "Success",
        description: response?.data?.radiusUpdated === false
          ? "Local password updated. Radius update failed or is unavailable."
          : "Radius / PPPoE password updated successfully"
      })
      setRadiusPasswordOpen(false)
      setRadiusPasswordUser(null)
      setNewRadiusPassword("")
      fetchCustomerData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update Radius password", variant: "destructive" })
    } finally {
      setRadiusPasswordSubmitting(false)
    }
  }

  useEffect(() => {
    if (activeTab === "radius" && customerId) {
      fetchRadiusAuthLogs()
    }
  }, [activeTab, customerId, fetchRadiusAuthLogs])

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await apiRequest<PackageOption[]>('/package-price')
        if (data) {
          setPackages(data)
          if (data.length > 0 && customer) {
            setSelectedPackage(customer.subscribedPkgId.toString())
          }
        }
      } catch (error) {
        console.error("Error fetching packages:", error)
      }
    }
    if (customer) fetchPackages()
  }, [customer])

  useEffect(() => {
    if (customer?.customerUniqueId) {
      const fetchTshul = async () => {
        setLoadingTshul(true)
        try {
          const res = await apiRequest(`/services/tshul/customers/${customer.customerUniqueId}`)
          if (res.configured === false) {
            setTshulDetails(null)
            setTshulMessage(res.message || "TSHUL service is not configured.")
          } else if (res.success) {
            setTshulDetails(res.data)
            setTshulMessage("")
          }
        } catch (error: any) {
          setTshulDetails(null)
          setTshulMessage(error.message || "TSHUL service is not configured.")
        } finally {
          setLoadingTshul(false)
        }
      }
      fetchTshul()
    }
  }, [customer?.customerUniqueId])

  useEffect(() => {
    if (customer?.customerUniqueId) {
      const fetchNettv = async () => {
        setLoadingNettv(true)
        try {
          const res = await apiRequest(`/services/nettv/subscribers/${customer.customerUniqueId}`)
          if (res.configured === false) {
            setNettvDetails(null)
            setNettvMessage(res.message || "NetTV service is not configured.")
          } else if (res.success) {
            setNettvDetails(res.data)
            setNettvMessage("")
          }
        } catch (error: any) {
          setNettvDetails(null)
          setNettvMessage(error.message || "NetTV service is not configured.")
        } finally {
          setLoadingNettv(false)
        }
      }
      fetchNettv()
    }
  }, [customer?.customerUniqueId])

  const toggleSetting = (setting: keyof typeof networkSettings) => {
    setNetworkSettings((prev) => ({ ...prev, [setting]: !prev[setting] }))
    toast({ title: "Setting updated", description: `${setting} has been ${!networkSettings[setting] ? "enabled" : "disabled"}.` })
  }

  const handleChangeUsername = async () => {
    if (!newUsername.trim() || !selectedConnectionUser) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setActionLoading(true)
      const response = await apiRequest(`/customer/${customerId}/username`, {
        method: 'PUT',
        body: JSON.stringify({
          connectionUserId: parseInt(selectedConnectionUser),
          newUsername: newUsername.trim()
        })
      })

      toast({
        title: "Success",
        description: response.message || "Username changed successfully",
      })

      const updatedCustomer = await apiRequest<Customer>(`/customer/${customerId}`)
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
      }

      setChangeUsernameOpen(false)
      setNewUsername("")
    } catch (error: any) {
      console.error("Error changing username:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to change username",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangePackage = async () => {
    if (!selectedPackage) {
      toast({
        title: "Error",
        description: "Please select a package",
        variant: "destructive",
      })
      return
    }

    try {
      setActionLoading(true)
      const response = await apiRequest(`/customer/${customerId}/package`, {
        method: 'PUT',
        body: JSON.stringify({
          newPackageId: parseInt(selectedPackage)
        })
      })

      toast({
        title: "Success",
        description: response.message || "Package changed successfully",
      })

      const updatedCustomer = await apiRequest<Customer>(`/customer/${customerId}`)
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
      }

      setChangePackageOpen(false)
    } catch (error: any) {
      console.error("Error changing package:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to change package",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetMac = async () => {
    if (!newMacAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a MAC address",
        variant: "destructive",
      })
      return
    }

    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(newMacAddress.trim())) {
      toast({
        title: "Error",
        description: "Invalid MAC address format. Use format like: 00:1A:2B:3C:4D:5E",
        variant: "destructive",
      })
      return
    }

    try {
      setActionLoading(true)
      const response = await apiRequest(`/customer/${customerId}/mac`, {
        method: 'PUT',
        body: JSON.stringify({
          newMacAddress: newMacAddress.trim()
        })
      })

      toast({
        title: "Success",
        description: response.message || "MAC address reset successfully",
      })

      const updatedCustomer = await apiRequest<Customer>(`/customer/${customerId}`)
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
        setNewMacAddress(updatedCustomer.devices?.[0]?.macAddress || "")
      }

      setResetMacOpen(false)
    } catch (error: any) {
      console.error("Error resetting MAC:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to reset MAC address",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRenewPackage = async () => {
    try {
      setRenewLoading(true)

      const response = await apiRequest("/customer/subscribe", {
        method: 'POST',
        body: JSON.stringify({ customerId: parseInt(customerId), createOrder: true }),
        headers: {
          'Content-Type': 'application/json',
        }
      })

      toast({
        title: "Success",
        description: "Package renewed successfully",
      })

      const updatedCustomer = await apiRequest<Customer>(`/customer/${customerId}`)
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
      }

      setRenewPackageOpen(false)
    } catch (error: any) {
      console.error("Error renewing package:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to renew package",
        variant: "destructive",
      })
    } finally {
      setRenewLoading(false)
    }
  }

  const handleDeleteCustomer = async () => {
    setDeleteCustomerOpen(true)
  }

  const confirmDeleteCustomer = async () => {
    try {
      setActionLoading(true)
      await apiRequest(`/customer/${customerId}`, {
        method: 'DELETE',
      })

      toast({
        title: "Success",
        description: "Customer deleted successfully",
      })

      router.push('/customers')
    } catch (error: any) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const deleteOntFromOlt = async (serialNumber: string) => {
    if (!serialNumber) return;
    const oltId = customer?.serviceDetails?.[0]?.oltId || customer?.oltId;
    if (!oltId) {
      console.log("No OLT ID associated with customer for ONT deletion.");
      return;
    }
    
    try {
      console.log(`[OLT_DELETE] Fetching ONT details for serial ${serialNumber} from OLT ${oltId}`);
      const res = await apiRequest<any>(`/olt/${oltId}/onts?search=${encodeURIComponent(serialNumber)}`);
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const ont = res.data[0];
        const fsp = ont.servicePort || ""; 
        const ontIdVal = ont.ontId;
        const servicePorts = ont.ontDetails?.servicePorts;

        // Parse FSP (frame/slot/port)
        const fspParts = fsp ? fsp.split('/') : [];
        const frame = fspParts.length > 0 ? parseInt(fspParts[0], 10) : 0;
        const slot = fspParts.length > 1 ? parseInt(fspParts[1], 10) : 0;
        const port = fspParts.length > 2 ? parseInt(fspParts[2], 10) : 0;
        const ont_id = parseInt(ontIdVal, 10);

        if (isNaN(slot) || isNaN(port) || isNaN(ont_id)) {
          console.warn("[OLT_DELETE] Invalid slot, port, or ont_id parsed from fsp:", fsp, "ontId:", ontIdVal);
          return;
        }

        let service_port_indices: number[] = [];
        if (servicePorts) {
          try {
            const ports = typeof servicePorts === 'string'
              ? JSON.parse(servicePorts)
              : servicePorts;
            if (Array.isArray(ports)) {
              service_port_indices = ports
                .map((sp: any) => sp.index)
                .filter((v: any) => v !== undefined && v !== null && !isNaN(v));
            }
          } catch (e) {
            console.error("[OLT_DELETE] Error parsing service ports:", e);
          }
        }

        const payload = {
          action: "deleteOnt",
          params: {
            frame,
            slot,
            port,
            ont_id,
            serial: serialNumber,
            service_port_indices
          }
        };

        console.log(`[OLT_DELETE] Sending deleteOnt action to /device/${oltId}/action`, payload);
        const actionRes = await apiRequest<any>(`/device/${oltId}/action`, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" }
        });

        if (actionRes?.success) {
          toast({ title: "ONT deleted from OLT successfully" });
        } else {
          toast({
            title: "Warning",
            description: actionRes?.error || "ONT deletion from OLT returned failure status.",
            variant: "destructive"
          });
        }
      } else {
        console.log(`[OLT_DELETE] No ONT details found in DB for serial ${serialNumber}`);
      }
    } catch (err: any) {
      console.error("[OLT_DELETE] Failed to delete ONT from OLT:", err);
      toast({
        title: "Error removing ONT from OLT",
        description: err.message || "Failed to communicate with OLT",
        variant: "destructive"
      });
    }
  };

  const confirmReturnHardware = async (note: string, isFaulty: boolean) => {
    if (!returnHardwareItem) return
    try {
      setActionLoading(true)
      const isOnt = returnHardwareItem.type === 'ONT' || returnHardwareItem.deviceType === 'ONT';
      if (isOnt && returnHardwareItem.serialNumber) {
        await deleteOntFromOlt(returnHardwareItem.serialNumber);
      }
      await apiRequest(`/inventory/${returnHardwareItem.id}/return`, {
        method: "PUT",
        body: JSON.stringify({
          status: isFaulty ? "FAULTY" : "IN_STOCK",
          note: note || `Returned from customer ${customer?.customerUniqueId || customerId}`,
        }),
      })
      toast({ title: "Success", description: "Hardware returned successfully" })
      setReturnHardwareItem(null)
      fetchCustomerData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to return hardware", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const getMatchingInventoryItem = (device: any) => {
    if (!customer?.inventoryItems) return null
    return customer.inventoryItems.find((item: any) => 
      (device.serialNumber && item.serialNumber === device.serialNumber) ||
      (device.macAddress && item.macAddress === device.macAddress)
    ) || null
  }

  const hasInventoryItem = (device: any) => {
    return !!getMatchingInventoryItem(device)
  }

  const handleReturnOrDeleteDevice = (device: any) => {
    const matchingItem = getMatchingInventoryItem(device)
    if (matchingItem) {
      setReturnHardwareItem(matchingItem)
      setReturnHardwareOpen(true)
    } else {
      setDeletingDevice(device)
      setDeleteDeviceOpen(true)
    }
  }

  const confirmDeleteDevice = async () => {
    if (!deletingDevice || !customer) return
    try {
      setActionLoading(true)
      if (deletingDevice.deviceType === 'ONT' && deletingDevice.serialNumber) {
        await deleteOntFromOlt(deletingDevice.serialNumber);
      }
      await apiRequest(`/customer/${customer.id}/devices/${deletingDevice.id}`, {
        method: "DELETE"
      })
      toast({ title: "Success", description: "Device deleted successfully" })
      setDeletingDevice(null)
      fetchCustomerData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete device", variant: "destructive" })
    } finally {
      setActionLoading(false)
      setDeleteDeviceOpen(false)
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NPR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(price)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCustomerFullName = () => {
    if (!customer) return ""
    return `${customer.firstName} ${customer.middleName ? customer.middleName + ' ' : ''}${customer.lastName}`
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    switch (statusLower) {
      case "active":
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">ACTIVE</Badge>
      case "suspended":
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">SUSPENDED</Badge>
      case "inactive":
        return <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0">INACTIVE</Badge>
      default:
        return <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0">{status.toUpperCase()}</Badge>
    }
  }

  const getConnectionType = () => customer?.serviceDetails?.[0]?.connectionType ?? "N/A"
  const getMacAddress = () => customer?.devices?.[0]?.macAddress ?? "N/A"
  const getDeviceModel = () => customer?.devices?.[0]?.model ?? "N/A"
  const getVlanId = () => customer?.serviceDetails?.[0]?.vlanId ?? "N/A"
  const getVlanPriority = () => customer?.serviceDetails?.[0]?.vlanPriority ?? "N/A"
  const formatConnectionType = (type: string) => type?.toUpperCase() ?? "N/A"

  const getServiceMessage = (app: any): string => {
    const data = app.serviceData
    if (!data) return "No data"
    if (data.message) return data.message
    if (data.Message) return data.Message
    if (data.Data?.Message) return data.Data.Message
    if (data.Error) return data.Error
    if (data.success === false && data.error) return data.error
    if (typeof data === 'object') {
      if (data.data?.radcheck?.username) return `User ${data.data.radcheck.username} created`
      if (data.subscriber?.id) return `Subscriber ID: ${data.subscriber.id}`
    }
    return "Success"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading customer data...</p>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error || "Customer not found"}</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/customers')} className="mt-2">Back to Customers</Button>
        </div>
      </div>
    )
  }

  const invoiceAmount = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalPaid = customer.orders.filter(order => order.isPaid).reduce((sum, order) => sum + order.totalAmount, 0)
  const dueAmount = invoiceAmount - totalPaid
  const latestOrder = customer.orders.length > 0 ? customer.orders[customer.orders.length - 1] : null
  const latestSubscription = customer.customerSubscriptions.length > 0 ? customer.customerSubscriptions[0] : null

  const getDaysUntilExpiry = () => {
    if (!latestSubscription) return 0
    const expiryDate = new Date(latestSubscription.planEnd)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  const daysUntilExpiry = getDaysUntilExpiry()

  const serviceDetail = customer.serviceDetails?.[0]
  const olt = serviceDetail?.olt
  const splitter = serviceDetail?.splitter
  const vlanDetails = serviceDetail?.vlanDetails || []
  const usernames = customer.connectionUsers.map(u => u.username)

  return (
    <div className="space-y-6">
      {/* Dialogs */}
      <Dialog open={changeUsernameOpen} onOpenChange={setChangeUsernameOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
            <DialogDescription>Update the username for this customer's connection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="connection-user">Connection User</Label>
              <Select value={selectedConnectionUser} onValueChange={setSelectedConnectionUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select connection user" />
                </SelectTrigger>
                <SelectContent>
                  {customer.connectionUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>{user.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-username">New Username</Label>
              <Input id="new-username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Enter new username" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeUsernameOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeUsername} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Username
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={changePackageOpen} onOpenChange={setChangePackageOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Package</DialogTitle>
            <DialogDescription>Select a new package for this customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="package">Select Package</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id.toString()}>
                      {pkg.packageName} - {formatPrice(pkg.price)}/{pkg.packageDuration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPackage && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-muted-foreground">The customer will be switched to the selected package immediately.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePackageOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePackage} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetMacOpen} onOpenChange={setResetMacOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset MAC Address</DialogTitle>
            <DialogDescription>Update the MAC address for this customer's device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-mac">Current MAC Address</Label>
              <Input id="current-mac" value={getMacAddress()} readOnly className="bg-slate-50 dark:bg-slate-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-mac">New MAC Address</Label>
              <Input id="new-mac" value={newMacAddress} onChange={(e) => setNewMacAddress(e.target.value)} placeholder="00:1A:2B:3C:4D:5E" />
              <p className="text-xs text-muted-foreground">Format: 00:1A:2B:3C:4D:5E or 00-1A-2B-3C-4D-5E</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetMacOpen(false)}>Cancel</Button>
            <Button onClick={handleResetMac} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset MAC Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renewPackageOpen} onOpenChange={setRenewPackageOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renew Package</DialogTitle>
            <DialogDescription>
              Renew the current package for this customer. This will create a new order and extend the subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">Current Package</div>
                  <div className="text-sm text-muted-foreground">
                    {customer?.subscribedPkg?.packageName} - {formatPrice(customer?.subscribedPkg?.price || 0)}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div className="text-sm">
                  A new order will be created and the subscription will be extended based on the package duration.
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewPackageOpen(false)}>Cancel</Button>
            <Button onClick={handleRenewPackage} disabled={renewLoading} className="bg-gradient-to-r from-green-500 to-emerald-600">
              {renewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Renew Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteCustomerOpen}
        onOpenChange={setDeleteCustomerOpen}
        title="Delete customer?"
        description="This will revert the customer back to a qualified lead. Customers with assigned hardware cannot be deleted until devices are returned to stock, office, or staff."
        confirmLabel="Delete Customer"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteCustomer}
      />

      <ConfirmDialog
        open={returnHardwareOpen}
        onOpenChange={(open) => {
          setReturnHardwareOpen(open)
          if (!open) setReturnHardwareItem(null)
        }}
        title="Return hardware?"
        description={`Return ${returnHardwareItem?.serialNumber || returnHardwareItem?.name || "this hardware"} from this customer before deleting or reassigning it.`}
        confirmLabel="Return Hardware"
        cancelLabel="Cancel"
        showInput
        inputLabel="Return note"
        inputPlaceholder="Reason or office/staff return note"
        showCheckbox
        checkboxLabel="Mark device as faulty"
        onConfirm={confirmReturnHardware}
      />

      <Dialog open={portalPasswordOpen} onOpenChange={setPortalPasswordOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{customer?.portalUser ? "Edit Portal Login Credentials" : "Create Portal Account"}</DialogTitle>
            <DialogDescription>
              {customer?.portalUser
                ? "Update the email/username and password for this subscriber's portal login."
                : "Create a new portal login account for this subscriber."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-portal-email">Portal Email / Username</Label>
              <Input
                id="new-portal-email"
                type="email"
                value={newPortalEmail}
                onChange={(e) => setNewPortalEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-portal-password">Password</Label>
              <Input
                id="new-portal-password"
                type="password"
                value={newPortalPassword}
                onChange={(e) => setNewPortalPassword(e.target.value)}
                placeholder={customer?.portalUser ? "Enter new password (optional)" : "Enter password (min 4 characters)"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPortalPasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePortalPassword} disabled={portalPasswordSubmitting}>
              {portalPasswordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {customer?.portalUser ? "Save Changes" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={radiusPasswordOpen} onOpenChange={setRadiusPasswordOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Radius Password</DialogTitle>
            <DialogDescription>{radiusPasswordUser?.username || "Connection user"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-radius-password">New Password</Label>
              <Input
                id="new-radius-password"
                type="password"
                value={newRadiusPassword}
                onChange={(e) => setNewRadiusPassword(e.target.value)}
                placeholder="Enter new password (min 4 characters)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRadiusPasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeRadiusPassword} disabled={radiusPasswordSubmitting}>
              {radiusPasswordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CardContainer title="Customer Information" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2">
              <AvatarImage src={`/placeholder.svg?text=${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`} alt={getCustomerFullName()} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white">
                {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{getCustomerFullName()}</h2>
                <div className="flex items-center gap-2">
                  {getStatusBadge(customer.status)}
                  {latestSubscription?.isTrial && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">TRIAL</Badge>
                  )}
                  {customer.isRechargeable && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">RECHARGEABLE</Badge>
                  )}
                  {customer.referencedById && (
                    <Badge className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white border-0">REFERRED</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center"><Shield className="mr-1 h-4 w-4" /> ID Number: {customer.idNumber || "N/A"}</div>
                <button type="button" className={`flex items-center hover:text-green-600 ${!voipEnabled ? "cursor-not-allowed opacity-50 hover:text-muted-foreground" : ""}`} onClick={() => handleOutboundCall(customer.phoneNumber)}>
                  <Phone className="mr-1 h-4 w-4" /> Mobile: {customer.phoneNumber}
                </button>
                {customer.secondaryPhone && (
                  <button type="button" className={`flex items-center hover:text-green-600 ${!voipEnabled ? "cursor-not-allowed opacity-50 hover:text-muted-foreground" : ""}`} onClick={() => handleOutboundCall(customer.secondaryPhone)}>
                    <Phone className="mr-1 h-4 w-4" /> Secondary: {customer.secondaryPhone}
                  </button>
                )}
                <div className="flex items-center"><Mail className="mr-1 h-4 w-4" /> Email: {customer.email}</div>
                <div className="flex items-center"><Calendar className="mr-1 h-4 w-4" /> Member Since: {formatDate(customer.createdAt)}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Customer ID: {customer.customerUniqueId || `CUST-${customer.id.toString().padStart(3, '0')}`} | ISP: {customer.isp.companyName} | Lead ID: {customer.leadId || "N/A"}
              </div>
            </div>
          </div>
        </div>
      </CardContainer>

      <div className="flex flex-wrap gap-2 p-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg shadow-sm">
        <Button size="sm" className="h-9 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm hover:shadow-md transition-all" onClick={() => setRenewPackageOpen(true)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Renew Package
        </Button>
        <Button size="sm" className="h-9 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm hover:shadow-md transition-all" onClick={() => setChangeUsernameOpen(true)}>
          <User className="mr-2 h-4 w-4" /> Change Username
        </Button>
        <Button size="sm" className="h-9 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-sm hover:shadow-md transition-all" onClick={() => setChangePackageOpen(true)}>
          <Package className="mr-2 h-4 w-4" /> Change Packages
        </Button>
        <Button size="sm" className="h-9 bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-sm hover:shadow-md transition-all" onClick={() => setResetMacOpen(true)}>
          <RefreshCw className="mr-2 h-4 w-4" /> MAC RESET
        </Button>
        <Button size="sm" className="h-9 bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-sm hover:shadow-md transition-all" onClick={handleDeleteCustomer} disabled={actionLoading}>
          {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Delete Customer
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 p-1 rounded-lg">
          <TabsTrigger value="overview" className="flex-1"><User className="mr-2 h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="billing" className="flex-1"><CreditCard className="mr-2 h-4 w-4" />Billing</TabsTrigger>
          <TabsTrigger value="devices" className="flex-1"><Wifi className="mr-2 h-4 w-4" />Devices</TabsTrigger>
          <TabsTrigger value="usage" className="flex-1"><BarChart className="mr-2 h-4 w-4" />Usage</TabsTrigger>
          <TabsTrigger value="realtime" className="flex-1"><Activity className="mr-2 h-4 w-4" />Realtime Usage</TabsTrigger>
          <TabsTrigger value="documents" className="flex-1"><FileText className="mr-2 h-4 w-4" />Documents</TabsTrigger>
          <TabsTrigger value="radius" className="flex-1"><Key className="mr-2 h-4 w-4" />Radius Login</TabsTrigger>
          <TabsTrigger value="support" className="flex-1"><LifeBuoy className="mr-2 h-4 w-4" />Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CardContainer title="Account Details" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Customer ID:</span>
                    <span className="font-medium">{customer.customerUniqueId || `CUST-${customer.id.toString().padStart(3, '0')}`}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Primary Username:</span>
                    <span className="font-medium">{customer.connectionUsers.length > 0 ? customer.connectionUsers[0].username : "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">ID Number:</span>
                    <span className="font-medium">{customer.idNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Full Name:</span>
                    <span className="font-medium">{getCustomerFullName()}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Email Address:</span>
                    <span className="font-medium text-blue-500">{customer.email}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Phone Number:</span>
                    <button type="button" className={`font-medium hover:text-green-600 ${!voipEnabled ? "cursor-not-allowed opacity-50 hover:text-muted-foreground" : ""}`} onClick={() => handleOutboundCall(customer.phoneNumber)}>{customer.phoneNumber}</button>
                  </div>
                  {customer.secondaryPhone && (
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Secondary Phone:</span>
                      <button type="button" className={`font-medium hover:text-green-600 ${!voipEnabled ? "cursor-not-allowed opacity-50 hover:text-muted-foreground" : ""}`} onClick={() => handleOutboundCall(customer.secondaryPhone)}>{customer.secondaryPhone}</button>
                    </div>
                  )}
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Account Status:</span>
                    <span className="font-medium">{getStatusBadge(customer.status)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Registration Date:</span>
                    <span className="font-medium">{formatDate(customer.createdAt)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">{formatDate(customer.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer title="Service Information" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">ISP Provider:</span>
                    <span className="font-medium">{customer.isp.companyName}</span>
                  </div>
                  {customer.membership && (
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Membership:</span>
                      <div className="text-right">
                        <div className="font-medium">{customer.membership.name}</div>
                        <div className="text-xs text-muted-foreground">Code: {customer.membership.code}</div>
                      </div>
                    </div>
                  )}
                  {customer.installedBy && (
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Installed By:</span>
                      <div className="text-right">
                        <div className="font-medium">{customer.installedBy.name}</div>
                        <div className="text-xs text-muted-foreground">{customer.installedBy.email}</div>
                      </div>
                    </div>
                  )}
                  {customer.referencedBy && (
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Referred By:</span>
                      <div className="text-right">
                        <div className="font-medium">{customer.referencedBy.firstName} {customer.referencedBy.lastName}</div>
                        <div className="text-xs text-muted-foreground">{customer.referencedBy.email}</div>
                      </div>
                    </div>
                  )}
                  {customer.existingISP && (
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Previous ISP:</span>
                      <div className="text-right">
                        <div className="font-medium">{customer.existingISP.name}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Lead ID:</span>
                    <span className="font-medium">{customer.leadId || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Reference Status:</span>
                    <span className="font-medium">{customer.referencedById ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer title="Subscription & Billing" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Current Package:</span>
                    <span className="font-medium">{customer.subscribedPkg.packageName}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Package Price:</span>
                    <span className="font-medium">{formatPrice(customer.subscribedPkg.price)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Billing Cycle:</span>
                    <span className="font-medium capitalize">{customer.subscribedPkg.packageDuration}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Subscription Type:</span>
                    <span className="font-medium">{customer.isRechargeable ? "Rechargeable" : "Standard"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-medium">Not set</span>
                  </div>
                  {latestSubscription && (
                    <>
                      <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-muted-foreground">Current Status:</span>
                        <span className="font-medium">{latestSubscription.isTrial ? "Trial Period" : "Active Subscription"}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-muted-foreground">Plan Start:</span>
                        <span className="font-medium">{formatDate(latestSubscription.planStart)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-muted-foreground">Plan End:</span>
                        <span className="font-medium">{formatDate(latestSubscription.planEnd)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-muted-foreground">Days Remaining:</span>
                        <span className={`font-medium ${daysUntilExpiry < 7 ? "text-red-500" : daysUntilExpiry < 30 ? "text-amber-500" : "text-green-500"}`}>
                          {daysUntilExpiry} days
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardContainer title="Connection Information" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Connection Type:</span>
                    <span className="font-medium">{getConnectionType()}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Device Model:</span>
                    <span className="font-medium">{getDeviceModel()}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">MAC Address:</span>
                    <span className="font-medium">{getMacAddress()}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Assigned Package:</span>
                    <span className="font-medium">{customer.packagePrice?.packageName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Subscribed Package:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packageName || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer title="Package Details" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Plan Name:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packagePlanDetails?.planName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Plan Code:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packagePlanDetails?.planCode || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Download Speed:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packagePlanDetails?.downSpeed || 'N/A'} Mbps</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Upload Speed:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packagePlanDetails?.upSpeed || 'N/A'} Mbps</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Data Limit:</span>
                    <span className="font-medium">
                      {customer.subscribedPkg?.packagePlanDetails?.dataLimit === 0 ? "Unlimited" : customer.subscribedPkg?.packagePlanDetails?.dataLimit ? `${customer.subscribedPkg.packagePlanDetails.dataLimit} GB` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Device Limit:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packagePlanDetails?.deviceLimit ?? 'N/A'} devices</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Package Duration:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packageDuration || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Reference ID:</span>
                    <span className="font-medium">{customer.subscribedPkg?.referenceId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Package Status:</span>
                    <span className="font-medium">
                      <Badge className={customer.subscribedPkg?.isActive ? "bg-green-500" : "bg-red-500"}>
                        {customer.subscribedPkg?.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </span>
                  </div>
                </div>
              </div>
            </CardContainer>
          </div>

          {/* Network Infrastructure Card */}
          {serviceDetail && (
            <CardContainer title="Network Infrastructure" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-4">
                {olt && (
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">OLT: {olt.name}</h4>
                      <Badge className={olt.status === "online" ? "bg-green-500" : "bg-red-500"}>{olt.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Model:</div><div className="font-medium">{olt.model}</div>
                      <div>IP Address:</div><div className="font-mono">{olt.ipAddress}</div>
                      <div>Vendor:</div><div>{olt.vendor}</div>
                      <div>Ports:</div><div>{olt.usedPorts}/{olt.totalPorts} used</div>
                      {serviceDetail.oltPort && (
                        <>
                          <div>OLT Port:</div><div>{serviceDetail.oltPort}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {splitter && (
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Split className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">Splitter: {splitter.name}</h4>
                      <Badge className={splitter.status === "active" ? "bg-green-500" : "bg-red-500"}>{splitter.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Splitter ID:</div><div className="font-mono">{splitter.splitterId}</div>
                      <div>Ratio:</div><div>{splitter.splitRatio}</div>
                      <div>Type:</div><div>{splitter.splitterType || "N/A"}</div>
                      <div>Ports:</div><div>{splitter.availablePorts}/{splitter.portCount} available</div>
                      <div>Location:</div><div>{splitter.location?.site || "N/A"}</div>
                      {serviceDetail.splitterPort && (
                        <>
                          <div>Splitter Port:</div><div>{serviceDetail.splitterPort}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {vlanDetails.length > 0 && (
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Network className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">VLANs</h4>
                    </div>
                    <div className="space-y-2">
                      {vlanDetails.map((vlan) => (
                        <div key={vlan.id} className="flex items-center justify-between text-sm p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          <div>
                            <span className="font-medium">VLAN {vlan.vlanId}</span> - {vlan.name}
                            {vlan.description && <span className="text-xs text-muted-foreground ml-1">({vlan.description})</span>}
                          </div>
                          <div className="flex gap-4">
                            {vlan.gemIndex && <span>GEM: {vlan.gemIndex}</span>}
                            <Badge className={vlan.status === "active" ? "bg-green-500" : "bg-red-500"}>{vlan.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContainer>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardContainer title="Location Information" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Street:</span>
                    <span className="font-medium">{customer.street || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">District:</span>
                    <span className="font-medium">{customer.district || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">State:</span>
                    <span className="font-medium">{customer.state || "N/A"}</span>
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer title="Subscriber Portal Login Details" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Portal Account</span>
                  </div>
                  <Badge variant={customer.portalUser ? (customer.portalUser.status === 'active' ? 'default' : 'secondary') : 'secondary'}>
                    {customer.portalUser ? (customer.portalUser.status === 'active' ? 'Active' : 'Inactive') : 'No Login account'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-muted-foreground">Portal Username/Email:</span>
                    <span className="font-mono font-medium">{customer.portalUser?.email || getFallbackPortalEmail(customer)}</span>
                  </div>
                  {customer.portalUser ? (
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-muted-foreground">Password Hash:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {showPortalPassword ? "Hashed in database" : "••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setShowPortalPassword(prev => !prev)}
                        >
                          {showPortalPassword ? (
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-muted-foreground">Default Password (Initial):</span>
                      <span className="font-mono font-medium">{customer.customerUniqueId?.toLowerCase().replace(/\s+/g, '') || "N/A"}</span>
                    </div>
                  )}
                  <div className="flex justify-end mt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setNewPortalEmail(customer.portalUser?.email || getFallbackPortalEmail(customer))
                        setNewPortalPassword("")
                        setPortalPasswordOpen(true)
                      }} 
                      className="gap-1.5"
                    >
                      <Key className="h-3.5 w-3.5" />
                      {customer.portalUser ? "Edit Portal Login" : "Create Portal Account"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <CardContainer title="RADIUS / PPPoE Credentials" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                {customer.connectionUsers.length > 0 ? (
                  customer.connectionUsers.map((connectionUser) => (
                    <div key={connectionUser.id} className="rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{connectionUser.username}</span>
                        </div>
                        <Badge variant={connectionUser.isActive ? "default" : "secondary"}>
                          {connectionUser.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Key className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Password:</span>
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {visiblePasswords[connectionUser.id] ? connectionUser.password : "••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setVisiblePasswords(prev => ({
                            ...prev,
                            [connectionUser.id]: !prev[connectionUser.id]
                          }))}
                        >
                          {visiblePasswords[connectionUser.id] ? (
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => openRadiusPasswordDialog(connectionUser)}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No connection users saved.</div>
                )}
              </div>
            </CardContainer>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardContainer title="Billing Summary" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div className="w-full">
                      <div className="flex justify-between">
                        <div className="font-medium">Invoice Amount:</div>
                        <div className="font-bold">{formatPrice(invoiceAmount)}</div>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <div>Total Paid:</div>
                        <div>{formatPrice(totalPaid)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                    <div className="w-full">
                      <div className="flex justify-between">
                        <div className="font-medium text-red-500">Due Amount:</div>
                        <div className="font-bold text-red-500">{formatPrice(dueAmount)}</div>
                      </div>
                      {latestOrder && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Due Date: {formatDate(latestOrder.packageEnd)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div className="w-full">
                      <div className="flex justify-between">
                        <div className="font-medium">Expiry Date:</div>
                        <div>{latestSubscription ? formatDate(latestSubscription.planEnd) : "N/A"}</div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Last Renewal: {formatDate(customer.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <CreditCard className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div className="w-full">
                      <div className="flex justify-between">
                        <div className="font-medium">Payment Method:</div>
                        <div>Not set</div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Auto Renew: {networkSettings.autoRenew ? "Enabled" : "Disabled"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer title="Subscription Details" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Wifi className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{customer.subscribedPkg.packagePlanDetails.planName}</div>
                      <div className="text-sm text-muted-foreground">Package: {customer.subscribedPkg.packageName}</div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Billing Cycle: {customer.subscribedPkg.packageDuration}</div>
                      <div className="text-sm text-muted-foreground">
                        Type: {customer.isRechargeable ? "Rechargeable" : "Standard"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Price: {formatPrice(customer.subscribedPkg.price)}</div>
                      <div className="text-sm text-muted-foreground">
                        Duration: {customer.subscribedPkg.packageDuration}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Award className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Reference ID: {customer.subscribedPkg.referenceId}</div>
                      <div className="text-sm text-muted-foreground">
                        Package Status: {customer.subscribedPkg.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContainer>
          </div>

          <CardContainer title="Order History" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
            <div className="space-y-4">
              {customer.orders.length > 0 ? (
                <div className="space-y-3">
                  {customer.orders.map((order) => (
                    <div key={order.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Order #{order.id}</span>
                            <Badge variant={order.isPaid ? "default" : "secondary"} className={order.isPaid ? "bg-green-500" : "bg-amber-500"}>
                              {order.isPaid ? "Paid" : "Pending"}
                            </Badge>
                            <Badge variant="outline" className={order.isActive ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}>
                              {order.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Order Date: {formatDate(order.orderDate)} | Package: {order.packageStart} to {order.packageEnd}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{formatPrice(order.totalAmount)}</div>
                          <div className="text-sm text-muted-foreground">{order.items.length} items</div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-sm font-medium mb-2">Order Items:</div>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm p-2 rounded bg-slate-100 dark:bg-slate-800">
                              <div>
                                <div>{item.itemName}</div>
                                {item.referenceId && (
                                  <div className="text-xs text-muted-foreground">Ref: {item.referenceId}</div>
                                )}
                              </div>
                              <div className="font-medium">{formatPrice(item.itemPrice)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">No order history found</div>
              )}
              <div className="text-sm text-muted-foreground">
                Total Orders: {customer.orders.length} | Total Amount: {formatPrice(invoiceAmount)}
              </div>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Dialog open={assignHardwareOpen} onOpenChange={setAssignHardwareOpen}>
            <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-3xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Fiber Network Provisioning
                </DialogTitle>
                <DialogDescription>
                  Configure splitter, OLT, VLANs, and add devices. Use Autofind to discover and match ONT.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Connection Method */}
                <div className="space-y-4">
                  <Label>Connection Method</Label>
                  <RadioGroup
                    value={hwProvisionDetails.useSplitter ? "splitter" : "direct"}
                    onValueChange={(value) => {
                      if (value === "splitter") {
                        setHwProvisionDetails((prev) => ({ ...prev, useSplitter: true, useDirectOLT: false }))
                      } else {
                        setHwProvisionDetails((prev) => ({ ...prev, useSplitter: false, useDirectOLT: true }))
                      }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="splitter" id="splitter-method" />
                      <Label htmlFor="splitter-method" className="flex items-center cursor-pointer font-medium">
                        <Split className="mr-2 h-5 w-5 text-primary" />
                        Via Splitter
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="direct" id="direct-method" />
                      <Label htmlFor="direct-method" className="flex items-center cursor-pointer font-medium">
                        <Server className="mr-2 h-5 w-5 text-primary" />
                        Direct OLT Port
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Splitter selection */}
                {hwProvisionDetails.useSplitter && (
                  <div className="space-y-2">
                    <Label htmlFor="splitterId">Splitter</Label>
                    <SearchableSelect
                      options={splitters
                        .filter(s => (s.availablePorts ?? 0) > 0 || s.id.toString() === hwProvisionDetails.splitterId)
                        .map((splitter) => ({
                          value: splitter.id.toString(),
                          label: `${splitter.name} (${splitter.splitterId})`,
                          description: `Ratio: ${splitter.splitRatio} | Ports: ${splitter.portCount} | Available: ${splitter.availablePorts ?? 0}`,
                        }))}
                      value={hwProvisionDetails.splitterId}
                      onValueChange={(value) => {
                        const val = Array.isArray(value) ? value[0] : value
                        const selectedSplitter = splitters.find(s => s.id.toString() === val)
                        if (selectedSplitter) {
                          const ultimateOlt = findUltimateOltForSplitter(val)
                          setHwProvisionDetails((prev) => ({
                            ...prev,
                            splitterId: val,
                            oltId: ultimateOlt ? ultimateOlt.id.toString() : '',
                          }))
                        } else {
                          setHwProvisionDetails((prev) => ({ ...prev, splitterId: val }))
                        }
                      }}
                      placeholder={loadingSplitters ? "Loading splitters..." : "Select splitter with available ports"}
                      disabled={loadingSplitters}
                    />
                  </div>
                )}

                {/* Display selected splitter details with hierarchy */}
                {hwProvisionDetails.splitterId && hwProvisionDetails.useSplitter && (
                  (() => {
                    const selectedSplitter = splitters.find(s => s.id.toString() === hwProvisionDetails.splitterId)
                    if (!selectedSplitter) return null
                    const path = getSplitterPath(hwProvisionDetails.splitterId)
                    const ultimateOlt = findUltimateOltForSplitter(hwProvisionDetails.splitterId)
                    return (
                      <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                        <h4 className="font-medium text-sm">Selected Splitter Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Name:</div><div>{selectedSplitter.name}</div>
                          <div>ID:</div><div>{selectedSplitter.splitterId}</div>
                          <div>Ratio:</div><div>{selectedSplitter.splitRatio}</div>
                          <div>Type:</div><div>{selectedSplitter.splitterType || "N/A"}</div>
                          <div>Ports:</div><div>{selectedSplitter.portCount} total, {selectedSplitter.availablePorts ?? 0} available</div>
                          <div>Status:</div><div><Badge variant={selectedSplitter.status === "active" ? "default" : "destructive"}>{selectedSplitter.status}</Badge></div>
                        </div>

                        {/* Hierarchy Path */}
                        {path.length > 1 && (
                          <div className="mt-2">
                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Splitter Hierarchy</Label>
                            <div className="flex flex-wrap items-center gap-1 mt-1 text-xs">
                              {path.map((s, idx) => (
                                <React.Fragment key={s.id}>
                                  {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${s.id === selectedSplitter.id ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                    {s.name}
                                  </span>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Ultimate OLT */}
                        {ultimateOlt && (
                          <div className="mt-3 p-3 bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Server className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="font-semibold text-xs text-green-800 dark:text-green-300">Ultimate OLT</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[11px]">
                              <span className="text-muted-foreground">Name:</span><span className="font-medium">{ultimateOlt.name}</span>
                              {path[path.length - 1]?.connectedServiceBoard?.boardPort && (
                                <>
                                  <span className="text-muted-foreground">Port:</span><span className="font-mono font-medium">{path[path.length - 1]?.connectedServiceBoard?.boardPort}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()
                )}

                {/* OLT selection for direct connection */}
                {!hwProvisionDetails.useSplitter && (
                  <div className="space-y-2">
                    <Label htmlFor="oltId">OLT</Label>
                    <SearchableSelect
                      options={olts.map((olt) => ({
                        value: olt.id.toString(),
                        label: olt.name,
                        description: `${olt.model}`,
                      }))}
                      value={hwProvisionDetails.oltId}
                      onValueChange={(value) => {
                        const val = Array.isArray(value) ? value[0] : value
                        handleHwProvisionChange("oltId", val)
                      }}
                      placeholder={loadingOlts ? "Loading OLTs..." : "Select OLT"}
                      disabled={loadingOlts}
                    />
                  </div>
                )}

                {/* OLT Port Input – only for direct connection */}
                {!hwProvisionDetails.useSplitter && (
                  <div className="space-y-2">
                    <Label htmlFor="oltPort">OLT Port</Label>
                    <Input
                      id="oltPort"
                      value={hwProvisionDetails.oltPort}
                      onChange={(e) => handleHwProvisionChange("oltPort", e.target.value)}
                      placeholder="e.g., 1/1/1"
                    />
                  </div>
                )}

                {hwProvisionDetails.useSplitter && (
                  <div className="space-y-2">
                    <Label htmlFor="splitterPort">Splitter Output Port</Label>
                    <Input
                      id="splitterPort"
                      value={hwProvisionDetails.splitterPort}
                      onChange={(e) => handleHwProvisionChange("splitterPort", e.target.value)}
                      placeholder="e.g., 1-32"
                    />
                  </div>
                )}

                {/* VLAN Multi-Select */}
                {hwProvisionDetails.oltId && (
                  (() => {
                    const selectedOlt = olts.find(o => o.id.toString() === hwProvisionDetails.oltId)
                    if (!selectedOlt || !selectedOlt.vlans || selectedOlt.vlans.length === 0) {
                      return (
                        <div className="text-sm text-muted-foreground">No VLANs available for this OLT.</div>
                      )
                    }
                    return (
                      <div className="space-y-2">
                        <Label>Select VLANs</Label>
                        <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                          {selectedOlt.vlans.map((vlan) => (
                            <div key={vlan.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`vlan-${vlan.id}`}
                                checked={hwProvisionDetails.selectedVlanIds.includes(vlan.id.toString())}
                                onCheckedChange={(checked) => {
                                  const newIds = checked
                                    ? [...hwProvisionDetails.selectedVlanIds, vlan.id.toString()]
                                    : hwProvisionDetails.selectedVlanIds.filter(id => id !== vlan.id.toString())
                                  handleHwProvisionChange("selectedVlanIds", newIds)
                                }}
                              />
                              <Label htmlFor={`vlan-${vlan.id}`} className="text-sm cursor-pointer font-normal">
                                {vlan.vlanId} - {vlan.name} {vlan.description ? `(${vlan.description})` : ''}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()
                )}

                {/* Profile Multi-Select */}
                {hwProvisionDetails.oltId && (
                  (() => {
                    const selectedOlt = olts.find(o => o.id.toString() === hwProvisionDetails.oltId)
                    if (!selectedOlt || !selectedOlt.profiles || selectedOlt.profiles.length === 0) {
                      return (
                        <div className="text-sm text-muted-foreground">No profiles available for this OLT.</div>
                      )
                    }
                    return (
                      <div className="space-y-2">
                        <Label>Select Profiles</Label>
                        <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                          {selectedOlt.profiles.map((profile) => (
                            <div key={profile.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`profile-${profile.id}`}
                                checked={hwProvisionDetails.selectedProfileIds.includes(profile.id.toString())}
                                onCheckedChange={(checked) => {
                                  const newIds = checked
                                    ? [...hwProvisionDetails.selectedProfileIds, profile.id.toString()]
                                    : hwProvisionDetails.selectedProfileIds.filter(id => id !== profile.id.toString())
                                  handleHwProvisionChange("selectedProfileIds", newIds)
                                }}
                              />
                              <Label htmlFor={`profile-${profile.id}`} className="text-sm cursor-pointer font-normal">
                                {profile.name} ({profile.type}) {profile.description ? `- ${profile.description}` : ''}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()
                )}

                {/* Customer Devices Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Customer Devices</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      setHwEditingDeviceIndex(null)
                      setHwDeviceDialogOpen(true)
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Device
                    </Button>
                  </div>

                  {hwDevices.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No devices added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {hwDevices.map((device, index) => (
                        <div key={index} className="flex items-start justify-between p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900/20">
                          <div>
                            <div className="font-semibold text-sm">{device.brand} {device.model}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {device.deviceType} • SN: {device.serialNumber} • MAC: {device.macAddress || "N/A"}
                              {device.ponSerial && <span> • PON-SN: {device.ponSerial}</span>}
                            </div>
                            {device.notes && <div className="text-xs text-gray-500 mt-1 italic">Notes: {device.notes}</div>}
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="ghost" size="sm" onClick={() => openDeviceDialogForEdit(index)}>
                              Edit
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => removeDevice(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Autofind ONT Section */}
                {hwProvisionDetails.oltId && (
                  <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">ONT Discovery</Label>
                      {isAlreadyProvisioned ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                          PROVISIONED & ACTIVE
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAutoFindOnt}
                          disabled={
                            isAutoFinding ||
                            !hwProvisionDetails.oltId ||
                            (hwProvisionDetails.useDirectOLT && !hwProvisionDetails.oltPort)
                          }
                        >
                          {isAutoFinding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Autofind ONT
                        </Button>
                      )}
                    </div>

                    {isAlreadyProvisioned ? (
                      <p className="text-xs text-muted-foreground">
                        The ONT device is already successfully provisioned and active on the OLT network.
                      </p>
                    ) : (
                      <>
                        {/* Show the board port that will be used */}
                        {hwProvisionDetails.useSplitter && hwProvisionDetails.splitterId && (
                          <div className="text-xs text-muted-foreground">
                            Using board port from splitter:{' '}
                            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono">
                              {(() => {
                                const path = getSplitterPath(hwProvisionDetails.splitterId);
                                const lastSplitter = path[path.length - 1];
                                return lastSplitter?.connectedServiceBoard?.boardPort || 'Not available';
                              })()}
                            </code>
                          </div>
                        )}

                        {hwProvisionDetails.useDirectOLT && hwProvisionDetails.oltPort && (
                          <div className="text-xs text-muted-foreground">
                            Using entered OLT port:{' '}
                            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono">
                              {hwProvisionDetails.oltPort}
                            </code>
                          </div>
                        )}

                        {autoFindError && (
                          <Alert variant="destructive" className="py-2.5">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">{autoFindError}</AlertDescription>
                          </Alert>
                        )}

                        {discoveredOnts.length > 0 && (
                          <div className="space-y-2">
                            <Label htmlFor="discoveredOntSelect" className="text-xs font-medium">Select Discovered ONT</Label>
                            <SearchableSelect
                              options={discoveredOnts.map((ont) => ({
                                value: ont.ont_id_details,
                                label: `${ont.ont_id_details} (on ${ont.interface})`,
                              }))}
                              value={selectedDiscoveredOnt?.ont_id_details || ''}
                              onValueChange={(value) => {
                                const val = Array.isArray(value) ? value[0] : value
                                handleSelectDiscoveredOnt(val)
                              }}
                              placeholder="Choose an ONT from the list"
                            />
                          </div>
                        )}

                        {matchedDeviceForOnt && selectedDiscoveredOnt && (
                          <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 py-2.5">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                              Matched with device: {matchedDeviceForOnt.brand} {matchedDeviceForOnt.model}
                              {matchedDeviceForOnt.ponSerial && ` (PON-SN: ${matchedDeviceForOnt.ponSerial})`}
                            </AlertDescription>
                          </Alert>
                        )}
                        {selectedDiscoveredOnt && !matchedDeviceForOnt && (
                          <Alert variant="destructive" className="py-2.5">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              No matching device found. Please add a device with matching serial/MAC/PON-SN.
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignHardwareOpen(false)}>Cancel</Button>
                <Button onClick={handleHwProvisionSave} disabled={hwProvisionLoading}>
                  {hwProvisionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Device Provision
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DeviceDialog
            open={hwDeviceDialogOpen}
            onOpenChange={setHwDeviceDialogOpen}
            device={hwEditingDeviceIndex !== null ? hwDevices[hwEditingDeviceIndex] : undefined}
            onSave={handleDeviceSave}
          />

          <EditAssignedDeviceDialog
            open={editDeviceOpen}
            onOpenChange={setEditDeviceOpen}
            device={editingDevice}
            customerId={customer.id}
            onSaveSuccess={fetchCustomerData}
          />

          <ConfirmDialog
            open={deleteDeviceOpen}
            onOpenChange={(open) => {
              setDeleteDeviceOpen(open)
              if (!open) setDeletingDevice(null)
            }}
            title="Delete device?"
            description={`Are you sure you want to delete the device ${deletingDevice?.brand || ""} ${deletingDevice?.model || ""} (Serial: ${deletingDevice?.serialNumber || "N/A"})? This action cannot be undone.`}
            confirmLabel="Delete Device"
            cancelLabel="Cancel"
            variant="destructive"
            onConfirm={confirmDeleteDevice}
          />

          <CardContainer title="Assigned Hardware" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">{customer.devices.length} device{customer.devices.length === 1 ? "" : "s"} assigned</div>
              <Button onClick={() => setAssignHardwareOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Hardware
              </Button>
            </div>
            {customer.devices.length > 0 ? (
              <div className="space-y-3">
                {customer.devices.map((device, index) => {
                  const hasInv = hasInventoryItem(device);
                  return (
                    <div key={`${device.serialNumber || device.macAddress || index}`} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          {device.deviceType || "Device"} {device.brand || ""} {device.model || ""}
                          <Badge variant={device.provisioningStatus === "active" ? "default" : "secondary"}>
                            {device.provisioningStatus?.toUpperCase() || "PENDING"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Serial: <span className="font-mono">{device.serialNumber || "N/A"}</span> | MAC: <span className="font-mono">{device.macAddress || "N/A"}</span>
                          {device.ponSerial && ` | PON-SN: ${device.ponSerial}`}
                        </div>
                        {device.notes && <div className="text-xs text-muted-foreground italic">Note: {device.notes}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setAssignHardwareOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleReturnOrDeleteDevice(device)}
                        >
                          {hasInv ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                          <span className="sr-only">{hasInv ? "Return" : "Delete"}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No hardware assigned yet.</div>
            )}
          </CardContainer>

          {customer.devices.filter(d => d.deviceType === "ONT" && d.serialNumber).length > 0 && (
            <CardContainer title="ACS Device Information" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <Tabs defaultValue={customer.devices.find(d => d.deviceType === "ONT")?.serialNumber}>
                <TabsList className="mb-4">
                  {customer.devices.filter(d => d.deviceType === "ONT").map((device, idx) => (
                    <TabsTrigger key={idx} value={device.serialNumber}>{device.brand} {device.model}</TabsTrigger>
                  ))}
                </TabsList>
                {customer.devices.filter(d => d.deviceType === "ONT").map((device, idx) => (
                  <TabsContent key={idx} value={device.serialNumber}>
                    <Tabs defaultValue="basic-info">
                      <TabsList className="mb-4">
                        <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
                        <TabsTrigger value="wan">WAN Connections</TabsTrigger>
                        <TabsTrigger value="wifi">WiFi</TabsTrigger>
                        <TabsTrigger value="lan">LAN</TabsTrigger>
                        <TabsTrigger value="neighbor-devices">Connected Devices</TabsTrigger>
                      </TabsList>
                      <TabsContent value="basic-info"><TR069DeviceDetails deviceId={device.serialNumber} /></TabsContent>
                      <TabsContent value="wan"><TR069DeviceWanConnections deviceId={device.serialNumber} /></TabsContent>
                      <TabsContent value="wifi"><TR069DeviceWifi deviceId={device.serialNumber} /></TabsContent>
                      <TabsContent value="lan"><TR069DeviceLanInfo deviceId={device.serialNumber} /></TabsContent>
                      <TabsContent value="neighbor-devices"><TR069DeviceNeighbors deviceId={device.serialNumber} /></TabsContent>
                    </Tabs>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContainer>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <CardContainer title="Data Usage History" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
            <DataUsageHistory usernames={usernames} />
          </CardContainer>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <CardContainer title="Realtime Usage" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
            <RealtimeUsageChart usernames={usernames} />
          </CardContainer>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <CardContainer title="Customer Documents" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
            <div className="space-y-4">
              {customer.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customer.documents.map((doc) => (
                    <div key={doc.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          <FileCheck className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium truncate">{doc.fileName}</div>
                              <div className="text-sm text-muted-foreground capitalize">{doc.documentType}</div>
                            </div>
                            <Badge variant="outline" className={doc.isDeleted ? "border-red-500 text-red-500" : "border-green-500 text-green-500"}>
                              {doc.isDeleted ? "Deleted" : "Active"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            Uploaded: {formatDate(doc.uploadedAt)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Size: {formatFileSize(doc.size)} | Type: {doc.mimeType}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                              const filePath = doc.filePath.replace(/\\/g, "/")
                              const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3200"
                              const url = `${baseUrl}/${filePath}`
                              const link = document.createElement("a")
                              link.href = url
                              link.download = doc.fileName || "file"
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                              toast({ title: "Download started", description: `Downloading ${doc.fileName}` })
                            }}>Download</Button>
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                              const filePath = doc.filePath.replace(/\\/g, "/")
                              const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3200"
                              window.open(`${baseUrl}/${filePath}`, "_blank")
                            }}>Preview</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">No documents uploaded for this customer</div>
              )}
              <div className="text-sm text-muted-foreground">
                Total Documents: {customer.documents.length} |
                ID Proof: {customer.documents.filter(d => d.documentType === "idProof").length} |
                Address Proof: {customer.documents.filter(d => d.documentType === "addressProof").length} |
                Photos: {customer.documents.filter(d => d.documentType === "photo").length}
              </div>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="radius" className="space-y-4">
          <CardContainer title="Radius Login Details" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Authentication logs from RADIUS server for all connection users.</p>
              <Button size="sm" variant="outline" onClick={fetchRadiusAuthLogs} disabled={radiusAuthLoading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${radiusAuthLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            {radiusAuthLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading auth logs...</span>
              </div>
            ) : (() => {
              const logsToRender = (radiusAuthLogs && radiusAuthLogs.length > 0)
                ? radiusAuthLogs
                : (customer?.connectionUsers && customer.connectionUsers.length > 0)
                  ? customer.connectionUsers.map((user: any) => ({
                      id: `virtual-${user.id}`,
                      date: null,
                      username: user.username,
                      password: "N/A",
                      mac: "N/A",
                      calledId: "N/A",
                      framedIp: "N/A",
                      nasIp: "N/A",
                      nasPort: "N/A",
                      reply: "N/A",
                      reason: "No radius logs found (using database profile)"
                    }))
                  : [];

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Username</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Password</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">MAC</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Called ID</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Framed IP</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">NAS IP</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">NAS Port</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Reply</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsToRender.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center py-8 text-muted-foreground">
                            No connection user saved for this customer.
                          </td>
                        </tr>
                      ) : (
                        logsToRender.map((log: any, idx: number) => (
                          <tr key={log.id || idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-2 px-3 whitespace-nowrap text-xs">
                              {log.date ? new Date(log.date).toLocaleString() : "N/A"}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs">{log.username}</td>
                            <td className="py-2 px-3">
                              {log.reply === 'Access-Reject' ? (
                                <span className="font-mono text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
                                  {log.password}
                                </span>
                              ) : log.password === 'N/A' ? (
                                <span className="font-mono text-xs text-muted-foreground">N/A</span>
                              ) : (
                                <span className="font-mono text-xs text-muted-foreground">••••••••</span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs">{log.mac || "N/A"}</td>
                            <td className="py-2 px-3 font-mono text-xs">{log.calledId || "N/A"}</td>
                            <td className="py-2 px-3 font-mono text-xs">{log.framedIp || "N/A"}</td>
                            <td className="py-2 px-3 font-mono text-xs">{log.nasIp || "N/A"}</td>
                            <td className="py-2 px-3 font-mono text-xs">{log.nasPort || "N/A"}</td>
                            <td className="py-2 px-3">
                              <Badge 
                                variant={
                                  log.reply === 'Access-Accept' 
                                    ? 'default' 
                                    : log.reply === 'Access-Reject' 
                                      ? 'destructive' 
                                      : 'secondary'
                                } 
                                className="text-xs"
                              >
                                {log.reply || "N/A"}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-xs">{log.reason || "N/A"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </CardContainer>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <CustomerTickets customerId={customer.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
