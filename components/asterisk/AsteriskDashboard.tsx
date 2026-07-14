"use client"

import { useState, useEffect, useCallback } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle, RefreshCw, Activity, Wifi,
  Server, Search, Globe, PhoneCall
} from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"

interface AsteriskStatus {
  service: string
  configured: boolean
  isActive: boolean
  amiHost?: string
  amiPort?: number
  ariHost?: string
  ariPort?: number
  apiConnected: boolean
  amiConnected: boolean
  apiError?: string | null
  lastUpdated: string
  message?: string
}

interface Extension {
  number: string
  name: string
  status: string
  type: string
  registered?: boolean
}

interface Trunk {
  id: string
  trunkname: string
  trunktype: string
  status: string
  host: string
}

interface ActiveCall {
  channelid: string
  caller: string
  called: string
  status: string
  startTime: string
  duration: number
}

interface CallLog {
  id: number
  caller: string
  destination: string
  duration: number
  status: string
  startTime: string
}

interface AsteriskDashboardProps {
  ispId: number
}

export default function AsteriskDashboard({ ispId }: AsteriskDashboardProps) {
  const [status, setStatus] = useState<AsteriskStatus | null>(null)
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [trunks, setTrunks] = useState<Trunk[]>([])
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([])
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("extensions")
  const [searchTerm, setSearchTerm] = useState("")
  const [serverDown, setServerDown] = useState(false)
  
  // Make call state
  const [callFrom, setCallFrom] = useState("")
  const [callTo, setCallTo] = useState("")
  const [makingCall, setMakingCall] = useState(false)

  // Fetch Asterisk Service Status
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiRequest<AsteriskStatus>('/asterisk/status')
      setStatus(data)
      setServerDown(false)
    } catch (error: any) {
      console.error("❌ Error fetching Asterisk status:", error)
      setServerDown(true)
      toast.error("Failed to fetch Asterisk status. Verify backend connection.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch Extensions (triggers sync on backend)
  const fetchExtensions = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: Extension[] }>('/asterisk/extensions')
      if (response.success) {
        setExtensions(response.data || [])
      }
    } catch (error) {
      console.error("❌ Error fetching Asterisk extensions:", error)
    }
  }, [])

  // Fetch Trunks (triggers sync on backend)
  const fetchTrunks = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: Trunk[] }>('/asterisk/trunks')
      if (response.success) {
        setTrunks(response.data || [])
      }
    } catch (error) {
      console.error("❌ Error fetching Asterisk trunks:", error)
    }
  }, [])

  // Fetch Active Calls
  const fetchActiveCalls = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: ActiveCall[] }>('/asterisk/calls/active')
      if (response.success) {
        setActiveCalls(response.data || [])
      }
    } catch (error) {
      console.error("❌ Error fetching Asterisk active calls:", error)
    }
  }, [])

  // Fetch Call Logs
  const fetchCallLogs = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: CallLog[] }>('/asterisk/calls/logs')
      if (response.success) {
        setCallLogs(response.data || [])
      }
    } catch (error) {
      console.error("❌ Error fetching Asterisk call logs:", error)
    }
  }, [])

  const handleRefreshAll = async () => {
    setLoading(true)
    await Promise.all([
      fetchStatus(),
      fetchExtensions(),
      fetchTrunks(),
      fetchActiveCalls(),
      fetchCallLogs()
    ])
    setLoading(false)
    toast.success("Asterisk data refreshed")
  }

  const handleSyncSystem = async () => {
    try {
      toast.loading("Syncing Asterisk system status...", { id: "sync" })
      const response = await apiRequest<any>('/asterisk/system/sync', { method: 'POST' })
      if (response.success) {
        toast.success("System status synced successfully", { id: "sync" })
        handleRefreshAll()
      } else {
        toast.error(response.error || "Sync failed", { id: "sync" })
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sync system status", { id: "sync" })
    }
  }

  const handleHangup = async (channelid: string) => {
    try {
      const response = await apiRequest<any>('/asterisk/calls/hangup', {
        method: 'POST',
        body: JSON.stringify({ channelid })
      })
      if (response.success) {
        toast.success("Hangup command sent")
        fetchActiveCalls()
      } else {
        toast.error(response.error || "Hangup failed")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to hang up call")
    }
  }

  const handleMakeCall = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!callFrom || !callTo) {
      toast.error("Please enter both extension and destination number")
      return
    }

    try {
      setMakingCall(true)
      const response = await apiRequest<any>('/asterisk/calls/make', {
        method: 'POST',
        body: JSON.stringify({ extension: callFrom, number: callTo })
      })

      if (response.success) {
        toast.success(response.message || "Call initiated successfully")
        setCallTo("")
        fetchActiveCalls()
      } else {
        toast.error(response.error || "Call origination failed")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to originate call")
    } finally {
      setMakingCall(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (!status?.configured || !status?.isActive) return
    fetchExtensions()
    fetchTrunks()
    fetchActiveCalls()
    fetchCallLogs()
  }, [status?.configured, status?.isActive, fetchExtensions, fetchTrunks, fetchActiveCalls, fetchCallLogs])

  // Filtered Extensions based on Search
  const filteredExtensions = extensions.filter(ext =>
    ext.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ext.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ext.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filtered Trunks based on Search
  const filteredTrunks = trunks.filter(t =>
    t.trunkname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.host.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && !status) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Asterisk integration status...</p>
        </div>
      </div>
    )
  }

  if (!status?.configured || !status?.isActive) {
    return (
      <CardContainer title="Asterisk Service" description="Asterisk service not configured for ISP">
        <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium">Asterisk service not configured for ISP</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure and enable the Asterisk PBX service before extensions, trunks, calls, and logs are shown.
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <a href="/services">Configure Service</a>
          </Button>
        </div>
      </CardContainer>
    )
  }

  return (
    <div className="space-y-6">
      {/* Configuration Status Card */}
      <CardContainer
        title="Asterisk VoIP Service Status"
        actions={[
          {
            label: "Sync System",
            onClick: handleSyncSystem,
            icon: <RefreshCw className="h-4 w-4" />,
            variant: "outline"
          },
          {
            label: "Refresh All",
            onClick: handleRefreshAll,
            icon: <RefreshCw className="h-4 w-4" />,
            variant: "outline"
          }
        ]}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className={`h-4 w-4 ${status?.isActive ? 'text-green-500' : 'text-amber-500'}`} />
                <span className="text-sm font-medium">Service</span>
              </div>
              <Badge variant={status?.isActive ? "success" : "secondary"}>
                {status?.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Asterisk Integration Status</p>
          </div>

          <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi className={`h-4 w-4 ${status?.apiConnected ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm font-medium">ARI API</span>
              </div>
              <Badge variant={status?.apiConnected ? "success" : "destructive"}>
                {status?.apiConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Asterisk REST API (ARI)</p>
          </div>

          <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className={`h-4 w-4 ${status?.amiConnected ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm font-medium">AMI Connection</span>
              </div>
              <Badge variant={status?.amiConnected ? "success" : "destructive"}>
                {status?.amiConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Asterisk Manager Interface</p>
          </div>

          <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Host Address</span>
              </div>
              <span className="text-sm font-mono">{status?.ariHost || "N/A"}</span>
            </div>
            <p className="text-xs text-muted-foreground">Server Connection Endpoint</p>
          </div>
        </div>
      </CardContainer>

      {/* Make Call Card */}
      <CardContainer title="Originate Direct Call">
        <form onSubmit={handleMakeCall} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Call From (Your Extension)</label>
            <Input
              type="text"
              placeholder="e.g. 1001"
              value={callFrom}
              onChange={(e) => setCallFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Call To (Destination Number)</label>
            <Input
              type="text"
              placeholder="e.g. 9841234567"
              value={callTo}
              onChange={(e) => setCallTo(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={makingCall || !status?.apiConnected} className="w-full">
            <PhoneCall className="mr-2 h-4 w-4" />
            {makingCall ? "Originating..." : "Start Call"}
          </Button>
        </form>
      </CardContainer>

      {/* Main Tabs */}
      <Tabs defaultValue="extensions" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-muted/60 p-1">
          <TabsTrigger value="extensions">Extensions ({extensions.length})</TabsTrigger>
          <TabsTrigger value="trunks">Trunks ({trunks.length})</TabsTrigger>
          <TabsTrigger value="active">Active Calls ({activeCalls.length})</TabsTrigger>
          <TabsTrigger value="logs">Call Logs ({callLogs.length})</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {/* Search bar for list tabs */}
          {(activeTab === "extensions" || activeTab === "trunks") && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          {/* Extensions Content */}
          <TabsContent value="extensions" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredExtensions.map((ext) => (
                <div key={ext.number} className="rounded-lg border dark:border-gray-800 p-4 bg-card hover:bg-accent/40 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{ext.number}</h3>
                      <p className="text-sm text-muted-foreground">{ext.name}</p>
                    </div>
                    <Badge variant={ext.status === "Registered" ? "success" : "secondary"}>
                      {ext.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-2 border-t border-border">
                    <span>Type: <b>{ext.type}</b></span>
                    <span>Direct dialing available</span>
                  </div>
                </div>
              ))}

              {filteredExtensions.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                  No extensions found matching your search.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Trunks Content */}
          <TabsContent value="trunks" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredTrunks.map((t) => (
                <div key={t.id} className="rounded-lg border dark:border-gray-800 p-4 bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{t.trunkname}</h3>
                      <p className="text-xs font-mono text-muted-foreground">{t.host || "Direct Peer"}</p>
                    </div>
                    <Badge variant={t.status === "Registered" ? "success" : "secondary"}>
                      {t.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-4 pt-2 border-t border-border">
                    Type: <b className="uppercase">{t.trunktype}</b>
                  </div>
                </div>
              ))}

              {filteredTrunks.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                  No trunks found.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Active Calls Content */}
          <TabsContent value="active" className="mt-0">
            <div className="rounded-lg border dark:border-gray-800 bg-card overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 font-medium text-muted-foreground">
                    <th className="p-3">Channel ID</th>
                    <th className="p-3">Caller</th>
                    <th className="p-3">Called</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCalls.map((call) => (
                    <tr key={call.channelid} className="border-b hover:bg-accent/20">
                      <td className="p-3 font-mono text-xs">{call.channelid}</td>
                      <td className="p-3">{call.caller}</td>
                      <td className="p-3">{call.called}</td>
                      <td className="p-3">
                        <Badge variant="success" className="animate-pulse">{call.status}</Badge>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleHangup(call.channelid)}
                        >
                          Hang up
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {activeCalls.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No active calls at this time.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Call Logs Content */}
          <TabsContent value="logs" className="mt-0">
            <div className="rounded-lg border dark:border-gray-800 bg-card overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 font-medium text-muted-foreground">
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Caller</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {callLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-accent/20">
                      <td className="p-3">{new Date(log.startTime).toLocaleString()}</td>
                      <td className="p-3">{log.caller}</td>
                      <td className="p-3">{log.destination}</td>
                      <td className="p-3">{log.duration}s</td>
                      <td className="p-3">
                        <Badge variant={log.status === "ANSWERED" ? "success" : "destructive"}>
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}

                  {callLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No call logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
