"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Save, X, Zap, Download, Upload, Infinity, RefreshCw, PlusCircle, MinusCircle, LayoutList, Columns, Eye, ChevronDown, Search, TrendingUp } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Pagination } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiRequest } from "@/lib/api"

export type InternetPlan = {
  id: string
  name: string
  code: string
  connectionType: number
  downloadSpeed: number
  uploadSpeed: number
  intUpload: number
  firDownload: number
  localUpload: number
  localDownload: number
  dataLimit: number
  price: number
  isPopular: boolean
  description: string
  deviceLimit?: number
  nasType: string
  service: string
  priority: string
  vendorProfiles: { vendor: string; profile: string }[]
  packageType: string
  allowRename: boolean
  fupApply: boolean
  fupLimitGb: number
  fupPenaltyPlanId: number
  isFupPackage: boolean
  onlyRenewal: boolean
  applyFramedPool: boolean
  framedPoolValue: string
  customRadiusAttributes: { attribute: string; op: string; value: string }[]
  maxDiscountPercentage: number
  maxDiscountCount: number
  highPriority: boolean
  branchIds: number[]
  isActive?: boolean
  upgradePlanIds?: number[]
}

export type ISPType = {
  id: number
  name: string
  code: string
  description: string
  icon: string
  isEnabled: boolean
  isExtra: boolean
}

type BranchItem = {
  id: number
  name: string
  code: string
  parentId?: number | null
}

type RadiusPool = {
  name: string
  value: string
  description?: string
  isActive?: boolean
}

const NAS_TYPES = ["cisco", "juniper", "mikrotik", "nokia"]
const PACKAGE_TYPES = ["HOME", "BUSINESS", "CORPORATE", "ENTERPRISE", "STUDENT", "TRIAL"]
const OP_OPTIONS = [":=", "=", "==", "+=", "!=", ">", ">=", "<", "<=", "=~", "!~", "=*", "!*"]

const DEFAULT_VENDOR_PROFILE: Record<string, string> = {
  juniper: "x-ppp-profile",
  nokia: "",
}

const DEFAULT_PLAN: Omit<InternetPlan, "id"> = {
  name: "",
  code: "",
  connectionType: 0,
  downloadSpeed: 0,
  uploadSpeed: 0,
  intUpload: 0,
  firDownload: 0,
  localUpload: 0,
  localDownload: 0,
  dataLimit: 0,
  price: 0,
  isPopular: false,
  description: "",
  deviceLimit: 1,
  nasType: "",
  service: "",
  priority: "",
  vendorProfiles: [],
  packageType: "",
  allowRename: false,
  fupApply: true,
  fupLimitGb: 0,
  fupPenaltyPlanId: 0,
  isFupPackage: false,
  onlyRenewal: false,
  applyFramedPool: false,
  framedPoolValue: "",
  customRadiusAttributes: [],
  maxDiscountPercentage: 100,
  maxDiscountCount: 0,
  highPriority: false,
  branchIds: [],
  isActive: true,
  upgradePlanIds: [],
}

