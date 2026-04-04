"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { QualifiedLeads } from "@/components/leads/QualifiedLeads"

export default function QualifiedLeadsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Qualified Leads"
                    description="Leads that are ready for conversion"
                    showBackButton
                />
                <QualifiedLeads />
            </div>
        </DashboardLayout>
    )
}