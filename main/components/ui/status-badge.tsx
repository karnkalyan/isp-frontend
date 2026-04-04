"use client"

import { cn } from "@/lib/utils"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

type StatusType =
  | "completed"
  | "processing"
  | "failed"
  | "pending"
  | "active"
  | "inactive"
  | "suspended"
  | "overdue"
  | "paid"

interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: StatusType
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDarkMode = mounted && theme === "dark"

  const getStatusStyles = () => {
    switch (status) {
      case "completed":
      case "active":
      case "paid":
        return isDarkMode
          ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
      case "processing":
      case "pending":
        return isDarkMode
          ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          : "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20"
      case "failed":
      case "inactive":
      case "suspended":
      case "overdue":
        return isDarkMode
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          : "bg-red-500/10 text-red-700 hover:bg-red-500/20"
      default:
        return isDarkMode
          ? "bg-slate-500/20 text-slate-400 hover:bg-slate-500/30"
          : "bg-slate-500/10 text-slate-700 hover:bg-slate-500/20"
    }
  }

  return (
    <Badge className={cn("rounded-md font-medium border-0 px-2.5 py-0.5", getStatusStyles(), className)} {...props}>
      {status}
    </Badge>
  )
}
