"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "react-hot-toast"
import {
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Building,
  Package,
  Users,
  Tag,
  FileText,
  CheckCircle,
  PhoneCall,
  MessageSquare,
  Clock,
  Map as MapIcon,
  IdCard,
  Wifi,
  CreditCard,
  Link as LinkIcon,
  History,
  Edit,
  Trash2,
  UserPlus,
  Check,
  XCircle,
  AlertCircle,
  ExternalLink,
  Star,
  Circle,
  Navigation,
  Target,
  Ruler,
  AlertTriangle,
  ChevronRight,
  Plus,
  TrendingUp,
  PhoneIcon,
  UserIcon,
  MailIcon,
  MapPinIcon,
  CalendarDays,
  Globe,
  Home,
  Navigation as NavigationIcon,
  Activity,
  Eye,
  Info,
  Search,
  WifiOff,
  Radio
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import { useConfirmToast } from "@/hooks/use-confirm-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Dynamically import map components
import dynamic from 'next/dynamic'
import "leaflet/dist/leaflet.css"

// Fix z-index for leaflet by forcing it to be lower
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Set leaflet icon defaults
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
    iconUrl: '/leaflet/images/marker-icon.png',
    shadowUrl: '/leaflet/images/marker-shadow.png',
  });
}

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
})
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })

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
  followUps?: any[]
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

interface Splitter {
  id: string
  name: string
  location: {
    latitude: number
    longitude: number
  }
  splitRatio?: string
  availablePorts?: number
  portCount?: number
  distance?: number
  splitterId?: string
  splitterType?: string
  status?: string
}

const STATUS_CONFIG = {
  new: {
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    darkColor: "dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
    icon: AlertCircle,
    label: "New"
  },
  contacted: {
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    darkColor: "dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30",
    icon: Phone,
    label: "Contacted"
  },
  qualified: {
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    darkColor: "dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
    icon: CheckCircle,
    label: "Qualified"
  },
  unqualified: {
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    darkColor: "dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30",
    icon: XCircle,
    label: "Unqualified"
  },
  converted: {
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    darkColor: "dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30",
    icon: CheckCircle,
    label: "Converted"
  },
}

const FOLLOW_UP_TYPE_OPTIONS = [
  { value: "CALL", label: "Phone Call", icon: PhoneCall },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "MEETING", label: "Meeting", icon: Users },
  { value: "VISIT", label: "Site Visit", icon: MapIcon },
  { value: "OTHER", label: "Other", icon: MessageSquare }
]

const FOLLOW_UP_STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Scheduled", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  { value: "MISSED", label: "Missed", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" }
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

// Custom icon for lead location marker
const createLeadLocationIcon = () => {
  if (typeof window === 'undefined') return null;

  return L.divIcon({
    className: 'lead-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      ">
        <svg style="width: 20px; height: 20px; color: white;" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
            50% { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0,0,0,0.4); }
            100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
          }
        </style>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
}

