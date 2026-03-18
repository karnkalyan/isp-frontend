"use client"

import React, { useState, useEffect, useMemo } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"
import {
    Search,
    Eye,
    Edit,
    Trash2,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Users,
    User,
    Clock,
    UserPlus,
    AlertCircle,
    PhoneCall,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    CheckCircle,
    X,
    CalendarDays,
    Tag,
    MapPin as MapPinIcon,
    History,
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    SkipBack,
    SkipForward,
    Phone as PhoneIcon,
    ChevronRight,
    Filter,
    Plus,
    Mail as MailIcon,
    Map as MapIcon,
    Navigation,
    Target,
    AlertTriangle,
    Ruler,
    MessageSquare,
    Users as UsersIcon,
    Check,
    XCircle,
    Building,
    Package,
    IdCard,
    Wifi,
    CreditCard,
    Building2,
    Link as LinkIcon,
    FileText,
    RefreshCw,
    Settings,
    Radio
} from "lucide-react"
import { useConfirmToast } from "@/hooks/use-confirm-toast"
import { apiRequest } from "@/lib/api"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { Slider } from "@/components/ui/slider"

// Map imports
import dynamic from 'next/dynamic'
import "leaflet/dist/leaflet.css"

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })
const useMapEvents = dynamic(() => import('react-leaflet').then(mod => import('react-leaflet').then(mod => mod.useMapEvents)), { ssr: false })
const useMap = dynamic(() => import('react-leaflet').then(mod => import('react-leaflet').then(mod => mod.useMap)), { ssr: false })

// Types
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
type FollowUpType = 'CALL' | 'EMAIL' | 'MEETING' | 'VISIT' | 'OTHER'
type FollowUpStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MISSED'
type Gender = 'MALE' | 'FEMALE' | 'OTHER'

interface Lead {
    id: string
    firstName: string
    middleName?: string
    lastName: string
    email?: string
    phoneNumber?: string
    secondaryContactNumber?: string
    source?: string
    status: LeadStatus
    notes?: string
    memberShipId?: string
    membership?: {
        id: string
        name: string
        code: string
    }
    assignedUserId?: string
    assignedUser?: {
        id: string
        name: string
        email: string
        role?: {
            name: string
        }
    }
    interestedPackageId?: string
    interestedPackage?: {
        id: string
        name?: string
        packageName?: string
        price: number
        description?: string
    }
    convertedToCustomer: boolean
    convertedAt?: string
    convertedById?: string
    convertedBy?: {
        id: string
        name: string
        email: string
    }
    nextFollowUp?: string
    followUps?: FollowUp[] | any
    customers?: Array<{
        id: string
        firstName: string
        lastName: string
        email: string
    }>
    isActive: boolean
    createdAt: string
    updatedAt: string
    address?: string
    street?: string
    district?: string
    province?: string
    gender?: Gender
    metadata?: {
        fullAddress?: string
        age?: number
        latitude?: number
        longitude?: number
        serviceRadius?: number
        nearestSplitters?: Array<{
            id: string
            name: string
            distance: number
            splitRatio: string
            availablePorts: number
            portCount: number
        }>
    }
}

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
    }
    createdAt: string
    updatedAt: string
}

interface User {
    id: string
    name: string
    email: string
    role?: {
        id: string
        name: string
        permissions: Array<{
            id: number
            name: string
            menuName: string
        }>
    }
}

interface PackagePlan {
    id: string
    name?: string
    packageName?: string
    price?: number | null
    description?: string
}

interface Membership {
    id: string
    name: string
    code: string
}

interface ExistingISP {
    id: string
    name: string
    address?: string
}

interface Splitter {
    id: string
    name: string
    splitterId: string
    splitRatio: string
    ratio: number
    splitterType: "PLC" | "FBT"
    portCount: number
    usedPorts: number
    availablePorts: number
    location: {
        site: string
        latitude?: number
        longitude?: number
        description?: string
    }
    upstreamFiber: {
        coreColor: string
        connectedTo: string
        connectionId?: string
        port?: string
    }
    isMaster: boolean
    masterSplitterId?: string
    connectedServiceBoard?: {
        oltId: string
        oltName: string
        boardSlot: number
        boardPort: string
    }
    status: "active" | "inactive" | "maintenance"
    notes?: string
    createdAt: string
    updatedAt: string
    totalCustomers?: number
    slaveCount?: number
}

interface PaginationInfo {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
}

// Options
const STATUS_OPTIONS = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "unqualified", label: "Unqualified" },
    { value: "converted", label: "Converted" }
]

const SOURCE_OPTIONS = [
    { value: "website", label: "Website" },
    { value: "referral", label: "Referral" },
    { value: "social_media", label: "Social Media" },
    { value: "advertisement", label: "Advertisement" },
    { value: "cold_call", label: "Cold Call" },
    { value: "walk_in", label: "Walk-in" },
    { value: "event", label: "Event" },
    { value: "other", label: "Other" }
]

const FOLLOW_UP_TYPE_OPTIONS = [
    { value: "CALL", label: "Phone Call", icon: PhoneCall },
    { value: "EMAIL", label: "Email", icon: MailIcon },
    { value: "MEETING", label: "Meeting", icon: UsersIcon },
    { value: "VISIT", label: "Site Visit", icon: MapIcon },
    { value: "OTHER", label: "Other", icon: MessageSquare }
]

const FOLLOW_UP_STATUS_OPTIONS = [
    { value: "SCHEDULED", label: "Scheduled", color: "bg-blue-100 text-blue-800" },
    { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-800" },
    { value: "CANCELLED", label: "Cancelled", color: "bg-gray-100 text-gray-800" },
    { value: "MISSED", label: "Missed", color: "bg-red-100 text-red-800" }
]

const OUTCOME_OPTIONS = [
    { value: "left_message", label: "Left Message" },
    { value: "no_answer", label: "No Answer" },
    { value: "busy", label: "Line Busy" },
    { value: "interested", label: "Interested" },
    { value: "not_interested", label: "Not Interested" },
    { value: "call_back", label: "Will Call Back" },
    { value: "follow_up", label: "Need Follow-up" },
    { value: "converted", label: "Converted to Customer" }
]

const GENDER_OPTIONS = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" }
]

// Helper function
const formatDistance = (distance: any): string => {
    try {
        const distNum = Number(distance);
        if (isNaN(distNum) || !isFinite(distNum)) return "N/A";
        if (distNum < 1) return `${(distNum * 1000).toFixed(0)} m`;
        if (distNum < 10) return `${distNum.toFixed(2)} km`;
        return `${distNum.toFixed(1)} km`;
    } catch (error) {
        return "N/A";
    }
}

const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch (error) {
        return "Invalid date"
    }
}

