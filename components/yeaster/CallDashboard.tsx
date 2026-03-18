"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, Users, Clock, BarChart3, TrendingUp, TrendingDown, Activity, PieChart } from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { RealTimeApi } from "@/lib/real-time-api"

interface CallStats {
    total: number
    inbound: number
    outbound: number
    internal: number
    answered: number
    missed: number
    totalDuration: number
}

interface DashboardData {
    timestamp: string
    system: any
    extensions: {
        total: number
        active: number
    }
    activeCalls: CallStats
    todayStats: CallStats
    listener: any[]
}

interface CallDashboardProps {
    ispId: number
    realTimeApi: RealTimeApi | null
}

export default function CallDashboard({ ispId, realTimeApi }: CallDashboardProps) {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const response = await apiRequest<{ success: boolean; data: DashboardData }>('/yeaster/calls/dashboard')
            if (response.success) {
                setDashboardData(response.data)
            }
        } catch (error: any) {
            console.error("Error fetching dashboard data:", error)
            toast.error("Failed to fetch dashboard data")
        } finally {
            setLoading(false)
        }
    }

    // Initialize real-time updates
    useEffect(() => {
        if (!realTimeApi) return

        fetchDashboardData()

        // Set up real-time event listeners for dashboard updates
        const unsubscribeCallStart = realTimeApi.on('call:start', () => {
            // Update dashboard stats in real-time
            setDashboardData(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    activeCalls: {
                        ...prev.activeCalls,
                        total: prev.activeCalls.total + 1,
                        timestamp: new Date().toISOString()
                    },
                    todayStats: {
                        ...prev.todayStats,
                        total: prev.todayStats.total + 1,
                        timestamp: new Date().toISOString()
                    }
                }
            })
        })

        const unsubscribeCallEnd = realTimeApi.on('call:end', (data) => {
            // Update dashboard stats in real-time
            setDashboardData(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    activeCalls: {
                        ...prev.activeCalls,
                        total: Math.max(0, prev.activeCalls.total - 1),
                        timestamp: new Date().toISOString()
                    },
                    todayStats: {
                        ...prev.todayStats,
                        answered: data.status === 'ANSWERED' ? prev.todayStats.answered + 1 : prev.todayStats.answered,
                        missed: data.status !== 'ANSWERED' ? prev.todayStats.missed + 1 : prev.todayStats.missed,
                        totalDuration: prev.todayStats.totalDuration + (data.duration || 0),
                        timestamp: new Date().toISOString()
                    }
                }
            })
        })

        const unsubscribeDataSynced = realTimeApi.on('data:synced', () => {
            // Refresh dashboard data when data is synced
            fetchDashboardData()
        })

        // Clean up
        return () => {
            unsubscribeCallStart()
            unsubscribeCallEnd()
            unsubscribeDataSynced()
        }
    }, [realTimeApi])

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`
        } else {
            return `${secs}s`
        }
    }

    const getPercentage = (value: number, total: number) => {
        if (total === 0) return 0
        return Math.round((value / total) * 100)
    }

    if (loading) {
        return (
            <CardContainer title="Call Dashboard">
                <div className="flex justify-center items-center py-12">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
                    </div>
                </div>
            </CardContainer>
        )
    }

    return (
        <CardContainer title="Call Dashboard" description="Real-time call statistics and analytics">
            <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium">Active Calls</span>
                            </div>
                            <Badge variant="outline">
                                {dashboardData?.activeCalls.total || 0}
                            </Badge>
                        </div>
                        <p className="text-2xl font-bold">{dashboardData?.activeCalls.total || 0}</p>
                        <div className="mt-2 flex gap-2 text-xs">
                            <span className="text-green-600">In: {dashboardData?.activeCalls.inbound || 0}</span>
                            <span className="text-blue-600">Out: {dashboardData?.activeCalls.outbound || 0}</span>
                            <span className="text-purple-600">Int: {dashboardData?.activeCalls.internal || 0}</span>
                        </div>
                    </div>

                    <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">Extensions</span>
                            </div>
                            <Badge variant="outline">
                                {dashboardData?.extensions.active || 0}/{dashboardData?.extensions.total || 0}
                            </Badge>
                        </div>
                        <p className="text-2xl font-bold">{dashboardData?.extensions.total || 0}</p>
                        <div className="mt-2 text-xs text-muted-foreground">
                            {dashboardData?.extensions.active || 0} active
                        </div>
                    </div>

                    <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-purple-500" />
                                <span className="text-sm font-medium">Today's Calls</span>
                            </div>
                            <Badge variant="outline">
                                {dashboardData?.todayStats.total || 0}
                            </Badge>
                        </div>
                        <p className="text-2xl font-bold">{dashboardData?.todayStats.total || 0}</p>
                        <div className="mt-2 text-xs">
                            <span className="text-green-600">✓ {dashboardData?.todayStats.answered || 0}</span>
                            <span className="text-red-600 ml-2">✗ {dashboardData?.todayStats.missed || 0}</span>
                        </div>
                    </div>

                    <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-medium">Talk Time</span>
                            </div>
                            <Activity className="h-4 w-4 text-amber-500" />
                        </div>
                        <p className="text-2xl font-bold">
                            {formatDuration(dashboardData?.todayStats.totalDuration || 0)}
                        </p>
                        <div className="mt-2 text-xs text-muted-foreground">
                            Total talk time today
                        </div>
                    </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Call Distribution */}
                    <div className="rounded-lg border dark:border-gray-800 p-6 bg-card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Call Distribution</h3>
                            <PieChart className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Inbound Calls</span>
                                    <span>{dashboardData?.todayStats.inbound || 0} ({getPercentage(dashboardData?.todayStats.inbound || 0, dashboardData?.todayStats.total || 1)}%)</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500"
                                        style={{ width: `${getPercentage(dashboardData?.todayStats.inbound || 0, dashboardData?.todayStats.total || 1)}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Outbound Calls</span>
                                    <span>{dashboardData?.todayStats.outbound || 0} ({getPercentage(dashboardData?.todayStats.outbound || 0, dashboardData?.todayStats.total || 1)}%)</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500"
                                        style={{ width: `${getPercentage(dashboardData?.todayStats.outbound || 0, dashboardData?.todayStats.total || 1)}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Internal Calls</span>
                                    <span>{dashboardData?.todayStats.internal || 0} ({getPercentage(dashboardData?.todayStats.internal || 0, dashboardData?.todayStats.total || 1)}%)</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500"
                                        style={{ width: `${getPercentage(dashboardData?.todayStats.internal || 0, dashboardData?.todayStats.total || 1)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Call Success Rate */}
                    <div className="rounded-lg border dark:border-gray-800 p-6 bg-card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Call Success Rate</h3>
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Answered Calls</span>
                                    <span>{dashboardData?.todayStats.answered || 0} ({getPercentage(dashboardData?.todayStats.answered || 0, dashboardData?.todayStats.total || 1)}%)</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500"
                                        style={{ width: `${getPercentage(dashboardData?.todayStats.answered || 0, dashboardData?.todayStats.total || 1)}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Missed Calls</span>
                                    <span>{dashboardData?.todayStats.missed || 0} ({getPercentage(dashboardData?.todayStats.missed || 0, dashboardData?.todayStats.total || 1)}%)</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500"
                                        style={{ width: `${getPercentage(dashboardData?.todayStats.missed || 0, dashboardData?.todayStats.total || 1)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">Average Call Duration</p>
                                        <p className="text-2xl font-bold">
                                            {dashboardData?.todayStats.total && dashboardData.todayStats.answered
                                                ? formatDuration(Math.round(dashboardData.todayStats.totalDuration / dashboardData.todayStats.answered))
                                                : "0s"}
                                        </p>
                                    </div>
                                    <Clock className="h-8 w-8 text-amber-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Health */}
                {dashboardData?.system && (
                    <div className="rounded-lg border dark:border-gray-800 p-6 bg-card">
                        <h3 className="text-lg font-semibold mb-4">System Health</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Device</span>
                                    <span className="text-sm font-medium">{dashboardData.system.devicename || 'PBX'}</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Firmware</span>
                                    <span className="text-sm font-medium">{dashboardData.system.firmwarever || 'Unknown'}</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500" style={{ width: '90%' }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Uptime</span>
                                    <span className="text-sm font-medium">{dashboardData.system.uptime || 'N/A'}</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: '95%' }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Extensions</span>
                                    <span className="text-sm font-medium">{dashboardData.system.extensionstatus || '0/0'}</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500" style={{ width: '80%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Last Updated */}
                <div className="text-center text-sm text-muted-foreground">
                    Last updated: {dashboardData?.timestamp ? new Date(dashboardData.timestamp).toLocaleTimeString() : 'Never'}
                </div>
            </div>
        </CardContainer>
    )
}