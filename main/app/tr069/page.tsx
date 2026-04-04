import { PageHeader } from "@/components/ui/page-header"
import { TR069Dashboard } from "@/components/tr069/dashboard"
import { TR069DeviceList } from "@/components/tr069/device-list"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function TR069Page() {
  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <PageHeader title="CPE Status Monitor" description="Monitor and manage customer premises equipment" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="default" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <TR069Dashboard />
          <TR069DeviceList />
        </div>
    </DashboardLayout>
  )
}
