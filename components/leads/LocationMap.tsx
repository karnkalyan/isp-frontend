"use client"

import React, { useEffect, useState } from "react"
import { MapContainer, TileLayer, Circle, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Navigation } from "lucide-react"
import { toast } from "react-hot-toast"
import { LocationMarker } from "./LocationMarker"
import { SplitterMarker } from "./SplitterMarker"

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
    iconUrl: '/leaflet/images/marker-icon.png',
    shadowUrl: '/leaflet/images/marker-shadow.png',
})

interface LocationMapProps {
    position: [number, number]
    onLocationSelect: (lat: number, lng: number) => void
    onMarkerDragEnd?: (lat: number, lng: number) => void
    showSplitters?: boolean
    splitters?: any[]
    serviceRadius?: number
    nearestSplitters?: any[]
    height?: string
}

export function LocationMap({
    position,
    onLocationSelect,
    onMarkerDragEnd,
    showSplitters = false,
    splitters = [],
    serviceRadius = 0.1,
    nearestSplitters = [],
    height = "350px"
}: LocationMapProps) {
    const [mapPosition, setMapPosition] = useState<[number, number]>(position)

    useEffect(() => {
        if (position[0] && position[1]) {
            setMapPosition(position)
        }
    }, [position])

    const handleUseCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude
                    const lng = pos.coords.longitude
                    onLocationSelect(lat, lng)
                    setMapPosition([lat, lng])
                },
                () => toast.error("Unable to get current location")
            )
        } else {
            toast.error("Geolocation not supported")
        }
    }

    const MapClickHandler = () => {
        useMapEvents({
            click: (e) => {
                onLocationSelect(e.latlng.lat, e.latlng.lng)
            },
        })
        return null
    }

    const MapCenterUpdater = () => {
        const map = useMap()
        useEffect(() => {
            if (mapPosition[0] && mapPosition[1]) {
                map.setView(mapPosition, map.getZoom())
            }
        }, [mapPosition, map])
        return null
    }

    return (
        <div className="space-y-4">
            <div className="h-[350px] rounded-lg overflow-hidden border relative">
                <MapContainer
                    center={mapPosition}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                >
                    <MapCenterUpdater />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='Simulcast Technologies Pvt Ltd'
                    />

                    <MapClickHandler />

                    <LocationMarker
                        position={mapPosition}
                        draggable={!!onMarkerDragEnd}
                        onDragEnd={onMarkerDragEnd}
                    />

                    {showSplitters && splitters.map((splitter) => (
                        <SplitterMarker key={splitter.id} splitter={splitter} />
                    ))}

                    <Circle
                        center={mapPosition}
                        radius={(serviceRadius || 0.1) * 1000}
                        pathOptions={{
                            fillColor: nearestSplitters?.length > 0 ? 'green' : 'red',
                            color: nearestSplitters?.length > 0 ? 'darkgreen' : 'darkred',
                            fillOpacity: 0.2,
                            weight: 2
                        }}
                    />
                </MapContainer>

                <style jsx>{`
          :global(.leaflet-control-attribution) {
            display: none !important;
          }
        `}</style>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>Instructions:</strong> Click on the map to set location, or drag the marker to adjust.
                    {showSplitters && " Service is considered available if a splitter is within the service radius."}
                </p>
            </div>
        </div>
    )
}