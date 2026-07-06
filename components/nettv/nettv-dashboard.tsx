"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye, Loader2, Package, Plus, RefreshCw, Search, Tv, UserCheck, Users, ArrowLeft } from "lucide-react"
import { ServicesAPI } from "@/lib/api/service"
import { NetTVDialog } from "@/components/customers/add-customer-form"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "react-hot-toast"

const unwrapList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.subscribers)) return payload.subscribers
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const getTotalPages = (payload: any, fallbackItems: any[], perPage: number) => {
  const totalPages = payload?.last_page || payload?.totalPages || payload?.pagination?.totalPages || payload?.meta?.last_page
  if (Number(totalPages) > 0) return Number(totalPages)
  const total = payload?.total || payload?.pagination?.total || payload?.meta?.total
  if (Number(total) > 0) return Math.ceil(Number(total) / perPage)
  return fallbackItems.length >= perPage ? 2 : 1
}

const valueOf = (item: any, keys: string[], fallback = "N/A") => {
  for (const key of keys) {
    const value = item?.[key]
    if (value !== undefined && value !== null && value !== "") return String(value)
  }
  return fallback
}

const fullName = (item: any) => {
  const details = item?.details || {}
  const joined = [item?.fname || details.fname, item?.mname || details.mname, item?.lname || details.lname].filter(Boolean).join(" ")
  return item?.name || item?.full_name || joined || "N/A"
}

const statusVariant = (status: string): "success" | "warning" | "destructive" | "secondary" => {
  const normalized = status.toLowerCase()
  if (normalized.includes("active") || normalized.includes("enabled")) return "success"
  if (normalized.includes("pending") || normalized.includes("hold")) return "warning"
  if (normalized.includes("inactive") || normalized.includes("disabled") || normalized.includes("expired")) return "destructive"
  return "secondary"
}

function renderValue(value: any): React.ReactNode {
  if (value === null || value === undefined) return "N/A"
  
  if (typeof value === "boolean") {
    return <Badge variant={value ? "default" : "outline"}>{value ? "Yes" : "No"}</Badge>
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-xs text-muted-foreground">Empty list</span>
    if (typeof value[0] === "object") {
      return (
        <div className="space-y-1.5 mt-1">
          {value.map((item, idx) => (
            <div key={idx} className="rounded border bg-muted/30 p-1.5 text-[11px] font-mono leading-tight">
              {Object.entries(item)
                .filter(([_, v]) => v !== null && v !== undefined && typeof v !== "object")
                .map(([k, v]) => `${k}: ${v}`)
                .join(" | ")}
            </div>
          ))}
        </div>
      )
    }
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {value.map((val, idx) => (
          <Badge key={idx} variant="secondary" className="text-[10px]">{String(val)}</Badge>
        ))}
      </div>
    )
  }
  
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([_, v]) => v !== null && v !== undefined && typeof v !== "object")
    if (entries.length === 0) return <span className="text-xs text-muted-foreground">Empty object</span>
    return (
      <div className="grid grid-cols-1 gap-1 border rounded bg-muted/20 p-1.5 mt-1 text-xs">
        {entries.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 border-b border-border/30 last:border-0 pb-0.5">
            <span className="text-muted-foreground text-[10px] uppercase font-mono">{k.replace(/_/g, " ")}</span>
            <span className="font-mono text-[11px] truncate max-w-[150px]">{String(v)}</span>
          </div>
        ))}
      </div>
    )
  }
  
  return String(value)
}

