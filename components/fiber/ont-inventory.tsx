"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw, Search } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Ont = { id: number; ontId: string; serialNumber: string; status: string; servicePort: string; rxPower?: number; txPower?: number; distance?: number; lastOnline?: string; lastSync?: string; olt: { id: number; name: string; ipAddress: string }; customer?: { id: number; customerUniqueId?: string; name?: string; lead?: { phoneNumber?: string } } }
type Response = { success: boolean; data: Ont[]; pagination: { page: number; limit: number; total: number; pages: number }; summary: Array<{ status: string; count: number }> }

export function OntInventory() {
  const [records, setRecords] = useState<Ont[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 })
  const [summary, setSummary] = useState<Response["summary"]>([])
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: "50", status })
      if (query) params.set("search", query)
      const response = await apiRequest<Response>(`/network-operations/onts?${params}`, { suppressToast: true })
      setRecords(response.data); setPagination(response.pagination); setSummary(response.summary); setError("")
    } catch (cause: any) { setError(cause?.message || "ONU inventory could not be loaded.") }
    finally { setLoading(false) }
  }, [query, status])

  useEffect(() => { load(1) }, [load])
  const total = summary.reduce((sum, item) => sum + item.count, 0)

  return <div className="w-full space-y-3">
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{[{ label: "Total ONUs", value: total }, ...summary.slice(0, 3).map(item => ({ label: item.status, value: item.count }))].map(item => <Card key={item.label}><CardContent className="p-3"><div className="text-[10px] uppercase text-muted-foreground">{item.label}</div><div className="mt-1 text-xl font-semibold">{item.value}</div></CardContent></Card>)}</div>
    <Card><CardHeader className="p-3"><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-sm">ONU inventory</CardTitle><div className="flex flex-1 justify-end gap-2"><form className="relative max-w-sm flex-1" onSubmit={event => { event.preventDefault(); setQuery(search.trim()) }}><Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" /><Input className="h-9 pl-8 text-xs" value={search} onChange={event => setSearch(event.target.value)} placeholder="Serial, ONU ID, MAC, IP or description" /></form><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem>{summary.map(item => <SelectItem key={item.status} value={item.status}>{item.status}</SelectItem>)}</SelectContent></Select><Button size="icon" variant="outline" onClick={() => load(pagination.page)}><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /></Button></div></div></CardHeader><CardContent className="p-3 pt-0">
      {error && <div className="mb-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">{error}</div>}
      <Table><TableHeader><TableRow><TableHead>ONU</TableHead><TableHead>OLT / port</TableHead><TableHead>Status</TableHead><TableHead>Optical</TableHead><TableHead>Customer</TableHead><TableHead>Last sync</TableHead></TableRow></TableHeader><TableBody>{records.length ? records.map(ont => <TableRow key={ont.id}><TableCell><div className="font-medium">{ont.serialNumber}</div><div className="font-data text-[10px] text-muted-foreground">ID {ont.ontId}</div></TableCell><TableCell><div>{ont.olt.name}</div><div className="font-data text-[10px] text-muted-foreground">{ont.servicePort} · {ont.olt.ipAddress}</div></TableCell><TableCell><span className={`rounded-full px-2 py-0.5 text-[10px] ${String(ont.status).toLowerCase() === "online" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>{ont.status}</span></TableCell><TableCell className="font-data text-xs"><div>RX {ont.rxPower ?? "—"} dBm</div><div className="text-muted-foreground">TX {ont.txPower ?? "—"} dBm · {ont.distance ?? "—"} m</div></TableCell><TableCell>{ont.customer ? <><div>{ont.customer.name}</div><div className="text-[10px] text-muted-foreground">{ont.customer.customerUniqueId} {ont.customer.lead?.phoneNumber}</div></> : <span className="text-xs text-muted-foreground">Unassigned</span>}</TableCell><TableCell className="text-xs text-muted-foreground">{ont.lastSync ? new Date(ont.lastSync).toLocaleString() : "Never"}</TableCell></TableRow>) : <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">{loading ? "Loading ONUs…" : "No matching ONUs."}</TableCell></TableRow>}</TableBody></Table>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{pagination.total} records · page {pagination.page} of {Math.max(pagination.pages, 1)}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={pagination.page <= 1 || loading} onClick={() => load(pagination.page - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={pagination.page >= pagination.pages || loading} onClick={() => load(pagination.page + 1)}>Next</Button></div></div>
    </CardContent></Card>
  </div>
}
