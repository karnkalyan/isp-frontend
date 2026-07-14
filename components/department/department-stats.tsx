"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Building, Users, UsersRound, BarChart3, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { departmentApi } from "@/lib/api/department"

interface DepartmentStatsData {
    totalDepartments: number;
    activeUsers: number;
    unassignedUsers: number;
    inactiveDepartments: number;
}

interface StatCardData {
    title: string
    value: string
    change: string
    icon: React.ElementType
    iconBg: string
    gradientFrom: string
    gradientTo: string
}

export function DepartmentStatsCards() {
    const [stats, setStats] = useState<DepartmentStatsData>({
        totalDepartments: 0,
        activeUsers: 0,
        unassignedUsers: 0,
        inactiveDepartments: 0
    })
    const [loading, setLoading] = useState(false)
    const [previousStats, setPreviousStats] = useState<DepartmentStatsData | null>(null)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            setLoading(true)
            // Store current stats as previous
            setPreviousStats(stats)

            const statsData = await departmentApi.getStats()
            setStats(statsData)
        } catch (error) {
            console.error("Failed to fetch stats:", error)
        } finally {
            setLoading(false)
        }
    }

    // Calculate percentage change (simulated for demo)
    const calculateChange = (current: number, previous: number | null) => {
        if (!previous || previous === 0) return "+0%"
        const change = ((current - previous) / previous) * 100
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
    }

    const statCards: StatCardData[] = [
        {
            title: "Total Departments",
            value: loading ? "" : stats.totalDepartments.toString(),
            change: loading ? "+0%" : calculateChange(stats.totalDepartments, previousStats?.totalDepartments || 0),
            icon: Building,
            iconBg: "#3B82F6", // Blue
            gradientFrom: "#3B82F6",
            gradientTo: "#10B981",
        },
        {
            title: "Active Users",
            value: loading ? "" : stats.activeUsers.toString(),
            change: loading ? "+0%" : calculateChange(stats.activeUsers, previousStats?.activeUsers || 0),
            icon: Users,
            iconBg: "#10B981", // Green
            gradientFrom: "#10B981",
            gradientTo: "#3B82F6",
        },
        {
            title: "Unassigned Users",
            value: loading ? "" : stats.unassignedUsers.toString(),
            change: loading ? "+0%" : calculateChange(stats.unassignedUsers, previousStats?.unassignedUsers || 0),
            icon: UsersRound,
            iconBg: "#F59E0B", // Amber
            gradientFrom: "#F59E0B",
            gradientTo: "#EF4444",
        },
        {
            title: "Inactive Departments",
            value: loading ? "" : stats.inactiveDepartments.toString(),
            change: loading ? "+0%" : calculateChange(stats.inactiveDepartments, previousStats?.inactiveDepartments || 0),
            icon: BarChart3,
            iconBg: "#EF4444", // Red
            gradientFrom: "#EF4444",
            gradientTo: "#EC4899",
        },
    ]

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                    >
                        <div className="bg-white dark:bg-[#0f172a] p-6 relative overflow-hidden rounded-xl border border-gray-200 dark:border-[#1e293b]">
                            <div className="animate-pulse">
                                <div className="flex flex-row items-center justify-between pb-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                </div>
                                <div className="mt-2">
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, index) => (
                <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                    <StatCard {...stat} />
                </motion.div>
            ))}
        </div>
    )
}

interface StatCardProps {
    title: string
    value: string
    change: string
    icon: React.ElementType
    iconBg: string
    gradientFrom: string
    gradientTo: string
}

function StatCard({ title, value, change, icon: Icon, iconBg, gradientFrom, gradientTo }: StatCardProps) {
    const isPositive = !change.startsWith("-")
    const [isDarkMode, setIsDarkMode] = useState(true)

    // Add useEffect to detect theme changes
    useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains("dark"))

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class") {
                    setIsDarkMode(document.documentElement.classList.contains("dark"))
                }
            })
        })

        observer.observe(document.documentElement, { attributes: true })
        return () => observer.disconnect()
    }, [])

    return (
        <div
            className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} p-6 relative overflow-hidden rounded-xl border ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"}`}
        >
            {/* Gradient background effect */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`
                }}
            />

            <div className="flex flex-row items-center justify-between pb-2 relative z-10">
                <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>{title}</p>
                <div
                    className="rounded-full p-2 flex items-center justify-center shadow-lg"
                    style={{
                        background: iconBg,
                    }}
                    aria-hidden="true"
                >
                    <Icon className="h-4 w-4 text-white drop-shadow-md" />
                </div>
            </div>
            <div className="mt-2 relative z-10">
                <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {value || "0"}
                </div>
                <p
                    className={`text-xs font-medium mt-1 ${isPositive ? "text-green-500" : "text-red-500"}`}
                    aria-label={`${change} from last month`}
                >
                    {change} from last month
                </p>
            </div>
        </div>
    )
}

// Optional: Add a refresh button component
export function StatsRefreshButton({ onRefresh }: { onRefresh: () => void }) {
    return (
        <motion.button
            onClick={onRefresh}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2d3748] transition-colors"
        >
            <Loader2 className="h-4 w-4" />
            Refresh Stats
        </motion.button>
    )
}