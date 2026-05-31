"use client"

import { BarChart3, CreditCard, HelpCircle, LayoutDashboard, Settings, Users, Server, MessageSquare, ShieldCheck, Building2 } from "lucide-react"
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
import { useAuth } from "@/contexts/AuthContext"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    roles: ["Administrator", "Global Manager", "Branch Admin", "Staff", "Manager", "Customer", "Technical", "Field Support"]
  },
  {
    title: "Users",
    icon: Users,
    href: "/users",
    roles: ["Administrator", "Global Manager"]
  },
  {
    title: "Customers",
    icon: Users,
    href: "/customers/list",
    roles: ["Administrator", "Global Manager", "Branch Admin", "Staff", "Technical", "Field Support"]
  },
  {
    title: "Branches",
    icon: Building2,
    href: "/branch",
    roles: ["Administrator", "Global Manager"]
  },
  {
    title: "Billing",
    icon: CreditCard,
    href: "/billing",
    roles: ["Administrator", "Global Manager", "Branch Admin", "Staff", "Customer"]
  },
  {
    title: "SMS Campaign",
    icon: MessageSquare,
    href: "/sms-campaign",
    roles: ["Administrator", "Global Manager", "Branch Admin"]
  },
  {
    title: "Reports",
    icon: BarChart3,
    href: "/reports",
    roles: ["Administrator", "Global Manager", "Branch Admin"]
  },
  {
    title: "Support",
    icon: HelpCircle,
    href: "/support",
    roles: ["Administrator", "Global Manager", "Branch Admin", "Staff", "Manager", "Customer", "Technical", "Field Support"]
  },
  {
    title: "NAS Management",
    icon: Server,
    href: "/nas",
    roles: ["Administrator", "Global Manager", "Branch Admin", "Technical"]
  },
  {
    title: "Master Settings",
    icon: ShieldCheck,
    href: "/master-settings",
    roles: ["Administrator"]
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ["Administrator", "Global Manager", "Branch Admin", "Customer"]
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const filteredItems = menuItems.filter(item => {
    if (!user || !user.role) return false
    return item.roles.includes(user.role.name)
  })

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
          {filteredItems.map((item) => {
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
