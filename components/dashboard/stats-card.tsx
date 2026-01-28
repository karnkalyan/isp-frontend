"use client"

import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface StatsCardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
  gradientStart: string
  gradientEnd: string
}

export function StatsCard({ title, value, change, icon: Icon, gradientStart, gradientEnd }: StatsCardProps) {
  const isPositive = change.startsWith("+")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="overflow-hidden glass-bg border-none shadow-depth relative">
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
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p
            className={cn("text-xs font-medium mt-1", isPositive ? "text-green-500" : "text-red-500")}
            aria-label={`${change} from last month`}
          >
            {change} from last month
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
