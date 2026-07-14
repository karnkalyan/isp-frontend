"use client"

import { StatsCards } from "@/components/dashboard/stats-cards"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { UsageChart } from "@/components/dashboard/usage-chart"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { TasksList } from "@/components/dashboard/tasks-list"
import { ProjectStatus } from "@/components/dashboard/project-status"

export function DashboardContent() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, here's an overview of your ISP operations.</p>
        </div>
        <QuickActions />
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <TasksList />
        <ProjectStatus />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UsageChart />
        <RevenueChart />
      </div>

      <ActivityFeed />
    </div>
  )
}
