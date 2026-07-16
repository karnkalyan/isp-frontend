"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { 
  Search, 
  Navigation, 
  RefreshCw, 
  MapPin, 
  Loader2, 
  Building2, 
  Cable, 
  SlidersHorizontal,
  Compass
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { openDirectionsFromCurrentLocation } from "@/lib/directions"

import "leaflet/dist/leaflet.css"

// Dynamically import Leaflet components to avoid SSR errors
const MapContainer = dynamic(() => import('@/components/maps/safe-map-container').then(mod => mod.SafeMapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })
const MapEventsHandler = dynamic(() => Promise.resolve(({ onClick }: { onClick: (lat: number, lng: number) => void }) => {
  const { useMapEvents } = require('react-leaflet')
  useMapEvents({
    click(e: any) {
      onClick(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}), { ssr: false })

const MapCenterUpdater = dynamic(() => Promise.resolve(({ center }: { center: [number, number] }) => {
  const { useMap } = require('react-leaflet')
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom())
    }
  }, [center, map])
  return null
}), { ssr: false })

interface Splitter {
  id: number
  name: string
  splitterId: string
  splitRatio: string
  portCount: number
  oltId?: number
  location?: {
    latitude?: number
    longitude?: number
    site?: string
  }
  status?: string
  splitterType?: string
  availablePorts?: number
  olt?: {
    name: string
  }
}

