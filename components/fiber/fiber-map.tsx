"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from 'next/dynamic'
import "leaflet/dist/leaflet.css"
import {
    Upload, Maximize2, Minimize2, Trash2, Search, Eye, EyeOff,
    X, ChevronDown, Plus, Folder, FolderOpen, Map as MapIcon,
    Target, Settings2, Box, Activity, MapPin, Share2, Layers,
    Server, Cable, Wifi, Network, Landmark
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardContainer } from "@/components/ui/card-container"

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false })
const useMap = dynamic(() => import('react-leaflet').then(mod => mod.useMap), { ssr: false })

// Fix for Leaflet default icons - moved inside client-side check
const fixLeafletIcons = () => {
    if (typeof window === 'undefined') return
    
    const L = require('leaflet')
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
        iconUrl: '/leaflet/images/marker-icon.png',
        shadowUrl: '/leaflet/images/marker-shadow.png',
    })
}

// --- 1. ICON ENGINE ---
const createIcon = (label: string, color: string) => {
    if (typeof window === 'undefined') return null
    
    const L = require('leaflet')
    const { renderToString } = require('react-dom/server')
    
    const html = renderToString(
        <div className={cn(
            "flex items-center justify-center font-bold text-white shadow-lg border-2 border-white rounded-full w-8 h-8 text-sm",
            color === "green" ? "bg-emerald-500" : color === "purple" ? "bg-purple-500" : "bg-blue-500"
        )}>
            {label}
        </div>
    )
    return L.divIcon({ html, className: "bg-transparent", iconSize: [32, 32], iconAnchor: [16, 16] })
}

// --- 2. UNIVERSAL PARSER (DXF, QGS, KMZ, KML) ---
const parseFile = async (file: File): Promise<any[]> => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    let text = ""
    if (ext === 'kmz') {
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()
        const data = await zip.loadAsync(await file.arrayBuffer())
        const kmlFile = Object.keys(data.files).find(f => f.endsWith('.kml'))
        text = await data.file(kmlFile!)!.async('string')
    } else text = await file.text()

    const features: any[] = []
    const xml = new DOMParser().parseFromString(text, "text/xml")
    const nodes = xml.querySelectorAll("Placemark, maplayer, Entity")

    nodes.forEach(node => {
        const name = node.querySelector("name, layername")?.textContent || "Node"
        const coordNodes = node.querySelectorAll("coordinates, point")
        if (coordNodes.length > 0) {
            const coordStr = coordNodes[0].textContent?.trim() || ""
            if (coordStr.includes(',')) {
                const parts = coordStr.split(/\s+/)
                if (parts.length === 1) {
                    const [lngStr, latStr] = parts[0].split(',')
                    const lng = parseFloat(lngStr)
                    const lat = parseFloat(latStr)
                    if (!isNaN(lat) && !isNaN(lng)) features.push({ type: 'Point', coords: [lat, lng], name })
                } else {
                    const path = parts.map(p => {
                        const [lngStr, latStr] = p.split(',')
                        const lng = parseFloat(lngStr)
                        const lat = parseFloat(latStr)
                        return [lat, lng]
                    }).filter(p => !isNaN(p[0]))
                    features.push({ type: 'Line', path, name })
                }
            }
        }
    })
    return features
}

function MapController({ focusPosition }: { focusPosition: [number, number] | null }) {
    const map = useMap()
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize()
            map.setView(focusPosition || [27.7172, 85.3240], 13)
        }, 100)
    }, [map, focusPosition])
    return null
}

