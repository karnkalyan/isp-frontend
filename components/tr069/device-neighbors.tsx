"use client"

import { CardContainer } from "@/components/ui/card-container"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Laptop, Smartphone, Tv, Router, Gamepad } from "lucide-react"

interface TR069DeviceNeighborsProps {
  deviceId: string
}

export function TR069DeviceNeighbors({ deviceId }: TR069DeviceNeighborsProps) {
  // Mock data for neighbor devices
  const neighborDevices = [
    {
      id: "device1",
      name: "John's Laptop",
      macAddress: "A4:83:E7:12:9B:F2",
      ipAddress: "192.168.1.101",
      type: "laptop",
      status: "online",
      lastSeen: "Active now",
      signalStrength: 92,
    },
    {
      id: "device2",
      name: "Living Room TV",
      macAddress: "B8:27:EB:F5:12:33",
      ipAddress: "192.168.1.102",
      type: "tv",
      status: "online",
      lastSeen: "Active now",
      signalStrength: 85,
    },
    {
      id: "device3",
      name: "Sarah's Phone",
      macAddress: "C0:EE:FB:45:78:D1",
      ipAddress: "192.168.1.103",
      type: "smartphone",
      status: "online",
      lastSeen: "Active now",
      signalStrength: 78,
    },
    {
      id: "device4",
      name: "Xbox Series X",
      macAddress: "D4:6E:0E:14:A2:45",
      ipAddress: "192.168.1.104",
      type: "game",
      status: "offline",
      lastSeen: "3 hours ago",
      signalStrength: 0,
    },
    {
      id: "device5",
      name: "Mesh Extender",
      macAddress: "E8:48:B8:C5:10:A2",
      ipAddress: "192.168.1.105",
      type: "router",
      status: "online",
      lastSeen: "Active now",
      signalStrength: 95,
    },
  ]

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "laptop":
        return <Laptop className="h-4 w-4" />
      case "smartphone":
        return <Smartphone className="h-4 w-4" />
      case "tv":
        return <Tv className="h-4 w-4" />
      case "router":
        return <Router className="h-4 w-4" />
      case "game":
        return <Gamepad className="h-4 w-4" />
      default:
        return <Laptop className="h-4 w-4" />
    }
  }

  return (
    <CardContainer title="Connected Devices" description="Devices connected to this router" gradientColor="#6366f1">
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>MAC Address</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead>Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {neighborDevices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-slate-100 dark:bg-slate-800 p-1.5">
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>{device.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{device.macAddress}</TableCell>
                  <TableCell>{device.ipAddress}</TableCell>
                  <TableCell>
                    <Badge variant={device.status === "online" ? "success" : "destructive"} className="capitalize">
                      {device.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {device.status === "online" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              device.signalStrength > 70
                                ? "bg-green-500"
                                : device.signalStrength > 30
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${device.signalStrength}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{device.signalStrength}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{device.lastSeen}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </CardContainer>
  )
}
