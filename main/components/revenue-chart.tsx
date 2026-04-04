"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

const quarterlyData = [
  { month: "Jan", revenue: 45000, expenses: 32000 },
  { month: "Feb", revenue: 52000, expenses: 34000 },
  { month: "Mar", revenue: 48000, expenses: 33000 },
]

const yearlyData = [
  { month: "Q1", revenue: 145000, expenses: 99000 },
  { month: "Q2", revenue: 165000, expenses: 105000 },
  { month: "Q3", revenue: 155000, expenses: 102000 },
  { month: "Q4", revenue: 172000, expenses: 110000 },
]

export function RevenueChart() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("quarterly")

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card className="glass-bg border-none shadow-depth">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Financial performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  const getChartData = () => {
    return activeTab === "yearly" ? yearlyData : quarterlyData
  }

  return (
    <Card className="glass-bg border-none shadow-depth">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Financial performance</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="quarterly" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </div>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`revenueGradient-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id={`expensesGradient-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
                />
                <Bar
                  dataKey="revenue"
                  fill={`url(#revenueGradient-${activeTab})`}
                  radius={[4, 4, 0, 0]}
                  name="Revenue"
                />
                <Bar
                  dataKey="expenses"
                  fill={`url(#expensesGradient-${activeTab})`}
                  radius={[4, 4, 0, 0]}
                  name="Expenses"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
