"use client"

import React, { useState, useEffect, useMemo } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-hot-toast"
import {
    Save,
    User,
    Building,
    Package,
    Users,
    MapPin,
    AlertTriangle,
    CheckCircle,
    Navigation,
    Map,
    Ruler,
    CalendarDays,
    MessageSquare,
    Phone,
    Mail,
    Edit,
    Trash2,
    Plus,
    Clock,
    ChevronLeft,
    Search,
    Loader2,
    ChevronRight
} from "lucide-react"
import { useConfirmToast } from "@/hooks/use-confirm-toast"
import { apiRequest } from "@/lib/api"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

// Dynamic imports for Leaflet (to avoid SSR issues)
import dynamic from 'next/dynamic'
import "leaflet/dist/leaflet.css"
import { useMapEvents, useMap } from 'react-leaflet'

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })

// Interface for geocoding result
interface GeocodingResult {
    place_id: number
    licence: string
    osm_type: string
    osm_id: number
    lat: string
    lon: string
    class: string
    type: string
    place_rank: number
    importance: number
    addresstype: string
    name: string
    display_name: string
    boundingbox: [string, string, string, string]
    address?: {
        road?: string
        county?: string
        state_district?: string
        state?: string
        country?: string
    }
}

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
    followUps?: FollowUp[]
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
    distance?: number
}

// Source options
const SOURCE_OPTIONS: Option[] = [
    { value: "website", label: "Website" },
    { value: "referral", label: "Referral" },
    { value: "social_media", label: "Social Media" },
    { value: "advertisement", label: "Advertisement" },
    { value: "cold_call", label: "Cold Call" },
    { value: "walk_in", label: "Walk-in" },
    { value: "event", label: "Event" },
    { value: "other", label: "Other" }
]

// Status options
const STATUS_OPTIONS: Option[] = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "unqualified", label: "Unqualified" },
    { value: "converted", label: "Converted" }
]

// Gender options
const GENDER_OPTIONS: Option[] = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" }
]

// Province options for Nepal
const PROVINCE_OPTIONS: Option[] = [
    { value: "koshi", label: "Koshi Province" },
    { value: "madhesh", label: "Madhesh Province" },
    { value: "bagmati", label: "Bagmati Province" },
    { value: "gandaki", label: "Gandaki Province" },
    { value: "lumbini", label: "Lumbini Province" },
    { value: "karnali", label: "Karnali Province" },
    { value: "sudurpaschim", label: "Sudurpaschim Province" }
]

// Follow-up type options
const FOLLOW_UP_TYPE_OPTIONS = [
    { value: "CALL", label: "Phone Call", icon: Phone },
    { value: "EMAIL", label: "Email", icon: Mail },
    { value: "MEETING", label: "Meeting", icon: Users },
    { value: "VISIT", label: "Site Visit", icon: Map },
    { value: "OTHER", label: "Other", icon: MessageSquare }
]

