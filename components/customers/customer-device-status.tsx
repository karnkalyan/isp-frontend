"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardContainer } from "@/components/ui/card-container"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import {
  Wifi,
  Router,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  Laptop,
  Tv,
  Tablet,
  Clock,
  Thermometer,
  Activity,
  Signal,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react"

// Mock equipment data
const equipmentData = [
  {
    type: "ONT",
    model: "Huawei EchoLife HG8245H",
    serialNumber: "SN48752639",
    status: "active",
    installationDate: "2023-01-15",
    firmwareVersion: "V1.2.3",
    ipAddress: "192.168.1.1",
    macAddress: "00:1B:44:11:3A:B7",
    signalStrength: -18.5, // dBm
    temperature: 38, // Celsius
    uptime: "45 days, 12 hours",
    lastReboot: "2023-03-15T08:30:00Z",
    ports: [
      { name: "LAN1", status: "connected", speed: "1 Gbps" },
      { name: "LAN2", status: "disconnected", speed: "N/A" },
      { name: "LAN3", status: "disconnected", speed: "N/A" },
      { name: "LAN4", status: "connected", speed: "1 Gbps" },
    ],
  },
  {
    type: "Router",
    model: "TP-Link Archer AX50",
    serialNumber: "TP39485723",
    status: "active",
    installationDate: "2023-01-15",
    firmwareVersion: "V2.0.1",
    ipAddress: "192.168.1.2",
    macAddress: "A4:2B:B0:45:E2:C1",
    wifiSSID: "Johnson-Home",
    wifiSecurity: "WPA3",
    wifiChannel: "6 (2.4GHz), 36 (5GHz)",
    connectedDevices: 8,
    uptime: "15 days, 6 hours",
    lastReboot: "2023-04-15T10:15:00Z",
  },
]

// Mock connected devices data
const connectedDevices = [
  {
    name: "iPhone 13",
    type: "smartphone",
    ipAddress: "192.168.1.101",
    macAddress: "A1:B2:C3:D4:E5:F6",
    connectionType: "WiFi",
    signalStrength: "Excellent",
    lastSeen: "Online",
    downloadUsage: "12.5 GB",
    uploadUsage: "1.8 GB",
  },
  {
    name: "MacBook Pro",
    type: "laptop",
    ipAddress: "192.168.1.102",
    macAddress: "G7:H8:I9:J0:K1:L2",
    connectionType: "WiFi",
    signalStrength: "Good",
    lastSeen: "Online",
    downloadUsage: "45.2 GB",
    uploadUsage: "5.7 GB",
  },
  {
    name: "Samsung TV",
    type: "tv",
    ipAddress: "192.168.1.103",
    macAddress: "M3:N4:O5:P6:Q7:R8",
    connectionType: "WiFi",
    signalStrength: "Good",
    lastSeen: "Online",
    downloadUsage: "78.3 GB",
    uploadUsage: "0.5 GB",
  },
  {
    name: "iPad Pro",
    type: "tablet",
    ipAddress: "192.168.1.104",
    macAddress: "S9:T0:U1:V2:W3:X4",
    connectionType: "WiFi",
    signalStrength: "Excellent",
    lastSeen: "2 hours ago",
    downloadUsage: "8.7 GB",
    uploadUsage: "1.2 GB",
  },
  {
    name: "Desktop PC",
    type: "desktop",
    ipAddress: "192.168.1.105",
    macAddress: "Y5:Z6:A7:B8:C9:D0",
    connectionType: "Ethernet",
    signalStrength: "N/A",
    lastSeen: "Online",
    downloadUsage: "102.8 GB",
    uploadUsage: "15.3 GB",
  },
]

