import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CustomersList } from "@/components/customers/customers-list"
import { CustomerFilters } from "@/components/customers/customer-filters"

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Customer Management"
          description="View and manage all customer accounts"
          actions={[
            { label: "Add Customer", href: "/customers/new" },
            { label: "Import", href: "#" },
            { label: "Export", href: "#" },
          ]}
        />

        <CustomerFilters />
        <CustomersList />
      </div>
    </DashboardLayout>
  )
}
