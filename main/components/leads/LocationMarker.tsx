"use client"

import { useEffect, useState, useMemo } from "react"
import { Marker, Popup } from "react-leaflet"
import L from "leaflet"

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

interface LocationMarkerProps {
    position: [number, number]
    draggable?: boolean
    onDragEnd?: (lat: number, lng: number) => void
    popupText?: string
}

export function LocationMarker({
    position,
    draggable = true,
    onDragEnd,
    popupText = "Lead Location"
}: LocationMarkerProps) {
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
                <strong>{popupText}</strong><br />
                Latitude: {markerPosition[0].toFixed(6)} <br />
                Longitude: {markerPosition[1].toFixed(6)}
            </Popup>
        </Marker>
    )
}