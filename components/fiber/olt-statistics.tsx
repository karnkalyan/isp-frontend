"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"

// Mock data for statistics
const trafficData = [
  { time: "00:00", upstream: 2.5, downstream: 8.2 },
  { time: "03:00", upstream: 1.8, downstream: 5.4 },
  { time: "06:00", upstream: 2.2, downstream: 6.8 },
  { time: "09:00", upstream: 4.5, downstream: 12.4 },
  { time: "12:00", upstream: 5.2, downstream: 14.8 },
  { time: "15:00", upstream: 4.9, downstream: 13.2 },
  { time: "18:00", upstream: 6.1, downstream: 18.5 },
  { time: "21:00", upstream: 4.2, downstream: 10.8 },
]

const ontStatusData = [
  { status: "Online", count: 245 },
  { status: "Offline", count: 18 },
  { status: "Degraded", count: 12 },
  { status: "Provisioning", count: 5 },
]

const portUtilizationData = [
  { port: "PON 1", active: 32, capacity: 64 },
  { port: "PON 2", active: 58, capacity: 64 },
  { port: "PON 3", active: 45, capacity: 64 },
  { port: "PON 4", active: 62, capacity: 64 },
  { port: "PON 5", active: 28, capacity: 64 },
  { port: "PON 6", active: 51, capacity: 64 },
]

export function OLTStatistics() {
  const [selectedOLT, setSelectedOLT] = useState("all")
  const [timeRange, setTimeRange] = useState("24h")

  const gradientColor = "#10b981" // Emerald color for consistent styling

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-64">
          <Select value={selectedOLT} onValueChange={setSelectedOLT}>
            <SelectTrigger>
              <SelectValue placeholder="Select OLT" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All OLTs</SelectItem>
              <SelectItem value="olt-001">Huawei MA5800-X7</SelectItem>
              <SelectItem value="olt-002">ZTE C320</SelectItem>
              <SelectItem value="olt-003">Nokia 7360 ISAM FX</SelectItem>
              <SelectItem value="olt-004">Calix E7-2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-48">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger>
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6h">Last 6 hours</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="traffic" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="ont-status">ONT Status</TabsTrigger>
          <TabsTrigger value="port-utilization">Port Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="mt-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
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
                  background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
                }}
              />

              {/* Bottom-right corner gradient */}
              <div
                className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
                style={{
                  background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
                }}
              />

              <CardHeader className="relative z-10">
                <CardTitle>Traffic Statistics</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trafficData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="time" stroke="#888" />
                      <YAxis stroke="#888" unit=" Gbps" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(22, 22, 22, 0.9)",
                          border: "1px solid #333",
                          borderRadius: "4px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="downstream"
                        name="Downstream"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="upstream"
                        name="Upstream"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>

              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-700" />
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="ont-status" className="mt-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
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
                  background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
                }}
              />

              {/* Bottom-right corner gradient */}
              <div
                className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
                style={{
                  background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
                }}
              />

              <CardHeader className="relative z-10">
                <CardTitle>ONT Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ontStatusData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="status" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(22, 22, 22, 0.9)",
                          border: "1px solid #333",
                          borderRadius: "4px",
                        }}
                      />
                      <Bar dataKey="count" name="ONT Count" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>

              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-700" />
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="port-utilization" className="mt-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
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
                  background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
                }}
              />

              {/* Bottom-right corner gradient */}
              <div
                className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
                style={{
                  background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
                }}
              />

              <CardHeader className="relative z-10">
                <CardTitle>PON Port Utilization</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={portUtilizationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="port" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(22, 22, 22, 0.9)",
                          border: "1px solid #333",
                          borderRadius: "4px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="active" name="Active ONTs" fill="url(#activeGradient)" radius={[4, 4, 0, 0]} />
                      <Bar
                        dataKey="capacity"
                        name="Total Capacity"
                        fill="url(#capacityGradient)"
                        radius={[4, 4, 0, 0]}
                        opacity={0.4}
                      />
                      <defs>
                        <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6b7280" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#4b5563" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>

              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-700" />
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