const formatDateShort = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    } catch (error) {
        return "Invalid date"
    }
}

// Map components
const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
    const MapEvents = () => {
        useMapEvents({
            click: (e) => {
                onLocationSelect(e.latlng.lat, e.latlng.lng)
            },
        })
        return null
    }
    return <MapEvents />
}

const LocationMarker = ({ position, draggable = true, onDragEnd }: {
    position: [number, number],
    draggable?: boolean,
    onDragEnd?: (lat: number, lng: number) => void
}) => {
    const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position)

    useEffect(() => {
        if (position) {
            setMarkerPosition(position)
        }
    }, [position])

    if (!markerPosition) return null

    return (
        <Marker
            position={markerPosition}
            draggable={draggable}
            eventHandlers={{
                dragend: (e: any) => {
                    const marker = e.target
                    const position = marker.getLatLng()
                    const newPosition: [number, number] = [position.lat, position.lng]
                    setMarkerPosition(newPosition)
                    if (onDragEnd) {
                        onDragEnd(position.lat, position.lng)
                    }
                },
            }}
        >
            <Popup>
                Latitude: {markerPosition[0].toFixed(6)} <br />
                Longitude: {markerPosition[1].toFixed(6)}
            </Popup>
        </Marker>
    )
}

const MapCenterUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap()
    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.setView(center, map.getZoom())
        }
    }, [center, map])
    return null
}

interface ActiveLeadsProps {
    onEditLead?: (lead: Lead) => void
    onViewLead?: (lead: Lead) => void
    onAddFollowUp?: (lead: Lead) => void
    onConvertLead?: (lead: Lead) => void
    onStatusChange?: (lead: Lead) => void
}

