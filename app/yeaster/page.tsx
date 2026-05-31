// app/yeastar/page.tsx
"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import YeastarDashboard from "@/components/yeaster/YeasterDashboard"
import { useState } from "react"
import { Phone } from "lucide-react"

export default function YeastarPage() {
    const [makeCallModalOpen, setMakeCallModalOpen] = useState(false)

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Yeastar VoIP PBX"
                    description="Manage Yeastar VoIP service, make calls, view extensions, and monitor call logs"
                    actions={[
                        {
                            label: "Make Call",
                            onClick: () => setMakeCallModalOpen(true),
                            variant: "default"
                        },
                        {
                            label: "Configure Service",
                            href: "/services",
                            variant: "outline"
                        },
                        {
                            label: "System Logs",
                            onClick: () => { },
                            variant: "outline"
                        },
                    ]}
                    icon={Phone}
                />

                <YeastarDashboard
                    ispId={1} // You'll need to pass the actual ISP ID from your context/auth
                    makeCallModalOpen={makeCallModalOpen}
                    onMakeCallModalChange={setMakeCallModalOpen}
                />
            </div>
        </DashboardLayout>
    )
}