"use client"

import { CardContainer } from "@/components/ui/card-container"
import { Clock, CheckCircle, AlertCircle, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const tasks = [
  {
    id: 1,
    title: "Review new customer applications",
    due: "Today",
    status: "pending",
  },
  {
    id: 2,
    title: "Prepare monthly financial report",
    due: "Yesterday",
    status: "completed",
  },
  {
    id: 3,
    title: "Update network security protocols",
    due: "Tomorrow",
    status: "urgent",
  },
  {
    id: 4,
    title: "Respond to support tickets",
    due: "Today",
    status: "pending",
  },
]

export function TasksList() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // This effect runs on component mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Default to dark mode before mounting (server-side)
  // This ensures the component starts in dark mode when the page loads
  const isDarkMode = !mounted ? true : resolvedTheme === "dark"

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <div className="rounded-full p-2 bg-emerald-500/20">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
        )
      case "urgent":
        return (
          <div className="rounded-full p-2 bg-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )
      case "pending":
      default:
        return (
          <div className="rounded-full p-2 bg-amber-500/20">
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
        )
    }
  }

  return (
    <CardContainer
      title="Tasks Overview"
      description="Your tasks for today"
      gradientColor="#F59E0B"
      forceDarkMode={!mounted} // Force dark mode before client-side hydration
    >
      <div className="space-y-1">
        {(tasks || []).map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-start p-4",
              isDarkMode ? "hover:bg-slate-800/10" : "hover:bg-slate-100/80",
              task.status === "completed" ? "opacity-60" : "",
            )}
          >
            {getStatusIcon(task.status)}
            <div className="ml-3 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  task.status === "completed"
                    ? "line-through text-slate-400"
                    : isDarkMode
                      ? "text-white"
                      : "text-slate-900",
                )}
              >
                {task.title}
              </p>
              <p className={cn("text-xs mt-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>Due: {task.due}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", isDarkMode ? "text-slate-400" : "text-slate-500")}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Task options</span>
            </Button>
          </div>
        ))}
      </div>
      <div className={cn("p-4 flex justify-center border-t", isDarkMode ? "border-slate-800" : "border-slate-200")}>
        <Button
          variant="outline"
          className={cn(
            isDarkMode
              ? "text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white"
              : "text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          View All Tasks
        </Button>
      </div>
    </CardContainer>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
