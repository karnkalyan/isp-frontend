"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

import {
  Save,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Building,
  Package,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Tag,
  FileText,
  UserPlus,
  Check,
  X,
  Navigation,
  Map,
  IdCard,
  Wifi,
  CreditCard,
  Building2,
  Link,
  History,
  Clock,
  CalendarDays,
  MessageSquare,
  PhoneCall,
  Mail as MailIcon,
  Users as UsersIcon,
  CheckSquare,
  Square,
  ChevronRight,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  MapPin as MapPinIcon,
  Navigation as NavigationIcon,
  Phone as PhoneIcon,
  Map as MapIcon,
  User as UserIcon,
  FileUp,
  FileText as FileTextIcon,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  SkipBack,
  SkipForward,
  RefreshCw,
  Target,
  AlertTriangle,
  Settings,
  Radio,
  Ruler,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useConfirmToast } from "@/hooks/use-confirm-toast"
import { apiRequest } from "@/lib/api"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

// Add Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
  iconUrl: '/leaflet/images/marker-icon.png',
  shadowUrl: '/leaflet/images/marker-shadow.png',
})

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: '/leaflet/images/marker-icon.png',
  iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
  shadowUrl: '/leaflet/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

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

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
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

// Follow-up type options
const FOLLOW_UP_TYPE_OPTIONS = [
  { value: "CALL", label: "Phone Call", icon: PhoneCall },
  { value: "EMAIL", label: "Email", icon: MailIcon },
  { value: "MEETING", label: "Meeting", icon: UsersIcon },
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

// Add Splitter interface
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

// Add Map Click Handler Component
const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Add Location Marker Component - Fixed version
const LocationMarker = ({ position, draggable = true, onDragEnd }: {
  position: [number, number],
  draggable?: boolean,
  onDragEnd?: (lat: number, lng: number) => void
}) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position)

  const eventHandlers = useMemo(() => ({
    dragend: (e: any) => {
      const marker = e.target
      const position = marker.getLatLng()
      const newPosition: [number, number] = [position.lat, position.lng]
      setMarkerPosition(newPosition)
      if (onDragEnd) {
        onDragEnd(position.lat, position.lng)
      }
    },
  }), [onDragEnd])

  // Update marker position when prop changes
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
      eventHandlers={eventHandlers}
      icon={customIcon}
    >
      <Popup>
        Latitude: {markerPosition[0].toFixed(6)} <br />
        Longitude: {markerPosition[1].toFixed(6)}
      </Popup>
    </Marker>
  )
}

// Add Map Center Updater Component
const MapCenterUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap()

  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom())
    }
  }, [center, map])

  return null
}

