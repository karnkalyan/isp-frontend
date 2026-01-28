"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TR069DeviceDetails } from "@/components/tr069/device-details"
import { TR069DeviceWifi } from "@/components/tr069/device-wifi"
import { TR069DeviceSpeedTest } from "@/components/tr069/device-speed-test"
import { TR069DeviceNeighbors } from "@/components/tr069/device-neighbors"
import { TR069DeviceDiagnostics } from "@/components/tr069/device-diagnostics"
import { TR069DeviceFirmware } from "@/components/tr069/device-firmware"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, Download, RotateCw, UserMinus } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"

export default function TR069DevicePage({ params }: { params: { id: string } }) {
  // In a real app, we would fetch device data based on the ID
  const deviceData = {
    id: params.id,
    name: "TL-WR940N",
    serialNumber: "F81D0F123456",
    macAddress: "F8:1D:0F:12:34:56",
    ipAddress: "192.168.1.1",
    status: "online",
    uptime: "24d 12h 30m",
    connectedDevices: 5,
    signalStrength: 85,
    lastContact: "4/10/2023 8:32:45 AM",
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            heading={deviceData.name}
            subheading="Device Management"
            badge={{
              variant:
                deviceData.status === "online"
                  ? "success"
                  : deviceData.status === "warning"
                    ? "warning"
                    : "destructive",
              text: deviceData.status,
            }}
          />
          <Button variant="outline" size="sm" asChild>
            <Link href="/tr069">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Device List
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1 text-sm mt-2 bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">S/N:</span>
            <span className="font-mono">{deviceData.serialNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">MAC:</span>
            <span className="font-mono">{deviceData.macAddress}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Uptime:</span>
            <span>{deviceData.uptime}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Connected devices:</span>
            <span>{deviceData.connectedDevices}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Fetch New Data
          </Button>
          <Button variant="outline" size="sm">
            <RotateCw className="h-4 w-4 mr-2" />
            Reboot
          </Button>
          <Button variant="outline" size="sm">
            <UserMinus className="h-4 w-4 mr-2" />
            Unassign Customer
          </Button>
        </div>

        <Tabs defaultValue="basic-info" className="w-full">
          <TabsList className="w-full justify-start h-10 bg-background p-1 rounded-md">
            <TabsTrigger value="basic-info" className="rounded-sm">
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="wifi" className="rounded-sm">
              WiFi
            </TabsTrigger>
            <TabsTrigger value="speed-test" className="rounded-sm">
              Speed Test
            </TabsTrigger>
            <TabsTrigger value="neighbor-devices" className="rounded-sm">
              Neighbor Devices
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="rounded-sm">
              Diagnostics
            </TabsTrigger>
            <TabsTrigger value="firmware-update" className="rounded-sm">
              Firmware Update
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic-info" className="pt-6">
            <TR069DeviceDetails deviceId={params.id} />
          </TabsContent>

          <TabsContent value="wifi" className="pt-6">
            <TR069DeviceWifi deviceId={params.id} />
          </TabsContent>

          <TabsContent value="speed-test" className="pt-6">
            <TR069DeviceSpeedTest deviceId={params.id} />
          </TabsContent>

          <TabsContent value="neighbor-devices" className="pt-6">
            <TR069DeviceNeighbors deviceId={params.id} />
          </TabsContent>

          <TabsContent value="diagnostics" className="pt-6">
            <TR069DeviceDiagnostics deviceId={params.id} />
          </TabsContent>

          <TabsContent value="firmware-update" className="pt-6">
            <TR069DeviceFirmware deviceId={params.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
