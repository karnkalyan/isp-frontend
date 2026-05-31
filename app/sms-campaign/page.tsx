import { SmsCampaign } from "@/components/dashboard/sms-campaign"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function SmsCampaignPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <SmsCampaign />
      </div>
    </DashboardLayout>
  )
}
