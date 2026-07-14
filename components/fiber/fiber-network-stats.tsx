"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Cable, Loader2, Signal, Users } from "lucide-react"
import { motion } from "framer-motion"
import { fetchFiberNetworkDataset, type FiberNetworkDataset } from "@/lib/fiber-network-data"

export function FiberNetworkStats() {
  const [dataset, setDataset] = useState<FiberNetworkDataset | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    fetchFiberNetworkDataset()
      .then((data) => {
        if (mounted) setDataset(data)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const stats = [
    {
      title: "Fiber Networks",
      value: dataset?.stats.totalNetworks ?? 0,
      icon: Cable,
      gradientFrom: "#3B82F6",
      gradientTo: "#10B981",
    },
    {
      title: "Active Subscribers",
      value: dataset?.stats.activeSubscribers ?? 0,
      icon: Users,
      gradientFrom: "#10B981",
      gradientTo: "#3B82F6",
    },
    {
      title: "ONT Availability",
      value: dataset?.stats.signalQuality ?? "N/A",
      icon: Signal,
      gradientFrom: "#8B5CF6",
      gradientTo: "#3B82F6",
    },
    {
      title: "Network Alerts",
      value: dataset?.stats.activeAlerts ?? 0,
      icon: AlertTriangle,
      gradientFrom: "#F59E0B",
      gradientTo: "#EF4444",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden shadow-depth">
            <div
              className="absolute inset-0 opacity-10 dark:opacity-20"
              style={{ background: `linear-gradient(135deg, ${stat.gradientFrom}, ${stat.gradientTo})` }}
            />
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stat.value}
                  </p>
                </div>
                <div
                  className="rounded-full p-3"
                  style={{
                    background: `linear-gradient(135deg, ${stat.gradientFrom}, ${stat.gradientTo})`,
                    boxShadow: `0 4px 12px ${stat.gradientFrom}40`,
                  }}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
