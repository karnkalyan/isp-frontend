"use client"

import { Marker, Popup } from "react-leaflet"
import L from "leaflet"

interface Splitter {
    id: string
    name: string
    splitterId: string
    splitRatio: string
    splitterType: "PLC" | "FBT"
    portCount: number
    availablePorts: number
    status: "active" | "inactive" | "maintenance"
    location: {
        site: string
        latitude?: number
        longitude?: number
    }
    isMaster: boolean
}

interface SplitterMarkerProps {
    splitter: Splitter
}

export function SplitterMarker({ splitter }: SplitterMarkerProps) {
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
                <div className="p-1 min-w-[200px]">
                    <strong className="text-sm">{splitter.name}</strong><br />
                    <div className="text-xs mt-1">
                        <div><strong>ID:</strong> {splitter.splitterId}</div>
                        <div><strong>Type:</strong> {splitter.splitterType}</div>
                        <div><strong>Ratio:</strong> {splitter.splitRatio}</div>
                        <div>
                            <strong>Status:</strong>{" "}
                            <span className={`px-2 py-0.5 rounded text-xs ${splitter.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {splitter.status}
                            </span>
                        </div>
                        <div><strong>Available Ports:</strong> {splitter.availablePorts}/{splitter.portCount}</div>
                        <div className="mt-2 text-gray-500 text-xs">
                            {splitter.location.site || 'No site specified'}
                        </div>
                    </div>
                </div>
            </Popup>
        </Marker>
    )
}