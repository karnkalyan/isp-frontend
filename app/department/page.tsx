import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { DepartmentStatsCards } from "@/components/department/department-stats"
import DepartmentForm from "@/components/department/department-form"
import { Building } from "lucide-react"

export default function DepartmentsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Department Management"
                    description="Organize users into departments for better team management and accountability"
                    icon={Building}
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Organization", href: "/dashboard/organization" },
                        { label: "Departments" },
                    ]}
                />

                <DepartmentStatsCards />
                <DepartmentForm />
            </div>
        </DashboardLayout>
    )
}
