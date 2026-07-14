"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { FollowUpTracking } from "@/components/leads/follow-up-tracking"

export default function LeadFollowUpsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Lead Follow-ups"
                    description="Track and manage all lead follow-ups"
                    actions={[
                        { label: "View All Leads", href: "/leads" },
                        { label: "Today's Follow-ups", href: "/leads/follow-ups?filter=today" },
                        { label: "My Follow-ups", href: "/leads/follow-ups?filter=my" },
                    ]}
                />
                <FollowUpTracking />
            </div>
        </DashboardLayout>
    )
}