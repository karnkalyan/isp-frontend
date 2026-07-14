"use client"

import { LayoutDashboard, Router, Settings, Users, UserPlus, HelpCircle, Receipt, MessageCircle, ListChecks, Cable, LogOut } from "lucide-react"
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
  const { user, hasPermission, logout } = useAuth()
  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name
  const isCustomer = String(roleName || "").toLowerCase() === "customer"
  const isFieldStaff = String(roleName || "").toLowerCase().includes("field staff")

  const customerItems = [
    { title: "Home", icon: LayoutDashboard, href: "/customer/dashboard" },
    { title: "Router", icon: Router, href: "/customer/router" },
    { title: "Chat", icon: MessageCircle, href: "/messages" },
    { title: "Billing", icon: Receipt, href: "/customer/billing" },
    { title: "Support", icon: HelpCircle, href: "/customer/support" },
  ]

  const fieldStaffItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/" },
    { title: "Tickets", icon: HelpCircle, href: "/tickets" },
    { title: "Task", icon: ListChecks, href: "/tasks" },
    { title: "Splitter", icon: Cable, href: "/fiber/splitters/nearby" },
  ]

  const visibleItems = isCustomer 
    ? customerItems 
    : isFieldStaff 
      ? fieldStaffItems 
      : navItems.filter(item => !item.permission || hasPermission(item.permission))

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(.5rem,env(safe-area-inset-bottom))] md:hidden">
      <nav className="flex h-16 items-center rounded-[1.5rem] border border-border/60 bg-background/95 px-1 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl" aria-label="Mobile navigation">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn("flex flex-1 flex-col items-center justify-center gap-1 transition-transform", isActive && "-translate-y-3")}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={cn(
                "relative flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-transparent"
              )}>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 -z-10 rounded-full bg-primary"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon
                  className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")}
                  aria-hidden="true"
                />
              </div>
              <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                {item.title}
              </span>
            </Link>
          )
        })}
        {(isCustomer || isFieldStaff) && (
          <button
            type="button"
            onClick={logout}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-red-600"
            aria-label="Log out"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full">
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        )}
      </nav>
    </div>
  )
}
