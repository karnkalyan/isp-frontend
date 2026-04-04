"use client";

import { useEffect, useState, use } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TR069DeviceDetails } from "@/components/tr069/device-details";
import { TR069DeviceWifi } from "@/components/tr069/device-wifi";
import { TR069DeviceSpeedTest } from "@/components/tr069/device-speed-test";
import { TR069DeviceNeighbors } from "@/components/tr069/device-neighbors";
import { TR069DeviceDiagnostics } from "@/components/tr069/device-diagnostics";
import { TR069DeviceFirmware } from "@/components/tr069/device-firmware";
import { TR069DeviceWanConnections } from "@/components/tr069/device-wan-connections";
import { TR069DeviceLanInfo } from "@/components/tr069/device-lan";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Download, RotateCw, UserMinus } from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { apiRequest } from "@/lib/api";
import { DeviceApiResponse } from "@/types/tr069";
import { useToast } from "@/components/ui/use-toast";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TR069DevicePage({ params }: PageProps) {
  const { id } = use(params);
  const { toast } = useToast();

  const [isRebooting, setIsRebooting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const rebootDevice = async () => {
    try {
      setIsRebooting(true);
      const data = await apiRequest<DeviceApiResponse>(
        `/services/genieacs/devices/${id}/reboot`,
        { method: "POST" }
      );
      if (data.success) {
        toast({
          title: "Success",
          description: "Device rebooted successfully",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to reboot device:", error);
      toast({
        title: "Error",
        description: "Failed to reboot device",
        variant: "destructive",
      });
    } finally {
      setIsRebooting(false);
    }
  };

  const resetDevice = async () => {
    try {
      setIsResetting(true);
      const data = await apiRequest<DeviceApiResponse>(
        `/services/genieacs/devices/${id}/reset`,
        { method: "POST" }
      );
      if (data.success) {
        toast({
          title: "Success",
          description: "Device reset successfully",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to reset device:", error);
      toast({
        title: "Error",
        description: "Failed to reset device",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            heading="TR-069 Device"
            subheading="Device Management"
          />
          <Button variant="outline" size="sm" asChild>
            <Link href="/tr069">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Device List
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Fetch New Data
          </Button>
          <Button variant="outline" size="sm" onClick={rebootDevice} disabled={isRebooting}>
            <RotateCw className="h-4 w-4 mr-2" />
            Reboot
          </Button>
          <Button variant="outline" size="sm">
            <UserMinus className="h-4 w-4 mr-2" />
            Unassign Customer
          </Button>
        </div>



        <Tabs defaultValue="basic-info" className="w-full">
          <TabsList className="w-full justify-start h-10 bg-background p-1 rounded-md overflow-x-auto">
            <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
            <TabsTrigger value="wan">WAN Connections</TabsTrigger>
            <TabsTrigger value="wifi">WiFi</TabsTrigger>
            <TabsTrigger value="lan">LAN</TabsTrigger>
            <TabsTrigger value="neighbor-devices">Connected Devices</TabsTrigger>
            <TabsTrigger value="speed-test">Speed Test</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            {/* <TabsTrigger value="firmware-update">Firmware</TabsTrigger> */}
          </TabsList>

          <TabsContent value="basic-info" className="pt-6">
            <TR069DeviceDetails deviceId={id} />
          </TabsContent>

          <TabsContent value="wan" className="pt-6">
            <TR069DeviceWanConnections deviceId={id} />
          </TabsContent>

          <TabsContent value="wifi" className="pt-6">
            <TR069DeviceWifi deviceId={id} />
          </TabsContent>

          <TabsContent value="lan" className="pt-6">
            <TR069DeviceLanInfo deviceId={id} />
          </TabsContent>

          <TabsContent value="neighbor-devices" className="pt-6">
            <TR069DeviceNeighbors deviceId={id} />
          </TabsContent>

          <TabsContent value="speed-test" className="pt-6">
            <TR069DeviceSpeedTest deviceId={id} />
          </TabsContent>

          <TabsContent value="diagnostics" className="pt-6">
            <TR069DeviceDiagnostics deviceId={id} />
          </TabsContent>

          {/* <TabsContent value="firmware-update" className="pt-6">
            <TR069DeviceFirmware deviceId={id} />
          </TabsContent> */}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}