"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import FiberMap from "@/components/fiber/fiber-map"

export default function FiberMapPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Fiber Network Mapping"
                    description="Import, visualize, and manage your fiber optic network infrastructure"
                    actions={[
                        { label: "Upload Files", href: "#upload" },
                        { label: "Sample Data", href: "#samples" },
                        { label: "Export Map", href: "#export" },
                    ]}
                />
                <FiberMap />
            </div>
        </DashboardLayout>
    )
}