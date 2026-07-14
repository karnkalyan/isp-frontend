"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { StatsDisplay } from "@/components/ui/stats-display"
import { Server, Zap, Activity, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"

export function RealTimeStats() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await apiRequest<{ success: boolean; data: any }>("/olt/stats")
      if (response && response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch OLT stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60000) // Update every 1 min
    return () => clearInterval(interval)
  }, [])

  const statItems = [
    {
      title: "Active OLTs",
      value: stats?.active?.toString() || "0",
      icon: <CheckCircle2 className="h-5 w-5 text-white" />,
      iconColor: "#10B981",
      change: { value: stats?.total || 0, type: "increase" as const },
      subtitle: `Out of ${stats?.total || 0} total nodes`,
    },
    {
      title: "Port Utilization",
      value: `${stats?.portStatistics?.usagePercentage || 0}%`,
      icon: <Zap className="h-5 w-5 text-white" />,
      iconColor: "#3B82F6",
      change: { value: stats?.portStatistics?.used || 0, type: "increase" as const },
      subtitle: `${stats?.portStatistics?.used || 0} ports occupied`,
    },
    {
      title: "Inactive Nodes",
      value: stats?.inactive?.toString() || "0",
      icon: <AlertCircle className="h-5 w-5 text-white" />,
      iconColor: "#EF4444",
      change: { value: 0, type: "decrease" as const },
      subtitle: "Offline or Maintenance",
    },
    {
      title: "System Status",
      value: stats?.total > 0 ? "Stable" : "No Nodes",
      icon: <Activity className="h-5 w-5 text-white" />,
      iconColor: "#8B5CF6",
      change: { value: 99.9, type: "increase" as const },
      subtitle: "Core infrastructure health",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading} className="gap-2 text-xs">
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, index) => (
          <StatsDisplay
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconColor={stat.iconColor}
            change={stat.change}
            subtitle={stat.subtitle}
            forceDarkMode={!mounted}
          />
        ))}
      </div>
    </div>
  )
}
