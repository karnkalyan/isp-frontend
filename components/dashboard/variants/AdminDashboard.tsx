"use client"

import { Activity, RadioTower, Router, Server, ShieldCheck, Wifi } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RealTimeStats } from "@/components/dashboard/real-time-stats"
import { CalendarSystemWidget } from "@/components/dashboard/calendar-system-widget"

export function AdminDashboard() {
  const { user } = useAuth()
  const isAdministrator = user?.role?.name === "Administrator"

  return (
    <div className="oss-dashboard network-command-dashboard space-y-4">
      <header className="network-command-header relative overflow-hidden rounded-[12px] border border-border px-5 py-5 md:px-6">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="network-command-mark hidden size-12 shrink-0 items-center justify-center rounded-[10px] sm:flex">
              <RadioTower className="size-6" />
            </span>
            <div>
              <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-primary">
                <span className="size-1.5 animate-pulse rounded-full bg-[var(--status-success)]" /> Network operations center
              </div>
              <h1 className="text-[25px] font-bold tracking-[-0.025em] text-foreground md:text-[28px]">ISP Command Dashboard</h1>
              <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
                Live visibility across subscribers, access infrastructure, revenue, and service operations.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="h-8 gap-2 rounded-[6px] border-primary/25 bg-transparent px-3 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <Activity className="size-3.5" />Live system
          </Badge>
          {isAdministrator && (
            <Badge variant="outline" className="h-8 gap-2 rounded-[6px] border-[var(--status-warning)]/30 bg-transparent px-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--status-warning)]">
              <ShieldCheck className="size-3.5" />Full access
            </Badge>
          )}
          </div>
        </div>
        <div className="relative z-10 mt-5 grid gap-2 sm:grid-cols-3 lg:max-w-[620px]">
          <CommandSignal icon={Router} label="Access network" value="Monitoring" />
          <CommandSignal icon={Wifi} label="Subscriber edge" value="Live telemetry" />
          <CommandSignal icon={Server} label="Core services" value="Operational" />
        </div>
      </header>

      <StatsCards />

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.22fr)_minmax(390px,.98fr)]">
        <div className="min-w-0">
          <div className="mb-2 px-1">
            <h2 className="text-[18px] font-semibold">Performance Analytics</h2>
            <p className="text-xs text-muted-foreground">Visualizing revenue and growth trends</p>
          </div>
          <RevenueChart />
          <Card className="network-surface mt-4">
            <CardHeader className="border-b px-4 py-3">
              <CardTitle className="text-[16px]">Network Status</CardTitle>
              <CardDescription className="text-xs">Real-time network infrastructure overview</CardDescription>
            </CardHeader>
            <CardContent className="p-3"><RealTimeStats /></CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 auto-rows-max content-start gap-4">
          <Card className="network-surface">
            <CardHeader className="px-4 pb-2 pt-3">
              <CardTitle className="text-[16px]">Quick Actions</CardTitle>
              <CardDescription className="text-xs">Essential tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-1"><QuickActions /></CardContent>
          </Card>
          <div className="relative min-w-0 isolate"><CalendarSystemWidget /></div>
          <div className="relative min-w-0 isolate"><ActivityFeed /></div>
        </div>
      </section>
    </div>
  )
}

function CommandSignal({ icon: Icon, label, value }: { icon: typeof Router; label: string; value: string }) {
  return (
    <div className="network-signal flex items-center gap-2.5 rounded-[8px] border border-border/80 px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="truncate text-[9px] uppercase tracking-[.12em] text-muted-foreground">{label}</p>
        <p className="truncate text-[11px] font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}
