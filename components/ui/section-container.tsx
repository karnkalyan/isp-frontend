import type React from "react"
import { cn } from "@/lib/utils"

interface SectionContainerProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function SectionContainer({ title, description, children, className, action }: SectionContainerProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h2 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h2>}
            {description && <p className="text-slate-400">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}
