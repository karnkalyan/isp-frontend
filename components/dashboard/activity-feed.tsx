"use client"

import { CardContainer } from "@/components/ui/card-container"
import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

// Define activities with a default value to prevent undefined errors
const activities = [
  {
    id: 1,
    title: "New user registered",
    description: "John Smith signed up for a business plan",
    timestamp: "2 minutes ago",
    status: "success",
  },
  {
    id: 2,
    title: "Payment failed",
    description: "Invoice #12345 payment failed",
    timestamp: "1 hour ago",
    status: "error",
  },
  {
    id: 3,
    title: "Bandwidth limit reached",
    description: "User ID 5678 reached 90% of monthly bandwidth",
    timestamp: "3 hours ago",
    status: "warning",
  },
  {
    id: 4,
    title: "System maintenance completed",
    description: "Server upgrades successfully deployed",
    timestamp: "5 hours ago",
    status: "success",
  },
]

export function ActivityFeed() {
  // Use useState to track both mounted state and theme
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  // Default to dark mode styling for server-side rendering
  // Only use the theme value after mounting to avoid hydration mismatch
  const isDarkMode = mounted ? resolvedTheme === "dark" : true

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
      case "warning":
      default:
        return <Clock className="h-5 w-5 text-amber-500" aria-hidden="true" />
    }
  }

  // Ensure activities is always an array to prevent forEach errors
  const safeActivities = activities || []

  return (
    <CardContainer title="Recent Activity" description="Latest events from your ISP operations" gradientColor="#F59E0B">
      <div className="space-y-1">
        {safeActivities.map((activity) => (
          <div
            key={activity.id}
            className={`flex items-start p-4 ${isDarkMode ? "hover:bg-slate-800/10" : "hover:bg-slate-100/80"}`}
            role="listitem"
            aria-label={`${activity.title}: ${activity.description}`}
          >
            <div className="mt-0.5">{getStatusIcon(activity.status)}</div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{activity.title}</p>
              <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{activity.description}</p>
            </div>
            <div>
              <span
                className={`text-xs rounded-full px-2.5 py-0.5 ${
                  isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-600"
                }`}
              >
                {activity.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className={`p-4 flex justify-center border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
        <Button
          variant="outline"
          className={
            isDarkMode
              ? "text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white"
              : "text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900"
          }
        >
          View All Activity
        </Button>
      </div>
    </CardContainer>
  )
}
