import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { UsageChart } from "@/components/dashboard/usage-chart"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { TasksList } from "@/components/dashboard/tasks-list"
import { ProjectStatus } from "@/components/dashboard/project-status"

export default function DashboardOverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Overview"
          description="Welcome to Simul ISP RADIUS Manager"
          actions={[
            { label: "Export Data", href: "#" },
            { label: "Print Report", href: "#" },
          ]}
        />

        <StatsCards />

        <div className="grid gap-6 md:grid-cols-2">
          <TasksList />
          <ProjectStatus />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <UsageChart />
          <RevenueChart />
        </div>

        <ActivityFeed />
      </div>
    </DashboardLayout>
  )
}
