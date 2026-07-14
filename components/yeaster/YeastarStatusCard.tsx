"use client"

import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Wifi, WifiOff, RefreshCw, Play, StopCircle, AlertCircle } from "lucide-react"

interface YeastarStatusCardProps {
    status: any
    onStartListener: () => void
    onStopListener: () => void
    onRefresh: () => void
    refreshing: boolean
}

export default function YeastarStatusCard({
    status,
    onStartListener,
    onStopListener,
    onRefresh,
    refreshing
}: YeastarStatusCardProps) {
    const formatUptime = (seconds?: number) => {
        if (!seconds) return "N/A"

        const days = Math.floor(seconds / (3600 * 24))
        const hours = Math.floor((seconds % (3600 * 24)) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)

        if (days > 0) return `${days}d ${hours}h`
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m`
    }

    return (
        <CardContainer title="Service Status">
            <div className="space-y-4">
                {/* Status Indicators */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className={`h-4 w-4 ${status.serviceActive ? 'text-green-500' : 'text-amber-500'}`} />
                                <span className="text-sm font-medium">Service</span>
                            </div>
                            <Badge variant={status.serviceActive ? "success" : "secondary"}>
                                {status.serviceActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Yeastar service configuration
                        </p>
                    </div>

                    <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {status.apiConnected ? (
                                    <Wifi className="h-4 w-4 text-green-500" />
                                ) : (
                                    <WifiOff className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm font-medium">API</span>
                            </div>
                            <Badge variant={status.apiConnected ? "success" : "destructive"}>
                                {status.apiConnected ? "Connected" : "Disconnected"}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            HTTP API connection
                        </p>
                    </div>

                    <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
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
                        <p className="text-xs text-muted-foreground mt-2">
                            Event listener for calls
                        </p>
                    </div>

                    <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium">Uptime</span>
                            </div>
                            <span className="text-sm font-medium">
                                {formatUptime(status.uptime)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Listener uptime
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh Status
                    </Button>

                    {status.listenerActive ? (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onStopListener}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <StopCircle className="mr-2 h-4 w-4" />
                            Stop Listener
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onStartListener}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                            <Play className="mr-2 h-4 w-4" />
                            Start Listener
                        </Button>
                    )}
                </div>

                {/* Status Message */}
                {!status.serviceActive && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-amber-800">
                                    Yeastar service is not active. Please activate it in the Services section.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {!status.apiConnected && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-red-800">
                                    Unable to connect to Yeastar PBX. Please check credentials and network connectivity.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </CardContainer>
    )
}