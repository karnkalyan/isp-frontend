"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ArrowUpRight, Users, Wifi, CreditCard, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { apiRequest } from "@/lib/api"

interface StatsData {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  totalLeads: number
  openTickets: number
  pendingInvoices: number
  totalRevenue: number
  expiringThisWeek: number
  expiringThisMonth: number
  expiredUsers: number
}

export function StatsCards() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await apiRequest<{ success: boolean; data: StatsData }>("/dashboard/summary", { suppressToast: true })
        if (response?.data) {
          setStats(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return <div className="text-muted-foreground">Unable to load dashboard statistics</div>
  }

  const statItems = [
    {
      title: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      change: `${stats.activeCustomers} active`,
      icon: Users,
      gradientFrom: "#10B981",
      gradientTo: "#3B82F6",
    },
    {
      title: "Active Connections",
      value: stats.activeCustomers.toLocaleString(),
      change: `${stats.inactiveCustomers} inactive`,
      icon: Wifi,
      gradientFrom: "#3B82F6",
      gradientTo: "#10B981",
    },
    {
      title: "Total Revenue",
      value: `NRS ${(stats.totalRevenue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      change: `${stats.pendingInvoices} pending`,
      icon: CreditCard,
      gradientFrom: "#EF4444",
      gradientTo: "#10B981",
    },
    {
      title: "Open Tickets",
      value: stats.openTickets.toLocaleString(),
      change: `${stats.expiringThisWeek} expiring this week`,
      icon: ArrowUpRight,
      gradientFrom: "#3B82F6",
      gradientTo: "#EF4444",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: React.ElementType
  gradientFrom: string
  gradientTo: string
}

function StatCard({ title, value, change, icon: Icon, gradientFrom, gradientTo }: StatCardProps) {
  const isPositive = change.startsWith("+")

  return (
    <Card className="overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        }}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div
          className="rounded-full p-2"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          }}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={cn("text-xs font-medium mt-1", isPositive ? "text-green-500" : "text-red-500")}>
          {change} from last month
        </p>
      </CardContent>
    </Card>
  )
}
