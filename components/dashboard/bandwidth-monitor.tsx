"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { CardContainer } from "@/components/ui/card-container"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiRequest } from "@/lib/api"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export function BandwidthMonitor() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [timeRange, setTimeRange] = useState("1h")
  const [data, setData] = useState<any>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => setMounted(true), [])

  const isDarkMode = !mounted ? true : resolvedTheme === "dark"

  const fetchTraffic = async () => {
    try {
      const response = await apiRequest(`/dashboard/traffic?range=${timeRange}`, { suppressToast: true })
      const payload = response?.data || response
      const labels = Array.isArray(payload?.labels) ? payload.labels : []
      const downloadData = Array.isArray(payload?.download) ? payload.download : []
      const uploadData = Array.isArray(payload?.upload) ? payload.upload : []

      setData({
        labels,
        datasets: [
          {
            label: "Download",
            data: downloadData,
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "Upload",
            data: uploadData,
            borderColor: "rgb(16, 185, 129)",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      })
    } catch (error) {
      console.error("Failed to fetch traffic data:", error)
      setData(null)
    }
  }

  useEffect(() => {
    fetchTraffic()
    const interval = setInterval(fetchTraffic, 5000)
    return () => clearInterval(interval)
  }, [timeRange, isDarkMode])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: isDarkMode ? "#e2e8f0" : "#334155" },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || ""
            if (label) label += ": "
            if (context.parsed.y !== null) label += context.parsed.y + " Mbps"
            return label
          },
        },
        backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.8)",
        titleColor: isDarkMode ? "#e2e8f0" : "#334155",
        bodyColor: isDarkMode ? "#e2e8f0" : "#334155",
        borderColor: isDarkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(203, 213, 225, 0.5)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false, color: isDarkMode ? "rgba(71, 85, 105, 0.3)" : "rgba(203, 213, 225, 0.5)" },
        ticks: { color: isDarkMode ? "#94a3b8" : "#64748b" },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Mbps", color: isDarkMode ? "#94a3b8" : "#64748b" },
        grid: { color: isDarkMode ? "rgba(71, 85, 105, 0.3)" : "rgba(203, 213, 225, 0.5)" },
        ticks: { color: isDarkMode ? "#94a3b8" : "#64748b" },
      },
    },
    interaction: { mode: "nearest" as const, axis: "x" as const, intersect: false },
  }

  return (
    <CardContainer title="Server Interface Traffic" description="Live Radius session throughput" forceDarkMode={!mounted}>
      <div className="flex justify-end mb-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className={`w-[120px] ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"}`}>
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent className={isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="h-[350px]">
        {data?.labels?.length ? (
          <Line ref={chartRef} options={options} data={data} />
        ) : (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            No realtime traffic data available. Enable and configure Radius accounting to populate this chart.
          </div>
        )}
      </div>
    </CardContainer>
  )
}
