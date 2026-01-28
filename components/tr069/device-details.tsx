"use client"

import { CardContainer } from "@/components/ui/card-container"
import { Copy, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "react-hot-toast"
import { CircularProgress } from "@/components/ui/circular-progress"

interface TR069DeviceDetailsProps {
  deviceId: string
}

export function TR069DeviceDetails({ deviceId }: TR069DeviceDetailsProps) {
  // In a real app, we would fetch device data based on the ID
  const deviceData = {
    id: "d-001",
    ipAddress: "192.168.1.1",
    customerName: "John Smith",
    macAddress: "F8:1D:0F:12:34:56",
    username: "user_f81d",
    manufacturer: "TP-Link",
    softwareVersion: "v3.20.1",
    hardwareVersion: "HW-8.0",
    oui: "F8:1D:0F",
    productClass: "TL-WR940N",
    serialNumber: "F81D0F123456",
    lastInformTime: "4/10/2023, 8:32:45 AM",
    lastBootTime: "3/17/2023, 8:32:45 AM",
    registeredTime: "2/15/2023, 8:32:45 AM",
    rxPower: "-32.04 dBm",
    cpuUsage: 47,
    memoryFree: "251 MB",
    memoryUsed: "111 MB",
    memoryTotal: "512 MB",
    interval: "300 seconds",
    temperature: "29°C",
    voltage: "12.02V",
    bytesSent: "3.52 MB",
    bytesReceived: "14.51 MB",
    packetsSent: "4,081",
    packetsReceived: "84,304",
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  // Calculate memory usage percentage
  const memoryUsagePercent = Math.round(
    (Number.parseInt(deviceData.memoryUsed) / Number.parseInt(deviceData.memoryTotal)) * 100,
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CardContainer title="Device Details" gradientColor="#6366f1">
        <div className="grid grid-cols-2 gap-y-4 text-sm">
          <div className="text-muted-foreground">ID</div>
          <div>{deviceData.id}</div>

          <div className="text-muted-foreground">IP Address</div>
          <div className="flex items-center gap-1">
            {deviceData.ipAddress}
            <button
              onClick={() => copyToClipboard(deviceData.ipAddress, "IP Address")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-muted-foreground">Customer Name</div>
          <div>{deviceData.customerName}</div>

          <div className="text-muted-foreground">MAC Address</div>
          <div className="flex items-center gap-1">
            {deviceData.macAddress}
            <button
              onClick={() => copyToClipboard(deviceData.macAddress, "MAC Address")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-muted-foreground">Username</div>
          <div>{deviceData.username}</div>

          <div className="text-muted-foreground">Manufacturer</div>
          <div>{deviceData.manufacturer}</div>

          <div className="text-muted-foreground">Software Version</div>
          <div>{deviceData.softwareVersion}</div>

          <div className="text-muted-foreground">Hardware Version</div>
          <div>{deviceData.hardwareVersion}</div>

          <div className="text-muted-foreground">OUI</div>
          <div>{deviceData.oui}</div>

          <div className="text-muted-foreground">Product Class</div>
          <div>{deviceData.productClass}</div>

          <div className="text-muted-foreground">Serial Number</div>
          <div className="flex items-center gap-1">
            {deviceData.serialNumber}
            <button
              onClick={() => copyToClipboard(deviceData.serialNumber, "Serial Number")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardContainer>

      <div className="space-y-6">
        <CardContainer title="Resource Usage" gradientColor="#22c55e">
          <div className="flex justify-center gap-8 py-4">
            <CircularProgress value={deviceData.cpuUsage} label="CPU Usage" />
            <CircularProgress value={memoryUsagePercent} label="Memory Usage" color="#f59e0b" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-y-4 text-sm">
            <div className="text-muted-foreground">Last Inform Time</div>
            <div>{deviceData.lastInformTime}</div>

            <div className="text-muted-foreground">Last Boot Time</div>
            <div>{deviceData.lastBootTime}</div>

            <div className="text-muted-foreground">Registered Time</div>
            <div>{deviceData.registeredTime}</div>

            <div className="text-muted-foreground">Rx Power</div>
            <div>{deviceData.rxPower}</div>

            <div className="text-muted-foreground">Memory Free</div>
            <div>{deviceData.memoryFree}</div>

            <div className="text-muted-foreground">Memory Used</div>
            <div>{deviceData.memoryUsed}</div>

            <div className="text-muted-foreground">Memory Total</div>
            <div>{deviceData.memoryTotal}</div>

            <div className="text-muted-foreground">Interval</div>
            <div>{deviceData.interval}</div>

            <div className="text-muted-foreground">Temperature</div>
            <div>{deviceData.temperature}</div>

            <div className="text-muted-foreground">Voltage</div>
            <div>{deviceData.voltage}</div>
          </div>
        </CardContainer>

        <CardContainer title="Network Statistics" gradientColor="#3b82f6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                <ArrowUp className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Bytes Sent</div>
                <div className="font-medium">{deviceData.bytesSent}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                <ArrowDown className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Bytes Received</div>
                <div className="font-medium">{deviceData.bytesReceived}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                <ArrowUp className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Packets Sent</div>
                <div className="font-medium">{deviceData.packetsSent}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                <ArrowDown className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Packets Received</div>
                <div className="font-medium">{deviceData.packetsReceived}</div>
              </div>
            </div>
          </div>
        </CardContainer>
      </div>
    </div>
  )
}
