"use client"

import { BarChart3, CreditCard, LayoutDashboard, Settings, Users, UserPlus } from "lucide-react"
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
    title: "Leads",
    icon: UserPlus,
    href: "/leads",
  },
  {
    title: "Customers",
    icon: Users,
    href: "/customers/all",
  },
  {
    title: "Packages",
    icon: Settings,
    href: "/dashboard/settings",
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 glass-navbar md:hidden">
      <nav className="flex h-14" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <a
              key={item.title}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-1"
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 bg-primary/10 rounded-full -z-10 h-10 w-10"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon
                  className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")}
                  aria-hidden="true"
                />
              </div>
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
