import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { YeastarDashboard } from "@/components/yeaster/YeasterDashboard"

export default function YeastarPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Yeastar VoIP PBX"
                    description="Manage Yeastar VoIP service, make calls, view extensions, and monitor call logs"
                    actions={[
                        {
                            label: "Make Call",
                            onClick: "openMakeCallModal()",
                            variant: "primary"
                        },
                        { label: "Configure Service", href: "/services" },
                        { label: "System Logs", href: "#" },
                    ]}
                    icon="phone"
                />

                <YeastarDashboard />
            </div>
        </DashboardLayout>
    )
}