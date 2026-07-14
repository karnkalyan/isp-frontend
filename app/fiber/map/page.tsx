"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import FiberMap from "@/components/fiber/fiber-map"

export default function FiberMapPage() {
    return (
        <DashboardLayout>
            <div className="-mx-3 space-y-3 sm:mx-0 sm:space-y-6">
                <PageHeader
                    title="Fiber Network Mapping"
                    description="Import, visualize, and manage your fiber optic network infrastructure"
                    actions={[
                        { label: "Upload Files", href: "#upload" },
                        { label: "Sample Data", href: "#samples" },
                        { label: "Export Map", href: "#export" },
                    ]}
                />
                <div className="h-[calc(100dvh-8.5rem)] min-h-[32rem] overflow-hidden sm:h-[calc(100dvh-12rem)] sm:rounded-xl sm:border">
                    <FiberMap />
                </div>
            </div>
        </DashboardLayout>
    )
}
