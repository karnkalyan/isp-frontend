import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { RealTimeStats } from "@/components/dashboard/real-time-stats"
import { BandwidthMonitor } from "@/components/dashboard/bandwidth-monitor"
import { ActiveSessions } from "@/components/dashboard/active-sessions"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"

export default function RealTimeDashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Real-Time Dashboard"
          description="Live monitoring of network activity and performance"
          actions={[
            { label: "Refresh", href: "#" },
            { label: "Configure Alerts", href: "#" },
          ]}
        />

        <RealTimeStats />

        <div className="grid gap-6 md:grid-cols-2">
          <BandwidthMonitor />
          <ActiveSessions />
        </div>

        <AlertsPanel />
      </div>
    </DashboardLayout>
  )
}
