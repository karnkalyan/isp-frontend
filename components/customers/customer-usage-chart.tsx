"use client"

import { useTheme } from "next-themes"
import { CardContainer } from "@/components/ui/card-container"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface CustomerUsageChartProps {
  className?: string
}

// Mock data for the chart
const dailyData = [
  { date: "04/01", download: 12.5, upload: 2.3 },
  { date: "04/02", download: 15.8, upload: 3.1 },
  { date: "04/03", download: 10.2, upload: 1.8 },
  { date: "04/04", download: 18.4, upload: 4.2 },
  { date: "04/05", download: 14.3, upload: 2.7 },
  { date: "04/06", download: 9.7, upload: 1.5 },
  { date: "04/07", download: 16.2, upload: 3.4 },
  { date: "04/08", download: 13.8, upload: 2.9 },
  { date: "04/09", download: 17.5, upload: 3.8 },
  { date: "04/10", download: 11.3, upload: 2.1 },
  { date: "04/11", download: 14.7, upload: 3.0 },
  { date: "04/12", download: 16.9, upload: 3.5 },
  { date: "04/13", download: 12.1, upload: 2.4 },
  { date: "04/14", download: 15.3, upload: 3.2 },
]

const weeklyData = [
  { date: "Week 1", download: 85.6, upload: 17.2 },
  { date: "Week 2", download: 92.3, upload: 19.8 },
  { date: "Week 3", download: 78.9, upload: 15.4 },
  { date: "Week 4", download: 86.1, upload: 18.3 },
]

const monthlyData = [
  { date: "Jan", download: 320.5, upload: 65.8 },
  { date: "Feb", download: 290.2, upload: 58.7 },
  { date: "Mar", download: 310.8, upload: 62.3 },
  { date: "Apr", download: 342.5, upload: 45.8 },
]

export function CustomerUsageChart({ className }: CustomerUsageChartProps) {
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  const textColor = isDarkMode ? "#94a3b8" : "#64748b"
  const gridColor = isDarkMode ? "#334155" : "#e2e8f0"
  const tooltipBg = isDarkMode ? "#1e293b" : "#ffffff"
  const tooltipBorder = isDarkMode ? "#334155" : "#e2e8f0"

  return (
    <CardContainer title="Data Usage History" className={className}>
      <Tabs defaultValue="daily">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-muted-foreground">Download</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">Upload</span>
            </div>
          </div>
        </div>

        <TabsContent value="daily" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fill: textColor }} />
              <YAxis tick={{ fill: textColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  color: isDarkMode ? "#e2e8f0" : "#334155",
                }}
                formatter={(value: number) => [`${value} GB`, undefined]}
              />
              <Line
                type="monotone"
                dataKey="download"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="upload"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="weekly" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fill: textColor }} />
              <YAxis tick={{ fill: textColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  color: isDarkMode ? "#e2e8f0" : "#334155",
                }}
                formatter={(value: number) => [`${value} GB`, undefined]}
              />
              <Line
                type="monotone"
                dataKey="download"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="upload"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="monthly" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fill: textColor }} />
              <YAxis tick={{ fill: textColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  color: isDarkMode ? "#e2e8f0" : "#334155",
                }}
                formatter={(value: number) => [`${value} GB`, undefined]}
              />
              <Line
                type="monotone"
                dataKey="download"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="upload"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </CardContainer>
  )
}
