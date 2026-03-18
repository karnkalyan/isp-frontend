"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  valueLabel?: string
  color?: string
  className?: string
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  label,
  valueLabel,
  color,
  className,
}: CircularProgressProps) {
  const { resolvedTheme } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Initial check - try to detect theme before hydration
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialDarkMode =
      savedTheme === "dark" || (!savedTheme && prefersDark) || document.documentElement.classList.contains("dark")
    setIsDarkMode(initialDarkMode)
  }, [])

  useEffect(() => {
    if (mounted) {
      setIsDarkMode(resolvedTheme === "dark")
    }
  }, [resolvedTheme, mounted])

  // Calculate the radius and circumference
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  // Determine color based on value
  const getColor = () => {
    if (color) return color
    if (value < 30) return "#22c55e" // green
    if (value < 70) return "#f59e0b" // amber
    return "#ef4444" // red
  }

  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{valueLabel || `${value}`}</span>
        {label && <span className="text-xs text-muted-foreground mt-1">{label}</span>}
      </div>
    </div>
  )
}
