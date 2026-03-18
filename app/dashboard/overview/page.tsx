"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { LeadSearchHero } from "@/components/dashboard/lead-search-hero"

export default function DashboardOverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <LeadSearchHero />
      </div>
    </DashboardLayout>
  )
}
