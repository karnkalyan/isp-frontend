"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CustomerDashboard } from "@/components/dashboard/variants/CustomerDashboard"

export default function CustomerSupportPage() {
  return (
    <DashboardLayout>
      <CustomerDashboard initialTab="support" />
    </DashboardLayout>
  )
}
