"use client"

import { BarChart3, CreditCard, LayoutDashboard, Settings, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

const navItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    title: "Users",
    icon: Users,
    href: "/users",
  },
  {
    title: "Billing",
    icon: CreditCard,
    href: "/billing",
  },
  {
    title: "Reports",
    icon: BarChart3,
    href: "/reports",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
      <nav className="flex h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <a
              key={item.title}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-1"
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px]", isActive ? "text-primary" : "text-muted-foreground")}>
                {item.title}
              </span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
