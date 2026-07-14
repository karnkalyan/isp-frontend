"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { Users, Wifi, CreditCard, ShoppingCart, Headphones, Receipt } from "lucide-react"
import { apiRequest } from "@/lib/api"

export function StatsCards() {
  const [statsData, setStatsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await apiRequest('/dashboard/summary')
        setStatsData(response?.data || response)
      } catch (error) {
        console.error("Failed to fetch overall stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 min-h-[120px]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-muted rounded-xl border border-border h-[120px]" />
        ))}
      </div>
    )
  }

  const activeCustomers = statsData?.activeCustomers || 0
  const totalCustomers = statsData?.totalCustomers || 0
  
  const stats = [
    {
      title: "Active Customers",
      value: (statsData?.activeCustomers || 0).toLocaleString(),
      change: `${totalCustomers.toLocaleString()} total customers`,
      icon: Users,
      tone: "text-primary bg-secondary",
    },
    {
      title: "Expiring This Week",
      value: (statsData?.expiringThisWeek || 0).toLocaleString(),
      change: "Renewal needed soon",
      icon: ShoppingCart,
      tone: "text-[var(--status-warning)] bg-[var(--status-warning-bg)]",
    },
    {
      title: "Expiring This Month",
      value: (statsData?.expiringThisMonth || 0).toLocaleString(),
      change: "Upcoming renewals",
      icon: Wifi,
      tone: "text-[var(--status-info)] bg-[var(--status-info-bg)]",
    },
    {
      title: "Open Tickets",
      value: (statsData?.openTickets || 0).toLocaleString(),
      change: "Support items needing action",
      icon: Headphones,
      tone: "text-primary bg-secondary",
    },
    {
      title: "Pending Invoices",
      value: (statsData?.pendingInvoices || 0).toLocaleString(),
      change: "Awaiting payment",
      icon: Receipt,
      tone: "text-[var(--status-info)] bg-[var(--status-info-bg)]",
    },
    {
      title: "Expired Users",
      value: (statsData?.expiredUsers || 0).toLocaleString(),
      change: `${statsData?.expiredUsers || 0} disconnected`,
      icon: CreditCard,
      tone: "text-[var(--status-danger)] bg-[var(--status-danger-bg)]",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: React.ElementType
  tone: string
}

function StatCard({ title, value, change, icon: Icon, tone }: StatCardProps) {
  return (
    <div className="rounded-[14px] border bg-card p-4 text-card-foreground shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone}`} aria-hidden="true">
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
      </div>
      <div className="mt-2">
        <div className="font-data text-2xl font-semibold tabular-nums text-foreground">{value}</div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{change}</p>
      </div>
    </div>
  )
}
