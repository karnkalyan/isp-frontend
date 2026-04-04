"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { motion, AnimatePresence } from "framer-motion"

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
            background: `radial-gradient(circle, #EF4444 0%, transparent 70%)`,
          }}
        />

        {/* Bottom-right corner gradient - increased size */}
        <div
          className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, #EF4444 0%, transparent 70%)`,
          }}
        />

        <CardHeader className="pb-2 border-b border-[#1e293b] relative z-10">
          <CardTitle className="text-white">Revenue Overview</CardTitle>
          <CardDescription className="text-slate-400">Financial performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-slate-400">Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  const getChartData = () => {
    return activeTab === "yearly" ? yearlyData : quarterlyData
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
      <Card
        className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} rounded-xl overflow-hidden relative`}
      >
        {/* Top-left corner gradient - increased size */}
        <div
          className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, #EF4444 0%, transparent 70%)`,
          }}
        />

        {/* Bottom-right corner gradient - increased size */}
        <div
          className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, #EF4444 0%, transparent 70%)`,
          }}
        />

        <CardHeader className={`pb-2 ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} border-b relative z-10`}>
          <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>Revenue Overview</CardTitle>
          <CardDescription className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
            Financial performance
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 relative z-10">
          <Tabs defaultValue="quarterly" onValueChange={setActiveTab}>
            <div className="flex justify-between items-center">
              <TabsList className={isDarkMode ? "bg-[#1e293b]" : "bg-gray-100"}>
                <TabsTrigger
                  value="quarterly"
                  className={
                    isDarkMode
                      ? "data-[state=active]:bg-[#2d3748] text-slate-300 data-[state=active]:text-white"
                      : "data-[state=active]:bg-white text-gray-500 data-[state=active]:text-gray-900"
                  }
                >
                  Quarterly
                </TabsTrigger>
                <TabsTrigger
                  value="yearly"
                  className={
                    isDarkMode
                      ? "data-[state=active]:bg-[#2d3748] text-slate-300 data-[state=active]:text-white"
                      : "data-[state=active]:bg-white text-gray-500 data-[state=active]:text-gray-900"
                  }
                >
                  Yearly
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
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis
                      dataKey="month"
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
                      formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill={`url(#revenueGradient-${activeTab})`}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                      name="Revenue"
                    />
                    <Bar
                      dataKey="expenses"
                      fill={`url(#expensesGradient-${activeTab})`}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                      animationBegin={300}
                      name="Expenses"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
