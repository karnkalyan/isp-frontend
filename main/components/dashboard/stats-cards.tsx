"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { Users, Wifi, CreditCard, ShoppingCart } from "lucide-react"
import { motion } from "framer-motion"

// Ensure stats is defined with a default value to prevent undefined errors
const stats = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+12.5%",
    icon: CreditCard,
    iconBg: "#10B981",
    gradientFrom: "#10B981",
    gradientTo: "#3B82F6",
  },
  {
    title: "New Customers",
    value: "2,350",
    change: "+5.2%",
    icon: Users,
    iconBg: "#3B82F6",
    gradientFrom: "#3B82F6",
    gradientTo: "#10B981",
  },
  {
    title: "Active Subscriptions",
    value: "1,725",
    change: "+2.1%",
    icon: Wifi,
    iconBg: "#F59E0B",
    gradientFrom: "#F59E0B",
    gradientTo: "#EF4444",
  },
  {
    title: "Pending Orders",
    value: "432",
    change: "+8.9%",
    icon: ShoppingCart,
    iconBg: "#EF4444",
    gradientFrom: "#EF4444",
    gradientTo: "#EC4899",
  },
]

export function StatsCards() {
  // Ensure stats is always an array to prevent forEach errors
  const safeStats = stats || []

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {safeStats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: React.ElementType
  iconBg: string
  gradientFrom: string
  gradientTo: string
}

function StatCard({ title, value, change, icon: Icon, iconBg, gradientFrom, gradientTo }: StatCardProps) {
  const isPositive = !change.startsWith("-")
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Add useEffect to detect theme changes
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

  return (
    <div
      className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} p-6 relative overflow-hidden rounded-xl border ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"}`}
    >
      <div className="flex flex-row items-center justify-between pb-2">
        <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>{title}</p>
        <div
          className="rounded-full p-2 flex items-center justify-center"
          style={{
            background: iconBg,
          }}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4 text-white drop-shadow-md" />
        </div>
      </div>
      <div className="mt-2">
        <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{value}</div>
        <p
          className={`text-xs font-medium mt-1 ${isPositive ? "text-green-500" : "text-red-500"}`}
          aria-label={`${change} from last month`}
        >
          {change} from last month
        </p>
      </div>
    </div>
  )
}
