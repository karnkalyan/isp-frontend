"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import dynamic from "next/dynamic"

const CreateLeadForm = dynamic(
    () => import("@/components/leads/CreateLeadForm").then((mod) => mod.CreateLeadForm),
    { ssr: false }
)

export default function CreateLeadPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Create New Lead"
                    description="Enter details for the new lead"
                    breadcrumbs={[
                        { label: "Leads", href: "/leads" },
                        { label: "Create" }
                    ]}
                />
                <CreateLeadForm />
            </div>
        </DashboardLayout>
    )
}