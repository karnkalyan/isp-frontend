"use client"

import { useEffect, useMemo, useState } from "react"
import { Laptop, Loader2, Send, Ticket, Wifi } from "lucide-react"
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
  initialTab?: "overview" | "router" | "contact" | "wifi" | "billing" | "support"
}

function formatDate(value?: string | null) {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString()
}

function money(value?: number | null) {
  return `Rs. ${Number(value || 0).toLocaleString()}`
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

  const serial = profile?.primaryDeviceSerial || profile?.deviceSerials?.[0] || ""
  const ssids = deviceData.wlanInfo?.data?.ssidList || []
  const selectedSsid = ssids.find((ssid: any) => ssid.instance === selectedSsidInstance) || ssids[0]
  const activeTickets = (profile?.tickets || []).filter((ticket) => !["CLOSED", "RESOLVED"].includes(String(ticket.status || "").toUpperCase()))
  const recentOrders = profile?.billingSummary?.recentOrders || []
  const connectedDevices = deviceData.connectedInfo?.data?.connectedDevices || []
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
          <TabsTrigger value="wifi">WiFi</TabsTrigger>
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
          <div className="grid gap-4 lg:grid-cols-2">
            <CardContainer title="Current ONT / TR069">
              <InfoGrid
                rows={[
                  ["Serial Number", serial || "N/A"],
                  ["Status", deviceInfo?.status || profile.tr069Devices?.[0]?.status || "N/A"],
                  ["Manufacturer", deviceInfo?.manufacturer || profile.tr069Devices?.[0]?.manufacturer || "N/A"],
                  ["Product Class", deviceInfo?.productClass || profile.tr069Devices?.[0]?.productClass || "N/A"],
                  ["Model", deviceInfo?.deviceInfo?.modelName || profile.tr069Devices?.[0]?.modelName || "N/A"],
                  ["Firmware", deviceInfo?.deviceInfo?.softwareVersion || deviceInfo?.deviceInfo?.firmwareVersion || "N/A"],
                  ["RX Power", deviceInfo?.deviceInfo?.rxPower || "N/A"],
                  ["Last Contact", formatDate(deviceInfo?.lastContact || profile.tr069Devices?.[0]?.lastContact)],
                ]}
              />
            </CardContainer>

            <CardContainer title="WAN & PPPoE">
              <InfoGrid
                rows={[
                  ["PPPoE Username", wanConnection?.username || profile.connectionUsers?.[0]?.username || "N/A"],
                  ["WAN IP", wanConnection?.externalIPAddress || wanConnection?.ipAddress || profile.tr069Devices?.[0]?.ipAddress || "N/A"],
                  ["Connection Type", wanConnection?.connectionType || wanConnection?.type || "N/A"],
                  ["Service List", wanConnection?.serviceList || "N/A"],
                  ["NAT Enabled", String(wanConnection?.natEnabled ?? "N/A")],
                  ["Uptime", deviceInfo?.uptime || deviceInfo?.deviceInfo?.uptime || "N/A"],
                ]}
              />
            </CardContainer>

            <CardContainer title="WiFi Networks">
              {ssids.length > 0 ? (
                <div className="space-y-3">
                  {ssids.map((ssid: any) => (
                    <div key={ssid.instance} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{ssid.ssid || "Unnamed SSID"}</div>
                          <div className="text-xs text-muted-foreground">{ssid.beaconType || "Security N/A"} - Channel {ssid.channel || "N/A"}</div>
                        </div>
                        <Badge variant={ssid.enable ? "success" : "secondary"}>{ssid.status || (ssid.enable ? "Enabled" : "Disabled")}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{serial ? "No WiFi networks found." : "No linked ONT serial found."}</p>
              )}
            </CardContainer>

            <CardContainer title="Connected Devices">
              {deviceLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading router data...
                </div>
              ) : connectedDevices.length > 0 ? (
                <div className="space-y-2">
                  {connectedDevices.map((client: any, index: number) => (
                    <div key={`${client.macAddress}-${index}`} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <div className="font-medium">{client.hostName || "Unknown device"}</div>
                        <div className="text-xs text-muted-foreground">{client.macAddress || "N/A"} - {client.type || "Client"}</div>
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

        <TabsContent value="wifi" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <CardContainer title="WiFi Networks" className="lg:col-span-1">
              {ssids.length > 0 ? (
                <div className="space-y-3">
                  {ssids.map((ssid: any) => (
                    <button
                      key={ssid.instance}
                      onClick={() => setSelectedSsidInstance(ssid.instance)}
                      className={`w-full rounded-md border p-3 text-left transition-colors ${selectedSsid?.instance === ssid.instance ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{ssid.ssid || "Unnamed SSID"}</span>
                        <Badge variant={ssid.enable ? "success" : "secondary"}>{ssid.status || (ssid.enable ? "Enabled" : "Disabled")}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{ssid.beaconType || "Security N/A"}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{serial ? "No WiFi networks found." : "No linked ONT serial found."}</p>
              )}
            </CardContainer>

            <CardContainer title="Update WiFi" className="lg:col-span-2">
              {selectedSsid ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>SSID Name</Label>
                      <Input value={wifiForm.ssid} onChange={(event) => setWifiForm({ ...wifiForm, ssid: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input
                        type="password"
                        value={wifiForm.password}
                        onChange={(event) => setWifiForm({ ...wifiForm, password: event.target.value })}
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                  </div>
                  <InfoGrid
                    rows={[
                      ["BSSID", selectedSsid.bssid || "N/A"],
                      ["Channel", selectedSsid.channel || "N/A"],
                      ["Security", selectedSsid.beaconType || "N/A"],
                      ["Clients", selectedSsid.associatedDeviceCount || "0"],
                    ]}
                  />
                  <Button onClick={updateWifi} disabled={savingWifi || !serial} className="gap-2">
                    {savingWifi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                    Update WiFi
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a WiFi network to update SSID or password.</p>
              )}
            </CardContainer>
          </div>
        </TabsContent>

        <TabsContent value="billing">
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
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
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
