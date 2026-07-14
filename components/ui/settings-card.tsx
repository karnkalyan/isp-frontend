import type React from "react"
import { cn } from "@/lib/utils"
import { CardContainer } from "@/components/ui/card-container"
import { Cog } from "lucide-react"

interface SettingsCardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  gradientColor?: string
  footer?: React.ReactNode
}

export function SettingsCard({
  title,
  description,
  icon,
  children,
  className,
  gradientColor = "#6366f1",
  footer,
}: SettingsCardProps) {
  return (
    <CardContainer
      title={title}
      description={description}
      gradientColor={gradientColor}
      className={cn("h-full", className)}
      icon={icon || <Cog className="h-5 w-5" />}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1">{children}</div>
        {footer && <div className="mt-4 pt-4 border-t">{footer}</div>}
      </div>
    </CardContainer>
  )
}
