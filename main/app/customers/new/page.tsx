import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { AddCustomerForm } from "@/components/customers/add-customer-form"

export default function AddCustomerPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Add New Customer"
          description="Create a new customer account and configure services"
          actions={[{ label: "Back to Customers", href: "/customers/all" }]}
        />

        <AddCustomerForm />
      </div>
    </DashboardLayout>
  )
}