// Follow-up status options
const FOLLOW_UP_STATUS_OPTIONS = [
    { value: "SCHEDULED", label: "Scheduled", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    { value: "COMPLETED", label: "Completed", color: "bg-green-500/10 text-green-500 border-green-500/20" },
    { value: "CANCELLED", label: "Cancelled", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
    { value: "MISSED", label: "Missed", color: "bg-red-500/10 text-red-500 border-red-500/20" }
]

// Outcome options
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

// Helper function to format distance
const formatDistance = (distance: any): string => {
    try {
        const distNum = Number(distance);
        if (isNaN(distNum) || !isFinite(distNum)) {
            return "N/A";
        }
        if (distNum < 1) {
            const meters = distNum * 1000;
            if (meters < 100) {
                return `${meters.toFixed(0)} m`;
            } else {
                return `${meters.toFixed(0)} m`;
            }
        } else if (distNum < 10) {
            return `${distNum.toFixed(2)} km`;
        } else {
            return `${distNum.toFixed(1)} km`;
        }
    } catch (error) {
        return "N/A";
    }
}

// Custom icon factory function (only runs on client)
const getCustomIcon = () => {
    if (typeof window === 'undefined') return null
    
    // Dynamically import Leaflet only on client side
    const L = require('leaflet')
    
    // Fix Leaflet marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
        iconUrl: '/leaflet/images/marker-icon.png',
        shadowUrl: '/leaflet/images/marker-shadow.png',
    })
    
    return new L.Icon({
        iconUrl: '/leaflet/images/marker-icon.png',
        iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
        shadowUrl: '/leaflet/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    })
}

// Map Click Handler Component
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

// Location Marker Component with enhanced popup
const LocationMarker = ({
    position,
    draggable = true,
    onDragEnd,
    address = "",
    serviceAvailable = null,
    nearestSplitter = null,
}: {
    position: [number, number],
    draggable?: boolean,
    onDragEnd?: (lat: number, lng: number, address?: string) => void,
    address?: string,
    serviceAvailable?: boolean | null,
    nearestSplitter?: { distance: number, name: string } | null
}) => {
    const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position)
    const [isDragging, setIsDragging] = useState(false)
    const [customIcon, setCustomIcon] = useState<any>(null)

    // Initialize icon on client side only
    useEffect(() => {
        setCustomIcon(getCustomIcon())
    }, [])

    const eventHandlers = useMemo(() => ({
        dragstart: () => {
            setIsDragging(true)
        },
        dragend: (e: any) => {
            const marker = e.target
            const position = marker.getLatLng()
            const newPosition: [number, number] = [position.lat, position.lng]
            setMarkerPosition(newPosition)
            if (onDragEnd) {
                onDragEnd(position.lat, position.lng, address)
            }
            setIsDragging(false)
        },
    }), [onDragEnd, address])

    useEffect(() => {
        if (position) {
            setMarkerPosition(position)
        }
    }, [position])

    if (!markerPosition || !customIcon) return null

    return (
        <Marker
            position={markerPosition}
            draggable={draggable}
            eventHandlers={eventHandlers}
            icon={customIcon}
        >
            <Popup>
                <div className="p-2 min-w-[250px]">
                    <div className="font-semibold text-sm mb-2">📍 Selected Location</div>

                    <div className="space-y-2">
                        <div className="text-xs">
                            <span className="font-medium">Coordinates:</span>
                            <div className="text-gray-600">
                                Lat: {markerPosition[0].toFixed(6)}
                                <br />
                                Lng: {markerPosition[1].toFixed(6)}
                            </div>
                        </div>

                        {address && (
                            <div className="text-xs">
                                <span className="font-medium">Address:</span>
                                <div className="text-gray-600 mt-1">{address}</div>
                            </div>
                        )}

                        {serviceAvailable !== null && (
                            <div className={`text-xs p-2 rounded ${serviceAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                <span className="font-medium">Service:</span>
                                <div className="mt-1">
                                    {serviceAvailable ? '✅ Available' : '❌ Not Available'}
                                </div>
                            </div>
                        )}

                        {nearestSplitter && (
                            <div className="text-xs bg-blue-50 p-2 rounded">
                                <span className="font-medium">Nearest Splitter:</span>
                                <div className="text-gray-600 mt-1">
                                    {nearestSplitter.name}
                                    <br />
                                    Distance: {formatDistance(nearestSplitter.distance)}
                                </div>
                            </div>
                        )}

                        {isDragging && (
                            <div className="text-xs text-amber-600 italic">
                                Dragging marker...
                            </div>
                        )}
                    </div>
                </div>
            </Popup>
        </Marker>
    )
}

// Map Center Updater Component
const MapCenterUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap()

    useEffect(() => {
        if (center && center[0] && center[1] && map && typeof map.getZoom === 'function') {
            map.setView(center, map.getZoom())
        }
    }, [center, map])

    return null
}

// Splitter Marker Component
const SplitterMarker = ({ splitter }: { splitter: Splitter }) => {
    const [isClient, setIsClient] = useState(false)
    const [splitterIcon, setSplitterIcon] = useState<any>(null)
    
    useEffect(() => {
        setIsClient(true)
        
        // Create splitter icon on client side
        if (typeof window !== 'undefined') {
            const L = require('leaflet')
            const icon = new L.DivIcon({
                html: `
                    <div class="relative">
                        <div class="w-6 h-6 rounded-full ${splitter.isMaster ? 'bg-purple-500' : 'bg-blue-500'} border-2 border-white shadow-lg flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                            </svg>
                        </div>
                    </div>
                `,
                className: 'splitter-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
            setSplitterIcon(icon)
        }
    }, [splitter.isMaster])
    
    const position: [number, number] = [splitter.location.latitude || 0, splitter.location.longitude || 0]

    if (!splitter.location.latitude || !splitter.location.longitude || !isClient || !splitterIcon) {
        return null
    }

    return (
        <Marker
            position={position}
            icon={splitterIcon}
        >
            <Popup>
                <div className="p-1">
                    <strong>{splitter.name}</strong><br />
                    ID: {splitter.splitterId}<br />
                    Type: {splitter.splitterType}<br />
                    Ratio: {splitter.splitRatio}<br />
                    Status: <span className={`px-2 py-1 rounded text-xs ${splitter.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {splitter.status}
                    </span><br />
                    Available Ports: {splitter.availablePorts}/{splitter.portCount}<br />
                    <div className="mt-2 text-xs text-gray-500">
                        {splitter.location.site || 'No site specified'}
                    </div>
                </div>
            </Popup>
        </Marker>
    )
}

interface CreateLeadFormProps {
    leadId?: string
}

export function CreateLeadForm({ leadId }: CreateLeadFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [packages, setPackages] = useState<PackagePlan[]>([])
    const [memberships, setMemberships] = useState<Membership[]>([])
    const [splitters, setSplitters] = useState<Splitter[]>([])
    const [leadFollowUps, setLeadFollowUps] = useState<FollowUp[]>([])
    const [showFollowUpDialog, setShowFollowUpDialog] = useState(false)
    const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

    // Map state for lead form
    const [leadMapPosition, setLeadMapPosition] = useState<[number, number]>([27.7172, 85.3240])
    const [leadNearestSplitters, setLeadNearestSplitters] = useState<Splitter[]>([])
    const [leadServiceAvailable, setLeadServiceAvailable] = useState<boolean | null>(null)
    const [leadServiceRadius, setLeadServiceRadius] = useState<number>(0.1)

    // Add to your existing state declarations
    const [currentLocationAddress, setCurrentLocationAddress] = useState<string>("")
    const [reverseGeocodingLoading, setReverseGeocodingLoading] = useState(false)

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
    const [searching, setSearching] = useState(false)

    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        secondaryContactNumber: "",
        source: "",
        status: "new" as LeadStatus,
        notes: "",
        memberShipId: "",
        assignedUserId: "",
        interestedPackageId: "",
        address: "",
        street: "",
        district: "",
        province: "",
        gender: "" as Gender | "",
        age: "" as number | "",
        fullAddress: "",
        latitude: "" as string | "",
        longitude: "" as string | "",
        serviceRadius: "0.1" as string | ""
    })

    // Follow-up form state
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

    const { confirm, ConfirmDialog } = useConfirmToast()

    // Set mounted state
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Prepare options from data using useMemo for performance
    const userOptions: Option[] = useMemo(() =>
        users.map(user => ({
            value: String(user.id),
            label: user.name,
            description: user.role?.name || "No role"
        })),
        [users]
    )

    const membershipOptions: Option[] = useMemo(() =>
        memberships.map(membership => ({
            value: String(membership.id),
            label: `${membership.name} (${membership.code})`
        })),
        [memberships]
    )

    const packageOptions: Option[] = useMemo(() =>
        packages.map(pkg => ({
            value: String(pkg.id),
            label: `${pkg.packageName || pkg.name || 'Unknown Package'}${pkg.price ? ` (NPR ${pkg.price})` : ''}`,
            description: pkg.description || ""
        })),
        [packages]
    )

    // Fetch data on component mount
    useEffect(() => {
        fetchUsers()
        fetchPackages()
        fetchMemberships()
        fetchSplitters()
        if (leadId) {
            setIsEditing(true)
            fetchLead()
        }
    }, [leadId])

    // Function to geocode address using Nominatim
    const searchLocation = async (query: string) => {
        if (!query.trim()) {
            toast.error("Please enter a location to search")
            return
        }

        setSearching(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=np`
            )
            const data: GeocodingResult[] = await response.json()

            if (data.length > 0) {
                setSearchResults(data)
                toast.success(`Found ${data.length} location${data.length > 1 ? 's' : ''}`)
            } else {
                setSearchResults([])
                toast.error("No locations found")
            }
        } catch (error) {
            console.error("Geocoding error:", error)
            toast.error("Failed to search location")
            setSearchResults([])
        } finally {
            setSearching(false)
        }
    }

    // Handle selecting a search result
    const handleSelectSearchResult = (result: GeocodingResult) => {
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)

        setLeadMapPosition([lat, lng])

        setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
            fullAddress: result.display_name || "",
            address: result.name || "",
            district: result.address?.county || result.address?.state_district || "",
            province: result.address?.state || "",
            street: result.address?.road || ""
        }))

        // Set current location address from search result
        setCurrentLocationAddress(result.display_name)

        const radius = leadServiceRadius || 0.1
        const nearest = findNearestSplitters(lat, lng, radius)
        setLeadNearestSplitters(nearest)
        const serviceAvailable = nearest.some(splitter => splitter.distance <= radius)
        setLeadServiceAvailable(serviceAvailable)

        setSearchResults([])
        setSearchQuery("")
        toast.success(`Location set to: ${result.display_name.split(',')[0]}`)
    }

    const fetchUsers = async () => {
        try {
            const data = await apiRequest("/users")
            const processedUsers = Array.isArray(data)
                ? data.map((user: any) => ({
                    ...user,
                    id: String(user.id),
                    role: user.role || undefined
                }))
                : []
            setUsers(processedUsers)
        } catch (error: any) {
            console.error("Failed to fetch users:", error)
            toast.error("Failed to load users for assignment")
        }
    }

    const fetchPackages = async () => {
        try {
            const data = await apiRequest("/package-price")
            const processedPackages = Array.isArray(data)
                ? data.map((pkg: any) => {
                    const id = pkg.id || pkg.planId || ''
                    const name = pkg.packageName || pkg.name || pkg.planName || 'Unknown Package'
                    const price = typeof pkg.price === 'number' ? pkg.price :
                        typeof pkg.amount === 'number' ? pkg.amount : 0

                    return {
                        id: String(id),
                        name: name,
                        packageName: name,
                        price: price,
                        description: pkg.description || ''
                    }
                })
                : []
            setPackages(processedPackages)
        } catch (error: any) {
            console.error("Failed to fetch packages:", error)
            toast.error("Failed to load package plans")
        }
    }

    const fetchMemberships = async () => {
        try {
            const data = await apiRequest("/membership")
            const processedMemberships = Array.isArray(data)
                ? data.map((membership: any) => ({
                    ...membership,
                    id: String(membership.id)
                }))
                : []
            setMemberships(processedMemberships)
        } catch (error: any) {
            console.error("Failed to fetch memberships:", error)
            toast.error("Failed to load memberships")
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

            const processedSplitters = dataArray.map((splitter: any) => ({
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
            }))

            setSplitters(processedSplitters)
        } catch (error: any) {
            console.error("Failed to fetch splitters:", error)
            toast.error("Failed to load splitters")
        }
    }

    const fetchLead = async () => {
        if (!leadId) return

        try {
            setLoading(true)
            const response = await apiRequest(`/lead/${leadId}`)

            if (!response) {
                throw new Error("Lead not found")
            }

            const lead = response

            if (lead) {
                setSelectedLead(lead)
                const processedData = {
                    firstName: lead.firstName || "",
                    middleName: lead.middleName || "",
                    lastName: lead.lastName || "",
                    email: lead.email || "",
                    phoneNumber: lead.phoneNumber || "",
                    secondaryContactNumber: lead.secondaryContactNumber || "",
                    source: lead.source || "",
                    status: lead.status || "new",
                    notes: lead.notes || "",
                    memberShipId: lead.memberShipId ? String(lead.memberShipId) : "",
                    assignedUserId: lead.assignedUserId ? String(lead.assignedUserId) : "",
                    interestedPackageId: lead.interestedPackageId ? String(lead.interestedPackageId) : "",
                    address: lead.address || "",
                    street: lead.street || "",
                    district: lead.district || "",
                    province: lead.province || "",
                    gender: lead.gender || "",
                    age: lead.metadata?.age?.toString() || "",
                    fullAddress: lead.metadata?.fullAddress || "",
                    latitude: lead.metadata?.latitude?.toString() || "",
                    longitude: lead.metadata?.longitude?.toString() || "",
                    serviceRadius: lead.metadata?.serviceRadius?.toString() || "0.1"
                }

                setFormData(processedData)

                // Set map position if coordinates exist
                if (lead.metadata?.latitude && lead.metadata?.longitude) {
                    const lat = parseFloat(lead.metadata.latitude.toString())
                    const lng = parseFloat(lead.metadata.longitude.toString())
                    setLeadMapPosition([lat, lng])
                    const radius = parseFloat(lead.metadata.serviceRadius?.toString() || "0.1")
                    setLeadServiceRadius(radius)
                    const nearest = findNearestSplitters(lat, lng, radius)
                    setLeadNearestSplitters(nearest)
                    const serviceAvailable = nearest.some(splitter => splitter.distance <= radius)
                    setLeadServiceAvailable(serviceAvailable)
                }

                await fetchLeadFollowUps(leadId)
            }
        } catch (error: any) {
            console.error("Failed to fetch lead:", error)
            toast.error(error.message || "Failed to load lead")
            router.push('/leads')
        } finally {
            setLoading(false)
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
            toast.error("Failed to load follow-ups")
            setLeadFollowUps([])
        }
    }

    // Calculate distance between two coordinates using Haversine formula
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

    // Find nearest splitters
    const findNearestSplitters = (lat: number, lng: number, maxDistanceKm: number = 5) => {
        if (!lat || !lng) return []

        const splittersWithDistance = splitters
            .filter(splitter => splitter.location.latitude && splitter.location.longitude)
            .map(splitter => {
                const distance = calculateDistance(
                    lat,
                    lng,
                    splitter.location.latitude!,
                    splitter.location.longitude!
                )
                return {
                    ...splitter,
                    distance: Number(distance)
                }
            })
            .filter(splitter => splitter.distance <= maxDistanceKm)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5)

        return splittersWithDistance
    }

    // Reverse geocode function to get address from coordinates
    const reverseGeocode = async (lat: number, lng: number) => {
        setReverseGeocodingLoading(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            )
            const data = await response.json()

            if (data.display_name) {
                setCurrentLocationAddress(data.display_name)
                return data.display_name
            } else {
                setCurrentLocationAddress("Location details not available")
                return null
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error)
            setCurrentLocationAddress("Unable to get location details")
            return null
        } finally {
            setReverseGeocodingLoading(false)
        }
    }
    
    // Handle lead form location selection
    const handleLeadLocationSelect = async (lat: number, lng: number) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString()
        }))

        setLeadMapPosition([lat, lng])

        const radius = leadServiceRadius || 0.1
        const nearest = findNearestSplitters(lat, lng, radius)
        setLeadNearestSplitters(nearest)

        const serviceAvailable = nearest.some(splitter => splitter.distance <= radius)
        setLeadServiceAvailable(serviceAvailable)

        // Reverse geocode to get address
        await reverseGeocode(lat, lng)

        toast.success(`Location set: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }

    // Handle lead marker drag end
    const handleLeadMarkerDragEnd = async (lat: number, lng: number) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString()
        }))

        setLeadMapPosition([lat, lng])

        const radius = leadServiceRadius || 0.1
        const nearest = findNearestSplitters(lat, lng, radius)
        setLeadNearestSplitters(nearest)

        const serviceAvailable = nearest.some(splitter => splitter.distance <= radius)
        setLeadServiceAvailable(serviceAvailable)

        // Reverse geocode to get address
        await reverseGeocode(lat, lng)

        toast.success(`Marker moved to: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }

    // Update lead map when lat/lon changes in form
    useEffect(() => {
        if (formData.latitude && formData.longitude) {
            const lat = parseFloat(formData.latitude)
            const lon = parseFloat(formData.longitude)
            if (!isNaN(lat) && !isNaN(lon)) {
                setLeadMapPosition([lat, lon])
                const radius = leadServiceRadius || 0.1
                const nearest = findNearestSplitters(lat, lon, radius)
                setLeadNearestSplitters(nearest)
                const serviceAvailable = nearest.some(splitter => splitter.distance <= radius)
                setLeadServiceAvailable(serviceAvailable)
                reverseGeocode(lat, lon)
            }
        }
    }, [formData.latitude, formData.longitude, leadServiceRadius])

    const updateFormField = (field: keyof typeof formData, value: any) => {
        if (field === 'assignedUserId' || field === 'memberShipId' || field === 'interestedPackageId') {
            value = value ? String(value) : ""
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }))

        if (field === 'latitude' || field === 'longitude') {
            const lat = field === 'latitude' ? parseFloat(value) : parseFloat(prev.latitude || '')
            const lon = field === 'longitude' ? parseFloat(value) : parseFloat(prev.longitude || '')
            if (!isNaN(lat) && !isNaN(lon)) {
                setLeadMapPosition([lat, lon])
                const radius = leadServiceRadius || 0.1
                const nearest = findNearestSplitters(lat, lon, radius)
                setLeadNearestSplitters(nearest)
                const serviceAvailable = nearest.some(splitter => splitter.distance <= radius)
                setLeadServiceAvailable(serviceAvailable)
            }
        }

        if (field === 'serviceRadius' && formData.latitude && formData.longitude) {
            const radius = parseFloat(value) || 0.1
            setLeadServiceRadius(radius)
            const lat = parseFloat(formData.latitude)
            const lon = parseFloat(formData.longitude)
            if (!isNaN(lat) && !isNaN(lon)) {
                const nearest = findNearestSplitters(lat, lon, radius)
                setLeadNearestSplitters(nearest)
                const serviceAvailable = nearest.some(splitter => splitter.distance <= radius)
                setLeadServiceAvailable(serviceAvailable)
            }
        }
    }

    const updateFollowUpField = (field: keyof typeof followUpForm, value: any) => {
        setFollowUpForm(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const validateForm = () => {
        if (!formData.firstName.trim()) {
            toast.error("First name is required")
            return false
        }
        if (!formData.lastName.trim()) {
            toast.error("Last name is required")
            return false
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            toast.error("Invalid email format")
            return false
        }
        return true
    }

    const validateFollowUpForm = () => {
        if (!followUpForm.title.trim()) {
            toast.error("Follow-up title is required")
            return false
        }
        if (!followUpForm.scheduledAt.trim()) {
            toast.error("Scheduled date is required")
            return false
        }
        return true
    }

    const saveLead = async () => {
        if (!validateForm()) return

        try {
            setLoading(true)

            const leadData = {
                ...formData,
                metadata: {
                    fullAddress: formData.fullAddress,
                    age: formData.age ? parseInt(formData.age as any) : undefined,
                    latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
                    serviceRadius: formData.serviceRadius ? parseFloat(formData.serviceRadius) : 0.1,
                    nearestSplitters: leadNearestSplitters.map(splitter => ({
                        id: splitter.id,
                        name: splitter.name,
                        distance: splitter.distance,
                        splitRatio: splitter.splitRatio,
                        availablePorts: splitter.availablePorts,
                        portCount: splitter.portCount
                    }))
                }
            }

            if (leadId) {
                await apiRequest(`/lead/${leadId}`, {
                    method: 'PUT',
                    body: JSON.stringify(leadData)
                })
                toast.success("Lead updated successfully")
            } else {
                await apiRequest("/lead", {
                    method: 'POST',
                    body: JSON.stringify(leadData)
                })
                toast.success("Lead created successfully")
            }

            router.push('/leads')
        } catch (error: any) {
            console.error("Save error:", error)
            toast.error(error.message || "Failed to save lead")
        } finally {
            setLoading(false)
        }
    }

    const openFollowUpDialog = (followUp?: FollowUp) => {
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
                title: `Follow-up with ${formData.firstName} ${formData.lastName}`,
                description: "",
                scheduledAt: tomorrow.toISOString().split('T')[0],
                assignedUserId: formData.assignedUserId || "",
                notes: "",
                status: "SCHEDULED",
                outcome: ""
            })
        }

        setShowFollowUpDialog(true)
    }

    const saveFollowUp = async () => {
        if (!selectedLead && !leadId) return
        if (!validateFollowUpForm()) return

        try {
            setLoading(true)
            const currentLeadId = selectedLead?.id || leadId

            if (editingFollowUp) {
                await apiRequest(`/followup/follow-ups/${editingFollowUp.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(followUpForm)
                })
                toast.success("Follow-up updated successfully")
            } else if (currentLeadId) {
                await apiRequest(`/followup/leads/${currentLeadId}/follow-ups`, {
                    method: 'POST',
                    body: JSON.stringify(followUpForm)
                })
                toast.success("Follow-up created successfully")
            }

            if (leadId) {
                await fetchLeadFollowUps(leadId)
            }

            setShowFollowUpDialog(false)
            resetFollowUpForm()
        } catch (error: any) {
            console.error("Follow-up save error:", error)
            toast.error(error.message || "Failed to save follow-up")
        } finally {
            setLoading(false)
        }
    }

    const deleteFollowUp = async (followUpId: string) => {
        const isConfirmed = await confirm({
            title: "Delete Follow-up",
            message: "Are you sure you want to delete this follow-up?",
            type: "danger",
            confirmText: "Delete",
            cancelText: "Cancel"
        })

        if (!isConfirmed) return

        try {
            setLoading(true)
            await apiRequest(`/followup/leads/follow-ups/${followUpId}`, {
                method: 'DELETE'
            })
            toast.success("Follow-up deleted successfully")

            if (leadId) {
                await fetchLeadFollowUps(leadId)
            }
        } catch (error: any) {
            console.error("Delete follow-up error:", error)
            toast.error(error.message || "Failed to delete follow-up")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            firstName: "",
            middleName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            secondaryContactNumber: "",
            source: "",
            status: "new",
            notes: "",
            memberShipId: "",
            assignedUserId: "",
            interestedPackageId: "",
            address: "",
            street: "",
            district: "",
            province: "",
            gender: "",
            age: "",
            fullAddress: "",
            latitude: "",
            longitude: "",
            serviceRadius: "0.1"
        })
        setLeadMapPosition([27.7172, 85.3240])
        setLeadNearestSplitters([])
        setLeadServiceAvailable(null)
        setLeadServiceRadius(0.1)
        setLeadFollowUps([])
        setSearchQuery("")
        setSearchResults([])
    }

    const resetFollowUpForm = () => {
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
        setEditingFollowUp(null)
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

    if (loading && leadId) {
        return (
            <CardContainer title={isEditing ? "Edit Lead" : "Create New Lead"}>
                <div className="text-center py-8">Loading lead data...</div>
            </CardContainer>
        )
    }

    return (
        <div className="space-y-6">
            <ConfirmDialog />

            {/* Follow-up Dialog */}
            <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingFollowUp ? "Edit Follow-up" : "Create Follow-up"}</DialogTitle>
                        <DialogDescription>
                            {editingFollowUp
                                ? "Update follow-up information"
                                : `Schedule a follow-up with ${formData.firstName} ${formData.lastName}`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={followUpForm.type}
                                    onValueChange={(value) => updateFollowUpField("type", value as FollowUpType)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FOLLOW_UP_TYPE_OPTIONS.map((type) => {
                                            const Icon = type.icon
                                            return (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4" />
                                                        {type.label}
                                                    </div>
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={followUpForm.status}
                                    onValueChange={(value) => updateFollowUpField("status", value as FollowUpStatus)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FOLLOW_UP_STATUS_OPTIONS.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="Enter follow-up title"
                                value={followUpForm.title}
                                onChange={(e) => updateFollowUpField("title", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Enter follow-up description"
                                value={followUpForm.description}
                                onChange={(e) => updateFollowUpField("description", e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="scheduledAt">
                                    Scheduled Date & Time <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="scheduledAt"
                                    type="datetime-local"
                                    value={followUpForm.scheduledAt}
                                    onChange={(e) => updateFollowUpField("scheduledAt", e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="assignedUserId">Assigned To</Label>
                                <SearchableSelect
                                    options={userOptions}
                                    value={followUpForm.assignedUserId}
                                    onValueChange={(value) => updateFollowUpField("assignedUserId", value as string)}
                                    placeholder="Select user"
                                    emptyMessage="No users found"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="outcome">Outcome</Label>
                            <Select
                                value={followUpForm.outcome}
                                onValueChange={(value) => updateFollowUpField("outcome", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select outcome (if completed)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {OUTCOME_OPTIONS.map((outcome) => (
                                        <SelectItem key={outcome.value} value={outcome.value}>
                                            {outcome.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Enter any additional notes..."
                                value={followUpForm.notes}
                                onChange={(e) => updateFollowUpField("notes", e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowFollowUpDialog(false)
                                resetFollowUpForm()
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveFollowUp}
                            disabled={loading}
                        >
                            {loading ? "Saving..." : editingFollowUp ? "Update Follow-up" : "Create Follow-up"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CardContainer title={isEditing ? "Edit Lead" : "Create New Lead"} description={isEditing ? "Update lead information" : "Enter details for the new lead"}>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                placeholder="Enter first name"
                                value={formData.firstName}
                                onChange={(e) => updateFormField("firstName", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="middleName">Middle Name</Label>
                            <Input
                                id="middleName"
                                placeholder="Enter middle name"
                                value={formData.middleName}
                                onChange={(e) => updateFormField("middleName", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                placeholder="Enter last name"
                                value={formData.lastName}
                                onChange={(e) => updateFormField("lastName", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter email address"
                                value={formData.email}
                                onChange={(e) => updateFormField("email", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input
                                id="phoneNumber"
                                placeholder="+977-98XXXXXXXX"
                                value={formData.phoneNumber}
                                onChange={(e) => updateFormField("phoneNumber", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="secondaryContactNumber">Secondary Contact Number</Label>
                            <Input
                                id="secondaryContactNumber"
                                placeholder="+977-98XXXXXXXX"
                                value={formData.secondaryContactNumber}
                                onChange={(e) => updateFormField("secondaryContactNumber", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <SearchableSelect
                                options={GENDER_OPTIONS}
                                value={formData.gender}
                                onValueChange={(value) => updateFormField("gender", value as Gender)}
                                placeholder="Select gender"
                                emptyMessage="No gender options"
                                clearable
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="age">Age</Label>
                            <Input
                                id="age"
                                type="number"
                                placeholder="Enter age"
                                value={formData.age}
                                onChange={(e) => updateFormField("age", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="source">Source</Label>
                            <SearchableSelect
                                options={SOURCE_OPTIONS}
                                value={formData.source}
                                onValueChange={(value) => updateFormField("source", value as string)}
                                placeholder="Select source"
                                emptyMessage="No source found"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <SearchableSelect
                                options={STATUS_OPTIONS}
                                value={formData.status}
                                onValueChange={(value) => updateFormField("status", value as LeadStatus)}
                                placeholder="Select status"
                                emptyMessage="No status found"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="province">Province</Label>
                            <SearchableSelect
                                options={PROVINCE_OPTIONS}
                                value={formData.province}
                                onValueChange={(value) => updateFormField("province", value as string)}
                                placeholder="Select province"
                                emptyMessage="No province found"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="district">District</Label>
                            <Input
                                id="district"
                                placeholder="Enter district"
                                value={formData.district}
                                onChange={(e) => updateFormField("district", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="street">Street</Label>
                            <Input
                                id="street"
                                placeholder="Enter street"
                                value={formData.street}
                                onChange={(e) => updateFormField("street", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            placeholder="Enter address"
                            value={formData.address}
                            onChange={(e) => updateFormField("address", e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullAddress">Full Address</Label>
                        <Textarea
                            id="fullAddress"
                            placeholder="Enter full address"
                            value={formData.fullAddress || ''}
                            onChange={(e) => updateFormField("fullAddress", e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="assignedUserId">Assign To</Label>
                            <SearchableSelect
                                key={`user-select-${formData.assignedUserId || 'empty'}`}
                                options={userOptions}
                                value={formData.assignedUserId}
                                onValueChange={(value) => updateFormField("assignedUserId", value as string)}
                                placeholder="Select user"
                                emptyMessage="No users found"
                                clearable
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="memberShipId">Membership</Label>
                            <SearchableSelect
                                key={`membership-select-${formData.memberShipId || 'empty'}`}
                                options={membershipOptions}
                                value={formData.memberShipId}
                                onValueChange={(value) => updateFormField("memberShipId", value as string)}
                                placeholder="Select membership"
                                emptyMessage="No memberships found"
                                clearable
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="interestedPackageId">Interested Package</Label>
                        <SearchableSelect
                            key={`package-select-${formData.interestedPackageId || 'empty'}`}
                            options={packageOptions}
                            value={formData.interestedPackageId}
                            onValueChange={(value) => updateFormField("interestedPackageId", value as string)}
                            placeholder="Select package"
                            emptyMessage="No packages found"
                            clearable
                        />
                    </div>

                    {/* Map Section for Lead Form */}
                    <div className="pt-6 border-t">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Location & Service Availability</h3>
                            <div className="flex items-center gap-2">
                                <Ruler className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">Service Radius: {formatDistance(leadServiceRadius)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - Map */}
                            <div className="space-y-4">
                                {/* Search Location Section */}
                                <div className="space-y-2 relative">
                                    <Label>Search Location</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                placeholder="Search for address, city, or landmark..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        searchLocation(searchQuery)
                                                    }
                                                }}
                                                className="pl-9"
                                            />
                                        </div>
                                        <Button
                                            onClick={() => searchLocation(searchQuery)}
                                            disabled={searching || !searchQuery.trim()}
                                            className="flex items-center gap-2"
                                        >
                                            {searching ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Search className="h-4 w-4" />
                                            )}
                                            Search
                                        </Button>
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto z-[9999]">
                                            <div className="sticky top-0 p-3 border-b bg-gray-50">
                                                <div className="text-sm font-medium text-gray-700">
                                                    Found {searchResults.length} location{searchResults.length > 1 ? 's' : ''}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Click on a result to set the location
                                                </div>
                                            </div>

                                            <div className="divide-y">
                                                {searchResults.map((result) => (
                                                    <button
                                                        key={result.place_id}
                                                        onClick={() => handleSelectSearchResult(result)}
                                                        className="w-full text-left p-4 hover:bg-blue-50 transition-colors duration-150"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm text-gray-900 mb-1">
                                                                    {result.name || result.display_name.split(',')[0]}
                                                                </div>
                                                                <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                                                                    {result.display_name}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <span>📍</span>
                                                                        <span>{parseFloat(result.lat).toFixed(6)}, {parseFloat(result.lon).toFixed(6)}</span>
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>{result.type}</span>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="sticky bottom-0 p-3 border-t bg-gray-50">
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>Data from OpenStreetMap</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Search Tips */}
                                    <div className="text-xs text-gray-500 mt-1">
                                        <span className="font-medium">Tip:</span> Search for places like "Kathmandu", "Baneshwor", or specific addresses
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <Label>Set Location on Map</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                // Use current location
                                                if (navigator.geolocation) {
                                                    navigator.geolocation.getCurrentPosition(
                                                        (position) => {
                                                            const lat = position.coords.latitude
                                                            const lng = position.coords.longitude
                                                            handleLeadLocationSelect(lat, lng)
                                                        },
                                                        (error) => {
                                                            toast.error("Unable to get current location")
                                                        }
                                                    )
                                                } else {
                                                    toast.error("Geolocation is not supported by your browser")
                                                }
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <Navigation className="h-4 w-4" />
                                            Use My Location
                                        </Button>
                                    </div>
                                </div>

                                {/* Map Container - Only render on client */}
                                {isMounted && (
                                    <div className="h-[350px] rounded-lg overflow-hidden border relative">
                                        <MapContainer
                                            center={leadMapPosition}
                                            zoom={15}
                                            style={{ height: "100%", width: "100%" }}
                                        >
                                            <MapCenterUpdater center={leadMapPosition} />
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='Simulcast Technologies Pvt Ltd'
                                            />

                                            {/* Click handler for map */}
                                            <MapClickHandler onLocationSelect={handleLeadLocationSelect} />

                                            {/* Draggable marker for selected location */}
                                            {formData.latitude && formData.longitude && (
                                                <LocationMarker
                                                    position={leadMapPosition}
                                                    draggable={true}
                                                    onDragEnd={handleLeadMarkerDragEnd}
                                                    address={formData.fullAddress || formData.address}
                                                    serviceAvailable={leadServiceAvailable}
                                                    nearestSplitter={leadNearestSplitters[0] ? {
                                                        distance: leadNearestSplitters[0].distance,
                                                        name: leadNearestSplitters[0].name
                                                    } : null}
                                                />
                                            )}

                                            {/* Show splitters on map */}
                                            {splitters
                                                .filter(splitter => splitter.location.latitude && splitter.location.longitude)
                                                .map((splitter) => (
                                                    <SplitterMarker key={splitter.id} splitter={splitter} />
                                                ))}

                                            {/* Service area circle */}
                                            {formData.latitude && formData.longitude && (
                                                <Circle
                                                    center={leadMapPosition}
                                                    radius={leadServiceRadius * 1000}
                                                    pathOptions={{
                                                        fillColor: leadServiceAvailable ? 'green' : 'red',
                                                        color: leadServiceAvailable ? 'darkgreen' : 'darkred',
                                                        fillOpacity: 0.2,
                                                        weight: 2
                                                    }}
                                                />
                                            )}
                                        </MapContainer>

                                        <style jsx>{`
                                            :global(.leaflet-control-attribution) {
                                                display: none !important;
                                            }
                                        `}</style>
                                    </div>
                                )}

                                {/* Map Instructions */}
                                <p className="text-sm text-blue-800">
                                    <strong>Instructions:</strong>
                                </p>

                                <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-blue-800">
                                    <li>Search for a location or click on the map to set position</li>
                                    <li>Drag the marker to adjust location</li>
                                    <li>Click "Use My Location" to get your current position</li>
                                    <li>Service availability is shown in real-time as you move the marker</li>
                                </ul>

                            </div>

                            {/* Right Column - Coordinates & Service Info */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="latitude">Latitude</Label>
                                        <Input
                                            id="latitude"
                                            type="number"
                                            step="0.000001"
                                            placeholder="27.7172"
                                            value={formData.latitude}
                                            onChange={(e) => updateFormField("latitude", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="longitude">Longitude</Label>
                                        <Input
                                            id="longitude"
                                            type="number"
                                            step="0.000001"
                                            placeholder="85.3240"
                                            value={formData.longitude}
                                            onChange={(e) => updateFormField("longitude", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="serviceRadius">
                                        Service Radius
                                    </Label>
                                    <div className="space-y-3">
                                        <Slider
                                            value={[leadServiceRadius]}
                                            min={0.05}
                                            max={10}
                                            step={0.05}
                                            onValueChange={(value) => {
                                                const radius = value[0]
                                                setLeadServiceRadius(radius)
                                                updateFormField("serviceRadius", radius.toString())
                                            }}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>50 m</span>
                                            <span>{formatDistance(leadServiceRadius)}</span>
                                            <span>10 km</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Location Info */}
                                <div className="p-3 bg-gray-50 border rounded-lg">
                                    <h4 className="font-medium mb-2">📍 Current Location Info</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Map Coordinates:</span>
                                            <span className="font-mono">
                                                {leadMapPosition[0].toFixed(6)}, {leadMapPosition[1].toFixed(6)}
                                            </span>
                                        </div>

                                        <div>
                                            <div className="text-gray-600 mb-1">Location Address:</div>
                                            {reverseGeocodingLoading ? (
                                                <div className="flex items-center gap-1 text-blue-600 py-1">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    <span>Getting address...</span>
                                                </div>
                                            ) : currentLocationAddress ? (
                                                <div className="text-xs bg-white p-2 rounded border break-words min-h-[40px] max-h-[100px] overflow-y-auto">
                                                    {currentLocationAddress}
                                                </div>
                                            ) : (
                                                <div className="text-gray-400 italic p-2">Not set on map</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Service Availability Badge */}
                                {leadServiceAvailable !== null && (
                                    <div className="mt-4">
                                        {leadServiceAvailable ? (
                                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                                <div>
                                                    <p className="font-medium text-green-800">Service Available</p>
                                                    <p className="text-sm text-green-600">
                                                        Nearest splitter is {formatDistance(leadNearestSplitters[0]?.distance || 0)} away
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                                <div>
                                                    <p className="font-medium text-red-800">Service Not Available</p>
                                                    <p className="text-sm text-red-600">
                                                        No splitters within service range ({formatDistance(leadServiceRadius)})
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Nearest Splitters List */}
                                {leadNearestSplitters.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-medium mb-2">Nearest Splitters (within {formatDistance(leadServiceRadius)})</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {leadNearestSplitters.map((splitter, index) => (
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
                                                            <div className="font-medium">
                                                                {formatDistance(splitter.distance || 0)}
                                                            </div>
                                                            <Badge className={`mt-1 ${splitter.distance <= leadServiceRadius
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {splitter.distance <= leadServiceRadius ? 'Within range' : 'Out of range'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                        <span>Available Ports: {splitter.availablePorts}/{splitter.portCount}</span>
                                                        <span>•</span>
                                                        <span>Type: {splitter.splitterType}</span>
                                                        <span>•</span>
                                                        <span className={`px-2 py-0.5 rounded ${splitter.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {splitter.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {leadNearestSplitters.length === 0 && formData.latitude && formData.longitude && (
                                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                            <div>
                                                <p className="font-medium text-yellow-800">No Splitters Found</p>
                                                <p className="text-sm text-yellow-600">
                                                    No splitters found within {formatDistance(leadServiceRadius)} radius. Service may not be available at this location.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Enter any additional notes about the lead..."
                            value={formData.notes}
                            onChange={(e) => updateFormField("notes", e.target.value)}
                            rows={3}
                        />
                    </div>

                    {(leadId || selectedLead) && (
                        <div className="space-y-4 pt-6 border-t">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Follow-ups</h3>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => openFollowUpDialog()}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Follow-up
                                </Button>
                            </div>

                            {(!Array.isArray(leadFollowUps) || leadFollowUps.length === 0) ? (
                                <div className="text-center py-8 border rounded-lg">
                                    <MessageSquare className="h-12 w-12 mx-auto text-gray-300" />
                                    <p className="text-gray-500 mt-2">No follow-ups yet</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => openFollowUpDialog()}
                                    >
                                        Schedule First Follow-up
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {leadFollowUps.map((followUp) => (
                                        <div key={followUp.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        {getFollowUpTypeIcon(followUp.type)}
                                                        <h4 className="font-medium">{followUp.title}</h4>
                                                        {getFollowUpStatusBadge(followUp.status)}
                                                    </div>
                                                    <p className="text-sm text-gray-600">{followUp.description}</p>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <CalendarDays className="h-3 w-3" />
                                                            <span>{formatDate(followUp.scheduledAt)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            <span>{followUp.assignedUser?.name || "Unknown"}</span>
                                                        </div>
                                                    </div>
                                                    {followUp.notes && (
                                                        <p className="text-sm text-gray-500 italic">"{followUp.notes}"</p>
                                                    )}
                                                    {followUp.outcome && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Outcome: {OUTCOME_OPTIONS.find(o => o.value === followUp.outcome)?.label || followUp.outcome}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openFollowUpDialog(followUp)}
                                                        className="h-8 w-8"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteFollowUp(followUp.id)}
                                                        className="h-8 w-8 text-destructive"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/leads')}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to Leads
                        </Button>
                        <Button
                            variant="outline"
                            onClick={resetForm}
                            disabled={loading}
                        >
                            Reset
                        </Button>
                        <Button
                            onClick={saveLead}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {loading ? "Saving..." : isEditing ? "Update Lead" : "Create Lead"}
                        </Button>
                    </div>
                </div>
            </CardContainer >
        </div >
    )
}