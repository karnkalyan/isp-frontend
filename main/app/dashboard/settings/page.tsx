import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { SettingsTabs } from "@/components/settings/settings-tabs"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6 space-y-6">
        <PageHeader title="Settings" description="Manage system settings and configurations" className="mb-6 w-full" />

        <SettingsTabs />
      </div>
    </DashboardLayout>
  )
}
