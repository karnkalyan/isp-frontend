"use client"

import { StatsCard } from "@/components/stats-card"
import { ActivityFeed } from "@/components/activity-feed"
import { UsageChart } from "@/components/usage-chart"
import { RevenueChart } from "@/components/revenue-chart"
import { QuickActions } from "@/components/quick-actions"
import { ArrowUpRight, Users, Wifi, CreditCard } from "lucide-react"

export function DashboardContent() {
  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, here's an overview of your ISP operations.</p>
        </div>
        <QuickActions />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value="12,345"
          change="+12%"
          icon={Users}
          gradientStart="#10B981"
          gradientEnd="#3B82F6"
        />
        <StatsCard
          title="Active Connections"
          value="10,432"
          change="+8%"
          icon={Wifi}
          gradientStart="#3B82F6"
          gradientEnd="#10B981"
        />
        <StatsCard
          title="Monthly Revenue"
          value="$234,567"
          change="+15%"
          icon={CreditCard}
          gradientStart="#EF4444"
          gradientEnd="#10B981"
        />
        <StatsCard
          title="Bandwidth Usage"
          value="432 TB"
          change="+23%"
          icon={ArrowUpRight}
          gradientStart="#3B82F6"
          gradientEnd="#EF4444"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <UsageChart />
        <RevenueChart />
      </div>

      <ActivityFeed />
    </div>
  )
}
