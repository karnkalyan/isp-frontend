"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { LeadListView } from "@/components/leads/LeadListView"

export default function AssignedLeadsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="My Assigned Leads"
                    description="Leads assigned to you"
                    showBackButton
                />
                <LeadListView assignedToMe={true} />
            </div>
        </DashboardLayout>
    )
}