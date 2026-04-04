"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CreateLeadForm } from "@/components/leads/CreateLeadForm"

export default function CreateLeadPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Create New Lead"
                    description="Enter details for the new lead"
                    showBackButton
                />
                <CreateLeadForm />
            </div>
        </DashboardLayout>
    )
}