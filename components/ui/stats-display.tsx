"use client"

import type React from "react"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react"

interface StatsDisplayProps {
  title: string
  value: string
  icon: React.ReactNode
  iconColor: string
  change?: {
    value: number
    type: "increase" | "decrease" | "neutral"
  }
  subtitle?: string
  forceDarkMode?: boolean
}

export function StatsDisplay({
  title,
  value,
  icon,
  iconColor,
  change,
  subtitle,
  forceDarkMode = false,
}: StatsDisplayProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), [])

  const isDarkMode = forceDarkMode || (!mounted ? true : resolvedTheme === "dark")

  const getChangeIcon = () => {
    switch (change?.type) {
      case "increase":
        return <ArrowUpIcon className="h-3 w-3 text-green-500" />
      case "decrease":
        return <ArrowDownIcon className="h-3 w-3 text-red-500" />
      default:
        return <MinusIcon className="h-3 w-3 text-slate-400" />
    }
  }

  const getChangeColor = () => {
    switch (change?.type) {
      case "increase":
        return "text-green-500"
      case "decrease":
        return "text-red-500"
      default:
        return isDarkMode ? "text-slate-400" : "text-slate-500"
    }
  }

  return (
    <Card
      className={`overflow-hidden ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-800/50 to-slate-900 border-slate-800"
          : "bg-gradient-to-br from-white to-slate-50 border-slate-200"
      }`}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{title}</p>
            <p className={`text-2xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{value}</p>

            {(change || subtitle) && (
              <div className="flex items-center mt-2">
                {change && (
                  <div className="flex items-center">
                    {getChangeIcon()}
                    <span className={`text-xs ml-1 ${getChangeColor()}`}>{change.value}%</span>
                  </div>
                )}

                {subtitle && (
                  <span
                    className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"} ${change ? "ml-2" : ""}`}
                  >
                    {subtitle}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="rounded-full p-3" style={{ backgroundColor: `${iconColor}20` }}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
