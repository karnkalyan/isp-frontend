"use client"

import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import dynamic from "next/dynamic"

const CreateLeadForm = dynamic(
    () => import("@/components/leads/CreateLeadForm").then((mod) => mod.CreateLeadForm),
    { ssr: false }
)

export default function EditLeadPage() {
    const params = useParams()
    const leadId = params.id as string

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Edit Lead"
                    description="Update lead information"
                    breadcrumbs={[
                        { label: "Leads", href: "/leads" },
                        { label: "Edit" }
                    ]}
                />
                <CreateLeadForm leadId={leadId} />
            </div>
        </DashboardLayout>
    )
}