"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Cable, Users, Signal, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

export function FiberNetworkStats() {
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Check for dark mode
  useEffect(() => {
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

  const stats = [
    {
      title: "Total Fiber Networks",
      value: "12",
      icon: Cable,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      gradientFrom: "#3B82F6",
      gradientTo: "#10B981",
    },
    {
      title: "Active Subscribers",
      value: "2,458",
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      gradientFrom: "#10B981",
      gradientTo: "#3B82F6",
    },
    {
      title: "Signal Quality",
      value: "98.5%",
      icon: Signal,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      gradientFrom: "#8B5CF6",
      gradientTo: "#3B82F6",
    },
    {
      title: "Active Alerts",
      value: "2",
      icon: AlertTriangle,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      gradientFrom: "#F59E0B",
      gradientTo: "#EF4444",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card
            className={`overflow-hidden ${isDarkMode ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-gray-200"} relative shadow-depth`}
          >
            <div
              className="absolute inset-0 opacity-10 dark:opacity-20"
              style={{
                background: `linear-gradient(135deg, ${stat.gradientFrom}, ${stat.gradientTo})`,
              }}
            />
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {stat.value}
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
