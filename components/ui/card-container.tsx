import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface CardAction {
  label: string
  onClick: () => void
  icon?: ReactNode
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
}

interface CardContainerProps {
  title?: string
  description?: string
  children: ReactNode
  gradientColor?: string
  forceDarkMode?: boolean
  className?: string
  action?: ReactNode
  actions?: CardAction[]
}

export function CardContainer({
  title,
  description,
  children,
  gradientColor = "#3B82F6",
  forceDarkMode = false,
  className = "",
  action,
  actions
}: CardContainerProps) {
  const { resolvedTheme } = useTheme()

  // Use forceDarkMode if provided, otherwise use the theme system
  const isDarkMode = forceDarkMode || resolvedTheme === "dark"

  const hasHeader = title !== undefined || description !== undefined || actions !== undefined || action !== undefined

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

      {hasHeader && (
        <CardHeader className={`pb-2 ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} relative z-10`}>
          <div className="flex justify-between items-center">
            <div>
              {title && <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>{title}</CardTitle>}
              {description && (
                <CardDescription className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
                  {description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {actions && actions.map((act, i) => (
                <Button 
                  key={i} 
                  variant={act.variant || "ghost"} 
                  size="sm" 
                  onClick={act.onClick}
                  className="h-8 gap-1.5 px-3 rounded-lg"
                >
                  {act.icon}
                  <span className="hidden sm:inline">{act.label}</span>
                </Button>
              ))}
              {action && <div>{action}</div>}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="relative z-10">{children}</CardContent>
    </Card>
  )
}
