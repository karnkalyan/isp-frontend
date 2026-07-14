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
  contentClassName?: string
  action?: ReactNode
  actions?: CardAction[]
}

export function CardContainer({
  title,
  description,
  children,
  gradientColor,
  forceDarkMode = false,
  className = "",
  contentClassName = "",
  action,
  actions
}: CardContainerProps) {
  const hasHeader = title !== undefined || description !== undefined || actions !== undefined || action !== undefined

  return (
    <Card
      className={`overflow-hidden ${className}`}
    >
      {hasHeader && (
        <CardHeader className="border-b border-border bg-card p-5">
          <div className="flex justify-between items-center">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && (
                <CardDescription>
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
                  className="h-8 gap-1.5 px-3"
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
      <CardContent className={`p-5 ${hasHeader ? "pt-5" : ""} ${contentClassName}`}>{children}</CardContent>
    </Card>
  )
}
