"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { InvoicesList } from "@/components/finance/invoices-list"
import { InvoiceFilters } from "@/components/finance/invoice-filters"
import { InvoiceSummary } from "@/components/finance/invoice-summary"
import { CreateCustomInvoiceModal } from "@/components/finance/create-custom-invoice-modal"

export default function InvoicesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Invoices & Statements"
          description="Manage customer invoices and payment records"
          actions={[
            { label: "Create Invoice", onClick: () => setCreateOpen(true) },
            { label: "Batch Generate", href: "#" },
            { label: "Export", href: "#" },
          ]}
        />

        <InvoiceSummary />
        <InvoiceFilters />
        <InvoicesList key={refreshKey} />
        <CreateCustomInvoiceModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => setRefreshKey(k => k + 1)}
        />
      </div>
    </DashboardLayout>
  )
}
