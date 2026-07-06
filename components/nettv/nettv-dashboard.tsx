"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye, Loader2, Package, RefreshCw, Search, Tv, UserCheck, Users } from "lucide-react"
import { ServicesAPI } from "@/lib/api/service"
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

function DetailsBlock({ title, data }: { title: string; data: any }) {
  const entries = Object.entries(data || {}).filter(([, value]) => value !== null && value !== undefined && value !== "")
  if (entries.length === 0) return null

  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{key.replace(/_/g, " ")}</div>
            <div className="break-words text-sm font-medium">
              {typeof value === "object" ? JSON.stringify(value) : String(value)}
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
  const [selected, setSelected] = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selectedStbSerial, setSelectedStbSerial] = useState("")
  const [selectedPackageSaleId, setSelectedPackageSaleId] = useState("")
  const [packageQty, setPackageQty] = useState(1)
  const [paymentGateway, setPaymentGateway] = useState("reseller_wallet")
  const [assigningPackage, setAssigningPackage] = useState(false)
  const [stbLoading, setStbLoading] = useState(false)

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
      await openDetails(selected.subscriber)
      setSelectedPackageSaleId("")
    } catch (error: any) {
      toast.error(error.message || "Failed to assign NetTV package")
    } finally {
      setAssigningPackage(false)
    }
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
        actions={[{ label: "Refresh", onClick: fetchData, icon: <RefreshCw className="h-4 w-4" />, variant: "outline" }]}
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
                ) : packages.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">No packages found.</TableCell></TableRow>
                ) : (
                  packages.map((pkg, index) => {
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
                ) : stbs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">No STBs found.</TableCell></TableRow>
                ) : (
                  stbs.map((stb, index) => {
                    const status = valueOf(stb, ["status", "state"], "Unknown")
                    return (
                      <TableRow key={`${valueOf(stb, ["id", "serial", "serial_number", "mac"], String(index))}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{valueOf(stb, ["model", "device", "name", "type"])}</div>
                          <div className="text-xs text-muted-foreground">{valueOf(stb, ["id", "stb_id", "device_id"], "")}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{valueOf(stb, ["username", "subscriber_username", "subscriber_id"])}</TableCell>
                        <TableCell className="font-mono text-xs">{valueOf(stb, ["mac", "mac_address", "serial", "serial_number"])}</TableCell>
                        <TableCell><Badge variant={statusVariant(status)}>{status}</Badge></TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContainer>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>NetTV Subscriber Details</DialogTitle>
            <DialogDescription>{selected ? valueOf(selected?.subscriber || selected, ["username", "user_name", "customer_username"]) : ""}</DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading details...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Subscriber</div><div className="font-semibold">{fullName(selected?.subscriber)}</div><div className="font-mono text-xs">{selected?.subscriber?.username}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Contact</div><div className="font-semibold">{selected?.subscriber?.details?.mobile_no || selected?.subscriber?.details?.phone_no || "N/A"}</div><div className="text-xs">{selected?.subscriber?.email || "N/A"}</div></div>
                <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Reseller Balance</div><div className="text-xl font-bold">{selected?.reseller?.credit_balance?.credit_balance ?? selected?.subscriber?.balance ?? 0}</div><div className="text-xs">Reseller #{selected?.reseller?.id || "N/A"}</div></div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1 space-y-1"><Label>Select STB</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={selectedStbSerial} onChange={(event) => { setSelectedStbSerial(event.target.value); setSelectedPackageSaleId("") }}><option value="">Select device</option>{(selected?.stbs || []).map((stb: any) => <option key={stb.serial} value={stb.serial}>{stb.serial} · {stb.model?.name || stb.model || "STB"}</option>)}</select></div>
                  <Button type="button" variant="outline" onClick={refreshSelectedStb} disabled={!selectedStbSerial || stbLoading}>{stbLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Get STB Details</Button>
                </div>
                {selectedStb ? (
                  <div className="grid gap-2 text-sm md:grid-cols-4">
                    <div><div className="text-xs text-muted-foreground">Serial</div><div className="break-all font-mono">{selectedStb.serial}</div></div>
                    <div><div className="text-xs text-muted-foreground">Status</div><Badge variant={statusVariant(String(selectedStb.status || "unknown"))}>{selectedStb.status || "unknown"}</Badge></div>
                    <div><div className="text-xs text-muted-foreground">Vendor</div><div className="font-medium">{selectedStb.vendor?.name || selectedStb.vendor || "N/A"}</div></div>
                    <div><div className="text-xs text-muted-foreground">Model</div><div className="font-medium">{selectedStb.model?.name || selectedStb.model || "N/A"}</div></div>
                  </div>
                ) : <p className="text-sm text-muted-foreground">No STB linked to this subscriber.</p>}
              </div>

              {selectedStb && <div className="rounded-lg border p-4">
                <div className="mb-3 font-semibold">Assign Package</div>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-1 md:col-span-2"><Label>Package</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={selectedPackageSaleId} onChange={(event) => setSelectedPackageSaleId(event.target.value)}><option value="">Select package configuration</option>{packageConfigs.map((config: any) => <option key={config.id} value={config.id}>{config.package_name || "Package"} · {config.display_name} · {config.duration} · Rs. {config.price_with_vat ?? config.price ?? 0}</option>)}</select></div>
                  <div className="space-y-1"><Label>Payment</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={paymentGateway} onChange={(event) => setPaymentGateway(event.target.value)}><option value="reseller_wallet">Reseller Wallet</option><option value="wallet">Subscriber Wallet</option></select></div>
                  <div className="space-y-1"><Label>Quantity</Label><Input type="number" min={1} value={packageQty} onChange={(event) => setPackageQty(Math.max(1, Number(event.target.value)))} /></div>
                </div>
                <Button type="button" className="mt-3" onClick={assignPackage} disabled={assigningPackage || !selectedPackageSaleId}>{assigningPackage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Assign Selected Package</Button>
              </div>}

              {selectedStb && <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border p-4"><div className="mb-2 font-semibold">Subscribed Packages</div><div className="space-y-2">{(selectedStb.subscribed_packages || []).map((pkg: any) => <div key={pkg.id} className="rounded-md bg-muted/40 p-3"><div className="font-medium">{pkg.package_config_name}</div><div className="text-xs text-muted-foreground">Package #{pkg.package_id} · {pkg.package_subscription_details?.[0]?.expiry_date ? `Expires ${pkg.package_subscription_details[0].expiry_date}` : "No expiry"}</div></div>)}{!selectedStb.subscribed_packages?.length && <p className="text-sm text-muted-foreground">No subscribed packages.</p>}</div></div>
                <div className="rounded-lg border p-4"><div className="mb-2 font-semibold">Active Orders</div><div className="space-y-2">{(selectedStb.active_package || []).map((pkg: any) => <div key={pkg.id} className="rounded-md bg-muted/40 p-3"><div className="flex justify-between"><span className="font-medium">{pkg.name}</span><Badge variant={statusVariant(String(pkg.status || "unknown"))}>{pkg.status}</Badge></div><div className="text-xs text-muted-foreground">Order #{pkg.id} · Qty {pkg.qty} · {pkg.total_with_vat}</div></div>)}{!selectedStb.active_package?.length && <p className="text-sm text-muted-foreground">No active orders.</p>}</div></div>
              </div>}

              {selectedStb?.bootstrap?.services?.length > 0 && <div className="rounded-lg border p-4"><div className="mb-2 font-semibold">Device Services</div><div className="flex flex-wrap gap-2">{selectedStb.bootstrap.services.map((service: any) => <Badge key={service.name} variant="outline" title={service.baseURL}>{service.name}</Badge>)}</div></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
