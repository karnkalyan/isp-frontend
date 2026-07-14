import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex min-h-5 items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-[var(--status-danger-bg)] text-[var(--status-danger)]",
        success:
          "border-transparent bg-[var(--status-success-bg)] text-[var(--status-success)]",
        warning:
          "border-transparent bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
        info: "border-transparent bg-[var(--status-info-bg)] text-[var(--status-info)]",
        ai: "border-transparent bg-[var(--kashtrix-magenta-soft)] text-[var(--kashtrix-ai-magenta)]",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  indicatorClassName?: string
}

function Badge({ className, variant, indicatorClassName, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
