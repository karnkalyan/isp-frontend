import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { InventoryLifecycle } from "@/components/inventory/inventory-lifecycle"

export default function InventoryLifecyclePage() {
  return (
    <DashboardLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
        <PageHeader 
            title="Hardware Lifecycle Tracking" 
            description="Track movement, assignment, and status of inventory items." 
            className="mb-6 w-full" 
        />
        <InventoryLifecycle />
      </div>
    </DashboardLayout>
  )
}
