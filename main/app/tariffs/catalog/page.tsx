import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { TariffCatalog } from "@/components/tariffs/tariff-catalog"
import { TariffFilters } from "@/components/tariffs/tariff-filters"
import { TariffComparison } from "@/components/tariffs/tariff-comparison"

export default function TariffCatalogPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Tariff Plan Catalog"
          description="Manage service plans and pricing"
          actions={[
            { label: "Create Plan", href: "/tariffs/edit" },
            { label: "Import", href: "#" },
            { label: "Export", href: "#" },
          ]}
        />

        <TariffFilters />
        <TariffCatalog />
        <TariffComparison />
      </div>
    </DashboardLayout>
  )
}
