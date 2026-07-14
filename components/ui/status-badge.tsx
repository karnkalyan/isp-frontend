"use client"
import { cn } from "@/lib/utils"
import { Badge, type BadgeProps } from "@/components/ui/badge"

type StatusType = "completed"|"processing"|"failed"|"pending"|"active"|"inactive"|"suspended"|"overdue"|"paid"
interface StatusBadgeProps extends Omit<BadgeProps,"variant"> { status: StatusType }
export function StatusBadge({status,className,...props}:StatusBadgeProps){
  const variant: BadgeProps["variant"] = ["completed","active","paid"].includes(status) ? "success" : ["processing","pending"].includes(status) ? "info" : ["failed","suspended","overdue"].includes(status) ? "destructive" : "secondary"
  return <Badge variant={variant} className={cn("capitalize",className)} {...props}>{status}</Badge>
}
