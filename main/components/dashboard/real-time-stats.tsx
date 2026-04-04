"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { StatsDisplay } from "@/components/ui/stats-display"
import { ArrowUp, ArrowDown, Users, Zap } from "lucide-react"

export function RealTimeStats() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({
    download: "1.2 Gbps",
    upload: "450 Mbps",
    activeUsers: "1,245",
    cpuLoad: "42%",
  })

  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), [])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        download: `${(1 + Math.random() * 0.5).toFixed(1)} Gbps`,
        upload: `${(400 + Math.random() * 100).toFixed(0)} Mbps`,
        activeUsers: `${1200 + Math.floor(Math.random() * 100)}`,
        cpuLoad: `${40 + Math.floor(Math.random() * 10)}%`,
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const statItems = [
    {
      title: "Download Bandwidth",
      value: stats.download,
      icon: <ArrowDown className="h-5 w-5 text-white" />,
      iconColor: "#3B82F6",
      change: { value: 4.2, type: "increase" as const },
      subtitle: "Current throughput",
    },
    {
      title: "Upload Bandwidth",
      value: stats.upload,
      icon: <ArrowUp className="h-5 w-5 text-white" />,
      iconColor: "#10B981",
      change: { value: 12.5, type: "increase" as const },
      subtitle: "Current throughput",
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: <Users className="h-5 w-5 text-white" />,
      iconColor: "#8B5CF6",
      change: { value: 2.3, type: "increase" as const },
      subtitle: "Connected clients",
    },
    {
      title: "System Load",
      value: stats.cpuLoad,
      icon: <Zap className="h-5 w-5 text-white" />,
      iconColor: "#EF4444",
      change: { value: 1.5, type: "decrease" as const },
      subtitle: "CPU utilization",
    },
  ]

  return (
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
  )
}
