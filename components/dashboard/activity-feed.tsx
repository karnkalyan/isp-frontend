"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle2, Clock, EllipsisVertical, MessageSquare, RefreshCw, Ticket, UserPlus, XCircle } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await apiRequest<{ success: boolean; data: any[] }>("/dashboard/recent-activity")
      if (response?.success) setActivities(response.data)
    } catch (error) {
      console.error("Failed to fetch recent activity:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
    const interval = setInterval(fetchActivities, 120000)
    return () => clearInterval(interval)
  }, [])

  const iconFor = (activity: any) => {
    if (activity.type === "lead") return UserPlus
    if (activity.type === "ticket") return Ticket
    if (activity.status === "success") return CheckCircle2
    if (activity.status === "error") return XCircle
    return Clock
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 border-b px-4 py-3">
        <div>
          <CardTitle className="text-[16px]">Recent Activities</CardTitle>
          <CardDescription className="text-xs">Latest system activities and updates</CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/admin/audit-log" className="text-[10px] font-medium text-primary hover:underline">View All</Link>
          <Button variant="ghost" size="icon-sm" onClick={fetchActivities} disabled={loading} aria-label="Refresh activities"><RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} /></Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-1">
        {loading && activities.length === 0 ? (
          <div className="flex h-24 items-center justify-center"><RefreshCw className="size-5 animate-spin text-muted-foreground" /></div>
        ) : activities.length ? (
          <div>
            {activities.slice(0, 4).map((activity, index) => {
              const Icon = iconFor(activity)
              return (
                <div key={activity.id || index} className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-[6px] ${activity.status === "error" ? "bg-[var(--status-danger-bg)] text-[var(--status-danger)]" : index % 2 ? "bg-[var(--status-success-bg)] text-[var(--status-success)]" : "bg-[var(--status-info-bg)] text-[var(--status-info)]"}`}><Icon className="size-3.5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-foreground">{activity.title}</p>
                    <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : activity.description}</p>
                  </div>
                  <EllipsisVertical className="size-3.5 text-muted-foreground" />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-24 flex-col items-center justify-center text-muted-foreground"><MessageSquare className="mb-2 size-5" /><p className="text-[10px]">No recent activity</p></div>
        )}
      </CardContent>
    </Card>
  )
}
