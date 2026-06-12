import { SmsCampaign } from "@/components/dashboard/sms-campaign"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { MessageSquare } from "lucide-react"

export default function AakashSmsServicePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Aakash SMS"
          description="Send SMS campaigns, check provider credit, and review campaign delivery logs"
          icon={MessageSquare}
          actions={[
            { label: "Configure Service", href: "/services", variant: "outline" },
          ]}
        />
        <SmsCampaign />
      </div>
    </DashboardLayout>
  )
}
