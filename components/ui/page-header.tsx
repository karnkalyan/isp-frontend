import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import React from "react"

interface Breadcrumb {
  label: string
  href?: string
}

interface PageAction {
  label: string
  href?: string
  component?: React.ReactNode
}

interface PageHeaderProps {
  title: string
  description?: string

  icon?: LucideIcon

  badge?: {
    text: string
    variant?: "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
  }

  breadcrumbs?: Breadcrumb[]

  actions?: PageAction[]
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  badge,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <span className="mx-2">/</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {/* Icon */}
          {Icon && (
            <div className="rounded-lg border bg-background p-2">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}

          {/* Title + Description */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {title}
              </h1>

              {badge && (
                <Badge variant={badge.variant ?? "secondary"}>
                  {badge.text}
                </Badge>
              )}
            </div>

            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) =>
              action.component ? (
                <React.Fragment key={index}>
                  {action.component}
                </React.Fragment>
              ) : action.href ? (
                <Button asChild key={index}>
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ) : (
                <Button key={index}>{action.label}</Button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
