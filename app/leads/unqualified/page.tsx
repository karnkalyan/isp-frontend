"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { UnqualifiedLeads } from "@/components/leads/UnqualifiedLeads"

export default function UnqualifiedLeadsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Unqualified Leads"
                    description="Leads that are not suitable for conversion"
                    showBackButton
                />
                <UnqualifiedLeads />
            </div>
        </DashboardLayout>
    )
}