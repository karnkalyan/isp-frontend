"use client"

import React from "react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  trend?: { value: number, isPositive: boolean }
  description?: string
  icon: any // Can be LucideIcon type or ReactElement
  gradientStart?: string
  gradientEnd?: string
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  trend,
  description,
  icon: Icon, 
  gradientStart = "#3B82F6", 
  gradientEnd = "#10B981" 
}: StatsCardProps) {
  const isPositive = change ? change.startsWith("+") : (trend ? trend.isPositive : true)
  const displayChange = change || (trend ? `${trend.isPositive ? '+' : '-'}${trend.value}%` : "")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="overflow-hidden glass-bg border-none shadow-depth relative h-full">
        <div
          className="absolute inset-0 opacity-10 dark:opacity-20"
          style={{
            background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          }}
        />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div
            className="rounded-full p-2"
            style={{
              background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
              boxShadow: `0 4px 12px ${gradientStart}40`,
            }}
          >
            {React.isValidElement(Icon) ? (
              React.cloneElement(Icon as React.ReactElement, { className: cn("h-4 w-4 text-white", (Icon as any).props.className) })
            ) : (
              <Icon className="h-4 w-4 text-white" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {displayChange && (
            <p
              className={cn("text-xs font-medium mt-1", isPositive ? "text-green-500" : "text-red-500")}
              aria-label={`${displayChange} from last month`}
            >
              {displayChange} {description ? `· ${description}` : "from last month"}
            </p>
          )}
          {!displayChange && description && (
            <p className="text-xs font-medium mt-1 text-muted-foreground">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
