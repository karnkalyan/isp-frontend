"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { LeadManagement } from "@/components/leads/lead-management"

export default function LeadsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Lead Management"
          description="Manage sales leads and track conversion"
          actions={[
            { label: "Add New Lead", href: "/leads/new" },
            { label: "Import Leads", href: "/leads/import" },
            { label: "Follow-ups", href: "/leads/follow-ups" }, // ✅ Yahan add karo
            { label: "Lead Reports", href: "/leads/reports" },
          ]}
        />
        <LeadManagement />
      </div>
    </DashboardLayout>
  )
}