function DetailsBlock({ title, data }: { title: string; data: any }) {
  const entries = Object.entries(data || {}).filter(([key, value]) => value !== null && value !== undefined && value !== "" && key !== "password")
  if (entries.length === 0) return null

  return (
    <div className="rounded-lg border bg-background/60 p-3 shadow-sm">
      <div className="mb-2 text-sm font-semibold border-b pb-1 text-primary">{title}</div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="min-w-0 flex flex-col justify-start">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{key.replace(/_/g, " ")}</div>
            <div className="break-words text-sm font-medium mt-0.5">
              {renderValue(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NettvDashboard() {
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [stbs, setStbs] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [loading, setLoading] = useState(true)

  // Sub-pagination states
  const [packagePage, setPackagePage] = useState(1)
  const [stbPage, setStbPage] = useState(1)
  const subLimit = 10

  const paginatedPackages = useMemo(() => {
    return packages.slice((packagePage - 1) * subLimit, packagePage * subLimit)
  }, [packages, packagePage])
  const totalPackagePages = Math.max(1, Math.ceil(packages.length / subLimit))

  const paginatedStbs = useMemo(() => {
    return stbs.slice((stbPage - 1) * subLimit, stbPage * subLimit)
  }, [stbs, stbPage])
  const totalStbPages = Math.max(1, Math.ceil(stbs.length / subLimit))
  const [selected, setSelected] = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selectedStbSerial, setSelectedStbSerial] = useState("")
  const [selectedPackageSaleId, setSelectedPackageSaleId] = useState("")
  const [packageQty, setPackageQty] = useState(1)
  const [paymentGateway, setPaymentGateway] = useState("reseller_wallet")
  const [assigningPackage, setAssigningPackage] = useState(false)
  const [stbLoading, setStbLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [creatingSubscriber, setCreatingSubscriber] = useState(false)

  const fetchAllNetTVPages = async (fetcher: (page: number, perPage: number) => Promise<{ data: any }>) => {
    const perPage = 100
    const first = await fetcher(1, perPage)
    const firstPayload = first.data
    const firstItems = unwrapList(firstPayload)
    const totalPages = Math.min(getTotalPages(firstPayload, firstItems, perPage), 100)
    if (totalPages <= 1) return firstItems

    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => fetcher(index + 2, perPage))
    )
    return [firstItems, ...rest.map(response => unwrapList(response.data))].flat()
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [subscriberList, packageRes, stbRes] = await Promise.all([
        fetchAllNetTVPages((page, perPage) => ServicesAPI.getNetTVSubscribers(page, perPage)),
        fetchAllNetTVPages((page, perPage) => ServicesAPI.getNetTVPackages(page, perPage)).catch(() => []),
        fetchAllNetTVPages((page, perPage) => ServicesAPI.getNetTVSTBs(page, perPage)).catch(() => []),
      ])
      setSubscribers(subscriberList)
      setPackages(packageRes)
      setStbs(stbRes)
    } catch (error: any) {
      toast.error(error.message || "Failed to load NetTV service data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredSubscribers = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return subscribers
    return subscribers.filter(item =>
      [item?.username, item?.email, item?.mobile, item?.phone, item?.details?.phone_no, item?.details?.mobile_no, fullName(item), item?.package_name, item?.status]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term))
    )
  }, [search, subscribers])

  const totalPages = Math.max(1, Math.ceil(filteredSubscribers.length / limit))
  const paginatedSubscribers = filteredSubscribers.slice((page - 1) * limit, page * limit)
  const activeCount = subscribers.filter(item => statusVariant(valueOf(item, ["status", "state"], "") as string) === "success").length

  const openDetails = async (subscriber: any) => {
    const username = valueOf(subscriber, ["username", "user_name", "customer_username"], "")
    setSelected(subscriber)
    if (!username) return
    setDetailsLoading(true)
    try {
      const response = await ServicesAPI.getNetTVSubscriber(username)
      const details = response.data || subscriber
      setSelected(details)
      setSelectedStbSerial(details?.stbs?.[0]?.serial || "")
    } catch {
      setSelected(subscriber)
    } finally {
      setDetailsLoading(false)
    }
  }

  const refreshSelectedSubscriber = async () => {
    const username = valueOf(selected?.subscriber || selected, ["username", "user_name", "customer_username"], "")
    if (!username) return
    const response = await ServicesAPI.getNetTVSubscriber(username)
    const refreshed = response.data
    setSelected(refreshed)
    const serials = (refreshed?.stbs || []).map((stb: any) => stb.serial)
    setSelectedStbSerial((current) => serials.includes(current) ? current : (serials[0] || ""))
    setSubscribers((current) => current.map((subscriber) =>
      valueOf(subscriber, ["username", "user_name", "customer_username"], "") === username
        ? { ...subscriber, ...(refreshed?.subscriber || {}) }
        : subscriber
    ))
  }

  const createSubscriber = async (payload: any) => {
    setCreatingSubscriber(true)
    try {
      await ServicesAPI.createNetTVSubscriber(payload)
      const response = await ServicesAPI.getNetTVSubscriber(payload.username).catch(() => null)
      const created = response?.data?.subscriber || payload
      setSubscribers((current) => [created, ...current.filter((item) =>
        valueOf(item, ["username", "user_name", "customer_username"], "") !== payload.username
      )])
      setCreateOpen(false)
      toast.success("NetTV subscriber added successfully")
    } catch (error: any) {
      setCreateOpen(true)
      toast.error(error.message || "Failed to add NetTV subscriber")
    } finally {
      setCreatingSubscriber(false)
    }
  }

  const selectedStb = (selected?.stbs || []).find((stb: any) => stb.serial === selectedStbSerial) || selected?.stbs?.[0] || null
  const packageConfigs = useMemo(() => {
    if (!selectedStb) return []
    return (selectedStb.package_details || []).flatMap((pkg: any) =>
      (pkg?.package_config || []).map((config: any) => ({ ...config, package_name: pkg.name, package_id: pkg.id }))
    )
  }, [selectedStb])

  const refreshSelectedStb = async () => {
    if (!selectedStbSerial) return
    setStbLoading(true)
    try {
      const response = await ServicesAPI.getNetTVSTB(selectedStbSerial)
      setSelected((prev: any) => ({
        ...prev,
        stbs: (prev?.stbs || []).map((stb: any) => stb.serial === selectedStbSerial ? { ...stb, ...response.data } : stb)
      }))
      toast.success("STB details refreshed")
    } catch (error: any) {
      toast.error(error.message || "Failed to get STB details")
    } finally {
      setStbLoading(false)
    }
  }

  const assignPackage = async () => {
    if (!selectedStbSerial || !selectedPackageSaleId) {
      toast.error("Select an STB and package configuration")
      return
    }
    setAssigningPackage(true)
    try {
      await ServicesAPI.subscribeNetTVPackages(selectedStbSerial, {
        pos: selected?.subscriber?.reseller?.address || "Kisan Net",
        created_by: selected?.subscriber?.reseller?.username || "kisannet",
        payment_gateway: paymentGateway,
        packages: [{ package_sale_id: Number(selectedPackageSaleId), qty: Math.max(1, Number(packageQty)) }],
        send_mail: 0,
      })
      toast.success("NetTV package assigned successfully")
      await refreshSelectedSubscriber()
      setSelectedPackageSaleId("")
    } catch (error: any) {
      toast.error(error.message || "Failed to assign NetTV package")
    } finally {
      setAssigningPackage(false)
    }
  }

  if (selected) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subscribers
          </Button>
          <h1 className="text-2xl font-bold">NetTV Subscriber Details</h1>
        </div>

        {detailsLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading details...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <CardContainer title="Subscriber Account" gradientColor="#10b981">
                <div className="py-1">
                  <div className="text-xl font-bold">{fullName(selected?.subscriber)}</div>
                  <div className="font-mono text-sm text-muted-foreground">{selected?.subscriber?.username || valueOf(selected?.subscriber || selected, ["username", "user_name", "customer_username"])}</div>
                </div>
              </CardContainer>
              <CardContainer title="Contact Information" gradientColor="#3b82f6">
                <div className="py-1">
                  <div className="text-base font-semibold">{selected?.subscriber?.details?.mobile_no || selected?.subscriber?.details?.phone_no || "N/A"}</div>
                  <div className="text-sm text-muted-foreground">{selected?.subscriber?.email || "N/A"}</div>
                </div>
              </CardContainer>
              <CardContainer title="Reseller Balance" gradientColor="#f59e0b">
                <div className="py-1">
                  <div className="text-2xl font-bold">NPR {selected?.reseller?.credit_balance?.credit_balance ?? selected?.subscriber?.balance ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Reseller ID: #{selected?.reseller?.id || "N/A"}</div>
                </div>
              </CardContainer>
            </div>

            {/* Structured details blocks */}
            <div className="grid gap-6 lg:grid-cols-2">
              <DetailsBlock title="Subscriber Account Details" data={selected?.subscriber} />
              <DetailsBlock title="Subscriber Contact & Address" data={selected?.subscriber?.details} />
              <DetailsBlock title="Reseller & Payment Info" data={selected?.reseller} />
            </div>

            {/* STB Devices management section */}
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold border-b pb-2">Set-Top Box (STB) & Service Provisioning</h2>
              
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-sm font-semibold">Select Linked STB</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedStbSerial}
                    onChange={(event) => { setSelectedStbSerial(event.target.value); setSelectedPackageSaleId("") }}
                  >
                    <option value="">Select device</option>
                    {(selected?.stbs || []).map((stb: any) => (
                      <option key={stb.serial} value={stb.serial}>{stb.serial} · {stb.model?.name || stb.model || "STB"}</option>
                    ))}
                  </select>
                </div>
                <Button type="button" variant="outline" className="h-10" onClick={refreshSelectedStb} disabled={!selectedStbSerial || stbLoading}>
                  {stbLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Get Device Details
                </Button>
              </div>

              {selectedStb ? (
                <div className="space-y-6 pt-2">
                  <div className="grid gap-4 text-sm md:grid-cols-4 rounded-lg bg-muted/40 p-4 border">
                    <div><div className="text-xs text-muted-foreground">Serial / MAC</div><div className="break-all font-mono font-semibold">{selectedStb.serial}</div></div>
                    <div><div className="text-xs text-muted-foreground">Status</div><Badge variant={statusVariant(String(selectedStb.status || "unknown"))} className="mt-1">{selectedStb.status || "unknown"}</Badge></div>
                    <div><div className="text-xs text-muted-foreground">Vendor</div><div className="font-semibold">{selectedStb.vendor?.name || selectedStb.vendor || "N/A"}</div></div>
                    <div><div className="text-xs text-muted-foreground">Model</div><div className="font-semibold">{selectedStb.model?.name || selectedStb.model || "N/A"}</div></div>
                  </div>

                  {/* Assign packages */}
                  <div className="rounded-lg border p-4 bg-background shadow-xs space-y-4">
                    <div className="font-semibold border-b pb-2 text-primary">Assign Subscription Package</div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <Label>Select Package</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={selectedPackageSaleId}
                          onChange={(event) => setSelectedPackageSaleId(event.target.value)}
                        >
                          <option value="">Select package configuration</option>
                          {packageConfigs.map((config: any) => (
                            <option key={config.id} value={config.id}>
                              {config.package_name || "Package"} · {config.display_name} · {config.duration} · Rs. {config.price_with_vat ?? config.price ?? 0}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Payment Mode</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={paymentGateway}
                          onChange={(event) => setPaymentGateway(event.target.value)}
                        >
                          <option value="reseller_wallet">Reseller Wallet</option>
                          <option value="wallet">Subscriber Wallet</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          value={packageQty}
                          onChange={(event) => setPackageQty(Math.max(1, Number(event.target.value)))}
                        />
                      </div>
                    </div>
                    <Button type="button" onClick={assignPackage} disabled={assigningPackage || !selectedPackageSaleId}>
                      {assigningPackage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Assign Selected Package
                    </Button>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-lg border p-4 bg-background">
                      <div className="mb-3 font-semibold border-b pb-1">Subscribed Packages</div>
                      <div className="space-y-2">
                        {(selectedStb.subscribed_packages || []).map((pkg: any) => (
                          <div key={pkg.id} className="rounded-md bg-muted/40 p-3 text-sm">
                            <div className="font-semibold text-primary">{pkg.package_config_name}</div>
                            <div className="text-xs text-muted-foreground mt-1">Package #{pkg.package_id} · {pkg.package_subscription_details?.[0]?.expiry_date ? `Expires ${pkg.package_subscription_details[0].expiry_date}` : "No expiry"}</div>
                          </div>
                        ))}
                        {!selectedStb.subscribed_packages?.length && <p className="text-sm text-muted-foreground py-2">No subscribed packages.</p>}
                      </div>
                    </div>

                    <div className="rounded-lg border p-4 bg-background">
                      <div className="mb-3 font-semibold border-b pb-1">Active Orders</div>
                      <div className="space-y-2">
                        {(selectedStb.active_package || []).map((pkg: any) => (
                          <div key={pkg.id} className="rounded-md bg-muted/40 p-3 text-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-primary">{pkg.name}</span>
                              <Badge variant={statusVariant(String(pkg.status || "unknown"))}>{pkg.status}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1.5">Order #{pkg.id} · Qty {pkg.qty} · Rs. {pkg.total_with_vat}</div>
                          </div>
                        ))}
                        {!selectedStb.active_package?.length && <p className="text-sm text-muted-foreground py-2">No active orders.</p>}
                      </div>
                    </div>
                  </div>

                  {selectedStb?.bootstrap?.services?.length > 0 && (
                    <div className="rounded-lg border p-4 bg-background">
                      <div className="mb-2 font-semibold">Device Services</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedStb.bootstrap.services.map((service: any) => (
                          <Badge key={service.name} variant="outline" title={service.baseURL}>{service.name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 border rounded-lg text-center bg-muted/10 border-dashed">No set-top box linked/selected. Pick a device from the list above to assign packages or view STB subscriptions.</p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <CardContainer title="Subscribers" gradientColor="#10b981">
          <div className="flex items-center gap-3 py-2">
            <Users className="h-8 w-8 text-emerald-500" />
            <div className="text-3xl font-bold">{subscribers.length}</div>
          </div>
        </CardContainer>
        <CardContainer title="Active" gradientColor="#22c55e">
          <div className="flex items-center gap-3 py-2">
            <UserCheck className="h-8 w-8 text-green-500" />
            <div className="text-3xl font-bold">{activeCount}</div>
          </div>
        </CardContainer>
        <CardContainer title="Packages" gradientColor="#3b82f6">
          <div className="flex items-center gap-3 py-2">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="text-3xl font-bold">{packages.length}</div>
          </div>
        </CardContainer>
        <CardContainer title="STBs" gradientColor="#f59e0b">
          <div className="flex items-center gap-3 py-2">
            <Tv className="h-8 w-8 text-amber-500" />
            <div className="text-3xl font-bold">{stbs.length}</div>
          </div>
        </CardContainer>
      </div>

      <CardContainer
        title="NetTV Subscribers"
        description="Subscriber accounts, plans, status, contact data, devices, and service identifiers"
        gradientColor="#10b981"
        actions={[
          { label: "Add Subscriber", onClick: () => setCreateOpen(true), icon: <Plus className="h-4 w-4" /> },
          { label: "Refresh", onClick: fetchData, icon: <RefreshCw className="h-4 w-4" />, variant: "outline" }
        ]}
      >
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
              placeholder="Search subscribers"
              className="pl-9"
            />
          </div>
          <select
            value={limit}
            onChange={(event) => { setLimit(Number(event.target.value)); setPage(1) }}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            {[10, 25, 50, 100].map(value => <option key={value} value={value}>{value} rows</option>)}
          </select>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscriber</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="w-[80px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={6}><Skeleton className="h-7 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedSubscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">No NetTV subscribers found.</TableCell>
                </TableRow>
              ) : (
                paginatedSubscribers.map((subscriber, index) => {
                  const username = valueOf(subscriber, ["username", "user_name", "customer_username"])
                  const status = valueOf(subscriber, ["status", "state"], "Unknown")
                  return (
                    <TableRow key={`${username}-${index}`}>
                      <TableCell>
                        <div className="font-semibold">{fullName(subscriber)}</div>
                        <div className="font-mono text-xs text-muted-foreground">{username}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{valueOf(subscriber, ["email"])}</div>
                        <div className="text-xs text-muted-foreground">{valueOf(subscriber, ["mobile", "phone", "contact"], valueOf(subscriber?.details, ["mobile_no", "phone_no"]))}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{valueOf(subscriber, ["package_name", "package", "plan_name", "subscription_package"])}</div>
                        <div className="text-xs text-muted-foreground">{valueOf(subscriber, ["subscription_id", "package_id", "plan_id"])}</div>
                      </TableCell>
                      <TableCell><Badge variant={statusVariant(status)}>{status}</Badge></TableCell>
                      <TableCell className="text-sm">{valueOf(subscriber, ["expires_at", "expiry_date", "expire_date", "valid_till", "end_date"])}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openDetails(subscriber)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>Showing {paginatedSubscribers.length ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, filteredSubscribers.length)} of {filteredSubscribers.length}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(1)}>First</Button>
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(prev => prev - 1)}>Prev</Button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(prev => prev + 1)}>Next</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(totalPages)}>Last</Button>
          </div>
        </div>
      </CardContainer>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CardContainer title="NetTV Packages" description="Available NetTV subscription packages" gradientColor="#3b82f6">
          <div className="max-h-[520px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4}><Skeleton className="h-7 w-full" /></TableCell></TableRow>
                ) : paginatedPackages.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">No packages found.</TableCell></TableRow>
                ) : (
                  paginatedPackages.map((pkg, index) => {
                    const status = valueOf(pkg, ["status", "state"], "Available")
                    return (
                      <TableRow key={`${valueOf(pkg, ["id", "package_id", "code"], String(index))}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{valueOf(pkg, ["name", "package_name", "title"])}</div>
                          <div className="text-xs text-muted-foreground">{valueOf(pkg, ["description", "duration", "validity"], "")}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{valueOf(pkg, ["code", "id", "package_id"])}</TableCell>
                        <TableCell>{valueOf(pkg, ["price", "amount", "rate", "mrp"])}</TableCell>
                        <TableCell><Badge variant={statusVariant(status)}>{status}</Badge></TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>Showing {paginatedPackages.length ? (packagePage - 1) * subLimit + 1 : 0} to {Math.min(packagePage * subLimit, packages.length)} of {packages.length}</div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={packagePage === 1} onClick={() => setPackagePage(1)}>First</Button>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={packagePage === 1} onClick={() => setPackagePage(prev => prev - 1)}>Prev</Button>
              <span className="px-1 text-[11px]">Page {packagePage} of {totalPackagePages}</span>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={packagePage === totalPackagePages} onClick={() => setPackagePage(prev => prev + 1)}>Next</Button>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={packagePage === totalPackagePages} onClick={() => setPackagePage(totalPackagePages)}>Last</Button>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="NetTV STBs" description="Set-top boxes linked with NetTV subscribers" gradientColor="#f59e0b">
          <div className="max-h-[520px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Subscriber</TableHead>
                  <TableHead>MAC / SN</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4}><Skeleton className="h-7 w-full" /></TableCell></TableRow>
                ) : paginatedStbs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">No STBs found.</TableCell></TableRow>
                ) : (
                  paginatedStbs.map((stb, index) => {
                    const status = valueOf(stb, ["status", "state"], "Unknown")
                    const modelName = stb?.model?.name || stb?.model_name || (typeof stb?.model === "string" ? stb.model : "N/A")
                    const vendorName = stb?.vendor?.name || stb?.vendor_name || (typeof stb?.vendor === "string" ? stb.vendor : "N/A")
                    const subscriberUsername = stb?.stb_user?.user?.username || stb?.username || stb?.subscriber_username || "N/A"
                    const ownerName = stb?.owner?.name || (typeof stb?.owner === "string" ? stb.owner : "N/A")
                    return (
                      <TableRow key={`${valueOf(stb, ["id", "serial", "serial_number", "mac"], String(index))}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{modelName}</div>
                          <div className="text-xs text-muted-foreground">{vendorName} · STB #{valueOf(stb, ["id", "stb_id", "device_id"], "N/A")}</div>
                        </TableCell>
                        <TableCell><div className="font-mono text-xs">{subscriberUsername}</div><div className="text-xs text-muted-foreground">{ownerName}</div></TableCell>
                        <TableCell><div className="font-mono text-xs">{stb.serial || stb.serial_number || "N/A"}</div><div className="text-xs text-muted-foreground">MAC: {stb.mac || stb.mac_address || "N/A"}</div></TableCell>
                        <TableCell><Badge variant={statusVariant(status)}>{status}</Badge></TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>Showing {paginatedStbs.length ? (stbPage - 1) * subLimit + 1 : 0} to {Math.min(stbPage * subLimit, stbs.length)} of {stbs.length}</div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={stbPage === 1} onClick={() => setStbPage(1)}>First</Button>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={stbPage === 1} onClick={() => setStbPage(prev => prev - 1)}>Prev</Button>
              <span className="px-1 text-[11px]">Page {stbPage} of {totalStbPages}</span>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={stbPage === totalStbPages} onClick={() => setStbPage(prev => prev + 1)}>Next</Button>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={stbPage === totalStbPages} onClick={() => setStbPage(totalStbPages)}>Last</Button>
            </div>
          </div>
        </CardContainer>
      </div>

      <NetTVDialog
        open={createOpen}
        onOpenChange={(open) => { if (!creatingSubscriber) setCreateOpen(open) }}
        onConfirm={createSubscriber}
      />
    </div>
  )
}
