import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { InventoryOverview } from "@/components/inventory/inventory-overview"

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Inventory Management" 
          description="Track stock levels and device lifecycle across branches."
          actions={[
             { label: "Bulk Import", href: "/inventory/import", variant: "outline" },
             { label: "New Item", href: "/inventory/add" }
          ]}
        />
        <InventoryOverview />
      </div>
    </DashboardLayout>
  )
}
