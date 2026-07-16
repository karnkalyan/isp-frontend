"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Activity, AlertTriangle, CheckCircle2, Clock3, RefreshCw, Router, Server, WifiOff } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { getWebSocketClient } from "@/lib/websocket-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Snapshot = {
  generatedAt: string
  source: string
  summary: { nodes: number; online: number; offline: number; maintenance: number; openTickets: number; criticalTickets: number; activeTasks: number; onts: { total: number; online: number; offline: number }; olts?: { total: number; online: number; offline: number; maintenance: number } }
  nodes: Array<{ id: number; name: string; source: string; deviceType: string; vendor?: string; model?: string; address: string; status: string; statusMessage?: string; lastSeenAt?: string }>
  olts?: Array<{ id: number; source: string; name: string; vendor?: string; model?: string; address: string; status: string; lastSeenAt?: string; totalPorts: number; usedPorts: number; totalSubscribers: number; activeSubscribers: number }>
  recentTickets: Array<{ id: number; ticketNumber: string; title: string; priority: string; status: string; createdAt: string }>
  telemetry: { available: boolean; reason?: string }
}

const cards = (snapshot?: Snapshot) => [
  { label: "Network nodes", value: snapshot?.summary.nodes ?? "—", icon: Router, tone: "text-sky-500" },
  { label: "Online", value: snapshot?.summary.online ?? "—", icon: CheckCircle2, tone: "text-emerald-500" },
  { label: "Offline", value: snapshot?.summary.offline ?? "—", icon: WifiOff, tone: "text-rose-500" },
  { label: "Open tickets", value: snapshot?.summary.openTickets ?? "—", icon: AlertTriangle, tone: "text-amber-500" },
  { label: "Active tasks", value: snapshot?.summary.activeTasks ?? "—", icon: Clock3, tone: "text-violet-500" },
  { label: "Online ONUs", value: snapshot ? `${snapshot.summary.onts.online}/${snapshot.summary.onts.total}` : "—", icon: Activity, tone: "text-cyan-500" },
]

