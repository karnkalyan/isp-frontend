"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { motion } from "framer-motion"
import { AlertTriangle, AlertCircle, Bell, CheckCircle2, Search } from "lucide-react"

// Mock data for alarms
const mockAlarms = [
  {
    id: "alarm-001",
    oltId: "olt-001",
    severity: "critical",
    type: "Hardware",
    message: "Fan failure detected",
    timestamp: "2023-05-12T08:23:15",
    status: "active",
    port: "System",
  },
  {
    id: "alarm-002",
    oltId: "olt-001",
    severity: "major",
    type: "Connectivity",
    message: "High BER on PON port 3",
    timestamp: "2023-05-12T10:45:22",
    status: "active",
    port: "PON 3",
  },
  {
    id: "alarm-003",
    oltId: "olt-001",
    severity: "minor",
    type: "Performance",
    message: "Increased packet loss on PON port 8",
    timestamp: "2023-05-12T11:12:05",
    status: "active",
    port: "PON 8",
  },
  {
    id: "alarm-004",
    oltId: "olt-002",
    severity: "warning",
    type: "Environmental",
    message: "Temperature above threshold",
    timestamp: "2023-05-12T09:34:18",
    status: "active",
    port: "System",
  },
  {
    id: "alarm-005",
    oltId: "olt-001",
    severity: "critical",
    type: "Power",
    message: "Power supply unit failure",
    timestamp: "2023-05-11T22:15:30",
    status: "resolved",
    port: "System",
  },
  {
    id: "alarm-006",
    oltId: "olt-003",
    severity: "major",
    type: "Connectivity",
    message: "Multiple ONT disconnections on PON port 5",
    timestamp: "2023-05-12T07:22:45",
    status: "active",
    port: "PON 5",
  },
]

