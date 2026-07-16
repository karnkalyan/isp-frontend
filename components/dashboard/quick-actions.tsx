"use client"

import Link from "next/link"
import { Ellipsis, FileText, MessageSquare, Ticket, UserPlus, Wifi, ChartNoAxesColumn } from "lucide-react"

const actions = [
  { label: "Add customer", href: "/customers/new", icon: UserPlus },
  { label: "New ticket", href: "/tickets/create", icon: Ticket },
  { label: "Send SMS", href: "/sms-campaign", icon: MessageSquare },
  { label: "Add invoice", href: "/finance/invoices", icon: FileText },
  { label: "View reports", href: "/reports", icon: ChartNoAxesColumn },
  { label: "Speed test", href: "/dashboard/real-time", icon: Wifi },
  { label: "More", href: "/master-settings", icon: Ellipsis },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {actions.map(({ label, href, icon: Icon }, index) => (
        <Link key={label} href={href} className="group flex min-w-0 flex-col items-center gap-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-10 items-center justify-center rounded-[7px] border border-border bg-background transition-colors group-hover:border-primary/50 group-hover:bg-accent">
            <Icon className={`size-[18px] ${index % 3 === 0 ? "text-primary" : index % 3 === 1 ? "text-[#6fa8ff]" : "text-[#b47cff]"}`} strokeWidth={1.8} />
          </span>
          <span className="w-full truncate text-[9px] font-medium text-muted-foreground group-hover:text-foreground">{label}</span>
        </Link>
      ))}
    </div>
  )
}
