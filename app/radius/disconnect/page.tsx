import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { DisconnectSessionManagement } from "@/components/radius/disconnect-session-management"

export default function DisconnectSessionsPage() {
  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6 space-y-6">
        <PageHeader title="Disconnect Sessions" description="Disconnect RADIUS sessions by branch, sub-branch, or framed pool" />
        <DisconnectSessionManagement />
      </div>
    </DashboardLayout>
  )
}
