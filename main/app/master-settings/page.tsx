import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { MasterSettingsTabs } from "@/components/master-settings/master-settings-tabs"

export default function MasterSettingsPage() {
  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6 space-y-6">
        <PageHeader
          title="Master Settings"
          description="Configure system-wide settings and service integrations"
          className="mb-6 w-full"
        />
        <MasterSettingsTabs />
      </div>
    </DashboardLayout>
  )
}
