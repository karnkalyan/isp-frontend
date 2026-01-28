"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import type { ReactNode } from "react"

interface CardContainerProps {
  title: string
  description?: string
  children: ReactNode
  gradientColor?: string
  forceDarkMode?: boolean
  className?: string
}

export function CardContainer({
  title,
  description,
  children,
  gradientColor = "#3B82F6",
  forceDarkMode = false,
  className = "",
}: CardContainerProps) {
  const { resolvedTheme } = useTheme()

  // Use forceDarkMode if provided, otherwise use the theme system
  const isDarkMode = forceDarkMode || resolvedTheme === "dark"

  return (
    <Card
      className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} ${
        isDarkMode ? "border-[#1e293b]" : "border-gray-200"
      } rounded-xl overflow-hidden relative ${className}`}
    >
      {/* Top-left corner gradient */}
      <div
        className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
        }}
      />

      {/* Bottom-right corner gradient */}
      <div
        className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
        }}
      />

      <CardHeader className={`pb-2 ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} relative z-10`}>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>{title}</CardTitle>
            {description && (
              <CardDescription className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">{children}</CardContent>
    </Card>
  )
}
