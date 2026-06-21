"use client"

import { useEffect, useMemo, useState } from "react"
import { Laptop, Loader2, Send, Ticket, Wifi, Activity, Cpu, Thermometer, ShieldAlert, RefreshCw, Network, Radio, ArrowUpDown, Smartphone, Tv, HardDrive } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { CardContainer } from "@/components/ui/card-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

function formatBytes(val: any) {
  const num = Number(val);
  if (isNaN(num) || num <= 0) return "0 B";
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(2)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type CustomerProfile = {
  id: number
  idNumber?: string | null
  panNo?: string | null
  customerUniqueId?: string | null
  status?: string | null
  createdAt?: string | null
  primaryDeviceSerial?: string | null
  deviceSerials?: string[]
  lead?: {
    firstName?: string | null
    middleName?: string | null
    lastName?: string | null
    email?: string | null
    phoneNumber?: string | null
    secondaryContactNumber?: string | null
    gender?: string | null
    address?: string | null
    street?: string | null
    district?: string | null
    province?: string | null
  }
  isp?: { id: number; companyName: string } | null
  branch?: { id: number; name: string } | null
  subBranch?: { id: number; name: string } | null
  subscribedPkg?: {
    packageName?: string | null
    price?: number | null
    packageDuration?: string | null
    packagePlanDetails?: {
      planName?: string | null
      downSpeed?: number | null
      upSpeed?: number | null
    } | null
  } | null
  connectionUsers?: Array<{ username: string; isActive: boolean }>
  tr069Devices?: Array<{
    serialNumber: string
    modelName?: string | null
    manufacturer?: string | null
    productClass?: string | null
    ipAddress?: string | null
    status?: string | null
    lastContact?: string | null
  }>
  tickets?: Array<any>
  documents?: Array<{
    id: number
    documentType: string
    fileName: string
    mimeType?: string | null
    size?: number | null
    uploadedAt?: string | null
  }>
  billingSummary?: {
    outstandingAmount: number
    unpaidCount: number
    recentOrders: Array<any>
    lastOrder?: any
  }
  activeSubscription?: {
    planStart?: string
    planEnd?: string
    isActive?: boolean
    isTrial?: boolean
  } | null
}

type DeviceData = {
  deviceInfo?: any
  wanInfo?: any
  wlanInfo?: any
  lanInfo?: any
  connectedInfo?: any
}

type CustomerDashboardProps = {
  initialTab?: "overview" | "router" | "contact" | "billing" | "support"
}

function formatDate(value?: string | null) {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString()
}

function money(value?: number | null) {
  return `Rs. ${Number(value || 0).toLocaleString()}`
}

function formatFileSize(value?: number | null) {
  if (!value) return "N/A"
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function getSsidIndex(instance?: string) {
  const match = instance?.match(/WLANConfiguration\.(\d+)/)
  return match ? Number(match[1]) : 1
}

export function CustomerDashboard({ initialTab = "overview" }: CustomerDashboardProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [deviceData, setDeviceData] = useState<DeviceData>({})
  const [selectedSsidInstance, setSelectedSsidInstance] = useState<string>("")
  const [wifiForm, setWifiForm] = useState({ ssid: "", password: "" })
  const [loading, setLoading] = useState(true)
  const [deviceLoading, setDeviceLoading] = useState(false)
  const [savingWifi, setSavingWifi] = useState(false)
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [routerSubTab, setRouterSubTab] = useState<"diagnostics" | "wifi" | "devices" | "ports" | "stats">("diagnostics")
  const [rebooting, setRebooting] = useState(false)
  const [rebootProgress, setRebootProgress] = useState(60)
  const [rebootDialogOpen, setRebootDialogOpen] = useState(false)

  const handleReboot = async () => {
    if (!serial) return
    setRebooting(true)
    setRebootDialogOpen(false)
    setRebootProgress(60)
    try {
      await apiRequest(`/customer/profile/genieacs/${serial}/reboot`, {
        method: "POST"
      })
      toast.success("Reboot command sent to router successfully!")
      
      const interval = setInterval(() => {
        setRebootProgress((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setRebooting(false)
            loadDeviceData(serial)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || "Failed to reboot router")
      setRebooting(false)
    }
  }

  const serial = profile?.primaryDeviceSerial || ""
  const ssids = deviceData.wlanInfo?.data?.ssidList || []
  const selectedSsid = ssids.find((ssid: any) => ssid.instance === selectedSsidInstance) || ssids[0]
  const activeTickets = (profile?.tickets || []).filter((ticket) => !["CLOSED", "RESOLVED"].includes(String(ticket.status || "").toUpperCase()))
  const recentOrders = profile?.billingSummary?.recentOrders || []
  const connectedDevices = deviceData.connectedInfo?.data?.connectedDevices || []
  const lanInterfaces = deviceData.lanInfo?.data?.lanInterfaces || []
  const wanConnection = deviceData.wanInfo?.data?.wanConnections?.[0]
  const deviceInfo = deviceData.deviceInfo?.data
  const plan = profile?.subscribedPkg
  const planDetails = plan?.packagePlanDetails

  const customerName = useMemo(() => {
    const parts = [profile?.lead?.firstName, profile?.lead?.middleName, profile?.lead?.lastName].filter(Boolean)
    return parts.join(" ") || user?.name || "Customer"
  }, [profile, user])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const response = await apiRequest<{ success: boolean; data: CustomerProfile }>("/customer/profile")
      setProfile(response.data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load customer profile")
    } finally {
      setLoading(false)
    }
  }

  const loadDeviceData = async (deviceSerial: string) => {
    if (!deviceSerial) return
    setDeviceLoading(true)
    try {
      const [deviceInfoRes, wanInfoRes, wlanInfoRes, lanInfoRes, connectedInfoRes] = await Promise.allSettled([
        apiRequest(`/customer/profile/genieacs/${deviceSerial}/deviceinfo`),
        apiRequest(`/customer/profile/genieacs/${deviceSerial}/waninfo`),
        apiRequest(`/customer/profile/genieacs/${deviceSerial}/wlaninfo`),
        apiRequest(`/customer/profile/genieacs/${deviceSerial}/laninfo`),
        apiRequest(`/customer/profile/genieacs/${deviceSerial}/connected-devices-info`),
      ])

      setDeviceData({
        deviceInfo: deviceInfoRes.status === "fulfilled" ? deviceInfoRes.value : null,
        wanInfo: wanInfoRes.status === "fulfilled" ? wanInfoRes.value : null,
        wlanInfo: wlanInfoRes.status === "fulfilled" ? wlanInfoRes.value : null,
        lanInfo: lanInfoRes.status === "fulfilled" ? lanInfoRes.value : null,
        connectedInfo: connectedInfoRes.status === "fulfilled" ? connectedInfoRes.value : null,
      })
    } finally {
      setDeviceLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (serial) loadDeviceData(serial)
  }, [serial])

  useEffect(() => {
    if (!selectedSsid) return
    setSelectedSsidInstance(selectedSsid.instance || "")
    setWifiForm({
      ssid: selectedSsid.ssid || "",
      password: "",
    })
  }, [selectedSsid?.instance])

  const updateWifi = async () => {
    if (!serial || !selectedSsid) return
    if (!wifiForm.ssid.trim()) {
      toast.error("SSID is required")
      return
    }

    setSavingWifi(true)
    try {
      await apiRequest(`/customer/profile/genieacs/${serial}/update-wifi`, {
        method: "POST",
        body: JSON.stringify({
          ssidIndex: getSsidIndex(selectedSsid.instance),
          ssidName: wifiForm.ssid.trim(),
          password: wifiForm.password.trim() || undefined,
        }),
      })
      toast.success("WiFi update sent to router")
      setWifiForm((prev) => ({ ...prev, password: "" }))
      await loadDeviceData(serial)
    } catch (error: any) {
      toast.error(error.message || "Failed to update WiFi")
    } finally {
      setSavingWifi(false)
    }
  }

  const createTicket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const title = String(formData.get("title") || "").trim()
    const description = String(formData.get("description") || "").trim()
    if (!title) {
      toast.error("Ticket subject is required")
      return
    }

    setCreatingTicket(true)
    try {
      await apiRequest("/customer/profile/tickets", {
        method: "POST",
        body: JSON.stringify({ title, description, priority: "MEDIUM", category: "Customer Portal" }),
      })
      toast.success("Support ticket created")
      form.reset()
      await loadProfile()
    } catch (error: any) {
      toast.error(error.message || "Failed to create ticket")
    } finally {
      setCreatingTicket(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!profile) {
    return (
      <CardContainer title="Customer Profile">
        <div className="py-10 text-center text-muted-foreground">No customer profile is linked to this login.</div>
      </CardContainer>
    )
  }

  const header = (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold">Namaste, {customerName}</h1>
        <p className="text-sm text-muted-foreground">
          Customer ID: <span className="font-mono">{profile.customerUniqueId || "N/A"}</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={String(profile.status).toLowerCase() === "active" ? "success" : "secondary"}>
          {profile.status || "unknown"}
        </Badge>
        {serial && <Badge variant="outline">ONT: {serial}</Badge>}
      </div>
    </div>
  )

  const dashboardStats = (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CardContainer title="Current Plan">
        <div className="space-y-2">
          <PackageLine label={plan?.packageName || planDetails?.planName || "No active package"} value={plan?.packageDuration || "N/A"} />
          <div className="text-2xl font-bold">{planDetails?.downSpeed || 0} Mbps</div>
          <p className="text-xs text-muted-foreground">Upload: {planDetails?.upSpeed || 0} Mbps</p>
        </div>
      </CardContainer>
      <CardContainer title="Billing">
        <div className="space-y-2">
          <div className="text-2xl font-bold">{money(profile.billingSummary?.outstandingAmount)}</div>
          <p className="text-xs text-muted-foreground">{profile.billingSummary?.unpaidCount || 0} unpaid invoice/order</p>
        </div>
      </CardContainer>
      <CardContainer title="Support">
        <div className="space-y-2">
          <div className="text-2xl font-bold">{activeTickets.length}</div>
          <p className="text-xs text-muted-foreground">active support tickets</p>
        </div>
      </CardContainer>
      <CardContainer title="Router">
        <div className="space-y-2">
          <div className="text-2xl font-bold">{deviceInfo?.status || profile.tr069Devices?.[0]?.status || "N/A"}</div>
          <p className="text-xs text-muted-foreground">Last contact: {formatDate(deviceInfo?.lastContact || profile.tr069Devices?.[0]?.lastContact)}</p>
        </div>
      </CardContainer>
    </div>
  )

  const renderDiagnosticsTab = () => {
    const cpu = Number(deviceInfo?.cpuUsage ?? 0)
    const tempVal = deviceInfo?.cpuTemp
    const temp = tempVal !== "N/A" && tempVal ? parseFloat(String(tempVal)) : null
    const rx = deviceInfo?.rxPower || "N/A"
    
    // Severity coloring for temp
    let tempColor = "text-emerald-400"
    let tempBg = "bg-emerald-500/10 border-emerald-500/20"
    if (temp && temp >= 70) {
      tempColor = "text-rose-400"
      tempBg = "bg-rose-500/10 border-rose-500/20"
    } else if (temp && temp >= 50) {
      tempColor = "text-amber-400"
      tempBg = "bg-amber-500/10 border-amber-500/20"
    }

    // GPON Optical RX Power evaluation
    let rxStatus = "Unknown"
    let rxColor = "text-slate-400"
    let rxBg = "bg-slate-500/10 border-slate-500/20"
    if (rx !== "N/A" && rx) {
      const val = parseFloat(String(rx).replace(/[^\d.-]/g, ""))
      if (!isNaN(val)) {
        if (val >= -27 && val <= -8) {
          rxStatus = "Optimal"
          rxColor = "text-emerald-400"
          rxBg = "bg-emerald-500/10 border-emerald-500/20"
        } else if (val >= -29 && val < -27) {
          rxStatus = "Marginal"
          rxColor = "text-amber-400"
          rxBg = "bg-amber-500/10 border-amber-500/20"
        } else {
          rxStatus = "Critical"
          rxColor = "text-rose-400"
          rxBg = "bg-rose-500/10 border-rose-500/20"
        }
      }
    }

    return (
      <div className="space-y-6">
        {/* Performance Gauges */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* CPU Gauge */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-400">CPU Usage</span>
              <Cpu className="h-5 w-5 text-blue-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{cpu}%</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-850 overflow-hidden">
              <div 
                className="h-full rounded-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${cpu}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-slate-400">Processes and background workloads</p>
          </div>

          {/* Temperature Gauge */}
          <div className={`rounded-xl border p-5 backdrop-blur-sm ${tempBg}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-400">CPU Temp</span>
              <Thermometer className={`h-5 w-5 ${tempColor}`} />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold ${tempColor}`}>{temp ? `${temp}°C` : "N/A"}</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-850 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  temp && temp >= 70 ? "bg-rose-500" : temp && temp >= 50 ? "bg-amber-500" : "bg-emerald-500"
                }`} 
                style={{ width: temp ? `${Math.min(100, Math.max(0, temp))}%` : "0%" }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-slate-400">Thermal condition inside the chassis</p>
          </div>

          {/* Optical RX Power Gauge */}
          <div className={`rounded-xl border p-5 backdrop-blur-sm ${rxBg}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-400">Rx Power (GPON)</span>
              <ShieldAlert className={`h-5 w-5 ${rxColor}`} />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className={`text-3xl font-extrabold ${rxColor}`}>{rx}</span>
              <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${rxBg} ${rxColor}`}>
                {rxStatus}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Limit: -27 to -8 dBm</span>
              <span>Input optical signal level</span>
            </div>
          </div>
        </div>

        {/* Basic Info & Reboot */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-4">Device Specifications</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Model Name", deviceInfo?.modelName || profile.tr069Devices?.[0]?.modelName || "N/A"],
                ["Manufacturer", deviceInfo?.manufacturer || profile.tr069Devices?.[0]?.manufacturer || "N/A"],
                ["Product Class", deviceInfo?.productClass || profile.tr069Devices?.[0]?.productClass || "N/A"],
                ["Serial Number", serial || "N/A"],
                ["Firmware Version", deviceInfo?.softwareVersion || deviceInfo?.deviceInfo?.softwareVersion || "N/A"],
                ["Uptime", deviceInfo?.uptime || "N/A"],
                ["Last Contact", formatDate(deviceInfo?.lastContact || profile.tr069Devices?.[0]?.lastContact)],
                ["Status", deviceInfo?.status || profile.tr069Devices?.[0]?.status || "N/A"]
              ].map(([lbl, val]) => (
                <div key={lbl} className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-3">
                  <div className="text-xs text-slate-400 font-semibold">{lbl}</div>
                  <div className="mt-1 text-sm font-medium text-slate-200">{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Remote Maintenance</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                If your internet connection feels slow or certain devices fail to load pages, a soft reboot of your router can flush temporary cache and restore optimal performance.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <Button
                onClick={() => setRebootDialogOpen(true)}
                disabled={rebooting}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center justify-center gap-2 py-3 rounded-lg shadow-lg shadow-rose-950/20"
              >
                <RefreshCw className="h-4 w-4" />
                Reboot Device
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderWifiTab = () => {
    // Filter SSIDs for Index 1 and 5 only
    const filteredSsids = ssids.filter((ssid: any) => {
      const idx = getSsidIndex(ssid.instance);
      return idx === 1 || idx === 5;
    });

    const activeSsid = filteredSsids.find((ssid: any) => ssid.instance === selectedSsidInstance) || filteredSsids[0]

    return (
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Networks List */}
        <div className="space-y-4 lg:col-span-1">
          <h3 className="text-lg font-bold text-white mb-1">Wi-Fi Channels</h3>
          <p className="text-xs text-slate-400 mb-4">Manage primary and high-speed bands</p>
          
          {filteredSsids.length > 0 ? (
            <div className="space-y-3">
              {filteredSsids.map((ssid: any) => {
                const idx = getSsidIndex(ssid.instance);
                const isSelected = activeSsid?.instance === ssid.instance
                return (
                  <button
                    key={ssid.instance}
                    onClick={() => {
                      setSelectedSsidInstance(ssid.instance)
                      setWifiForm({ ssid: ssid.ssid || "", password: "" })
                    }}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      isSelected 
                        ? "border-blue-500 bg-blue-600/10 shadow-lg shadow-blue-500/5 text-white" 
                        : "border-slate-800 bg-slate-900/30 text-slate-300 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className={`h-4 w-4 ${isSelected ? "text-blue-400 animate-pulse" : "text-slate-400"}`} />
                        <span className="font-semibold text-sm">
                          {idx === 5 ? "5.0 GHz Ultra-Band" : "2.4 GHz Main Band"}
                        </span>
                      </div>
                      <Badge className={ssid.enable ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400"}>
                        {ssid.status || (ssid.enable ? "Enabled" : "Disabled")}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-col gap-1">
                      <div className="text-lg font-bold truncate">{ssid.ssid || "Unnamed network"}</div>
                      <div className="text-xs text-slate-400 flex items-center justify-between mt-1">
                        <span>Ch: {ssid.channel || "Auto"}</span>
                        <span>MAC: {ssid.bssid || "N/A"}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="py-10 text-center rounded-xl border border-slate-800 bg-slate-900/20 text-slate-400">
              No editable WiFi networks found.
            </div>
          )}
        </div>

        {/* Configurations Form */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 lg:col-span-2">
          {activeSsid ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Configure WiFi - {getSsidIndex(activeSsid.instance) === 5 ? "5.0 GHz Ultra-Band" : "2.4 GHz Main Band"}
                </h3>
                <p className="text-xs text-slate-400">Change SSID name and login credentials below</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">SSID (WiFi Network Name)</Label>
                  <Input 
                    value={wifiForm.ssid} 
                    onChange={(event) => setWifiForm({ ...wifiForm, ssid: event.target.value })} 
                    className="border-slate-800 bg-slate-950 text-slate-100 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="Enter network name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">New WPA2 Pre-Shared Key (Password)</Label>
                  <Input 
                    type="password" 
                    value={wifiForm.password} 
                    onChange={(event) => setWifiForm({ ...wifiForm, password: event.target.value })} 
                    className="border-slate-800 bg-slate-950 text-slate-100 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="Leave blank to keep current password"
                  />
                  <p className="text-xs text-slate-500">Security requires a password of at least 8 characters</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 mt-6">
                <InfoGrid rows={[
                  ["Encryption Method", activeSsid.encryptionMode || activeSsid.security?.encryption || "AES (WPA2)"],
                  ["Auth Mode", activeSsid.authenticationMode || activeSsid.security?.mode || "WPA2-PSK"],
                  ["Active Clients", activeSsid.associatedDeviceCount || "0 devices"],
                  ["Max Bit Rate", activeSsid.maxBitRate ? `${activeSsid.maxBitRate} Mbps` : "Auto"]
                ]} />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <Button 
                  onClick={updateWifi} 
                  disabled={savingWifi || !serial} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-lg shadow-blue-950/20 animate-pulse-subtle"
                >
                  {savingWifi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                  Save WiFi Credentials
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">
              Please select a Wi-Fi network from the list to begin configuration.
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderDevicesTab = () => {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white mb-1">Connected Clients</h3>
          <p className="text-xs text-slate-400">Devices currently associated with your router's LAN or WiFi interfaces</p>
        </div>

        {connectedDevices.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {connectedDevices.map((client: any, index: number) => {
              const name = String(client.hostName || "Unknown Device").toLowerCase();
              let Icon = Laptop;
              if (name.includes("phone") || name.includes("iphone") || name.includes("android") || name.includes("mobile")) {
                Icon = Smartphone;
              } else if (name.includes("tv") || name.includes("television") || name.includes("smarttv") || name.includes("firestick")) {
                Icon = Tv;
              } else if (name.includes("pc") || name.includes("desktop") || name.includes("laptop") || name.includes("macbook")) {
                Icon = Laptop;
              } else {
                Icon = HardDrive;
              }

              return (
                <div 
                  key={`${client.macAddress}-${index}`} 
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/30 p-4 transition-all hover:bg-slate-950/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200 truncate">{client.hostName || "Unnamed Device"}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">{client.macAddress || "MAC N/A"}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge className={client.active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400"}>
                      {client.active ? "Active" : "Idle"}
                    </Badge>
                    <span className="text-xs font-mono text-slate-300 mt-0.5">{client.ipAddress || "No IP"}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            No connected devices detected by the router.
          </div>
        )}
      </div>
    )
  }

  const renderPortsTab = () => {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-1">Ethernet & LAN Interfaces</h3>
          <p className="text-xs text-slate-400">Physical LAN port connections on the back of your ONT device</p>
        </div>

        {lanInterfaces.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {lanInterfaces.map((port: any) => {
              const isActive = String(port.status || "").toLowerCase() === "up";
              return (
                <div 
                  key={port.name || port.index} 
                  className={`rounded-xl border p-5 transition-all ${
                    isActive 
                      ? "border-emerald-500/20 bg-emerald-500/5" 
                      : "border-slate-800 bg-slate-950/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Port visual representation */}
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 transition-colors ${
                        isActive 
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" 
                          : "border-slate-800 bg-slate-905 text-slate-600"
                      }`}>
                        <Network className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200">{port.name || `Ethernet Port ${port.index}`}</h4>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {port.maxBitRate ? `Link Speed: ${port.maxBitRate} Mbps` : "No Carrier"}
                        </div>
                      </div>
                    </div>
                    <Badge className={isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-800"}>
                      {port.status || "Down"}
                    </Badge>
                  </div>

                  {isActive && port.stats && (
                    <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded bg-slate-950/40 p-2 border border-slate-850">
                        <div className="text-slate-400">Bytes Received</div>
                        <div className="mt-1 font-semibold text-slate-200">{formatBytes(port.stats.bytesReceived)}</div>
                      </div>
                      <div className="rounded bg-slate-950/40 p-2 border border-slate-850">
                        <div className="text-slate-400">Bytes Sent</div>
                        <div className="mt-1 font-semibold text-slate-200">{formatBytes(port.stats.bytesSent)}</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            No physical Ethernet ports details reported by the ONT.
          </div>
        )}
      </div>
    )
  }

  const renderStatsTab = () => {
    // Collect filtered SSIDs that contain stats
    const wifiStats = ssids.filter((ssid: any) => {
      const idx = getSsidIndex(ssid.instance);
      return (idx === 1 || idx === 5) && ssid.stats;
    });

    const activeLanPorts = lanInterfaces.filter((port: any) => port.status?.toLowerCase() === "up" && port.stats);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Traffic & Bandwidth Statistics</h3>
          <p className="text-xs text-slate-400">Review cumulative data transmission across your router's interfaces</p>
        </div>

        {/* LAN Statistics */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h4 className="font-bold text-white mb-4 flex items-center gap-2">
            <Network className="h-4 w-4 text-blue-400" />
            Physical Ethernet Stats
          </h4>
          
          {activeLanPorts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                    <th className="py-2.5">Port</th>
                    <th className="py-2.5">Data Sent</th>
                    <th className="py-2.5">Data Received</th>
                    <th className="py-2.5">Packets Sent</th>
                    <th className="py-2.5">Packets Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-200">
                  {activeLanPorts.map((port: any) => (
                    <tr key={port.name || port.index}>
                      <td className="py-3 font-semibold text-blue-400">{port.name || `LAN ${port.index}`}</td>
                      <td className="py-3 font-mono">{formatBytes(port.stats.bytesSent)}</td>
                      <td className="py-3 font-mono">{formatBytes(port.stats.bytesReceived)}</td>
                      <td className="py-3 font-mono">{Number(port.stats.packetsSent || 0).toLocaleString()}</td>
                      <td className="py-3 font-mono">{Number(port.stats.packetsReceived || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3">No active ethernet ports transmitting traffic.</p>
          )}
        </div>

        {/* Wi-Fi Statistics */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h4 className="font-bold text-white mb-4 flex items-center gap-2">
            <Radio className="h-4 w-4 text-blue-400" />
            Wireless Network Stats
          </h4>
          
          {wifiStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                    <th className="py-2.5">SSID Network</th>
                    <th className="py-2.5">Data Sent</th>
                    <th className="py-2.5">Data Received</th>
                    <th className="py-2.5">Packets Sent</th>
                    <th className="py-2.5">Packets Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-200">
                  {wifiStats.map((ssid: any) => {
                    const idx = getSsidIndex(ssid.instance);
                    return (
                      <tr key={ssid.instance}>
                        <td className="py-3">
                          <span className="font-semibold text-blue-400">{ssid.ssid}</span>
                          <span className="text-xs text-slate-500 ml-2">({idx === 5 ? "5G" : "2.4G"})</span>
                        </td>
                        <td className="py-3 font-mono">{formatBytes(ssid.stats.bytesSent)}</td>
                        <td className="py-3 font-mono">{formatBytes(ssid.stats.bytesReceived)}</td>
                        <td className="py-3 font-mono">{Number(ssid.stats.packetsSent || 0).toLocaleString()}</td>
                        <td className="py-3 font-mono">{Number(ssid.stats.packetsReceived || 0).toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3">No wireless traffic statistics reported.</p>
          )}
        </div>
      </div>
    )
  }

  const renderRouterControlCenter = () => {
    if (!serial) {
      return (
        <CardContainer title="Router Status">
          <div className="py-10 text-center text-muted-foreground">
            No linked ONT device serial found for this customer.
          </div>
        </CardContainer>
      )
    }

    const isDeviceOnline = (deviceInfo?.status || profile?.tr069Devices?.[0]?.status || "Offline") === "Online";

    return (
      <div className="rounded-2xl border border-blue-500/20 bg-slate-950 p-6 text-slate-100 shadow-2xl backdrop-blur-md dark:border-blue-500/10">
        {/* Router Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Network className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Router Control Center</h2>
              <p className="text-xs text-slate-400">Manage and monitor your home router in real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${isDeviceOnline ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"} px-3 py-1 font-semibold border`}>
              {isDeviceOnline ? "● Connected" : "○ Disconnected"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDeviceData(serial)}
              disabled={deviceLoading}
              className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${deviceLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-800/60 pb-4">
          {[
            { id: "diagnostics", label: "Diagnostics", icon: Activity },
            { id: "wifi", label: "Wi-Fi Networks", icon: Wifi },
            { id: "devices", label: "Connected Devices", icon: Laptop },
            { id: "ports", label: "Ethernet Ports", icon: Network },
            { id: "stats", label: "Traffic Stats", icon: ArrowUpDown }
          ].map((tab) => {
            const Icon = tab.icon
            const active = routerSubTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setRouterSubTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-250 ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Reboot Progress Overlay */}
        {rebooting && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 text-white backdrop-blur-md">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-855"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
              <span className="text-xl font-bold text-blue-400">{rebootProgress}s</span>
            </div>
            <h3 className="mt-6 text-xl font-bold">Rebooting Router...</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-md text-center">
              Your device is restarting. Please wait while we establish a new connection. This usually takes around 60 seconds.
            </p>
          </div>
        )}

        {/* Reboot Confirmation Dialog */}
        {rebootDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[95vw] max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
              <h3 className="text-lg font-bold">Reboot Router</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Are you sure you want to reboot your router? This will temporarily disconnect all connected devices from the internet.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRebootDialogOpen(false)}
                  className="border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReboot}
                  className="bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                >
                  Confirm Reboot
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab Content Panels */}
        {deviceLoading && !rebooting ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-4 text-sm font-medium">Fetching real-time data from router...</p>
          </div>
        ) : (
          <div>
            {routerSubTab === "diagnostics" && renderDiagnosticsTab()}
            {routerSubTab === "wifi" && renderWifiTab()}
            {routerSubTab === "devices" && renderDevicesTab()}
            {routerSubTab === "ports" && renderPortsTab()}
            {routerSubTab === "stats" && renderStatsTab()}
          </div>
        )}
      </div>
    )
  }

  const routerContent = renderRouterControlCenter()

  const contactContent = (
    <div className="grid gap-4 lg:grid-cols-2">
      <CardContainer title="Customer Contact Details">
        <InfoGrid rows={[
          ["Full Name", customerName],
          ["Email", profile.lead?.email || "N/A"],
          ["Primary Phone", profile.lead?.phoneNumber || "N/A"],
          ["Secondary Phone", profile.lead?.secondaryContactNumber || "N/A"],
          ["Gender", profile.lead?.gender || "N/A"],
          ["Customer ID", profile.customerUniqueId || "N/A"],
          ["ID Number", profile.idNumber || "N/A"],
          ["PAN Number", profile.panNo || "N/A"],
        ]} />
      </CardContainer>

      <CardContainer title="Address & Account">
        <InfoGrid rows={[
          ["Address", profile.lead?.address || "N/A"],
          ["Street", profile.lead?.street || "N/A"],
          ["District", profile.lead?.district || "N/A"],
          ["Province", profile.lead?.province || "N/A"],
          ["ISP", profile.isp?.companyName || "N/A"],
          ["Branch", profile.branch?.name || "N/A"],
          ["Sub Branch", profile.subBranch?.name || "N/A"],
          ["Joined", formatDate(profile.createdAt)],
        ]} />
      </CardContainer>

      <CardContainer title="Documents" className="lg:col-span-2">
        {(profile.documents || []).length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {(profile.documents || []).map((document) => (
              <div key={document.id} className="rounded-md border p-3">
                <div className="font-medium">{document.fileName}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {document.documentType} - {document.mimeType || "file"} - {formatFileSize(document.size)} - {formatDate(document.uploadedAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No customer documents uploaded.</p>
        )}
      </CardContainer>
    </div>
  )

  if (initialTab === "router") {
    return <div className="mx-auto max-w-7xl space-y-6 pb-24 md:pb-10">{header}{routerContent}</div>
  }

  if (initialTab === "contact") {
    return <div className="mx-auto max-w-7xl space-y-6 pb-24 md:pb-10">{header}{contactContent}</div>
  }

  const billingContent = (
    <CardContainer title="Billing History">
      {recentOrders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Invoice/Order</th>
                <th className="py-2">Date</th>
                <th className="py-2">Package Period</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="py-3 font-mono">{order.invoiceId || `ORDER-${order.id}`}</td>
                  <td className="py-3">{formatDate(order.orderDate)}</td>
                  <td className="py-3">{formatDate(order.packageStart)} - {formatDate(order.packageEnd)}</td>
                  <td className="py-3 font-medium">{money(order.totalAmount)}</td>
                  <td className="py-3"><Badge variant={order.isPaid ? "success" : "destructive"}>{order.isPaid ? "Paid" : "Unpaid"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No billing records found.</p>
      )}
    </CardContainer>
  )

  const supportContent = (
    <div className="grid gap-4 lg:grid-cols-3">
      <CardContainer title="Create Ticket" className="lg:col-span-1">
        <form className="space-y-4" onSubmit={createTicket}>
          <div className="space-y-3">
            <Label>Subject</Label>
            <Input name="title" placeholder="Speed slow, WiFi issue..." required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea name="description" rows={5} placeholder="Describe the issue..." />
          </div>
          <Button type="submit" disabled={creatingTicket} className="w-full gap-2">
            {creatingTicket ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit Ticket
          </Button>
        </form>
      </CardContainer>

      <CardContainer title="Support Tickets" className="lg:col-span-2">
        {(profile.tickets || []).length > 0 ? (
          <div className="space-y-3">
            {(profile.tickets || []).map((ticketItem) => (
              <div key={ticketItem.id} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <Ticket className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 space-y-1">
                      <div className="font-medium">{ticketItem.title}</div>
                      <div className="text-xs text-muted-foreground">#{ticketItem.ticketNumber} - {formatDate(ticketItem.createdAt)}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">{ticketItem.status}</Badge>
                </div>
                <div className="mt-3 rounded-md bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
                  {ticketItem.description?.trim() || "No description provided."}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ticketItem.priority && <Badge variant="secondary">Priority: {ticketItem.priority}</Badge>}
                  {ticketItem.category && <Badge variant="secondary">Category: {ticketItem.category}</Badge>}
                  {ticketItem.resolution && <Badge variant="success">Resolved</Badge>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No support tickets yet.</p>
        )}
      </CardContainer>
    </div>
  )

  if (initialTab === "support") {
    return <div className="mx-auto max-w-7xl space-y-6 pb-24 md:pb-10">{header}{supportContent}</div>
  }

  if (initialTab === "billing") {
    return <div className="mx-auto max-w-7xl space-y-6 pb-24 md:pb-10">{header}{billingContent}</div>
  }

  if (initialTab === "overview") {
    return (
      <div className="mx-auto max-w-7xl space-y-6 pb-24 md:pb-10">
        {header}
        {dashboardStats}
        <div className="grid gap-4 lg:grid-cols-2">
          <CardContainer title="Connection Details">
            <InfoGrid rows={[
              ["PPPoE Username", wanConnection?.username || profile.connectionUsers?.[0]?.username || "N/A"],
              ["WAN IP", wanConnection?.externalIPAddress || wanConnection?.ipAddress || profile.tr069Devices?.[0]?.ipAddress || "N/A"],
              ["Branch", profile.branch?.name || "N/A"],
              ["Plan End", formatDate(profile.activeSubscription?.planEnd)],
              ["Model", deviceInfo?.deviceInfo?.modelName || profile.tr069Devices?.[0]?.modelName || "N/A"],
              ["Firmware", deviceInfo?.deviceInfo?.softwareVersion || deviceInfo?.deviceInfo?.firmwareVersion || "N/A"],
            ]} />
          </CardContainer>
          <CardContainer title="Recent Billing">
            {recentOrders.length > 0 ? (
              <div className="space-y-2">
                {recentOrders.slice(0, 4).map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="font-medium">{order.invoiceId || `ORDER-${order.id}`}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(order.orderDate)}</div>
                    </div>
                    <Badge variant={order.isPaid ? "success" : "destructive"}>{money(order.totalAmount)}</Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No billing records found.</p>}
          </CardContainer>
          <CardContainer title="Customer Details">
            <InfoGrid rows={[
              ["Full Name", customerName],
              ["Email", profile.lead?.email || "N/A"],
              ["Phone", profile.lead?.phoneNumber || "N/A"],
              ["Address", profile.lead?.address || "N/A"],
              ["Customer ID", profile.customerUniqueId || "N/A"],
              ["Documents", `${(profile.documents || []).length} uploaded`],
            ]} />
          </CardContainer>
          <CardContainer title="Documents">
            {(profile.documents || []).length > 0 ? (
              <div className="space-y-2">
                {(profile.documents || []).slice(0, 4).map((document) => (
                  <div key={document.id} className="rounded-md border p-3">
                    <div className="font-medium">{document.fileName}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {document.documentType} - {formatFileSize(document.size)} - {formatDate(document.uploadedAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No customer documents uploaded.</p>}
          </CardContainer>
          <CardContainer title="Support Tickets" className="lg:col-span-2">
            {(profile.tickets || []).length > 0 ? (
              <div className="space-y-3">
                {(profile.tickets || []).slice(0, 4).map((ticketItem) => (
                  <div key={ticketItem.id} className="rounded-md border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium">{ticketItem.title}</div>
                        <div className="text-xs text-muted-foreground">#{ticketItem.ticketNumber} - {formatDate(ticketItem.createdAt)}</div>
                      </div>
                      <Badge variant="outline">{ticketItem.status}</Badge>
                    </div>
                    <div className="mt-3 rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">
                      {ticketItem.description?.trim() || "No description provided."}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No support tickets yet.</p>}
          </CardContainer>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Namaste, {customerName}</h1>
          <p className="text-sm text-muted-foreground">
            Customer ID: <span className="font-mono">{profile.customerUniqueId || "N/A"}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={String(profile.status).toLowerCase() === "active" ? "success" : "secondary"}>
            {profile.status || "unknown"}
          </Badge>
          {serial && <Badge variant="outline">ONT: {serial}</Badge>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CardContainer title="Current Plan">
          <div className="space-y-2">
            <PackageLine label={plan?.packageName || planDetails?.planName || "No active package"} value={plan?.packageDuration || "N/A"} />
            <div className="text-2xl font-bold">{planDetails?.downSpeed || 0} Mbps</div>
            <p className="text-xs text-muted-foreground">Upload: {planDetails?.upSpeed || 0} Mbps</p>
          </div>
        </CardContainer>
        <CardContainer title="Billing">
          <div className="space-y-2">
            <div className="text-2xl font-bold">{money(profile.billingSummary?.outstandingAmount)}</div>
            <p className="text-xs text-muted-foreground">{profile.billingSummary?.unpaidCount || 0} unpaid invoice/order</p>
          </div>
        </CardContainer>
        <CardContainer title="Support">
          <div className="space-y-2">
            <div className="text-2xl font-bold">{activeTickets.length}</div>
            <p className="text-xs text-muted-foreground">active support tickets</p>
          </div>
        </CardContainer>
        <CardContainer title="Router">
          <div className="space-y-2">
            <div className="text-2xl font-bold">{deviceInfo?.status || profile.tr069Devices?.[0]?.status || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Last contact: {formatDate(deviceInfo?.lastContact || profile.tr069Devices?.[0]?.lastContact)}</p>
          </div>
        </CardContainer>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="router">Router</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <CardContainer title="Connection Details">
              <InfoGrid
                rows={[
                  ["PPPoE Username", wanConnection?.username || profile.connectionUsers?.[0]?.username || "N/A"],
                  ["WAN IP", wanConnection?.externalIPAddress || wanConnection?.ipAddress || profile.tr069Devices?.[0]?.ipAddress || "N/A"],
                  ["Branch", profile.branch?.name || "N/A"],
                  ["Plan End", formatDate(profile.activeSubscription?.planEnd)],
                  ["Model", deviceInfo?.deviceInfo?.modelName || profile.tr069Devices?.[0]?.modelName || "N/A"],
                  ["Firmware", deviceInfo?.deviceInfo?.softwareVersion || deviceInfo?.deviceInfo?.firmwareVersion || "N/A"],
                  ["RX Power", deviceInfo?.deviceInfo?.rxPower || "N/A"],
                  ["Uptime", deviceInfo?.uptime || deviceInfo?.deviceInfo?.uptime || "N/A"],
                ]}
              />
            </CardContainer>

            <CardContainer title="Connected Devices">
              {deviceLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading router data...
                </div>
              ) : connectedDevices.length > 0 ? (
                <div className="space-y-3">
                  {connectedDevices.slice(0, 8).map((client: any, index: number) => (
                    <div key={`${client.macAddress}-${index}`} className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-3">
                        <Laptop className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium">{client.hostName || "Unknown device"}</div>
                          <div className="text-xs text-muted-foreground">{client.macAddress || "N/A"}</div>
                        </div>
                      </div>
                      <Badge variant={client.active ? "success" : "secondary"}>{client.ipAddress || "N/A"}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No connected devices reported by the ONT.</p>
              )}
            </CardContainer>
          </div>
        </TabsContent>

        <TabsContent value="router" className="space-y-4">
          {routerContent}
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <CardContainer title="Customer Contact Details">
              <InfoGrid
                rows={[
                  ["Full Name", customerName],
                  ["Email", profile.lead?.email || "N/A"],
                  ["Primary Phone", profile.lead?.phoneNumber || "N/A"],
                  ["Secondary Phone", profile.lead?.secondaryContactNumber || "N/A"],
                  ["Gender", profile.lead?.gender || "N/A"],
                  ["Customer ID", profile.customerUniqueId || "N/A"],
                  ["ID Number", profile.idNumber || "N/A"],
                  ["PAN Number", profile.panNo || "N/A"],
                ]}
              />
            </CardContainer>

            <CardContainer title="Address & Account">
              <InfoGrid
                rows={[
                  ["Address", profile.lead?.address || "N/A"],
                  ["Street", profile.lead?.street || "N/A"],
                  ["District", profile.lead?.district || "N/A"],
                  ["Province", profile.lead?.province || "N/A"],
                  ["ISP", profile.isp?.companyName || "N/A"],
                  ["Branch", profile.branch?.name || "N/A"],
                  ["Sub Branch", profile.subBranch?.name || "N/A"],
                  ["Joined", formatDate(profile.createdAt)],
                ]}
              />
            </CardContainer>
          </div>
        </TabsContent>



        <TabsContent value="billing">
          {billingContent}
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          {supportContent}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PackageLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="font-medium">{label}</div>
      <div className="text-sm text-muted-foreground">{value}</div>
    </div>
  )
}

function InfoGrid({ rows }: { rows: Array<[string, any]> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-md border bg-muted/20 p-3">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 break-words font-medium">{String(value ?? "N/A")}</div>
        </div>
      ))}
    </div>
  )
}
