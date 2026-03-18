"use client"

import { BarChart3, CreditCard, HelpCircle, LayoutDashboard, Settings, Users, Server } from "lucide-react"
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

const menuItems = [
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
    title: "Support",
    icon: HelpCircle,
    href: "/support",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
  {
    title: "NAS Management",
    icon: Server,
    href: "/nas",
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <SidebarComponent variant="floating" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-center p-2">
          <span className="text-xl font-bold bg-gradient-to-r from-green-500 via-blue-500 to-green-500 bg-clip-text text-transparent">
            Simul ISP
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <a href={item.href} className="group">
                    <item.icon
                      className={`transition-all duration-200 ${isActive ? "text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "group-hover:text-primary group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"}`}
                    />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 text-xs text-muted-foreground">
          <p>Simul ISP Admin v1.0</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </SidebarComponent>
  )
}
