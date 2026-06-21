"use client"

import { Contact, LayoutDashboard, Router, Settings, Users, UserPlus, HelpCircle, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import Link from "next/link"

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
    permission: "users_read",
  },
  {
    title: "Leads",
    icon: UserPlus,
    href: "/leads",
    permission: "lead_read",
  },
  {
    title: "Customers",
    icon: Users,
    href: "/customers/all",
    permission: "customer_read",
  },
  {
    title: "Packages",
    icon: Settings,
    href: "/dashboard/settings",
    permission: "settings_read",
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const { user, hasPermission } = useAuth()
  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name
  const isCustomer = String(roleName || "").toLowerCase() === "customer"
  const customerItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/customer/dashboard" },
    { title: "Router", icon: Router, href: "/customer/router" },
    { title: "Contact", icon: Contact, href: "/customer/contact" },
    { title: "Support", icon: HelpCircle, href: "/customer/support" },
    { title: "Billing", icon: Receipt, href: "/customer/billing" },
  ]
  const visibleItems = isCustomer ? customerItems : navItems.filter(item => !item.permission || hasPermission(item.permission))

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 glass-navbar md:hidden">
      <nav className="flex h-14" aria-label="Mobile navigation">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
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
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
