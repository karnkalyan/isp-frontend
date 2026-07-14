"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { motion, AnimatePresence } from "framer-motion"

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
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    setMounted(true)
    setIsDarkMode(document.documentElement.classList.contains("dark"))

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"))
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  if (!mounted) {
    return (
      <Card className="bg-[#0f172a] border-[#1e293b] rounded-xl overflow-hidden relative">
        {/* Top-left corner gradient - increased size */}
        <div
          className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, #3B82F6 0%, transparent 70%)`,
          }}
        />

        {/* Bottom-right corner gradient - increased size */}
        <div
          className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, #3B82F6 0%, transparent 70%)`,
          }}
        />

        <CardHeader className="pb-2 border-b border-[#1e293b] relative z-10">
          <CardTitle className="text-white">Bandwidth Usage</CardTitle>
          <CardDescription className="text-slate-400">Network traffic over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-slate-400">Loading chart...</div>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Card
        className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} rounded-xl overflow-hidden relative`}
      >
        {/* Top-left corner gradient - increased size */}
        <div
          className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, #3B82F6 0%, transparent 70%)`,
          }}
        />

        {/* Bottom-right corner gradient - increased size */}
        <div
          className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, #3B82F6 0%, transparent 70%)`,
          }}
        />

        <CardHeader className={`pb-2 ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} border-b relative z-10`}>
          <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>Bandwidth Usage</CardTitle>
          <CardDescription className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
            Network traffic over time
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 relative z-10">
          <Tabs defaultValue="daily" onValueChange={setActiveTab}>
            <div className="flex justify-between items-center">
              <TabsList className={isDarkMode ? "bg-[#1e293b]" : "bg-gray-100"}>
                <TabsTrigger
                  value="daily"
                  className={
                    isDarkMode
                      ? "data-[state=active]:bg-[#2d3748] text-slate-300 data-[state=active]:text-white"
                      : "data-[state=active]:bg-white text-gray-500 data-[state=active]:text-gray-900"
                  }
                >
                  Daily
                </TabsTrigger>
                <TabsTrigger
                  value="weekly"
                  className={
                    isDarkMode
                      ? "data-[state=active]:bg-[#2d3748] text-slate-300 data-[state=active]:text-white"
                      : "data-[state=active]:bg-white text-gray-500 data-[state=active]:text-gray-900"
                  }
                >
                  Weekly
                </TabsTrigger>
                <TabsTrigger
                  value="monthly"
                  className={
                    isDarkMode
                      ? "data-[state=active]:bg-[#2d3748] text-slate-300 data-[state=active]:text-white"
                      : "data-[state=active]:bg-white text-gray-500 data-[state=active]:text-gray-900"
                  }
                >
                  Monthly
                </TabsTrigger>
              </TabsList>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`h-[300px] mt-4 ${isDarkMode ? "bg-[#1e293b]" : "bg-gray-50"} p-4 rounded-lg`}
              >
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
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: isDarkMode ? "#94a3b8" : "#6b7280" }}
                      axisLine={{ stroke: isDarkMode ? "#374151" : "#e5e7eb" }}
                    />
                    <YAxis
                      tick={{ fill: isDarkMode ? "#94a3b8" : "#6b7280" }}
                      axisLine={{ stroke: isDarkMode ? "#374151" : "#e5e7eb" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? "rgba(17, 25, 40, 0.8)" : "rgba(255, 255, 255, 0.8)",
                        borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                        borderRadius: "0.5rem",
                        backdropFilter: "blur(8px)",
                        boxShadow: isDarkMode
                          ? "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
                          : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        color: isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
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
                      animationDuration={1000}
                    />
                    <Area
                      type="monotone"
                      dataKey="upload"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#uploadGradient-${activeTab})`}
                      name="Upload"
                      animationDuration={1000}
                      animationBegin={300}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
