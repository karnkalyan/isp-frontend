"use client"

import { Building, Building2, Users, MapPin, BarChart3, Loader2, UsersRound, Router, Split, UserPlus, GitBranch, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export interface BranchStatsData {
    totalBranches: number
    totalOrganizations?: number
    totalSubBranches?: number
    totalUsers: number
    activeCustomers: number
    totalDevices: number
    activeBranches: number
    activeOrganizations?: number
    activeSubBranches?: number
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
        totalOrganizations: 0,
        totalSubBranches: 0,
        totalUsers: 0,
        activeCustomers: 0,
        totalDevices: 0,
        activeBranches: 0,
        activeOrganizations: 0,
        activeSubBranches: 0,
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

        if (stats) {
            setPreviousStats(branchStats)
            setBranchStats(prev => ({ ...prev, ...stats }))
        }

        return () => observer.disconnect()
    }, [stats])

    const calculateChange = (current: number, previous: number | null) => {
        if (!previous || previous === 0) return "+0%"
        const change = ((current - previous) / previous) * 100
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
    }

    const orgCount = branchStats.totalOrganizations !== undefined ? branchStats.totalOrganizations : branchStats.totalBranches
    const subCount = branchStats.totalSubBranches !== undefined ? branchStats.totalSubBranches : 0

    const statCards: StatCardData[] = [
        {
            title: "Organizations / Head Branches",
            value: loading ? "" : orgCount.toString(),
            change: loading ? "+0%" : calculateChange(orgCount, previousStats?.totalOrganizations || 0),
            icon: Building2,
            iconBg: "#3B82F6",
            gradientFrom: "#3B82F6",
            gradientTo: "#2563EB",
            description: "Main parent organizations"
        },
        {
            title: "Total Sub-Branches",
            value: loading ? "" : subCount.toString(),
            change: loading ? "+0%" : calculateChange(subCount, previousStats?.totalSubBranches || 0),
            icon: GitBranch,
            iconBg: "#8B5CF6",
            gradientFrom: "#8B5CF6",
            gradientTo: "#6D28D9",
            description: "Regional child branches"
        },
        {
            title: "Active Operational Branches",
            value: loading ? "" : branchStats.activeBranches.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.activeBranches, previousStats?.activeBranches || 0),
            icon: ShieldCheck,
            iconBg: "#10B981",
            gradientFrom: "#10B981",
            gradientTo: "#059669",
            description: "Active across all levels"
        },
        {
            title: "Total Users",
            value: loading ? "" : branchStats.totalUsers.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.totalUsers, previousStats?.totalUsers || 0),
            icon: UsersRound,
            iconBg: "#06B6D4",
            gradientFrom: "#06B6D4",
            gradientTo: "#0891B2",
            description: "Assigned staff members"
        },
        {
            title: "Active Customers",
            value: loading ? "" : branchStats.activeCustomers.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.activeCustomers, previousStats?.activeCustomers || 0),
            icon: Users,
            iconBg: "#F59E0B",
            gradientFrom: "#F59E0B",
            gradientTo: "#D97706",
            description: "Active broadband subscribers"
        },
        {
            title: "Network Devices",
            value: loading ? "" : branchStats.totalDevices.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.totalDevices, previousStats?.totalDevices || 0),
            icon: Router,
            iconBg: "#EC4899",
            gradientFrom: "#EC4899",
            gradientTo: "#DB2777",
            description: "OLTs, ONTs & Splitters"
        },
        {
            title: "Total Leads",
            value: loading ? "" : branchStats.totalLeads.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.totalLeads, previousStats?.totalLeads || 0),
            icon: UserPlus,
            iconBg: "#14B8A6",
            gradientFrom: "#14B8A6",
            gradientTo: "#0D9488",
            description: "CRM sales prospects"
        },
        {
            title: "OLT Devices",
            value: loading ? "" : branchStats.totalOLTs.toString(),
            change: loading ? "+0%" : calculateChange(branchStats.totalOLTs, previousStats?.totalOLTs || 0),
            icon: BarChart3,
            iconBg: "#84CC16",
            gradientFrom: "#84CC16",
            gradientTo: "#65A30D",
            description: "Optical line terminals"
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
        </div>
    )
}

interface StatCardProps extends Omit<StatCardData, 'description'> {
    isDarkMode: boolean
    description?: string
}

function StatCard({ title, value, change, icon: Icon, iconBg, gradientFrom, gradientTo, isDarkMode, description }: StatCardProps) {
    return (
        <div
            className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} p-5 relative overflow-hidden rounded-xl border ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} hover:shadow-lg transition-all duration-300`}
        >
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`
                }}
            />

            <div className="flex flex-row items-center justify-between pb-2 relative z-10">
                <span className="text-xs font-semibold text-muted-foreground truncate">{title}</span>
                <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: iconBg }}
                >
                    <Icon className="h-4 w-4" />
                </div>
            </div>

            <div className="relative z-10 mt-1">
                <div className="text-2xl font-bold tracking-tight dark:text-white">
                    {value}
                </div>
                {description && (
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">
                        {description}
                    </p>
                )}
            </div>
        </div>
    )
}