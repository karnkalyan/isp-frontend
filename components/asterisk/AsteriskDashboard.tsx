"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle, RefreshCw, Activity, Wifi,
  Server, Search, Globe, PhoneCall, Phone, Users,
  BarChart3, Settings, ShieldCheck, RadioIcon, Cpu
} from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useWebSocket } from "@/contexts/WebSocketContext"
import AsteriskMakeCallModal from "./AsteriskMakeCallModal"
import AsteriskActiveCalls from "./AsteriskActiveCalls"
import AsteriskCallDashboard from "./AsteriskCallDashboard"
import AsteriskCallLogsTable from "./AsteriskCallLogsTable"
import Link from "next/link"

interface AsteriskCapabilities {
  makeCall: boolean
  hangup: boolean
  transfer: boolean
  attendedTransfer: boolean
  activeCalls: boolean
  park: boolean
  recording: boolean
  monitor: boolean
  whisper: boolean
  barge: boolean
  conference: boolean
  mute: boolean
  hold: boolean
  ami: boolean
  ari: boolean
  ariBridges: boolean
  ariMedia: boolean
  channelTech?: string
}

interface AsteriskStatus {
  service: string
  configured: boolean
  isActive: boolean
  amiConnected: boolean
  ariConnected: boolean
  listenerActive: boolean
  controlConnected: boolean
  controlEngine: string
  amiHost?: string
  amiPort?: number
  ariHost?: string
  ariPort?: number
  version?: string
  capabilities?: AsteriskCapabilities
  lastUpdated: string
  error?: string | null
  message?: string
}

interface Extension {
  number: string
  name: string
  status: string
  type: string
  registered?: boolean
  host?: string
  ip?: string
  port?: number
}

interface Trunk {
  id: string
  trunkname: string
  trunktype: string
  status: string
  host: string
  port?: number
}

interface AsteriskDashboardProps {
  ispId: number
}

function cleanPBXVersion(v?: string): string {
  if (!v) return "Asterisk";
  if (v.startsWith("{")) {
    try {
      const parsed = JSON.parse(v);
      for (const [k, val] of Object.entries(parsed)) {
        if (k.toLowerCase().includes("asterisk")) return `${k}: ${val}`.split("\n")[0];
        if (typeof val === "string" && val.toLowerCase().includes("asterisk")) return val.split("\n")[0];
      }
    } catch {}
  }
  const first = v.split("\n")[0].replace(/--END COMMAND--/g, "").trim();
  const m = first.match(/Asterisk\s+([^\s]+)\s+built\s+by\s+([^\s@]+)/i);
  if (m) return `Asterisk ${m[1]} (${m[2]})`;
  return first || "Asterisk";
}

