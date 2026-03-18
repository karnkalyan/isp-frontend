"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Phone, User, PhoneOff, Clock, MoreVertical, FolderSync, Pause, Play, Users } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { RealTimeApi } from "@/lib/real-time-api"
import TransferCallModal from "./TransferCallModal"

interface ActiveCall {
    id?: string
    channelId: string
    callId?: string
    extension?: string
    caller: string
    called: string
    direction: 'inbound' | 'outbound' | 'internal'
    status: 'ringing' | 'answered' | 'held' | 'transferred' | 'ended'
    startTime: string
    duration?: number
    isHeld?: boolean
    ispId: number
}

interface ActiveCallsProps {
    ispId: number
    realTimeApi: RealTimeApi | null
}

export default function ActiveCalls({ ispId, realTimeApi }: ActiveCallsProps) {
    const [calls, setCalls] = useState<ActiveCall[]>([])
    const [filteredCalls, setFilteredCalls] = useState<ActiveCall[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [transferCall, setTransferCall] = useState<ActiveCall | null>(null)
    const [transferModalOpen, setTransferModalOpen] = useState(false)
    const [selectedCall, setSelectedCall] = useState<string | null>(null)

    // Fetch active calls
    const fetchActiveCalls = async () => {
        try {
            setLoading(true)
            const response = await apiRequest<{ success: boolean; data: ActiveCall[]; total: number }>('/yeaster/calls/active/db')
            if (response.success) {
                setCalls(response.data || [])
                setFilteredCalls(response.data || [])
            }
        } catch (error: any) {
            console.error("Error fetching active calls:", error)
            toast.error("Failed to fetch active calls")
        } finally {
            setLoading(false)
        }
    }

    // Initialize real-time updates
    useEffect(() => {
        if (!realTimeApi) return

        fetchActiveCalls()

        // Set up real-time event listeners
        const unsubscribeCallStart = realTimeApi.on('call:start', (data) => {
            setCalls(prev => [data, ...prev])
            toast.success(`Call started: ${data.caller} → ${data.called}`)
        })

        const unsubscribeCallEnd = realTimeApi.on('call:end', (data) => {
            setCalls(prev => prev.filter(call => call.channelId !== data.channelId))
            toast.info(`Call ended: ${data.caller} → ${data.called} (${data.duration}s)`)
        })

        const unsubscribeCallUpdate = realTimeApi.on('call:update', (data) => {
            setCalls(prev => prev.map(call =>
                call.channelId === data.channelId ? { ...call, ...data } : call
            ))
        })

        // Clean up
        return () => {
            unsubscribeCallStart()
            unsubscribeCallEnd()
            unsubscribeCallUpdate()
        }
    }, [realTimeApi])

    // Filter calls based on search
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredCalls(calls)
            return
        }

        const filtered = calls.filter(call =>
            call.caller.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.called.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.extension?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredCalls(filtered)
    }, [searchTerm, calls])

    const handleHangup = async (channelId: string) => {
        if (!confirm("Are you sure you want to hang up this call?")) {
            return
        }

        try {
            setSelectedCall(channelId)

            if (realTimeApi) {
                realTimeApi.requestCallHangup(channelId)
                toast.success("Hangup command sent")
            } else {
                // Fallback to HTTP API
                await apiRequest('/yeaster/calls/hangup', {
                    method: 'POST',
                    body: JSON.stringify({ channelId })
                })
                toast.success("Call hung up")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to hang up call")
        } finally {
            setSelectedCall(null)
        }
    }

    const handleHold = async (channelId: string, isHeld: boolean) => {
        try {
            setSelectedCall(channelId)
            const endpoint = isHeld ? '/yeaster/calls/unhold' : '/yeaster/calls/hold'

            await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({ channelId })
            })

            toast.success(isHeld ? "Call unheld" : "Call held")
        } catch (error: any) {
            toast.error(error.message || `Failed to ${isHeld ? 'unhold' : 'hold'} call`)
        } finally {
            setSelectedCall(null)
        }
    }

    const handleTransfer = (call: ActiveCall) => {
        setTransferCall(call)
        setTransferModalOpen(true)
    }

    const formatDuration = (seconds?: number) => {
        if (!seconds) return "00:00"
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const getCallColor = (direction: string) => {
        switch (direction) {
            case 'inbound': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
            case 'outbound': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
            case 'internal': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
            default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
        }
    }

    if (loading) {
        return (
            <CardContainer title="Active Calls">
                <div className="flex justify-center items-center py-12">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Loading active calls...</p>
                    </div>
                </div>
            </CardContainer>
        )
    }

    return (
        <>
            <TransferCallModal
                open={transferModalOpen}
                onOpenChange={setTransferModalOpen}
                call={transferCall}
                ispId={ispId}
                onSuccess={() => {
                    setTransferModalOpen(false)
                    setTransferCall(null)
                    toast.success("Call transfer initiated")
                }}
            />

            <CardContainer title="Active Calls" description={`${calls.length} active calls`}>
                <div className="space-y-4">
                    {/* Search and Stats */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search calls..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {calls.length} Active
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {calls.filter(c => c.direction === 'inbound').length} Inbound
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {calls.filter(c => c.direction === 'outbound').length} Outbound
                            </Badge>
                        </div>
                    </div>

                    {/* Calls List */}
                    <div className="space-y-3">
                        {filteredCalls.map((call) => (
                            <div
                                key={call.channelId}
                                className="rounded-lg border dark:border-gray-800 p-4 bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge
                                                variant={call.direction === 'inbound' ? 'success' : call.direction === 'outbound' ? 'default' : 'secondary'}
                                                className={getCallColor(call.direction)}
                                            >
                                                {call.direction.toUpperCase()}
                                            </Badge>
                                            {call.isHeld && (
                                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                                    <Pause className="h-3 w-3 mr-1" />
                                                    Held
                                                </Badge>
                                            )}
                                            <Badge variant="outline">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {formatDuration(call.duration)}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Caller</p>
                                                <p className="font-semibold text-lg">{call.caller}</p>
                                                {call.extension && (
                                                    <p className="text-sm text-muted-foreground">Extension: {call.extension}</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Called</p>
                                                <p className="font-semibold text-lg">{call.called}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Call Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleHold(call.channelId, !!call.isHeld)}>
                                                {call.isHeld ? (
                                                    <>
                                                        <Play className="mr-2 h-4 w-4" />
                                                        Unhold Call
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pause className="mr-2 h-4 w-4" />
                                                        Hold Call
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleTransfer(call)}>
                                                <FolderSync className="mr-2 h-4 w-4" />
                                                Transfer Call
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => handleHangup(call.channelId)}
                                                disabled={selectedCall === call.channelId}
                                            >
                                                <PhoneOff className="mr-2 h-4 w-4" />
                                                Hang Up
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3" />
                                        Started: {formatTime(call.startTime)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>Channel: </span>
                                        <code className="text-xs bg-muted px-2 py-1 rounded">{call.channelId}</code>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleHold(call.channelId, !!call.isHeld)}
                                        disabled={selectedCall === call.channelId}
                                    >
                                        {call.isHeld ? (
                                            <>
                                                <Play className="mr-2 h-4 w-4" />
                                                Unhold
                                            </>
                                        ) : (
                                            <>
                                                <Pause className="mr-2 h-4 w-4" />
                                                Hold
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleTransfer(call)}
                                        disabled={selectedCall === call.channelId}
                                    >
                                        <FolderSync className="mr-2 h-4 w-4" />
                                        Transfer
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleHangup(call.channelId)}
                                        disabled={selectedCall === call.channelId}
                                    >
                                        <PhoneOff className="mr-2 h-4 w-4" />
                                        Hang Up
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredCalls.length === 0 && (
                        <div className="text-center py-12">
                            <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No active calls</h3>
                            <p className="text-sm text-muted-foreground">
                                {searchTerm ? "No calls match your search" : "All lines are currently idle"}
                            </p>
                        </div>
                    )}
                </div>
            </CardContainer>
        </>
    )
}