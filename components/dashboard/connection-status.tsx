"use client"

import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ConnectionStatusProps {
  onlineCount: number
  warningCount: number
  offlineCount: number
  totalDevices: number
}

export function ConnectionStatus({
  onlineCount = 425,
  warningCount = 50,
  offlineCount = 25,
  totalDevices = 500,
}: ConnectionStatusProps) {
  // Calculate percentages
  const onlinePercentage = Math.round((onlineCount / totalDevices) * 100)
  const warningPercentage = Math.round((warningCount / totalDevices) * 100)
  const offlinePercentage = Math.round((offlineCount / totalDevices) * 100)

  return (
    <Card className="connection-status-container">
      <CardHeader className="connection-status-header">
        <div>
          <CardTitle>Connection Status</CardTitle>
          <p className="connection-status-subtitle">Current device connectivity overview</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-opacity-10 bg-green-100 dark:bg-green-900/20">
            <div className="text-4xl font-bold mb-1" style={{ color: "#22c55e" }}>
              {onlinePercentage}%
            </div>
            <div className="flex items-center justify-center text-sm font-medium mb-1" style={{ color: "#22c55e" }}>
              <CheckCircle className="h-5 w-5 mr-1" style={{ color: "#22c55e" }} />
              Online
            </div>
            <div className="text-xs text-muted-foreground">{onlineCount} devices</div>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-opacity-10 bg-amber-100 dark:bg-amber-900/20">
            <div className="text-4xl font-bold mb-1" style={{ color: "#f59e0b" }}>
              {warningPercentage}%
            </div>
            <div className="flex items-center justify-center text-sm font-medium mb-1" style={{ color: "#f59e0b" }}>
              <AlertTriangle className="h-5 w-5 mr-1" style={{ color: "#f59e0b" }} />
              Warning
            </div>
            <div className="text-xs text-muted-foreground">{warningCount} devices</div>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-opacity-10 bg-red-100 dark:bg-red-900/20">
            <div className="text-4xl font-bold mb-1" style={{ color: "#ef4444" }}>
              {offlinePercentage}%
            </div>
            <div className="flex items-center justify-center text-sm font-medium mb-1" style={{ color: "#ef4444" }}>
              <XCircle className="h-5 w-5 mr-1" style={{ color: "#ef4444" }} />
              Offline
            </div>
            <div className="text-xs text-muted-foreground">{offlineCount} devices</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