export function OLTAlarms() {
  const [selectedOLT, setSelectedOLT] = useState("all")
  const [selectedSeverity, setSelectedSeverity] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter alarms based on selections
  const filteredAlarms = mockAlarms.filter((alarm) => {
    if (selectedOLT !== "all" && alarm.oltId !== selectedOLT) return false
    if (selectedSeverity !== "all" && alarm.severity !== selectedSeverity) return false
    if (selectedStatus !== "all" && alarm.status !== selectedStatus) return false
    if (searchQuery && !alarm.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Count alarms by severity
  const criticalCount = filteredAlarms.filter((a) => a.severity === "critical" && a.status === "active").length
  const majorCount = filteredAlarms.filter((a) => a.severity === "major" && a.status === "active").length
  const minorCount = filteredAlarms.filter((a) => a.severity === "minor" && a.status === "active").length
  const warningCount = filteredAlarms.filter((a) => a.severity === "warning" && a.status === "active").length

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0">
            <AlertCircle size={12} className="mr-1" /> Critical
          </Badge>
        )
      case "major":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0">
            <AlertTriangle size={12} className="mr-1" /> Major
          </Badge>
        )
      case "minor":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-0">
            <Bell size={12} className="mr-1" /> Minor
          </Badge>
        )
      case "warning":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-0">
            <Bell size={12} className="mr-1" /> Warning
          </Badge>
        )
      default:
        return <Badge className="border-0">{severity}</Badge>
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0">Active</Badge>
      case "resolved":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0">
            <CheckCircle2 size={12} className="mr-1" /> Resolved
          </Badge>
        )
      default:
        return <Badge className="border-0">{status}</Badge>
    }
  }

  // Table columns
  const columns = [
    {
      key: "severity",
      header: "Severity",
      cell: (alarm: (typeof mockAlarms)[0]) => getSeverityBadge(alarm.severity),
    },
    {
      key: "message",
      header: "Message",
      cell: (alarm: (typeof mockAlarms)[0]) => <span>{alarm.message}</span>,
    },
    {
      key: "port",
      header: "Port",
      cell: (alarm: (typeof mockAlarms)[0]) => <span>{alarm.port}</span>,
    },
    {
      key: "timestamp",
      header: "Time",
      cell: (alarm: (typeof mockAlarms)[0]) => <span>{formatDate(alarm.timestamp)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (alarm: (typeof mockAlarms)[0]) => getStatusBadge(alarm.status),
    },
    {
      key: "actions",
      header: "",
      cell: (alarm: (typeof mockAlarms)[0]) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="hover:bg-transparent">
            Details
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="relative overflow-hidden border-none bg-gradient-to-br from-red-500/10 to-red-700/10">
            {/* Top gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-700" />

            {/* Left gradient */}
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-red-700" />

            {/* Right gradient */}
            <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-red-700" />

            {/* Top-left corner gradient */}
            <div
              className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, #ef4444 0%, transparent 70%)`,
              }}
            />

            {/* Bottom-right corner gradient */}
            <div
              className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, #ef4444 0%, transparent 70%)`,
              }}
            />

            <CardContent className="p-4 flex justify-between items-center relative z-10">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold">{criticalCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </CardContent>

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-700" />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-none bg-gradient-to-br from-amber-500/10 to-amber-700/10">
            {/* Top gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-700" />

            {/* Left gradient */}
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-amber-700" />

            {/* Right gradient */}
            <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-amber-700" />

            {/* Top-left corner gradient */}
            <div
              className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, #f59e0b 0%, transparent 70%)`,
              }}
            />

            {/* Bottom-right corner gradient */}
            <div
              className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, #f59e0b 0%, transparent 70%)`,
              }}
            />

            <CardContent className="p-4 flex justify-between items-center relative z-10">
              <div>
                <p className="text-sm text-muted-foreground">Major</p>
                <p className="text-2xl font-bold">{majorCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </CardContent>

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-700" />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-none bg-gradient-to-br from-yellow-500/10 to-yellow-700/10">
            {/* Top gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-yellow-700" />

            {/* Left gradient */}
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-yellow-500 to-yellow-700" />

            {/* Right gradient */}
            <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-yellow-500 to-yellow-700" />

            {/* Top-left corner gradient */}
            <div
              className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, #eab308 0%, transparent 70%)`,
              }}
            />

            {/* Bottom-right corner gradient */}
            <div
              className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, #eab308 0%, transparent 70%)`,
              }}
            />

            <CardContent className="p-4 flex justify-between items-center relative z-10">
              <div>
                <p className="text-sm text-muted-foreground">Minor</p>
                <p className="text-2xl font-bold">{minorCount}</p>
              </div>
              <Bell className="h-8 w-8 text-yellow-500" />
            </CardContent>

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-yellow-700" />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-none bg-gradient-to-br from-blue-500/10 to-blue-700/10">
            {/* Top gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-700" />

            {/* Left gradient */}
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-700" />

            {/* Right gradient */}
            <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-700" />

            {/* Top-left corner gradient */}
            <div
              className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, #3b82f6 0%, transparent 70%)`,
              }}
            />

            {/* Bottom-right corner gradient */}
            <div
              className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, #3b82f6 0%, transparent 70%)`,
              }}
            />

            <CardContent className="p-4 flex justify-between items-center relative z-10">
              <div>
                <p className="text-sm text-muted-foreground">Warning</p>
                <p className="text-2xl font-bold">{warningCount}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </CardContent>

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-700" />
          </Card>
        </motion.div>
      </div>

      <Card className="relative overflow-hidden border-none">
        {/* Top gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-700" />

        {/* Left gradient */}
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-700" />

        {/* Right gradient */}
        <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-700" />

        {/* Top-left corner gradient */}
        <div
          className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, #10b981 0%, transparent 70%)`,
          }}
        />

        {/* Bottom-right corner gradient */}
        <div
          className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, #10b981 0%, transparent 70%)`,
          }}
        />

        <CardHeader className="relative z-10">
          <CardTitle>Alarm History</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search alarms..."
                className="pl-10 border-0 focus:ring-0 focus:ring-offset-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-40">
                <Select value={selectedOLT} onValueChange={setSelectedOLT}>
                  <SelectTrigger className="border-0 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="OLT" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All OLTs</SelectItem>
                    <SelectItem value="olt-001">Huawei MA5800-X7</SelectItem>
                    <SelectItem value="olt-002">ZTE C320</SelectItem>
                    <SelectItem value="olt-003">Nokia 7360 ISAM FX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-40">
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="border-0 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-40">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="border-0 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-md overflow-hidden">
            <DataTable
              data={filteredAlarms}
              columns={columns}
              className="[&_table]:border-collapse [&_th]:border-0 [&_td]:border-0 [&_tr]:border-0"
              emptyState={
                <div className="flex flex-col items-center justify-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No alarms found</p>
                </div>
              }
            />
          </div>
        </CardContent>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-700" />
      </Card>
    </div>
  )
}
