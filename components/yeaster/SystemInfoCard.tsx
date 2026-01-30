"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Server, Cpu, HardDrive, Network, Shield, RefreshCw, Wifi, Database } from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"

interface SystemInfoCardProps {
    ispId: number
}

interface SystemInfo {
    version: string
    uptime: number
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkStatus: string
    activeCalls: number
    totalExtensions: number
    totalTrunks: number
    lastBackup: string
    securityLevel: string
}

export default function SystemInfoCard({ ispId }: SystemInfoCardProps) {
    const [info, setInfo] = useState<SystemInfo | null>(null)
    const [loading, setLoading] = useState(false)

    const fetchSystemInfo = async () => {
        try {
            setLoading(true)
            const data = await apiRequest<SystemInfo>(`/yeastar/${ispId}/system/info`)
            setInfo(data)
        } catch (error: any) {
            console.error("Error fetching system info:", error)
            toast.error("Failed to fetch system information")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSystemInfo()
    }, [ispId])

    const formatUptime = (seconds?: number) => {
        if (!seconds) return "N/A"

        const days = Math.floor(seconds / (3600 * 24))
        const hours = Math.floor((seconds % (3600 * 24)) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)

        if (days > 0) return `${days}d ${hours}h`
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m`
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Never"
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getUsageBadge = (usage: number) => {
        if (usage < 60) return <Badge variant="success">{usage}%</Badge>
        if (usage < 80) return <Badge variant="default">{usage}%</Badge>
        return <Badge variant="destructive">{usage}%</Badge>
    }

    const getSecurityBadge = (level: string) => {
        const levels = {
            'high': { variant: 'success' as const, label: 'High' },
            'medium': { variant: 'default' as const, label: 'Medium' },
            'low': { variant: 'destructive' as const, label: 'Low' }
        }

        const info = levels[level.toLowerCase() as keyof typeof levels] || { variant: 'secondary' as const, label: level }
        return <Badge variant={info.variant}>{info.label}</Badge>
    }

    return (
        <CardContainer
            title="System Information"
            actions={[
                {
                    label: "Refresh",
                    onClick: fetchSystemInfo,
                    icon: <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />,
                    variant: "outline",
                    disabled: loading
                }
            ]}
        >
            <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Server className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">System</span>
                        </div>
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Version:</span>
                                <code className="text-xs font-mono">{info?.version || "N/A"}</code>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Uptime:</span>
                                <span>{formatUptime(info?.uptime)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Network className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Network</span>
                        </div>
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant={info?.networkStatus === 'up' ? 'success' : 'destructive'}>
                                    {info?.networkStatus || "Unknown"}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Active Calls:</span>
                                <span className="font-medium">{info?.activeCalls || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resources */}
                <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-3">Resource Usage</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Cpu className="h-4 w-4" />
                                    <span className="text-sm">CPU</span>
                                </div>
                                {getUsageBadge(info?.cpuUsage || 0)}
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${Math.min(info?.cpuUsage || 0, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="h-4 w-4" />
                                    <span className="text-sm">Memory</span>
                                </div>
                                {getUsageBadge(info?.memoryUsage || 0)}
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${Math.min(info?.memoryUsage || 0, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4" />
                                    <span className="text-sm">Disk</span>
                                </div>
                                {getUsageBadge(info?.diskUsage || 0)}
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${Math.min(info?.diskUsage || 0, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Counts & Security */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg border p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{info?.totalExtensions || 0}</div>
                            <div className="text-sm text-muted-foreground">Extensions</div>
                        </div>
                    </div>

                    <div className="rounded-lg border p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{info?.totalTrunks || 0}</div>
                            <div className="text-sm text-muted-foreground">Trunks</div>
                        </div>
                    </div>

                    <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                <span className="text-sm">Security</span>
                            </div>
                            {getSecurityBadge(info?.securityLevel || 'medium')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                            Last backup: {formatDate(info?.lastBackup)}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.success("Feature coming soon")}
                    >
                        System Diagnostics
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.success("Backup initiated")}
                    >
                        Backup Now
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.success("Logs downloaded")}
                    >
                        Download Logs
                    </Button>
                </div>
            </div>
        </CardContainer>
    )
}