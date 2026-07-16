"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { apiRequest } from "@/lib/api"

interface RevenueData {
  month: string
  revenue: number
}

export function RevenueChart() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("monthly")
  const [data, setData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true)
        const response = await apiRequest<{ success: boolean; data: RevenueData[] }>("/dashboard/revenue-overview", { suppressToast: true })
        if (response?.data && Array.isArray(response.data)) {
          setData(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch revenue data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      fetchRevenueData()
    }
  }, [mounted])

  if (!mounted || loading) {
    return (
      <Card className="glass-bg border-none shadow-depth">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Financial performance in NRS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data && data.length > 0 ? data : [
    { month: "Jan", revenue: 0 },
    { month: "Feb", revenue: 0 },
    { month: "Mar", revenue: 0 },
  ]

  return (
    <Card className="glass-bg border-none shadow-depth">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Financial performance in NRS</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </div>
          <div className="mt-4 h-[300px] min-h-0 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 640, height: 300 }}>
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`revenueGradient`} x1="0" y1="0" x2="0" y2="1">
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
                  formatter={(value) => [`NRS ${(value as number).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, "Revenue"]}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar
                  dataKey="revenue"
                  fill={`url(#revenueGradient)`}
                  radius={[4, 4, 0, 0]}
                  name="Revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
