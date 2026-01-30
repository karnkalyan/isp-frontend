"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, User, Phone, Mail, MoreVertical, RefreshCw, UserPlus, UserCheck, UserX } from "lucide-react"
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

interface Extension {
    id: string
    number: string
    name: string
    email: string
    type: string
    status: string
    callerId: string
    callForwarding: string
    voicemail: boolean
    lastSeen: string
}

interface ExtensionsListProps {
    ispId: number
}

export default function ExtensionsList({ ispId }: ExtensionsListProps) {
    const [extensions, setExtensions] = useState<Extension[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    const fetchExtensions = async () => {
        try {
            setLoading(true)
            const data = await apiRequest<Extension[]>(`/yeaster/extensions`)
            setExtensions(data || [])
        } catch (error: any) {
            console.error("Error fetching extensions:", error)
            toast.error("Failed to fetch extensions")
            setExtensions([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchExtensions()
    }, [ispId])

    const filteredExtensions = extensions.filter(ext =>
        ext.number.toLowerCase().includes(search.toLowerCase()) ||
        ext.name.toLowerCase().includes(search.toLowerCase()) ||
        ext.email.toLowerCase().includes(search.toLowerCase())
    )

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" | "success", label: string }> = {
            'online': { variant: 'success', label: 'Online' },
            'offline': { variant: 'destructive', label: 'Offline' },
            'busy': { variant: 'secondary', label: 'Busy' },
            'ringing': { variant: 'outline', label: 'Ringing' },
            'available': { variant: 'default', label: 'Available' }
        }

        const statusInfo = statusMap[status.toLowerCase()] || { variant: 'secondary', label: status }
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
    }

    const getTypeBadge = (type: string) => {
        const typeMap: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
            'sip': { variant: 'default', label: 'SIP' },
            'iax': { variant: 'secondary', label: 'IAX' },
            'analog': { variant: 'outline', label: 'Analog' },
            'digital': { variant: 'default', label: 'Digital' },
            'virtual': { variant: 'secondary', label: 'Virtual' }
        }

        const typeInfo = typeMap[type.toLowerCase()] || { variant: 'secondary', label: type }
        return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
    }

    const handleCallExtension = (number: string) => {
        toast.success(`Calling extension ${number}...`)
        // Implement call functionality
    }

    const handleViewExtension = (extension: Extension) => {
        toast.loading(`Loading extension ${extension.number} details...`, { duration: 2000 })
    }

    const handleRefreshExtension = (number: string) => {
        toast.success(`Refreshing status for extension ${number}...`)
        // Implement refresh functionality
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return "Never"
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <CardContainer title="Extensions" description="PBX extensions">
                <div className="flex justify-center items-center py-12">
                    <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading extensions...</p>
                    </div>
                </div>
            </CardContainer>
        )
    }

    return (
        <CardContainer
            title="Extensions"
            description="PBX extensions"
            actions={[
                {
                    label: "Add Extension",
                    onClick: () => toast.success("Feature coming soon"),
                    icon: <UserPlus className="h-4 w-4" />,
                    variant: "outline"
                },
                {
                    label: "Refresh",
                    onClick: fetchExtensions,
                    icon: <RefreshCw className="h-4 w-4" />,
                    variant: "outline"
                }
            ]}
        >
            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search extensions by number, name, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Extensions Grid */}
            {filteredExtensions.length === 0 ? (
                <div className="text-center py-12">
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No extensions found</p>
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
                    {filteredExtensions.map((extension) => (
                        <div
                            key={extension.id}
                            className="rounded-lg border p-4 hover:border-primary/50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{extension.number}</h3>
                                        <p className="text-sm text-muted-foreground">{extension.name}</p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleViewExtension(extension)}>
                                            <User className="mr-2 h-4 w-4" />
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleCallExtension(extension.number)}>
                                            <Phone className="mr-2 h-4 w-4" />
                                            Make Call
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRefreshExtension(extension.number)}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Refresh Status
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600">
                                            Disable Extension
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Status:</span>
                                    {getStatusBadge(extension.status)}
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Type:</span>
                                    {getTypeBadge(extension.type)}
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Caller ID:</span>
                                    <span className="font-medium">{extension.callerId || "Not set"}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="truncate">{extension.email || "No email"}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Last Seen:</span>
                                    <span>{formatDate(extension.lastSeen)}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Features:</span>
                                    <div className="flex gap-1">
                                        {extension.voicemail && (
                                            <Badge variant="outline" className="text-xs">
                                                Voicemail
                                            </Badge>
                                        )}
                                        {extension.callForwarding && (
                                            <Badge variant="outline" className="text-xs">
                                                Forward
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleCallExtension(extension.number)}
                                >
                                    <Phone className="mr-2 h-3 w-3" />
                                    Call
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleViewExtension(extension)}
                                >
                                    Details
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            <div className="mt-6 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{filteredExtensions.length}</span> of{" "}
                        <span className="font-medium">{extensions.length}</span> extensions
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-green-500" />
                            <span>
                                {extensions.filter(e => e.status === 'online').length} online
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <UserX className="h-3 w-3 text-red-500" />
                            <span>
                                {extensions.filter(e => e.status === 'offline').length} offline
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </CardContainer>
    )
}