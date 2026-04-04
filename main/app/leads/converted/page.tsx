"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { ConvertedLeads } from "@/components/leads/ConvertedLeads"

export default function ConvertedLeadsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Converted Leads"
                    description="Leads converted to customers"
                    showBackButton
                />
                <ConvertedLeads />
            </div>
        </DashboardLayout>
    )
}