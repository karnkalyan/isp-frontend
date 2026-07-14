import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type AppIconSize = "status" | "input" | "action" | "nav" | "card" | "empty"
const sizes: Record<AppIconSize, string> = { status: "size-3.5", input: "size-4", action: "size-4", nav: "size-[18px]", card: "size-5", empty: "size-8" }

interface AppIconProps { icon: LucideIcon; size?: AppIconSize; label?: string; active?: boolean; className?: string }

export function AppIcon({ icon: Icon, size = "action", label, active, className }: AppIconProps) {
  return <Icon aria-hidden={label ? undefined : true} aria-label={label} strokeWidth={1.75} className={cn(sizes[size], active ? "text-primary" : "text-muted-foreground", className)} />
}
