"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { RadiusDashboard } from "@/components/radius/radius-dashboard"
import { RadioTower } from "lucide-react"

export default function RadiusPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Radius Service"
          description="FreeRADIUS users, attributes, accounting, active sessions, and COA operations"
          icon={RadioTower}
          actions={[
            {
              label: "Configure Service",
              href: "/services",
              variant: "outline"
            }
          ]}
        />
        <RadiusDashboard />
      </div>
    </DashboardLayout>
  )
}
