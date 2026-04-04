"use client";

import { useEffect, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Laptop, Smartphone, Tv, Router, Gamepad, Monitor } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";

interface ConnectedDevice {
  macAddress: string;
  ipAddress: string;
  hostName?: string;
  active?: boolean | string;
  leaseTimeRemaining?: number;
  interfaceType?: string;
}

interface TR069DeviceNeighborsProps {
  deviceId: string;
}

export function TR069DeviceNeighbors({ deviceId }: TR069DeviceNeighborsProps) {
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[] | string>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConnectedDevices = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest<{ success: boolean; data: any }>(
          `/services/genieacs/devices/${deviceId}/connected-devices-info`
        );
        if (data.success) {
          // If data.data is an array, use it; otherwise assume it's an object with connectedDevices
          const devices = Array.isArray(data.data) ? data.data : (data.data.connectedDevices || []);
          setConnectedDevices(devices);
        } else {
          toast.error("Failed to load connected devices");
        }
      } catch (error) {
        console.error("Error fetching connected devices:", error);
        toast.error("Error loading connected devices");
      } finally {
        setIsLoading(false);
      }
    };
    fetchConnectedDevices();
  }, [deviceId]);

  const getDeviceIcon = (hostName: string = "") => {
    const name = hostName.toLowerCase();
    if (name.includes("tv") || name.includes("samsung") || name.includes("lg")) return <Tv className="h-4 w-4" />;
    if (name.includes("phone") || name.includes("iphone") || name.includes("android") || name.includes("oneplus") || name.includes("redmi") || name.includes("galaxy")) return <Smartphone className="h-4 w-4" />;
    if (name.includes("router") || name.includes("ap") || name.includes("extender")) return <Router className="h-4 w-4" />;
    if (name.includes("xbox") || name.includes("playstation") || name.includes("ps4") || name.includes("ps5") || name.includes("game")) return <Gamepad className="h-4 w-4" />;
    if (name.includes("printer") || name.includes("prn")) return <Monitor className="h-4 w-4" />;
    return <Laptop className="h-4 w-4" />;
  };

  const formatLastSeen = (active: boolean | any, leaseTimeRemaining: number | any): string => {
    if (typeof active === "boolean" && active) return "Active now";
    if (typeof leaseTimeRemaining === "number") {
      const mins = Math.floor(leaseTimeRemaining / 60);
      return `${mins} min${mins !== 1 ? "s" : ""}`;
    }
    return "N/A";
  };

  const getActiveStatus = (active: boolean | any): "online" | "offline" => {
    if (typeof active === "boolean") return active ? "online" : "offline";
    return "offline";
  };

  const getInterfaceType = (iface: string | any): string => {
    if (typeof iface === "string") return iface;
    return "WiFi";
  };

  if (isLoading) {
    return (
      <CardContainer title="Connected Devices" gradientColor="#6366f1">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-2 text-muted-foreground">Loading connected devices...</p>
        </div>
      </CardContainer>
    );
  }

  if (typeof connectedDevices === "string" || !Array.isArray(connectedDevices)) {
    return (
      <CardContainer title="Connected Devices" description="Devices currently connected to this router" gradientColor="#6366f1">
        <div className="text-center py-12 text-muted-foreground">
          {typeof connectedDevices === "string" ? connectedDevices : "No connected devices found."}
        </div>
      </CardContainer>
    );
  }

  const validDevices = connectedDevices.filter(
    (d) => d.macAddress && d.macAddress !== "N/A" && d.ipAddress && d.ipAddress !== "N/A"
  );

  return (
    <CardContainer
      title="Connected Devices"
      description="Devices currently connected to this router"
      gradientColor="#6366f1"
    >
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>MAC Address</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interface</TableHead>
                <TableHead>Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No connected devices found.
                  </TableCell>
                </TableRow>
              ) : (
                validDevices.map((device, index) => {
                  const status = getActiveStatus(device.active);
                  const lastSeen = formatLastSeen(device.active, device.leaseTimeRemaining);
                  const interfaceType = getInterfaceType(device.interfaceType);

                  return (
                    <TableRow key={`${device.macAddress}-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="rounded-md bg-slate-100 dark:bg-slate-800 p-1.5">
                            {getDeviceIcon(device.hostName)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {device.hostName || "Unknown Device"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{device.macAddress}</TableCell>
                      <TableCell>{device.ipAddress}</TableCell>
                      <TableCell>
                        <Badge variant={status === "online" ? "success" : "destructive"} className="capitalize">
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>{interfaceType}</TableCell>
                      <TableCell>{lastSeen}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </CardContainer>
  );
}