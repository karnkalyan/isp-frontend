import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { FiberNetworksList } from "@/components/fiber/fiber-networks-list"
import { FiberNetworkStats } from "@/components/fiber/fiber-network-stats"
import FiberNetworkTopology from "@/components/fiber/fiber-network-map"

export default function FiberNetworksPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="FTTH/FTTB Networks"
          description="View actual OLT, splitter, customer, and ONT topology data"
        />

        <FiberNetworkStats />
        <FiberNetworkTopology />
        <FiberNetworksList />
      </div>
    </DashboardLayout>
  )
}
