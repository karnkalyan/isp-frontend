"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Search,
    Filter,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    PhoneOff,
    Phone,
    Clock,
    User,
    Calendar,
    Download,
    MoreVertical
} from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"

interface CallLog {
    id: string
    direction: 'inbound' | 'outbound'
    caller: string
    called: string
    startTime: string
    endTime: string
    duration: number
    status: 'answered' | 'missed' | 'busy' | 'failed' | 'completed'
    channelId: string
    recordingUrl?: string
    notes?: string
}

interface CallLogsTableProps {
    ispId: number
}

export default function CallLogsTable({ ispId }: CallLogsTableProps) {
    const [callLogs, setCallLogs] = useState<CallLog[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [directionFilter, setDirectionFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [dateFilter, setDateFilter] = useState<string>("today")

    const fetchCallLogs = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (dateFilter !== "all") params.append('date', dateFilter)

            const data = await apiRequest<CallLog[]>(`/yeastar/${ispId}/logs?${params}`)
            setCallLogs(data || [])
        } catch (error: any) {
            console.error("Error fetching call logs:", error)
            toast.error("Failed to fetch call logs")
            setCallLogs([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCallLogs()
    }, [ispId, dateFilter])

    const filteredLogs = callLogs.filter(log => {
        // Search filter
        const searchLower = search.toLowerCase()
        const matchesSearch =
            log.caller.toLowerCase().includes(searchLower) ||
            log.called.toLowerCase().includes(searchLower) ||
            log.channelId.toLowerCase().includes(searchLower)

        // Direction filter
        const matchesDirection =
            directionFilter === "all" || log.direction === directionFilter

        // Status filter
        const matchesStatus =
            statusFilter === "all" || log.status === statusFilter

        return matchesSearch && matchesDirection && matchesStatus
    })

    const getDirectionIcon = (direction: string) => {
        switch (direction) {
            case 'inbound':
                return <PhoneIncoming className="h-4 w-4 text-blue-500" />
            case 'outbound':
                return <PhoneOutgoing className="h-4 w-4 text-green-500" />
            default:
                return <Phone className="h-4 w-4" />
        }
    }

    const getDirectionBadge = (direction: string) => {
        const directionMap = {
            'inbound': { label: 'Inbound', variant: 'default' as const },
            'outbound': { label: 'Outbound', variant: 'outline' as const }
        }

        const info = directionMap[direction as keyof typeof directionMap] || { label: direction, variant: 'secondary' as const }
        return (
            <Badge variant={info.variant} className="flex items-center gap-1">
                {getDirectionIcon(direction)}
                {info.label}
            </Badge>
        )
    }

    const getStatusBadge = (status: string) => {
        const statusMap = {
            'answered': { label: 'Answered', variant: 'success' as const },
            'missed': { label: 'Missed', variant: 'destructive' as const },
            'busy': { label: 'Busy', variant: 'secondary' as const },
            'failed': { label: 'Failed', variant: 'destructive' as const },
            'completed': { label: 'Completed', variant: 'default' as const }
        }

        const info = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const }
        return <Badge variant={info.variant}>{info.label}</Badge>
    }

    const formatDuration = (seconds: number) => {
        if (!seconds || seconds < 0) return "0s"

        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`
        } else {
            return `${secs}s`
        }
    }

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handlePlayRecording = (url?: string) => {
        if (!url) {
            toast.error("No recording available")
            return
        }
        toast.success("Playing recording...")
        // Implement audio player
    }

    const handleExportLogs = () => {
        toast.loading("Exporting call logs...", { duration: 2000 })
    }

    if (loading) {
        return (
            <CardContainer title="Call Logs" description="Recent call history">
                <div className="flex justify-center items-center py-12">
                    <div className="flex flex-col items-center gap-2">
                        <Clock className="h-8 w-8 animate-pulse text-primary" />
                        <p className="text-sm text-muted-foreground">Loading call logs...</p>
                    </div>
                </div>
            </CardContainer>
        )
    }

    return (
        <CardContainer
            title="Call Logs"
            description="Recent call history"
            actions={[
                {
                    label: "Export",
                    onClick: handleExportLogs,
                    icon: <Download className="h-4 w-4" />,
                    variant: "outline"
                }
            ]}
        >
            {/* Filters */}
            <div className="mb-6 space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by caller, called number, or channel..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap gap-2">
                    <Select value={directionFilter} onValueChange={setDirectionFilter}>
                        <SelectTrigger className="w-[140px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Direction" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Directions</SelectItem>
                            <SelectItem value="inbound">Inbound</SelectItem>
                            <SelectItem value="outbound">Outbound</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                            <Phone className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="answered">Answered</SelectItem>
                            <SelectItem value="missed">Missed</SelectItem>
                            <SelectItem value="busy">Busy</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-[140px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Date Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="thisWeek">This Week</SelectItem>
                            <SelectItem value="lastWeek">Last Week</SelectItem>
                            <SelectItem value="thisMonth">This Month</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSearch("")
                            setDirectionFilter("all")
                            setStatusFilter("all")
                        }}
                    >
                        Clear Filters
                    </Button>
                </div>
            </div>

            {/* Table */}
            {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                    <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No call logs found</p>
                    {search && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearch("")}
                            className="mt-2"
                        >
                            Clear Search
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Direction</TableHead>
                                <TableHead>From</TableHead>
                                <TableHead>To</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        {formatDateTime(log.startTime)}
                                    </TableCell>
                                    <TableCell>
                                        {getDirectionBadge(log.direction)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-mono">{log.caller}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-mono">{log.called}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            {formatDuration(log.duration)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(log.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handlePlayRecording(log.recordingUrl)}>
                                                    Play Recording
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>
                                                    Call Back
                                                </DropdownMenuItem>
                                                {log.notes && (
                                                    <DropdownMenuItem>
                                                        View Notes
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Summary */}
                    <div className="mt-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing <span className="font-medium">{filteredLogs.length}</span> of{" "}
                                <span className="font-medium">{callLogs.length}</span> calls
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <PhoneIncoming className="h-3 w-3 text-blue-500" />
                                    <span>
                                        {callLogs.filter(l => l.direction === 'inbound').length} inbound
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <PhoneOutgoing className="h-3 w-3 text-green-500" />
                                    <span>
                                        {callLogs.filter(l => l.direction === 'outbound').length} outbound
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <PhoneMissed className="h-3 w-3 text-red-500" />
                                    <span>
                                        {callLogs.filter(l => l.status === 'missed').length} missed
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </CardContainer>
    )
}