"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

const dailyData = [
  { date: "Mon", download: 120, upload: 40 },
  { date: "Tue", download: 180, upload: 60 },
  { date: "Wed", download: 100, upload: 30 },
  { date: "Thu", download: 220, upload: 70 },
  { date: "Fri", download: 150, upload: 50 },
  { date: "Sat", download: 80, upload: 20 },
  { date: "Sun", download: 90, upload: 30 },
]

const weeklyData = [
  { date: "Week 1", download: 800, upload: 250 },
  { date: "Week 2", download: 900, upload: 300 },
  { date: "Week 3", download: 700, upload: 200 },
  { date: "Week 4", download: 1100, upload: 350 },
]

const monthlyData = [
  { date: "Jan", download: 3500, upload: 1200 },
  { date: "Feb", download: 2800, upload: 900 },
  { date: "Mar", download: 3200, upload: 1000 },
  { date: "Apr", download: 4100, upload: 1300 },
  { date: "May", download: 3700, upload: 1100 },
  { date: "Jun", download: 3900, upload: 1250 },
]

export function UsageChart() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("daily")

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card className="glass-bg border-none shadow-depth">
        <CardHeader>
          <CardTitle>Bandwidth Usage</CardTitle>
          <CardDescription>Network traffic over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  const getChartData = () => {
    switch (activeTab) {
      case "weekly":
        return weeklyData
      case "monthly":
        return monthlyData
      default:
        return dailyData
    }
  }

  return (
    <Card className="glass-bg border-none shadow-depth">
      <CardHeader>
        <CardTitle>Bandwidth Usage</CardTitle>
        <CardDescription>Network traffic over time</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </div>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData()} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`downloadGradient-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`uploadGradient-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "0.5rem",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="download"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#downloadGradient-${activeTab})`}
                  name="Download"
                />
                <Area
                  type="monotone"
                  dataKey="upload"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#uploadGradient-${activeTab})`}
                  name="Upload"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
