"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RoleBasedDashboard } from "@/components/dashboard/RoleBasedDashboard"

export default function DashboardOverviewPage() {
  return (
    <DashboardLayout>
      <RoleBasedDashboard />
    </DashboardLayout>
  )
}
