"use client"

import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CreateLeadForm } from "@/components/leads/CreateLeadForm"

export default function EditLeadPage() {
    const params = useParams()
    const leadId = params.id as string

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Edit Lead"
                    description="Update lead information"
                    showBackButton
                />
                <CreateLeadForm leadId={leadId} />
            </div>
        </DashboardLayout>
    )
}