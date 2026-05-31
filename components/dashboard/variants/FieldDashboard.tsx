"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, CheckCircle2, Clock, MapPin, Navigation, Loader2 } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { apiRequest } from "@/lib/api"

export function FieldDashboard() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTasks() {
      try {
        const data = await apiRequest('/tasks')
        setTasks(data?.data || data || [])
      } catch (error) {
        console.error("Failed to fetch tasks:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [])

  const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
  const activeTask = tasks.find(t => t.status === 'IN_PROGRESS' || t.status === 'PENDING')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Field Operations</h1>
        <p className="text-muted-foreground">Your assigned tasks and installation schedule for today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Tasks"
          value={loading ? "..." : pendingTasks.toString()}
          icon={<ClipboardList className="h-4 w-4" />}
          description="Pending assignments"
        />
        <StatsCard
          title="Completed"
          value={loading ? "..." : completedTasks.toString()}
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          description="Success rate: 100%"
        />
        <StatsCard
          title="Travel Time"
          value="45m"
          icon={<Clock className="h-4 w-4" />}
          description="Total estimated"
        />
        <StatsCard
          title="Next Location"
          value={activeTask?.customer?.address || "No active task"}
          icon={<MapPin className="h-4 w-4" />}
          description={activeTask?.customer ? `Customer: ${activeTask.customer.firstName} ${activeTask.customer.lastName}` : "Standby"}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Active Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : !activeTask ? (
              <div className="text-center p-8 text-muted-foreground border rounded-lg bg-primary/5 border-primary/20">No active jobs assigned at the moment.</div>
            ) : (
              <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{activeTask.title}</h3>
                    <p className="text-sm text-muted-foreground">Ticket #{activeTask.id} - Priority: {activeTask.priority}</p>
                  </div>
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded uppercase">{activeTask.status}</span>
                </div>
                <div className="space-y-2 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{activeTask.customer?.address || 'Location pending'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Navigation className="h-3 w-3" />
                    <a href="#" className="text-primary hover:underline font-medium">Open in Google Maps</a>
                  </div>
                  {activeTask.description && (
                    <div className="mt-4 pt-4 border-t text-muted-foreground">
                      {activeTask.description}
                    </div>
                  )}
                </div>
                <button className="w-full mt-4 bg-primary text-primary-foreground py-2 rounded-md font-medium text-sm">
                  Mark as Completed
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Inventory in Bag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Nokia ONT", sn: "SN129930", qty: 2 },
                { name: "Fiber Patch Cord", sn: "-", qty: 10 },
                { name: "Dropwire (m)", sn: "-", qty: 150 },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.sn}</p>
                  </div>
                  <span className="font-bold">x{item.qty}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
