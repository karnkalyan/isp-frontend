"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { StatsDisplay } from "@/components/ui/stats-display"
import { Wifi, Server, Activity, AlertCircle } from "lucide-react"

export function NetworkStats() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsDisplay
        title="Active Devices"
        value="128"
        icon={<Wifi className="h-5 w-5 text-white" />}
        iconColor="#3B82F6"
        change={{ value: 4.2, type: "increase" }}
        subtitle="Connected to network"
        forceDarkMode={!mounted}
      />
      <StatsDisplay
        title="Network Load"
        value="68%"
        icon={<Activity className="h-5 w-5 text-white" />}
        iconColor="#10B981"
        change={{ value: 12.5, type: "increase" }}
        subtitle="Current utilization"
        forceDarkMode={!mounted}
      />
      <StatsDisplay
        title="Servers"
        value="12"
        icon={<Server className="h-5 w-5 text-white" />}
        iconColor="#8B5CF6"
        change={{ value: 0, type: "neutral" }}
        subtitle="All operational"
        forceDarkMode={!mounted}
      />
      <StatsDisplay
        title="Alerts"
        value="3"
        icon={<AlertCircle className="h-5 w-5 text-white" />}
        iconColor="#EF4444"
        change={{ value: 2, type: "decrease" }}
        subtitle="Requires attention"
        forceDarkMode={!mounted}
      />
    </div>
  )
}
