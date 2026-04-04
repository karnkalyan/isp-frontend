"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, Filter, MapPin, Cable, Signal, Users, Settings, Eye, Edit, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data for fiber networks
const networks = [
  {
    id: "FN-001",
    name: "Downtown FTTH Network",
    type: "FTTH",
    location: "Downtown",
    subscribers: 845,
    oltCount: 4,
    onuCount: 845,
    status: "active",
    signalQuality: "excellent",
  },
  {
    id: "FN-002",
    name: "Business District FTTB",
    type: "FTTB",
    location: "Business District",
    subscribers: 124,
    oltCount: 2,
    onuCount: 124,
    status: "active",
    signalQuality: "good",
  },
  {
    id: "FN-003",
    name: "North Residential Area",
    type: "FTTH",
    location: "North Residential",
    subscribers: 567,
    oltCount: 3,
    onuCount: 567,
    status: "active",
    signalQuality: "excellent",
  },
  {
    id: "FN-004",
    name: "East Suburb Network",
    type: "FTTH",
    location: "East Suburb",
    subscribers: 328,
    oltCount: 2,
    onuCount: 328,
    status: "maintenance",
    signalQuality: "fair",
  },
  {
    id: "FN-005",
    name: "Industrial Zone FTTB",
    type: "FTTB",
    location: "Industrial Zone",
    subscribers: 42,
    oltCount: 1,
    onuCount: 42,
    status: "active",
    signalQuality: "good",
  },
]

export function FiberNetworksList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Check for dark mode
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"))

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"))
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  const filteredNetworks = networks.filter(
    (network) =>
      network.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      network.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      network.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
            Active
          </Badge>
        )
      case "maintenance":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500">
            Maintenance
          </Badge>
        )
      case "offline":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500">
            Offline
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSignalQualityBadge = (quality: string) => {
    switch (quality) {
      case "excellent":
        return (
          <div className="flex items-center">
            <div className="flex space-x-0.5">
              <div className="w-1.5 h-3 bg-green-500 rounded-sm"></div>
              <div className="w-1.5 h-3 bg-green-500 rounded-sm"></div>
              <div className="w-1.5 h-3 bg-green-500 rounded-sm"></div>
              <div className="w-1.5 h-3 bg-green-500 rounded-sm"></div>
            </div>
            <span className="ml-2 text-xs">Excellent</span>
          </div>
        )
      case "good":
        return (
          <div className="flex items-center">
            <div className="flex space-x-0.5">
              <div className="w-1.5 h-3 bg-green-500 rounded-sm"></div>
              <div className="w-1.5 h-3 bg-green-500 rounded-sm"></div>
              <div className="w-1.5 h-3 bg-green-500 rounded-sm"></div>
              <div className="w-1.5 h-3 bg-muted rounded-sm"></div>
            </div>
            <span className="ml-2 text-xs">Good</span>
          </div>
        )
      case "fair":
        return (
          <div className="flex items-center">
            <div className="flex space-x-0.5">
              <div className="w-1.5 h-3 bg-amber-500 rounded-sm"></div>
              <div className="w-1.5 h-3 bg-amber-500 rounded-sm"></div>
              <div className="w-1.5 h-3 bg-muted rounded-sm"></div>
              <div className="w-1.5 h-3 bg-muted rounded-sm"></div>
            </div>
            <span className="ml-2 text-xs">Fair</span>
          </div>
        )
      case "poor":
        return (
          <div className="flex items-center">
            <div className="flex space-x-0.5">
              <div className="w-1.5 h-3 bg-red-500 rounded-sm"></div>
              <div className="w-1.5 h-3 bg-muted rounded-sm"></div>
              <div className="w-1.5 h-3 bg-muted rounded-sm"></div>
              <div className="w-1.5 h-3 bg-muted rounded-sm"></div>
            </div>
            <span className="ml-2 text-xs">Poor</span>
          </div>
        )
      default:
        return <span>Unknown</span>
    }
  }

  return (
    <Card
      className={`${isDarkMode ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-gray-200"} rounded-xl overflow-hidden relative`}
    >
      {/* Top-left corner gradient */}
      <div
        className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, #3B82F6 0%, transparent 70%)`,
        }}
      />

      {/* Bottom-right corner gradient */}
      <div
        className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, #10B981 0%, transparent 70%)`,
        }}
      />

      <CardHeader
        className={`flex flex-row items-center justify-between relative z-10 ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} border-b`}
      >
        <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>Fiber Networks</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search networks..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button>
            <Cable className="mr-2 h-4 w-4" />
            Add Network
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 p-4">
        <div className={`rounded-md border ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"}`}>
          <Table>
            <TableHeader>
              <TableRow className={isDarkMode ? "hover:bg-[#1e293b]" : "hover:bg-gray-50"}>
                <TableHead className={isDarkMode ? "text-slate-300" : "text-gray-700"}>Network ID</TableHead>
                <TableHead className={isDarkMode ? "text-slate-300" : "text-gray-700"}>Name</TableHead>
                <TableHead className={isDarkMode ? "text-slate-300" : "text-gray-700"}>Type</TableHead>
                <TableHead className={isDarkMode ? "text-slate-300" : "text-gray-700"}>Location</TableHead>
                <TableHead className={isDarkMode ? "text-slate-300" : "text-gray-700"}>Subscribers</TableHead>
                <TableHead className={isDarkMode ? "text-slate-300" : "text-gray-700"}>OLT/ONU</TableHead>
                <TableHead className={isDarkMode ? "text-slate-300" : "text-gray-700"}>Status</TableHead>
                <TableHead className={isDarkMode ? "text-slate-300" : "text-gray-700"}>Signal Quality</TableHead>
                <TableHead className={`text-right ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNetworks.map((network) => (
                <TableRow key={network.id} className={isDarkMode ? "hover:bg-[#1e293b]" : "hover:bg-gray-50"}>
                  <TableCell className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {network.id}
                  </TableCell>
                  <TableCell className={isDarkMode ? "text-white" : "text-gray-900"}>{network.name}</TableCell>
                  <TableCell className={isDarkMode ? "text-white" : "text-gray-900"}>{network.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <span className={isDarkMode ? "text-white" : "text-gray-900"}>{network.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <span className={isDarkMode ? "text-white" : "text-gray-900"}>{network.subscribers}</span>
                    </div>
                  </TableCell>
                  <TableCell
                    className={isDarkMode ? "text-white" : "text-gray-900"}
                  >{`${network.oltCount} / ${network.onuCount}`}</TableCell>
                  <TableCell>{getStatusBadge(network.status)}</TableCell>
                  <TableCell>{getSignalQualityBadge(network.signalQuality)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Signal className="mr-2 h-4 w-4" />
                          Signal Analysis
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
