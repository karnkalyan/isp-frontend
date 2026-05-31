"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, Activity, Cpu, Globe, Zap } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { BandwidthMonitor } from "@/components/dashboard/bandwidth-monitor"
import { RealTimeStats } from "@/components/dashboard/real-time-stats"
import { apiRequest } from "@/lib/api"

export function TechnicalDashboard() {
  const [loading, setLoading] = useState(true)
  const [onlineOlts, setOnlineOlts] = useState(0)
  const [totalOlts, setTotalOlts] = useState(0)
  const [openTechTickets, setOpenTechTickets] = useState(0)
  const [activeTasks, setActiveTasks] = useState(0)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      
      // 1. Fetch OLTs
      const oltRes = await apiRequest<{ success: boolean; data: any[] }>("/olt")
      if (oltRes && Array.isArray(oltRes.data)) {
        const total = oltRes.data.length
        const online = oltRes.data.filter(olt => olt.status?.toLowerCase() === 'online').length
        setTotalOlts(total)
        setOnlineOlts(online)
      }

      // 2. Fetch Tickets
      const ticketsRes = await apiRequest<{ data: any[] }>("/tickets?status=OPEN&limit=100")
      if (ticketsRes && Array.isArray(ticketsRes.data)) {
        const techTickets = ticketsRes.data.filter(t => 
          t.category?.toLowerCase() === 'technical' || 
          t.category?.toLowerCase() === 'connectivity'
        ).length
        setOpenTechTickets(techTickets)
      }

      // 3. Fetch Tasks
      const tasksRes = await apiRequest<{ data: any[] }>("/tasks")
      if (tasksRes && Array.isArray(tasksRes.data)) {
        const active = tasksRes.data.filter(t => 
          t.status === 'PENDING' || 
          t.status === 'IN_PROGRESS'
        ).length
        setActiveTasks(active)
      }

    } catch (error) {
      console.error("Error loading NOC dashboard metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Network Operations (NOC)</h1>
        <p className="text-muted-foreground">Monitor infrastructure health, OLT performance, and traffic loads.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Backbone Traffic"
          value="4.2 Gbps"
          icon={<Zap className="h-4 w-4" />}
          description="Total egress load"
        />
        <StatsCard
          title="Open Tech Tickets"
          value={loading && openTechTickets === 0 ? "..." : String(openTechTickets)}
          icon={<Activity className="h-4 w-4" />}
          description="Awaiting resolution"
        />
        <StatsCard
          title="Online OLTs"
          value={loading && totalOlts === 0 ? "..." : `${onlineOlts}/${totalOlts}`}
          icon={<Server className="h-4 w-4" />}
          description={`${totalOlts - onlineOlts} offline`}
        />
        <StatsCard
          title="Active Tasks"
          value={loading && activeTasks === 0 ? "..." : String(activeTasks)}
          icon={<Globe className="h-4 w-4" />}
          description="In progress or pending"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <BandwidthMonitor />
        </div>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Hardware Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Core CPU Load</span>
                <span className="font-bold">24%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[24%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>NAS Memory</span>
                <span className="font-bold">62%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[62%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Storage (Logs)</span>
                <span className="font-bold">85%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 w-[85%]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <RealTimeStats />
    </div>
  )
}
