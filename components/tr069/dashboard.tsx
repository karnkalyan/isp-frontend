"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Progress } from "@/components/ui/progress"
import { useTheme } from "next-themes"
import { AlertCircle, AlertTriangle, CheckCircle, Signal, SignalHigh, SignalLow, SignalMedium } from "lucide-react"
import { apiRequest } from "@/lib/api"

type Device = {
  device: string
  ipAddress: string
  status: string
  signal: string
  lastContact: string
  uptime: string
  ProductClass: string
  Manufacturer: string
  SerialNumber: string
  OUI: string
}

type ApiResponse = {
  success: boolean
  total: number
  devices: Device[]
}

export function TR069Dashboard() {
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"
  const [deviceData, setDeviceData] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setIsLoading(true)
        const data = await apiRequest<ApiResponse>("/services/genieacs/devices")
        if (data.success) {
          setDeviceData(data)
        }
      } catch (err) {
        console.error("Failed to load devices:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDevices()
  }, [])

  // Calculate device statistics
  const deviceStats = deviceData?.devices.reduce(
    (acc, device) => {
      const status = device.status.toLowerCase()
      if (status.includes("online")) {
        acc.online += 1
      } else if (status.includes("offline")) {
        acc.offline += 1
      } else {
        acc.warning += 1
      }
      return acc
    },
    { online: 0, offline: 0, warning: 0 }
  ) || { online: 0, offline: 0, warning: 0 }

  const totalDevices = deviceData?.total || 0
  const onlinePercentage = totalDevices ? Math.round((deviceStats.online / totalDevices) * 100) : 0
  const warningPercentage = totalDevices ? Math.round((deviceStats.warning / totalDevices) * 100) : 0
  const offlinePercentage = totalDevices ? Math.round((deviceStats.offline / totalDevices) * 100) : 0

  // Calculate manufacturer distribution
  const manufacturerDistribution = deviceData?.devices.reduce((acc: Record<string, number>, device) => {
    const manufacturer = device.Manufacturer
    acc[manufacturer] = (acc[manufacturer] || 0) + 1
    return acc
  }, {}) || {}

  // Parse signal strength to numeric value
  const parseSignalStrength = (signal: string): number | null => {
    if (signal === "N/A dBm" || !signal || signal === "N/A") return null

    const match = signal.match(/([+-]?\d+(?:\.\d+)?)/)
    if (match) {
      return parseFloat(match[1])
    }
    return null
  }

  // Get signal status and color based on dBm value
  const getSignalStatus = (signalValue: number | null): { status: string; color: string; icon: any } => {
    if (signalValue === null) {
      return { status: "N/A", color: "#6b7280", icon: Signal }
    }

    // Critical: below -24 dBm or above -18 dBm? 
    // Typically for optical power, lower is worse (more negative)
    // Below -24 dBm is too weak, above -18 dBm is too strong
    if (signalValue < -24 || signalValue > -18) {
      return { status: "Critical", color: "#ef4444", icon: AlertCircle }
    } else if (signalValue < -22 || signalValue > -19) {
      return { status: "Warning", color: "#f59e0b", icon: AlertTriangle }
    } else {
      return { status: "Good", color: "#22c55e", icon: Signal }
    }
  }

  // Format time difference in human readable format
  const formatTimeDifference = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h ${diffMinutes % 60}m ago`
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`
    } else {
      return 'Just now'
    }
  }

  const getRecentAlerts = () => {
    if (!deviceData?.devices) return []

    const now = new Date()
    const alerts = []

    // Check for offline devices and critical signal strength
    deviceData.devices.forEach(device => {
      const lastContact = new Date(device.lastContact)
      const hoursDiff = (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60)
      const signalValue = parseSignalStrength(device.signal)
      const signalStatus = getSignalStatus(signalValue)

      // Offline alert
      if (device.status.toLowerCase() === "offline") {
        alerts.push({
          id: `${device.SerialNumber}-offline`,
          deviceName: device.device,
          message: "Device went offline unexpectedly",
          timeAgo: formatTimeDifference(lastContact),
          type: "offline",
          icon: AlertCircle,
          color: "#ef4444",
          bgColor: "red"
        })
      }

      // No recent contact alert
      else if (hoursDiff > 24) {
        alerts.push({
          id: `${device.SerialNumber}-nocontact`,
          deviceName: device.device,
          message: "No recent contact with device",
          timeAgo: formatTimeDifference(lastContact),
          type: "warning",
          icon: AlertCircle,
          color: "#3b82f6",
          bgColor: "blue"
        })
      }

      // Critical signal strength alert
      if (signalValue !== null && (signalValue < -24 || signalValue > -18)) {
        alerts.push({
          id: `${device.SerialNumber}-signal`,
          deviceName: device.device,
          message: `Critical signal strength: ${device.signal}`,
          timeAgo: formatTimeDifference(lastContact),
          type: "critical",
          icon: AlertCircle,
          color: "#ef4444",
          bgColor: "red"
        })
      }
    })

    // Sort by most recent and limit to 3
    return alerts
      .sort((a, b) => {
        const aTime = a.timeAgo.includes('d') ? parseInt(a.timeAgo) * 1440 :
          a.timeAgo.includes('h') ? parseInt(a.timeAgo) * 60 :
            parseInt(a.timeAgo) || 0
        const bTime = b.timeAgo.includes('d') ? parseInt(b.timeAgo) * 1440 :
          b.timeAgo.includes('h') ? parseInt(b.timeAgo) * 60 :
            parseInt(b.timeAgo) || 0
        return aTime - bTime
      })
      .slice(0, 3)
  }

  const recentAlerts = getRecentAlerts()

  // Calculate devices with critical signal
  const devicesWithCriticalSignal = deviceData?.devices.filter(device => {
    const signalValue = parseSignalStrength(device.signal)
    return signalValue !== null && (signalValue < -24 || signalValue > -18)
  }).length || 0

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <CardContainer key={i} title="Loading..." description="Please wait" gradientColor="#6366f1">
            <div className="animate-pulse space-y-4">
              <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </CardContainer>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <CardContainer
        title="Connection Status"
        description={`Current device connectivity overview (${totalDevices} total devices)`}
        gradientColor="#22c55e"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          {/* Online Status */}
          <div className="space-y-2 flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={isDarkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)"}
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - onlinePercentage / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold" style={{ color: "#22c55e" }}>
                  {onlinePercentage}%
                </span>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: "#22c55e" }}>
                  <CheckCircle className="h-2.5 w-2.5" />
                  <span>Online</span>
                </div>
              </div>
            </div>
            <div className="text-xs font-light text-muted-foreground mt-2">{deviceStats.online} devices</div>
          </div>

          {/* Warning Status */}
          <div className="space-y-2 flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={isDarkMode ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.1)"}
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - warningPercentage / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold" style={{ color: "#f59e0b" }}>
                  {warningPercentage}%
                </span>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: "#f59e0b" }}>
                  <AlertTriangle className="h-2.5 w-2.5" />
                  <span>Warning</span>
                </div>
              </div>
            </div>
            <div className="text-xs font-light text-muted-foreground mt-2">{deviceStats.warning} devices</div>
          </div>

          {/* Offline Status */}
          <div className="space-y-2 flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)"}
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - offlinePercentage / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold" style={{ color: "#ef4444" }}>
                  {offlinePercentage}%
                </span>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: "#ef4444" }}>
                  <AlertCircle className="h-2.5 w-2.5" />
                  <span>Offline</span>
                </div>
              </div>
            </div>
            <div className="text-xs font-light text-muted-foreground mt-2">{deviceStats.offline} devices</div>
          </div>
        </div>

        {/* Critical Signal Summary */}
        {devicesWithCriticalSignal > 0 && (
          <div className="mt-4 p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium text-red-700 dark:text-red-400">
                {devicesWithCriticalSignal} device{devicesWithCriticalSignal !== 1 ? 's' : ''} with critical signal strength
              </span>
            </div>
          </div>
        )}
      </CardContainer>

      <CardContainer
        title="Device Distribution"
        description="Devices by manufacturer and model"
        gradientColor="#3b82f6"
      >
        <div className="space-y-3">
          {Object.entries(manufacturerDistribution)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([manufacturer, count], index) => {
              const percentage = totalDevices ? Math.round((count / totalDevices) * 100) : 0
              const colors = [
                { dot: "bg-green-500", bar: "bg-green-500" },
                { dot: "bg-blue-500", bar: "bg-blue-500" },
                { dot: "bg-purple-500", bar: "bg-purple-500" },
                { dot: "bg-amber-500", bar: "bg-amber-500" },
                { dot: "bg-gray-500", bar: "bg-gray-500" },
              ]
              const color = colors[index % colors.length]

              // Shorten manufacturer name if too long
              const displayName = manufacturer.length > 20
                ? manufacturer.substring(0, 20) + "..."
                : manufacturer

              return (
                <div key={manufacturer} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${color.dot}`}></span>
                      <span className="text-sm font-normal">{displayName}</span>
                    </div>
                    <span className="text-sm font-normal">{percentage}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full ${color.bar}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      </CardContainer>

      <CardContainer title="Recent Alerts" description="Latest device notifications" gradientColor="#f43f5e">
        <div className="space-y-4">
          {recentAlerts.length > 0 ? (
            recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`space-y-1 p-3 rounded-md bg-${alert.bgColor}-50 dark:bg-${alert.bgColor}-900/20 border border-${alert.bgColor}-200 dark:border-${alert.bgColor}-800`}
              >
                <div className="flex items-center gap-2">
                  <alert.icon style={{ color: alert.color }} className="h-4 w-4" />
                  <span className="text-sm font-medium">{alert.deviceName}</span>
                </div>
                <p className="text-xs font-light text-muted-foreground">{alert.message}</p>
                <p className="text-xs font-light text-muted-foreground">{alert.timeAgo}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No active alerts
            </div>
          )}
        </div>
      </CardContainer>
    </div>
  )
}