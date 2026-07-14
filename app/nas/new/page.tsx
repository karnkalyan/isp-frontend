import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CreateNasForm } from "@/components/nas/create-nas"

export default function CreateNasPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Add New NAS"
          description="Configure a new Network Access Server and Radius integration"
          actions={[
            { label: "Back to List", href: "/nas" }
          ]}
        />
        <div className="max-w-4xl">
          <CreateNasForm />
        </div>
      </div>
    </DashboardLayout>
  )
}
