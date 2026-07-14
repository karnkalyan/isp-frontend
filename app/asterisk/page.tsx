"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import AsteriskDashboard from "@/components/asterisk/AsteriskDashboard"
import { Phone } from "lucide-react"

export default function AsteriskPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Asterisk VoIP PBX"
                    description="Manage Asterisk VoIP service, make direct calls, view extensions, and monitor logs"
                    actions={[
                        {
                            label: "Configure Service",
                            href: "/services",
                            variant: "outline"
                        }
                    ]}
                    icon={Phone}
                />

                <AsteriskDashboard ispId={1} />
            </div>
        </DashboardLayout>
    )
}
