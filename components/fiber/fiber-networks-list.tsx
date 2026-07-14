"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Cable, Eye, Loader2, MapPin, RefreshCw, Search, Signal, Users } from "lucide-react"
import { fetchFiberNetworkDataset, type FiberNetworkRow } from "@/lib/fiber-network-data"

export function FiberNetworksList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [networks, setNetworks] = useState<FiberNetworkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNetworks = async () => {
    try {
      setLoading(true)
      setError(null)
      const dataset = await fetchFiberNetworkDataset()
      setNetworks(dataset.rows)
    } catch (err: any) {
      setError(err?.message || "Failed to load fiber networks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNetworks()
  }, [])

  const filteredNetworks = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return networks.filter(
      (network) =>
        network.name.toLowerCase().includes(query) ||
        network.location.toLowerCase().includes(query) ||
        network.id.toLowerCase().includes(query)
    )
  }, [networks, searchQuery])

  const getStatusBadge = (status: FiberNetworkRow["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-600">Active</Badge>
      case "maintenance":
        return <Badge variant="outline" className="border-amber-500 bg-amber-500/10 text-amber-600">Maintenance</Badge>
      default:
        return <Badge variant="outline" className="border-red-500 bg-red-500/10 text-red-600">Offline</Badge>
    }
  }

  const getSignalQualityBadge = (quality: FiberNetworkRow["signalQuality"]) => {
    const config = {
      excellent: { bars: 4, label: "Excellent", color: "bg-green-500" },
      good: { bars: 3, label: "Good", color: "bg-green-500" },
      fair: { bars: 2, label: "Fair", color: "bg-amber-500" },
      poor: { bars: 1, label: "Poor", color: "bg-red-500" },
      unknown: { bars: 0, label: "N/A", color: "bg-muted" },
    }[quality]

    return (
      <div className="flex items-center">
        <div className="flex space-x-0.5">
          {[1, 2, 3, 4].map((bar) => (
            <div key={bar} className={`h-3 w-1.5 rounded-sm ${bar <= config.bars ? config.color : "bg-muted"}`} />
          ))}
        </div>
        <span className="ml-2 text-xs">{config.label}</span>
      </div>
    )
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Fiber Networks</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search networks..."
              className="pl-8"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <Button variant="outline" onClick={loadNetworks} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {error && (
          <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Network ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>OLT / Splitter / ONT</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ONT Availability</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredNetworks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No fiber network data found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredNetworks.map((network) => (
                  <TableRow key={network.id}>
                    <TableCell className="font-medium">{network.id}</TableCell>
                    <TableCell>{network.name}</TableCell>
                    <TableCell>{network.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                        <span>{network.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                        <span>{network.subscribers}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Cable className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{network.oltCount}</span>
                        <span className="text-muted-foreground">/</span>
                        <span>{network.splitterCount}</span>
                        <span className="text-muted-foreground">/</span>
                        <span>{network.onuCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(network.status)}</TableCell>
                    <TableCell>{getSignalQualityBadge(network.signalQuality)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <a href="/fiber/olt">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View OLT details</span>
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Signal className="h-3.5 w-3.5" />
          Counts are built from actual OLT, splitter, customer service, and ONT device records.
        </div>
      </CardContent>
    </Card>
  )
}
