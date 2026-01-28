"use client"

import { useState } from "react"
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

type NotificationType = "alert" | "success" | "info"

type Notification = {
  id: string
  title: string
  description: string
  timestamp: string
  type: NotificationType
  read: boolean
}

const notifications: Notification[] = [
  {
    id: "notif-1",
    title: "Network Outage",
    description: "Fiber network outage detected in sector 3. Technicians dispatched.",
    timestamp: "5 min ago",
    type: "alert",
    read: false,
  },
  {
    id: "notif-2",
    title: "Payment Received",
    description: "Customer CUST-042 payment of $89.99 successfully processed.",
    timestamp: "30 min ago",
    type: "success",
    read: false,
  },
  {
    id: "notif-3",
    title: "System Update",
    description: "System maintenance scheduled for tonight at 2:00 AM.",
    timestamp: "1 hour ago",
    type: "info",
    read: true,
  },
]

interface NotificationsDropdownProps {
  className?: string
}

export function NotificationsDropdown({ className }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  const unreadCount = notifications.filter((notif) => !notif.read).length

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getNotificationBgColor = (type: NotificationType) => {
    switch (type) {
      case "alert":
        return "bg-red-500/10"
      case "success":
        return "bg-green-500/10"
      case "info":
        return "bg-blue-500/10"
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)} aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white">
              {unreadCount}
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
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup className="max-h-[300px] overflow-auto py-1">
          {notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="focus:bg-transparent">
              <div
                className={cn(
                  "flex w-full p-2 rounded-md cursor-pointer transition-all duration-200",
                  !notification.read ? "bg-primary/5" : "",
                  "hover:bg-primary/10",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full mr-2",
                    getNotificationBgColor(notification.type),
                  )}
                >
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <p className={cn("text-sm", !notification.read && "font-medium")}>{notification.title}</p>
                      {!notification.read && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-1">
                      {notification.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{notification.description}</p>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="opacity-50" />
        <div className="p-2 flex gap-2">
          <Button variant="outline" size="sm" className="w-full justify-center text-xs h-8">
            View all
          </Button>
          <Button variant="default" size="sm" className="w-full justify-center text-xs h-8">
            Settings
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
