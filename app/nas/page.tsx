import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { NasList } from "@/components/nas/nas-list"

export default function NasPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="NAS Management"
          description="View and manage all Network Access Servers"
          actions={[
            { label: "Add NAS", href: "/nas/new" }
          ]}
        />
        <NasList />
      </div>
    </DashboardLayout>
  )
}
