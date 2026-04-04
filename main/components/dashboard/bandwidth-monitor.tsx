"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { CardContainer } from "@/components/ui/card-container"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

  useEffect(() => {
    generateData()
    const interval = setInterval(updateData, 5000)
    return () => clearInterval(interval)
  }, [timeRange, isDarkMode])

  const generateData = () => {
    const labels: string[] = []
    const downloadData: number[] = []
    const uploadData: number[] = []

    const now = new Date()
    const pointCount = timeRange === "1h" ? 60 : timeRange === "24h" ? 24 : 7

    for (let i = pointCount - 1; i >= 0; i--) {
      const time = new Date(now)
      if (timeRange === "1h") {
        time.setMinutes(now.getMinutes() - i)
        labels.push(`${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`)
      } else if (timeRange === "24h") {
        time.setHours(now.getHours() - i)
        labels.push(`${time.getHours().toString().padStart(2, "0")}:00`)
      } else {
        time.setDate(now.getDate() - i)
        labels.push(time.toLocaleDateString("en-US", { weekday: "short" }))
      }

      downloadData.push(Math.floor(800 + Math.random() * 400))
      uploadData.push(Math.floor(300 + Math.random() * 200))
    }

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
  }

  const updateData = () => {
    if (!chartRef.current) return
    const chart = chartRef.current
    const newDownload = Math.floor(800 + Math.random() * 400)
    const newUpload = Math.floor(300 + Math.random() * 200)

    chart.data.datasets[0].data.shift()
    chart.data.datasets[0].data.push(newDownload)
    chart.data.datasets[1].data.shift()
    chart.data.datasets[1].data.push(newUpload)

    const now = new Date()
    chart.data.labels.shift()
    if (timeRange === "1h") {
      chart.data.labels.push(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`)
    } else if (timeRange === "24h") {
      chart.data.labels.push(`${now.getHours().toString().padStart(2, "0")}:00`)
    } else {
      chart.data.labels.push(now.toLocaleDateString("en-US", { weekday: "short" }))
    }
    chart.update()
  }

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
    <CardContainer title="Bandwidth Usage" description="Real-time network traffic monitoring" forceDarkMode={!mounted}>
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
      <div className="h-[350px]">{data && <Line ref={chartRef} options={options} data={data} />}</div>
    </CardContainer>
  )
}