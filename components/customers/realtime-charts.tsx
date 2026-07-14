"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Play, Pause } from "lucide-react"
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
import { apiRequest } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface RadiusSession {
    radacctid: number
    acctsessionid: string
    acctuniqueid: string
    username: string
    realm: string
    nasipaddress: string
    nasportid: string
    nasporttype: string
    acctstarttime: string | null
    acctupdatetime: string | null
    acctstoptime: string | null
    acctinterval: number | null
    acctsessiontime: number | null
    acctauthentic: string
    connectinfo_start: string
    connectinfo_stop: string
    acctinputoctets: number
    acctoutputoctets: number
    calledstationid: string
    callingstationid: string
    acctterminatecause: string
    servicetype: string
    framedprotocol: string
    framedipaddress: string
    framedipv6address: string
    framedipv6prefix: string
    framedinterfaceid: string
    delegatedipv6prefix: string
    class: any
}

interface RealtimeUsageChartProps {
    usernames: string[]
}

export function RealtimeUsageChart({ usernames }: RealtimeUsageChartProps) {
    const { resolvedTheme } = useTheme()
    const [selectedUser, setSelectedUser] = useState<string>("")
    const [sessions, setSessions] = useState<RadiusSession[]>([])
    const [loading, setLoading] = useState(false)
    const [liveUpdate, setLiveUpdate] = useState(false)
    const [intervalSec, setIntervalSec] = useState<number>(60)
    const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("1h")
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const chartRef = useRef<any>(null)

    useEffect(() => {
        if (usernames.length > 0 && !selectedUser) {
            setSelectedUser(usernames[0])
        }
    }, [usernames, selectedUser])

    const fetchSessions = useCallback(async (username: string) => {
        if (!username) return
        setLoading(true)
        try {
            const response = await apiRequest<{ success: boolean; data: RadiusSession[] }>(
                `/services/radius/act/${username}`
            )
            if (response.success && response.data) {
                setSessions(response.data)
            } else {
                toast({
                    title: "Error",
                    description: "Failed to fetch usage data",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error fetching RADIUS sessions:", error)
            toast({
                title: "Error",
                description: "Failed to fetch usage data",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (selectedUser) {
            fetchSessions(selectedUser)
        }
    }, [selectedUser, fetchSessions])

    useEffect(() => {
        if (liveUpdate && selectedUser) {
            intervalRef.current = setInterval(() => {
                fetchSessions(selectedUser)
            }, intervalSec * 1000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [liveUpdate, intervalSec, selectedUser, fetchSessions])

    const toggleLiveUpdate = () => setLiveUpdate(prev => !prev)

    // Process data for chart
    const getChartData = useCallback(() => {
        const now = Date.now()
        let startTime: number
        let intervalMinutes: number
        let points: number

        switch (timeRange) {
            case "1h":
                startTime = now - 60 * 60 * 1000
                intervalMinutes = 1 // 1 minute buckets
                points = 60
                break
            case "24h":
                startTime = now - 24 * 60 * 60 * 1000
                intervalMinutes = 60 // 1 hour buckets
                points = 24
                break
            case "7d":
                startTime = now - 7 * 24 * 60 * 60 * 1000
                intervalMinutes = 24 * 60 // 1 day buckets
                points = 7
                break
        }

        // Create buckets
        const buckets: { [key: string]: { download: number; upload: number } } = {}
        for (let i = 0; i < points; i++) {
            const time = new Date(startTime + i * intervalMinutes * 60 * 1000)
            let key: string
            if (timeRange === "1h") {
                key = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            } else if (timeRange === "24h") {
                key = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            } else {
                key = time.toLocaleDateString([], { month: 'short', day: 'numeric' })
            }
            buckets[key] = { download: 0, upload: 0 }
        }

        // Fill buckets with session data
        sessions.forEach(session => {
            if (!session.acctstarttime) return
            const start = new Date(session.acctstarttime).getTime()
            if (start < startTime) return

            const bucketIndex = Math.floor((start - startTime) / (intervalMinutes * 60 * 1000))
            const keys = Object.keys(buckets)
            if (bucketIndex >= 0 && bucketIndex < keys.length) {
                const key = keys[bucketIndex]
                buckets[key].download += session.acctoutputoctets / (1024 * 1024) // MB
                buckets[key].upload += session.acctinputoctets / (1024 * 1024)
            }
        })

        const labels = Object.keys(buckets)
        const downloadData = labels.map(l => buckets[l].download)
        const uploadData = labels.map(l => buckets[l].upload)

        return { labels, downloadData, uploadData }
    }, [sessions, timeRange])

    const isDarkMode = resolvedTheme === "dark"
    const { labels, downloadData, uploadData } = getChartData()

    const chartData = {
        labels,
        datasets: [
            {
                label: "Download (MB)",
                data: downloadData,
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                fill: true,
                tension: 0.4,
            },
            {
                label: "Upload (MB)",
                data: uploadData,
                borderColor: "rgb(16, 185, 129)",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                fill: true,
                tension: 0.4,
            },
        ],
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
                        if (context.parsed.y !== null) label += context.parsed.y.toFixed(2) + " MB"
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
                title: { display: true, text: "MB", color: isDarkMode ? "#94a3b8" : "#64748b" },
                grid: { color: isDarkMode ? "rgba(71, 85, 105, 0.3)" : "rgba(203, 213, 225, 0.5)" },
                ticks: { color: isDarkMode ? "#94a3b8" : "#64748b" },
            },
        },
        interaction: { mode: "nearest" as const, axis: "x" as const, intersect: false },
    }

    if (usernames.length === 0) {
        return <div className="text-center py-4 text-muted-foreground">No connection users available</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="w-48">
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                            {usernames.map((user) => (
                                <SelectItem key={user} value={user}>
                                    {user}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Button size="sm" variant={liveUpdate ? "default" : "outline"} onClick={toggleLiveUpdate} className="gap-2">
                        {liveUpdate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {liveUpdate ? "Stop" : "Start"} Live Update
                    </Button>

                    <Select value={intervalSec.toString()} onValueChange={(val) => setIntervalSec(parseInt(val))} disabled={!liveUpdate}>
                        <SelectTrigger className="w-28">
                            <SelectValue placeholder="Interval" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 sec</SelectItem>
                            <SelectItem value="60">1 min</SelectItem>
                            <SelectItem value="300">5 min</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={timeRange} onValueChange={(val: "1h" | "24h" | "7d") => setTimeRange(val)}>
                        <SelectTrigger className="w-28">
                            <SelectValue placeholder="Time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1h">Last Hour</SelectItem>
                            <SelectItem value="24h">Last 24h</SelectItem>
                            <SelectItem value="7d">Last 7d</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            )}

            {!loading && sessions.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">No sessions found</div>
            )}

            {!loading && sessions.length > 0 && (
                <div className="h-80 w-full">
                    <Line ref={chartRef} data={chartData} options={options} />
                </div>
            )}
        </div>
    )
}