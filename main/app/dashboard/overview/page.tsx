import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { UsageChart } from "@/components/dashboard/usage-chart"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { TasksList } from "@/components/dashboard/tasks-list"
import { ProjectStatus } from "@/components/dashboard/project-status"
import { NepaliCalendarWidget } from "@/components/dashboard/nepali-calendar-widget"

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

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="grid gap-6 md:grid-cols-2 h-full">
              <TasksList />
              <ProjectStatus />
            </div>
          </div>
          <div className="flex flex-col h-full">
            <NepaliCalendarWidget />
          </div>
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
