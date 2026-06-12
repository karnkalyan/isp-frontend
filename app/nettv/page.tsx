"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { NettvDashboard } from "@/components/nettv/nettv-dashboard"
import { Tv } from "lucide-react"

export default function NettvPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="NetTV Service"
          description="Subscriber accounts, subscriptions, packages, STBs, and service status from NetTV"
          icon={Tv}
          actions={[
            {
              label: "Configure Service",
              href: "/services",
              variant: "outline"
            }
          ]}
        />
        <NettvDashboard />
      </div>
    </DashboardLayout>
  )
}
