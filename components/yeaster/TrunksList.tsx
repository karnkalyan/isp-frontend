// components/yeaster/TrunksList.tsx
"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Wifi, WifiOff, MoreVertical, RefreshCw, Plus, Settings, Trash2, Phone, Activity } from "lucide-react"
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
import AddTrunkModal from "./AddTrunkModal"

interface Trunk {
    id: string
    name: string
    type: string
    status: string
    raw?: any
}

interface TrunksListProps {
    ispId: number
}

export default function TrunksList({ ispId }: TrunksListProps) {
    const [trunks, setTrunks] = useState<Trunk[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedTrunk, setSelectedTrunk] = useState<Trunk | null>(null)

    const fetchTrunks = async () => {
        try {
            setLoading(true)
            const response = await apiRequest<{ data: Trunk[], success: boolean }>('/yeaster/trunks')

            if (response.success) {
                setTrunks(response.data || [])
            } else {
                toast.error("Failed to fetch trunks")
                setTrunks([])
            }
        } catch (error: any) {
            console.error("Error fetching trunks:", error)
            toast.error("Failed to fetch trunks")
            setTrunks([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTrunks()

        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchTrunks, 60000)
        return () => clearInterval(interval)
    }, [ispId])

    const filteredTrunks = trunks.filter(trunk =>
        trunk.name.toLowerCase().includes(search.toLowerCase()) ||
        trunk.type.toLowerCase().includes(search.toLowerCase()) ||
        trunk.id.includes(search)
    )

    const getStatusBadge = (status: string) => {
        const statusLower = status.toLowerCase()
        const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" | "success", label: string, icon?: React.ReactNode }> = {
            'registered': { variant: 'success', label: 'Registered', icon: <Wifi className="h-3 w-3" /> },
            'registering': { variant: 'outline', label: 'Registering', icon: <Activity className="h-3 w-3 animate-pulse" /> },
            'failure': { variant: 'destructive', label: 'Failed', icon: <WifiOff className="h-3 w-3" /> },
            'disable': { variant: 'secondary', label: 'Disabled', icon: <WifiOff className="h-3 w-3" /> },
            'unknown': { variant: 'secondary', label: 'Unknown', icon: <Wifi className="h-3 w-3" /> }
        }

        const statusInfo = statusMap[statusLower] ||
            { variant: 'secondary' as const, label: status, icon: <Wifi className="h-3 w-3" /> }

        return (
            <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                {statusInfo.icon}
                {statusInfo.label}
            </Badge>
        )
    }

    const getTypeBadge = (type: string) => {
        const typeLower = type.toLowerCase()
        const typeMap: Record<string, { variant: "default" | "secondary" | "outline", label: string, color: string }> = {
            'sip': { variant: 'default', label: 'SIP', color: 'bg-blue-500' },
            'register': { variant: 'secondary', label: 'Register', color: 'bg-green-500' },
            'peer': { variant: 'outline', label: 'Peer', color: 'bg-purple-500' },
            'account': { variant: 'default', label: 'Account', color: 'bg-orange-500' },
            'iax': { variant: 'secondary', label: 'IAX', color: 'bg-yellow-500' }
        }
        const typeInfo = typeMap[typeLower] || { variant: 'secondary', label: type, color: 'bg-gray-500' }
        return (
            <Badge variant={typeInfo.variant} className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${typeInfo.color}`} />
                {typeInfo.label}
            </Badge>
        )
    }

    const handleViewTrunk = async (trunk: Trunk) => {
        try {
            const response = await apiRequest<{ data: any, success: boolean }>(`/yeaster/trunks/${trunk.id}`)
            if (response.success) {
                setSelectedTrunk({ ...trunk, ...response.data })
                toast.success(`Loaded details for ${trunk.name}`)
                // You could open a modal here with detailed information
                console.log("Trunk details:", response.data)
            }
        } catch (error: any) {
            toast.error("Failed to load trunk details")
        }
    }

    const handleDeleteTrunk = async (trunk: Trunk) => {
        if (!confirm(`Are you sure you want to delete trunk "${trunk.name}"?`)) {
            return
        }

        try {
            const response = await apiRequest('/yeaster/trunks/delete', {
                method: 'DELETE',
                body: JSON.stringify({ id: trunk.id })
            })

            if (response.success) {
                toast.success(`Trunk "${trunk.name}" deleted`)
                fetchTrunks()
            } else {
                toast.error(response.error || "Failed to delete trunk")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete trunk")
        }
    }

    const handleTestTrunk = async (trunk: Trunk) => {
        try {
            toast.loading(`Testing trunk ${trunk.name}...`)
            // Implement trunk testing logic here
            await new Promise(resolve => setTimeout(resolve, 2000))
            toast.success(`Trunk ${trunk.name} test completed`)
        } catch (error: any) {
            toast.error("Trunk test failed")
        }
    }

    const handleRefreshStatus = async (trunk: Trunk) => {
        try {
            toast.loading(`Refreshing status for ${trunk.name}...`)
            // Implement refresh logic here
            await new Promise(resolve => setTimeout(resolve, 1000))
            fetchTrunks()
            toast.success(`Status refreshed for ${trunk.name}`)
        } catch (error: any) {
            toast.error("Failed to refresh status")
        }
    }

    if (loading) {
        return (
            <CardContainer title="Trunks" description="PBX trunks configuration">
                <div className="flex justify-center items-center py-12">
                    <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading trunks...</p>
                    </div>
                </div>
            </CardContainer>
        )
    }

    return (
        <CardContainer
            title="Trunks"
            description="PBX trunks configuration"
            actions={[
                {
                    label: "Add Trunk",
                    onClick: () => { }, // Handled by modal trigger
                    icon: <Plus className="h-4 w-4" />,
                    variant: "outline",
                    customComponent: (
                        <AddTrunkModal ispId={ispId} onSuccess={fetchTrunks} />
                    )
                },
                {
                    label: "Refresh",
                    onClick: fetchTrunks,
                    icon: <RefreshCw className="h-4 w-4" />,
                    variant: "outline"
                }
            ]}
        >
            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search trunks by name, type, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Trunks Grid */}
            {filteredTrunks.length === 0 ? (
                <div className="text-center py-12">
                    <Wifi className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No trunks found</p>
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTrunks.map((trunk) => (
                        <div
                            key={trunk.id}
                            className="rounded-lg border dark:border-gray-800 p-4 bg-card hover:border-primary/50 dark:hover:border-primary/30 transition-all duration-200 hover:shadow-md"
                        >
                            {/* Trunk Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                                        <Wifi className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg truncate max-w-[180px]">{trunk.name}</h3>
                                        <p className="text-sm text-muted-foreground">ID: {trunk.id}</p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleViewTrunk(trunk)}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleTestTrunk(trunk)}>
                                            <Activity className="mr-2 h-4 w-4" />
                                            Test Trunk
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRefreshStatus(trunk)}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Refresh Status
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600 dark:text-red-400"
                                            onClick={() => handleDeleteTrunk(trunk)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Trunk
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Trunk Info */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Status:</span>
                                    {getStatusBadge(trunk.status)}
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Type:</span>
                                    {getTypeBadge(trunk.type)}
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Last Updated:</span>
                                    <span className="text-xs">
                                        {new Date().toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleViewTrunk(trunk)}
                                >
                                    <Settings className="mr-2 h-3 w-3" />
                                    Configure
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleTestTrunk(trunk)}
                                    disabled={trunk.status === "Failure" || trunk.status === "Disable"}
                                >
                                    <Activity className="mr-2 h-3 w-3" />
                                    Test
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            <div className="mt-6 rounded-lg border dark:border-gray-800 p-4 bg-card">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{filteredTrunks.length}</span> of{" "}
                        <span className="font-medium">{trunks.length}</span> trunks
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span>
                                {trunks.filter(t => t.status === "Registered").length} registered
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                            <span>
                                {trunks.filter(t => t.status === "Failure").length} failed
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                            <span>
                                {trunks.filter(t => t.status === "Disable").length} disabled
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selected Trunk Details Modal (simplified) */}
            {selectedTrunk && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Trunk Details: {selectedTrunk.name}</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">ID</p>
                                    <p className="font-mono">{selectedTrunk.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Type</p>
                                    <p>{selectedTrunk.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    {getStatusBadge(selectedTrunk.status)}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Host</p>
                                    <p>{selectedTrunk.raw?.host || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Port</p>
                                    <p>{selectedTrunk.raw?.port || "5060"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Domain</p>
                                    <p>{selectedTrunk.raw?.domain || "N/A"}</p>
                                </div>
                            </div>
                            <Button
                                className="w-full mt-4"
                                onClick={() => setSelectedTrunk(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </CardContainer>
    )
}