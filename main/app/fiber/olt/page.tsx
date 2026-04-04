import type { Metadata } from "next"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { OLTDetailed } from "@/components/fiber/olt-detailed"

export const metadata: Metadata = {
  title: "OLT Management | KisanNET Dashboard",
  description: "Manage your Optical Line Terminals (OLTs) and monitor their performance",
}

export default function OLTPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">OLT Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Complete OLT details with SSH configuration, ports, and features
          </p>
        </div>
        <OLTDetailed />
      </div>
    </DashboardLayout>
  )
}
