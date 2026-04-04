import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
// import { LeadDetailsPage } from "@/components/leads/lead-info"
import LeadDetailsPage from "@/components/leads/lead-info"

export default function LeadsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Lead Information"
          description="Manage sales leads and track conversion"
        />
        <LeadDetailsPage />
      </div>
    </DashboardLayout>
  )
}
