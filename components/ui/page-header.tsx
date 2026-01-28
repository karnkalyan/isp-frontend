import { Badge } from "@/components/ui/badge"

interface PageHeaderProps {
  heading: string
  subheading?: string
  badge?: {
    variant: "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
    text: string
  }
}

export function PageHeader({ heading, subheading, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col space-y-1.5">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{heading}</h2>
        {badge && (
          <Badge variant={badge.variant} className="capitalize">
            {badge.text}
          </Badge>
        )}
      </div>
      {subheading && <p className="text-muted-foreground">{subheading}</p>}
    </div>
  )
}