// Splitter Marker Component
const SplitterMarker = ({ splitter }: { splitter: Splitter }) => {
  if (typeof window === 'undefined') return null;

  const isWithinRadius = splitter.distance !== undefined && splitter.distance <= (splitter as any).serviceRadius;
  const statusColor = splitter.status === 'active' ? '#10b981' :
    splitter.status === 'maintenance' ? '#f59e0b' :
      '#ef4444';

  const icon = L.divIcon({
    className: 'splitter-marker',
    html: `
      <div style="
        background: ${statusColor};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        position: relative;
        ${isWithinRadius ? 'animation: float 3s ease-in-out infinite;' : ''}
      ">
        <svg style="width: 14px; height: 14px; color: white;" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
        </svg>
        ${splitter.availablePorts !== undefined && splitter.portCount !== undefined ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #1d4ed8;
            color: white;
            font-size: 10px;
            font-weight: bold;
            min-width: 18px;
            height: 18px;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid white;
          ">
            ${splitter.availablePorts}
          </div>
        ` : ''}
        <style>
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
        </style>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });

  return (
    <Marker
      position={[splitter.location.latitude, splitter.location.longitude] as [number, number]}
      icon={icon}
    >
      <Popup className="dark:bg-gray-900 dark:text-white z-[1000]" maxWidth={300} minWidth={250}>
        <div className="space-y-2">
          <div className="font-bold text-center text-gray-900 dark:text-white">{splitter.name}</div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-semibold">ID:</span>
              <div className="text-gray-700 dark:text-gray-300">{splitter.splitterId || 'N/A'}</div>
            </div>
            <div>
              <span className="font-semibold">Type:</span>
              <div className="text-gray-700 dark:text-gray-300">{splitter.splitterType || 'N/A'}</div>
            </div>
            <div>
              <span className="font-semibold">Ratio:</span>
              <div className="text-gray-700 dark:text-gray-300">{splitter.splitRatio || 'N/A'}</div>
            </div>
            <div>
              <span className="font-semibold">Ports:</span>
              <div className="text-gray-700 dark:text-gray-300">
                {splitter.availablePorts !== undefined && splitter.portCount !== undefined
                  ? `${splitter.availablePorts}/${splitter.portCount}`
                  : 'N/A'}
              </div>
            </div>
          </div>

          {splitter.distance !== undefined && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Distance:</span>
                <span className={`font-bold ${splitter.distance <= (splitter as any).serviceRadius ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatDistance(splitter.distance)}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Service radius: {formatDistance((splitter as any).serviceRadius || 0.1)}
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <span className={`px-2 py-1 rounded text-xs font-medium ${splitter.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
              : splitter.status === 'maintenance'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
              }`}>
              {splitter.status || 'N/A'}
            </span>
            {splitter.distance !== undefined && splitter.distance <= (splitter as any).serviceRadius && (
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded text-xs font-medium">
                Within Range
              </span>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

// Service Area Circle Component
const ServiceAreaCircle = ({ center, radius, serviceAvailable }: {
  center: [number, number],
  radius: number,
  serviceAvailable: boolean
}) => {
  if (radius <= 0) return null;

  return (
    <Circle
      center={center}
      radius={radius * 1000} // Convert km to meters
      pathOptions={{
        fillColor: serviceAvailable ? '#10b981' : '#ef4444',
        color: serviceAvailable ? '#059669' : '#dc2626',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: serviceAvailable ? null : '10, 5',
        opacity: 0.8
      }}
      eventHandlers={{
        mouseover: (e) => {
          const layer = e.target;
          layer.setStyle({
            fillOpacity: 0.25,
            weight: 3
          });
        },
        mouseout: (e) => {
          const layer = e.target;
          layer.setStyle({
            fillOpacity: 0.15,
            weight: 2
          });
        }
      }}
    >
      <Popup>
        <div className="text-sm">
          <div className="font-semibold mb-1">Service Area</div>
          <div>Radius: {formatDistance(radius)}</div>
          <div className={`mt-1 font-medium ${serviceAvailable ? 'text-green-600' : 'text-red-600'}`}>
            Service: {serviceAvailable ? 'Available ✓' : 'Not Available ✗'}
          </div>
        </div>
      </Popup>
    </Circle>
  );
};

// Helper function to format distance
const formatDistance = (distance: any): string => {
  try {
    const distNum = Number(distance);
    if (isNaN(distNum) || !isFinite(distNum)) return "N/A";
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

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest splitters within service radius
const findNearestSplitters = (
  lat: number,
  lng: number,
  splitters: Splitter[],
  maxDistanceKm: number = 5
): Splitter[] => {
  if (!lat || !lng || !Array.isArray(splitters)) return [];

  const splittersWithDistance = splitters
    .filter(splitter =>
      splitter.location?.latitude &&
      splitter.location?.longitude &&
      !isNaN(splitter.location.latitude) &&
      !isNaN(splitter.location.longitude)
    )
    .map(splitter => {
      const distance = calculateDistance(
        lat,
        lng,
        splitter.location.latitude,
        splitter.location.longitude
      );
      return {
        ...splitter,
        distance: Number(distance.toFixed(3)) // Round to 3 decimal places
      };
    })
    .filter(splitter => splitter.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10); // Limit to 10 nearest splitters

  return splittersWithDistance;
}

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return "Invalid date";
  }
}

const getGenderDisplay = (gender?: Gender) => {
  if (!gender) return "Not specified";
  const genderMap = {
    MALE: "Male",
    FEMALE: "Female",
    OTHER: "Other"
  };
  return genderMap[gender] || gender;
}

const getStatusBadge = (status: LeadStatus, converted: boolean = false) => {
  if (converted) {
    return (
      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30 capitalize">
        <Check className="h-3 w-3 mr-1" />
        Converted
      </Badge>
    );
  }

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} ${config.darkColor} capitalize`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

const getFollowUpStatusBadge = (status: FollowUpStatus) => {
  const config = FOLLOW_UP_STATUS_OPTIONS.find(s => s.value === status);
  if (!config) return null;
  return (
    <Badge variant="outline" className={`${config.color} text-xs`}>
      {config.label}
    </Badge>
  );
}

const getFollowUpTypeIcon = (type: FollowUpType) => {
  const config = FOLLOW_UP_TYPE_OPTIONS.find(t => t.value === type);
  if (!config) return <MessageSquare className="h-4 w-4" />;
  const Icon = config.icon;
  return <Icon className="h-4 w-4" />;
}

const getPackageDisplayName = (pkg: any): string => {
  return pkg.packageName || pkg.name || 'Unknown Package';
}

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirmToast();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [leadFollowUps, setLeadFollowUps] = useState<FollowUp[]>([]);
  const [splitters, setSplitters] = useState<Splitter[]>([]);
  const [filteredSplitters, setFilteredSplitters] = useState<Splitter[]>([]);
  const [serviceAvailable, setServiceAvailable] = useState<boolean>(false);
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string | null>(null);
  const [reverseGeocodingLoading, setReverseGeocodingLoading] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [followUpForm, setFollowUpForm] = useState({
    type: "CALL" as FollowUpType,
    title: "",
    description: "",
    scheduledAt: "",
    assignedUserId: "",
    notes: "",
    status: "SCHEDULED" as FollowUpStatus,
    outcome: ""
  });

  const [showConvertDialog, setShowConvertDialog] = useState(false);
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
  });

  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<LeadStatus>('new');
  const [statusReason, setStatusReason] = useState<string>('');

  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<PackagePlan[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [existingISPs, setExistingISPs] = useState<any[]>([]);

  const leadId = params.id as string;

  // Reverse geocode function to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    setReverseGeocodingLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();

      if (data.display_name) {
        setCurrentLocationAddress(data.display_name);
        return data.display_name;
      } else {
        setCurrentLocationAddress("Location details not available");
        return null;
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setCurrentLocationAddress("Unable to get location details");
      return null;
    } finally {
      setReverseGeocodingLoading(false);
    }
  };

  // Calculate service availability and filter splitters
  const calculateServiceAvailability = () => {
    if (!lead?.metadata?.latitude || !lead?.metadata?.longitude) {
      setServiceAvailable(false);
      setFilteredSplitters([]);
      return;
    }

    const lat = parseFloat(lead.metadata.latitude.toString());
    const lng = parseFloat(lead.metadata.longitude.toString());
    const serviceRadius = parseFloat(lead.metadata.serviceRadius?.toString() || "0.1");

    if (isNaN(lat) || isNaN(lng) || isNaN(serviceRadius)) {
      setServiceAvailable(false);
      setFilteredSplitters([]);
      return;
    }

    // Find nearest splitters within service radius
    const nearestSplitters = findNearestSplitters(lat, lng, splitters, serviceRadius);

    // Add service radius to each splitter for display
    const splittersWithServiceRadius = nearestSplitters.map(splitter => ({
      ...splitter,
      serviceRadius
    }));

    setFilteredSplitters(splittersWithServiceRadius);

    // Check if any splitter is within service radius
    const isAvailable = nearestSplitters.length > 0 &&
      nearestSplitters.some(splitter => splitter.distance <= serviceRadius);
    setServiceAvailable(isAvailable);

    // Update lead's metadata with nearest splitters if not already present
    if (lead.metadata?.nearestSplitters?.length === 0 && nearestSplitters.length > 0) {
      setLead(prev => prev ? {
        ...prev,
        metadata: {
          ...prev.metadata,
          nearestSplitters: nearestSplitters.map(s => ({
            id: s.id,
            name: s.name,
            distance: s.distance || 0,
            splitRatio: s.splitRatio || 'N/A',
            availablePorts: s.availablePorts || 0,
            portCount: s.portCount || 0
          }))
        }
      } : null);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails();
      fetchUsers();
      fetchPackages();
      fetchMemberships();
      fetchExistingISPs();
      fetchSplitters();
    }
  }, [leadId]);

  useEffect(() => {
    if (lead?.metadata?.latitude && lead?.metadata?.longitude) {
      calculateServiceAvailability();
      reverseGeocode(
        parseFloat(lead.metadata.latitude.toString()),
        parseFloat(lead.metadata.longitude.toString())
      );
    }
  }, [lead, splitters]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/lead/${leadId}`);

      const processedLead: Lead = {
        ...data,
        id: String(data.id),
        memberShipId: data.memberShipId ? String(data.memberShipId) : "",
        assignedUserId: data.assignedUserId ? String(data.assignedUserId) : "",
        interestedPackageId: data.interestedPackageId ? String(data.interestedPackageId) : "",
        interestedPackage: data.interestedPackage ? {
          ...data.interestedPackage,
          id: String(data.interestedPackage.id),
          name: data.interestedPackage.packageName || data.interestedPackage.name,
          price: data.interestedPackage.price || 0
        } : undefined,
        membership: data.membership ? {
          ...data.membership,
          id: String(data.membership.id)
        } : undefined,
        assignedUser: data.assignedUser ? {
          ...data.assignedUser,
          id: String(data.assignedUser.id)
        } : undefined,
        convertedBy: data.convertedBy ? {
          ...data.convertedBy,
          id: String(data.convertedBy.id)
        } : undefined,
        nextFollowUp: data.nextFollowUp || null,
        followUps: Array.isArray(data.followUps) ? data.followUps : [],
        address: data.address || "",
        street: data.street || "",
        district: data.district || "",
        province: data.province || "",
        gender: data.gender || "",
        secondaryContactNumber: data.secondaryContactNumber || "",
        metadata: data.metadata || {}
      };

      setLead(processedLead);

      // Fetch follow-ups
      if (data.id) {
        const followUpsData = await apiRequest(`/followup/leads/${data.id}/follow-ups`);
        setLeadFollowUps(Array.isArray(followUpsData) ? followUpsData : []);
      }
    } catch (error: any) {
      console.error("Failed to fetch lead details:", error);
      toast.error(error.message || "Failed to load lead details");
      router.push("/leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiRequest("/users");
      setUsers(Array.isArray(data) ? data.map((user: any) => ({
        ...user,
        id: String(user.id),
        role: user.role || undefined
      })) : []);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchPackages = async () => {
    try {
      const data = await apiRequest("/package-price");
      const processedPackages = Array.isArray(data)
        ? data.map((pkg: any) => ({
          id: String(pkg.id || pkg.planId || ''),
          name: pkg.packageName || pkg.name || pkg.planName || 'Unknown Package',
          packageName: pkg.packageName || pkg.name || pkg.planName || 'Unknown Package',
          price: typeof pkg.price === 'number' ? pkg.price : typeof pkg.amount === 'number' ? pkg.amount : 0,
          description: pkg.description || ''
        }))
        : [];
      setPackages(processedPackages);
    } catch (error: any) {
      console.error("Failed to fetch packages:", error);
    }
  };

  const fetchMemberships = async () => {
    try {
      const data = await apiRequest("/membership");
      setMemberships(Array.isArray(data) ? data.map((m: any) => ({
        ...m,
        id: String(m.id)
      })) : []);
    } catch (error: any) {
      console.error("Failed to fetch memberships:", error);
    }
  };

  const fetchExistingISPs = async () => {
    try {
      const response = await apiRequest("/existingisp");
      let dataArray = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          dataArray = response.data;
        } else if (Array.isArray(response)) {
          dataArray = response;
        }
      }
      setExistingISPs(dataArray.map((isp: any) => ({
        ...isp,
        id: String(isp.id)
      })));
    } catch (error: any) {
      console.error("Failed to fetch existing ISPs:", error);
    }
  };

  const fetchSplitters = async () => {
    try {
      const response = await apiRequest("/splitters");
      let dataArray = [];

      if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          dataArray = response.data;
        } else if (Array.isArray(response)) {
          dataArray = response;
        }
      }

      const processedSplitters = dataArray.map((splitter: any) => ({
        ...splitter,
        id: String(splitter.id),
        name: splitter.name || splitter.splitterId || 'Unnamed Splitter',
        splitterId: splitter.splitterId || splitter.id,
        splitRatio: splitter.splitRatio || '1:8',
        splitterType: splitter.splitterType || 'FBT',
        availablePorts: splitter.availablePorts || splitter.portCount || 0,
        portCount: splitter.portCount || 8,
        status: splitter.status || 'active',
        location: {
          latitude: splitter.location?.latitude || 0,
          longitude: splitter.location?.longitude || 0
        }
      }));

      setSplitters(processedSplitters);
    } catch (error: any) {
      console.error("Failed to fetch splitters:", error);
      toast.error("Failed to load splitters");
    }
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: "Delete Lead",
      message: "Are you sure you want to delete this lead? This action cannot be undone.",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel"
    });

    if (!isConfirmed) return;

    try {
      setDeleting(true);
      await apiRequest(`/lead/${leadId}`, { method: 'DELETE' });
      toast.success("Lead deleted successfully");
      router.push("/leads");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete lead");
    } finally {
      setDeleting(false);
    }
  };

  const handleConvert = async () => {
    if (lead?.status !== 'qualified') {
      toast.error("Only qualified leads can be converted to customers");
      return;
    }

    const isConfirmed = await confirm({
      title: "Convert Lead",
      message: "Convert this lead to a customer?",
      type: "info",
      confirmText: "Convert",
      cancelText: "Cancel"
    });

    if (!isConfirmed) return;

    setShowConvertDialog(true);
  };

  const handleConvertConfirm = async () => {
    try {
      setConverting(true);
      await apiRequest(`/lead/${leadId}/convert`, {
        method: 'POST',
        body: JSON.stringify(conversionForm)
      });
      toast.success("Lead converted to customer successfully");
      setShowConvertDialog(false);
      fetchLeadDetails();
    } catch (error: any) {
      console.error("Conversion error:", error);
      toast.error(error.message || "Failed to convert lead");
    } finally {
      setConverting(false);
    }
  };

  const handleOutboundCall = async (phoneNumber: string) => {
    if (!phoneNumber) {
      toast.error("Phone number is not available");
      return;
    }

    try {
      await apiRequest(`/yeaster/makeCalls`, {
        method: 'POST',
        body: JSON.stringify({ destination: phoneNumber })
      });
      toast.success(`Calling ${phoneNumber}`);
    } catch (error: any) {
      console.error("Call error:", error);
      toast.error(error.message || "Failed to initiate call");
    }
  };

  const openFollowUpDialog = (followUp?: FollowUp) => {
    if (!lead) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (followUp) {
      setEditingFollowUp(followUp);
      setFollowUpForm({
        type: followUp.type,
        title: followUp.title,
        description: followUp.description || "",
        scheduledAt: followUp.scheduledAt.split('T')[0],
        assignedUserId: followUp.assignedUserId || "",
        notes: followUp.notes || "",
        status: followUp.status,
        outcome: followUp.outcome || ""
      });
    } else {
      setEditingFollowUp(null);
      setFollowUpForm({
        type: "CALL",
        title: `Follow-up with ${lead.firstName} ${lead.lastName}`,
        description: "",
        scheduledAt: tomorrow.toISOString().split('T')[0],
        assignedUserId: lead.assignedUserId || "",
        notes: "",
        status: "SCHEDULED",
        outcome: ""
      });
    }

    setShowFollowUpDialog(true);
  };

  const saveFollowUp = async () => {
    if (!lead) return;

    if (!followUpForm.title.trim()) {
      toast.error("Follow-up title is required");
      return;
    }
    if (!followUpForm.scheduledAt.trim()) {
      toast.error("Scheduled date is required");
      return;
    }

    try {
      setLoading(true);
      const method = editingFollowUp ? 'PUT' : 'POST';
      const url = editingFollowUp
        ? `/followup/leads/${lead.id}/follow-ups/${editingFollowUp.id}`
        : `/followup/leads/${lead.id}/follow-ups`;

      await apiRequest(url, {
        method,
        body: JSON.stringify(followUpForm)
      });
      toast.success(`Follow-up ${editingFollowUp ? 'updated' : 'created'} successfully`);
      setShowFollowUpDialog(false);
      setEditingFollowUp(null);
      fetchLeadDetails();
    } catch (error: any) {
      console.error("Follow-up save error:", error);
      toast.error(error.message || `Failed to ${editingFollowUp ? 'update' : 'save'} follow-up`);
    } finally {
      setLoading(false);
    }
  };

  const deleteFollowUp = async (followUpId: string) => {
    const isConfirmed = await confirm({
      title: "Delete Follow-up",
      message: "Are you sure you want to delete this follow-up?",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel"
    });

    if (!isConfirmed || !lead) return;

    try {
      await apiRequest(`/followup/leads/${lead.id}/follow-ups/${followUpId}`, {
        method: 'DELETE'
      });
      toast.success("Follow-up deleted successfully");
      fetchLeadDetails();
    } catch (error: any) {
      console.error("Delete follow-up error:", error);
      toast.error(error.message || "Failed to delete follow-up");
    }
  };

  const updateFollowUpField = (field: keyof typeof followUpForm, value: any) => {
    setFollowUpForm(prev => ({ ...prev, [field]: value }));
  };

  const updateConversionField = (field: keyof typeof conversionForm, value: any) => {
    setConversionForm(prev => ({ ...prev, [field]: value }));
  };

  const openStatusChangeDialog = () => {
    if (!lead) return;
    setNewStatus(lead.status);
    setStatusReason('');
    setShowStatusChangeDialog(true);
  };

  const handleStatusChange = async () => {
    if (!lead) return;

    try {
      const updateData: any = { status: newStatus };

      // Add status reason to notes if provided
      if (statusReason.trim()) {
        const timestamp = new Date().toLocaleString();
        const newNote = `Status changed from ${lead.status} to ${newStatus} on ${timestamp}\nReason: ${statusReason}\n\n${lead.notes || ''}`;
        updateData.notes = newNote;

        // Also update the lead's notes locally
        setLead(prev => prev ? { ...prev, notes: newNote } : null);
      }

      await apiRequest(`/lead/${lead.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      toast.success("Status updated successfully");
      setShowStatusChangeDialog(false);

      // Only refetch if we didn't update notes locally
      if (!statusReason.trim()) {
        fetchLeadDetails();
      } else {
        // If we updated notes locally, just update the status
        setLead(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error: any) {
      console.error("Status update error:", error);
      toast.error(error.message || "Failed to update status");
    }
  };

  const editLead = () => {
    if (lead) {
      router.push(`/leads/edit/${lead.id}`);
    }
  };

  const userOptions = users.map(user => ({
    value: user.id,
    label: user.name,
    description: user.role?.name || "No role"
  }));

  const membershipOptions = memberships.map(membership => ({
    value: membership.id,
    label: `${membership.name} (${membership.code})`
  }));

  const packageOptions = packages.map(pkg => ({
    value: pkg.id,
    label: `${pkg.packageName || pkg.name || 'Unknown Package'}${pkg.price ? ` (NPR ${pkg.price})` : ''}`,
    description: pkg.description || ""
  }));

  const existingISPOptions = existingISPs.map(isp => ({
    value: isp.id,
    label: isp.name,
    description: isp.address || ""
  }));

  // Prepare map data
  const leadLat = lead?.metadata?.latitude ? parseFloat(lead.metadata.latitude.toString()) : 27.7172;
  const leadLng = lead?.metadata?.longitude ? parseFloat(lead.metadata.longitude.toString()) : 85.3240;
  const serviceRadius = lead?.metadata?.serviceRadius ? parseFloat(lead.metadata.serviceRadius.toString()) : 0.1;
  const mapCenter: [number, number] = [leadLat, leadLng];

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-950 p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-8 w-64" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-950">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto" />
          <h2 className="mt-4 text-2xl font-semibold text-gray-800 dark:text-gray-200">Lead Not Found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">The lead you're looking for doesn't exist or has been deleted.</p>
          <Button className="mt-6" onClick={() => router.push("/leads")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  const customIcon = createLeadLocationIcon();
  const initials = `${lead.firstName.charAt(0)}${lead.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-">
      {/* Z-index fix for dialogs - must be higher than map */}
      <ConfirmDialog />

      {/* Follow-up Dialog */}
      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 z-[1000]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">{editingFollowUp ? 'Edit' : 'Create'} Follow-up</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {editingFollowUp ? 'Edit' : 'Schedule'} a follow-up with {lead.firstName} {lead.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-700 dark:text-gray-300">Type</Label>
                <Select value={followUpForm.type} onValueChange={(value) => updateFollowUpField("type", value as FollowUpType)}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 z-[1001]">
                    {FOLLOW_UP_TYPE_OPTIONS.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <div className="flex items-center gap-2"><Icon className="h-4 w-4" />{type.label}</div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">Status</Label>
                <Select value={followUpForm.status} onValueChange={(value) => updateFollowUpField("status", value as FollowUpStatus)}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 z-[1001]">
                    {FOLLOW_UP_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder="Enter follow-up title"
                value={followUpForm.title}
                onChange={(e) => updateFollowUpField("title", e.target.value)}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter follow-up description"
                value={followUpForm.description}
                onChange={(e) => updateFollowUpField("description", e.target.value)}
                rows={2}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt" className="text-gray-700 dark:text-gray-300">Scheduled Date & Time <span className="text-red-500">*</span></Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={followUpForm.scheduledAt}
                  onChange={(e) => updateFollowUpField("scheduledAt", e.target.value)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedUserId" className="text-gray-700 dark:text-gray-300">Assigned To</Label>
                <SearchableSelect
                  options={userOptions}
                  value={followUpForm.assignedUserId}
                  onValueChange={(value) => updateFollowUpField("assignedUserId", value as string)}
                  placeholder="Select user"
                  emptyMessage="No users found"
                  className="bg-white dark:bg-gray-800 z-[1001]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcome" className="text-gray-700 dark:text-gray-300">Outcome</Label>
              <Select value={followUpForm.outcome} onValueChange={(value) => updateFollowUpField("outcome", value)}>
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                  <SelectValue placeholder="Select outcome (if completed)" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 z-[1001]">
                  {OUTCOME_OPTIONS.map((outcome) => (
                    <SelectItem key={outcome.value} value={outcome.value} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      {outcome.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional notes..."
                value={followUpForm.notes}
                onChange={(e) => updateFollowUpField("notes", e.target.value)}
                rows={3}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFollowUpDialog(false);
                setEditingFollowUp(null);
              }}
              disabled={loading}
              className="border-gray-300 dark:border-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={saveFollowUp} disabled={loading}>
              {loading ? "Saving..." : editingFollowUp ? "Update Follow-up" : "Create Follow-up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusChangeDialog} onOpenChange={setShowStatusChangeDialog}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 z-[1000]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Change Lead Status</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Update the status for {lead.firstName} {lead.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">New Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as LeadStatus)}>
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 z-[1001]">
                  <SelectItem value="new" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      New
                    </div>
                  </SelectItem>
                  <SelectItem value="contacted" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-yellow-500" />
                      Contacted
                    </div>
                  </SelectItem>
                  <SelectItem value="qualified" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                      Qualified
                    </div>
                  </SelectItem>
                  <SelectItem value="unqualified" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Unqualified
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reason" className="text-gray-700 dark:text-gray-300">
                  Reason for Change (Optional)
                </Label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Will be added to notes
                </span>
              </div>
              <Textarea
                id="reason"
                placeholder="Enter reason for status change"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={3}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusChangeDialog(false)} className="border-gray-300 dark:border-gray-700">
              Cancel
            </Button>
            <Button onClick={handleStatusChange}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-[1000]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Convert Lead to Customer</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Convert {lead.firstName} {lead.lastName} to a customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idNumber" className="text-gray-700 dark:text-gray-300">ID Number</Label>
                <Input
                  id="idNumber"
                  placeholder="Enter ID number"
                  value={conversionForm.idNumber}
                  onChange={(e) => updateConversionField("idNumber", e.target.value)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="streetAddress" className="text-gray-700 dark:text-gray-300">Street Address</Label>
                <Input
                  id="streetAddress"
                  placeholder="Enter street address"
                  value={conversionForm.streetAddress}
                  onChange={(e) => updateConversionField("streetAddress", e.target.value)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)} disabled={converting} className="border-gray-300 dark:border-gray-700">
              Cancel
            </Button>
            <Button onClick={handleConvertConfirm} disabled={converting} className="bg-green-600 hover:bg-green-700 text-white">
              {converting ? "Converting..." : "Convert to Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="container mx-auto max-w-9xl p-4 sm:p-6 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/leads")}
                className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Leads
              </Button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* <div className="absolute -bottom-1 -right-1">
                    {getStatusBadge(lead.status, lead.convertedToCustomer)}
                  </div> */}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {lead.firstName} {lead.middleName} {lead.lastName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Lead ID: {lead.id}
                    </p>
                    <span className="text-gray-400 dark:text-gray-600">•</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Created: {formatDate(lead.createdAt)}  {getStatusBadge(lead.status, lead.convertedToCustomer)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={editLead}
                className="gap-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              {!lead.convertedToCustomer && lead.status === 'qualified' && (
                <Button
                  size="sm"
                  onClick={handleConvert}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <UserPlus className="h-4 w-4" />
                  Convert
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>

          {/* Gradient Decorative Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-6"></div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Personal Info Card */}
            <Card className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full translate-x-16 translate-y-16"></div>
              <CardHeader className="relative z-10 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                  <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 pt-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      First Name
                    </Label>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {lead.firstName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Name
                    </Label>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {lead.lastName}
                    </p>
                  </div>
                </div>
                {lead.middleName && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Middle Name
                    </Label>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {lead.middleName}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Gender
                    </Label>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {getGenderDisplay(lead.gender)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Age
                    </Label>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {lead.metadata?.age || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Membership
                  </Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {lead.membership ? `${lead.membership.name} (${lead.membership.code})` : "None"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info Card */}
            <Card className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full translate-x-16 translate-y-16"></div>
              <CardHeader className="relative z-10 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                  <PhoneIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 pt-2 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </Label>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                        {lead.email || "Not provided"}
                      </p>
                      {lead.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <a href={`mailto:${lead.email}`}>
                            <MailIcon className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Primary Phone
                    </Label>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {lead.phoneNumber || "Not provided"}
                      </p>
                      {lead.phoneNumber && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOutboundCall(lead.phoneNumber!)}
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {lead.secondaryContactNumber && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Secondary Phone
                      </Label>
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {lead.secondaryContactNumber}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source
                  </Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm capitalize">
                    {lead.source?.replace('_', ' ') || "Not specified"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Lead Details Card */}
            <Card className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-pink-500/10 to-transparent rounded-full translate-x-16 translate-y-16"></div>
              <CardHeader className="relative z-10 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Lead Details
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 pt-2 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </Label>
                  <div className="mt-1">{getStatusBadge(lead.status, lead.convertedToCustomer)}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Assigned To
                  </Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {lead.assignedUser?.name || "Unassigned"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Interested Package
                  </Label>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {lead.interestedPackage ? getPackageDisplayName(lead.interestedPackage) : "None"}
                    {lead.interestedPackage?.price && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        (NPR {lead.interestedPackage.price})
                      </span>
                    )}
                  </p>
                </div>
                {lead.convertedToCustomer && (
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <Label className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">
                      Converted to Customer
                    </Label>
                    <p className="font-medium text-green-800 dark:text-green-400 text-sm mt-1">
                      {formatDate(lead.convertedAt || "")}
                    </p>
                    {lead.convertedBy && (
                      <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                        By: {lead.convertedBy.name}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Availability Card */}
            {lead.metadata?.latitude && lead.metadata?.longitude && (
              <Card className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-x-16 -translate-y-16"></div>
                <CardHeader className="relative z-10 pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                    <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Service Availability
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 pt-2 space-y-4">
                  <div className={`p-4 rounded-lg border ${serviceAvailable ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${serviceAvailable ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                        {serviceAvailable ? (
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <WifiOff className="h-6 w-6 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className={`font-bold ${serviceAvailable ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          {serviceAvailable ? 'Service Available' : 'Service Not Available'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Within {formatDistance(serviceRadius)} radius
                        </p>
                      </div>
                    </div>
                  </div>

                  {lead.metadata?.nearestSplitters && lead.metadata.nearestSplitters.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Nearest Splitters ({lead.metadata.nearestSplitters.length})
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          Radius: {formatDistance(serviceRadius)}
                        </Badge>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {lead.metadata.nearestSplitters.slice(0, 3).map((splitter, index) => (
                          <div key={splitter.id} className={`p-3 rounded-lg border ${splitter.distance <= serviceRadius ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                  {splitter.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Ratio: {splitter.splitRatio} • Ports: {splitter.availablePorts}/{splitter.portCount}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold ${splitter.distance <= serviceRadius ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {formatDistance(splitter.distance)}
                                </div>
                                <Badge className={`mt-1 text-xs ${splitter.distance <= serviceRadius ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>
                                  {splitter.distance <= serviceRadius ? 'In range' : 'Out of range'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs for Map/Notes/Follow-ups */}
            <Tabs defaultValue="location" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <TabsTrigger
                  value="location"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900 rounded-md"
                >
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  Location
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900 rounded-md"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Notes
                </TabsTrigger>
                <TabsTrigger
                  value="followups"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900 rounded-md"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Follow-ups ({leadFollowUps.length})
                </TabsTrigger>
              </TabsList>

              {/* Location Tab */}
              <TabsContent value="location" className="mt-4">
                <Card className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-sm overflow-hidden">
                  <CardContent className="p-6">
                    {lead.metadata?.latitude && lead.metadata?.longitude ? (
                      <div className="space-y-6">
                        {/* Map Section */}
                        <div className="space-y-4">
                          <div className="h-[400px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 relative z-0">
                            <MapContainer
                              center={mapCenter}
                              zoom={15}
                              style={{ height: "100%", width: "100%" }}
                              className="leaflet-container z-0"
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='Simulcast Technologies Pvt Ltd'
                              />

                              {/* Lead Location Marker */}
                              {customIcon && (
                                <Marker
                                  position={mapCenter}
                                  icon={customIcon}
                                >
                                  <Popup className="dark:bg-gray-900 dark:text-white z-[100]">
                                    <div className="space-y-2">
                                      <div className="font-bold text-center text-gray-900 dark:text-white">
                                        Lead Location
                                      </div>
                                      <div className="text-sm">
                                        <div><strong>Name:</strong> {lead.firstName} {lead.lastName}</div>
                                        <div><strong>Coordinates:</strong></div>
                                        <div>Latitude: {leadLat.toFixed(6)}</div>
                                        <div>Longitude: {leadLng.toFixed(6)}</div>
                                        <div className="mt-2">
                                          <strong>Service Radius:</strong> {formatDistance(serviceRadius)}
                                        </div>
                                        <div className={`mt-1 font-bold ${serviceAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                          {serviceAvailable ? '✓ Service Available' : '✗ Service Not Available'}
                                        </div>
                                      </div>
                                    </div>
                                  </Popup>
                                </Marker>
                              )}

                              {/* Service Area Circle */}
                              <ServiceAreaCircle
                                center={mapCenter}
                                radius={serviceRadius}
                                serviceAvailable={serviceAvailable}
                              />

                              {/* Show splitters within radius on map */}
                              {filteredSplitters.map((splitter) => (
                                <SplitterMarker key={splitter.id} splitter={splitter} />
                              ))}
                            </MapContainer>
                          </div>
                        </div>

                        {/* Coordinates & Address Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Coordinates Card */}
                          <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <CardContent className="pt-5">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                  <NavigationIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Current Location Info</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Real-time location details</p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                {/* Map Coordinates */}
                                <div>
                                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Map Coordinates</Label>
                                  <div className="flex flex-col space-y-2">
                                    <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                                      <span className="text-gray-600 dark:text-gray-400 text-sm">Latitude:</span>
                                      <span className="font-mono text-gray-900 dark:text-gray-100 text-sm font-medium">
                                        {leadLat.toFixed(6)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                                      <span className="text-gray-600 dark:text-gray-400 text-sm">Longitude:</span>
                                      <span className="font-mono text-gray-900 dark:text-gray-100 text-sm font-medium">
                                        {leadLng.toFixed(6)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                                      <span className="text-gray-600 dark:text-gray-400 text-sm">Service Radius:</span>
                                      <span className="font-mono text-gray-900 dark:text-gray-100 text-sm font-medium">
                                        {formatDistance(serviceRadius)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Location Address - Fetched via reverse geocoding */}
                                <div>
                                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Location Address</Label>
                                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 min-h-[100px]">
                                    {reverseGeocodingLoading ? (
                                      <div className="flex items-center justify-center py-6">
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span className="text-sm">Fetching address from coordinates...</span>
                                        </div>
                                      </div>
                                    ) : currentLocationAddress ? (
                                      <div className="space-y-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                          {currentLocationAddress}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                                          <MapPin className="h-3 w-3" />
                                          <span>Reverse geocoded from coordinates</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 italic">
                                        Unable to fetch address from coordinates
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Service Availability Card */}
                          <Card className="bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-green-900/20 border border-gray-200 dark:border-gray-800">
                            <CardContent className="pt-5">
                              <div className="flex items-center gap-2 mb-4">
                                <div className={`p-2 rounded-lg ${serviceAvailable ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                  {serviceAvailable ? (
                                    <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Service Status</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Network coverage information</p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className={`p-4 rounded-lg border ${serviceAvailable ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-full ${serviceAvailable ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                                        {serviceAvailable ? (
                                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        )}
                                      </div>
                                      <div>
                                        <p className={`font-bold ${serviceAvailable ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                          {serviceAvailable ? 'Service Available' : 'Service Not Available'}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          Within {formatDistance(serviceRadius)} radius
                                        </p>
                                      </div>
                                    </div>
                                    <Badge className={serviceAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}>
                                      {serviceAvailable ? 'Available' : 'Not Available'}
                                    </Badge>
                                  </div>
                                </div>

                                {filteredSplitters.length > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between mb-3">
                                      <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Nearest Splitters ({filteredSplitters.length})
                                      </Label>
                                      <Badge variant="outline" className="text-xs">
                                        Showing within {formatDistance(serviceRadius)}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {filteredSplitters.slice(0, 5).map((splitter) => (
                                        <div key={splitter.id} className={`p-3 rounded-lg border ${splitter.distance && splitter.distance <= serviceRadius ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                {splitter.name}
                                              </div>
                                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {splitter.splitRatio} • {splitter.splitterType} • Ports: {splitter.availablePorts}/{splitter.portCount}
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <div className={`font-bold ${splitter.distance && splitter.distance <= serviceRadius ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {splitter.distance ? formatDistance(splitter.distance) : 'N/A'}
                                              </div>
                                              <Badge className={`mt-1 text-xs ${splitter.distance && splitter.distance <= serviceRadius ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>
                                                {splitter.distance && splitter.distance <= serviceRadius ? 'In range' : 'Out of range'}
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {filteredSplitters.length === 0 && (
                                  <div className="text-center py-4">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-2">
                                      <Search className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                      No splitters found within {formatDistance(serviceRadius)} radius
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 mb-4">
                          <MapPinIcon className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-2">No Location Data</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                          This lead doesn't have location coordinates. Add location information to enable mapping and distance calculations.
                        </p>
                        <Button
                          variant="outline"
                          onClick={editLead}
                          className="gap-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <MapPinIcon className="h-4 w-4" />
                          Add Location Information
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="mt-4">
                <Card className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-sm overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Lead Notes
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Additional information and comments about this lead
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/10 rounded-xl p-6 min-h-[200px] border border-gray-200 dark:border-gray-800">
                      {lead.notes ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {lead.notes}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 mb-4">
                            <MessageSquare className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">No Notes Available</h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
                            There are no notes recorded for this lead yet.
                          </p>
                          <Button
                            variant="outline"
                            onClick={editLead}
                            className="gap-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Edit className="h-4 w-4" />
                            Add Notes
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Follow-ups Tab */}
              <TabsContent value="followups" className="mt-4">
                <Card className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-sm overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                          <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          Follow-up History
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          All scheduled and completed follow-ups for this lead
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => openFollowUpDialog()}
                        size="sm"
                        className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Plus className="h-4 w-4" />
                        New Follow-up
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {leadFollowUps.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-purple-100 dark:from-gray-800 dark:to-purple-900/20 mb-4">
                          <Clock className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-2">No Follow-ups Yet</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                          Schedule your first follow-up to track interactions with this lead.
                        </p>
                        <Button
                          onClick={() => openFollowUpDialog()}
                          className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Plus className="h-4 w-4" />
                          Schedule First Follow-up
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {leadFollowUps.map((followUp) => (
                          <div
                            key={followUp.id}
                            className="group border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-900/50 dark:hover:to-blue-900/10 transition-all duration-200"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                                    {getFollowUpTypeIcon(followUp.type)}
                                  </div>
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base truncate">
                                    {followUp.title}
                                  </h4>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  <div className="flex items-center gap-1.5">
                                    <div className="p-1 rounded bg-gray-100 dark:bg-gray-800">
                                      <CalendarDays className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      {formatDate(followUp.scheduledAt)}
                                    </span>
                                  </div>
                                  {followUp.completedAt && (
                                    <div className="flex items-center gap-1.5">
                                      <div className="p-1 rounded bg-green-100 dark:bg-green-900/30">
                                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                      </div>
                                      <span className="text-green-700 dark:text-green-300">
                                        Completed: {formatDate(followUp.completedAt)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {followUp.assignedUser && (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <div className="p-1 rounded bg-gray-100 dark:bg-gray-800">
                                      <User className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Assigned to: <span className="font-medium text-gray-700 dark:text-gray-300">{followUp.assignedUser.name}</span>
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0">
                                  {getFollowUpStatusBadge(followUp.status)}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openFollowUpDialog(followUp)}
                                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    title="Edit"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteFollowUp(followUp.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {followUp.description && (
                              <div className="mb-3">
                                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Description</Label>
                                <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {followUp.description}
                                  </p>
                                </div>
                              </div>
                            )}

                            {followUp.notes && (
                              <div className="mb-3">
                                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Internal Notes</Label>
                                <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                    {followUp.notes}
                                  </p>
                                </div>
                              </div>
                            )}

                            {followUp.outcome && (
                              <div className="mb-3">
                                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Outcome</Label>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300"
                                  >
                                    {OUTCOME_OPTIONS.find(o => o.value === followUp.outcome)?.label || followUp.outcome}
                                  </Badge>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Created: {formatDate(followUp.createdAt)}
                              </div>
                              {followUp.outcome && (
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Outcome recorded
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Actions Card */}
            <Card className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => openFollowUpDialog()}
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium text-sm">Add Follow-up</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={openStatusChangeDialog}
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-medium text-sm">Change Status</span>
                  </Button>

                  {lead.phoneNumber && (
                    <Button
                      variant="outline"
                      onClick={() => handleOutboundCall(lead.phoneNumber!)}
                      className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-gray-300 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-medium text-sm">Call Lead</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={editLead}
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Edit className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="font-medium text-sm">Edit Details</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Global styles for z-index fixes */}
      <style jsx global>{`
        /* Fix leaflet z-index to be behind dialogs */
        .leaflet-container {
          z-index: 0 !important;
          position: relative !important;
        }
        
        .leaflet-pane {
          z-index: 0 !important;
        }
        
        .leaflet-top,
        .leaflet-bottom {
          z-index: 0 !important;
        }
        
        .leaflet-control {
          z-index: 0 !important;
        }
        
        .leaflet-popup {
          z-index: 100 !important;
        }
        
        .leaflet-popup-content-wrapper {
          z-index: 101 !important;
          position: relative !important;
        }
        
        /* Ensure dialogs are on top */
        [role="dialog"] {
          z-index: 1000 !important;
        }
        
        /* Fix for select dropdowns */
        .relative[data-radix-popper-content-wrapper] {
          z-index: 1001 !important;
        }
        
        /* Dark mode map fixes */
        .dark .leaflet-layer,
        .dark .leaflet-control-zoom-in,
        .dark .leaflet-control-zoom-out,
        .dark .leaflet-control-attribution {
          filter: invert(0.85) hue-rotate(180deg) brightness(0.9) !important;
        }
        
        .dark .leaflet-tile {
          filter: brightness(0.6) contrast(3) !important;
        }
        
        /* Remove leaflet attribution */
        .leaflet-control-attribution {
          display: none !important;
        }
        
        /* Popup styling */
        .leaflet-popup-content-wrapper {
          border-radius: 0.75rem !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .dark .leaflet-popup-content-wrapper {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
        }
        
        .leaflet-popup-content {
          margin: 1rem !important;
        }
        
        .leaflet-container {
          font-family: inherit !important;
        }
      `}</style>
    </div>
  );
}