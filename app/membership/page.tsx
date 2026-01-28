import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import MembershipForm  from "@/components/membership/membership-form"

export default function MembershipPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Membership Management"
          description="Create and manage customer membership types"
          actions={[
            { label: "View All Memberships", href: "/membership/all" },
            { label: "Membership Reports", href: "/membership/reports" },
          ]}
        />
        <MembershipForm />
      </div>
    </DashboardLayout>
  )
}
