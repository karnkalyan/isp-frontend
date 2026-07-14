"use client"

import { CardContainer } from "@/components/ui/card-container"
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Phone, Clock } from "lucide-react"

interface CallStatsCardsProps {
    stats: {
        today: {
            total: number
            inbound: number
            outbound: number
            answered: number
            missed: number
            totalDuration: number
        }
        thisWeek: {
            total: number
            inbound: number
            outbound: number
            answered: number
            missed: number
            totalDuration: number
        }
    }
}

export default function CallStatsCards({ stats }: CallStatsCardsProps) {
    const formatDuration = (seconds: number) => {
        if (!seconds) return "0m"
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)

        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m`
    }

    const calculateAnswerRate = (answered: number, total: number) => {
        if (!total) return 0
        return Math.round((answered / total) * 100)
    }

    return (
        <CardContainer title="Call Statistics">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* Today's Calls */}
                <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">Today's Calls</h3>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{stats.today.total}</div>
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <PhoneIncoming className="h-3 w-3" />
                            <span>{stats.today.inbound}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <PhoneOutgoing className="h-3 w-3" />
                            <span>{stats.today.outbound}</span>
                        </div>
                    </div>
                </div>

                {/* Answer Rate */}
                <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">Answer Rate</h3>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">
                        {calculateAnswerRate(stats.today.answered, stats.today.total)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                        {stats.today.answered} answered / {stats.today.missed} missed
                    </div>
                </div>

                {/* Talk Time */}
                <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">Talk Time Today</h3>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">
                        {formatDuration(stats.today.totalDuration)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                        Average: {formatDuration(stats.today.totalDuration / (stats.today.answered || 1))}
                    </div>
                </div>

                {/* This Week */}
                <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">This Week</h3>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{stats.thisWeek.total}</div>
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <PhoneIncoming className="h-3 w-3" />
                            <span>{stats.thisWeek.inbound}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <PhoneOutgoing className="h-3 w-3" />
                            <span>{stats.thisWeek.outbound}</span>
                        </div>
                    </div>
                </div>

                {/* Weekly Talk Time */}
                <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">Weekly Talk Time</h3>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">
                        {formatDuration(stats.thisWeek.totalDuration)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                        Average: {formatDuration(stats.thisWeek.totalDuration / (stats.thisWeek.answered || 1))}
                    </div>
                </div>
            </div>
        </CardContainer>
    )
}