"use client"

import { BarChart3, CreditCard, LayoutDashboard, Settings, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <a key={item.title} href={item.href} className="flex flex-col items-center justify-center w-full h-full">
              <Button
                variant={isActive ? "default" : "ghost"}
                size="icon"
                className={`rounded-full ${isActive ? "bg-primary text-primary-foreground" : ""}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.title}</span>
              </Button>
              <span className="text-[10px] mt-1">{item.title}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
