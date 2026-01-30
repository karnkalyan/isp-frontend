"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Phone, Users, BarChart3, RefreshCw, Activity, Wifi, Clock } from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import MakeCallModal from "./MakeCallModal"
import ExtensionsList from "./ExtensionsList"
import CallLogsTable from "./CallLogsTable"
import ActiveCalls from "./ActiveCalls"
import CallDashboard from "./CallDashboard"

interface YeastarStatus {
    serviceConfigured: boolean
    serviceActive: boolean
    listenerActive: boolean
    apiConnected: boolean
    pbxIp?: string
    uptime?: number
    lastUpdated: string
    error?: string
}

export function YeastarDashboard() {
    const [status, setStatus] = useState<YeastarStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [makeCallModalOpen, setMakeCallModalOpen] = useState(false)

    const fetchStatus = async () => {
        try {
            const data = await apiRequest<YeastarStatus>('/yeaster/status')
            setStatus(data)
        } catch (error: any) {
            console.error("Error fetching Yeastar status:", error)
            toast.error("Failed to fetch Yeastar status")
        } finally {
            setLoading(false)
        }
    }

    const handleStartListener = async () => {
        try {
            await apiRequest('/yeastar/listener/start', { method: 'POST' })
            toast.success("Listener started")
            fetchStatus()
        } catch (error: any) {
            toast.error(error.message || "Failed to start listener")
        }
    }

    const handleStopListener = async () => {
        try {
            await apiRequest('/yeastar/listener/stop', { method: 'POST' })
            toast.success("Listener stopped")
            fetchStatus()
        } catch (error: any) {
            toast.error(error.message || "Failed to stop listener")
        }
    }

    useEffect(() => {
        fetchStatus()
    }, [])

    if (loading) {
        return (
            <CardContainer title="Yeastar Dashboard">
                <div className="flex justify-center items-center py-12">
                    <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                </div>
            </CardContainer>
        )
    }

    if (!status?.serviceConfigured) {
        return (
            <CardContainer title="Yeastar Dashboard">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-amber-800">
                                Yeastar Service Not Configured
                            </h3>
                            <div className="mt-2 text-sm text-amber-700">
                                <p>
                                    Please configure Yeastar service in the Service Management section.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContainer>
        )
    }

    return (
        <>
            <MakeCallModal
                open={makeCallModalOpen}
                onOpenChange={setMakeCallModalOpen}
                onSuccess={() => {
                    setMakeCallModalOpen(false)
                    toast.success("Call initiated")
                }}
            />

            <div className="space-y-6">
                {/* Status Bar */}
                <CardContainer title="Service Status">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Activity className={`h-4 w-4 ${status.serviceActive ? 'text-green-500' : 'text-amber-500'}`} />
                                    <span className="text-sm font-medium">Service</span>
                                </div>
                                <Badge variant={status.serviceActive ? "success" : "secondary"}>
                                    {status.serviceActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Yeastar service
                            </p>
                        </div>

                        <div className="rounded-lg border p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {status.apiConnected ? (
                                        <Wifi className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Wifi className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className="text-sm font-medium">API</span>
                                </div>
                                <Badge variant={status.apiConnected ? "success" : "destructive"}>
                                    {status.apiConnected ? "Connected" : "Disconnected"}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                HTTP API connection
                            </p>
                        </div>

                        <div className="rounded-lg border p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {status.listenerActive ? (
                                        <Activity className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-amber-500" />
                                    )}
                                    <span className="text-sm font-medium">TCP Listener</span>
                                </div>
                                <Badge variant={status.listenerActive ? "success" : "secondary"}>
                                    {status.listenerActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Event listener
                            </p>
                        </div>

                        <div className="rounded-lg border p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium">PBX IP</span>
                                </div>
                                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                    {status.pbxIp || "Not set"}
                                </code>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Server address
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={fetchStatus}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMakeCallModalOpen(true)}
                        >
                            <Phone className="mr-2 h-4 w-4" />
                            Make Call
                        </Button>

                        {status.listenerActive ? (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleStopListener}
                                className="text-red-600 hover:text-red-700"
                            >
                                Stop Listener
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleStartListener}
                                className="text-green-600 hover:text-green-700"
                            >
                                Start Listener
                            </Button>
                        )}
                    </div>
                </CardContainer>

                {/* Main Tabs */}
                <Tabs defaultValue="extensions" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="extensions" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Extensions
                        </TabsTrigger>
                        <TabsTrigger value="active-calls" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Active Calls
                        </TabsTrigger>
                        <TabsTrigger value="dashboard" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Call Logs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="extensions" className="space-y-4">
                        <ExtensionsList />
                    </TabsContent>

                    <TabsContent value="active-calls" className="space-y-4">
                        <ActiveCalls />
                    </TabsContent>

                    <TabsContent value="dashboard" className="space-y-4">
                        <CallDashboard />
                    </TabsContent>

                    <TabsContent value="logs" className="space-y-4">
                        <CallLogsTable />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
}