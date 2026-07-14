"use client"

import { useState, useEffect } from "react"
import { ClipboardList, ArrowRight, Clock, AlertTriangle } from "lucide-react"
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
import Link from "next/link"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"
import { useWebSocket } from "@/contexts/WebSocketContext"

interface TasksDropdownProps {
  className?: string
}

export function TasksDropdown({ className }: TasksDropdownProps) {
  const [open, setOpen] = useState(false)
  const [tasks, setTasks] = useState<any[]>([])
  const { resolvedTheme } = useTheme()
  const { user } = useAuth()
  const { on } = useWebSocket()
  const isDarkMode = resolvedTheme === "dark"

  const fetchTasks = async () => {
    if (!user) return
    try {
      // Fetch all tasks for the ISP and filter assigned ones
      const data = await apiRequest<any[]>("/tasks")
      if (Array.isArray(data)) {
        const activeAssigned = data.filter((task) => 
          (task.assignedToId === user.id || task.assignedTo?.id === user.id) &&
          ["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(task.status)
        )
        setTasks(activeAssigned)
      } else {
        setTasks([])
      }
    } catch (e) {
      console.error("Error fetching tasks for navbar:", e)
      setTasks([])
    }
  }

  useEffect(() => {
    if (open) {
      fetchTasks()
    }
  }, [open])

  useEffect(() => {
    fetchTasks()
  }, [user])

  useEffect(() => {
    const unsubscribeNotification = on("system.notification", () => {
      fetchTasks()
    })
    const unsubscribeData = on("data.updated", () => {
      fetchTasks()
    })
    return () => {
      unsubscribeNotification()
      unsubscribeData()
    }
  }, [on])

  const activeCount = tasks.length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "ACCEPTED": return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "IN_PROGRESS": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "text-red-500"
      case "HIGH": return "text-orange-500"
      case "MEDIUM": return "text-yellow-500"
      default: return "text-green-500"
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)} aria-label="Tasks">
          <ClipboardList className="h-5 w-5" />
          {activeCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white ring-2 ring-background">
              {activeCount}
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
            <ClipboardList className="h-4 w-4 opacity-70" />
            <span className="font-semibold">My Active Tasks</span>
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white">
                {activeCount}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup className="max-h-[300px] overflow-auto py-1">
          {tasks.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No active assigned tasks</div>
          ) : (
            tasks.slice(0, 5).map((task) => (
              <DropdownMenuItem key={task.id} asChild className="focus:bg-transparent">
                <Link
                  href="/tasks"
                  onClick={() => setOpen(false)}
                  className="flex flex-col items-start w-full p-2.5 rounded-md cursor-pointer transition-all duration-200 hover:bg-primary/5 border-b border-border/10 last:border-0"
                >
                  <div className="flex justify-between items-start w-full gap-2">
                    <span className="text-sm font-medium text-foreground line-clamp-1">{task.title}</span>
                    <Badge variant="outline" className={cn("text-[9px] px-1 h-4 whitespace-nowrap", getStatusColor(task.status))}>
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center w-full mt-1.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.startTime ? new Date(task.startTime).toLocaleDateString([], { month: "short", day: "numeric" }) : "No date"}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <AlertTriangle className={cn("h-3 w-3", getPriorityColor(task.priority))} />
                      <span className={getPriorityColor(task.priority)}>{task.priority}</span>
                    </span>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="opacity-50" />
        <div className="p-2">
          <Link href="/tasks" onClick={() => setOpen(false)} className="w-full">
            <Button variant="outline" size="sm" className="w-full justify-center text-xs h-8">
              View All Tasks
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
