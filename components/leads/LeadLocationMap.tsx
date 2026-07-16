"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

type MapSplitter = {
  id: string | number
  name: string
  isMaster?: boolean
  location: { latitude?: number | null; longitude?: number | null }
}

type LeadLocationMapProps = {
  center: [number, number]
  showLocation: boolean
  address?: string
  serviceAvailable: boolean | null
  serviceRadius: number
  nearestSplitter?: { distance: number; name: string } | null
  splitters: MapSplitter[]
  onLocationSelect: (lat: number, lng: number) => void
  onMarkerDragEnd: (lat: number, lng: number) => void
}

const selectedIcon = L.icon({
  iconUrl: "/leaflet/images/marker-icon.png",
  iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
  shadowUrl: "/leaflet/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;")

export default function LeadLocationMap({ center, showLocation, address, serviceAvailable, serviceRadius, nearestSplitter, splitters, onLocationSelect, onMarkerDragEnd }: LeadLocationMapProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const overlaysRef = useRef<L.LayerGroup | null>(null)
  const locationHandlerRef = useRef(onLocationSelect)
  const dragHandlerRef = useRef(onMarkerDragEnd)

  locationHandlerRef.current = onLocationSelect
  dragHandlerRef.current = onMarkerDragEnd

  useEffect(() => {
    const host = hostRef.current
    if (!host || mapRef.current) return

    // Give every effect mount a brand-new DOM element. React development mode
    // may reuse the host node, but Leaflet will never receive a reused node.
    const container = document.createElement("div")
    container.className = "h-full w-full"
    host.replaceChildren(container)

    const map = L.map(container, { zoomControl: true }).setView(center, 15)
    const overlays = L.layerGroup().addTo(map)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map)

    map.on("click", event => locationHandlerRef.current(event.latlng.lat, event.latlng.lng))
    mapRef.current = map
    overlaysRef.current = overlays

    // Leaflet calculates against the final dialog/card size after mounting.
    window.setTimeout(() => map.invalidateSize(false), 0)

    return () => {
      overlays.clearLayers()
      map.off()
      map.remove()
      mapRef.current = null
      overlaysRef.current = null
      container.remove()
    }
    // The map instance must be owned by exactly one mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const overlays = overlaysRef.current
    if (!map || !overlays) return

    map.setView(center, map.getZoom() || 15, { animate: false })
    overlays.clearLayers()

    if (showLocation) {
      const marker = L.marker(center, { draggable: true, icon: selectedIcon }).addTo(overlays)
      marker.on("dragend", event => {
        const position = event.target.getLatLng()
        dragHandlerRef.current(position.lat, position.lng)
      })
      marker.bindPopup([
        '<div class="min-w-52 space-y-1 text-xs">',
        "<strong>Selected location</strong>",
        `<p>${center[0].toFixed(6)}, ${center[1].toFixed(6)}</p>`,
        address ? `<p>${escapeHtml(address)}</p>` : "",
        `<p>Service: ${serviceAvailable === null ? "Checking" : serviceAvailable ? "Available" : "Unavailable"}</p>`,
        nearestSplitter ? `<p>Nearest splitter: ${escapeHtml(nearestSplitter.name)} (${Math.round(nearestSplitter.distance)} m)</p>` : "",
        "</div>",
      ].join(""))

      L.circle(center, {
        radius: serviceRadius * 1000,
        fillColor: serviceAvailable ? "#64c98a" : "#e87474",
        color: serviceAvailable ? "#3da969" : "#c95252",
        fillOpacity: 0.14,
        weight: 2,
      }).addTo(overlays)
    }

    splitters.filter(splitter => splitter.location.latitude && splitter.location.longitude).forEach(splitter => {
      const icon = L.divIcon({
        className: "lead-splitter-marker",
        html: `<span style="display:flex;width:22px;height:22px;align-items:center;justify-content:center;border:2px solid #f3f6f8;border-radius:999px;background:${splitter.isMaster ? "#8b5cf6" : "#22d3ee"};color:#1b1024;font-size:11px;font-weight:700;box-shadow:0 3px 10px rgba(0,0,0,.28)">S</span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })
      L.marker([Number(splitter.location.latitude), Number(splitter.location.longitude)], { icon })
        .bindPopup(`<strong>${escapeHtml(splitter.name)}</strong>`)
        .addTo(overlays)
    })

    window.setTimeout(() => map.invalidateSize(false), 0)
  }, [address, center, nearestSplitter, serviceAvailable, serviceRadius, showLocation, splitters])

  return <div ref={hostRef} className="h-full w-full" />
}
