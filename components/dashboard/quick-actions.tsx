"use client"

import Link from "next/link"
import { FileText, MessageSquare, PlusCircle, Ticket, UserPlus, Wifi } from "lucide-react"

const actions = [
  { label: "Add customer", href: "/customers/new", icon: UserPlus },
  { label: "Create lead", href: "/leads/create", icon: PlusCircle },
  { label: "Create ticket", href: "/tickets/create", icon: Ticket },
  { label: "Invoices", href: "/finance/invoices", icon: FileText },
  { label: "Network status", href: "/dashboard/real-time", icon: Wifi },
  { label: "Messages", href: "/messages", icon: MessageSquare },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map(({ label, href, icon: Icon }) => (
        <Link key={label} href={href} className="group flex min-h-10 items-center gap-2 rounded-lg border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" strokeWidth={1.75} />
          <span>{label}</span>
        </Link>
      ))}
    </div>
  )
}
