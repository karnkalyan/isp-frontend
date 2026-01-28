"use client"

import React, { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "react-hot-toast"
import {
    Phone,
    User,
    CheckCircle,
    XCircle,
    Clock,
    CalendarDays,
    Search,
    Filter,
    Check,
    X,
    Eye,
    Edit,
    ChevronLeft,
    ChevronRight,
    SkipBack,
    SkipForward,
    RefreshCw,
    UserCheck,
    AlertTriangle,
    Shield,
    Users,
    Crown,
    CalendarCheck,
    MessageSquare,
    PhoneCall,
    Mail,
    Map,
    Users as UsersIcon,
    FileText,
    StickyNote,
    Calendar,
    MoreVertical,
    CheckSquare,
    Ban
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiRequest } from "@/lib/api"
import { useConfirmToast } from "@/hooks/use-confirm-toast"

// Types
type FollowUpType = 'CALL' | 'EMAIL' | 'MEETING' | 'VISIT' | 'OTHER'
type FollowUpStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MISSED'
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'

interface FollowUp {
    id: string
    leadId: string
    type: FollowUpType
    status: FollowUpStatus
    title: string
    description?: string
    scheduledAt: string
    completedAt?: string
    notes?: string
    outcome?: string
    assignedUserId: string
    assignedUser: {
        id: string
        name: string
        email: string
        role?: {
            name: string
        }
    }
    lead: {
        id: string
        firstName: string
        lastName: string
        phoneNumber?: string
        email?: string
        status: LeadStatus
        assignedUserId?: string
        assignedUser?: {
            id: string
            name: string
        }
    }
}

interface User {
    id: string
    name: string
    email: string
    role?: {
        name: string
    }
}

interface PaginationInfo {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
}

interface FollowUpStats {
    total: number
    todays: number
    scheduled: number
    completed: number
    missed: number
    myFollowUps: number
    userRole: string
    canViewAll: boolean
}

// Follow-up type options with icons
const FOLLOW_UP_TYPE_OPTIONS = [
    { value: "CALL", label: "Phone Call", icon: PhoneCall, color: "bg-blue-100 text-blue-800" },
    { value: "EMAIL", label: "Email", icon: Mail, color: "bg-green-100 text-green-800" },
    { value: "MEETING", label: "Meeting", icon: UsersIcon, color: "bg-purple-100 text-purple-800" },
    { value: "VISIT", label: "Site Visit", icon: Map, color: "bg-orange-100 text-orange-800" },
    { value: "OTHER", label: "Other", icon: MessageSquare, color: "bg-gray-100 text-gray-800" }
]

// Follow-up status options
const FOLLOW_UP_STATUS_OPTIONS = [
    { value: "SCHEDULED", label: "Scheduled", color: "bg-blue-100 text-blue-800" },
    { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-800" },
    { value: "CANCELLED", label: "Cancelled", color: "bg-gray-100 text-gray-800" },
    { value: "MISSED", label: "Missed", color: "bg-red-100 text-red-800" }
]

// Outcome options for completed follow-ups
const OUTCOME_OPTIONS = [
    { value: "successful", label: "Successful", color: "bg-green-100 text-green-800" },
    { value: "not_interested", label: "Not Interested", color: "bg-red-100 text-red-800" },
    { value: "call_back", label: "Call Back Later", color: "bg-yellow-100 text-yellow-800" },
    { value: "no_answer", label: "No Answer", color: "bg-gray-100 text-gray-800" },
    { value: "wrong_number", label: "Wrong Number", color: "bg-orange-100 text-orange-800" },
    { value: "already_customer", label: "Already Customer", color: "bg-purple-100 text-purple-800" },
    { value: "none", label: "No Outcome", color: "bg-gray-100 text-gray-800" }
]

export function FollowUpTracking() {
    const [activeTab, setActiveTab] = useState("todays")
    const [followUps, setFollowUps] = useState<FollowUp[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState<FollowUpStats>({
        total: 0,
        todays: 0,
        scheduled: 0,
        completed: 0,
        missed: 0,
        myFollowUps: 0,
        userRole: '',
        canViewAll: false
    })

    // Filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [assignedUserFilter, setAssignedUserFilter] = useState<string>("all")
    const [dateFilter, setDateFilter] = useState<string>("all")

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [markCompleteDialogOpen, setMarkCompleteDialogOpen] = useState(false)
    const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null)
    const [editForm, setEditForm] = useState({
        title: "",
        description: "",
        type: "CALL" as FollowUpType,
        scheduledAt: "",
        status: "SCHEDULED" as FollowUpStatus,
        notes: "",
        outcome: "none",
        assignedUserId: ""
    })

    // Mark complete form state
    const [markCompleteForm, setMarkCompleteForm] = useState({
        outcome: "successful",
        notes: "",
        completedAt: new Date().toISOString().slice(0, 16) // Current datetime in local format
    })

    // Pagination
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPreviousPage: false
    })

    const { confirm, ConfirmDialog } = useConfirmToast()

    // Fetch data
    useEffect(() => {
        fetchFollowUps()
        fetchStatsData()
        fetchUsers()
    }, [activeTab, pagination.currentPage, statusFilter, typeFilter, assignedUserFilter, dateFilter])

    const fetchFollowUps = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                limit: pagination.itemsPerPage.toString()
            })

            if (searchQuery) params.append('search', searchQuery)
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (typeFilter !== 'all') params.append('type', typeFilter)
            if (dateFilter !== 'all') params.append('date', dateFilter)

            // Handle assigned user filter
            if (stats.canViewAll && assignedUserFilter !== 'all') {
                if (assignedUserFilter === 'me') {
                    params.append('assignedUserId', 'me')
                } else {
                    params.append('assignedUserId', assignedUserFilter)
                }
            }

            // Use different endpoint based on tab
            let endpoint = '/followup'
            if (activeTab === 'my') {
                endpoint = '/followup/my'
            } else if (activeTab === 'todays') {
                params.append('date', 'today')
            } else if (activeTab === 'scheduled') {
                params.append('status', 'SCHEDULED')
            } else if (activeTab === 'completed') {
                params.append('status', 'COMPLETED')
            } else if (activeTab === 'missed') {
                params.append('status', 'MISSED')
            }

            const response = await apiRequest(`${endpoint}?${params.toString()}`)

            if (response?.success) {
                setFollowUps(response.data || [])
                if (response.pagination) {
                    setPagination(response.pagination)
                }
            } else {
                setFollowUps([])
            }
        } catch (error: any) {
            console.error("Failed to fetch follow-ups:", error)
            toast.error(error.message || "Failed to load follow-ups")
            setFollowUps([])
        } finally {
            setLoading(false)
        }
    }

    const fetchStatsData = async () => {
        try {
            const response = await apiRequest("/followup/stats")
            if (response?.success) {
                setStats(response.data)
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error)
        }
    }

    const fetchUsers = async () => {
        try {
            const data = await apiRequest("/users")
            if (Array.isArray(data)) {
                setUsers(data.map(user => ({ ...user, id: String(user.id) })))
            }
        } catch (error) {
            console.error("Failed to fetch users:", error)
        }
    }

    // Safe access helper functions
    const getAssignedUserName = (followUp: FollowUp) => {
        return followUp.assignedUser?.name || 'Unknown User'
    }

    const getFollowUpTypeIcon = (type: FollowUpType) => {
        const config = FOLLOW_UP_TYPE_OPTIONS.find(t => t.value === type)
        if (!config) return <MessageSquare className="h-4 w-4" />
        const Icon = config.icon
        return <Icon className="h-4 w-4" />
    }

    const getFollowUpTypeBadge = (type: FollowUpType) => {
        const config = FOLLOW_UP_TYPE_OPTIONS.find(t => t.value === type)
        if (!config) return null

        const Icon = config.icon
        return (
            <Badge variant="outline" className={`${config.color} flex items-center gap-1 text-xs`}>
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        )
    }

    const getFollowUpStatusBadge = (status: FollowUpStatus) => {
        const config = FOLLOW_UP_STATUS_OPTIONS.find(s => s.value === status)
        if (!config) return null

        return (
            <Badge variant="outline" className={`${config.color} text-xs`}>
                {config.label}
            </Badge>
        )
    }

    const getOutcomeBadge = (outcome?: string) => {
        if (!outcome || outcome === 'none') return null

        const config = OUTCOME_OPTIONS.find(o => o.value === outcome)
        if (!config) return null

        return (
            <Badge variant="outline" className={`${config.color} text-xs`}>
                {config.label}
            </Badge>
        )
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (error) {
            return "Invalid date"
        }
    }

    const formatDateForInput = (dateString: string) => {
        if (!dateString) return ""
        try {
            const date = new Date(dateString)
            return date.toISOString().slice(0, 16)
        } catch (error) {
            return ""
        }
    }

    const handleViewDetails = (followUp: FollowUp) => {
        setSelectedFollowUp(followUp)
        setViewDialogOpen(true)
    }

    const handleEditFollowUp = (followUp: FollowUp) => {
        setSelectedFollowUp(followUp)
        setEditForm({
            title: followUp.title,
            description: followUp.description || "",
            type: followUp.type,
            scheduledAt: formatDateForInput(followUp.scheduledAt),
            status: followUp.status,
            notes: followUp.notes || "",
            outcome: followUp.outcome || "none",
            assignedUserId:
                followUp.assignedUserId
                    ? String(followUp.assignedUserId)
                    : followUp.assignedUser?.id
                        ? String(followUp.assignedUser.id)
                        : "unassigned"
        })
        setEditDialogOpen(true)
    }

    useEffect(() => {
        if (
            editDialogOpen &&
            selectedFollowUp &&
            users.length > 0
        ) {
            setEditForm(prev => ({
                ...prev,
                assignedUserId:
                    selectedFollowUp.assignedUserId
                        ? String(selectedFollowUp.assignedUserId)
                        : selectedFollowUp.assignedUser?.id
                            ? String(selectedFollowUp.assignedUser.id)
                            : "unassigned"
            }))
        }
    }, [users, editDialogOpen])

    const handleUpdateFollowUp = async () => {
        if (!selectedFollowUp) return

        try {
            setLoading(true)
            const response = await apiRequest(`/followup/${selectedFollowUp.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...editForm,
                    outcome: editForm.outcome === 'none' ? '' : editForm.outcome,
                    assignedUserId: editForm.assignedUserId === "unassigned" ? null : Number(editForm.assignedUserId)
                })
            })

            if (response?.success) {
                toast.success("Follow-up updated successfully")
                setEditDialogOpen(false)
                fetchFollowUps()
                fetchStatsData()
            } else {
                toast.error(response?.error || "Failed to update follow-up")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update follow-up")
        } finally {
            setLoading(false)
        }
    }

    const handleMarkComplete = (followUp: FollowUp) => {
        setSelectedFollowUp(followUp)
        setMarkCompleteForm({
            outcome: followUp.outcome || "successful",
            notes: followUp.notes || "",
            completedAt: new Date().toISOString().slice(0, 16)
        })
        setMarkCompleteDialogOpen(true)
    }

    const handleSaveMarkComplete = async () => {
        if (!selectedFollowUp) return

        try {
            setLoading(true)
            const response = await apiRequest(`/followup/${selectedFollowUp.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'COMPLETED',
                    completedAt: markCompleteForm.completedAt,
                    outcome: markCompleteForm.outcome,
                    notes: markCompleteForm.notes
                })
            })

            if (response?.success) {
                toast.success("Follow-up marked as completed")
                setMarkCompleteDialogOpen(false)
                fetchFollowUps()
                fetchStatsData()
            } else {
                toast.error(response?.error || "Failed to update follow-up")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update follow-up")
        } finally {
            setLoading(false)
        }
    }

    const handleMarkMissed = async (followUp: FollowUp) => {
        const isConfirmed = await confirm({
            title: "Mark as Missed",
            message: "Are you sure you want to mark this follow-up as missed?",
            type: "warning",
            confirmText: "Mark as Missed",
            cancelText: "Cancel"
        })

        if (!isConfirmed) return

        try {
            setLoading(true)
            const response = await apiRequest(`/followup/${followUp.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'MISSED'
                })
            })

            if (response?.success) {
                toast.success("Follow-up marked as missed")
                fetchFollowUps()
                fetchStatsData()
            } else {
                toast.error(response?.error || "Failed to update follow-up")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update follow-up")
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteFollowUp = async (followUp: FollowUp) => {
        const isConfirmed = await confirm({
            title: "Delete Follow-up",
            message: "Are you sure you want to delete this follow-up? This action cannot be undone.",
            type: "danger",
            confirmText: "Delete",
            cancelText: "Cancel"
        })

        if (!isConfirmed) return

        try {
            setLoading(true)
            const response = await apiRequest(`/followup/${followUp.id}`, {
                method: 'DELETE'
            })

            if (response?.success) {
                toast.success("Follow-up deleted successfully")
                fetchFollowUps()
                fetchStatsData()
            } else {
                toast.error(response?.error || "Failed to delete follow-up")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete follow-up")
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPagination(prev => ({ ...prev, currentPage: 1 }))
    }

    const handleClearFilters = () => {
        setSearchQuery("")
        setStatusFilter("all")
        setTypeFilter("all")
        setAssignedUserFilter("all")
        setDateFilter("all")
        setPagination(prev => ({ ...prev, currentPage: 1 }))
    }

    const PaginationControls = () => {
        const pageNumbers = []
        const maxPagesToShow = 5

        let startPage = Math.max(1, pagination.currentPage - Math.floor(maxPagesToShow / 2))
        let endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1)

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i)
        }

        return (
            <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{" "}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{" "}
                    {pagination.totalItems} entries
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: 1 }))}
                        disabled={!pagination.hasPreviousPage || pagination.currentPage === 1}
                        className="h-8 w-8"
                    >
                        <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        disabled={!pagination.hasPreviousPage}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {pageNumbers.map(page => (
                        <Button
                            key={page}
                            variant={pagination.currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                            className="h-8 w-8"
                        >
                            {page}
                        </Button>
                    ))}

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                        disabled={!pagination.hasNextPage}
                        className="h-8 w-8"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: pagination.totalPages }))}
                        disabled={!pagination.hasNextPage || pagination.currentPage === pagination.totalPages}
                        className="h-8 w-8"
                    >
                        <SkipForward className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <ConfirmDialog />

            {/* View Follow-up Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Follow-up Details</DialogTitle>
                    </DialogHeader>
                    {selectedFollowUp && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Title</Label>
                                    <p className="text-sm font-medium">{selectedFollowUp.title}</p>
                                </div>
                                <div>
                                    <Label>Type</Label>
                                    <div className="mt-1">{getFollowUpTypeBadge(selectedFollowUp.type)}</div>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <div className="mt-1">{getFollowUpStatusBadge(selectedFollowUp.status)}</div>
                                </div>
                                <div>
                                    <Label>Scheduled Time</Label>
                                    <p className="text-sm font-medium">{formatDate(selectedFollowUp.scheduledAt)}</p>
                                </div>
                                {selectedFollowUp.completedAt && (
                                    <div>
                                        <Label>Completed At</Label>
                                        <p className="text-sm font-medium">{formatDate(selectedFollowUp.completedAt)}</p>
                                    </div>
                                )}
                                {selectedFollowUp.outcome && selectedFollowUp.outcome !== 'none' && (
                                    <div>
                                        <Label>Outcome</Label>
                                        <div className="mt-1">{getOutcomeBadge(selectedFollowUp.outcome)}</div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>Description</Label>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {selectedFollowUp.description || "No description"}
                                </p>
                            </div>

                            <div>
                                <Label>Notes</Label>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {selectedFollowUp.notes || "No notes"}
                                </p>
                            </div>

                            {selectedFollowUp.outcome && selectedFollowUp.outcome !== 'none' && (
                                <div>
                                    <Label>Outcome Details</Label>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {selectedFollowUp.outcome}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Assigned To</Label>
                                    <p className="text-sm font-medium">{getAssignedUserName(selectedFollowUp)}</p>
                                </div>
                                <div>
                                    <Label>Lead Information</Label>
                                    <p className="text-sm font-medium">
                                        {selectedFollowUp.lead?.firstName || 'Unknown'} {selectedFollowUp.lead?.lastName || 'Lead'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {selectedFollowUp.lead?.phoneNumber || "No phone"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                            Close
                        </Button>
                        {selectedFollowUp?.status === 'SCHEDULED' && (
                            <Button onClick={() => {
                                setViewDialogOpen(false)
                                handleEditFollowUp(selectedFollowUp)
                            }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Follow-up Dialog */}
            {/* Edit Follow-up Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Follow-up</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={editForm.type}
                                    onValueChange={(value) => setEditForm({ ...editForm, type: value as FollowUpType })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type">
                                            {FOLLOW_UP_TYPE_OPTIONS.find(t => t.value === editForm.type)?.label || "Select type"}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FOLLOW_UP_TYPE_OPTIONS.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="scheduledAt">Scheduled Date & Time *</Label>
                                <Input
                                    id="scheduledAt"
                                    type="datetime-local"
                                    value={editForm.scheduledAt}
                                    onChange={(e) => setEditForm({ ...editForm, scheduledAt: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={editForm.status}
                                    onValueChange={(value) => setEditForm({ ...editForm, status: value as FollowUpStatus })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status">
                                            {FOLLOW_UP_STATUS_OPTIONS.find(s => s.value === editForm.status)?.label || "Select status"}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FOLLOW_UP_STATUS_OPTIONS.map(status => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Outcome field - Always show but conditionally required */}
                            <div>
                                <Label htmlFor="outcome">Outcome</Label>
                                <Select
                                    value={editForm.outcome}
                                    onValueChange={(value) => setEditForm({ ...editForm, outcome: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select outcome">
                                            {OUTCOME_OPTIONS.find(o => o.value === editForm.outcome)?.label || "Select outcome"}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {OUTCOME_OPTIONS.map(outcome => (
                                            <SelectItem key={outcome.value} value={outcome.value}>
                                                {outcome.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {editForm.status === 'COMPLETED'
                                        ? "Required for completed follow-ups"
                                        : "Optional - will be set when marked as completed"}
                                </p>
                            </div>

                            {stats.canViewAll && (
                                <div className="col-span-2">
                                    <Label htmlFor="assignedUserId">Assign To</Label>
                                    <Select
                                        value={editForm.assignedUserId}
                                        onValueChange={(value) => setEditForm({ ...editForm, assignedUserId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select user">
                                                {editForm.assignedUserId === "unassigned" ? "Unassigned" :
                                                    users.find(u => u.id === editForm.assignedUserId)?.name || "Select user"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {users.map(user => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                rows={3}
                                placeholder="Add any additional notes here..."
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setEditDialogOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateFollowUp}
                            disabled={loading || !editForm.title || !editForm.scheduledAt || (editForm.status === 'COMPLETED' && !editForm.outcome)}
                        >
                            {loading ? "Updating..." : "Update Follow-up"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Mark as Complete Dialog with Outcomes */}
            <Dialog open={markCompleteDialogOpen} onOpenChange={setMarkCompleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Mark as Completed</DialogTitle>
                        <DialogDescription>
                            Set the outcome and completion details for this follow-up
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="outcome">Outcome *</Label>
                            <Select
                                value={markCompleteForm.outcome}
                                onValueChange={(value) => setMarkCompleteForm(prev => ({ ...prev, outcome: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select outcome">
                                        {OUTCOME_OPTIONS.find(o => o.value === markCompleteForm.outcome)?.label || "Select outcome"}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {OUTCOME_OPTIONS.filter(o => o.value !== 'none').map(outcome => (
                                        <SelectItem key={outcome.value} value={outcome.value}>
                                            {outcome.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="completedAt">Completion Time</Label>
                            <Input
                                id="completedAt"
                                type="datetime-local"
                                value={markCompleteForm.completedAt}
                                onChange={(e) => setMarkCompleteForm(prev => ({ ...prev, completedAt: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Completion Notes</Label>
                            <Textarea
                                id="notes"
                                value={markCompleteForm.notes}
                                onChange={(e) => setMarkCompleteForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Add any completion notes..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setMarkCompleteDialogOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveMarkComplete}
                            disabled={loading || !markCompleteForm.outcome}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {loading ? "Saving..." : "Mark as Completed"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Role Info */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Follow-up Management</h1>
                    <div className="flex items-center gap-2 mt-1">
                        {stats.canViewAll ? (
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                <Crown className="h-3 w-3 mr-1" />
                                {stats.userRole || 'Admin'} View
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                <User className="h-3 w-3 mr-1" />
                                {stats.userRole || 'User'} View
                            </Badge>
                        )}
                        <p className="text-muted-foreground">
                            {stats.canViewAll
                                ? "Viewing all follow-ups across the organization"
                                : "Viewing only your assigned follow-ups"}
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={() => {
                        fetchFollowUps()
                        fetchStatsData()
                    }}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Today's Follow-ups</p>
                            <p className="text-2xl font-bold">{stats.todays}</p>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <CalendarCheck className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Scheduled</p>
                            <p className="text-2xl font-bold">{stats.scheduled}</p>
                        </div>
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Completed</p>
                            <p className="text-2xl font-bold">{stats.completed}</p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Missed</p>
                            <p className="text-2xl font-bold">{stats.missed}</p>
                        </div>
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">{stats.canViewAll ? "My Follow-ups" : "Total"}</p>
                            <p className="text-2xl font-bold">{stats.canViewAll ? stats.myFollowUps : stats.total}</p>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <UserCheck className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            <CardContainer title="Follow-up Management" description="Track and manage all lead follow-ups">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="todays" className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Today's
                        </TabsTrigger>
                        <TabsTrigger value="my" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            My Follow-ups
                        </TabsTrigger>
                        <TabsTrigger value="scheduled" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Scheduled
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Completed
                        </TabsTrigger>
                        <TabsTrigger value="missed" className="flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            Missed
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="flex-1">
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search by lead name, phone, notes, or follow-up details..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Button type="submit" variant="default">
                                        <Search className="h-4 w-4 mr-2" />
                                        Search
                                    </Button>
                                </form>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <div className="w-40">
                                    <Select value={dateFilter} onValueChange={setDateFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Date Filter">
                                                {dateFilter === "all" && "All Dates"}
                                                {dateFilter === "today" && "Today"}
                                                {dateFilter === "upcoming" && "Next 7 Days"}
                                                {dateFilter === "overdue" && "Overdue"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Dates</SelectItem>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="upcoming">Next 7 Days</SelectItem>
                                            <SelectItem value="overdue">Overdue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-40">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Status">
                                                {statusFilter === "all" && "All Status"}
                                                {FOLLOW_UP_STATUS_OPTIONS.find(s => s.value === statusFilter)?.label || "Status"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            {FOLLOW_UP_STATUS_OPTIONS.map(status => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-40">
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Type">
                                                {typeFilter === "all" && "All Types"}
                                                {FOLLOW_UP_TYPE_OPTIONS.find(t => t.value === typeFilter)?.label || "Type"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            {FOLLOW_UP_TYPE_OPTIONS.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {stats.canViewAll && (
                                    <div className="w-40">
                                        <Select value={assignedUserFilter} onValueChange={setAssignedUserFilter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Assigned To">
                                                    {assignedUserFilter === "all" && "All Users"}
                                                    {assignedUserFilter === "me" && "Only Me"}
                                                    {users.find(u => u.id === assignedUserFilter)?.name || "Assigned To"}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Users</SelectItem>
                                                <SelectItem value="me">Only Me</SelectItem>
                                                {users.map(user => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    onClick={handleClearFilters}
                                    className="flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Clear
                                </Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">Loading follow-ups...</div>
                        ) : followUps.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {stats.canViewAll
                                    ? "No follow-ups found for the selected filters."
                                    : "No follow-ups assigned to you."}
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Lead Information</TableHead>
                                                <TableHead>Follow-up Details</TableHead>
                                                <TableHead>Scheduled Time</TableHead>
                                                <TableHead>Status</TableHead>
                                                {stats.canViewAll && <TableHead>Assigned To</TableHead>}
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {followUps.map((followUp) => (
                                                <TableRow key={followUp.id}>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="font-medium">
                                                                {followUp.lead?.firstName || 'Unknown'} {followUp.lead?.lastName || 'Lead'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {followUp.lead?.phoneNumber || "No phone"}
                                                            </div>
                                                            {followUp.lead?.email && (
                                                                <div className="text-sm text-gray-500">
                                                                    {followUp.lead.email}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="font-medium text-sm">{followUp.title}</div>
                                                            <div className="text-xs text-gray-500 whitespace-pre-wrap">
                                                                {followUp.description}
                                                            </div>
                                                            <div className="mt-1 flex gap-1 flex-wrap">
                                                                {getFollowUpTypeBadge(followUp.type)}
                                                                {getOutcomeBadge(followUp.outcome)}
                                                            </div>
                                                            {followUp.notes && (
                                                                <div className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                                                                    <StickyNote className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                                    <span className="flex-1 line-clamp-2">{followUp.notes}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-medium">
                                                                {formatDate(followUp.scheduledAt)}
                                                            </div>
                                                            {followUp.completedAt && (
                                                                <div className="text-xs text-green-600">
                                                                    Completed: {formatDate(followUp.completedAt)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getFollowUpStatusBadge(followUp.status)}
                                                    </TableCell>
                                                    {stats.canViewAll && (
                                                        <TableCell>
                                                            <div className="text-sm">{getAssignedUserName(followUp)}</div>
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleViewDetails(followUp)}
                                                                className="h-8 w-8 hover:bg-blue-100 text-blue-600"
                                                                title="View Details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            {followUp.status === 'SCHEDULED' && (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleEditFollowUp(followUp)}
                                                                        className="h-8 w-8 hover:bg-yellow-100 text-yellow-600"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleMarkComplete(followUp)}
                                                                        className="h-8 w-8 hover:bg-green-100 text-green-600"
                                                                        title="Mark Complete"
                                                                    >
                                                                        <CheckSquare className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleMarkMissed(followUp)}
                                                                        className="h-8 w-8 hover:bg-red-100 text-red-600"
                                                                        title="Mark Missed"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <PaginationControls />
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContainer>
        </div>
    )
}