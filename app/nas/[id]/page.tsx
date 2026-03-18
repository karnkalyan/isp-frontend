import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { UpdateNasForm } from "@/components/nas/update-nas"
import React from "react"

export default function UpdateNasPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Update NAS"
          description={`Edit configuration for NAS ID: ${resolvedParams.id}`}
          actions={[
            { label: "Back to List", href: "/nas" }
          ]}
        />
        <div className="max-w-4xl">
          <UpdateNasForm nasId={resolvedParams.id} />
        </div>
      </div>
    </DashboardLayout>
  )
}