export function ActiveLeads({
    onEditLead,
    onViewLead,
    onAddFollowUp,
    onConvertLead,
    onStatusChange
}: ActiveLeadsProps) {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [sourceFilter, setSourceFilter] = useState<string>("all")

    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPreviousPage: false
    })

    // Dialogs
    const [showViewDialog, setShowViewDialog] = useState(false)
    const [viewLead, setViewLead] = useState<Lead | null>(null)
    const [leadFollowUps, setLeadFollowUps] = useState<FollowUp[]>([])

    const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false)
    const [statusChangeLead, setStatusChangeLead] = useState<Lead | null>(null)
    const [newStatus, setNewStatus] = useState<LeadStatus>('new')

    const [showFollowUpDialog, setShowFollowUpDialog] = useState(false)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null)

    const [showConvertDialog, setShowConvertDialog] = useState(false)
    const [convertingLead, setConvertingLead] = useState<Lead | null>(null)

    // Data
    const [users, setUsers] = useState<User[]>([])
    const [packages, setPackages] = useState<PackagePlan[]>([])
    const [memberships, setMemberships] = useState<Membership[]>([])
    const [existingISPs, setExistingISPs] = useState<ExistingISP[]>([])
    const [splitters, setSplitters] = useState<Splitter[]>([])

    // Form states
    const [followUpForm, setFollowUpForm] = useState({
        type: "CALL" as FollowUpType,
        title: "",
        description: "",
        scheduledAt: "",
        assignedUserId: "",
        notes: "",
        status: "SCHEDULED" as FollowUpStatus,
        outcome: ""
    })

    const [conversionForm, setConversionForm] = useState({
        idNumber: "",
        streetAddress: "",
        city: "",
        state: "",
        zipCode: "",
        lat: "",
        lon: "",
        deviceName: "",
        deviceMac: "",
        assignedPkg: "",
        rechargeable: false,
        membershipId: "",
        existingISPId: "",
        isReferenced: false,
        referencedById: ""
    })

    // Map states
    const [convertMapPosition, setConvertMapPosition] = useState<[number, number]>([27.7172, 85.3240])
    const [convertNearestSplitters, setConvertNearestSplitters] = useState<Splitter[]>([])
    const [convertServiceAvailable, setConvertServiceAvailable] = useState<boolean | null>(null)
    const [convertServiceRadius, setConvertServiceRadius] = useState<number>(0.1)

    const { confirm, ConfirmDialog } = useConfirmToast()

    // Fetch data
    useEffect(() => {
        fetchLeads()
        fetchUsers()
        fetchPackages()
        fetchMemberships()
        fetchExistingISPs()
        fetchSplitters()
    }, [pagination.currentPage, statusFilter, sourceFilter, searchQuery])

    const fetchLeads = async (page?: number) => {
        try {
            setLoading(true)
            const currentPage = page || pagination.currentPage

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: pagination.itemsPerPage.toString()
            })

            if (searchQuery) params.append('search', searchQuery)
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (sourceFilter !== 'all') params.append('source', sourceFilter)

            const response = await apiRequest(`/lead?${params.toString()}`)

            let dataArray = []
            if (response && typeof response === 'object') {
                if (Array.isArray(response.data)) {
                    dataArray = response.data
                } else if (Array.isArray(response)) {
                    dataArray = response
                }

                if (response.pagination) {
                    setPagination(response.pagination)
                }
            } else if (Array.isArray(response)) {
                dataArray = response
            }

            const processedLeads = dataArray.map((lead: any) => ({
                ...lead,
                id: String(lead.id),
                memberShipId: lead.memberShipId ? String(lead.memberShipId) : "",
                assignedUserId: lead.assignedUserId ? String(lead.assignedUserId) : "",
                interestedPackageId: lead.interestedPackageId ? String(lead.interestedPackageId) : "",
                interestedPackage: lead.interestedPackage ? {
                    ...lead.interestedPackage,
                    id: String(lead.interestedPackage.id),
                    name: lead.interestedPackage.packageName || lead.interestedPackage.name,
                    price: lead.interestedPackage.price || 0
                } : undefined,
                membership: lead.membership ? {
                    ...lead.membership,
                    id: String(lead.membership.id)
                } : undefined,
                assignedUser: lead.assignedUser ? {
                    ...lead.assignedUser,
                    id: String(lead.assignedUser.id)
                } : undefined,
                nextFollowUp: lead.nextFollowUp || null,
                followUps: Array.isArray(lead.followUps) ? lead.followUps : [],
                address: lead.address || "",
                street: lead.street || "",
                district: lead.district || "",
                province: lead.province || "",
                gender: lead.gender || "",
                secondaryContactNumber: lead.secondaryContactNumber || "",
                metadata: lead.metadata ? {
                    ...lead.metadata,
                    latitude: lead.metadata.latitude || undefined,
                    longitude: lead.metadata.longitude || undefined,
                    serviceRadius: lead.metadata.serviceRadius || 0.1
                } : undefined
            }))

            setLeads(processedLeads)
        } catch (error: any) {
            console.error("Failed to fetch leads:", error)
            toast.error(error.message || "Failed to load leads")
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const data = await apiRequest("/users")
            setUsers(Array.isArray(data) ? data.map((user: any) => ({
                ...user,
                id: String(user.id),
                role: user.role || undefined
            })) : [])
        } catch (error: any) {
            console.error("Failed to fetch users:", error)
        }
    }

    const fetchPackages = async () => {
        try {
            const data = await apiRequest("/package-price")
            const processedPackages = Array.isArray(data)
                ? data.map((pkg: any) => ({
                    id: String(pkg.id || pkg.planId || ''),
                    name: pkg.packageName || pkg.name || pkg.planName || 'Unknown Package',
                    packageName: pkg.packageName || pkg.name || pkg.planName || 'Unknown Package',
                    price: typeof pkg.price === 'number' ? pkg.price : typeof pkg.amount === 'number' ? pkg.amount : 0,
                    description: pkg.description || ''
                }))
                : []
            setPackages(processedPackages)
        } catch (error: any) {
            console.error("Failed to fetch packages:", error)
        }
    }

    const fetchMemberships = async () => {
        try {
            const data = await apiRequest("/membership")
            setMemberships(Array.isArray(data) ? data.map((m: any) => ({
                ...m,
                id: String(m.id)
            })) : [])
        } catch (error: any) {
            console.error("Failed to fetch memberships:", error)
        }
    }

    const fetchExistingISPs = async () => {
        try {
            const response = await apiRequest("/existingisp")
            let dataArray = []
            if (response && typeof response === 'object') {
                if (Array.isArray(response.data)) {
                    dataArray = response.data
                } else if (Array.isArray(response)) {
                    dataArray = response
                }
            }
            setExistingISPs(dataArray.map((isp: any) => ({
                ...isp,
                id: String(isp.id)
            })))
        } catch (error: any) {
            console.error("Failed to fetch existing ISPs:", error)
        }
    }

    const fetchSplitters = async () => {
        try {
            const response = await apiRequest("/splitters")
            let dataArray = []
            if (response && typeof response === 'object') {
                if (Array.isArray(response.data)) {
                    dataArray = response.data
                } else if (Array.isArray(response)) {
                    dataArray = response
                }
            }
            setSplitters(dataArray.map((splitter: any) => ({
                ...splitter,
                id: String(splitter.id),
                location: {
                    site: splitter.location?.site || '',
                    latitude: splitter.location?.latitude || 0,
                    longitude: splitter.location?.longitude || 0,
                    description: splitter.location?.description || ''
                },
                upstreamFiber: splitter.upstreamFiber || {
                    coreColor: "Blue",
                    connectedTo: "service-board",
                    connectionId: "",
                    port: ""
                },
                isMaster: splitter.isMaster || false,
                status: splitter.status || "active",
                totalCustomers: splitter.totalCustomers || 0,
                slaveCount: splitter.slaveCount || 0
            })))
        } catch (error: any) {
            console.error("Failed to fetch splitters:", error)
        }
    }

    const fetchLeadFollowUps = async (leadId: string) => {
        try {
            const data = await apiRequest(`/followup/leads/${leadId}/follow-ups`)
            if (data && data.data) {
                setLeadFollowUps(Array.isArray(data.data) ? data.data : [])
            } else if (Array.isArray(data)) {
                setLeadFollowUps(data)
            } else {
                setLeadFollowUps([])
            }
        } catch (error: any) {
            console.error("Failed to fetch follow-ups:", error)
            setLeadFollowUps([])
        }
    }

    // Helper functions
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    const findNearestSplitters = (lat: number, lng: number, maxDistanceKm: number = 5) => {
        if (!lat || !lng) return []
        return splitters
            .filter(splitter => splitter.location.latitude && splitter.location.longitude)
            .map(splitter => ({
                ...splitter,
                distance: calculateDistance(lat, lng, splitter.location.latitude!, splitter.location.longitude!)
            }))
            .filter(splitter => splitter.distance <= maxDistanceKm)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5)
    }

    // Handlers
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPagination(prev => ({ ...prev, currentPage: 1 }))
    }

    const handleClearFilters = () => {
        setSearchQuery("")
        setStatusFilter("all")
        setSourceFilter("all")
        setPagination(prev => ({ ...prev, currentPage: 1 }))
    }

    const handleOutboundcalls = async (phoneNumber: string) => {
        if (!phoneNumber) {
            toast.error("Phone number is not available")
            return
        }
        try {
            await apiRequest(`/yeaster/makeCalls`, {
                method: 'POST',
                body: JSON.stringify({ destination: phoneNumber })
            })
            toast.success("Calling " + phoneNumber)
        } catch (error: any) {
            console.error("Call error:", error)
            toast.error(error.message || "Failed to initiate call")
        }
    }

    const deleteLead = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Lead",
            message: "Are you sure you want to delete this lead? This action cannot be undone.",
            type: "danger",
            confirmText: "Delete",
            cancelText: "Cancel"
        })

        if (!isConfirmed) return

        try {
            setLoading(true)
            await apiRequest(`/lead/${id}`, { method: 'DELETE' })
            toast.success("Lead deleted successfully")
            fetchLeads(pagination.currentPage)
        } catch (error: any) {
            console.error("Delete error:", error)
            toast.error(error.message || "Failed to delete lead")
        } finally {
            setLoading(false)
        }
    }

    const handleChangeLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
        try {
            setLoading(true)
            await apiRequest(`/lead/${leadId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            })
            toast.success(`Lead status changed to ${newStatus}`)
            fetchLeads(pagination.currentPage)
            setShowStatusChangeDialog(false)
        } catch (error: any) {
            console.error("Change status error:", error)
            toast.error(error.message || "Failed to change lead status")
        } finally {
            setLoading(false)
        }
    }

    const openStatusChangeDialog = (lead: Lead) => {
        setStatusChangeLead(lead)
        setNewStatus(lead.status)
        setShowStatusChangeDialog(true)
    }

    const viewLeadDetails = (lead: Lead) => {
        setViewLead(lead)
        setShowViewDialog(true)
        fetchLeadFollowUps(lead.id)
    }

    // Follow-up handlers
    const openFollowUpDialog = (lead: Lead, followUp?: FollowUp) => {
        setSelectedLead(lead)
        setEditingFollowUp(followUp || null)

        if (followUp) {
            setFollowUpForm({
                type: followUp.type,
                title: followUp.title,
                description: followUp.description || "",
                scheduledAt: followUp.scheduledAt.split('T')[0],
                assignedUserId: followUp.assignedUserId,
                notes: followUp.notes || "",
                status: followUp.status,
                outcome: followUp.outcome || ""
            })
        } else {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)

            setFollowUpForm({
                type: "CALL",
                title: `Follow-up with ${lead.firstName} ${lead.lastName}`,
                description: "",
                scheduledAt: tomorrow.toISOString().split('T')[0],
                assignedUserId: lead.assignedUserId || "",
                notes: "",
                status: "SCHEDULED",
                outcome: ""
            })
        }

        setShowFollowUpDialog(true)
    }

    const updateFollowUpField = (field: keyof typeof followUpForm, value: any) => {
        setFollowUpForm(prev => ({ ...prev, [field]: value }))
    }

    const saveFollowUp = async () => {
        if (!selectedLead) return

        if (!followUpForm.title.trim()) {
            toast.error("Follow-up title is required")
            return
        }
        if (!followUpForm.scheduledAt.trim()) {
            toast.error("Scheduled date is required")
            return
        }

        try {
            setLoading(true)
            if (editingFollowUp) {
                await apiRequest(`/followup/follow-ups/${editingFollowUp.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(followUpForm)
                })
                toast.success("Follow-up updated successfully")
            } else {
                await apiRequest(`/followup/leads/${selectedLead.id}/follow-ups`, {
                    method: 'POST',
                    body: JSON.stringify(followUpForm)
                })
                toast.success("Follow-up created successfully")
            }
            fetchLeads(pagination.currentPage)
            setShowFollowUpDialog(false)
            setFollowUpForm({
                type: "CALL",
                title: "",
                description: "",
                scheduledAt: "",
                assignedUserId: "",
                notes: "",
                status: "SCHEDULED",
                outcome: ""
            })
        } catch (error: any) {
            console.error("Follow-up save error:", error)
            toast.error(error.message || "Failed to save follow-up")
        } finally {
            setLoading(false)
        }
    }

    // Conversion handlers
    const openConvertDialog = (lead: Lead) => {
        if (lead.status !== 'qualified') {
            toast.error("Only qualified leads can be converted to customers")
            return
        }

        setConvertingLead(lead)
        const leadLat = lead.metadata?.latitude || ""
        const leadLon = lead.metadata?.longitude || ""

        setConversionForm({
            idNumber: "",
            streetAddress: lead.address || "",
            city: lead.district || "",
            state: lead.province || "",
            zipCode: "",
            lat: leadLat ? leadLat.toString() : "",
            lon: leadLon ? leadLon.toString() : "",
            deviceName: "",
            deviceMac: "",
            assignedPkg: lead.interestedPackageId || "",
            rechargeable: false,
            membershipId: lead.memberShipId || "",
            existingISPId: "",
            isReferenced: false,
            referencedById: ""
        })

        // Reset map state
        setConvertMapPosition([27.7172, 85.3240])
        setConvertNearestSplitters([])
        setConvertServiceAvailable(null)
        setConvertServiceRadius(0.1)

        if (leadLat && leadLon) {
            const lat = parseFloat(leadLat.toString())
            const lng = parseFloat(leadLon.toString())
            if (!isNaN(lat) && !isNaN(lng)) {
                setConvertMapPosition([lat, lng])
                const nearest = findNearestSplitters(lat, lng, convertServiceRadius)
                setConvertNearestSplitters(nearest)
                const serviceAvailable = nearest.some(splitter => splitter.distance <= convertServiceRadius)
                setConvertServiceAvailable(serviceAvailable)
            }
        }

        setShowConvertDialog(true)
    }

    const handleConvertLocationSelect = (lat: number, lng: number) => {
        setConversionForm(prev => ({
            ...prev,
            lat: lat.toString(),
            lon: lng.toString()
        }))
        setConvertMapPosition([lat, lng])
        const nearest = findNearestSplitters(lat, lng, convertServiceRadius)
        setConvertNearestSplitters(nearest)
        const serviceAvailable = nearest.some(splitter => splitter.distance <= convertServiceRadius)
        setConvertServiceAvailable(serviceAvailable)
        toast.success(`Location set: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }

    const updateConversionField = (field: keyof typeof conversionForm, value: any) => {
        setConversionForm(prev => ({ ...prev, [field]: value }))
    }

    const convertLeadToCustomer = async () => {
        if (!convertingLead) return

        try {
            setLoading(true)
            const response = await apiRequest(`/lead/${convertingLead.id}/convert`, {
                method: 'POST',
                body: JSON.stringify(conversionForm)
            })
            toast.success(response.message || "Lead converted to customer successfully")
            setShowConvertDialog(false)
            fetchLeads(1)
        } catch (error: any) {
            console.error("Conversion error:", error)
            toast.error(error.message || "Failed to convert lead to customer")
        } finally {
            setLoading(false)
        }
    }

    // UI helpers
    const getStatusBadge = (status: LeadStatus, converted: boolean = false) => {
        if (converted) {
            return (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 capitalize">
                    <Check className="h-3 w-3 mr-1" />
                    Converted
                </Badge>
            )
        }

        const statusConfig = {
            new: {
                color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
                icon: AlertCircle,
                label: "New"
            },
            contacted: {
                color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                icon: PhoneCall,
                label: "Contacted"
            },
            qualified: {
                color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
                icon: TrendingUpIcon,
                label: "Qualified"
            },
            unqualified: {
                color: "bg-red-500/10 text-red-500 border-red-500/20",
                icon: TrendingDownIcon,
                label: "Unqualified"
            },
            converted: {
                color: "bg-green-500/10 text-green-500 border-green-500/20",
                icon: CheckCircle,
                label: "Converted"
            },
        }

        const config = statusConfig[status]
        const Icon = config.icon

        return (
            <Badge variant="outline" className={`${config.color} capitalize`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        )
    }

    const getGenderDisplay = (gender?: Gender) => {
        if (!gender) return "Not specified"
        const config = GENDER_OPTIONS.find(g => g.value === gender)
        return config?.label || gender
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

    const getFollowUpTypeIcon = (type: FollowUpType) => {
        const config = FOLLOW_UP_TYPE_OPTIONS.find(t => t.value === type)
        if (!config) return <MessageSquare className="h-4 w-4" />
        const Icon = config.icon
        return <Icon className="h-4 w-4" />
    }

    const getLeadFollowUpsArray = (lead: Lead): FollowUp[] => {
        if (!lead.followUps) return []
        return Array.isArray(lead.followUps) ? lead.followUps : []
    }

    // Options for selects
    const userOptions: Option[] = useMemo(() =>
        users.map(user => ({
            value: user.id,
            label: user.name,
            description: user.role?.name || "No role"
        })),
        [users]
    )

    const membershipOptions: Option[] = useMemo(() =>
        memberships.map(membership => ({
            value: membership.id,
            label: `${membership.name} (${membership.code})`
        })),
        [memberships]
    )

    const packageOptions: Option[] = useMemo(() =>
        packages.map(pkg => ({
            value: pkg.id,
            label: `${pkg.packageName || pkg.name || 'Unknown Package'}${pkg.price ? ` (NPR ${pkg.price})` : ''}`,
            description: pkg.description || ""
        })),
        [packages]
    )

    const existingISPOptions: Option[] = useMemo(() =>
        existingISPs.map(isp => ({
            value: isp.id,
            label: isp.name,
            description: isp.address || ""
        })),
        [existingISPs]
    )

    // Pagination component
    const PaginationControls = ({ pagination, onPageChange }: {
        pagination: PaginationInfo,
        onPageChange: (page: number) => void
    }) => {
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
                        onClick={() => onPageChange(1)}
                        disabled={!pagination.hasPreviousPage || pagination.currentPage === 1}
                        className="h-8 w-8"
                    >
                        <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(pagination.currentPage - 1)}
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
                            onClick={() => onPageChange(page)}
                            className="h-8 w-8"
                        >
                            {page}
                        </Button>
                    ))}

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="h-8 w-8"
                    >
                        <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onPageChange(pagination.totalPages)}
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

            {/* Status Change Dialog */}
            <Dialog open={showStatusChangeDialog} onOpenChange={setShowStatusChangeDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Change Lead Status</DialogTitle>
                        <DialogDescription>
                            Change status for {statusChangeLead?.firstName} {statusChangeLead?.lastName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">New Status</Label>
                            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as LeadStatus)}>
                                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="qualified">Qualified</SelectItem>
                                    <SelectItem value="unqualified">Unqualified</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                Current Status: <span className="font-medium">{statusChangeLead?.status}</span>
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStatusChangeDialog(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={() => handleChangeLeadStatus(statusChangeLead?.id!, newStatus)}
                            disabled={loading || !statusChangeLead?.id || statusChangeLead?.status === newStatus}>
                            {loading ? "Changing..." : "Change Status"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Follow-up Dialog */}
            <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingFollowUp ? "Edit Follow-up" : "Create Follow-up"}</DialogTitle>
                        <DialogDescription>
                            {editingFollowUp ? "Update follow-up information" : `Schedule a follow-up with ${selectedLead?.firstName} ${selectedLead?.lastName}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select value={followUpForm.type} onValueChange={(value) => updateFollowUpField("type", value as FollowUpType)}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        {FOLLOW_UP_TYPE_OPTIONS.map((type) => {
                                            const Icon = type.icon
                                            return (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div className="flex items-center gap-2"><Icon className="h-4 w-4" />{type.label}</div>
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={followUpForm.status} onValueChange={(value) => updateFollowUpField("status", value as FollowUpStatus)}>
                                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                    <SelectContent>
                                        {FOLLOW_UP_STATUS_OPTIONS.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                            <Input id="title" placeholder="Enter follow-up title" value={followUpForm.title}
                                onChange={(e) => updateFollowUpField("title", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" placeholder="Enter follow-up description" value={followUpForm.description}
                                onChange={(e) => updateFollowUpField("description", e.target.value)} rows={2} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="scheduledAt">Scheduled Date & Time <span className="text-red-500">*</span></Label>
                                <Input id="scheduledAt" type="datetime-local" value={followUpForm.scheduledAt}
                                    onChange={(e) => updateFollowUpField("scheduledAt", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="assignedUserId">Assigned To</Label>
                                <SearchableSelect options={userOptions} value={followUpForm.assignedUserId}
                                    onValueChange={(value) => updateFollowUpField("assignedUserId", value as string)}
                                    placeholder="Select user" emptyMessage="No users found" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="outcome">Outcome</Label>
                            <Select value={followUpForm.outcome} onValueChange={(value) => updateFollowUpField("outcome", value)}>
                                <SelectTrigger><SelectValue placeholder="Select outcome (if completed)" /></SelectTrigger>
                                <SelectContent>
                                    {OUTCOME_OPTIONS.map((outcome) => (
                                        <SelectItem key={outcome.value} value={outcome.value}>{outcome.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" placeholder="Enter any additional notes..." value={followUpForm.notes}
                                onChange={(e) => updateFollowUpField("notes", e.target.value)} rows={3} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowFollowUpDialog(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={saveFollowUp} disabled={loading}>
                            {loading ? "Saving..." : editingFollowUp ? "Update Follow-up" : "Create Follow-up"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Convert to Customer Dialog WITH MAP */}
            <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Convert Lead to Customer</DialogTitle>
                        <DialogDescription>
                            Convert {convertingLead?.firstName} {convertingLead?.lastName} to a customer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="idNumber">ID Number</Label>
                                <Input id="idNumber" placeholder="Enter ID number" value={conversionForm.idNumber}
                                    onChange={(e) => updateConversionField("idNumber", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="streetAddress">Street Address</Label>
                                <Input id="streetAddress" placeholder="Enter street address" value={conversionForm.streetAddress}
                                    onChange={(e) => updateConversionField("streetAddress", e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" placeholder="Enter city" value={conversionForm.city}
                                    onChange={(e) => updateConversionField("city", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input id="state" placeholder="Enter state" value={conversionForm.state}
                                    onChange={(e) => updateConversionField("state", e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="zipCode">ZIP Code</Label>
                                <Input id="zipCode" placeholder="Enter ZIP code" value={conversionForm.zipCode}
                                    onChange={(e) => updateConversionField("zipCode", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="assignedPkg">Package</Label>
                                <SearchableSelect options={packageOptions} value={conversionForm.assignedPkg}
                                    onValueChange={(value) => updateConversionField("assignedPkg", value as string)}
                                    placeholder="Select package" emptyMessage="No packages found" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="deviceName">Device Name</Label>
                                <Input id="deviceName" placeholder="Enter device name" value={conversionForm.deviceName}
                                    onChange={(e) => updateConversionField("deviceName", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deviceMac">Device MAC</Label>
                                <Input id="deviceMac" placeholder="Enter MAC address" value={conversionForm.deviceMac}
                                    onChange={(e) => updateConversionField("deviceMac", e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="membershipId">Membership</Label>
                            <SearchableSelect options={membershipOptions} value={conversionForm.membershipId}
                                onValueChange={(value) => updateConversionField("membershipId", value as string)}
                                placeholder="Select membership" emptyMessage="No memberships found" clearable />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="existingISPId">Previous ISP (if any)</Label>
                            <SearchableSelect options={existingISPOptions} value={conversionForm.existingISPId}
                                onValueChange={(value) => updateConversionField("existingISPId", value as string)}
                                placeholder="Select previous ISP" emptyMessage="No previous ISPs found" clearable />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="rechargeable" checked={conversionForm.rechargeable}
                                onChange={(e) => updateConversionField("rechargeable", e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300" />
                            <Label htmlFor="rechargeable">Rechargeable Account</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="isReferenced" checked={conversionForm.isReferenced}
                                onChange={(e) => updateConversionField("isReferenced", e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300" />
                            <Label htmlFor="isReferenced">Referral Customer</Label>
                        </div>

                        {/* Map Section for Conversion */}
                        <div className="pt-6 border-t">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Location & Service Availability</h3>
                                <div className="flex items-center gap-2">
                                    <Ruler className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">Service Radius: {formatDistance(convertServiceRadius)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - Map */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label>Set Location on Map</Label>
                                        <Button variant="outline" size="sm" onClick={() => {
                                            if (navigator.geolocation) {
                                                navigator.geolocation.getCurrentPosition(
                                                    (position) => {
                                                        const lat = position.coords.latitude
                                                        const lng = position.coords.longitude
                                                        handleConvertLocationSelect(lat, lng)
                                                    },
                                                    (error) => toast.error("Unable to get current location")
                                                )
                                            } else {
                                                toast.error("Geolocation is not supported by your browser")
                                            }
                                        }} className="flex items-center gap-2">
                                            <Navigation className="h-4 w-4" />
                                            Use My Location
                                        </Button>
                                    </div>

                                    <div className="h-[350px] rounded-lg overflow-hidden border relative">
                                        <MapContainer center={convertMapPosition} zoom={15} style={{ height: "100%", width: "100%" }}>
                                            <MapCenterUpdater center={convertMapPosition} />
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='Simulcast Technologies Pvt Ltd' />
                                            <MapClickHandler onLocationSelect={handleConvertLocationSelect} />
                                            {conversionForm.lat && conversionForm.lon && (
                                                <LocationMarker position={convertMapPosition} draggable={true} onDragEnd={handleConvertLocationSelect} />
                                            )}
                                            {/* Service area circle */}
                                            {conversionForm.lat && conversionForm.lon && (
                                                <Circle center={convertMapPosition} radius={convertServiceRadius * 1000}
                                                    pathOptions={{
                                                        fillColor: convertServiceAvailable ? 'green' : 'red',
                                                        color: convertServiceAvailable ? 'darkgreen' : 'darkred',
                                                        fillOpacity: 0.2,
                                                        weight: 2
                                                    }} />
                                            )}
                                        </MapContainer>
                                        <style jsx>{`:global(.leaflet-control-attribution) { display: none !important; }`}</style>
                                    </div>

                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            <strong>Instructions:</strong> Click on the map to set location, or drag the marker to adjust.
                                            Service is considered available if a splitter is within the service radius.
                                        </p>
                                    </div>
                                </div>

                                {/* Right Column - Coordinates & Service Info */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="latitude">Latitude</Label>
                                            <Input id="latitude" type="number" step="0.000001" placeholder="27.7172" value={conversionForm.lat}
                                                onChange={(e) => updateConversionField("lat", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="longitude">Longitude</Label>
                                            <Input id="longitude" type="number" step="0.000001" placeholder="85.3240" value={conversionForm.lon}
                                                onChange={(e) => updateConversionField("lon", e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="serviceRadius">Service Radius</Label>
                                        <div className="space-y-3">
                                            <Slider value={[convertServiceRadius]} min={0.05} max={10} step={0.05}
                                                onValueChange={(value) => {
                                                    const radius = value[0]
                                                    setConvertServiceRadius(radius)
                                                }} className="w-full" />
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>50 m</span><span>{formatDistance(convertServiceRadius)}</span><span>10 km</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Service Availability Badge */}
                                    {convertServiceAvailable !== null && (
                                        <div className="mt-4">
                                            {convertServiceAvailable ? (
                                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                    <div>
                                                        <p className="font-medium text-green-800">Service Available</p>
                                                        <p className="text-sm text-green-600">
                                                            Nearest splitter is {formatDistance(convertNearestSplitters[0]?.distance || 0)} away
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                                    <div>
                                                        <p className="font-medium text-red-800">Service Not Available</p>
                                                        <p className="text-sm text-red-600">
                                                            No splitters within service range ({formatDistance(convertServiceRadius)})
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Nearest Splitters List */}
                                    {convertNearestSplitters.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="font-medium mb-2">Nearest Splitters (within {formatDistance(convertServiceRadius)})</h4>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {convertNearestSplitters.map((splitter, index) => (
                                                    <div key={splitter.id} className="p-3 border rounded-lg hover:bg-gray-50">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-medium">{splitter.name}</div>
                                                                <div className="text-sm text-gray-500">
                                                                    ID: {splitter.splitterId} • Ratio: {splitter.splitRatio}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {splitter.location.site || 'No site specified'}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-medium">{formatDistance(splitter.distance || 0)}</div>
                                                                <Badge className={`mt-1 ${splitter.distance <= convertServiceRadius ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                    {splitter.distance <= convertServiceRadius ? 'Within range' : 'Out of range'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                            <span>Available Ports: {splitter.availablePorts}/{splitter.portCount}</span>
                                                            <span>•</span>
                                                            <span>Type: {splitter.splitterType}</span>
                                                            <span>•</span>
                                                            <span className={`px-2 py-0.5 rounded ${splitter.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                {splitter.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConvertDialog(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={convertLeadToCustomer} disabled={loading || convertingLead?.status !== 'qualified'}
                            className="bg-green-600 hover:bg-green-700">
                            {loading ? "Converting..." : convertingLead?.status === 'qualified' ? "Convert to Customer" : "Lead must be qualified"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Lead Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Lead Details</DialogTitle>
                        <DialogDescription className="text-base">
                            Complete information about {viewLead?.firstName} {viewLead?.lastName}
                        </DialogDescription>
                    </DialogHeader>
                    {viewLead && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column - Personal & Lead Info */}
                                <div className="lg:col-span-1 space-y-6">
                                    {/* Personal Information Card */}
                                    <div className="bg-card rounded-lg border p-5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <User className="h-5 w-5 text-primary" />
                                            <h3 className="text-lg font-semibold">Personal Information</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-sm text-muted-foreground mb-1 block">Full Name</Label>
                                                <p className="font-medium text-base">
                                                    {viewLead.firstName} {viewLead.middleName} {viewLead.lastName}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-sm text-muted-foreground mb-1 block">Gender</Label>
                                                    <p className="font-medium">{getGenderDisplay(viewLead.gender)}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm text-muted-foreground mb-1 block">Age</Label>
                                                    <p className="font-medium">{viewLead.metadata?.age || "Not provided"}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-muted-foreground mb-1 block">Membership</Label>
                                                <p className="font-medium">{viewLead.membership?.name || "None"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Information Card */}
                                    <div className="bg-card rounded-lg border p-5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <PhoneIcon className="h-5 w-5 text-primary" />
                                            <h3 className="text-lg font-semibold">Contact Information</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <Label className="text-sm text-muted-foreground mb-1 block">Email</Label>
                                                        <p className="font-medium truncate">{viewLead.email || "Not provided"}</p>
                                                    </div>
                                                    {viewLead.email && (
                                                        <Button variant="ghost" size="sm" asChild className="ml-2">
                                                            <a href={`mailto:${viewLead.email}`}><Mail className="h-4 w-4" /></a>
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <Label className="text-sm text-muted-foreground mb-1 block">Primary Phone</Label>
                                                        <p className="font-medium">{viewLead.phoneNumber || "Not provided"}</p>
                                                    </div>
                                                    {viewLead.phoneNumber && (
                                                        <Button variant="ghost" size="sm" onClick={() => handleOutboundcalls(viewLead.phoneNumber!)} className="ml-2 text-green-600 hover:text-green-700">
                                                            <Phone className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                                {viewLead.secondaryContactNumber && (
                                                    <div>
                                                        <Label className="text-sm text-muted-foreground mb-1 block">Secondary Phone</Label>
                                                        <p className="font-medium">{viewLead.secondaryContactNumber}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lead Information Card */}
                                    <div className="bg-card rounded-lg border p-5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <History className="h-5 w-5 text-primary" />
                                            <h3 className="text-lg font-semibold">Lead Information</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-sm text-muted-foreground mb-1 block">Status</Label>
                                                    <div className="mt-1">{getStatusBadge(viewLead.status, viewLead.convertedToCustomer)}</div>
                                                </div>
                                                <div>
                                                    <Label className="text-sm text-muted-foreground mb-1 block">Source</Label>
                                                    <p className="font-medium capitalize">{viewLead.source?.replace('_', ' ') || "Not provided"}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-muted-foreground mb-1 block">Assigned To</Label>
                                                <p className="font-medium">{viewLead.assignedUser?.name || "Unassigned"}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-muted-foreground mb-1 block">Interested Package</Label>
                                                <p className="font-medium">{viewLead.interestedPackage?.packageName || "None"}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-muted-foreground mb-1 block">Created At</Label>
                                                <p className="font-medium">{formatDate(viewLead.createdAt)}</p>
                                            </div>
                                            {viewLead.convertedToCustomer && (
                                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <Label className="text-sm text-muted-foreground mb-1 block">Converted At</Label>
                                                    <p className="font-medium text-green-700">{formatDate(viewLead.convertedAt || "")}</p>
                                                    {viewLead.convertedBy && (
                                                        <p className="text-sm text-green-600">By: {viewLead.convertedBy.name}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Location & Follow-ups */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Location Information Card with MAP */}
                                    <div className="bg-card rounded-lg border p-5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <MapPinIcon className="h-5 w-5 text-primary" />
                                            <h3 className="text-lg font-semibold">Location Information</h3>
                                        </div>

                                        {viewLead.metadata?.latitude && viewLead.metadata?.longitude ? (
                                            <div className="space-y-6">
                                                {/* Map Display */}
                                                <div className="h-[300px] rounded-lg overflow-hidden border">
                                                    <MapContainer center={[viewLead.metadata.latitude, viewLead.metadata.longitude]} zoom={15} style={{ height: "100%", width: "100%" }}>
                                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='Simulcast Technologies Pvt Ltd' />
                                                        <Marker position={[viewLead.metadata.latitude, viewLead.metadata.longitude]}>
                                                            <Popup>{viewLead.firstName} {viewLead.lastName}</Popup>
                                                        </Marker>
                                                        {viewLead.metadata.serviceRadius && (
                                                            <Circle center={[viewLead.metadata.latitude, viewLead.metadata.longitude]} radius={viewLead.metadata.serviceRadius * 1000}
                                                                pathOptions={{ fillColor: 'blue', color: 'darkblue', fillOpacity: 0.2, weight: 2 }} />
                                                        )}
                                                    </MapContainer>
                                                    <style jsx>{`:global(.leaflet-control-attribution) { display: none !important; }`}</style>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <Label className="text-sm text-muted-foreground mb-1 block">Latitude</Label>
                                                        <div className="font-mono text-sm bg-background p-2 rounded border">{viewLead.metadata.latitude}</div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm text-muted-foreground mb-1 block">Longitude</Label>
                                                        <div className="font-mono text-sm bg-background p-2 rounded border">{viewLead.metadata.longitude}</div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-sm text-muted-foreground mb-1 block">Province</Label>
                                                        <p className="font-medium">{viewLead.province || "Not provided"}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm text-muted-foreground mb-1 block">District</Label>
                                                        <p className="font-medium">{viewLead.district || "Not provided"}</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label className="text-sm text-muted-foreground mb-1 block">Address</Label>
                                                    <p className="text-sm bg-background p-2 rounded border">
                                                        {viewLead.metadata?.fullAddress || viewLead.address || "Not provided"}
                                                    </p>
                                                </div>

                                                {viewLead.metadata?.nearestSplitters && viewLead.metadata.nearestSplitters.length > 0 && (
                                                    <div className="mt-4">
                                                        <h4 className="font-medium mb-2">Nearest Splitters</h4>
                                                        <div className="space-y-2">
                                                            {viewLead.metadata.nearestSplitters.slice(0, 3).map((splitter, index) => (
                                                                <div key={index} className="p-2 border rounded">
                                                                    <div className="flex justify-between">
                                                                        <span className="font-medium">{splitter.name}</span>
                                                                        <span className="text-sm">{formatDistance(splitter.distance)}</span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Ratio: {splitter.splitRatio} • Ports: {splitter.availablePorts}/{splitter.portCount}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <MapPinIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                                <p className="text-gray-500">No location data available</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes Card */}
                                    {viewLead.notes && (
                                        <div className="bg-card rounded-lg border p-5 shadow-sm">
                                            <div className="flex items-center gap-2 mb-4">
                                                <History className="h-5 w-5 text-primary" />
                                                <h3 className="text-lg font-semibold">Notes</h3>
                                            </div>
                                            <div className="bg-muted/30 rounded-lg p-4 min-h-[120px]">
                                                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{viewLead.notes}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Follow-ups Card */}
                                    <div className="bg-card rounded-lg border p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-primary" />
                                                <h3 className="text-lg font-semibold">Follow-up History</h3>
                                            </div>
                                            <Badge variant="outline" className="ml-auto">{leadFollowUps.length} total</Badge>
                                        </div>
                                        {leadFollowUps.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                                <p className="text-gray-500">No follow-ups recorded yet</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                                {leadFollowUps.map((followUp) => (
                                                    <div key={followUp.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="space-y-2 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    {getFollowUpTypeIcon(followUp.type)}
                                                                    <h4 className="font-medium text-base">{followUp.title}</h4>
                                                                    <div className="ml-auto">{getFollowUpStatusBadge(followUp.status)}</div>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm">
                                                                    <div className="flex items-center gap-1">
                                                                        <CalendarDays className="h-3 w-3" />
                                                                        <span className="font-medium">Scheduled: {formatDate(followUp.scheduledAt)}</span>
                                                                    </div>
                                                                    {followUp.completedAt && (
                                                                        <div className="flex items-center gap-1">
                                                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                                                            <span className="text-green-600">Completed: {formatDate(followUp.completedAt)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {followUp.assignedUser && (
                                                                    <div className="flex items-center gap-1 text-sm">
                                                                        <User className="h-3 w-3" />
                                                                        <span>Assigned to: {followUp.assignedUser.name}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {followUp.description && (
                                                            <div className="mb-3">
                                                                <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
                                                                <p className="text-sm bg-muted/30 p-2 rounded">{followUp.description}</p>
                                                            </div>
                                                        )}
                                                        {followUp.notes && (
                                                            <div className="mb-3">
                                                                <Label className="text-xs text-muted-foreground mb-1 block">Notes</Label>
                                                                <p className="text-sm text-muted-foreground italic p-2 bg-muted/20 rounded">
                                                                    "{followUp.notes}"
                                                                </p>
                                                            </div>
                                                        )}
                                                        {followUp.outcome && (
                                                            <div className="mb-2">
                                                                <Label className="text-xs text-muted-foreground mb-1 block">Outcome</Label>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {OUTCOME_OPTIONS.find(o => o.value === followUp.outcome)?.label || followUp.outcome}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="pt-4 border-t">
                        <div className="flex items-center justify-between w-full">
                            <div className="text-sm text-muted-foreground">Lead ID: {viewLead?.id}</div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
                                {viewLead && !viewLead.convertedToCustomer && (
                                    <>
                                        <Button variant="outline" onClick={() => {
                                            setShowViewDialog(false)
                                            openStatusChangeDialog(viewLead)
                                        }} className="flex items-center gap-2">
                                            <TrendingUpIcon className="h-4 w-4" />Change Status
                                        </Button>
                                        <Button variant="outline" onClick={() => {
                                            setShowViewDialog(false)
                                            openFollowUpDialog(viewLead)
                                        }}>
                                            <Clock className="h-4 w-4 mr-2" />Add Follow-up
                                        </Button>
                                        <Button onClick={() => {
                                            setShowViewDialog(false)
                                            if (onEditLead) onEditLead(viewLead)
                                        }}>
                                            <Edit className="h-4 w-4 mr-2" />Edit Lead
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Main Leads Table */}
            <CardContainer title="Active Leads" description="Manage and convert leads to customers">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input placeholder="Search by name, email, or phone..." value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                            </div>
                            <Button type="submit" variant="default">
                                <Search className="h-4 w-4 mr-2" />Search
                            </Button>
                        </form>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-40">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    {STATUS_OPTIONS.map(status => (
                                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-40">
                            <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sources</SelectItem>
                                    {SOURCE_OPTIONS.map(source => (
                                        <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" onClick={handleClearFilters} className="flex items-center gap-2">
                            <X className="h-4 w-4" />Clear
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8">Loading leads...</div>
                ) : leads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No active leads found. Create your first lead or import from CSV.</div>
                ) : (
                    <>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Next Follow-up</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leads.map((lead) => {
                                        const followUpsArray = getLeadFollowUpsArray(lead)
                                        return (
                                            <TableRow key={lead.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {lead.firstName} {lead.middleName} {lead.lastName}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {getGenderDisplay(lead.gender)}
                                                    </div>
                                                    {lead.membership && (
                                                        <div className="text-xs text-muted-foreground">
                                                            <Tag className="inline h-3 w-3 mr-1" />
                                                            {lead.membership.name}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Mail className="h-3 w-3" />
                                                            {lead.email || "-"}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Phone className="h-3 w-3 cursor-pointer text-green-600 hover:text-blue-800"
                                                                onClick={() => { if (lead.phoneNumber) handleOutboundcalls(lead.phoneNumber) }} />
                                                            {lead.phoneNumber || "-"}
                                                        </div>
                                                        {lead.secondaryContactNumber && (
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <PhoneIcon className="h-3 w-3" />
                                                                {lead.secondaryContactNumber}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {lead.district && (
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <MapPin className="h-3 w-3" />
                                                                {lead.district}
                                                            </div>
                                                        )}
                                                        {lead.province && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {lead.province}
                                                            </div>
                                                        )}
                                                        {lead.metadata?.latitude && lead.metadata?.longitude && (
                                                            <div className="text-xs text-blue-600">
                                                                <MapPinIcon className="inline h-3 w-3 mr-1" />
                                                                Coordinates set
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {lead.source?.replace('_', ' ') || "-"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(lead.status)}
                                                        <Button variant="ghost" size="icon" onClick={() => openStatusChangeDialog(lead)} className="h-6 w-6" title="Change Status">
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {lead.nextFollowUp ? (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <CalendarDays className="h-4 w-4 text-blue-500" />
                                                            <div>
                                                                <div>{formatDateShort(lead.nextFollowUp)}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {followUpsArray.length > 0 &&
                                                                        `${followUpsArray.filter(f => f.status === 'SCHEDULED').length} scheduled`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">No follow-up</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {lead.assignedUser ? (
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <div className="font-medium">{lead.assignedUser.name}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {lead.assignedUser.role?.name || "No role"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">Unassigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <Calendar className="inline h-3 w-3 mr-1" />
                                                        {formatDate(lead.createdAt)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => {
                                                            if (onViewLead) onViewLead(lead)
                                                            else viewLeadDetails(lead)
                                                        }} className="h-8 w-8 hover:bg-blue-100" title="View">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => {
                                                            if (onEditLead) onEditLead(lead)
                                                        }} className="h-8 w-8 hover:bg-green-100" title="Edit">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => {
                                                            if (onAddFollowUp) onAddFollowUp(lead)
                                                            else openFollowUpDialog(lead)
                                                        }} className="h-8 w-8 hover:bg-purple-100" title="Add Follow-up">
                                                            <Clock className="h-4 w-4 text-purple-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => {
                                                            if (onConvertLead) onConvertLead(lead)
                                                            else openConvertDialog(lead)
                                                        }} className="h-8 w-8 hover:bg-green-100" title="Convert to Customer">
                                                            <UserPlus className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => deleteLead(lead.id)} className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-red-100" title="Delete">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        <PaginationControls pagination={pagination} onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))} />
                    </>
                )}
            </CardContainer>
        </div>
    )
}
// At the bottom of the file, after the ActiveLeads component
export { ActiveLeads as LeadListView }