// Add Splitter Marker Component
const SplitterMarker = ({ splitter }: { splitter: Splitter }) => {
  const position: [number, number] = [splitter.location.latitude || 0, splitter.location.longitude || 0]

  if (!splitter.location.latitude || !splitter.location.longitude) {
    return null
  }

  const getSplitterIcon = (isMaster: boolean) => {
    return new L.DivIcon({
      html: `
        <div class="relative">
          <div class="w-6 h-6 rounded-full ${isMaster ? 'bg-purple-500' : 'bg-blue-500'} border-2 border-white shadow-lg flex items-center justify-center">
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
  }

  return (
    <Marker
      position={position}
      icon={getSplitterIcon(splitter.isMaster)}
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

// Helper function to format distance
// Helper function to format distance - ROBUST VERSION
const formatDistance = (distance: any): string => {
  try {
    // Convert to number
    const distNum = Number(distance);

    // Check if it's a valid number
    if (isNaN(distNum) || !isFinite(distNum)) {
      return "N/A";
    }

    if (distNum < 1) {
      // Convert to meters
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

const formatCoordinate = (coord: any): string => {
  if (!coord) return "N/A";
  const num = parseFloat(coord);
  return isNaN(num) ? String(coord) : num.toFixed(6);
};

export function LeadManagement() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("list")
  const [leads, setLeads] = useState<Lead[]>([])
  const [convertedLeads, setConvertedLeads] = useState<Lead[]>([])
  const [qualifiedLeads, setQualifiedLeads] = useState<Lead[]>([])
  const [unqualifiedLeads, setUnqualifiedLeads] = useState<Lead[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [packages, setPackages] = useState<PackagePlan[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [existingISPs, setExistingISPs] = useState<ExistingISP[]>([])
  const [splitters, setSplitters] = useState<Splitter[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null)
  const [leadFollowUps, setLeadFollowUps] = useState<FollowUp[]>([])
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewLead, setViewLead] = useState<Lead | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false)
  const [statusChangeLead, setStatusChangeLead] = useState<Lead | null>(null)
  const [newStatus, setNewStatus] = useState<LeadStatus>('new')

  // Pagination and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [leadsPagination, setLeadsPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [convertedPagination, setConvertedPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [qualifiedPagination, setQualifiedPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [unqualifiedPagination, setUnqualifiedPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false
  })

  const { confirm, ConfirmDialog } = useConfirmToast()

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

  // Conversion form state
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

  // Map state for lead form - Changed default radius to 0.1 (100 meters)
  const [leadMapPosition, setLeadMapPosition] = useState<[number, number]>([27.7172, 85.3240]) // Kathmandu coordinates
  const [leadNearestSplitters, setLeadNearestSplitters] = useState<Splitter[]>([])
  const [leadServiceAvailable, setLeadServiceAvailable] = useState<boolean | null>(null)
  const [leadServiceRadius, setLeadServiceRadius] = useState<number>(0.1) // Default 100 meters (0.1 km)

  // Map state for conversion dialog
  const [convertMapPosition, setConvertMapPosition] = useState<[number, number]>([27.7172, 85.3240])
  const [convertNearestSplitters, setConvertNearestSplitters] = useState<Splitter[]>([])
  const [convertServiceAvailable, setConvertServiceAvailable] = useState<boolean | null>(null)
  const [convertServiceRadius, setConvertServiceRadius] = useState<number>(0.1) // Default 100 meters (0.1 km)

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
    serviceRadius: "0.1" as string | "" // Default 100 meters
  })

  // Prepare options from data using useMemo for performance
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

  // Fetch data on component mount
  useEffect(() => {
    fetchUsers()
    fetchPackages()
    fetchMemberships()
    fetchExistingISPs()
    fetchSplitters()
  }, [])

  // Fetch leads when active tab or filters change
  useEffect(() => {
    if (activeTab === "list") {
      fetchLeads()
    } else if (activeTab === "converted") {
      fetchConvertedLeads()
    } else if (activeTab === "qualified") {
      fetchQualifiedLeads()
    } else if (activeTab === "unqualified") {
      fetchUnqualifiedLeads()
    }
  }, [activeTab, leadsPagination.currentPage, statusFilter, sourceFilter, searchQuery])

  const fetchLeads = async (page?: number) => {
    try {
      setLoading(true)
      const currentPage = page || leadsPagination.currentPage

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: leadsPagination.itemsPerPage.toString()
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

        // Update pagination info
        if (response.pagination) {
          setLeadsPagination(response.pagination)
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

  const fetchQualifiedLeads = async (page?: number) => {
    try {
      setLoading(true)
      const currentPage = page || qualifiedPagination.currentPage

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: qualifiedPagination.itemsPerPage.toString(),
        status: 'qualified'
      })

      if (searchQuery) params.append('search', searchQuery)

      const response = await apiRequest(`/lead?${params.toString()}`)

      let dataArray = []
      if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          dataArray = response.data
        } else if (Array.isArray(response)) {
          dataArray = response
        }

        // Update pagination info
        if (response.pagination) {
          setQualifiedPagination(response.pagination)
        }
      } else if (Array.isArray(response)) {
        dataArray = response
      }

      setQualifiedLeads(dataArray || [])
    } catch (error: any) {
      console.error("Failed to fetch qualified leads:", error)
      toast.error(error.message || "Failed to load qualified leads")
    } finally {
      setLoading(false)
    }
  }

  const fetchUnqualifiedLeads = async (page?: number) => {
    try {
      setLoading(true)
      const currentPage = page || unqualifiedPagination.currentPage

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: unqualifiedPagination.itemsPerPage.toString(),
        status: 'unqualified'
      })

      if (searchQuery) params.append('search', searchQuery)

      const response = await apiRequest(`/lead?${params.toString()}`)

      let dataArray = []
      if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          dataArray = response.data
        } else if (Array.isArray(response)) {
          dataArray = response
        }

        // Update pagination info
        if (response.pagination) {
          setUnqualifiedPagination(response.pagination)
        }
      } else if (Array.isArray(response)) {
        dataArray = response
      }

      setUnqualifiedLeads(dataArray || [])
    } catch (error: any) {
      console.error("Failed to fetch unqualified leads:", error)
      toast.error(error.message || "Failed to load unqualified leads")
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

  const fetchConvertedLeads = async (page?: number) => {
    try {
      setLoading(true)
      const currentPage = page || convertedPagination.currentPage

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: convertedPagination.itemsPerPage.toString()
      })

      if (searchQuery) params.append('search', searchQuery)

      const response = await apiRequest(`/lead/converted?${params.toString()}`)

      let dataArray = []
      if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          dataArray = response.data
        } else if (Array.isArray(response)) {
          dataArray = response
        }

        // Update pagination info
        if (response.pagination) {
          setConvertedPagination(response.pagination)
        }
      } else if (Array.isArray(response)) {
        dataArray = response
      }

      setConvertedLeads(dataArray || [])
    } catch (error: any) {
      console.error("Failed to fetch converted leads:", error)
      toast.error(error.message || "Failed to load converted leads")
    } finally {
      setLoading(false)
    }
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

      const processedISPs = dataArray.map((isp: any) => ({
        ...isp,
        id: String(isp.id)
      }))

      setExistingISPs(processedISPs)
    } catch (error: any) {
      console.error("Failed to fetch existing ISPs:", error)
      toast.error("Failed to load existing ISPs")
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

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in kilometers
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
          distance: Number(distance) // Ensure it's a number
        }
      })
      .filter(splitter => splitter.distance <= maxDistanceKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5) // Get top 5 nearest splitters

    return splittersWithDistance
  }

  // Handle lead form location selection
  const handleLeadLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }))

    setLeadMapPosition([lat, lng])

    // Find nearest splitters using lead service radius
    const radius = leadServiceRadius || 5
    const nearest = findNearestSplitters(lat, lng, radius)
    setLeadNearestSplitters(nearest)

    // Check if service is available (at least one splitter within service radius)
    const serviceAvailable = nearest.some(splitter => splitter.distance <= leadServiceRadius)
    setLeadServiceAvailable(serviceAvailable)

    toast.success(`Location set: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
  }

  // Handle lead marker drag end
  const handleLeadMarkerDragEnd = (lat: number, lng: number) => {
    handleLeadLocationSelect(lat, lng)
  }

  // Handle conversion form location selection
  const handleConvertLocationSelect = (lat: number, lng: number) => {
    setConversionForm(prev => ({
      ...prev,
      lat: lat.toString(),
      lon: lng.toString()
    }))

    setConvertMapPosition([lat, lng])

    // Find nearest splitters using conversion service radius
    const radius = convertServiceRadius || 5
    const nearest = findNearestSplitters(lat, lng, radius)
    setConvertNearestSplitters(nearest)

    // Check if service is available (at least one splitter within service radius)
    const serviceAvailable = nearest.some(splitter => splitter.distance <= convertServiceRadius)
    setConvertServiceAvailable(serviceAvailable)

    toast.success(`Location set: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
  }

  // Handle conversion marker drag end
  const handleConvertMarkerDragEnd = (lat: number, lng: number) => {
    handleConvertLocationSelect(lat, lng)
  }

  // Update lead map when lat/lon changes in form
  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude)
      const lon = parseFloat(formData.longitude)
      if (!isNaN(lat) && !isNaN(lon)) {
        setLeadMapPosition([lat, lon])
        const radius = leadServiceRadius || 5
        const nearest = findNearestSplitters(lat, lon, radius)
        setLeadNearestSplitters(nearest)
        const serviceAvailable = nearest.some(splitter => splitter.distance <= leadServiceRadius)
        setLeadServiceAvailable(serviceAvailable)
      }
    }
  }, [formData.latitude, formData.longitude, leadServiceRadius])

  // Update conversion map when lat/lon changes in form
  useEffect(() => {
    if (conversionForm.lat && conversionForm.lon) {
      const lat = parseFloat(conversionForm.lat)
      const lon = parseFloat(conversionForm.lon)
      if (!isNaN(lat) && !isNaN(lon)) {
        setConvertMapPosition([lat, lon])
        const radius = convertServiceRadius || 5
        const nearest = findNearestSplitters(lat, lon, radius)
        setConvertNearestSplitters(nearest)
        const serviceAvailable = nearest.some(splitter => splitter.distance <= convertServiceRadius)
        setConvertServiceAvailable(serviceAvailable)
      }
    }
  }, [conversionForm.lat, conversionForm.lon, convertServiceRadius])

  const updateFormField = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // If lat/lon fields are updated, update the map
    if (field === 'latitude' || field === 'longitude') {
      const lat = field === 'latitude' ? parseFloat(value) : parseFloat(prev.latitude || '')
      const lon = field === 'longitude' ? parseFloat(value) : parseFloat(prev.longitude || '')
      if (!isNaN(lat) && !isNaN(lon)) {
        setLeadMapPosition([lat, lon])
        const radius = leadServiceRadius || 5
        const nearest = findNearestSplitters(lat, lon, radius)
        setLeadNearestSplitters(nearest)
        const serviceAvailable = nearest.some(splitter => splitter.distance <= leadServiceRadius)
        setLeadServiceAvailable(serviceAvailable)
      }
    }

    // If service radius is updated, recalculate nearest splitters
    if (field === 'serviceRadius' && formData.latitude && formData.longitude) {
      const radius = parseFloat(value) || 0.1 // Default to 100 meters
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

  const updateConversionField = (field: keyof typeof conversionForm, value: any) => {
    setConversionForm(prev => ({
      ...prev,
      [field]: value
    }))

    // If lat/lon fields are updated, update the map
    if (field === 'lat' || field === 'lon') {
      const lat = field === 'lat' ? parseFloat(value) : parseFloat(prev.lat || '')
      const lon = field === 'lon' ? parseFloat(value) : parseFloat(prev.lon || '')
      if (!isNaN(lat) && !isNaN(lon)) {
        setConvertMapPosition([lat, lon])
        const radius = convertServiceRadius || 5
        const nearest = findNearestSplitters(lat, lon, radius)
        setConvertNearestSplitters(nearest)
        const serviceAvailable = nearest.some(splitter => splitter.distance <= convertServiceRadius)
        setConvertServiceAvailable(serviceAvailable)
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

  const validateConversionForm = () => {
    return true
  }

  const saveLead = async () => {
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

      if (editingId) {
        await apiRequest(`/lead/${editingId}`, {
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

      await fetchLeads(1) // Refresh to first page
      resetForm()
      setActiveTab("list")
    } catch (error: any) {
      console.error("Save error:", error)
      toast.error(error.message || "Failed to save lead")
    } finally {
      setLoading(false)
    }
  }

  const editLead = async (lead: Lead) => {
    setEditingId(lead.id)
    setFormData({
      firstName: lead.firstName || "",
      middleName: lead.middleName || "",
      lastName: lead.lastName || "",
      email: lead.email || "",
      phoneNumber: lead.phoneNumber || "",
      secondaryContactNumber: lead.secondaryContactNumber || "",
      source: lead.source || "",
      status: lead.status,
      notes: lead.notes || "",
      memberShipId: lead.memberShipId || "",
      assignedUserId: lead.assignedUserId || "",
      interestedPackageId: lead.interestedPackageId || "",
      address: lead.address || "",
      street: lead.street || "",
      district: lead.district || "",
      province: lead.province || "",
      gender: lead.gender || "",
      age: lead.metadata?.age || undefined,
      fullAddress: lead.metadata?.fullAddress || undefined,
      latitude: lead.metadata?.latitude?.toString() || "",
      longitude: lead.metadata?.longitude?.toString() || "",
      serviceRadius: lead.metadata?.serviceRadius?.toString() || "0.1"
    })

    // Set map position if coordinates exist
    if (lead.metadata?.latitude && lead.metadata?.longitude) {
      setLeadMapPosition([lead.metadata.latitude, lead.metadata.longitude])
      const radius = lead.metadata.serviceRadius || 0.1
      setLeadServiceRadius(radius)
      const nearest = findNearestSplitters(lead.metadata.latitude, lead.metadata.longitude, radius)
      setLeadNearestSplitters(nearest)
      const serviceAvailable = nearest.some(splitter => splitter.distance <= radius)
      setLeadServiceAvailable(serviceAvailable)
    }

    await fetchLeadFollowUps(lead.id)
    setActiveTab("create")
  }

  const viewLeadDetails = (lead: Lead) => {
    setViewLead(lead)
    setShowViewDialog(true)
    // Fetch complete follow-up information when viewing lead details
    fetchLeadFollowUps(lead.id)
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
      await apiRequest(`/lead/${id}`, {
        method: 'DELETE'
      })
      toast.success("Lead deleted successfully")
      fetchLeads(leadsPagination.currentPage)
    } catch (error: any) {
      console.error("Delete error:", error)
      toast.error(error.message || "Failed to delete lead")
    } finally {
      setLoading(false)
    }
  }

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

  const saveFollowUp = async () => {
    if (!selectedLead || !validateFollowUpForm()) return

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

      if (editingId === selectedLead.id) {
        await fetchLeadFollowUps(selectedLead.id)
      }
      await fetchLeads(leadsPagination.currentPage)

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

      if (selectedLead) {
        await fetchLeadFollowUps(selectedLead.id)
        await fetchLeads(leadsPagination.currentPage)
      }
    } catch (error: any) {
      console.error("Delete follow-up error:", error)
      toast.error(error.message || "Failed to delete follow-up")
    } finally {
      setLoading(false)
    }
  }

  const openConvertDialog = (lead: Lead) => {
    setSelectedLead(lead)

    // Use lead's coordinates if available
    const leadLat = lead.metadata?.latitude || ""
    const leadLon = lead.metadata?.longitude || ""

    setConversionForm({
      idNumber: "",
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      lat: leadLat ? leadLat.toString() : "", // Use existing lat if available
      lon: leadLon ? leadLon.toString() : "", // Use existing lon if available
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
    setConvertMapPosition([27.7172, 85.3240]) // Kathmandu coordinates
    setConvertNearestSplitters([])
    setConvertServiceAvailable(null)
    setConvertServiceRadius(0.1) // Default 100 meters

    setShowConvertDialog(true)
  }

  const handleOutboundcalls = async (phoneNumber: string) => {
    const callPayload = {
      destination: phoneNumber,
    };

    if (phoneNumber) {
      await apiRequest(`/yeaster/makeCalls`, {
        method: 'POST',
        body: JSON.stringify(callPayload)
      })
      toast.success("Calling " + phoneNumber)
    } else {
      toast.error("Phone number is not available")
    }
  }

  const convertLeadToCustomer = async () => {
    if (!selectedLead) return

    try {
      setLoading(true)
      const response = await apiRequest(`/lead/${selectedLead.id}/convert`, {
        method: 'POST',
        body: JSON.stringify(conversionForm)
      })

      toast.success(response.message || "Lead converted to customer successfully")
      setShowConvertDialog(false)
      fetchLeads(1) // Refresh to first page
      fetchConvertedLeads(1)
    } catch (error: any) {
      console.error("Conversion error:", error)
      toast.error(error.message || "Failed to convert lead to customer")
    } finally {
      setLoading(false)
    }
  }

  // Function to change lead status
  // Function to change lead status
  const handleChangeLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      setLoading(true);

      // Get the current lead to check if we need to update notes
      const currentLead = leads.find(lead => lead.id === leadId);
      const updatedNotes = currentLead?.notes || "";

      const response = await apiRequest(`/lead/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          notes: updatedNotes // Include updated notes if any
        })
      });

      if (response?.success) {
        toast.success(`Lead status changed to ${newStatus}`);
        // Refresh the appropriate tab based on current view
        if (activeTab === "list") {
          fetchLeads(leadsPagination.currentPage);
        } else if (activeTab === "qualified") {
          fetchQualifiedLeads(qualifiedPagination.currentPage);
        } else if (activeTab === "unqualified") {
          fetchUnqualifiedLeads(unqualifiedPagination.currentPage);
        }
        setShowStatusChangeDialog(false);
      } else {
        toast.success(`Lead status changed to ${newStatus}`);
        fetchLeads(1); // Refresh to first page
      }
    } catch (error: any) {
      console.error("Change status error:", error);
      toast.error(error.message || "Failed to change lead status");
    } finally {
      setLoading(false);
    }
  };

  // Open status change dialog
  const openStatusChangeDialog = (lead: Lead) => {
    setStatusChangeLead(lead)
    setNewStatus(lead.status)
    setShowStatusChangeDialog(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setImportFile(file)
      } else {
        toast.error("Please upload a CSV file")
      }
    }
  }

  const handleBulkImport = async () => {
    if (!importFile) {
      toast.error("Please select a CSV file to import")
      return
    }

    try {
      setIsImporting(true)
      setImportProgress(0)

      const formData = new FormData()
      formData.append('file', importFile)

      // Simulate progress
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return prev
          }
          return prev + 10
        })
      }, 300)

      const response = await apiRequest("/lead/import", {
        method: 'POST',
        body: formData
      })

      clearInterval(interval)
      setImportProgress(100)

      toast.success(`Successfully imported ${response.importedCount || 0} leads`)
      setShowImportDialog(false)
      setImportFile(null)
      fetchLeads(1) // Refresh to first page

      setTimeout(() => setImportProgress(0), 1000)
    } catch (error: any) {
      console.error("Import error:", error)
      toast.error(error.message || "Failed to import leads")
    } finally {
      setIsImporting(false)
    }
  }

  const downloadCSVTemplate = async () => {
    try {
      const response = await apiRequest("/lead/template", {
        method: 'GET',
        responseType: 'blob' // Make sure your apiRequest handles this
      });

      // Check if response is already a blob
      if (response instanceof Blob) {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads_import_template.csv';
        document.body.appendChild(a); // Append to DOM first
        a.click();
        document.body.removeChild(a); // Clean up
        window.URL.revokeObjectURL(url);
      } else {
        // If not a blob, try to create one
        const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads_import_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      console.error("Download template error:", error);
      toast.error("Failed to download template");
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
      serviceRadius: "0.1" // Default 100 meters
    })
    setLeadMapPosition([27.7172, 85.3240])
    setLeadNearestSplitters([])
    setLeadServiceAvailable(null)
    setLeadServiceRadius(0.1) // Default 100 meters
    setEditingId(null)
    setLeadFollowUps([])
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
    setSelectedLead(null)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === "list") {
      setLeadsPagination(prev => ({ ...prev, currentPage: 1 }))
    } else if (activeTab === "converted") {
      setConvertedPagination(prev => ({ ...prev, currentPage: 1 }))
    } else if (activeTab === "qualified") {
      setQualifiedPagination(prev => ({ ...prev, currentPage: 1 }))
    } else if (activeTab === "unqualified") {
      setUnqualifiedPagination(prev => ({ ...prev, currentPage: 1 }))
    }
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setSourceFilter("all")
    if (activeTab === "list") {
      setLeadsPagination(prev => ({ ...prev, currentPage: 1 }))
    } else if (activeTab === "converted") {
      setConvertedPagination(prev => ({ ...prev, currentPage: 1 }))
    } else if (activeTab === "qualified") {
      setQualifiedPagination(prev => ({ ...prev, currentPage: 1 }))
    } else if (activeTab === "unqualified") {
      setUnqualifiedPagination(prev => ({ ...prev, currentPage: 1 }))
    }
  }

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
        icon: Phone,
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

  const getFollowUpTypeBadge = (type: FollowUpType) => {
    const config = FOLLOW_UP_TYPE_OPTIONS.find(t => t.value === type)
    if (!config) return null

    const Icon = config.icon
    return (
      <Badge variant="outline" className="flex items-center gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
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

  const getPackageDisplayName = (pkg: any) => {
    return pkg?.packageName || pkg?.name || "Unknown Package"
  }

  const getLeadFollowUpsArray = (lead: Lead): FollowUp[] => {
    if (!lead.followUps) return []
    return Array.isArray(lead.followUps) ? lead.followUps : []
  }

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

          {startPage > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                className="h-8 w-8"
              >
                1
              </Button>
              {startPage > 2 && <span className="px-2">...</span>}
            </>
          )}

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

          {endPage < pagination.totalPages && (
            <>
              {endPage < pagination.totalPages - 1 && <span className="px-2">...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.totalPages)}
                className="h-8 w-8"
              >
                {pagination.totalPages}
              </Button>
            </>
          )}

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

      {/* Change Lead Status Dialog */}
      {/* Change Lead Status Dialog */}
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
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as LeadStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="unqualified">Unqualified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason field - optional */}
            <div className="space-y-2">
              <Label htmlFor="statusReason">Reason (Optional)</Label>
              <Textarea
                id="statusReason"
                placeholder="Enter reason for status change..."
                rows={3}
                onChange={(e) => {
                  // Update the lead's notes with the reason
                  if (statusChangeLead) {
                    const reasonText = e.target.value.trim();
                    if (reasonText) {
                      const currentNotes = statusChangeLead.notes || '';
                      const newNotes = currentNotes
                        ? `${currentNotes}\n\nStatus changed to ${newStatus}: ${reasonText}`
                        : `${reasonText}`;

                      // Update the form data if we're in edit mode
                      if (editingId === statusChangeLead.id) {
                        setFormData(prev => ({
                          ...prev,
                          notes: newNotes
                        }));
                      }

                      // Update the lead in state
                      setLeads(prev => prev.map(lead =>
                        lead.id === statusChangeLead.id
                          ? { ...lead, notes: newNotes }
                          : lead
                      ));
                    }
                  }
                }}
              />
              <p className="text-xs text-gray-500">
                Reason will be added to the lead's notes
              </p>
            </div>

            <div className="p-3 bg-blue-500/10 text-blue-500 border-blue-500/50 rounded-lg">
              <p className="text-sm">
                Current Status: <span className="font-medium">{statusChangeLead?.status}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusChangeDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleChangeLeadStatus(statusChangeLead?.id!, newStatus)}
              disabled={loading || !statusChangeLead?.id || statusChangeLead?.status === newStatus}
            >
              {loading ? "Changing..." : "Change Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
          <p className="text-muted-foreground">Track, manage, and convert leads to customers</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => { resetForm(); setActiveTab("create") }}>
            Create Lead
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">Active Leads</TabsTrigger>
          <TabsTrigger value="qualified">Qualified</TabsTrigger>
          <TabsTrigger value="unqualified">Unqualified</TabsTrigger>
          <TabsTrigger value="converted">Converted</TabsTrigger>
          {/* <TabsTrigger value="create">{editingId ? "Edit Lead" : "Create Lead"}</TabsTrigger> */}
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <CardContainer title={editingId ? "Edit Lead" : "Create New Lead"} description={editingId ? "Update lead information" : "Enter details for the new lead"}>
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
                    <div className="flex justify-between items-center">
                      <Label>Set Location on Map</Label>
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

                    <div className="h-[350px] rounded-lg overflow-hidden border relative">
                      <MapContainer
                        center={leadMapPosition}
                        zoom={15} // Increased zoom for better precision
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
                            radius={leadServiceRadius * 1000} // Convert km to meters
                            pathOptions={{
                              fillColor: leadServiceAvailable ? 'green' : 'red',
                              color: leadServiceAvailable ? 'darkgreen' : 'darkred',
                              fillOpacity: 0.2,
                              weight: 2
                            }}
                          />
                        )}
                      </MapContainer>

                      {/* Add this CSS to hide the attribution */}
                      <style jsx>{`
    :global(.leaflet-control-attribution) {
      display: none !important;
    }
  `}</style>
                    </div>

                    {/* Map Instructions */}
                    <div className="p-3 bg-blue-500/20 border border-blue-200/10 rounded-lg">
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
                          min={0.05} // 50 meters (0.05 km)
                          max={10} // 10 km
                          step={0.05} // 50 meter steps
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

                    {/* Service Availability Badge */}
                    {leadServiceAvailable !== null && (
                      <div className="mt-4">
                        {leadServiceAvailable ? (
                          <div className="flex items-center gap-2 p-3 bg-green-100/10 border border-green-200 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-800">Service Available</p>
                              <p className="text-sm text-green-600">
                                Nearest splitter is {formatDistance(leadNearestSplitters[0]?.distance || 0)} away
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-red-100/10 border border-red-200 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-red-600/10" />
                            <div>
                              <p className="font-medium text-red-800/10">Service Not Available</p>
                              <p className="text-sm text-red-600/10">
                                No splitters within service range ({formatDistance(leadServiceRadius)})
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nearest Splitters List */}
                    {/* Nearest Splitters List */}
                    {leadNearestSplitters.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Nearest Splitters (within {formatDistance(leadServiceRadius)})</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {leadNearestSplitters.map((splitter, index) => (
                            <div key={splitter.id} className="p-3 border rounded-lg hover:bg-gray-50/10">
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
                                    ? 'bg-green-100/10 text-green-800'
                                    : 'bg-yellow-100/10 text-yellow-800'
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
                                  ? 'bg-green-500/10 text-green-800'
                                  : 'bg-red-500/10 text-red-800'
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

              {editingId && (
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Follow-ups</h3>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const lead = leads.find(l => l.id === editingId)
                        if (lead) {
                          openFollowUpDialog(lead)
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Follow-up
                    </Button>
                  </div>

                  {!Array.isArray(leadFollowUps) || leadFollowUps.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-300" />
                      <p className="text-gray-500 mt-2">No follow-ups yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          const lead = leads.find(l => l.id === editingId)
                          if (lead) {
                            openFollowUpDialog(lead)
                          }
                        }}
                      >
                        Schedule First Follow-up
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leadFollowUps.map((followUp) => (
                        <div key={followUp.id} className="border rounded-lg p-4 hover:bg-gray-100/10">
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
                                onClick={() => {
                                  const lead = leads.find(l => l.id === editingId)
                                  if (lead) {
                                    openFollowUpDialog(lead, followUp)
                                  }
                                }}
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
                  onClick={() => { resetForm(); setActiveTab("list") }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveLead}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : editingId ? "Update Lead" : "Create Lead"}
                </Button>
              </div>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <CardContainer title="Active Leads" description="Manage and convert leads to customers">
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, or phone..."
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

              <div className="flex gap-2">
                <div className="w-40">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {STATUS_OPTIONS.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-40">
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {SOURCE_OPTIONS.map(source => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
              <div className="text-center py-8">Loading leads...</div>
            ) : leads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active leads found. Create your first lead or import from CSV.
              </div>
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
                                  <Phone
                                    className="h-3 w-3 cursor-pointer text-green-600 hover:text-blue-800"
                                    onClick={() => {
                                      if (lead.phoneNumber) {
                                        handleOutboundcalls(lead.phoneNumber)
                                      }
                                    }}
                                  />
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openStatusChangeDialog(lead)}
                                  className="h-6 w-6"
                                  title="Change Status"
                                >
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
                                {/* <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => viewLeadDetails(lead)}
                                  // onClick={() => router.push(`/leads/view/${lead.id}`)}
                                  className="h-8 w-8 hover:bg-blue-100"
                                  title="View Dialog"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button> */}

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  // onClick={() => viewLeadDetails(lead)}
                                  onClick={() => router.push(`/leads/view/${lead.id}`)}
                                  className="h-8 w-8 hover:bg-blue-100"
                                  title="View Page"
                                >
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  // onClick={() => editLead(lead)}
                                  onClick={() => router.push(`/leads/edit/${lead.id}`)}
                                  className="h-8 w-8 hover:bg-green-100"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openFollowUpDialog(lead)}
                                  className="h-8 w-8 hover:bg-purple-100"
                                  title="Add Follow-up"
                                >
                                  <Clock className="h-4 w-4 text-purple-600" />
                                </Button>
                                {lead.status === 'qualified' && !lead.convertedToCustomer && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openConvertDialog(lead)}
                                    className="h-8 w-8 hover:bg-green-100"
                                    title="Convert to Customer"
                                  >
                                    <UserPlus className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteLead(lead.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-red-100"
                                  title="Delete"
                                >
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

                {/* Pagination Controls */}
                <PaginationControls
                  pagination={leadsPagination}
                  onPageChange={(page) => setLeadsPagination(prev => ({ ...prev, currentPage: page }))}
                />
              </>
            )}
          </CardContainer>
        </TabsContent>

        <TabsContent value="qualified" className="space-y-6">
          <CardContainer title="Qualified Leads" description="Leads that are ready for conversion">
            {/* Search Bar */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, or phone..."
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
            </div>

            {loading ? (
              <div className="text-center py-8">Loading qualified leads...</div>
            ) : qualifiedLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No qualified leads found.
              </div>
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
                        <TableHead>Interested Package</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {qualifiedLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div className="font-medium">
                              {lead.firstName} {lead.middleName} {lead.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getGenderDisplay(lead.gender)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {lead.email || "-"}
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <Phone
                                  className="h-3 w-3 cursor-pointer text-green-600 hover:text-blue-800"
                                  onClick={() => {
                                    if (lead.phoneNumber) {
                                      handleOutboundcalls(lead.phoneNumber)
                                    }
                                  }}
                                />
                                {lead.phoneNumber || "-"}
                              </div>
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
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {lead.source?.replace('_', ' ') || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {lead.interestedPackage ? (
                              <div>
                                <div className="font-medium text-sm">{getPackageDisplayName(lead.interestedPackage)}</div>
                                {lead.interestedPackage.price && (
                                  <div className="text-xs text-muted-foreground">
                                    NPR {lead.interestedPackage.price}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => viewLeadDetails(lead)}
                                className="h-8 w-8 hover:bg-blue-100"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openConvertDialog(lead)}
                                className="h-8 w-8 hover:bg-green-100"
                                title="Convert to Customer"
                              >
                                <UserPlus className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openStatusChangeDialog(lead)}
                                className="h-8 w-8 hover:bg-yellow-100"
                                title="Change Status"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                <PaginationControls
                  pagination={qualifiedPagination}
                  onPageChange={(page) => setQualifiedPagination(prev => ({ ...prev, currentPage: page }))}
                />
              </>
            )}
          </CardContainer>
        </TabsContent>

        <TabsContent value="unqualified" className="space-y-6">
          <CardContainer title="Unqualified Leads" description="Leads that are not suitable for conversion">
            {/* Search Bar */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, or phone..."
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
            </div>

            {loading ? (
              <div className="text-center py-8">Loading unqualified leads...</div>
            ) : unqualifiedLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No unqualified leads found.
              </div>
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
                        <TableHead>Reason</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unqualifiedLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div className="font-medium">
                              {lead.firstName} {lead.middleName} {lead.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getGenderDisplay(lead.gender)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {lead.email || "-"}
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {lead.phoneNumber || "-"}
                              </div>
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
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {lead.source?.replace('_', ' ') || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {lead.notes ? (
                                <div className="line-clamp-2">{lead.notes}</div>
                              ) : (
                                "No reason specified"
                              )}
                            </div>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => viewLeadDetails(lead)}
                                className="h-8 w-8 hover:bg-blue-100"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openStatusChangeDialog(lead)}
                                className="h-8 w-8 hover:bg-yellow-100"
                                title="Change Status"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteLead(lead.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-red-100"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                <PaginationControls
                  pagination={unqualifiedPagination}
                  onPageChange={(page) => setUnqualifiedPagination(prev => ({ ...prev, currentPage: page }))}
                />
              </>
            )}
          </CardContainer>
        </TabsContent>

        <TabsContent value="converted" className="space-y-6">
          <CardContainer title="Converted Leads" description="Leads that have been converted to customers">
            {/* Search Bar */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, or phone..."
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
            </div>

            {loading ? (
              <div className="text-center py-8">Loading converted leads...</div>
            ) : convertedLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No converted leads found.
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Converted By</TableHead>
                        <TableHead>Converted At</TableHead>
                        <TableHead>Original Source</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {convertedLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div className="font-medium">
                              {lead.firstName} {lead.middleName} {lead.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {lead.email || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.customers && lead.customers.length > 0 ? (
                              <div className="space-y-1">
                                {lead.customers.map(customer => (
                                  <div key={customer.id} className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {customer.firstName} {customer.lastName}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      Customer #{customer.id}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No customer linked</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {lead.convertedBy ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{lead.convertedBy.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">System</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <History className="inline h-3 w-3 mr-1" />
                              {lead.convertedAt ? formatDate(lead.convertedAt) : "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {lead.source?.replace('_', ' ') || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => viewLeadDetails(lead)}
                              className="h-8 w-8 hover:bg-blue-100"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                <PaginationControls
                  pagination={convertedPagination}
                  onPageChange={(page) => setConvertedPagination(prev => ({ ...prev, currentPage: page }))}
                />
              </>
            )}
          </CardContainer>
        </TabsContent>
      </Tabs>

      {/* View Lead Details Dialog - UPDATED WITH COMPLETE FOLLOW-UP INFORMATION */}
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
              {/* Grid Layout with proper spacing */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Personal & Lead Info */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Personal Information Card */}
                  <div className="bg-card rounded-lg border p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <UserIcon className="h-5 w-5 text-primary" />
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
                              <a href={`mailto:${viewLead.email}`}>
                                <MailIcon className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className="text-sm text-muted-foreground mb-1 block">Primary Phone</Label>
                            <p className="font-medium">{viewLead.phoneNumber || "Not provided"}</p>
                          </div>
                          {viewLead.phoneNumber && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOutboundcalls(viewLead.phoneNumber!)}
                              className="ml-2 text-green-600 hover:text-green-700"
                            >
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
                      <FileTextIcon className="h-5 w-5 text-primary" />
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
                        <p className="font-medium">{viewLead.interestedPackage ? getPackageDisplayName(viewLead.interestedPackage) : "None"}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1 block">Created At</Label>
                        <p className="font-medium">{formatDate(viewLead.createdAt)}</p>
                      </div>
                      {viewLead.convertedToCustomer && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <Label className="text-sm text-muted-foreground mb-1 block">Converted At</Label>
                          <p className="font-medium text-green-700 dark:text-green-400">{formatDate(viewLead.convertedAt || "")}</p>
                          {viewLead.convertedBy && (
                            <p className="text-sm text-green-600 dark:text-green-300">By: {viewLead.convertedBy.name}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Map & Location */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Map Card */}
                  <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                    <div className="p-5 border-b">
                      <div className="flex items-center gap-2">
                        <MapIcon className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Location Information</h3>
                      </div>
                    </div>

                    {viewLead.metadata?.latitude && viewLead.metadata?.longitude ? (
                      <div className="space-y-6 p-5">
                        {/* Map Section */}
                        <div className="space-y-4">
                          <div className="h-[400px] rounded-lg overflow-hidden border relative">
                            <MapContainer
                              center={[
                                parseFloat(viewLead.metadata.latitude.toString()) || 27.7172,
                                parseFloat(viewLead.metadata.longitude.toString()) || 85.3240
                              ] as [number, number]}
                              zoom={15}
                              style={{ height: "100%", width: "100%" }}
                              className="dark:invert-[.85] dark:hue-rotate-180"
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='Simulcast Technologies Pvt Ltd'
                              />

                              {/* Lead Location Marker */}
                              <Marker
                                position={[
                                  parseFloat(viewLead.metadata.latitude.toString()) || 27.7172,
                                  parseFloat(viewLead.metadata.longitude.toString()) || 85.3240
                                ] as [number, number]}
                                icon={customIcon}
                              >
                                <Popup className="dark:bg-gray-900 dark:text-white">
                                  <div className="font-medium text-center">Lead Location</div>
                                  <div className="text-sm mt-1">{viewLead.firstName} {viewLead.lastName}</div>
                                  <div className="text-xs mt-2">
                                    <div>Latitude: {viewLead.metadata.latitude}</div>
                                    <div>Longitude: {viewLead.metadata.longitude}</div>
                                  </div>
                                </Popup>
                              </Marker>

                              {/* Show splitters on map */}
                              {splitters
                                .filter(splitter => splitter.location.latitude && splitter.location.longitude)
                                .map((splitter) => (
                                  <SplitterMarker key={splitter.id} splitter={splitter} />
                                ))}

                              {/* Service area circle */}
                              <Circle
                                center={[
                                  parseFloat(viewLead.metadata.latitude.toString()) || 27.7172,
                                  parseFloat(viewLead.metadata.longitude.toString()) || 85.3240
                                ] as [number, number]}
                                radius={(parseFloat(viewLead.metadata.serviceRadius?.toString() || "0.1") || 0.1) * 1000}
                                pathOptions={{
                                  fillColor: '#3b82f6',
                                  color: '#1d4ed8',
                                  fillOpacity: 0.2,
                                  weight: 2
                                }}
                              />
                            </MapContainer>

                            {/* Hide attribution */}
                            <style jsx>{`
                        :global(.leaflet-control-attribution) {
                          display: none !important;
                        }
                        :global(.leaflet-popup-content-wrapper) {
                          border-radius: 0.5rem;
                        }
                      `}</style>
                          </div>
                        </div>

                        {/* Coordinates & Address Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Coordinates Card */}
                          <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-4 border">
                            <div className="flex items-center gap-2 mb-3">
                              <Navigation className="h-4 w-4 text-primary" />
                              <h4 className="font-medium">Coordinates</h4>
                            </div>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs text-muted-foreground mb-1 block">Latitude</Label>
                                  <div className="font-mono text-sm bg-background dark:bg-gray-900 p-2 rounded border">
                                    {viewLead.metadata.latitude}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground mb-1 block">Longitude</Label>
                                  <div className="font-mono text-sm bg-background dark:bg-gray-900 p-2 rounded border">
                                    {viewLead.metadata.longitude}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Service Radius</Label>
                                <div className="flex items-center gap-2">
                                  <Ruler className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {formatDistance(viewLead.metadata.serviceRadius || 0.1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Address Details Card */}
                          <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-4 border">
                            <div className="flex items-center gap-2 mb-3">
                              <MapPinIcon className="h-4 w-4 text-primary" />
                              <h4 className="font-medium">Address Details</h4>
                            </div>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs text-muted-foreground mb-1 block">Province</Label>
                                  <p className="font-medium text-sm">{viewLead.province || "Not provided"}</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground mb-1 block">District</Label>
                                  <p className="font-medium text-sm">{viewLead.district || "Not provided"}</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground mb-1 block">Street</Label>
                                  <p className="font-medium text-sm">{viewLead.street || "Not provided"}</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground mb-1 block">Address</Label>
                                  <p className="font-medium text-sm">{viewLead.address || "Not provided"}</p>
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Full Address</Label>
                                <p className="text-sm bg-background dark:bg-gray-900 p-2 rounded border">
                                  {viewLead.metadata?.fullAddress || "Not provided"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                          <MapPinIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h4 className="font-medium text-lg mb-2">No Location Data</h4>
                        <p className="text-muted-foreground mb-4">
                          This lead doesn't have location coordinates.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowViewDialog(false);
                            editLead(viewLead);
                          }}
                        >
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          Add Location
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Notes Card */}
                  <div className="bg-card rounded-lg border p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Notes</h3>
                    </div>
                    <div className="bg-muted/30 dark:bg-muted/10 rounded-lg p-4 min-h-[120px]">
                      {viewLead.notes ? (
                        <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                          {viewLead.notes}
                        </p>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                          <p>No notes available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Follow-ups Card (if available) */}
                  <div className="bg-card rounded-lg border p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Follow-up History</h3>
                      </div>
                      <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-500 border-green-500/20">
                        {leadFollowUps.length} total
                      </Badge>
                    </div>
                    {leadFollowUps.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No follow-ups recorded yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => {
                            setShowViewDialog(false)
                            openFollowUpDialog(viewLead)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Schedule First Follow-up
                        </Button>
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
                                  <div className="ml-auto">
                                    {getFollowUpStatusBadge(followUp.status)}
                                  </div>
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
                            <div className="flex justify-between items-center pt-2 border-t">
                              <div className="text-xs text-muted-foreground">
                                Created: {formatDate(followUp.createdAt)}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setShowViewDialog(false)
                                    openFollowUpDialog(viewLead, followUp)
                                  }}
                                  className="h-7"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteFollowUp(followUp.id)}
                                  className="h-7 text-destructive"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
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
              <div className="text-sm text-muted-foreground">
                Lead ID: {viewLead?.id}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  Close
                </Button>
                {viewLead && !viewLead.convertedToCustomer && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => openStatusChangeDialog(viewLead)}
                      className="flex items-center gap-2"
                    >
                      <TrendingUpIcon className="h-4 w-4" />
                      Change Status
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowViewDialog(false);
                        openFollowUpDialog(viewLead);
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Add Follow-up
                    </Button>
                    <Button onClick={() => {
                      setShowViewDialog(false);
                      editLead(viewLead);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Lead
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Leads</DialogTitle>
            <DialogDescription>
              Import multiple leads from a CSV file. Download the template for correct format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {importFile ? importFile.name : "Drag and drop your CSV file here, or click to browse"}
              </p>
              <input
                type="file"
                id="csv-upload"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                  className="mr-2"
                >
                  Browse Files
                </Button>
                <Button
                  variant="ghost"
                  onClick={downloadCSVTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>

            {importFile && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading: {importFile.name}</span>
                  <span>{importFile.size} bytes</span>
                </div>
                {importProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="font-medium text-blue-800 mb-2">CSV Format Requirements:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• File must be in CSV format with UTF-8 encoding</li>
                <li>• First row should contain column headers</li>
                <li>• Required columns: firstName, lastName, phoneNumber</li>
                <li>• Optional columns: email, source, address, district, etc.</li>
                <li>• Membership ID, Assigned User ID, and Package ID should reference existing records</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Maximum 1000 records per import</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false)
                setImportFile(null)
                setImportProgress(0)
              }}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={!importFile || isImporting}
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Importing... {importProgress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Leads
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Customer Dialog - WITHOUT MAP FEATURES */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Convert Lead to Customer</DialogTitle>
            <DialogDescription>
              Convert {selectedLead?.firstName} {selectedLead?.lastName} to a customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  placeholder="Enter ID number"
                  value={conversionForm.idNumber}
                  onChange={(e) => updateConversionField("idNumber", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  placeholder="Enter street address"
                  value={conversionForm.streetAddress}
                  onChange={(e) => updateConversionField("streetAddress", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={conversionForm.city}
                    onChange={(e) => updateConversionField("city", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="Enter state"
                    value={conversionForm.state}
                    onChange={(e) => updateConversionField("state", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    placeholder="Enter ZIP code"
                    value={conversionForm.zipCode}
                    onChange={(e) => updateConversionField("zipCode", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedPkg">Package</Label>
                  <SearchableSelect
                    options={packageOptions}
                    value={conversionForm.assignedPkg}
                    onValueChange={(value) => updateConversionField("assignedPkg", value as string)}
                    placeholder="Select package"
                    emptyMessage="No packages found"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name</Label>
                <Input
                  id="deviceName"
                  placeholder="Enter device name"
                  value={conversionForm.deviceName}
                  onChange={(e) => updateConversionField("deviceName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceMac">Device MAC</Label>
                <Input
                  id="deviceMac"
                  placeholder="Enter MAC address"
                  value={conversionForm.deviceMac}
                  onChange={(e) => updateConversionField("deviceMac", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="membershipId">Membership</Label>
              <SearchableSelect
                options={membershipOptions}
                value={conversionForm.membershipId}
                onValueChange={(value) => updateConversionField("membershipId", value as string)}
                placeholder="Select membership"
                emptyMessage="No memberships found"
                clearable
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="existingISPId">Previous ISP (if any)</Label>
              <SearchableSelect
                options={existingISPOptions}
                value={conversionForm.existingISPId}
                onValueChange={(value) => updateConversionField("existingISPId", value as string)}
                placeholder="Select previous ISP"
                emptyMessage="No previous ISPs found"
                clearable
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rechargeable"
                checked={conversionForm.rechargeable}
                onChange={(e) => updateConversionField("rechargeable", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="rechargeable">Rechargeable Account</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isReferenced"
                checked={conversionForm.isReferenced}
                onChange={(e) => updateConversionField("isReferenced", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isReferenced">Referral Customer</Label>
            </div>

            {/* Location Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.000001"
                  placeholder="27.7172"
                  value={conversionForm.lat}
                  onChange={(e) => updateConversionField("lat", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lon">Longitude</Label>
                <Input
                  id="lon"
                  type="number"
                  step="0.000001"
                  placeholder="85.3240"
                  value={conversionForm.lon}
                  onChange={(e) => updateConversionField("lon", e.target.value)}
                />
              </div>
            </div>

            {/* Note about using lead's existing location */}
            {selectedLead?.metadata?.latitude && selectedLead?.metadata?.longitude && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> This lead already has coordinates set ({formatCoordinate(selectedLead.metadata.latitude)}, {formatCoordinate(selectedLead.metadata.longitude)}).
                  You can enter them above if needed.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConvertDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={convertLeadToCustomer}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Converting..." : "Convert to Customer"}
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
              {editingFollowUp
                ? "Update follow-up information"
                : `Schedule a follow-up with ${selectedLead?.firstName} ${selectedLead?.lastName}`
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
    </div>
  )
}