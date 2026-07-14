"use client"

import { useState, useEffect } from "react"
import { Bell, ArrowRight, AlertTriangle, CheckCircle, Info, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { apiRequest } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useWebSocket } from "@/contexts/WebSocketContext"

type NotificationType = "alert" | "success" | "info" | "warning"

type Notification = {
  id: number
  title: string
  description: string
  createdAt: string
  type: NotificationType
  isRead: boolean
  link?: string
}

interface NotificationsDropdownProps {
  className?: string
}

export function NotificationsDropdown({ className }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"
  const router = useRouter()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const { subscribe, on } = useWebSocket()

  const fetchNotifications = async () => {
    try {
      const res = await apiRequest<any>("/notifications?limit=10")
      if (res) {
        setNotifications(res.data || [])
        setUnreadCount(res.unreadCount || 0)
      }
    } catch (e) {
      // Silently fail - notifications are non-critical
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    // Subscribe to the channel if needed
    subscribe("system.notification")
    
    // Listen for WebSocket notifications
    const unsubscribe = on("system.notification", (data) => {
      // Unshift the new notification to the top to show immediately
      setNotifications(prev => {
        const updated = [data, ...prev];
        return updated.slice(0, 10); // Keep only recent
      });
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    }
  }, [subscribe, on])

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  useEffect(() => {
    const handleUpdate = () => {
      fetchNotifications()
    }
    window.addEventListener("notifications-updated", handleUpdate)
    return () => window.removeEventListener("notifications-updated", handleUpdate)
  }, [])

  const handleMarkRead = async (id: number) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PUT" })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (e) {
      // ignore
    }
  }

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return "Unknown"
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return "Unknown"
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return "Just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getNotificationBgColor = (type: NotificationType) => {
    switch (type) {
      case "alert":
        return "bg-red-500/10"
      case "success":
        return "bg-green-500/10"
      case "warning":
        return "bg-amber-500/10"
      case "info":
      default:
        return "bg-blue-500/10"
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)} aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80"
        align="end"
        style={{
          background: isDarkMode
            ? "linear-gradient(to bottom, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))"
            : "linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(241, 245, 249, 0.95))",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: isDarkMode ? "0 10px 25px -5px rgba(0, 0, 0, 0.5)" : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.8)",
        }}
      >
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2 border-b border-border/20">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 opacity-70" />
            <span className="font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push("/notifications")}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup className="max-h-[300px] overflow-auto py-1">
          {notifications.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="focus:bg-transparent"
                onClick={() => {
                  if (!notification.isRead) handleMarkRead(notification.id)
                  if (notification.link) router.push(notification.link)
                }}
              >
                <div
                  className={cn(
                    "flex w-full p-2 rounded-md cursor-pointer transition-all duration-200",
                    !notification.isRead ? "bg-primary/5" : "",
                    "hover:bg-primary/10",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full mr-2",
                      getNotificationBgColor(notification.type as NotificationType),
                    )}
                  >
                    {getNotificationIcon(notification.type as NotificationType)}
                  </div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <p className={cn("text-sm", !notification.isRead && "font-medium")}>{notification.title}</p>
                        {!notification.isRead && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-1">
                        {getTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{notification.description}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="opacity-50" />
        <div className="p-2 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center text-xs h-8"
            onClick={() => { setOpen(false); router.push("/notifications") }}
          >
            View all
          </Button>
          <Button
            variant="default"
            size="sm"
            className="w-full justify-center text-xs h-8"
            onClick={() => { setOpen(false); router.push("/notifications") }}
          >
            Settings
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