export function CustomerDeviceStatus() {
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"
  const [activeTab, setActiveTab] = useState("ont")
  const [showWifiSettings, setShowWifiSettings] = useState(false)
  const [wifiSSID, setWifiSSID] = useState(equipmentData[1]?.wifiSSID || "")
  const [wifiPassword, setWifiPassword] = useState("********")
  const [showPassword, setShowPassword] = useState(false)

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "smartphone":
        return <Smartphone className="h-4 w-4" />
      case "laptop":
        return <Laptop className="h-4 w-4" />
      case "tv":
        return <Tv className="h-4 w-4" />
      case "tablet":
        return <Tablet className="h-4 w-4" />
      default:
        return <Laptop className="h-4 w-4" />
    }
  }

  const handleWifiUpdate = () => {
    toast({
      title: "WiFi Settings Updated",
      description: "Your WiFi settings have been updated successfully.",
    })
    setShowWifiSettings(false)
  }

  return (
    <CardContainer
      title="Equipment & Connected Devices"
      className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
    >
      <Tabs defaultValue="ont" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 p-1 rounded-lg">
          <TabsTrigger
            value="ont"
            className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/80 data-[state=active]:to-primary data-[state=active]:text-white"
          >
            <Router className="mr-2 h-4 w-4" />
            ONT & Router
          </TabsTrigger>
          <TabsTrigger
            value="devices"
            className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/80 data-[state=active]:to-primary data-[state=active]:text-white"
          >
            <Wifi className="mr-2 h-4 w-4" />
            Connected Devices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ont" className="space-y-4">
          {Array.isArray(equipmentData) && equipmentData.length > 0 ? (
            equipmentData.map((equipment) => (
              <div
                key={equipment.serialNumber}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {equipment.type === "ONT" ? (
                      <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10">
                        <Router className="h-6 w-6 text-primary" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10">
                        <Wifi className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-lg">{equipment.model}</h3>
                      <p className="text-sm text-muted-foreground">
                        {equipment.type} • SN: {equipment.serialNumber}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-700 dark:text-green-400 border-0 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Online</span>
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="text-sm text-muted-foreground">IP Address</div>
                    <div className="font-medium">{equipment.ipAddress}</div>
                  </div>

                  <div className="space-y-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="text-sm text-muted-foreground">MAC Address</div>
                    <div className="font-medium">{equipment.macAddress}</div>
                  </div>

                  <div className="space-y-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="text-sm text-muted-foreground">Firmware</div>
                    <div className="font-medium">{equipment.firmwareVersion}</div>
                  </div>

                  <div className="space-y-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="text-sm text-muted-foreground">Uptime</div>
                    <div className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {equipment.uptime}
                    </div>
                  </div>

                  {equipment.type === "ONT" && (
                    <>
                      <div className="space-y-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div className="text-sm text-muted-foreground">Signal Strength</div>
                        <div className="font-medium flex items-center gap-1">
                          <Signal className="h-3 w-3 text-green-500" />
                          {equipment.signalStrength} dBm (Excellent)
                        </div>
                      </div>

                      <div className="space-y-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div className="text-sm text-muted-foreground">Temperature</div>
                        <div className="font-medium flex items-center gap-1">
                          <Thermometer className="h-3 w-3 text-amber-500" />
                          {equipment.temperature}°C (Normal)
                        </div>
                      </div>
                    </>
                  )}

                  {equipment.type === "Router" && (
                    <>
                      <div className="space-y-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div className="text-sm text-muted-foreground">WiFi SSID</div>
                        <div className="font-medium">{equipment.wifiSSID}</div>
                      </div>

                      <div className="space-y-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div className="text-sm text-muted-foreground">Security</div>
                        <div className="font-medium">{equipment.wifiSecurity}</div>
                      </div>
                    </>
                  )}
                </div>

                {equipment.type === "ONT" && (
                  <>
                    <Separator className="my-4" />

                    <div className="space-y-3">
                      <h4 className="font-medium">Port Status</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Array.isArray(equipment.ports) &&
                          equipment.ports.map((port) => (
                            <div
                              key={port.name}
                              className={`p-3 rounded-lg border ${
                                port.status === "connected"
                                  ? "bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-green-500/20"
                                  : "bg-gradient-to-r from-slate-500/20 to-slate-600/20 border-slate-500/20"
                              }`}
                            >
                              <div className="text-sm font-medium">{port.name}</div>
                              <div
                                className={`text-xs ${
                                  port.status === "connected" ? "text-green-500" : "text-muted-foreground"
                                }`}
                              >
                                {port.status === "connected" ? port.speed : "Disconnected"}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      <h4 className="font-medium">Diagnostics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>CPU Usage</span>
                            <span>32%</span>
                          </div>
                          <Progress
                            value={32}
                            className="h-2"
                            indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Memory Usage</span>
                            <span>45%</span>
                          </div>
                          <Progress
                            value={45}
                            className="h-2"
                            indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Disk Usage</span>
                            <span>28%</span>
                          </div>
                          <Progress
                            value={28}
                            className="h-2"
                            indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-600"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Diagnostics
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reboot
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm hover:shadow-md transition-all"
                    onClick={() => setShowWifiSettings(!showWifiSettings)}
                  >
                    <Wifi className="mr-2 h-4 w-4" />
                    WiFi Settings
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm hover:shadow-md transition-all"
                  >
                    <Wifi className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg shadow-sm">
              <p className="text-muted-foreground">No equipment found</p>
            </div>
          )}
        </TabsContent>

        {showWifiSettings && equipmentData[1]?.type === "Router" && (
          <div className="mt-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-sm">
            <h4 className="font-medium mb-4">WiFi Settings</h4>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="wifi-ssid">WiFi Network Name (SSID)</Label>
                <Input
                  id="wifi-ssid"
                  value={wifiSSID}
                  onChange={(e) => setWifiSSID(e.target.value)}
                  className="bg-white dark:bg-slate-800"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wifi-password">WiFi Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="wifi-password"
                    type={showPassword ? "text" : "password"}
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="bg-white dark:bg-slate-800"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="whitespace-nowrap"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setShowWifiSettings(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleWifiUpdate}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        <TabsContent value="devices" className="space-y-4">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium">Device</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">IP Address</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Connection</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Usage</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {Array.isArray(connectedDevices) && connectedDevices.length > 0 ? (
                    connectedDevices.map((device, index) => (
                      <tr
                        key={index}
                        className="border-b transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/10">
                              {getDeviceIcon(device.type)}
                            </div>
                            <div>
                              <div className="font-medium">{device.name}</div>
                              <div className="text-xs text-muted-foreground">{device.macAddress}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">{device.ipAddress}</td>
                        <td className="p-4 align-middle">
                          <Badge
                            className={
                              device.connectionType === "WiFi"
                                ? "bg-gradient-to-r from-blue-500/20 to-indigo-600/20 text-blue-700 dark:text-blue-400 border-0"
                                : "bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-700 dark:text-green-400 border-0"
                            }
                          >
                            {device.connectionType}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-1">
                            {device.lastSeen === "Online" ? (
                              <>
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span>Online</span>
                              </>
                            ) : (
                              <>
                                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                <span>{device.lastSeen}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center text-xs">
                              <ArrowDownToLine className="h-3 w-3 mr-1 text-blue-500" />
                              <span>{device.downloadUsage}</span>
                            </div>
                            <div className="flex items-center text-xs">
                              <ArrowUpFromLine className="h-3 w-3 mr-1 text-green-500" />
                              <span>{device.uploadUsage}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center">
                        <p className="text-muted-foreground">No connected devices found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm hover:shadow-md transition-all"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Devices
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </CardContainer>
  )
}