export function InternetPlansSettings() {
  const [ispTypes, setIspTypes] = useState<ISPType[]>([])
  const [internetPlans, setInternetPlans] = useState<InternetPlan[]>([])
  const [branches, setBranches] = useState<BranchItem[]>([])
  const [radiusPools, setRadiusPools] = useState<RadiusPool[]>([])
  const [ispInfo, setIspInfo] = useState<{ id: number; companyName: string } | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newPlan, setNewPlan] = useState(DEFAULT_PLAN)
  const [isResyncing, setIsResyncing] = useState(false)
  const [viewMode, setViewMode] = useState<"current" | "classic">("current")
  const [currentSearch, setCurrentSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [orgSearch, setOrgSearch] = useState("")

  // Classic view filters & UI state
  const [classicSearch, setClassicSearch] = useState("")
  const [classicBranchFilter, setClassicBranchFilter] = useState("all")
  const [classicFupFilter, setClassicFupFilter] = useState("all")
  const [classicRenewFilter, setClassicRenewFilter] = useState("all")
  const [classicStatusFilter, setClassicStatusFilter] = useState("all")
  const [classicPkgTypeFilter, setClassicPkgTypeFilter] = useState("all")
  const [classicServiceFilter, setClassicServiceFilter] = useState("all")
  const [openActionPlanId, setOpenActionPlanId] = useState<string | null>(null)
  const [showColumnSetup, setShowColumnSetup] = useState(false)
  const [classicColumns, setClassicColumns] = useState<Record<string, boolean>>({
    service: true,
    packageType: true,
    intlUp: true,
    intlDown: true,
    localUp: true,
    localDown: true,
    organizations: true,
    branches: true,
    description: true,
    commission: true,
    isFup: true,
    iptv: true,
    allowRenew: true,
    onlineGw: true,
    status: true,
  })

  // Manage Upgrade Plans Modal state
  const [upgradeModalPlan, setUpgradeModalPlan] = useState<InternetPlan | null>(null)
  const [selectedUpgradePlanIds, setSelectedUpgradePlanIds] = useState<number[]>([])
  const [upgradeModalTab, setUpgradeModalTab] = useState<"upgrade" | "online">("upgrade")
  const [upgradePlanSearch, setUpgradePlanSearch] = useState("")
  const [savingUpgradePlans, setSavingUpgradePlans] = useState(false)
  const [branchesModalPlan, setBranchesModalPlan] = useState<InternetPlan | null>(null)

  // Load ISP types
  useEffect(() => {
    async function loadTypes() {
      try {
        const raw = await apiRequest("/connection")
        if (!Array.isArray(raw)) throw new Error("Expected array from API")
        const mapped: ISPType[] = raw.map((r: any) => ({
          id: Number(r.id),
          name: r.name,
          code: r.code,
          description: r.description ?? "",
          icon: r.iconUrl ?? "",
          isEnabled: Boolean(r.isActive),
          isExtra: Boolean(r.isExtra),
        }))
        setIspTypes(mapped)
      } catch (err) {
        console.error("Failed to load ISP types", err)
        setIspTypes([])
      }
    }
    loadTypes()
  }, [])

  // Load branches
  useEffect(() => {
    async function loadBranches() {
      try {
        const raw = await apiRequest("/branches")
        if (Array.isArray(raw)) {
          setBranches(raw.map((b: any) => ({ id: b.id, name: b.name, code: b.code, parentId: b.parentId ?? null })))
        }
      } catch (err) {
        console.error("Failed to load branches", err)
      }
    }
    loadBranches()
  }, [])

  // Load ISP info
  useEffect(() => {
    async function loadIsp() {
      try {
        const raw = await apiRequest("/isp/active")
        if (raw?.data) {
          setIspInfo({ id: raw.data.id, companyName: raw.data.companyName })
        }
      } catch (err) {
        console.error("Failed to load ISP info", err)
      }
    }
    loadIsp()
  }, [])

  useEffect(() => {
    async function loadPools() {
      try {
        const response = await apiRequest<{ success: boolean; data: RadiusPool[] }>("/settings/radius-pools")
        setRadiusPools(Array.isArray(response?.data) ? response.data.filter(pool => pool.isActive !== false) : [])
      } catch (err) {
        console.error("Failed to load RADIUS pools", err)
        setRadiusPools([])
      }
    }
    loadPools()
  }, [])

  const ISP_TYPE_OPTIONS: Option[] = ispTypes.map((t) => ({
    value: String(t.id),
    label: t.name,
  }))

  const pkgplans = async () => {
    try {
      const raw = await apiRequest("/pkgplan")
      if (!Array.isArray(raw)) throw new Error("Expected array from API.")
      const mapped: InternetPlan[] = raw.map((r: any) => ({
        id: String(r.id),
        name: r.planName,
        code: r.planCode,
        connectionType: Number(r.connectionTypeDetails?.id ?? r.connectionType ?? 0),
        downloadSpeed: Number(r.downSpeed ?? 0),
        uploadSpeed: Number(r.upSpeed ?? 0),
        intUpload: Number(r.intUpload ?? 0),
        firDownload: Number(r.firDownload ?? 0),
        localUpload: Number(r.localUpload ?? 0),
        localDownload: Number(r.localDownload ?? 0),
        dataLimit: Number(r.dataLimit ?? 0),
        price: Number(r.price ?? 0),
        isPopular: Boolean(r.isPopular),
        description: String(r.description ?? ""),
        deviceLimit: Number(r.deviceLimit ?? r.numDevices ?? 1),
        nasType: r.nasType || "",
        service: r.service || "",
        priority: r.priority || "",
        vendorProfiles: Array.isArray(r.vendorProfiles) ? r.vendorProfiles.map((vp: any) => ({ vendor: String(vp.vendor || '').toLowerCase(), profile: String(vp.profile || '') })) : [],
        packageType: r.packageType || "",
        allowRename: Boolean(r.allowRename),
        fupApply: r.fupApply !== undefined ? Boolean(r.fupApply) : true,
        fupLimitGb: Number(r.fupLimitGb ?? 0),
        fupPenaltyPlanId: Number(r.fupPenaltyPlanId ?? 0),
        isFupPackage: Boolean(r.isFupPackage),
        onlyRenewal: Boolean(r.onlyRenewal),
        applyFramedPool: Boolean(r.applyFramedPool),
        framedPoolValue: r.framedPoolValue || "",
        customRadiusAttributes: Array.isArray(r.customRadiusAttributes) ? r.customRadiusAttributes : [],
        maxDiscountPercentage: Number(r.maxDiscountPercentage ?? 100),
        maxDiscountCount: Number(r.maxDiscountCount ?? 0),
        highPriority: Boolean(r.highPriority),
        branchIds: Array.isArray(r.branches) ? r.branches.map((b: any) => b.branchId || b.branch?.id) : [],
        isActive: r.isActive !== false,
        upgradePlanIds: (() => {
          const rawUpg = typeof r.upgradePlanIds === "string"
            ? (() => { try { return JSON.parse(r.upgradePlanIds) } catch { return [] } })()
            : r.upgradePlanIds
          return Array.isArray(rawUpg)
            ? rawUpg.map(Number).filter((id: number) => Number.isInteger(id) && id > 0)
            : []
        })(),
      }))
      setInternetPlans(mapped)
    } catch (err) {
      console.error("Failed to load package plans", err)
      setInternetPlans([])
    }
  }

  useEffect(() => {
    pkgplans()
  }, [])

  const resetForm = () => setNewPlan(DEFAULT_PLAN)

  const validateForm = () => {
    if (!newPlan.name || !newPlan.code || !newPlan.connectionType) {
      toast.error("Name, code, and Connection Type are required")
      return false
    }
    return true
  }

  const buildPayload = () => ({
    planName: newPlan.name,
    planCode: newPlan.code,
    connectionType: newPlan.connectionType,
    dataLimit: newPlan.dataLimit,
    downSpeed: newPlan.downloadSpeed,
    upSpeed: newPlan.uploadSpeed,
    intUpload: newPlan.intUpload || null,
    firDownload: newPlan.firDownload || null,
    localUpload: newPlan.localUpload || null,
    localDownload: newPlan.localDownload || null,
    isPopular: newPlan.isPopular,
    description: newPlan.description,
    deviceLimit: Number(newPlan.deviceLimit ?? 1),
    nasType: newPlan.nasType || null,
    service: newPlan.service || null,
    priority: newPlan.priority || null,
    vendorProfiles: (newPlan.vendorProfiles || []).filter(v => v.vendor && v.profile),
    packageType: newPlan.packageType || null,
    allowRename: newPlan.allowRename,
    fupApply: newPlan.fupApply,
    fupLimitGb: newPlan.fupApply && !newPlan.isFupPackage ? newPlan.fupLimitGb || null : null,
    fupPenaltyPlanId: newPlan.fupApply && !newPlan.isFupPackage ? newPlan.fupPenaltyPlanId || null : null,
    isFupPackage: newPlan.isFupPackage,
    onlyRenewal: newPlan.onlyRenewal,
    applyFramedPool: newPlan.applyFramedPool,
    framedPoolValue: newPlan.framedPoolValue || null,
    customRadiusAttributes: newPlan.customRadiusAttributes.filter(a => a.attribute && a.op && a.value),
    maxDiscountPercentage: newPlan.maxDiscountPercentage,
    maxDiscountCount: newPlan.maxDiscountCount,
    highPriority: newPlan.highPriority,
    branchIds: newPlan.branchIds,
  })

  const handleAdd = async () => {
    if (!validateForm()) return
    try {
      await apiRequest("/pkgplan", { method: 'POST', body: JSON.stringify(buildPayload()) })
      toast.success("Internet plan added successfully")
      resetForm()
      setIsAdding(false)
      pkgplans()
    } catch (err: any) {
      console.error("Failed to add internet plan:", err)
      toast.error(err.message || "Failed to add internet plan. Please try again.")
    }
  }

  const handleEdit = (id: string) => {
    const plan = internetPlans.find((p) => p.id === id)
    if (!plan) return
    setNewPlan({ ...plan })
    setEditingId(id)
    setIsAdding(true)
  }

  const handleUpdate = async () => {
    if (!editingId || !validateForm()) return
    try {
      await apiRequest(`/pkgplan/${editingId}`, { method: 'PUT', body: JSON.stringify(buildPayload()) })
      toast.success("Internet plan updated successfully")
      resetForm()
      setEditingId(null)
      setIsAdding(false)
      pkgplans()
    } catch (err) {
      console.error("Failed to update internet plan:", err)
      toast.error("Failed to update internet plan. Please try again.")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/pkgplan/${id}`, { method: 'DELETE' })
      toast.success("Internet plan deleted successfully")
      pkgplans()
    } catch (err) {
      console.error("Failed to delete internet plan:", err)
      toast.error("Failed to delete internet plan. Please try again.")
    }
  }

  const handleCancel = () => {
    resetForm()
    setEditingId(null)
    setIsAdding(false)
  }

  const formatDataLimit = (limit: number | string) => {
    const num = typeof limit === "string" ? parseInt(limit, 10) : limit
    return num === 0 ? "Unlimited" : `${num}`
  }

  const selectedType = useMemo(() => {
    return ispTypes.find((t) => t.id === newPlan.connectionType)
  }, [ispTypes, newPlan.connectionType])

  const fupPenaltyPlanOptions: Option[] = internetPlans
    .filter((plan) => plan.isFupPackage && plan.id !== editingId)
    .map((plan) => ({
      value: plan.id,
      label: `${plan.name} (${plan.downloadSpeed}/${plan.uploadSpeed} Mbps)`,
    }))

  const framedPoolOptions: Option[] = radiusPools.map((pool) => ({
    value: pool.value,
    label: `${pool.name || pool.value} (${pool.value})`,
    description: pool.description,
  }))

  // NAS Type checkbox toggle
  const toggleNasType = (type: string) => {
    const current = newPlan.nasType ? newPlan.nasType.split(",").map(s => s.trim().toLowerCase()).filter(Boolean) : []
    const isRemoving = current.includes(type.toLowerCase())
    const updated = isRemoving
      ? current.filter((t) => t !== type.toLowerCase())
      : [...current, type.toLowerCase()]

    let vendorProfiles = newPlan.vendorProfiles || []
    if (isRemoving) {
      vendorProfiles = vendorProfiles.filter(v => v.vendor?.toLowerCase() !== type.toLowerCase())
    } else if (type === "juniper" || type === "nokia") {
      const defaultProfile = type === "nokia"
        ? newPlan.code || `pkg-${newPlan.downloadSpeed || 0}mbps`
        : DEFAULT_VENDOR_PROFILE[type]
      const exists = vendorProfiles.some(v => v.vendor?.toLowerCase() === type.toLowerCase())
      if (!exists) vendorProfiles = [...vendorProfiles, { vendor: type.toLowerCase(), profile: defaultProfile }]
    }

    setNewPlan({ ...newPlan, nasType: updated.join(","), vendorProfiles })
  }

  // Branch checkbox toggle
  const toggleBranch = (branchId: number) => {
    const updated = newPlan.branchIds.includes(branchId)
      ? newPlan.branchIds.filter((id) => id !== branchId)
      : [...newPlan.branchIds, branchId]
    setNewPlan({ ...newPlan, branchIds: updated })
  }

  // Custom Radius Attributes
  const addCustomAttr = () => {
    setNewPlan({
      ...newPlan,
      customRadiusAttributes: [...newPlan.customRadiusAttributes, { attribute: "", op: ":=", value: "" }],
    })
  }
  const removeCustomAttr = (index: number) => {
    const updated = newPlan.customRadiusAttributes.filter((_, i) => i !== index)
    setNewPlan({ ...newPlan, customRadiusAttributes: updated })
  }
  const updateCustomAttr = (index: number, field: string, value: string) => {
    const updated = newPlan.customRadiusAttributes.map((attr, i) =>
      i === index ? { ...attr, [field]: value } : attr
    )
    setNewPlan({ ...newPlan, customRadiusAttributes: updated })
  }

  // Vendor Profiles
  const addVendorProfile = () => {
    setNewPlan({
      ...newPlan,
      vendorProfiles: [...(newPlan.vendorProfiles || []), { vendor: "juniper", profile: "" }],
    })
  }
  const removeVendorProfile = (index: number) => {
    const updated = (newPlan.vendorProfiles || []).filter((_, i) => i !== index)
    setNewPlan({ ...newPlan, vendorProfiles: updated })
  }
  const updateVendorProfile = (index: number, field: string, value: string) => {
    const updated = (newPlan.vendorProfiles || []).map((vp, i) =>
      i === index ? { ...vp, [field]: value } : vp
    )
    setNewPlan({ ...newPlan, vendorProfiles: updated })
  }

  // --- RESYNC FUNCTION ---
  const handleResync = async () => {
    try {
      setIsResyncing(true)
      const res = await apiRequest("/pkgplan/resync", { method: "POST" })
      toast.success(res?.message || "Plans resynced successfully from DB & RADIUS server")
      pkgplans()
    } catch (err: any) {
      console.error("Resync failed:", err)
      toast.error(err?.message || "Failed to resync plans")
    } finally {
      setIsResyncing(false)
    }
  }

  const openUpgradeModal = async (plan: InternetPlan) => {
    setUpgradeModalPlan(plan)
    setSelectedUpgradePlanIds(Array.isArray(plan.upgradePlanIds) ? plan.upgradePlanIds.map(Number) : [])
    setUpgradeModalTab("upgrade")
    setUpgradePlanSearch("")
    setOpenActionPlanId(null)
    try {
      const fresh = await apiRequest<any>(`/pkgplan/${plan.id}`, { suppressToast: true })
      const rawUpg = typeof fresh?.upgradePlanIds === "string"
        ? (() => { try { return JSON.parse(fresh.upgradePlanIds) } catch { return [] } })()
        : fresh?.upgradePlanIds
      if (Array.isArray(rawUpg)) {
        setSelectedUpgradePlanIds(rawUpg.map(Number).filter((id: number) => Number.isInteger(id) && id > 0))
      }
    } catch {}
  }

  const toggleUpgradePlanId = (targetId: number) => {
    setSelectedUpgradePlanIds(prev =>
      prev.includes(targetId) ? prev.filter(id => id !== targetId) : [...prev, targetId]
    )
  }

  const handleSaveUpgradePlans = async () => {
    if (!upgradeModalPlan) return
    try {
      setSavingUpgradePlans(true)
      await apiRequest(`/pkgplan/${upgradeModalPlan.id}`, {
        method: "PUT",
        body: JSON.stringify({ upgradePlanIds: selectedUpgradePlanIds })
      })
      toast.success(`Upgrade plans updated for ${upgradeModalPlan.name}`)
      setUpgradeModalPlan(null)
      pkgplans()
    } catch (err: any) {
      console.error("Failed to save upgrade plans:", err)
      toast.error(err?.message || "Failed to save upgrade plans")
    } finally {
      setSavingUpgradePlans(false)
    }
  }

  const filteredClassicPlans = useMemo(() => {
    const q = classicSearch.trim().toLowerCase()
    return internetPlans.filter((plan) => {
      if (q) {
        const matchesKeyword =
          plan.name.toLowerCase().includes(q) ||
          plan.code.toLowerCase().includes(q) ||
          (plan.description || "").toLowerCase().includes(q) ||
          (plan.packageType || "").toLowerCase().includes(q)
        if (!matchesKeyword) return false
      }
      if (classicBranchFilter !== "all") {
        if (!plan.branchIds.includes(Number(classicBranchFilter))) return false
      }
      if (classicFupFilter === "yes" && !plan.isFupPackage && !plan.fupApply) return false
      if (classicFupFilter === "no" && (plan.isFupPackage || plan.fupApply)) return false
      if (classicRenewFilter === "yes" && !plan.onlyRenewal) return false
      if (classicRenewFilter === "no" && plan.onlyRenewal) return false
      if (classicStatusFilter === "active" && plan.isActive === false) return false
      if (classicStatusFilter === "inactive" && plan.isActive !== false) return false
      if (classicPkgTypeFilter !== "all" && (plan.packageType || "").toUpperCase() !== classicPkgTypeFilter) return false
      if (classicServiceFilter !== "all") {
        const connName = ispTypes.find(t => t.id === plan.connectionType)?.name || plan.service || ""
        if (connName !== classicServiceFilter) return false
      }
      return true
    })
  }, [
    internetPlans, classicSearch, classicBranchFilter, classicFupFilter,
    classicRenewFilter, classicStatusFilter, classicPkgTypeFilter, classicServiceFilter, ispTypes
  ])

  const filteredCurrentPlans = useMemo(() => {
    const q = currentSearch.trim().toLowerCase()
    if (!q) return internetPlans
    return internetPlans.filter((plan) => {
      const connName = ispTypes.find(t => t.id === plan.connectionType)?.name || ""
      return (
        (plan.name || "").toLowerCase().includes(q) ||
        (plan.code || "").toLowerCase().includes(q) ||
        (plan.nasType || "").toLowerCase().includes(q) ||
        (plan.packageType || "").toLowerCase().includes(q) ||
        connName.toLowerCase().includes(q) ||
        `${plan.downloadSpeed}/${plan.uploadSpeed}`.includes(q)
      )
    })
  }, [internetPlans, currentSearch, ispTypes])

  const activeTotal = viewMode === "classic" ? filteredClassicPlans.length : filteredCurrentPlans.length
  const totalPages = Math.max(1, Math.ceil(activeTotal / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedCurrentPlans = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return filteredCurrentPlans.slice(start, start + pageSize)
  }, [filteredCurrentPlans, safeCurrentPage, pageSize])
  const paginatedClassicPlans = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return filteredClassicPlans.slice(start, start + pageSize)
  }, [filteredClassicPlans, safeCurrentPage, pageSize])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          {!isAdding && !editingId && (
            <Button
              onClick={() => setIsAdding(true)}
              className={
                viewMode === "classic"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              }
            >
              <Plus className="mr-2 h-4 w-4" /> {viewMode === "classic" ? "Add" : "Add Internet Plan"}
            </Button>
          )}
          <Button
            onClick={handleResync}
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
            disabled={isResyncing}
          >
            <RefreshCw className="mr-2 h-4 w-4 animate-spin-slow" /> {isResyncing ? "Resyncing..." : "Resync Plans"}
          </Button>
        </div>

        <div className="flex items-center gap-2 relative">
          <Button
            type="button"
            variant={viewMode === "classic" ? "default" : "outline"}
            onClick={() => {
              setViewMode(prev => (prev === "current" ? "classic" : "current"))
              setCurrentPage(1)
            }}
            className={viewMode === "classic" ? "bg-slate-800 hover:bg-slate-900 text-white" : ""}
          >
            <LayoutList className="mr-2 h-4 w-4" />
            {viewMode === "classic" ? "Current View" : "Classic View"}
          </Button>

          {viewMode === "classic" && (
            <div className="relative">
              <Button
                type="button"
                onClick={() => setShowColumnSetup(prev => !prev)}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                <Columns className="mr-2 h-4 w-4" /> Column Setup
              </Button>
              {showColumnSetup && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-popover p-3 shadow-lg z-40 space-y-1.5 text-xs">
                  <div className="font-semibold border-b pb-1 mb-1 flex items-center justify-between">
                    <span>Visible Columns</span>
                    <button type="button" onClick={() => setShowColumnSetup(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {[
                    ["service", "Service"],
                    ["packageType", "Package Type"],
                    ["intlUp", "Intl Up (Mbps)"],
                    ["intlDown", "Intl Down (Mbps)"],
                    ["localUp", "Local Up (Mbps)"],
                    ["localDown", "Local Down (Mbps)"],
                    ["organizations", "Organizations"],
                    ["branches", "Branches"],
                    ["description", "Description"],
                    ["commission", "Commission%"],
                    ["isFup", "Is FUP?"],
                    ["iptv", "IPTV Enable"],
                    ["allowRenew", "Allow Renew"],
                    ["onlineGw", "List on Online GW"],
                    ["status", "Status"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={classicColumns[key] !== false}
                        onChange={(e) => setClassicColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded border-slate-400"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isAdding || Boolean(editingId)} onOpenChange={(open) => { if (!open) handleCancel() }}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Internet Plan" : "Add New Internet Plan"}</DialogTitle>
            <DialogDescription>
              Configure speed tiers, RADIUS pool &amp; attributes, and assign parent organizations and child branches.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">

          {/* ===== ROW 1: Service & NAS Type ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Input
                id="service"
                value={newPlan.service}
                onChange={(e) => setNewPlan({ ...newPlan, service: e.target.value })}
                placeholder="e.g., Internet"
              />
            </div>
            <div className="space-y-2">
              <Label>NAS Type</Label>
              <div className="flex gap-4 pt-2">
                {NAS_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer capitalize">
                    <input
                      type="checkbox"
                      checked={(newPlan.nasType || "").split(",").map(s => s.trim().toLowerCase()).includes(type.toLowerCase())}
                      onChange={() => toggleNasType(type)}
                      className="rounded border-gray-300"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ===== ROW 2: Priority ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                value={newPlan.priority}
                onChange={(e) => setNewPlan({ ...newPlan, priority: e.target.value })}
                placeholder="e.g., 1"
              />
            </div>
          </div>

          {/* ===== ROW 3: Package Type ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="packageType">Package Type</Label>
              <SearchableSelect
                options={PACKAGE_TYPES.map(t => ({ value: t, label: t }))}
                value={newPlan.packageType}
                onValueChange={(v) => setNewPlan({ ...newPlan, packageType: Array.isArray(v) ? v[0] || "" : v })}
                placeholder="Select Package Type"
              />
            </div>
          </div>

          {/* ===== ROW 4: Plan Name & Plan Code ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                placeholder="e.g., Basic Fiber"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Plan Code</Label>
              <Input
                id="code"
                value={newPlan.code}
                onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value.toUpperCase() })}
                placeholder="e.g., FIBER-BASIC"
              />
            </div>
          </div>

          {/* ===== ROW 5: Connection Type & Data Limit ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="connectionType">Connection Type</Label>
              <SearchableSelect
                options={ISP_TYPE_OPTIONS}
                value={String(newPlan.connectionType)}
                onValueChange={(v) =>
                  setNewPlan({ ...newPlan, connectionType: Number(Array.isArray(v) ? v[0] : v) })
                }
                placeholder="Select Connection Type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataLimit">Data Limit (0 for unlimited)</Label>
              <div className="relative">
                <Input
                  id="dataLimit"
                  type="number"
                  value={String(newPlan.dataLimit)}
                  onChange={(e) => setNewPlan({ ...newPlan, dataLimit: +e.target.value || 0 })}
                  placeholder="e.g., 500"
                  className="pl-9"
                />
                <Infinity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Number of Devices for Extra types */}
          {selectedType?.isExtra && (
            <div className="space-y-2 mb-4">
              <Label htmlFor="deviceLimit">Number of Devices</Label>
              <Input
                id="deviceLimit"
                type="number"
                min={1}
                value={String(newPlan.deviceLimit ?? 1)}
                onChange={(e) => setNewPlan({ ...newPlan, deviceLimit: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
          )}

          {/* ===== ROW 6: All Speed Fields ===== */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="downloadSpeed">Download Speed (Mbps)</Label>
              <div className="relative">
                <Input
                  id="downloadSpeed"
                  type="number"
                  value={String(newPlan.downloadSpeed)}
                  onChange={(e) => setNewPlan({ ...newPlan, downloadSpeed: +e.target.value || 0 })}
                  placeholder="e.g., 100"
                  className="pl-9"
                />
                <Download className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="uploadSpeed">Upload Speed (Mbps)</Label>
              <div className="relative">
                <Input
                  id="uploadSpeed"
                  type="number"
                  value={String(newPlan.uploadSpeed)}
                  onChange={(e) => setNewPlan({ ...newPlan, uploadSpeed: +e.target.value || 0 })}
                  placeholder="e.g., 20"
                  className="pl-9"
                />
                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="intUpload">INT Upload</Label>
              <Input
                id="intUpload"
                type="number"
                value={String(newPlan.intUpload)}
                onChange={(e) => setNewPlan({ ...newPlan, intUpload: +e.target.value || 0 })}
                placeholder="INT Upload"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firDownload">FIR Download</Label>
              <Input
                id="firDownload"
                type="number"
                value={String(newPlan.firDownload)}
                onChange={(e) => setNewPlan({ ...newPlan, firDownload: +e.target.value || 0 })}
                placeholder="FIR Download"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localUpload">Local Upload</Label>
              <Input
                id="localUpload"
                type="number"
                value={String(newPlan.localUpload)}
                onChange={(e) => setNewPlan({ ...newPlan, localUpload: +e.target.value || 0 })}
                placeholder="Local Upload"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localDownload">Local Download</Label>
              <Input
                id="localDownload"
                type="number"
                value={String(newPlan.localDownload)}
                onChange={(e) => setNewPlan({ ...newPlan, localDownload: +e.target.value || 0 })}
                placeholder="Local Download"
              />
            </div>
          </div>

          {/* ===== Organization (Parent Organizations & Child Branches) ===== */}
          <div className="space-y-2 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Organizations &amp; Branches</Label>
              <div className="flex items-center gap-2">
                <div className="relative w-56">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    placeholder="Filter organizations / branches..."
                    className="h-7 pl-8 text-xs"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => setNewPlan({ ...newPlan, branchIds: branches.map(b => b.id) })}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => setNewPlan({ ...newPlan, branchIds: [] })}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="border rounded-md p-3 bg-muted/30 max-h-72 overflow-y-auto space-y-3">
              {ispInfo && (
                <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={true} disabled className="rounded border-gray-300" />
                    <span className="font-semibold">{ispInfo.companyName}</span>
                    <span className="text-muted-foreground">(ISP)</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {newPlan.branchIds.length} selected
                  </span>
                </div>
              )}

              {(() => {
                const q = orgSearch.trim().toLowerCase()
                const parentBranches = branches.filter(b => !b.parentId)
                const orphanBranches = branches.filter(b => b.parentId && !branches.some(p => p.id === b.parentId))

                const toggleGroup = (parent: BranchItem, children: BranchItem[]) => {
                  const groupIds = [parent.id, ...children.map(c => c.id)]
                  const allSelected = groupIds.every(id => newPlan.branchIds.includes(id))
                  const updated = allSelected
                    ? newPlan.branchIds.filter(id => !groupIds.includes(id))
                    : Array.from(new Set([...newPlan.branchIds, ...groupIds]))
                  setNewPlan({ ...newPlan, branchIds: updated })
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {parentBranches.map((parent) => {
                      const allChildren = branches.filter(b => b.parentId === parent.id)
                      const visibleChildren = q
                        ? allChildren.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
                        : allChildren
                      const parentMatches = !q || parent.name.toLowerCase().includes(q) || parent.code.toLowerCase().includes(q)
                      if (!parentMatches && visibleChildren.length === 0) return null
                      const childrenToRender = parentMatches && q ? allChildren : visibleChildren
                      const groupIds = [parent.id, ...allChildren.map(c => c.id)]
                      const allGroupSelected = groupIds.every(id => newPlan.branchIds.includes(id))

                      return (
                        <div key={parent.id} className="rounded-md border bg-background p-2.5 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <label className="flex items-start gap-2 cursor-pointer text-xs font-semibold">
                              <input
                                type="checkbox"
                                checked={newPlan.branchIds.includes(parent.id)}
                                onChange={() => toggleBranch(parent.id)}
                                className="mt-0.5 rounded border-gray-300"
                              />
                              <span>
                                {parent.name}{" "}
                                <span className="font-normal text-muted-foreground">({parent.code})</span>
                              </span>
                            </label>
                            {allChildren.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleGroup(parent, allChildren)}
                                className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border hover:bg-accent text-primary"
                              >
                                {allGroupSelected ? "Unselect Group" : "Select Group"}
                              </button>
                            )}
                          </div>
                          {childrenToRender.length > 0 && (
                            <div className="pl-4 border-l space-y-1.5">
                              {childrenToRender.map((child) => (
                                <label key={child.id} className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                                  <input
                                    type="checkbox"
                                    checked={newPlan.branchIds.includes(child.id)}
                                    onChange={() => toggleBranch(child.id)}
                                    className="rounded border-gray-300"
                                  />
                                  <span>↳ {child.name} <span className="text-[10px]">({child.code})</span></span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {orphanBranches
                      .filter(b => !q || b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q))
                      .map((branch) => (
                        <label key={branch.id} className="flex items-center gap-2 cursor-pointer text-xs bg-background px-3 py-2 rounded-md border hover:bg-accent">
                          <input
                            type="checkbox"
                            checked={newPlan.branchIds.includes(branch.id)}
                            onChange={() => toggleBranch(branch.id)}
                            className="rounded border-gray-300"
                          />
                          <span>{branch.name} <span className="text-muted-foreground">({branch.code})</span></span>
                        </label>
                      ))}
                  </div>
                )
              })()}

              {branches.length === 0 && !ispInfo && (
                <span className="text-sm text-muted-foreground">No branches available</span>
              )}
            </div>
          </div>

          {/* ===== Toggle Switches Row ===== */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="allowRename"
                checked={newPlan.allowRename}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, allowRename: c })}
              />
              <Label htmlFor="allowRename" className="text-sm">Allow Rename</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="fupApply"
                checked={newPlan.fupApply}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, fupApply: c })}
              />
              <Label htmlFor="fupApply" className="text-sm">FUP Apply</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isFupPackage"
                checked={newPlan.isFupPackage}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, isFupPackage: c })}
              />
              <Label htmlFor="isFupPackage" className="text-sm">Is FUP Package</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="onlyRenewal"
                checked={newPlan.onlyRenewal}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, onlyRenewal: c })}
              />
              <Label htmlFor="onlyRenewal" className="text-sm">Only Renewal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPopular"
                checked={newPlan.isPopular}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, isPopular: c })}
              />
              <Label htmlFor="isPopular" className="text-sm">Popular</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="highPriority"
                checked={newPlan.highPriority}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, highPriority: c })}
              />
              <Label htmlFor="highPriority" className="text-sm">High Priority</Label>
            </div>
          </div>

          {newPlan.fupApply && !newPlan.isFupPackage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="fupLimitGb">FUP Limit (GB)</Label>
                <Input
                  id="fupLimitGb"
                  type="number"
                  min={0}
                  value={String(newPlan.fupLimitGb)}
                  onChange={(e) => setNewPlan({ ...newPlan, fupLimitGb: +e.target.value || 0 })}
                  placeholder="e.g., 1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fupPenaltyPlanId">FUP Penalty Plan</Label>
                <SearchableSelect
                  options={fupPenaltyPlanOptions}
                  value={newPlan.fupPenaltyPlanId ? String(newPlan.fupPenaltyPlanId) : ""}
                  onValueChange={(v) => setNewPlan({ ...newPlan, fupPenaltyPlanId: Number(Array.isArray(v) ? v[0] : v) || 0 })}
                  placeholder="Select FUP Package"
                />
              </div>
            </div>
          )}

          {/* ===== Framed Pool ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="applyFramedPool"
                checked={newPlan.applyFramedPool}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, applyFramedPool: c })}
              />
              <Label htmlFor="applyFramedPool">Apply Framed Pool</Label>
            </div>
            {newPlan.applyFramedPool && (
              <div className="space-y-2">
                <Label htmlFor="framedPoolValue">Framed Pool Value</Label>
                <SearchableSelect
                  options={framedPoolOptions}
                  value={newPlan.framedPoolValue}
                  onValueChange={(v) => setNewPlan({ ...newPlan, framedPoolValue: Array.isArray(v) ? v[0] || "" : v })}
                  placeholder={framedPoolOptions.length > 0 ? "Choose framed pool" : "Create pools in RADIUS Pools settings"}
                />
                <p className="text-xs text-muted-foreground">Saved value is the pool value string, not an internal ID.</p>
              </div>
            )}
          </div>

          {/* ===== Vendor-Specific Profiles ===== */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Vendor-Specific Profiles</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVendorProfile}>
                <PlusCircle className="mr-1 h-4 w-4" /> Add Vendor Profile
              </Button>
            </div>
            {newPlan.vendorProfiles && newPlan.vendorProfiles.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-[150px_1fr_40px] gap-2 px-3 py-2 bg-muted text-sm font-medium">
                  <span>Vendor</span>
                  <span>Profile Name / Variable</span>
                  <span></span>
                </div>
                <div className="divide-y">
                  {newPlan.vendorProfiles.map((vp, index) => (
                    <div key={index} className="grid grid-cols-[150px_1fr_40px] gap-2 p-2 items-center">
                      <SearchableSelect
                        options={NAS_TYPES.map(t => ({ value: t, label: t.toUpperCase() }))}
                        value={vp.vendor?.toLowerCase()}
                        onValueChange={(v) => updateVendorProfile(index, "vendor", Array.isArray(v) ? (v[0] || "").toLowerCase() : String(v).toLowerCase())}
                        placeholder="Select Vendor"
                      />
                      <Input
                        value={vp.profile}
                        onChange={(e) => updateVendorProfile(index, "profile", e.target.value)}
                        placeholder={vp.vendor === "juniper" ? "x-ppp-profile" : vp.vendor === "nokia" ? "SLA profile, e.g. KSN-75-IPTV" : "Profile name"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90 h-8 w-8"
                        onClick={() => removeVendorProfile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ===== Description ===== */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newPlan.description}
              onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* ===== Custom Radius Attributes ===== */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Custom Radius Attributes</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCustomAttr}>
                <PlusCircle className="mr-1 h-4 w-4" /> Add Attribute
              </Button>
            </div>
            {newPlan.customRadiusAttributes.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-[1fr_100px_1fr_40px] gap-2 px-3 py-2 bg-muted text-sm font-medium">
                  <span>Attribute</span>
                  <span>Operator</span>
                  <span>Value</span>
                  <span></span>
                </div>
                {newPlan.customRadiusAttributes.map((attr, index) => (
                  <div key={index} className="grid grid-cols-[1fr_100px_1fr_40px] gap-2 px-3 py-2 border-t">
                    <Input
                      value={attr.attribute}
                      onChange={(e) => updateCustomAttr(index, "attribute", e.target.value)}
                      placeholder="e.g., WISPr-Bandwidth-Max-Down"
                      className="h-9"
                    />
                    <select
                      value={attr.op}
                      onChange={(e) => updateCustomAttr(index, "op", e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {OP_OPTIONS.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    <Input
                      value={attr.value}
                      onChange={(e) => updateCustomAttr(index, "value", e.target.value)}
                      placeholder="Value"
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomAttr(index)}
                      className="h-9 w-9 text-destructive hover:text-destructive/90"
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {newPlan.customRadiusAttributes.length === 0 && (
              <p className="text-sm text-muted-foreground">No custom attributes added. Click &quot;Add Attribute&quot; to add RADIUS reply attributes.</p>
            )}
          </div>

          {/* ===== Discount Settings ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="maxDiscountPercentage">Max Discount Percentage (%)</Label>
              <Input
                id="maxDiscountPercentage"
                type="number"
                min={0}
                max={100}
                value={String(newPlan.maxDiscountPercentage)}
                onChange={(e) => setNewPlan({ ...newPlan, maxDiscountPercentage: +e.target.value || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDiscountCount">Max Discount Count Per Month</Label>
              <Input
                id="maxDiscountCount"
                type="number"
                min={0}
                value={String(newPlan.maxDiscountCount)}
                onChange={(e) => setNewPlan({ ...newPlan, maxDiscountCount: +e.target.value || 0 })}
              />
            </div>
          </div>

          {/* ===== Actions ===== */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={editingId ? handleUpdate : handleAdd}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              <Save className="mr-2 h-4 w-4" /> {editingId ? "Update" : "Add"} Internet Plan
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plans Table: Current View vs Classic View */}
      {viewMode === "current" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={currentSearch}
                onChange={(e) => {
                  setCurrentSearch(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search plans by name, code, NAS, speed..."
                className="pl-9 h-9"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Showing {paginatedCurrentPlans.length} of {filteredCurrentPlans.length} plans
            </span>
          </div>
          <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead className="w-[150px]">Connection</TableHead>
                  <TableHead className="w-[150px]">Speed</TableHead>
                  <TableHead className="w-[100px]">Data Limit</TableHead>
                  <TableHead className="w-[120px]">Organizations</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCurrentPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No internet plans found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCurrentPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{plan.name}</span>
                          <span className="text-xs text-muted-foreground">{plan.code}</span>
                          {plan.packageType && (
                            <span className="text-xs mt-0.5 inline-block px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded w-fit">{plan.packageType}</span>
                          )}
                          {plan.upgradePlanIds && plan.upgradePlanIds.length > 0 && (
                            <span className="text-[10px] mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded w-fit">
                              <TrendingUp className="h-3 w-3" />
                              Upgrades ({plan.upgradePlanIds.length}): {plan.upgradePlanIds.map(uid => internetPlans.find(p => Number(p.id) === uid)?.name || uid).join(", ")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{plan.nasType || "—"}</span>
                      </TableCell>
                      <TableCell>
                        {ispTypes.find(t => t.id === plan.connectionType)?.name || "(unknown)"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-1 text-amber-500" />
                          <span>{plan.downloadSpeed}/{plan.uploadSpeed} Mbps</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDataLimit(plan.dataLimit)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setBranchesModalPlan(plan)}
                          className="h-7 px-2 text-xs gap-1.5"
                          title="View assigned organizations & branches"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          <span>
                            {plan.branchIds.length > 0 ? `${plan.branchIds.length} Assigned` : "All"}
                          </span>
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openUpgradeModal(plan)}
                            className="h-8 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
                            title="Manage Upgrade Plans"
                          >
                            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Upg. Plan
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(plan.id)} className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)} className="h-8 w-8 text-destructive hover:text-destructive/90">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          </div>
          <Pagination
            currentPage={safeCurrentPage}
            totalItems={filteredCurrentPlans.length}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
            showPageSizeSelector={true}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Classic View Filter Bar */}
          <div className="rounded-xl border bg-card p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={classicSearch}
                onChange={(e) => setClassicSearch(e.target.value)}
                placeholder="Any Keyword"
                className="h-9 w-44 text-xs"
              />
              <select
                value={classicBranchFilter}
                onChange={(e) => setClassicBranchFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
              >
                <option value="all">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </select>
              <select
                value={classicFupFilter}
                onChange={(e) => setClassicFupFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
              >
                <option value="all">FUP Yes/No</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <select
                value={classicRenewFilter}
                onChange={(e) => setClassicRenewFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
              >
                <option value="all">Allow Renew Yes/No</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <select
                value={classicStatusFilter}
                onChange={(e) => setClassicStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
              >
                <option value="all">Choose Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={classicPkgTypeFilter}
                onChange={(e) => setClassicPkgTypeFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
              >
                <option value="all">All Package Types</option>
                {PACKAGE_TYPES.map(pt => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
              <select
                value={classicServiceFilter}
                onChange={(e) => setClassicServiceFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
              >
                <option value="all">All Services</option>
                {Array.from(new Set(ispTypes.map(t => t.name))).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <Button
                type="button"
                className="h-9 bg-blue-700 hover:bg-blue-800 text-white text-xs px-4"
              >
                <Search className="h-3.5 w-3.5 mr-1.5" /> Search
              </Button>
            </div>
          </div>

          {/* Classic View Table */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow>
                    <TableHead className="w-10">SN</TableHead>
                    {classicColumns.service && <TableHead>Service</TableHead>}
                    {classicColumns.packageType && <TableHead>Package Type</TableHead>}
                    <TableHead>Package Name</TableHead>
                    {classicColumns.intlUp && <TableHead>Intl Up (Mbps)</TableHead>}
                    {classicColumns.intlDown && <TableHead>Intl Down (Mbps)</TableHead>}
                    {classicColumns.localUp && <TableHead>Local Up (Mbps)</TableHead>}
                    {classicColumns.localDown && <TableHead>Local Down (Mbps)</TableHead>}
                    {classicColumns.organizations && <TableHead>Organizations</TableHead>}
                    {classicColumns.branches && <TableHead>Branches</TableHead>}
                    {classicColumns.description && <TableHead>Description</TableHead>}
                    {classicColumns.commission && <TableHead>Commission%</TableHead>}
                    {classicColumns.isFup && <TableHead>Is FUP?</TableHead>}
                    {classicColumns.iptv && <TableHead>IPTV Enable</TableHead>}
                    {classicColumns.allowRenew && <TableHead>Allow Renew</TableHead>}
                    {classicColumns.onlineGw && <TableHead>List on Online GW</TableHead>}
                    {classicColumns.status && <TableHead>Status</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClassicPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={18} className="text-center py-8 text-muted-foreground">
                        No internet plans found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedClassicPlans.map((plan, idx) => {
                      const serviceName = ispTypes.find(t => t.id === plan.connectionType)?.name || plan.service || "FTTH-Internet"
                      const isActive = plan.isActive !== false
                      const isFup = Boolean(plan.isFupPackage || plan.fupApply)
                      return (

                        <TableRow key={plan.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50">
                          <TableCell>{(safeCurrentPage - 1) * pageSize + idx + 1}</TableCell>
                          {classicColumns.service && <TableCell>{serviceName}</TableCell>}
                          {classicColumns.packageType && <TableCell>{plan.packageType || "HOME"}</TableCell>}
                          <TableCell className="font-semibold">
                            <div>{plan.name}</div>
                            {plan.upgradePlanIds && plan.upgradePlanIds.length > 0 && (
                              <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                                → {plan.upgradePlanIds.map(uid => internetPlans.find(p => Number(p.id) === uid)?.name || uid).join(", ")}
                              </span>
                            )}
                          </TableCell>
                          {classicColumns.intlUp && <TableCell>{plan.intUpload || plan.uploadSpeed}</TableCell>}
                          {classicColumns.intlDown && <TableCell>{plan.firDownload || plan.downloadSpeed}</TableCell>}
                          {classicColumns.localUp && <TableCell>{plan.localUpload || plan.uploadSpeed}</TableCell>}
                          {classicColumns.localDown && <TableCell>{plan.localDownload || plan.downloadSpeed}</TableCell>}
                          {classicColumns.organizations && (
                            <TableCell>
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(plan.id)}
                                  className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium"
                                >
                                  Manage
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toast.success(ispInfo?.companyName || "All Organizations")}
                                  className="p-1 rounded bg-cyan-500 hover:bg-cyan-600 text-white"
                                  title="View Organizations"
                                >
                                  <Eye className="h-3 w-3" />
                                </button>
                              </div>
                            </TableCell>
                          )}
                          {classicColumns.branches && (
                            <TableCell>
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(plan.id)}
                                  className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium"
                                >
                                  Manage
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const bNames = plan.branchIds.length > 0
                                      ? plan.branchIds.map(bid => branches.find(b => b.id === bid)?.name || bid).join(", ")
                                      : "All Branches"
                                    toast.success(bNames)
                                  }}
                                  className="p-1 rounded bg-cyan-500 hover:bg-cyan-600 text-white"
                                  title="View Branches"
                                >
                                  <Eye className="h-3 w-3" />
                                </button>
                              </div>
                            </TableCell>
                          )}
                          {classicColumns.description && (
                            <TableCell className="max-w-[140px] truncate text-muted-foreground">
                              {plan.description || ""}
                            </TableCell>
                          )}
                          {classicColumns.commission && (
                            <TableCell>
                              <div className="inline-flex items-center gap-1">
                                <span>0%</span>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(plan.id)}
                                  className="px-1.5 py-0.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[10px]"
                                >
                                  Edit
                                </button>
                              </div>
                            </TableCell>
                          )}
                          {classicColumns.isFup && (
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold text-white ${isFup ? "bg-emerald-500" : "bg-blue-700"}`}>
                                {isFup ? "Yes" : "No"}
                              </span>
                            </TableCell>
                          )}
                          {classicColumns.iptv && (
                            <TableCell>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-white bg-blue-700">
                                No
                              </span>
                            </TableCell>
                          )}
                          {classicColumns.allowRenew && (
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold text-white ${plan.onlyRenewal ? "bg-emerald-500" : "bg-red-500"}`}>
                                {plan.onlyRenewal ? "Yes" : "No"}
                              </span>
                            </TableCell>
                          )}
                          {classicColumns.onlineGw && (
                            <TableCell>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-white bg-red-500">
                                No
                              </span>
                            </TableCell>
                          )}
                          {classicColumns.status && (
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold text-white ${isActive ? "bg-emerald-500" : "bg-red-500"}`}>
                                {isActive ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                          )}
                          <TableCell className="text-right relative">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openUpgradeModal(plan)}
                                className="px-2 py-1 rounded bg-amber-400 hover:bg-amber-500 text-white text-[11px] font-medium"
                                title="Upgrade Plan / Charges"
                              >
                                Charges
                              </button>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenActionPlanId(prev => (prev === plan.id ? null : plan.id))}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-medium"
                                >
                                  Actions <ChevronDown className="h-3 w-3" />
                                </button>
                                {openActionPlanId === plan.id && (
                                  <div className="absolute right-0 mt-1 w-40 rounded-md border bg-popover shadow-lg z-50 py-1 text-left text-xs">
                                    <button
                                      type="button"
                                      onClick={() => { setOpenActionPlanId(null); handleEdit(plan.id) }}
                                      className="w-full px-3 py-1.5 hover:bg-accent flex items-center gap-2"
                                    >
                                      <Pencil className="h-3.5 w-3.5" /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setOpenActionPlanId(null); handleDelete(plan.id) }}
                                      className="w-full px-3 py-1.5 hover:bg-accent text-red-600 flex items-center gap-2"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openUpgradeModal(plan)}
                                      className="w-full px-3 py-1.5 hover:bg-accent font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-2"
                                    >
                                      <TrendingUp className="h-3.5 w-3.5" /> Upg. Plan
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setOpenActionPlanId(null); toast.success(`Max Discount: ${plan.maxDiscountPercentage}%`) }}
                                      className="w-full px-3 py-1.5 hover:bg-accent flex items-center gap-2"
                                    >
                                      Referral Points
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setOpenActionPlanId(null); handleEdit(plan.id) }}
                                      className="w-full px-3 py-1.5 hover:bg-accent flex items-center gap-2"
                                    >
                                      <Eye className="h-3.5 w-3.5" /> View
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <Pagination
            currentPage={safeCurrentPage}
            totalItems={filteredClassicPlans.length}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
            showPageSizeSelector={true}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

      {/* Manage Upgrade Plans Modal (matching Classic View reference) */}
      {upgradeModalPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl rounded-lg bg-background shadow-2xl border overflow-hidden">
            <div className="flex items-center justify-between bg-blue-700 px-5 py-3 text-white">
              <h3 className="text-base font-semibold">
                Manage Upgrade Plans For {upgradeModalPlan.name}
              </h3>
              <button
                type="button"
                onClick={() => setUpgradeModalPlan(null)}
                className="rounded p-1 hover:bg-blue-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Tabs */}
              <div className="flex items-center justify-between border-b pb-2 gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setUpgradeModalTab("upgrade")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-t ${
                      upgradeModalTab === "upgrade"
                        ? "bg-blue-700 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Upgrade Plans
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpgradeModalTab("online")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-t ${
                      upgradeModalTab === "online"
                        ? "bg-blue-700 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Online API Payment
                  </button>
                </div>

                <Input
                  value={upgradePlanSearch}
                  onChange={(e) => setUpgradePlanSearch(e.target.value)}
                  placeholder="Search plans..."
                  className="h-8 w-56 text-xs"
                />
              </div>

              {upgradeModalTab === "upgrade" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-[120px_1fr] items-center gap-3 text-xs border-b pb-3">
                    <span className="font-medium text-muted-foreground">Package</span>
                    <span className="font-semibold">
                      Selected Packages ({selectedUpgradePlanIds.length} {selectedUpgradePlanIds.length === 1 ? "plan" : "plans"})
                      {selectedUpgradePlanIds.length > 0 && (
                        <span className="ml-2 font-normal text-indigo-600 dark:text-indigo-400">
                          ({selectedUpgradePlanIds.map(id => internetPlans.find(p => Number(p.id) === id)?.name || `#${id}`).join(", ")})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] items-start gap-3 text-xs">
                    <span className="font-medium text-muted-foreground pt-1">Select Plans</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-2 max-h-[50vh] overflow-y-auto pr-1">
                      {internetPlans
                        .filter(p => p.id !== upgradeModalPlan.id)
                        .filter(p => !upgradePlanSearch.trim() || p.name.toLowerCase().includes(upgradePlanSearch.trim().toLowerCase()))
                        .map((targetPlan) => {
                          const numericId = Number(targetPlan.id)
                          const checked = selectedUpgradePlanIds.includes(numericId)
                          return (

                            <label
                              key={targetPlan.id}
                              className="flex items-center gap-1.5 cursor-pointer select-none hover:text-primary"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleUpgradePlanId(numericId)}
                                className="rounded border-slate-400 text-blue-700 focus:ring-blue-600"
                              />
                              <span className="truncate" title={targetPlan.name}>{targetPlan.name}</span>
                            </label>
                          )
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-sm text-muted-foreground space-y-2">
                  <p>
                    All online payment gateways (<strong>eSewa</strong>, <strong>External Payment</strong>) and internal recharge screens
                    (<strong>Finance Recharge</strong>, <strong>Subscriber Renewal</strong>) will automatically display packages from the
                    selected upgrade plans when a subscriber renews.
                  </p>
                  <p className="text-xs">
                    Subscribers remain on their current active plan and subscription until they complete their next recharge.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setUpgradeModalPlan(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={savingUpgradePlans}
                  onClick={handleSaveUpgradePlans}
                  className="bg-blue-700 hover:bg-blue-800 text-white"
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {savingUpgradePlans ? "Saving..." : "Save Upgrade Plans"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Organizations & Branches Hierarchy Modal */}
      {branchesModalPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-xl bg-background shadow-2xl border overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold">Organizations &amp; Branches — {branchesModalPlan.name}</h3>
                <p className="text-xs text-muted-foreground">{ispInfo?.companyName || "Organization"}</p>
              </div>
              <button
                type="button"
                onClick={() => setBranchesModalPlan(null)}
                className="rounded p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3 text-xs">
              {branchesModalPlan.branchIds.length === 0 ? (
                <p className="text-muted-foreground">Assigned to all organizations and branches.</p>
              ) : (() => {
                const assignedSet = new Set(branchesModalPlan.branchIds)
                const parentBranches = branches.filter(b => !b.parentId)
                const orphanAssigned = branches.filter(b => b.parentId && assignedSet.has(b.id) && !branches.some(p => p.id === b.parentId))
                return (

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {parentBranches.map(parent => {
                      const children = branches.filter(b => b.parentId === parent.id && assignedSet.has(b.id))
                      const parentAssigned = assignedSet.has(parent.id)
                      if (!parentAssigned && children.length === 0) return null
                      return (

                        <div key={parent.id} className="rounded-md border p-2.5 bg-muted/20">
                          <div className="font-semibold flex items-center justify-between">
                            <span>{parent.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${parentAssigned ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                              {parentAssigned ? "Parent Assigned" : "Parent"}
                            </span>
                          </div>
                          {children.length > 0 && (
                            <div className="mt-2 pl-3 border-l space-y-1">
                              {children.map(child => (
                                <div key={child.id} className="flex items-center justify-between text-muted-foreground">
                                  <span>↳ {child.name}</span>
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Assigned</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {orphanAssigned.map(b => (
                      <div key={b.id} className="rounded-md border p-2 bg-muted/20 font-medium">
                        {b.name}
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
            <div className="flex justify-end border-t px-5 py-3">
              <Button type="button" size="sm" variant="outline" onClick={() => setBranchesModalPlan(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
