import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import BranchForm from "@/components/branch/branch-form"
import { BranchStatsCards } from "@/components/branch/branch-stat-cards"
import { Building, Users, MapPin, BarChart3 } from "lucide-react"

export default function BranchesPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Branch Management"
                    description="Create and manage your ISP branches across different locations"
                    icon={Building}
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Branches", href: "/dashboard/branches" },
                    ]}
                    actions={[
                        {
                            label: "Customer",
                            href: "/customers/list",
                            icon: BarChart3
                        }
                    ]}
                />

                {/* Main Branch Form Component */}
                <BranchForm />
            </div>
        </DashboardLayout>
    )
}