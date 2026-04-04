"use client"

import type React from "react"

import { ArrowUpRight, Users, Wifi, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const stats = [
  {
    title: "Total Users",
    value: "12,345",
    change: "+12%",
    icon: Users,
    gradientFrom: "#10B981",
    gradientTo: "#3B82F6",
  },
  {
    title: "Active Connections",
    value: "10,432",
    change: "+8%",
    icon: Wifi,
    gradientFrom: "#3B82F6",
    gradientTo: "#10B981",
  },
  {
    title: "Monthly Revenue",
    value: "$234,567",
    change: "+15%",
    icon: CreditCard,
    gradientFrom: "#EF4444",
    gradientTo: "#10B981",
  },
  {
    title: "Bandwidth Usage",
    value: "432 TB",
    change: "+23%",
    icon: ArrowUpRight,
    gradientFrom: "#3B82F6",
    gradientTo: "#EF4444",
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
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
