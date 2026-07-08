"use client"
import React, { useMemo } from "react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { ActiveSessions } from "@/components/dashboard/active-sessions"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RealTimeStats } from "@/components/dashboard/real-time-stats"
import { NepaliCalendarWidget } from "@/components/dashboard/nepali-calendar-widget"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, Shield, MapPin, Users } from "lucide-react"

export function AdminDashboard() {
    const { user } = useAuth()

    const dashboardTitle = useMemo(() => {
        if (!user) return "Dashboard"
        const isGlobal = user.role?.name === 'Administrator' || user.role?.name === 'Global Manager'
        if (isGlobal && !user.selectedBranchId) {
            return user.isp?.companyName || "ISP Dashboard"
        }

        const branchName = user.selectedBranch?.name || user.branch?.name || "Branch"
        return `${branchName} Operations`
    }, [user])

    const dashboardDescription = useMemo(() => {
        if (!user) return ""
        const isGlobal = user.role?.name === 'Administrator' || user.role?.name === 'Global Manager'
        if (isGlobal && !user.selectedBranchId) return "Monitoring system-wide performance and global network health."
        return `Managing operations, tasks, and customer relations for the selected region.`
    }, [user])

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        {dashboardTitle}
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium">
                        {dashboardDescription}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="px-3 py-1 bg-primary/5 border-primary/20 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary uppercase tracking-wider text-xs">Live System</span>
                    </Badge>
                    {user?.role?.name === 'Administrator' && (
                        <Badge variant="outline" className="px-3 py-1 bg-amber-500/5 border-amber-500/20 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-amber-500" />
                            <span className="font-semibold text-amber-500 uppercase tracking-wider text-xs">Full Access</span>
                        </Badge>
                    )}
                </div>
            </div>


            <StatsCards />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-10">
                <Card className="lg:col-span-5 shadow-sm border-muted/60 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold">Performance Analytics</CardTitle>
                            <CardDescription>Visualizing revenue and growth trends</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <RevenueChart />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3 shadow-sm border-muted/60 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
                        <CardDescription>Essential tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <QuickActions />
                    </CardContent>
                </Card>
                <div className="lg:col-span-2 flex flex-col h-full">
                    <NepaliCalendarWidget />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 shadow-sm border-muted/60 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Activity className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Network Sessions</CardTitle>
                                <CardDescription>Live active customer connections</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ActiveSessions />
                    </CardContent>
                </Card>
                <Card className="col-span-3 shadow-sm border-muted/60 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center gap-3 border-b pb-4 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
                            <CardDescription>System-wide event log</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ActivityFeed />
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-muted/60 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center gap-3 border-b pb-4 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold">Infrastructure Metrics</CardTitle>
                        <CardDescription>Real-time OLT and Network Health</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <RealTimeStats />
                </CardContent>
            </Card>
        </div>
    )
}