export default function AsteriskDashboard({ ispId }: AsteriskDashboardProps) {
  const [status, setStatus] = useState<AsteriskStatus | null>(null)
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [trunks, setTrunks] = useState<Trunk[]>([])
  
  const [loading, setLoading] = useState(true)
  const [systemLoading, setSystemLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("extensions")
  const [searchTerm, setSearchTerm] = useState("")
  const [serverDown, setServerDown] = useState(false)
  const [isListenerStarting, setIsListenerStarting] = useState(false)
  const [isListenerStopping, setIsListenerStopping] = useState(false)
  const [makeCallModalOpen, setMakeCallModalOpen] = useState(false)

  // WebSocket Context
  const {
    isConnected: webSocketConnected,
    isAuthenticated: webSocketAuthenticated,
    connectionStatus,
    subscribe,
    on
  } = useWebSocket()

  const hasSetUpListeners = useRef(false)

  // Fetch Asterisk Service Status
  const fetchStatus = useCallback(async (force = false) => {
    try {
      setLoading(true)
      const data = await apiRequest<AsteriskStatus>(`/asterisk/status${force ? '?force=true' : ''}`)
      setStatus(data)
      setServerDown(false)
    } catch (error: any) {
      console.error("❌ Error fetching Asterisk status:", error)
      setServerDown(true)
      setStatus({
        service: "asterisk",
        configured: false,
        isActive: false,
        amiConnected: false,
        ariConnected: false,
        listenerActive: false,
        controlConnected: false,
        controlEngine: "Offline",
        lastUpdated: new Date().toISOString(),
        error: error.message || "Failed to connect to Asterisk service"
      })
      toast.error("Failed to fetch Asterisk status. Verify backend connection.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch Extensions
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

  // Fetch Trunks
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

  const handleRefreshAll = async () => {
    setLoading(true)
    await Promise.all([
      fetchStatus(true),
      fetchExtensions(),
      fetchTrunks()
    ])
    setLoading(false)
    toast.success("Asterisk data refreshed")
  }

  const handleSyncSystem = async () => {
    try {
      setSystemLoading(true)
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
    } finally {
      setSystemLoading(false)
    }
  }

  const handleStartListener = async () => {
    try {
      setIsListenerStarting(true)
      const res = await apiRequest<any>('/asterisk/listener/start', { method: 'POST' })
      if (res.success) {
        toast.success("AMI event listener started")
        fetchStatus()
      } else {
        toast.error(res.error || "Failed to start listener")
      }
    } catch (err: any) {
      toast.error(err.message || "Error starting listener")
    } finally {
      setIsListenerStarting(false)
    }
  }

  const handleStopListener = async () => {
    try {
      setIsListenerStopping(true)
      const res = await apiRequest<any>('/asterisk/listener/stop', { method: 'POST' })
      if (res.success) {
        toast.success("AMI event listener stopped")
        fetchStatus()
      } else {
        toast.error(res.error || "Failed to stop listener")
      }
    } catch (err: any) {
      toast.error(err.message || "Error stopping listener")
    } finally {
      setIsListenerStopping(false)
    }
  }

  // WebSocket event listeners setup
  useEffect(() => {
    if (serverDown || hasSetUpListeners.current) return

    const handleAuth = (data: any) => {
      if (data.ispId === ispId || data.userId) {
        subscribe([
          `isp_${ispId}`,
          'asterisk_calls',
          'asterisk_extensions',
          'asterisk_trunks',
          'asterisk_monitoring'
        ])
      }
    }

    const handleCallStart = (data: any) => {
      if (data.ispId === ispId) {
        toast.success(`Call: ${data.from || data.caller} → ${data.to || data.called}`)
      }
    }

    const handleCallEnd = (data: any) => {
      if (data.ispId === ispId) {
        fetchStatus()
      }
    }

    const handleExtUpdate = (data: any) => {
      if (data.ispId === ispId) {
        fetchExtensions()
      }
    }

    const handleTrunkUpdate = (data: any) => {
      if (data.ispId === ispId) {
        fetchTrunks()
      }
    }

    const handleSystemStatus = (data: any) => {
      if (data.ispId === ispId) {
        setStatus(prev => prev ? { ...prev, ...data, lastUpdated: new Date().toISOString() } : null)
      }
    }

    const unsubAuth = on('authenticated', handleAuth)
    const unsubCallStart = on('asterisk.call.start', handleCallStart)
    const unsubCallEnd = on('asterisk.call.end', handleCallEnd)
    const unsubExt = on('asterisk.extension.updated', handleExtUpdate)
    const unsubTrunk = on('asterisk.trunk.updated', handleTrunkUpdate)
    const unsubSys = on('asterisk.system.status.update', handleSystemStatus)
    const unsubDataSynced = on('asterisk.data.synced', handleRefreshAll)

    hasSetUpListeners.current = true

    return () => {
      unsubAuth()
      unsubCallStart()
      unsubCallEnd()
      unsubExt()
      unsubTrunk()
      unsubSys()
      unsubDataSynced()
      hasSetUpListeners.current = false
    }
  }, [ispId, on, subscribe, serverDown])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (!status?.configured || !status?.isActive) return
    fetchExtensions()
    fetchTrunks()
  }, [status?.configured, status?.isActive, fetchExtensions, fetchTrunks])

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
                Configure and enable the Asterisk PBX service (AMI host, username, password) before extensions, trunks, calls, and logs are shown.
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/services">Configure Service</Link>
          </Button>
        </div>
      </CardContainer>
    )
  }

  const canMakeCall = status?.controlConnected || status?.capabilities?.makeCall

  return (
    <div className="space-y-6">
      {/* Make Call Modal */}
      <AsteriskMakeCallModal
        open={makeCallModalOpen}
        onOpenChange={setMakeCallModalOpen}
        ispId={ispId}
        onSuccess={() => {
          setMakeCallModalOpen(false)
          setActiveTab("active-calls")
        }}
      />

      {/* Configuration Status Card */}
      <CardContainer
        title="Asterisk VoIP Service Status"
        actions={[
          {
            label: "Make Call",
            onClick: () => {
              if (canMakeCall && !serverDown) setMakeCallModalOpen(true)
            },
            icon: <PhoneCall className="h-4 w-4" />,
            variant: "default"
          },
          {
            label: "Sync System",
            onClick: handleSyncSystem,
            icon: <RefreshCw className={`h-4 w-4 ${systemLoading ? 'animate-spin' : ''}`} />,
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
        {/* Real-time WebSocket Bar */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <RadioIcon className={`h-4 w-4 ${webSocketConnected ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
            <span className="text-sm font-medium">Real-time AMI Updates</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={webSocketConnected ? "success" : "secondary"}>
              {webSocketConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant={webSocketAuthenticated ? "success" : "secondary"}>
              {webSocketAuthenticated ? "Authenticated" : "Pending Auth"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Status: {connectionStatus}
            </span>
          </div>
        </div>

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
            <p className="text-xs text-muted-foreground">Control Engine: <b>{status?.controlEngine || "AMI"}</b></p>
          </div>

          <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className={`h-4 w-4 ${status?.amiConnected ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm font-medium">AMI (Baseline)</span>
              </div>
              <Badge variant={status?.amiConnected ? "success" : "destructive"}>
                {status?.amiConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{status?.amiHost || "Configured Host"}:{status?.amiPort || 5038}</p>
          </div>

          <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi className={`h-4 w-4 ${status?.ariConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">ARI (Optional)</span>
              </div>
              <Badge variant={status?.ariConnected ? "success" : "secondary"}>
                {status?.ariConnected ? "Connected" : "Disabled / Offline"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{status?.ariHost ? `${status.ariHost}:${status.ariPort || 8088}` : "Not Configured"}</p>
          </div>

          <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">PBX Version</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs max-w-[220px] truncate" title={status?.version}>
                {cleanPBXVersion(status?.version)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Channel Tech: <b>{status?.capabilities?.channelTech || "Auto"}</b></p>
          </div>
        </div>

        {/* Listener controls */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          {status?.listenerActive ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleStopListener}
              disabled={isListenerStopping}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {isListenerStopping ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              Stop AMI Listener
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleStartListener}
              disabled={isListenerStarting}
              className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              {isListenerStarting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              Start AMI Listener
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncSystem}
            disabled={systemLoading}
          >
            <Cpu className={`mr-2 h-4 w-4 ${systemLoading ? 'animate-spin' : ''}`} />
            Sync PBX Status
          </Button>

          <div className="ml-auto text-xs text-muted-foreground">
            Last Updated: {status?.lastUpdated ? new Date(status.lastUpdated).toLocaleTimeString() : 'N/A'}
          </div>
        </div>
      </CardContainer>

      {/* Main Tabs */}
      <Tabs defaultValue="extensions" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-6 bg-muted/60 p-1">
          <TabsTrigger value="extensions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Extensions ({extensions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="trunks" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">Trunks ({trunks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="active-calls" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Active Calls</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Call Logs</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {/* Extensions Content */}
          <TabsContent value="extensions" className="space-y-4 mt-0">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search extensions by number, name, type..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setMakeCallModalOpen(true)}
                disabled={!canMakeCall}
                className="gap-2 shrink-0"
              >
                <PhoneCall className="h-4 w-4" />
                Originate Call
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredExtensions.map((ext) => (
                <div key={ext.number} className="rounded-lg border dark:border-gray-800 p-4 bg-card hover:bg-accent/40 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{ext.number}</h3>
                      <p className="text-sm text-muted-foreground">{ext.name || `Extension ${ext.number}`}</p>
                    </div>
                    <Badge variant={ext.status === "OK" || ext.status === "Registered" || ext.status === "Available" ? "success" : "secondary"}>
                      {ext.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-2 border-t border-border">
                    <span>Tech: <b>{ext.type || "SIP"}</b></span>
                    <span>{ext.ip ? `${ext.ip}:${ext.port || 5060}` : "Dynamic"}</span>
                  </div>
                </div>
              ))}

              {filteredExtensions.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                  No extensions found matching search criteria.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Trunks Content */}
          <TabsContent value="trunks" className="space-y-4 mt-0">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trunks by name, host..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredTrunks.map((t) => (
                <div key={t.id} className="rounded-lg border dark:border-gray-800 p-4 bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{t.trunkname}</h3>
                      <p className="text-xs font-mono text-muted-foreground">{t.host || "Registered Trunk"}</p>
                    </div>
                    <Badge variant={t.status === "Registered" || t.status === "OK" ? "success" : "secondary"}>
                      {t.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-4 pt-2 border-t border-border flex justify-between">
                    <span>Type: <b className="uppercase">{t.trunktype}</b></span>
                    <span>Port: {t.port || 5060}</span>
                  </div>
                </div>
              ))}

              {filteredTrunks.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                  No Asterisk trunks found.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Active Calls Content */}
          <TabsContent value="active-calls" className="mt-0">
            <AsteriskActiveCalls
              ispId={ispId}
              webSocketConnected={webSocketAuthenticated}
              serverDown={serverDown}
            />
          </TabsContent>

          {/* Call Dashboard Content */}
          <TabsContent value="dashboard" className="mt-0">
            <AsteriskCallDashboard
              ispId={ispId}
              webSocketConnected={webSocketAuthenticated}
              serverDown={serverDown}
            />
          </TabsContent>

          {/* Call Logs Content */}
          <TabsContent value="logs" className="mt-0">
            <AsteriskCallLogsTable
              ispId={ispId}
              serverDown={serverDown}
            />
          </TabsContent>

          {/* System & Capabilities Content */}
          <TabsContent value="system" className="mt-0">
            <CardContainer title="Asterisk System & Dynamic Capabilities" description="Normalized capabilities auto-detected from connected Asterisk PBX">
              <div className="space-y-6">
                <div className="rounded-lg border dark:border-gray-800 p-6 bg-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Feature Capability Matrix
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(status?.capabilities || {}).map(([capKey, enabled]) => {
                      if (typeof enabled !== "boolean") return null
                      return (
                        <div key={capKey} className="flex items-center justify-between p-3 rounded-md bg-muted/40 border">
                          <span className="text-sm font-medium capitalize">
                            {capKey.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <Badge variant={enabled ? "success" : "secondary"}>
                            {enabled ? "Supported" : "Unsupported"}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-lg border dark:border-gray-800 p-6 bg-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Server className="h-5 w-5 text-blue-500" />
                    Transport & Engine Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Baseline Transport:</span>
                      <span className="font-mono font-semibold">AMI (Asterisk Manager Interface)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Optional Transport:</span>
                      <span className="font-mono font-semibold">ARI (Asterisk REST Interface)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Active Engine:</span>
                      <span className="font-semibold text-primary">{status?.controlEngine}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Connected Version:</span>
                      <span className="font-mono">{status?.version || "Asterisk"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContainer>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
