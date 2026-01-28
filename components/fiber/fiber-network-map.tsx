import type { Metadata } from "next"
import { NetworkTopologyD3 } from "@/components/fiber/fiber-network-d3"

export const metadata: Metadata = {
  title: "Network Topology | KisanNET Dashboard",
  description: "View network topology tree showing OLT to ONU/ONT connections with D3.js visualization",
}

export default function FiberNetworkTopology() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Network Topology Map</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Real-time hierarchical view of OLT → Splitter → ONU connections with status indicators
        </p>
      </div>
      <NetworkTopologyD3 />
    </div>
  )
}
