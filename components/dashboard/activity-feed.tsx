"use client"

import { CardContainer } from "@/components/ui/card-container"
import { CheckCircle2, Clock, XCircle, RefreshCw, MessageSquare, UserPlus, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

export function ActivityFeed() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await apiRequest<{ success: boolean; data: any[] }>("/dashboard/recent-activity")
      if (response && response.success) {
        setActivities(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch recent activity:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
    const interval = setInterval(fetchActivities, 120000) // Update every 2 mins
    return () => clearInterval(interval)
  }, [])

  const isDarkMode = mounted ? resolvedTheme === "dark" : true

  const getStatusIcon = (status: string, type: string) => {
    if (type === 'lead') return <UserPlus className="h-5 w-5 text-blue-500" />
    if (type === 'ticket') return <Ticket className="h-5 w-5 text-amber-500" />
    
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
      default:
        return <Clock className="h-5 w-5 text-amber-500" />
    }
  }

  return (
    <CardContainer title="Recent Activity" description="Latest events from your ISP operations" gradientColor="#F59E0B">
      <div className="flex justify-end p-2 -mt-10 mr-2">
        <Button variant="ghost" size="sm" onClick={fetchActivities} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      <div className="space-y-1 min-h-[300px]">
        {loading && activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <RefreshCw className="h-8 w-8 animate-spin mb-2" />
            <p className="text-sm">Loading activity...</p>
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-start p-4 ${isDarkMode ? "hover:bg-slate-800/10" : "hover:bg-slate-100/80"}`}
            >
              <div className="mt-0.5">{getStatusIcon(activity.status, activity.type)}</div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{activity.title}</p>
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{activity.description}</p>
              </div>
              <div>
                <span
                  className={`text-[10px] rounded-full px-2 py-0.5 ${
                    isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : ''}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <MessageSquare className="h-10 w-10 mb-2" />
            <p className="text-sm font-medium">No recent activity</p>
          </div>
        )}
      </div>
      
      <div className={`p-4 flex justify-center border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
        <Button
          variant="outline"
          className="text-xs"
        >
          View All Activity
        </Button>
      </div>
    </CardContainer>
  )
}
