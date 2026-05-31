"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CustomerDashboard } from "@/components/dashboard/variants/CustomerDashboard"

export default function CustomerRouterPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <CustomerDashboard initialTab="router" />
      </div>
    </DashboardLayout>
  )
}
