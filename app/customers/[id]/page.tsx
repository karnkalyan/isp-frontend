import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CustomerProfile } from "@/components/customers/customer-profile"

export default async function CustomerDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  // await params per Next.js requirement
  const { id } = await params

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Customer Profile"
          description="View and manage customer details"
          actions={[
            { label: "Edit Profile", href: `/customers/${id}/edit` },
            { label: "Back to Customers", href: "/customers/all" },
          ]}
        />

        <CustomerProfile customerId={id} />
      </div>
    </DashboardLayout>
  )
}
