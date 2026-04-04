// Replace this outdated component with a new one using useWebSocket
"use client"

import { useState, useEffect, useCallback } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Users, Edit, Trash2, MoreVertical, Clock, Wifi, WifiOff, RefreshCw, Phone } from "lucide-react"
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
import { useWebSocket } from "@/contexts/WebSocketContext"
import EditExtensionModal from "./EditExtensionModal"

interface Extension {
    extensionNumber: string
    extensionName: string
    username?: string
    status?: string
    registered?: boolean
    lastSync?: string
    createdAt?: string
    updatedAt?: string
}

interface ExtensionsListProps {
    ispId: number
    webSocketConnected: boolean
    serverDown?: boolean
}

export default function ExtensionsList({ ispId, webSocketConnected, serverDown }: ExtensionsListProps) {
    const [extensions, setExtensions] = useState<Extension[]>([])
    const [filteredExtensions, setFilteredExtensions] = useState<Extension[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [editingExtension, setEditingExtension] = useState<Extension | null>(null)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedExtension, setSelectedExtension] = useState<string | null>(null)

    // Use WebSocket context
    const { on, off } = useWebSocket()

    // Fetch extensions
    const fetchExtensions = useCallback(async () => {
        if (serverDown) return;

        try {
            setLoading(true)
            console.log('🔄 Fetching extensions from DB for ISP:', ispId)

            const response = await apiRequest<{ success: boolean; data: Extension[]; total: number }>('/yeaster/extensions/db')
            console.log('✅ Extensions response:', response)

            if (response.success) {
                setExtensions(response.data || [])
                setFilteredExtensions(response.data || [])
            } else {
                toast.error(response.error || "Failed to fetch extensions")
            }
        } catch (error: any) {
            console.error("❌ Error fetching extensions:", error)

            if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
                // Server down handled by parent
                return
            }

            toast.error("Failed to fetch extensions")
        } finally {
            setLoading(false)
        }
    }, [ispId, serverDown])

    // Initialize real-time updates
    useEffect(() => {
        if (serverDown) return;

        fetchExtensions()

        // Set up real-time event listeners
        const handleExtensionAdded = (data: any) => {
            if (data.ispId === ispId) {
                console.log('📥 Extension added event:', data)
                setExtensions(prev => [...prev, data.extension])
                toast.success(`Extension ${data.extension?.extensionNumber} added`)
            }
        }

        const handleExtensionUpdated = (data: any) => {
            if (data.ispId === ispId) {
                console.log('📥 Extension updated event:', data)
                setExtensions(prev => prev.map(ext =>
                    ext.extensionNumber === data.extension?.extensionNumber ? data.extension : ext
                ))
                toast.success(`Extension ${data.extension?.extensionNumber} updated`)
            }
        }

        const handleExtensionDeleted = (data: any) => {
            if (data.ispId === ispId) {
                console.log('📥 Extension deleted event:', data)
                setExtensions(prev => prev.filter(ext => ext.extensionNumber !== data.extension))
                toast.success(`Extension ${data.extension} deleted`)
            }
        }

        const handleExtensionsRefresh = (data: any) => {
            if (data.ispId === ispId) {
                console.log('📥 Extensions refresh event')
                fetchExtensions()
            }
        }

        // Register event listeners
        const unsubscribeExtensionAdded = on('yeastar.extension.added', handleExtensionAdded)
        const unsubscribeExtensionUpdated = on('yeastar.extension.updated', handleExtensionUpdated)
        const unsubscribeExtensionDeleted = on('yeastar.extension.deleted', handleExtensionDeleted)
        const unsubscribeExtensionsRefresh = on('yeastar.extensions.refresh', handleExtensionsRefresh)

        // Clean up
        return () => {
            unsubscribeExtensionAdded()
            unsubscribeExtensionUpdated()
            unsubscribeExtensionDeleted()
            unsubscribeExtensionsRefresh()
        }
    }, [ispId, on, fetchExtensions, serverDown])

    // Filter extensions based on search
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredExtensions(extensions)
            return
        }

        const filtered = extensions.filter(ext =>
            ext.extensionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ext.extensionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ext.username?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredExtensions(filtered)
    }, [searchTerm, extensions])

    const handleEdit = (extension: Extension) => {
        setEditingExtension(extension)
        setEditModalOpen(true)
    }

    const handleDelete = async (extensionNumber: string) => {
        if (!confirm(`Are you sure you want to delete extension ${extensionNumber}?`)) {
            return
        }

        if (serverDown) {
            toast.error('Server is not running')
            return
        }

        try {
            setSelectedExtension(extensionNumber)
            const response = await apiRequest('/yeaster/extensions', {
                method: 'DELETE',
                body: JSON.stringify({ number: extensionNumber })
            })

            if (response.success) {
                toast.success(`Extension ${extensionNumber} deleted successfully`)
            } else {
                toast.error(response.error || "Failed to delete extension")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete extension")
        } finally {
            setSelectedExtension(null)
        }
    }

    const handleRefreshStatus = async (extensionNumber: string) => {
        if (serverDown) {
            toast.error('Server is not running')
            return
        }

        try {
            setSelectedExtension(extensionNumber)
            const response = await apiRequest(`/yeaster/extensions/${extensionNumber}/status`)

            if (response.success) {
                // Refresh the entire list
                await fetchExtensions()
                toast.success(`Extension ${extensionNumber} status refreshed`)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to refresh status")
        } finally {
            setSelectedExtension(null)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Never"
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading && !serverDown) {
        return (
            <CardContainer title="Extensions">
                <div className="flex justify-center items-center py-12">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Loading extensions...</p>
                    </div>
                </div>
            </CardContainer>
        )
    }

    if (serverDown) {
        return (
            <CardContainer title="Extensions">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Server is not running. Please start the backend server.</p>
                </div>
            </CardContainer>
        )
    }

    return (
        <>
            <EditExtensionModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                extension={editingExtension}
                ispId={ispId}
                onSuccess={() => {
                    setEditModalOpen(false)
                    setEditingExtension(null)
                    toast.success("Extension updated successfully")
                }}
            />

            <CardContainer
                title="Extensions"
                description={`${extensions.length} extensions configured`}
                actions={[
                    {
                        label: "Refresh",
                        onClick: fetchExtensions,
                        icon: <RefreshCw className="h-4 w-4" />,
                        variant: "outline",
                        disabled: loading || serverDown
                    }
                ]}
            >
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search extensions..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Extensions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredExtensions.map((extension) => (
                            <div
                                key={extension.extensionNumber}
                                className="rounded-lg border dark:border-gray-800 p-4 bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{extension.extensionNumber}</h3>
                                            <Badge
                                                variant={extension.registered ? "success" : "secondary"}
                                                className="text-xs"
                                            >
                                                {extension.registered ? "Registered" : "Offline"}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{extension.extensionName}</p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleEdit(extension)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRefreshStatus(extension.extensionNumber)}>
                                                <Clock className="mr-2 h-4 w-4" />
                                                Refresh Status
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => handleDelete(extension.extensionNumber)}
                                                disabled={selectedExtension === extension.extensionNumber}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Username:</span>
                                        <span className="font-medium">{extension.username || extension.extensionNumber}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        <div className="flex items-center gap-1">
                                            {extension.registered ? (
                                                <>
                                                    <Wifi className="h-3 w-3 text-green-500" />
                                                    <span className="text-green-600">Online</span>
                                                </>
                                            ) : (
                                                <>
                                                    <WifiOff className="h-3 w-3 text-gray-500" />
                                                    <span className="text-gray-600">Offline</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {extension.lastSync && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Last Sync:</span>
                                            <span className="font-medium">{formatDate(extension.lastSync)}</span>
                                        </div>
                                    )}
                                    {extension.createdAt && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Created:</span>
                                            <span className="font-medium">{formatDate(extension.createdAt)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleRefreshStatus(extension.extensionNumber)}
                                        disabled={selectedExtension === extension.extensionNumber || serverDown}
                                    >
                                        <Clock className="mr-2 h-4 w-4" />
                                        Refresh
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleEdit(extension)}
                                        disabled={serverDown}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredExtensions.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No extensions found</h3>
                            <p className="text-sm text-muted-foreground">
                                {searchTerm ? "Try a different search term" : "No extensions have been configured yet"}
                            </p>
                        </div>
                    )}
                </div>
            </CardContainer>
        </>
    )
} 