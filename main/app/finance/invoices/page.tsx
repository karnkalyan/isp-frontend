import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { InvoicesList } from "@/components/finance/invoices-list"
import { InvoiceFilters } from "@/components/finance/invoice-filters"
import { InvoiceSummary } from "@/components/finance/invoice-summary"

export default function InvoicesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Invoices & Statements"
          description="Manage customer invoices and payment records"
          actions={[
            { label: "Create Invoice", href: "#" },
            { label: "Batch Generate", href: "#" },
            { label: "Export", href: "#" },
          ]}
        />

        <InvoiceSummary />
        <InvoiceFilters />
        <InvoicesList />
      </div>
    </DashboardLayout>
  )
}