export function TechnicalDashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiRequest<{ success: boolean; data: Snapshot }>("/network-operations/dashboard", { suppressToast: true })
      setSnapshot(response.data)
      setError("")
    } catch (cause: any) {
      setError(cause?.message || "Network operations data is unavailable.")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    refresh()
    const socket = getWebSocketClient()
    const dispose = socket?.on("network-operations:snapshot", data => { setSnapshot(data); setError(""); setLoading(false) })
    const subscribe = () => socket?.send({ type: "noc:subscribe", data: {} })
    const disposeConnected = socket?.on("connected", subscribe)
    subscribe()
    const fallback = setInterval(refresh, 60000)
    return () => { clearInterval(fallback); socket?.send({ type: "noc:unsubscribe", data: {} }); dispose?.(); disposeConnected?.() }
  }, [refresh])

  const health = useMemo(() => {
    const total = Math.max(snapshot?.summary.nodes || 0, 1)
    return [
      { name: "Online", count: snapshot?.summary.online || 0, className: "bg-emerald-500" },
      { name: "Offline", count: snapshot?.summary.offline || 0, className: "bg-rose-500" },
      { name: "Maintenance", count: snapshot?.summary.maintenance || 0, className: "bg-amber-500" },
    ].map(item => ({ ...item, width: `${(item.count / total) * 100}%` }))
  }, [snapshot])

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Network Operations</h1><p className="text-sm text-muted-foreground">Tenant-scoped infrastructure, ONU, ticket, and task status.</p></div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}><RefreshCw className={`mr-2 size-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
      </div>
      {error && <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div>}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards(snapshot).map(({ label, value, icon: Icon, tone }) => <Card key={label}><CardContent className="flex items-center justify-between p-3"><div><div className="text-[11px] text-muted-foreground">{label}</div><div className="mt-1 font-data text-xl font-semibold">{value}</div></div><Icon className={`size-5 ${tone}`} /></CardContent></Card>)}
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card><CardHeader className="p-3 pb-2"><CardTitle className="text-sm">Infrastructure health</CardTitle></CardHeader><CardContent className="space-y-3 p-3 pt-0">
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">{health.map(item => <div key={item.name} className={item.className} style={{ width: item.width }} />)}</div>
          <div className="flex flex-wrap gap-4 text-[11px]">{health.map(item => <span key={item.name} className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${item.className}`} />{item.name} {item.count}</span>)}</div>
          {!snapshot?.telemetry.available && <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground"><Server className="mr-2 inline size-3.5" />{snapshot?.telemetry.reason || "Historical interface telemetry is not available."}</div>}
        </CardContent></Card>
        <Card><CardHeader className="p-3 pb-2"><CardTitle className="text-sm">Critical workload</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2 p-3 pt-0 text-center"><div className="rounded-md bg-muted p-3"><div className="text-xl font-semibold text-rose-500">{snapshot?.summary.criticalTickets ?? "—"}</div><div className="text-[10px] text-muted-foreground">Critical tickets</div></div><div className="rounded-md bg-muted p-3"><div className="text-xl font-semibold">{snapshot?.summary.activeTasks ?? "—"}</div><div className="text-[10px] text-muted-foreground">Active tasks</div></div></CardContent></Card>
      </div>
      <Card><CardHeader className="p-3 pb-2"><CardTitle className="text-sm">Live node status</CardTitle></CardHeader><CardContent className="p-3 pt-0"><Table><TableHeader><TableRow><TableHead>Node</TableHead><TableHead>Type</TableHead><TableHead>Address</TableHead><TableHead>Status</TableHead><TableHead>Last seen</TableHead></TableRow></TableHeader><TableBody>
        {snapshot?.nodes.length ? snapshot.nodes.map(node => <TableRow key={`${node.source}-${node.id}`}><TableCell className="font-medium">{node.name}<div className="text-[10px] text-muted-foreground">{node.vendor} {node.model}</div></TableCell><TableCell>{node.deviceType}</TableCell><TableCell className="font-data text-xs">{node.address}</TableCell><TableCell><span className={`rounded-full px-2 py-0.5 text-[10px] ${node.status === "online" ? "bg-emerald-500/10 text-emerald-600" : node.status === "maintenance" ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600"}`}>{node.status}</span></TableCell><TableCell className="text-xs text-muted-foreground">{node.lastSeenAt ? new Date(node.lastSeenAt).toLocaleString() : "Never"}</TableCell></TableRow>) : <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No configured network nodes.</TableCell></TableRow>}
      </TableBody></Table></CardContent></Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
          <CardTitle className="text-sm">Fiber OLT inventory ({snapshot?.summary.olts?.total ?? 0})</CardTitle>
          <Button asChild variant="outline" size="sm"><Link href="/fiber/olt">Manage OLTs</Link></Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-3 pt-0">
          <Table><TableHeader><TableRow><TableHead>OLT</TableHead><TableHead>Address</TableHead><TableHead>Status</TableHead><TableHead>Ports</TableHead><TableHead>Subscribers</TableHead><TableHead>Last seen</TableHead></TableRow></TableHeader><TableBody>
            {snapshot?.olts?.length ? snapshot.olts.map(olt => <TableRow key={`${olt.source}-${olt.id}`}><TableCell className="font-medium"><Link className="hover:underline" href={olt.source === "fiber-olt" ? "/fiber/olt" : `/network-admin/devices/${olt.id}`}>{olt.name}</Link><div className="text-[10px] text-muted-foreground">{[olt.vendor, olt.model].filter(Boolean).join(" ") || "OLT"}</div></TableCell><TableCell className="font-data text-xs">{olt.address}</TableCell><TableCell><span className={`rounded-full px-2 py-0.5 text-[10px] ${olt.status === "online" ? "bg-emerald-500/10 text-emerald-600" : olt.status === "maintenance" ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600"}`}>{olt.status}</span></TableCell><TableCell className="text-xs">{olt.totalPorts ? `${olt.usedPorts}/${olt.totalPorts}` : "—"}</TableCell><TableCell className="text-xs">{olt.totalSubscribers ? `${olt.activeSubscribers}/${olt.totalSubscribers}` : "—"}</TableCell><TableCell className="text-xs text-muted-foreground">{olt.lastSeenAt ? new Date(olt.lastSeenAt).toLocaleString() : "Never"}</TableCell></TableRow>) : <TableRow><TableCell colSpan={6} className="h-20 text-center text-muted-foreground">No OLT devices are configured.</TableCell></TableRow>}
          </TableBody></Table>
        </CardContent>
      </Card>
      <div className="text-right text-[10px] text-muted-foreground">Updated {snapshot?.generatedAt ? new Date(snapshot.generatedAt).toLocaleString() : "—"} · source: {snapshot?.source || "unavailable"}</div>
    </div>
  )
}