export default function UltimateGISMap() {
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [showPanel, setShowPanel] = useState(true)
    const [autoReplace, setAutoReplace] = useState(false)
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState("files")
    const [isClient, setIsClient] = useState(false)
    const [icons, setIcons] = useState<any>(null)

    // Core State
    const [categories, setCategories] = useState([{ id: '1', name: 'ISP Infrastructure', isExpanded: true }])
    const [files, setFiles] = useState<any[]>([])
    const [focusPosition, setFocusPosition] = useState<[number, number] | null>([27.7172, 85.3240])
    const [targetCat, setTargetCat] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Master Layer Visibility
    const [layers, setLayers] = useState({
        olt: true,
        splitter: true,
        pole: true,
        fiber: true,
        misc: true
    })

    // Initialize icons on client
    useEffect(() => {
        setIsClient(true)
        fixLeafletIcons()
        
        // Create icons
        setIcons({
            OLT: createIcon("OLT", "green"),
            SPLITTER: createIcon("FAT", "purple"),
            POLE: createIcon("P", "blue")
        })
    }, [])

    // UTIL: find first geo position from parsed data
    const getFirstPositionFromData = (data: any[]): [number, number] | null => {
        if (!data || data.length === 0) return null
        const p = data.find(d => d.type === 'Point' && d.coords) || data[0]
        if (p.type === 'Point' && p.coords) return [p.coords[0], p.coords[1]]
        if (p.type === 'Line' && p.path && p.path.length > 0) return [p.path[0][0], p.path[0][1]]
        return null
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !targetCat) {
            toast.error("No folder selected")
            return
        }
        try {
            const data = await parseFile(file)
            const newFile = {
                id: Math.random().toString(36).slice(2),
                catId: targetCat,
                name: file.name,
                data,
                isVisible: true
            }

            if (autoReplace) {
                setFiles([newFile])
                const pos = getFirstPositionFromData(data)
                setFocusPosition(pos)
            } else {
                setFiles(prev => [...prev, newFile])
                if (!focusPosition) {
                    const pos = getFirstPositionFromData(data)
                    if (pos) setFocusPosition(pos)
                }
            }
            setTargetCat(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
            toast.success(`Loaded ${file.name}`)
        } catch (err) {
            console.error(err)
            toast.error("Failed to parse file")
        }
    }

    const handleFileClick = (file: any) => {
        if (autoReplace) {
            setFiles(prev => prev.map(f => ({ ...f, isVisible: f.id === file.id })))
            const pos = getFirstPositionFromData(file.data)
            setFocusPosition(pos)
        } else {
            setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isVisible: !f.isVisible } : f))
        }
    }

    const handleToggleVisibility = (e: React.MouseEvent, fileId: string) => {
        e.stopPropagation()
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, isVisible: !f.isVisible } : f))
    }

    const handleRemoveFile = (e: React.MouseEvent, fileId: string) => {
        e.stopPropagation()
        setFiles(prev => prev.filter(f => f.id !== fileId))
        toast.success("File removed")
    }

    // effect: if user toggles autoReplace ON, and multiple files exist, choose the last visible file as focus
    useEffect(() => {
        if (autoReplace) {
            const visible = files.find(f => f.isVisible) || files[files.length - 1]
            if (visible) {
                setFiles(prev => prev.map(f => ({ ...f, isVisible: f.id === visible.id })))
                const pos = getFirstPositionFromData(visible.data)
                setFocusPosition(pos)
            } else {
                setFocusPosition(null)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoReplace])

    // Layer data with icons and colors
    const layerConfigs = [
        {
            id: 'olt',
            label: 'OLT',
            icon: <Server className="h-5 w-5" />,
            color: 'bg-emerald-500',
            description: 'Optical Line Terminal'
        },
        {
            id: 'splitter',
            label: 'FAT',
            icon: <Settings2 className="h-5 w-5" />,
            color: 'bg-purple-500',
            description: 'Fiber Access Terminal'
        },
        {
            id: 'pole',
            label: 'Pole',
            icon: <Landmark className="h-5 w-5" />,
            color: 'bg-blue-500',
            description: 'Utility Poles'
        },
        {
            id: 'fiber',
            label: 'Fiber',
            icon: <Cable className="h-5 w-5" />,
            color: 'bg-indigo-500',
            description: 'Fiber Routes'
        },
        {
            id: 'misc',
            label: 'Misc',
            icon: <Network className="h-5 w-5" />,
            color: 'bg-gray-500',
            description: 'Other Equipment'
        },
    ]

    return (
        <div className={cn(
            "relative h-screen w-full",
            "bg-background",
            isFullScreen && "fixed inset-0 z-[9999]"
        )}>
            {/* Map Container - Only render on client */}
            {isClient && icons && (
                <div className="absolute inset-0 z-0">
                    <MapContainer
                        center={focusPosition || [27.7172, 85.3240]}
                        zoom={13}
                        className="h-full w-full"
                        zoomControl={false}
                        style={{
                            height: '100%',
                            width: '100%',
                        }}
                    >
                        {/* Light mode tiles */}
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            className="leaflet-tile-dark"
                        />
                        {/* Dark mode tiles */}
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            className="hidden dark:block"
                        />

                        <MapController focusPosition={focusPosition} />

                        {/* Render markers and lines */}
                        {files.filter(f => f.isVisible).map(f => (
                            f.data.map((feat: any, i: number) => {
                                const tag = (feat.name || "").toLowerCase()
                                if (feat.type === 'Point') {
                                    let icon = icons.POLE;
                                    let show = layers.pole
                                    if (tag.includes('olt')) {
                                        icon = icons.OLT;
                                        show = layers.olt
                                    }
                                    else if (tag.includes('splitter') || tag.includes('fat')) {
                                        icon = icons.SPLITTER;
                                        show = layers.splitter
                                    }
                                    else if (!tag.includes('pole')) {
                                        show = layers.misc
                                    }

                                    if (!show) return null
                                    if (search && !tag.includes(search.toLowerCase())) return null

                                    return (
                                        <Marker key={`${f.id}-pt-${i}`} position={feat.coords} icon={icon}>
                                            <Popup className="dark:bg-gray-900 dark:text-gray-100">
                                                <div className="p-3 font-sans min-w-[180px] dark:bg-gray-900">
                                                    <p className="font-bold border-b mb-2 pb-2 text-primary dark:text-primary-foreground">
                                                        {feat.name}
                                                    </p>
                                                    <div className="bg-muted dark:bg-gray-800 p-2 rounded-md text-sm">
                                                        <p className="text-xs flex justify-between">
                                                            <span className="text-muted-foreground">LAT:</span>
                                                            <span className="font-mono">{feat.coords[0].toFixed(7)}</span>
                                                        </p>
                                                        <p className="text-xs flex justify-between mt-1">
                                                            <span className="text-muted-foreground">LON:</span>
                                                            <span className="font-mono">{feat.coords[1].toFixed(7)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )
                                }
                                // Line
                                if (!layers.fiber) return null
                                if (search && !(feat.name || "").toLowerCase().includes(search.toLowerCase())) return null
                                return (
                                    <Polyline
                                        key={`${f.id}-ln-${i}`}
                                        positions={feat.path}
                                        pathOptions={{
                                            color: '#6366f1',
                                            weight: 4,
                                            opacity: 0.8,
                                        }}
                                    />
                                )
                            })
                        ))}
                    </MapContainer>
                </div>
            )}

            {/* --- MAIN GIS PANEL --- */}
            <div className={cn(
                "absolute top-5 left-5 z-[1001] transition-all duration-300",
                !showPanel && "-translate-x-[420px]"
            )}>
                <CardContainer
                    title="Network GIS"
                    description="Manage fiber network infrastructure"
                    gradientColor="#6366f1"
                    className="w-96 max-h-[90vh] overflow-hidden shadow-xl bg-background/95 backdrop-blur"
                >
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-2 mb-4">
                            <TabsTrigger value="files">
                                <Folder className="h-4 w-4 mr-2" />
                                Files
                            </TabsTrigger>
                            <TabsTrigger value="layers">
                                <Layers className="h-4 w-4 mr-2" />
                                Layers
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="files" className="space-y-4 mt-0">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={autoReplace}
                                            onCheckedChange={setAutoReplace}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                        <div>
                                            <p className="text-sm font-medium">Auto Replace</p>
                                            <p className="text-xs text-muted-foreground">
                                                {autoReplace ? "Showing one file at a time" : "Show all files"}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            const catId = categories[0]?.id
                                            if (catId) {
                                                setTargetCat(catId)
                                                fileInputRef.current?.click()
                                            } else {
                                                toast.error("No folder available")
                                            }
                                        }}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload
                                    </Button>
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Create new folder..."
                                        className="flex-1"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                setCategories(p => [...p, {
                                                    id: Math.random().toString(36).slice(2),
                                                    name: e.currentTarget.value.trim(),
                                                    isExpanded: true
                                                }])
                                                e.currentTarget.value = ""
                                                toast.success("Folder created")
                                            }
                                        }}
                                    />
                                    <Button size="icon">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-3">
                                        {categories.map(cat => (
                                            <div key={cat.id} className="border rounded-lg overflow-hidden bg-card">
                                                <div className="p-3 bg-muted/30 flex items-center justify-between">
                                                    <button
                                                        className="flex items-center gap-2 text-sm font-medium flex-1 hover:text-primary transition-colors"
                                                        onClick={() => setCategories(p => p.map(c => c.id === cat.id ? { ...c, isExpanded: !c.isExpanded } : c))}
                                                    >
                                                        {cat.isExpanded ?
                                                            <FolderOpen className="h-4 w-4 text-primary" /> :
                                                            <Folder className="h-4 w-4" />
                                                        }
                                                        <span>{cat.name}</span>
                                                        <span className="text-xs text-muted-foreground ml-1">
                                                            ({files.filter(f => f.catId === cat.id).length})
                                                        </span>
                                                    </button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:bg-primary/10"
                                                        onClick={() => {
                                                            setTargetCat(cat.id);
                                                            fileInputRef.current?.click();
                                                        }}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                {cat.isExpanded && (
                                                    <div className="p-2 space-y-1 border-t">
                                                        {files.filter(f => f.catId === cat.id).map(file => (
                                                            <div
                                                                key={file.id}
                                                                className={cn(
                                                                    "flex items-center justify-between p-2.5 rounded-lg group transition-all cursor-pointer hover:bg-accent",
                                                                    !file.isVisible && "opacity-50 grayscale"
                                                                )}
                                                                onClick={() => handleFileClick(file)}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="relative">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7"
                                                                            onClick={(e) => handleToggleVisibility(e, file.id)}
                                                                        >
                                                                            {file.isVisible ?
                                                                                <Eye className="h-3.5 w-3.5" /> :
                                                                                <EyeOff className="h-3.5 w-3.5" />
                                                                            }
                                                                        </Button>
                                                                        {file.isVisible && (
                                                                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"></div>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {file.data.length} features
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                                                                        onClick={(e) => handleRemoveFile(e, file.id)}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {files.filter(f => f.catId === cat.id).length === 0 && (
                                                            <div className="p-4 text-center">
                                                                <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                                                                <p className="text-sm text-muted-foreground">
                                                                    No files in this folder
                                                                </p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    Upload files or drag & drop
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </TabsContent>

                        <TabsContent value="layers" className="space-y-4 mt-0">
                            <div className="space-y-4">
                                <div className="grid gap-3">
                                    {layerConfigs.map(layer => (
                                        <div
                                            key={layer.id}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                                                (layers as any)[layer.id]
                                                    ? "bg-primary/5 border-primary/30"
                                                    : "bg-muted/30 border-border"
                                            )}
                                            onClick={() => setLayers(p => ({ ...p, [layer.id]: !(p as any)[layer.id] }))}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    layer.color,
                                                    (layers as any)[layer.id] ? '' : 'opacity-50'
                                                )}>
                                                    {layer.icon}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{layer.label}</p>
                                                    <p className="text-xs text-muted-foreground">{layer.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-6 rounded-full relative transition-colors",
                                                    (layers as any)[layer.id] ? "bg-primary" : "bg-muted"
                                                )}>
                                                    <div className={cn(
                                                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                                        (layers as any)[layer.id] ? "left-5" : "left-1"
                                                    )} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Map Theme</p>
                                            <p className="text-xs text-muted-foreground">Toggle between light/dark</p>
                                        </div>
                                        <div className="relative">
                                            <div className="w-12 h-6 bg-muted rounded-full"></div>
                                            <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-primary"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContainer>
            </div>

            {/* --- TOP CONTROLS --- */}
            <div className="absolute top-5 right-5 z-[1001] flex gap-3">
                {!showPanel && (
                    <Button
                        onClick={() => setShowPanel(true)}
                        className="bg-background/90 backdrop-blur-md shadow-lg border hover:bg-background text-muted-foreground"
                    >
                        <MapIcon className="h-4 w-4 mr-2" />
                        Show Panel
                    </Button>
                )}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                        className="w-64 pl-10 bg-background/90 backdrop-blur-md shadow-lg border-border"
                        placeholder="Search OLT, Fiber ID, Pole..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="bg-background/90 backdrop-blur-md shadow-lg border hover:bg-background"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                >
                    {isFullScreen ?
                        <Minimize2 className="h-4 w-4" /> :
                        <Maximize2 className="h-4 w-4" />
                    }
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="bg-background/90 backdrop-blur-md shadow-lg border hover:bg-background"
                    onClick={() => setShowPanel(!showPanel)}
                >
                    <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        showPanel ? "rotate-180" : "rotate-0"
                    )} />
                </Button>
            </div>

            {/* Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".kml,.kmz,.qgs,.dxf"
                onChange={handleUpload}
            />
        </div>
    )
}