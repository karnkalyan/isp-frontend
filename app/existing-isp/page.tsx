import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { ExistingISPManagement } from "@/components/existing-isp/existing-isp-management"

export default function ExistingISPPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Existing ISP Directory"
          description="Manage existing ISP providers and migration tools"
          actions={[
            { label: "Add New ISP", href: "/existing-isp/add" },
            { label: "ISP Comparison", href: "/existing-isp/comparison" },
            { label: "Migration Tools", href: "/existing-isp/migration" },
          ]}
        />
        <ExistingISPManagement />
      </div>
    </DashboardLayout>
  )
}
