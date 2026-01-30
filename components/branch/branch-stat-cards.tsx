"use client"

import { Building, Users, MapPin, BarChart3, Loader2, UsersRound, Router, Split, UserPlus } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface BranchStatsData {
    totalBranches: number
    totalUsers: number
    activeCustomers: number
    totalDevices: number
    activeBranches: number
    totalLeads: number
    totalOLTs: number
    totalONTs: number
}

interface StatCardData {
    title: string
    value: string
    change: string
    icon: React.ElementType
    iconBg: string
    gradientFrom: string
    gradientTo: string
    description?: string
}

interface BranchStatsCardsProps {
    onRefresh?: () => void
    loading?: boolean
    stats?: Partial<BranchStatsData>
}

export function BranchStatsCards({ onRefresh, loading = false, stats }: BranchStatsCardsProps) {
    const [branchStats, setBranchStats] = useState<BranchStatsData>({
        totalBranches: 0,
        totalUsers: 0,
        activeCustomers: 0,
        totalDevices: 0,
        activeBranches: 0,
        totalLeads: 0,
        totalOLTs: 0,
        totalONTs: 0
    })
    const [previousStats, setPreviousStats] = useState<BranchStatsData | null>(null)
    const [isDarkMode, setIsDarkMode] = useState(false)

    useEffect(() => {
        // Detect dark mode
        setIsDarkMode(document.documentElement.classList.contains("dark"))

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class") {
                    setIsDarkMode(document.documentElement.classList.contains("dark"))
                }
            })
        })

        observer.observe(document.documentElement, { attributes: true })

        // If stats prop provided, use it
        if (stats) {
            setPreviousStats(branchStats)
            setBranchStats(prev => ({ ...prev, ...stats }))
        }

        return () => observer.disconnect()
    }, [stats])

    // Calculate percentage change
    const calculateChange = (current: number, previous: number | null) => {
        if (!previous || previous === 0) return "+0%"
        const change = ((current - previous) / previous) * 100
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
    }

    const statCards: StatCardData[] = [
        {
            title: "Total Branches",
            value: loading ? "" : branchStats.totalBranches.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.totalBranches, previousStats?.totalBranches || 0),
            icon: Building,
            iconBg: "#3B82F6",
            gradientFrom: "#3B82F6",
            gradientTo: "#10B981",
            description: "Active across all regions"
        },
        {
            title: "Total Users",
            value: loading ? "" : branchStats.totalUsers.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.totalUsers, previousStats?.totalUsers || 0),
            icon: UsersRound,
            iconBg: "#10B981",
            gradientFrom: "#10B981",
            gradientTo: "#3B82F6",
            description: "Assigned to branches"
        },
        {
            title: "Active Customers",
            value: loading ? "" : branchStats.activeCustomers.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.activeCustomers, previousStats?.activeCustomers || 0),
            icon: Users,
            iconBg: "#8B5CF6",
            gradientFrom: "#8B5CF6",
            gradientTo: "#EC4899",
            description: "Across all branches"
        },
        {
            title: "Network Devices",
            value: loading ? "" : branchStats.totalDevices.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.totalDevices, previousStats?.totalDevices || 0),
            icon: Router,
            iconBg: "#F59E0B",
            gradientFrom: "#F59E0B",
            gradientTo: "#EF4444",
            description: "OLTs, ONTs & Splitters"
        },
        {
            title: "Active Branches",
            value: loading ? "" : branchStats.activeBranches.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.activeBranches, previousStats?.activeBranches || 0),
            icon: Building,
            iconBg: "#EF4444",
            gradientFrom: "#EF4444",
            gradientTo: "#EC4899",
            description: "Currently operational"
        },
        {
            title: "Total Leads",
            value: loading ? "" : branchStats.totalLeads.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.totalLeads, previousStats?.totalLeads || 0),
            icon: UserPlus,
            iconBg: "#06B6D4",
            gradientFrom: "#06B6D4",
            gradientTo: "#3B82F6",
            description: "Potential customers"
        },
        {
            title: "OLT Devices",
            value: loading ? "" : branchStats.totalOLTs.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.totalOLTs, previousStats?.totalOLTs || 0),
            icon: BarChart3,
            iconBg: "#84CC16",
            gradientFrom: "#84CC16",
            gradientTo: "#10B981",
            description: "Optical Line Terminals"
        },
        {
            title: "ONT Devices",
            value: loading ? "" : branchStats.totalONTs.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.totalONTs, previousStats?.totalONTs || 0),
            icon: Split,
            iconBg: "#EC4899",
            gradientFrom: "#EC4899",
            gradientTo: "#F59E0B",
            description: "Optical Network Terminals"
        }
    ]

    if (loading && !stats) {
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
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.slice(0, 4).map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <StatCard {...stat} isDarkMode={isDarkMode} />
                    </motion.div>
                ))}
            </div>

            {/* Additional stats row */}
            {statCards.length > 4 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {statCards.slice(4).map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: (index + 4) * 0.1 }}
                        >
                            <StatCard {...stat} isDarkMode={isDarkMode} />
                        </motion.div>
                    ))}
                </div>
            )}

            {onRefresh && (
                <div className="flex justify-end">
                    <StatsRefreshButton onRefresh={onRefresh} />
                </div>
            )}
        </div>
    )
}

interface StatCardProps extends Omit<StatCardData, 'description'> {
    isDarkMode: boolean
    description?: string
}

function StatCard({ title, value, change, icon: Icon, iconBg, gradientFrom, gradientTo, isDarkMode, description }: StatCardProps) {
    const isPositive = !change.startsWith("-")

    return (
        <div
            className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} p-6 relative overflow-hidden rounded-xl border ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} hover:shadow-lg transition-shadow duration-300`}
        >
            {/* Gradient background effect */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`
                }}
            />

            <div className="flex flex-row items-center justify-between pb-2 relative z-10">
                <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>{title}</p>
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
                {description && (
                    <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-gray-500"} mt-1`}>
                        {description}
                    </p>
                )}
                <p
                    className={`text-xs font-medium mt-2 ${isPositive ? "text-green-500" : "text-red-500"}`}
                    aria-label={`${change} from last month`}
                >
                    {change} from last month
                </p>
            </div>
        </div>
    )
}

function StatsRefreshButton({ onRefresh }: { onRefresh: () => void }) {
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