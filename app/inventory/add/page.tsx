import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { AddInventoryItem } from "@/components/inventory/add-inventory-item"

export default function AddInventoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Add Inventory Item" 
          description="Register a new device into the inventory system."
          actions={[
             { label: "Back to Inventory", href: "/inventory", variant: "outline" }
          ]}
        />
        <AddInventoryItem />
      </div>
    </DashboardLayout>
  )
}
