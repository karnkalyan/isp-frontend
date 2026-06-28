import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { RadiusPoolsSettings } from "@/components/settings/radius-pools-settings"

export default function RadiusPoolsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 px-4 py-6">
        <PageHeader title="Disconnect Sessions" description="Manage RADIUS address pools used for subscriber session operations" />
        <RadiusPoolsSettings />
      </div>
    </DashboardLayout>
  )
}
