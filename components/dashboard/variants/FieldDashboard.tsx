"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, CheckCircle2, LifeBuoy, MapPin, Navigation, Loader2, Package, Search, UserPlus, Cable, Phone, X, ExternalLink } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { apiRequest } from "@/lib/api"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Task = {
  id: number
  title: string
  description?: string
  status: string
  priority: string
  startTime?: string
  customer?: {
    customerUniqueId?: string
    lead?: {
      firstName?: string
      lastName?: string
      phoneNumber?: string
      address?: string
      street?: string
    }
  }
  ticket?: {
    ticketNumber?: string
  }
}
type TicketResponse = { data?: unknown[]; pagination?: { total?: number } }
type InventoryItem = { id: number; name: string; serialNumber?: string; qty?: number }
type BulkAssignment = { id: number; quantity: number; status: string; bulkInventory?: { name: string; unit: string } }

export function FieldDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [ticketCount, setTicketCount] = useState(0)
  const [devices, setDevices] = useState<InventoryItem[]>([])
  const [consumables, setConsumables] = useState<BulkAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [customerQuery, setCustomerQuery] = useState("")
  const [customerResults, setCustomerResults] = useState<any[]>([])
  const [searchingCustomers, setSearchingCustomers] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [taskData, ticketData, deviceData, bulkData] = await Promise.all([
        apiRequest<Task[]>("/tasks"),
        apiRequest<TicketResponse>("/tickets?limit=1"),
        apiRequest<InventoryItem[]>("/inventory/assigned/me"),
        apiRequest<BulkAssignment[]>("/bulk-inventory/assignments/me"),
      ])
      setTasks(Array.isArray(taskData) ? taskData : [])
      setTicketCount(ticketData?.pagination?.total || ticketData?.data?.length || 0)
      setDevices(Array.isArray(deviceData) ? deviceData : [])
      setConsumables(Array.isArray(bulkData) ? bulkData : [])
    } catch (error) {
      console.error("Failed to load field operations dashboard", error)
      toast.error("Could not load field operations data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (customerQuery.trim().length < 2) { setCustomerResults([]); return }
    const timer = setTimeout(async () => {
      setSearchingCustomers(true)
      try {
        const response = await apiRequest<any>(`/customer?search=${encodeURIComponent(customerQuery.trim())}&limit=6`)
        setCustomerResults(response?.data || [])
      } catch { setCustomerResults([]) } finally { setSearchingCustomers(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [customerQuery])

  const pendingTasks = useMemo(() => tasks.filter(task => ["PENDING", "IN_PROGRESS"].includes(task.status)), [tasks])
  const completedTasks = useMemo(() => tasks.filter(task => task.status === "COMPLETED"), [tasks])
  const activeTask = pendingTasks.find(task => task.status === "IN_PROGRESS") || pendingTasks[0]
  const lead = activeTask?.customer?.lead
  const address = lead?.address || lead?.street || "Location not provided"
  const customerName = lead ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : null
  const phoneNumber = lead?.phoneNumber

  const completeTask = async () => {
    if (!activeTask) return
    setUpdating(true)
    try {
      await apiRequest(`/tasks/${activeTask.id}`, { method: "PUT", body: JSON.stringify({ status: "COMPLETED" }) })
      toast.success("Task marked as completed")
      await load()
    } catch (error: any) {
      toast.error(error.message || "Unable to update task")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Title & Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-indigo-600 bg-clip-text text-transparent">
          Field Operations
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Your live assigned workload, tickets, and inventory.
        </p>
      </div>

      {/* Mobile Quick Action Buttons & Search */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <Button variant="outline" size="sm" asChild className="h-11 sm:h-10 text-xs sm:text-sm font-medium rounded-xl border bg-card hover:bg-accent shadow-xs flex items-center justify-center gap-2">
            <Link href="/inventory/assigned">
              <Package className="h-4 w-4 text-primary shrink-0" />
              <span>My Items</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-11 sm:h-10 text-xs sm:text-sm font-medium rounded-xl border bg-card hover:bg-accent shadow-xs flex items-center justify-center gap-2">
            <Link href="/customers/new">
              <UserPlus className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Add Customer</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-11 sm:h-10 text-xs sm:text-sm font-medium rounded-xl border bg-card hover:bg-accent shadow-xs flex items-center justify-center gap-2">
            <Link href="/fiber/splitters/nearby">
              <Cable className="h-4 w-4 text-cyan-500 shrink-0" />
              <span>Splitters</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-11 sm:h-10 text-xs sm:text-sm font-medium rounded-xl border bg-card hover:bg-accent shadow-xs flex items-center justify-center gap-2">
            <Link href="/tasks">
              <ClipboardList className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>Tasks</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-11 sm:h-10 text-xs sm:text-sm font-medium rounded-xl border bg-card hover:bg-accent shadow-xs col-span-2 sm:col-span-1 flex items-center justify-center gap-2">
            <Link href="/tickets">
              <LifeBuoy className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Tickets</span>
            </Link>
          </Button>
        </div>

        {/* Customer Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={customerQuery}
            onChange={event => setCustomerQuery(event.target.value)}
            className="pl-10 pr-10 h-11 text-sm rounded-xl border-muted bg-card shadow-xs focus-visible:ring-primary/20"
            placeholder="Search customer by name, ID, phone, or email..."
          />
          {customerQuery && (
            <button
              onClick={() => setCustomerQuery("")}
              className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {(searchingCustomers || customerResults.length > 0) && (
            <div className="absolute z-50 mt-1.5 w-full rounded-xl border bg-popover/95 backdrop-blur-md p-1.5 shadow-2xl max-h-72 overflow-y-auto divide-y divide-border/40">
              {searchingCustomers ? (
                <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Searching customer database...</span>
                </div>
              ) : (
                customerResults.map(customer => (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="block rounded-lg p-3 hover:bg-accent transition-colors space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{customer.firstName} {customer.lastName}</p>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">{customer.customerUniqueId}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      {customer.phoneNumber && <span>📞 {customer.phoneNumber}</span>}
                      {customer.lead?.address && <span>📍 {customer.lead.address}</span>}
                    </p>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards: 2 Columns on Mobile, 4 Columns on Desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard
          title="Open Tasks"
          value={loading ? "..." : String(pendingTasks.length)}
          icon={<ClipboardList className="h-4 w-4" />}
          description="Assigned to you"
        />
        <StatsCard
          title="Completed"
          value={loading ? "..." : String(completedTasks.length)}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          description="Your completed jobs"
        />
        <StatsCard
          title="Assigned Tickets"
          value={loading ? "..." : String(ticketCount)}
          icon={<LifeBuoy className="h-4 w-4" />}
          description="Support tickets"
        />
        <StatsCard
          title="Inventory Items"
          value={loading ? "..." : String(devices.length + consumables.length)}
          icon={<Package className="h-4 w-4" />}
          description="Devices & items"
        />
      </div>

      {/* Main Grid: Responsive 1 Column on Mobile, 7 Columns on Large Screens */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 sm:gap-6">
        {/* Current Assigned Job Card */}
        <Card className="col-span-1 lg:col-span-4 border shadow-sm rounded-2xl overflow-hidden bg-card/70 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Current Assigned Job</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Priority task scheduled for field technician</CardDescription>
              </div>
              {activeTask && (
                <Badge variant={activeTask.priority === "CRITICAL" || activeTask.priority === "HIGH" ? "destructive" : "secondary"} className="text-xs uppercase font-bold px-2.5 py-0.5">
                  {activeTask.priority}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !activeTask ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground bg-muted/20">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2 opacity-80" />
                <p className="font-semibold text-foreground">All Tasks Complete!</p>
                <p className="text-xs mt-1">No open job currently assigned to you.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-accent/10 to-transparent p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-border/40 pb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold leading-snug">{activeTask.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeTask.ticket?.ticketNumber ? `Ticket ${activeTask.ticket.ticketNumber}` : `Task #${activeTask.id}`}
                      {activeTask.customer?.customerUniqueId ? ` · Customer: ${activeTask.customer.customerUniqueId}` : ""}
                    </p>
                  </div>
                  <span className="self-start rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    {activeTask.status.replace("_", " ")}
                  </span>
                </div>

                {/* Location & Navigation */}
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-start gap-2.5 text-foreground">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{address}</span>
                  </div>

                  {address !== "Location not provided" && (
                    <a
                      className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 px-3 py-2 rounded-lg transition-colors"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Open Directions in Google Maps</span>
                      <ExternalLink className="h-3 w-3 ml-auto opacity-70" />
                    </a>
                  )}

                  {/* Customer Call Link */}
                  {(customerName || phoneNumber) && (
                    <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Customer: </span>
                        <span className="font-semibold text-foreground">{customerName || 'Lead'}</span>
                      </div>
                      {phoneNumber && (
                        <a
                          href={`tel:${phoneNumber}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors border border-emerald-500/20"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>Call {phoneNumber}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {activeTask.description && (
                    <div className="pt-2 border-t border-border/40">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {activeTask.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mark as Completed CTA */}
                <Button
                  className="w-full h-11 text-sm font-bold rounded-xl shadow-md active:scale-[0.99] transition-transform"
                  onClick={completeTask}
                  disabled={updating}
                >
                  {updating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating Job Status...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark Job as Completed</span>
                    </div>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Assigned Card */}
        <Card className="col-span-1 lg:col-span-3 border shadow-sm rounded-2xl overflow-hidden bg-card/70 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-lg font-bold">My Assigned Inventory</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Hardware & items issued for field deployment</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {!loading && devices.length + consumables.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  <Package className="mx-auto h-6 w-6 opacity-40 mb-1" />
                  <p>No equipment currently assigned to your profile.</p>
                </div>
              )}
              {devices.slice(0, 4).map(item => (
                <div key={`device-${item.id}`} className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-2.5 text-xs sm:text-sm">
                  <div className="truncate pr-2">
                    <p className="font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] font-mono text-muted-foreground truncate">{item.serialNumber || "Device Unit"}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-bold px-2 py-0.5">
                    x{item.qty || 1}
                  </Badge>
                </div>
              ))}
              {consumables.slice(0, 4).map(item => (
                <div key={`bulk-${item.id}`} className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-2.5 text-xs sm:text-sm">
                  <div className="truncate pr-2">
                    <p className="font-semibold text-foreground truncate">{item.bulkInventory?.name || "Consumable"}</p>
                    <p className="text-[11px] text-muted-foreground uppercase">{item.status}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-semibold px-2 py-0.5">
                    {item.quantity} {item.bulkInventory?.unit}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </div>
          <CardContent className="pt-0 pb-4">
            <Button variant="outline" size="sm" asChild className="w-full h-10 text-xs font-semibold rounded-xl border-dashed">
              <Link href="/inventory/assigned">View All Assigned Inventory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

