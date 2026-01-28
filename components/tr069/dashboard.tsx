"use client"

import { CardContainer } from "@/components/ui/card-container"
import { Progress } from "@/components/ui/progress"
import { useTheme } from "next-themes"
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react"

export function TR069Dashboard() {
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <CardContainer
        title="Connection Status"
        description="Current device connectivity overview"
        gradientColor="#22c55e"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          {/* Online Status */}
          <div className="space-y-2 flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Track Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={isDarkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)"}
                  strokeWidth="8"
                />
                {/* Progress Circle - Online 85% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - 85 / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold" style={{ color: "#22c55e" }}>
                  85%
                </span>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: "#22c55e" }}>
                  <CheckCircle className="h-2.5 w-2.5" />
                  <span>Online</span>
                </div>
              </div>
            </div>
            <div className="text-xs font-light text-muted-foreground mt-2">425 devices</div>
          </div>

          {/* Warning Status */}
          <div className="space-y-2 flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Track Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={isDarkMode ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.1)"}
                  strokeWidth="8"
                />
                {/* Progress Circle - Warning 10% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - 10 / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold" style={{ color: "#f59e0b" }}>
                  10%
                </span>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: "#f59e0b" }}>
                  <AlertTriangle className="h-2.5 w-2.5" />
                  <span>Warning</span>
                </div>
              </div>
            </div>
            <div className="text-xs font-light text-muted-foreground mt-2">50 devices</div>
          </div>

          {/* Offline Status */}
          <div className="space-y-2 flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Track Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)"}
                  strokeWidth="8"
                />
                {/* Progress Circle - Offline 5% */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - 5 / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold" style={{ color: "#ef4444" }}>
                  5%
                </span>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: "#ef4444" }}>
                  <AlertCircle className="h-2.5 w-2.5" />
                  <span>Offline</span>
                </div>
              </div>
            </div>
            <div className="text-xs font-light text-muted-foreground mt-2">25 devices</div>
          </div>
        </div>
      </CardContainer>

      <CardContainer
        title="Device Distribution"
        description="Devices by manufacturer and model"
        gradientColor="#3b82f6"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
                <span className="text-sm font-normal">TP-Link</span>
              </div>
              <span className="text-sm font-normal">45%</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                <span className="text-sm font-normal">D-Link</span>
              </div>
              <span className="text-sm font-normal">25%</span>
            </div>
            <Progress value={25} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-purple-500"></span>
                <span className="text-sm font-normal">ASUS</span>
              </div>
              <span className="text-sm font-normal">15%</span>
            </div>
            <Progress value={15} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                <span className="text-sm font-normal">NETGEAR</span>
              </div>
              <span className="text-sm font-normal">10%</span>
            </div>
            <Progress value={10} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-500"></span>
                <span className="text-sm font-normal">Others</span>
              </div>
              <span className="text-sm font-normal">5%</span>
            </div>
            <Progress value={5} className="h-2" />
          </div>
        </div>
      </CardContainer>

      <CardContainer title="Recent Alerts" description="Latest device notifications" gradientColor="#f43f5e">
        <div className="space-y-4">
          <div className="space-y-1 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <AlertTriangle style={{ color: "#f59e0b" }} className="h-4 w-4" />
              <span className="text-sm font-normal">F81D0F123456</span>
            </div>
            <p className="text-xs font-light text-muted-foreground">Signal strength dropped below threshold</p>
            <p className="text-xs font-light text-muted-foreground">10 minutes ago</p>
          </div>

          <div className="space-y-1 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle style={{ color: "#ef4444" }} className="h-4 w-4" />
              <span className="text-sm font-normal">ZX8765123FU</span>
            </div>
            <p className="text-xs font-light text-muted-foreground">Device went offline unexpectedly</p>
            <p className="text-xs font-light text-muted-foreground">25 minutes ago</p>
          </div>

          <div className="space-y-1 p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <AlertCircle style={{ color: "#3b82f6" }} className="h-4 w-4" />
              <span className="text-sm font-normal">ABCD1234FGH</span>
            </div>
            <p className="text-xs font-light text-muted-foreground">Firmware update available</p>
            <p className="text-xs font-light text-muted-foreground">2 hours ago</p>
          </div>
        </div>
      </CardContainer>
    </div>
  )
}
