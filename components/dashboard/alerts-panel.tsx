"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { CardContainer } from "@/components/ui/card-container"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, AlertCircle, Clock, Bell } from "lucide-react"

// Mock data for alerts
const alerts = [
  {
    id: "ALERT-001",
    title: "High CPU Usage",
    description: "RADIUS server CPU usage exceeded 80% for more than 5 minutes",
    timestamp: "10 minutes ago",
    severity: "critical",
    status: "active",
  },
  {
    id: "ALERT-002",
    title: "Authentication Failures",
    description: "Multiple failed authentication attempts detected from IP 192.168.1.45",
    timestamp: "15 minutes ago",
    severity: "warning",
    status: "active",
  },
  {
    id: "ALERT-003",
    title: "Bandwidth Threshold Exceeded",
    description: "User john.doe@example.com exceeded 90% of monthly bandwidth allocation",
    timestamp: "30 minutes ago",
    severity: "warning",
    status: "active",
  },
  {
    id: "ALERT-004",
    title: "Network Switch Offline",
    description: "Switch SW-002 is not responding to ping requests",
    timestamp: "45 minutes ago",
    severity: "critical",
    status: "acknowledged",
  },
  {
    id: "ALERT-005",
    title: "Database Backup Failed",
    description: "Scheduled backup of RADIUS database failed to complete",
    timestamp: "1 hour ago",
    severity: "warning",
    status: "acknowledged",
  },
  {
    id: "ALERT-006",
    title: "SSL Certificate Expiring",
    description: "RADIUS server SSL certificate will expire in 7 days",
    timestamp: "2 hours ago",
    severity: "info",
    status: "active",
  },
  {
    id: "ALERT-007",
    title: "System Update Available",
    description: "New security update available for RADIUS server",
    timestamp: "3 hours ago",
    severity: "info",
    status: "resolved",
  },
]

export function AlertsPanel() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("active")

  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), [])

  const isDarkMode = !mounted ? true : resolvedTheme === "dark"

  const filteredAlerts = alerts.filter((alert) => {
    if (activeTab === "all") return true
    return alert.status === activeTab
  })

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "info":
        return <Bell className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  return (
    <CardContainer title="System Alerts" description="Active alerts requiring attention" forceDarkMode={!mounted}>
      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`mb-4 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-0">
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex gap-4 p-4 border rounded-md ${
                  isDarkMode ? "border-slate-800 hover:bg-slate-800/30" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{alert.title}</h4>
                    <StatusBadge
                      status={alert.status as any}
                      className={alert.status === "acknowledged" ? "bg-amber-500/20 text-amber-600" : undefined}
                    />
                  </div>
                  <p className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className={`flex items-center text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {alert.timestamp}
                    </div>
                    <div className="flex gap-2">
                      {alert.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={
                            isDarkMode
                              ? "border-slate-700 hover:bg-slate-800 text-slate-300"
                              : "border-slate-200 hover:bg-slate-100 text-slate-700"
                          }
                        >
                          Acknowledge
                        </Button>
                      )}
                      {(alert.status === "active" || alert.status === "acknowledged") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={
                            isDarkMode
                              ? "border-slate-700 hover:bg-slate-800 text-slate-300"
                              : "border-slate-200 hover:bg-slate-100 text-slate-700"
                          }
                        >
                          Resolve
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          isDarkMode
                            ? "border-slate-700 hover:bg-slate-800 text-slate-300"
                            : "border-slate-200 hover:bg-slate-100 text-slate-700"
                        }
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </CardContainer>
  )
}