// Haversine formula to calculate distance in meters
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export default function SplittersNearbyPage() {
  const [splitters, setSplitters] = useState<Splitter[]>([])
  const [loading, setLoading] = useState(true)
  
  // Geolocation State (Default to Kathmandu, Nepal coordinates as fallback)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locating, setLocating] = useState(false)
  
  // Filtering & UI State
  const [radius, setRadius] = useState<number>(200) // Default 200m
  const [showAll, setShowAll] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [mapCenter, setMapCenter] = useState<[number, number]>([27.7172, 85.3240])
  const [selectedSplitter, setSelectedSplitter] = useState<Splitter | null>(null)

  // Leaflet custom icons
  const [userIcon, setUserIcon] = useState<any>(null)
  const [splitterIcon, setSplitterIcon] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== "undefined") {
      const L = require("leaflet")

      // Setup default marker shadows
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
        iconUrl: "/leaflet/images/marker-icon.png",
        shadowUrl: "/leaflet/images/marker-shadow.png",
      })

      // Red/Green marker for user location
      setUserIcon(
        new L.Icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
          shadowUrl: "/leaflet/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
      )

      // Blue DivIcon for splitters
      setSplitterIcon(
        new L.DivIcon({
          html: `
            <div class="relative">
              <div class="w-7 h-7 rounded-full bg-primary border-2 border-white shadow-md flex items-center justify-center text-white">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18M3 12h18M12 12l4-4M12 12L8 8" />
                </svg>
              </div>
            </div>
          `,
          className: "custom-splitter-icon",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
      )
    }
  }, [])

  // Get current position
  const getDeviceLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserLocation(coords)
        setMapCenter(coords)
        toast.success("Current location updated!")
        setLocating(false)
      },
      (err) => {
        console.error(err)
        toast.error("Failed to fetch location. Please enable location services.")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // Fetch all splitters
  const fetchSplitters = useCallback(async () => {
    setLoading(true)
    try {
      // Use limit=1000 to get all splitters in single request
      const res = await apiRequest<any>("/splitters?limit=1000")
      const list = Array.isArray(res) ? res : res?.data || res?.splitters || []
      setSplitters(list)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load splitters")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSplitters()
    getDeviceLocation()
  }, [fetchSplitters, getDeviceLocation])

  // Calculate distances & filter splitters
  const splittersWithDistance = useMemo(() => {
    return splitters
      .map((sp) => {
        let distance: number | null = null
        if (userLocation && sp.location?.latitude && sp.location?.longitude) {
          distance = calculateHaversineDistance(
            userLocation[0],
            userLocation[1],
            sp.location.latitude,
            sp.location.longitude
          )
        }
        return { ...sp, distance }
      })
      .filter((sp) => {
        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchesSearch = 
            sp.name.toLowerCase().includes(q) || 
            sp.splitterId.toLowerCase().includes(q) ||
            sp.location?.site?.toLowerCase().includes(q)
          if (!matchesSearch) return false
        }
        
        // Radius Filter
        if (!showAll && sp.distance !== null) {
          return sp.distance <= radius
        }
        
        return true
      })
      .sort((a, b) => {
        // Sort by distance (nearest first) if available, otherwise fallback to ID
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance
        }
        return a.id - b.id
      })
  }, [splitters, userLocation, radius, showAll, searchQuery])

  const formatDistance = (m: number | null) => {
    if (m === null) return "Unknown distance"
    if (m < 1000) return `${m.toFixed(0)} meters`
    return `${(m / 1000).toFixed(2)} km`
  }

  const handleSelectSplitter = (sp: Splitter) => {
    if (sp.location?.latitude && sp.location?.longitude) {
      setMapCenter([sp.location.latitude, sp.location.longitude])
      setSelectedSplitter(sp)
    } else {
      toast.error("Splitter does not have coordinates mapped")
    }
  }

  // Handle map click to manually place user location
  const handleMapClick = (lat: number, lng: number) => {
    setUserLocation([lat, lng])
    toast.success("Search origin set on map click!")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Cable className="h-8 w-8 text-primary animate-pulse" />
              Splitter Locator
            </h1>
            <p className="text-muted-foreground mt-1">Locate and navigate to the nearest fiber splitters from your current location</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchSplitters} disabled={loading} className="shadow-sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh List
            </Button>
            <Button onClick={getDeviceLocation} disabled={locating} className="shadow-sm gap-2">
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
              My Location
            </Button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border rounded-2xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID or site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-950 border-none shadow-inner"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-slate-55 dark:bg-slate-950 p-2 px-4 rounded-xl shadow-inner min-w-[280px] justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <Label className="text-xs font-semibold whitespace-nowrap">Radius: {radius}m</Label>
              </div>
              <Slider
                value={[radius]}
                onValueChange={(val) => setRadius(val[0])}
                min={50}
                max={2000}
                step={50}
                disabled={showAll}
                className="w-36 ml-2"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-55 dark:bg-slate-950/40 p-2.5 px-4 rounded-xl border border-dashed">
              <Label htmlFor="show-all" className="text-xs font-medium cursor-pointer">Show All Splitters</Label>
              <Switch
                id="show-all"
                checked={showAll}
                onCheckedChange={setShowAll}
              />
            </div>
          </div>
        </div>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-270px)] min-h-[500px]">
          {/* List panel */}
          <div className="lg:col-span-4 flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 pb-4">
              <CardTitle className="text-lg font-bold flex justify-between items-center">
                <span>Splitters Nearby</span>
                <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2.5 py-1 rounded-full font-mono font-semibold">
                  {splittersWithDistance.length} found
                </span>
              </CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading splitters...</p>
                </div>
              ) : splittersWithDistance.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm border-2 border-dashed rounded-2xl p-6">
                  <MapPin className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-semibold">No splitters found</p>
                  <p className="text-xs mt-1">Try expanding the search radius or resetting search query</p>
                </div>
              ) : (
                splittersWithDistance.map((sp) => (
                  <div
                    key={sp.id}
                    onClick={() => handleSelectSplitter(sp)}
                    className={`p-4 border rounded-2xl cursor-pointer hover:border-primary/50 transition-all ${
                      selectedSplitter?.id === sp.id
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                        : "border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-850 dark:text-slate-200">{sp.name}</h4>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">ID: {sp.splitterId}</p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        sp.status === "active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" : "bg-rose-50 text-rose-600"
                      }`}>
                        {sp.status || "active"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-primary/60" />
                        <span className="truncate">{sp.olt?.name || "No OLT"}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <span className="font-semibold text-slate-700 dark:text-slate-350">
                          {sp.availablePorts !== undefined ? `${sp.availablePorts}/${sp.portCount}` : `Ratio ${sp.splitRatio}`}
                        </span>
                        <span className="text-[10px]">ports</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/60 pt-3 mt-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{formatDistance(sp.distance)}</span>
                      </div>
                      {sp.location?.latitude && sp.location?.longitude && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDirectionsFromCurrentLocation(`${sp.location!.latitude},${sp.location!.longitude}`)
                          }}
                          className="h-8 rounded-xl text-xs gap-1.5 shadow-sm hover:bg-primary hover:text-white transition-colors"
                        >
                          <Navigation className="h-3 w-3" /> Directions
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Map panel */}
          <div className="lg:col-span-8 h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md relative">
            {isClient ? (
              <div className="w-full h-full">
                <MapContainer
                  center={mapCenter}
                  zoom={16}
                  style={{ width: "100%", height: "100%" }}
                  className="z-0"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* User location pin */}
                  {userLocation && (
                    <>
                      <Marker position={userLocation} icon={userIcon}>
                        <Popup>
                          <div className="p-1">
                            <strong className="text-emerald-600">Your Current Location</strong>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Lat: {userLocation[0].toFixed(5)}, Lng: {userLocation[1].toFixed(5)}</p>
                          </div>
                        </Popup>
                      </Marker>
                      {!showAll && (
                        <Circle
                          center={userLocation}
                          radius={radius}
                          pathOptions={{ fillColor: "#3b82f6", fillOpacity: 0.1, color: "#3b82f6", weight: 1.5 }}
                        />
                      )}
                    </>
                  )}

                  {/* Splitters markers */}
                  {splittersWithDistance.map((sp) => {
                    const lat = sp.location?.latitude
                    const lng = sp.location?.longitude
                    if (!lat || !lng) return null
                    
                    return (
                      <Marker
                        key={sp.id}
                        position={[lat, lng]}
                        icon={splitterIcon}
                      >
                        <Popup>
                          <div className="p-2 min-w-[200px] text-xs">
                            <strong className="text-sm font-bold text-primary block mb-1">{sp.name}</strong>
                            <p className="text-gray-500 font-mono text-[9px] mb-2">ID: {sp.splitterId}</p>
                            <div className="space-y-1 mb-3">
                              <p><strong>OLT:</strong> {sp.olt?.name || "N/A"}</p>
                              <p><strong>Available Ports:</strong> {sp.availablePorts !== undefined ? `${sp.availablePorts}/${sp.portCount}` : `${sp.splitRatio}`}</p>
                              <p><strong>Distance:</strong> {formatDistance(sp.distance)}</p>
                            </div>
                            <Button
                              size="sm"
                              className="w-full gap-1.5 h-8 rounded-lg"
                              onClick={() => openDirectionsFromCurrentLocation(`${lat},${lng}`)}
                            >
                              <Navigation className="h-3 w-3" /> Get Directions
                            </Button>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}

                  <MapCenterUpdater center={mapCenter} />
                  <MapEventsHandler onClick={handleMapClick} />
                </MapContainer>
                
                {/* Manual center marker hint */}
                <div className="absolute bottom-3 left-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] text-muted-foreground z-[1000] shadow-sm select-none">
                  💡 Tip: Click anywhere on the map to set a custom search origin
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-55/50 dark:bg-slate-950/20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading Map components...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
