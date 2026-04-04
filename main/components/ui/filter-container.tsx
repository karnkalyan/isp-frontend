import type React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface FilterContainerProps {
  children: React.ReactNode
  className?: string
}

export function FilterContainer({ children, className }: FilterContainerProps) {
  return (
    <Card
      className={cn(
        "border border-slate-800/50 bg-slate-900/80 shadow-md backdrop-blur-sm p-4",
        "transition-all duration-200",
        "relative",
        className,
      )}
    >
      {/* Subtle gradient */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: "linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2))",
        }}
      />

      <div className="flex flex-wrap gap-4 items-center relative z-10">{children}</div>
    </Card>
  )
}
