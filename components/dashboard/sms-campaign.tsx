"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Send, 
  Users, 
  Search, 
  Filter, 
  Loader2, 
  MessageSquare, 
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Network,
  GitBranch,
  MapPin,
  ScanLine,
  Clock,
  XCircle,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { apiRequest } from "@/lib/api"
import { SearchableSelect } from "@/components/ui/searchable-select"

export function SmsCampaign() {
  const [recipientType, setRecipientType] = useState("customer")
  const [filters, setFilters] = useState({
    oltId: "all",
    splitterId: "all",
    area: "",
    status: "all"
  })
  const [selectedHeadOffices, setSelectedHeadOffices] = useState<number[]>([])
  const [selectedBranches, setSelectedBranches] = useState<number[]>([])
  const [selectedSubBranches, setSelectedSubBranches] = useState<number[]>([])
  const [message, setMessage] = useState("")
  const [allBranchData, setAllBranchData] = useState<any[]>([])
  const [olts, setOlts] = useState<any[]>([])
  const [splitters, setSplitters] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [recipients, setRecipients] = useState<any[]>([])
  const [credit, setCredit] = useState<any>(null)
  const [smsProviders, setSmsProviders] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [includeAllMatching, setIncludeAllMatching] = useState(true)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [campaignLogs, setCampaignLogs] = useState<any[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null)
  const [logsLoading, setLogsLoading] = useState(false)

  // Derive hierarchy: Head Office (parentId null) -> Branches -> Sub-Branches
  const headOffices = React.useMemo(() => allBranchData.filter((b: any) => b.parentId === null), [allBranchData])
  const headOfficeIds = React.useMemo(() => headOffices.map((b: any) => b.id), [headOffices])
  const branches = React.useMemo(
    () => allBranchData.filter((b: any) => b.parentId !== null && headOfficeIds.includes(b.parentId)),
    [allBranchData, headOfficeIds]
  )
  const branchIds = React.useMemo(() => branches.map((b: any) => b.id), [branches])

  const branchChildrenByParent = React.useMemo(() => {
    const map = new Map<number, any[]>()
    allBranchData.forEach((branch: any) => {
      if (branch.parentId === null || branch.parentId === undefined) return
      const parentId = Number(branch.parentId)
      map.set(parentId, [...(map.get(parentId) || []), branch])
    })
    return map
  }, [allBranchData])

  const getDescendantBranchIds = useCallback((parentIds: number[]) => {
    const descendants = new Set<number>()
    const stack = [...parentIds]

    while (stack.length > 0) {
      const parentId = stack.pop()
      if (parentId === undefined) continue

      for (const child of branchChildrenByParent.get(Number(parentId)) || []) {
        const childId = Number(child.id)
        if (!descendants.has(childId)) {
          descendants.add(childId)
          stack.push(childId)
        }
      }
    }

    return Array.from(descendants)
  }, [branchChildrenByParent])

  const getBranchPath = useCallback((branch: any) => {
    const byId = new Map<number, any>(allBranchData.map((item: any) => [Number(item.id), item]))
    const names = [branch.name]
    let parent = branch.parentId ? byId.get(Number(branch.parentId)) : null

    while (parent) {
      names.unshift(parent.name)
      parent = parent.parentId ? byId.get(Number(parent.parentId)) : null
    }

    return names.join(" / ")
  }, [allBranchData])

  const branchOptions = React.useMemo(() => {
    if (selectedHeadOffices.length === 0) return branches
    return branches.filter((branch: any) => selectedHeadOffices.includes(Number(branch.parentId)))
  }, [branches, selectedHeadOffices])

  const subBranchOptions = React.useMemo(() => {
    const directBranchIds = branchOptions.map((branch: any) => Number(branch.id))
    const seedIds = selectedBranches.length > 0 ? selectedBranches : directBranchIds.length > 0 ? directBranchIds : branchIds
    const descendantIds = new Set(getDescendantBranchIds(seedIds))
    return allBranchData.filter((branch: any) => descendantIds.has(Number(branch.id)))
  }, [allBranchData, branchIds, branchOptions, getDescendantBranchIds, selectedBranches])

  const getSelectedBranchScope = useCallback(() => {
    const selectedIds = new Set<number>([
      ...selectedHeadOffices,
      ...selectedBranches,
      ...selectedSubBranches,
    ])

    getDescendantBranchIds(Array.from(selectedIds)).forEach((id) => selectedIds.add(id))
    return selectedIds
  }, [getDescendantBranchIds, selectedBranches, selectedHeadOffices, selectedSubBranches])

  useEffect(() => {
    fetchBranches()
    fetchOlts()
    fetchSplitters()
    fetchSmsProviders()
    fetchCampaigns()
  }, [])

  // Fetch recipients when filters change
  useEffect(() => {
    fetchRecipients()
  }, [recipientType, filters, selectedHeadOffices, selectedBranches, selectedSubBranches])

  useEffect(() => {
    const hasActiveCampaign = campaigns.some((campaign) => ["queued", "processing"].includes(campaign.status))
    if (!hasActiveCampaign) return

    const interval = window.setInterval(() => {
      fetchCampaigns()
      if (selectedCampaignId) fetchCampaignLogs(selectedCampaignId)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [campaigns, selectedCampaignId])

  const fetchBranches = async () => {
    try {
      const res = await apiRequest<any[]>("/branch")
      setAllBranchData(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error("Failed to fetch branches")
    }
  }

  const fetchOlts = async () => {
    try {
      const res = await apiRequest<any>("/olt")
      const list = Array.isArray(res) ? res : (res?.data || [])
      setOlts(list)
    } catch (err) {
      console.error("Failed to fetch OLTs")
    }
  }

  const fetchSplitters = async () => {
    try {
      const res = await apiRequest<any>("/splitters")
      const list = Array.isArray(res) ? res : (res?.data || res?.splitters || [])
      setSplitters(list)
    } catch (err) {
      console.error("Failed to fetch splitters")
    }
  }

  const fetchSmsProviders = async () => {
    try {
      const res = await apiRequest<any>("/service/isp?includeInactive=true")
      const list = res.data || res || []
      const providers = list.filter((s: any) => 
        s.service?.code === "AAKASHSMS" || s.service?.code === "SPARROWSMS"
      )
      setSmsProviders(providers)
      
      const defaultProvider = providers.find((p: any) => p.config?.isDefault === true) || providers[0]
      if (defaultProvider) {
        setSelectedProvider(defaultProvider.service.code)
        fetchCredit(defaultProvider.service.code)
      }
    } catch (err) {
      console.error("Failed to fetch SMS providers")
    }
  }

  const fetchCampaigns = async () => {
    try {
      const res = await apiRequest<any>("/service/sms/campaigns?limit=10")
      const list = Array.isArray(res) ? res : (res?.data || [])
      setCampaigns(list)
      const active = list.find((campaign: any) => ["queued", "processing"].includes(campaign.status))
      if (active) {
        setSelectedCampaignId(active.id)
        fetchCampaignLogs(active.id)
      }
    } catch (err) {
      console.error("Failed to fetch SMS campaigns")
    }
  }

  const fetchCampaignLogs = async (campaignId: number) => {
    setLogsLoading(true)
    try {
      const res = await apiRequest<any>(`/service/sms/campaigns/${campaignId}/logs?limit=100`)
      setCampaignLogs(res?.data || [])
    } catch (err) {
      console.error("Failed to fetch SMS campaign logs")
    } finally {
      setLogsLoading(false)
    }
  }

  const fetchCredit = async (providerCode?: string) => {
    const code = providerCode || selectedProvider
    if (!code) return
    try {
      const res = await apiRequest<any>(`/service/sms/credit?provider=${code}`)
      setCredit(res?.data || res)
    } catch (err) {
      console.error("Failed to fetch SMS credit")
    }
  }

  const handleProviderChange = (value: string) => {
    setSelectedProvider(value)
    fetchCredit(value)
  }

  const fetchRecipients = useCallback(async () => {
    setLoading(true)
    try {
      const endpoint = recipientType === "customer" ? "/customer" : "/lead"
      const params = new URLSearchParams({ limit: "all" })
      if (filters.status !== "all") params.append("status", filters.status)
      if (recipientType === "customer") {
        if (filters.oltId !== "all") params.append("oltId", filters.oltId)
        if (filters.splitterId !== "all") params.append("splitterId", filters.splitterId)
        if (filters.area) params.append("area", filters.area)
      } else {
        if (filters.area) params.append("area", filters.area)
      }

      const res = await apiRequest<any>(`${endpoint}?${params.toString()}`)
      const raw = Array.isArray(res) ? res : (res?.data || [])

      // Filter locally so Head Office selection includes every nested branch below it.
      let filteredRaw = raw
      const scopedBranchIds = getSelectedBranchScope()

      if (scopedBranchIds.size > 0) {
        filteredRaw = filteredRaw.filter((item: any) => {
          const itemBranchId = Number(item.branchId || item.branch?.id || item.lead?.branchId || item.lead?.branch?.id || 0)
          const itemSubBranchId = Number(item.subBranchId || item.subBranch?.id || item.lead?.subBranchId || item.lead?.subBranch?.id || 0)

          return scopedBranchIds.has(itemBranchId) || scopedBranchIds.has(itemSubBranchId)
        })
      }

      // Extract phone numbers
      const data = recipientType === "customer"
        ? filteredRaw.map((c: any) => ({
            name: c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : `${c.lead?.firstName || ""} ${c.lead?.lastName || ""}`.trim(),
            phone: c.phoneNumber || c.lead?.phoneNumber
          }))
        : filteredRaw.map((l: any) => ({
            name: `${l.firstName || ""} ${l.lastName || ""}`.trim(),
            phone: l.phoneNumber
          }))

      setRecipients(data.filter((r: any) => r.phone))
    } catch (err) {
      console.error("Failed to fetch recipients")
    } finally {
      setLoading(false)
    }
  }, [recipientType, filters, getSelectedBranchScope])

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please write a message before sending.")
      return
    }
    if (!includeAllMatching && recipients.length === 0) {
      toast.error("No recipients found with valid phone numbers.")
      return
    }
    if (!selectedProvider) {
      toast.error("No SMS provider selected.")
      return
    }

    setSending(true)
    try {
      const phones = recipients.map(r => r.phone)
      const scopedBranchIds = Array.from(getSelectedBranchScope())
      const campaignFilters: any = {
        status: filters.status,
        area: filters.area,
        branchIds: scopedBranchIds,
      }

      if (recipientType === "customer") {
        campaignFilters.oltId = filters.oltId
        campaignFilters.splitterId = filters.splitterId
      }

      const res = await apiRequest<any>("/service/sms/campaigns", {
        method: "POST",
        body: JSON.stringify({
          to: phones,
          text: message,
          type: recipientType,
          provider: selectedProvider,
          selectAll: includeAllMatching,
          filters: campaignFilters,
        })
      })
      const queued = res?.data?.queuedCount || 0
      const skipped = res?.data?.skippedCount || 0
      toast.success(`SMS campaign queued for ${queued} recipients${skipped ? `, ${skipped} skipped` : ""}.`)
      setMessage("")
      fetchCredit(selectedProvider)
      fetchCampaigns()
    } catch (err: any) {
      toast.error(err.message || "Failed to queue SMS campaign")
    } finally {
      setSending(false)
    }
  }

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({ oltId: "all", splitterId: "all", area: "", status: "all" })
    setSelectedHeadOffices([])
    setSelectedBranches([])
    setSelectedSubBranches([])
  }

  const activeFilterCount = [
    selectedHeadOffices.length > 0,
    selectedBranches.length > 0,
    selectedSubBranches.length > 0,
    filters.oltId !== "all",
    filters.splitterId !== "all",
    filters.area !== "",
    filters.status !== "all",
  ].filter(Boolean).length

  const activeCampaign = campaigns.find((campaign) => selectedCampaignId ? campaign.id === selectedCampaignId : ["queued", "processing"].includes(campaign.status))

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bulk SMS Campaign</h1>
          <p className="text-muted-foreground">Broadcast messages to your customers and leads instantly.</p>
        </div>
        {credit && (
          <Card className="bg-emerald-500/10 border-emerald-500/20 p-4 flex items-center gap-4">
            <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-500">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Available Credit</p>
              <p className="text-xl font-bold text-foreground">{credit.available_credit || 0}</p>
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Filters */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2 text-base">
                <Filter className="h-5 w-5 text-blue-500" />
                Target Audience
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{activeFilterCount} active</Badge>
                )}
              </CardTitle>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground" onClick={resetFilters}>
                  Clear all
                </Button>
              )}
            </div>
            <CardDescription>Select who you want to reach</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Recipient Type</Label>
              <Select value={recipientType} onValueChange={(val) => {
                setRecipientType(val)
                setFilters(prev => ({ ...prev, status: "all", oltId: "all", splitterId: "all" }))
              }}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">
                    <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />Active Customers</div>
                  </SelectItem>
                  <SelectItem value="lead">
                    <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-muted-foreground" />Potential Leads</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Head Office Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="h-3 w-3" /> Head Office
              </Label>
              <SearchableSelect
                options={headOffices.map((office: any) => ({
                  value: String(office.id),
                  label: office.name,
                  description: office.code || "Root office"
                }))}
                value={selectedHeadOffices.map(String)}
                onValueChange={(val) => {
                  const newHeadOfficeIds = (val as string[]).map(Number)
                  const allowedBranchIds = new Set(
                    branches
                      .filter((branch: any) => newHeadOfficeIds.length === 0 || newHeadOfficeIds.includes(Number(branch.parentId)))
                      .map((branch: any) => Number(branch.id))
                  )

                  setSelectedHeadOffices(newHeadOfficeIds)
                  setSelectedBranches((prev) => prev.filter((id) => allowedBranchIds.has(id)))
                  setSelectedSubBranches((prev) => {
                    const allowedDescendants = new Set(getDescendantBranchIds(Array.from(allowedBranchIds)))
                    return prev.filter((id) => allowedDescendants.has(id))
                  })
                }}
                placeholder="Select head office"
                multiple
                clearable
              />
            </div>

            {/* Branch Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="h-3 w-3" /> Branches
              </Label>
              <SearchableSelect
                options={branchOptions.map((b: any) => ({
                  value: String(b.id),
                  label: b.name,
                  description: getBranchPath(b)
                }))}
                value={selectedBranches.map(String)}
                onValueChange={(val) => {
                  const newBranchIds = (val as string[]).map(Number)
                  setSelectedBranches(newBranchIds)
                  const allowedSubBranchIds = new Set(getDescendantBranchIds(newBranchIds.length > 0 ? newBranchIds : branchOptions.map((branch: any) => Number(branch.id))))
                  setSelectedSubBranches((prev) =>
                    prev.filter((id) => allowedSubBranchIds.has(id))
                  )
                }}
                placeholder="Select branches"
                multiple
                clearable
                disabled={branchOptions.length === 0}
              />
            </div>

            {/* Sub-Branch Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="h-3 w-3 rotate-90" /> Sub-Branches
              </Label>
              <SearchableSelect
                options={subBranchOptions.map((sb: any) => ({
                  value: String(sb.id),
                  label: sb.name,
                  description: getBranchPath(sb)
                }))}
                value={selectedSubBranches.map(String)}
                onValueChange={(val) => setSelectedSubBranches((val as string[]).map(Number))}
                placeholder="Select sub-branches"
                multiple
                clearable
                disabled={subBranchOptions.length === 0}
              />
            </div>

            {/* OLT Filter — only for customers */}
            {recipientType === "customer" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                  <Network className="h-3 w-3" /> OLT
                </Label>
                <Select value={filters.oltId} onValueChange={(val) => updateFilter("oltId", val)}>
                  <SelectTrigger className="bg-background border-input text-foreground">
                    <SelectValue placeholder="All OLTs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All OLTs</SelectItem>
                    {olts.map((o: any) => (
                      <SelectItem key={o.id} value={o.id.toString()}>{o.name || o.host || `OLT-${o.id}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Splitter Filter — only for customers */}
            {recipientType === "customer" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                  <ScanLine className="h-3 w-3" /> Splitter
                </Label>
                <Select value={filters.splitterId} onValueChange={(val) => updateFilter("splitterId", val)}>
                  <SelectTrigger className="bg-background border-input text-foreground">
                    <SelectValue placeholder="All Splitters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Splitters</SelectItem>
                    {splitters.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.splitterId || s.name || `SPL-${s.id}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Area / Location Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Area / Location
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="City, district or street..."
                  className="pl-9 bg-background border-input"
                  value={filters.area}
                  onChange={(e) => updateFilter("area", e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Status</Label>
              <Select value={filters.status} onValueChange={(val) => updateFilter("status", val)}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {recipientType === "customer" ? (
                    <>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="unqualified">Unqualified</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Recipients Summary */}
            <div className="p-4 rounded-lg bg-blue-600/5 border border-blue-600/20 mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground font-medium">Selected Recipients</span>
                <Badge variant="outline" className="bg-blue-600/10 text-blue-600 border-blue-600/20 font-bold">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : recipients.length}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                {includeAllMatching ? "All matching valid mobile numbers will be targeted." : "Only loaded recipients with valid mobile numbers will be targeted."}
              </p>
              <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={fetchRecipients} disabled={loading}>
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Message Composer */}
        <Card className="lg:col-span-2 bg-card border-border shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
              Compose Message
            </CardTitle>
            <CardDescription>What would you like to say?</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {/* SMS Provider Selection */}
            <div className="space-y-1.5 pb-4 border-b border-border/50">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">SMS Provider Selection</Label>
              {smsProviders.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <Select value={selectedProvider} onValueChange={handleProviderChange}>
                    <SelectTrigger className="bg-background border-input text-foreground max-w-[240px]">
                      <SelectValue placeholder="Select SMS Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {smsProviders.map((provider) => (
                        <SelectItem key={provider.service.code} value={provider.service.code}>
                          {provider.service.name} {provider.config?.isDefault && "(Default)"} {provider.isActive === false && "(Inactive)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {credit && (
                    <div className="text-sm text-muted-foreground">
                      Available Credit: <span className="font-bold text-foreground">{credit.available_credit || 0}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600">
                  No SMS providers configured. Please configure Aakash SMS or Sparrow SMS in settings.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground/80">Message Text</label>
                <span className="text-xs text-muted-foreground">{message.length} characters</span>
              </div>
              <Textarea
                placeholder="Type your message here..."
                className="min-h-[250px] bg-background border-input text-foreground focus:ring-emerald-500/50"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { label: "+ First Name", token: "{firstName}" },
                  { label: "+ Last Name", token: "{lastName}" },
                  { label: "+ Expiry Date", token: "{expiryDate}" },
                  { label: "+ Due Amount", token: "{amount}" },
                  { label: "+ Package", token: "{package}" },
                ].map(({ label, token }) => (
                  <Button
                    key={token}
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    onClick={() => setMessage(prev => prev + token)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-border mt-auto">
              <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3 mb-4">
                <Checkbox
                  id="include-all-matching"
                  checked={includeAllMatching}
                  onCheckedChange={(checked) => setIncludeAllMatching(checked === true)}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label htmlFor="include-all-matching" className="text-sm font-medium">
                    Select every matching recipient
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sends to all leads/customers matching these filters, not only the loaded preview.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 text-amber-600 bg-amber-500/5 px-3 py-1.5 rounded-full border border-amber-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Estimated Cost: {includeAllMatching ? "All matching recipients" : `${recipients.length} Credits`}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Service Status: Online</span>
                </div>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                onClick={handleSend}
                disabled={sending || loading || (!includeAllMatching && recipients.length === 0) || !message.trim()}
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Queueing Campaign...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Queue SMS Campaign ({includeAllMatching ? "all matching" : `${recipients.length} recipients`})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-indigo-500" />
                Campaign Queue & Logs
              </CardTitle>
              <CardDescription>Track queued, sent, failed, and skipped campaign recipients.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchCampaigns} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4">
              No SMS campaigns found yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    type="button"
                    className={`w-full text-left rounded-md border p-3 transition-colors ${selectedCampaignId === campaign.id || (!selectedCampaignId && activeCampaign?.id === campaign.id) ? "border-indigo-500 bg-indigo-500/5" : "border-border hover:bg-muted/50"}`}
                    onClick={() => {
                      setSelectedCampaignId(campaign.id)
                      fetchCampaignLogs(campaign.id)
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">Campaign #{campaign.id}</span>
                      <Badge variant={campaign.status === "completed" ? "default" : campaign.status === "failed" ? "destructive" : "secondary"}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-muted-foreground">
                      <span>Q {campaign.queuedCount}</span>
                      <span className="text-emerald-600">S {campaign.sentCount}</span>
                      <span className="text-red-600">F {campaign.failedCount}</span>
                      <span>Skip {campaign.skippedCount}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-2 border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : campaignLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          Select a campaign to view logs.
                        </TableCell>
                      </TableRow>
                    ) : (
                      campaignLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">{log.phone}</TableCell>
                          <TableCell className="text-xs">{log.name || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={log.status === "sent" ? "default" : log.status === "failed" ? "destructive" : "secondary"} className="gap-1">
                              {log.status === "sent" && <CheckCircle2 className="h-3 w-3" />}
                              {log.status === "failed" && <XCircle className="h-3 w-3" />}
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">{log.errorMessage || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
