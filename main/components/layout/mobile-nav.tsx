"use client"

import { BarChart3, CreditCard, LayoutDashboard, Settings, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

const navItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    title: "Users",
    icon: Users,
    href: "/admin/users",
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
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/40 transition-colors duration-300 md:hidden">
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
              {isActive ? (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-primary/10 rounded-full -z-10 h-10 w-10"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              ) : null}
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
