"use client"

import { useState, useEffect, useCallback } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiRequest } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  Check,
  Trash2,
} from "lucide-react"

interface Notification {
  id: number
  type: string
  title: string
  description?: string
  link?: string
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiRequest<any>("/notifications")
      setNotifications(res?.data || [])
      setUnreadCount(res?.unreadCount || 0)
    } catch (e) {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markAsRead = async (id: number) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PUT" })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      window.dispatchEvent(new CustomEvent("notifications-updated"))
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const markAllRead = async () => {
    try {
      await apiRequest("/notifications/read-all", { method: "PUT" })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      window.dispatchEvent(new CustomEvent("notifications-updated"))
      toast({ title: "All notifications marked as read" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "alert": return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "success": return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "warning": return <AlertTriangle className="h-5 w-5 text-amber-500" />
      default: return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{unreadCount} unread notifications</p>
        </div>
        <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0} className="gap-2">
          <Check className="h-4 w-4" /> Mark All Read
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : notifications.length === 0 ? (
        <CardContainer title="" className="text-center py-16">
          <Bell className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No Notifications</h3>
          <p className="text-sm text-muted-foreground">You're all caught up!</p>
        </CardContainer>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 p-4 rounded-xl border bg-card transition-all hover:shadow-sm ${
                !notif.isRead ? "border-l-4 border-l-primary bg-primary/5" : ""
              }`}
            >
              <div className="mt-0.5">{getIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-sm ${!notif.isRead ? "font-semibold" : "font-medium"}`}>{notif.title}</h3>
                  {!notif.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                {notif.description && <p className="text-sm text-muted-foreground line-clamp-2">{notif.description}</p>}
                <span className="text-xs text-muted-foreground mt-1 block">{new Date(notif.createdAt).toLocaleString()}</span>
              </div>
              {!notif.isRead && (
                <Button variant="ghost" size="sm" onClick={() => markAsRead(notif.id)} className="text-xs shrink-0">
                  <Check className="h-3 w-3 mr-1" /> Read
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
