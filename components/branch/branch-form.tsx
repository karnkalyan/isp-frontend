"use client"

import React, { useState, useEffect, useMemo } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-hot-toast"
import {
    Save,
    Plus,
    Pencil,
    Trash2,
    MapPin,
    Building,
    Building2,
    Phone,
    Mail,
    Globe,
    User,
    BarChart3,
    Settings,
    WifiOff,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronDown,
    FolderTree,
    List,
    ChevronsUpDown,
    Filter,
    GitBranch,
    X,
    ShieldCheck,
    Layers,
    CornerDownRight
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { apiRequest } from "@/lib/api"
import { useConfirmToast } from "@/hooks/use-confirm-toast"
import { BranchStatsCards } from "./branch-stat-cards"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"

type Branch = {
    id: string
    name: string
    code: string
    email: string | null
    phoneNumber: string | null
    address: string | null
    city: string | null
    state: string | null
    zipCode: string | null
    country: string | null
    contactPerson: string | null
    logoUrl: string | null
    isActive: boolean
    infraShareDeviceRequired: boolean
    receiptRequired: boolean
    smsEnabled: boolean
    smsUseParentProvider: boolean
    smsProviderCode?: string | null
    createdAt: string
    updatedAt: string
    parent?: { id: string | number, name: string } | null
    parentId?: number | string | null
    _count?: {
        users: number
        customers: number
        leads: number
        olts: number
        onts: number
    }
}

interface TreeNode {
    branch: Branch
    level: "organization" | "branch" | "subbranch"
    depth: number
    children: TreeNode[]
    totalSubCount: number
    directSubCount: number
    matchesFilter: boolean
    hasMatchingDescendant: boolean
}

export default function BranchForm() {
    const { user } = useAuth()
    const isGlobalAdmin = useMemo(() => {
        const roleStr = typeof user?.role === "string" ? user.role : user?.role?.name;
        const roleName = (roleStr || "").toLowerCase()
        return roleName === "administrator" || 
               roleName === "admin" || 
               roleName === "isp_admin" || 
               roleName === "super admin" || 
               roleName.startsWith("global ")
    }, [user])

    const [branches, setBranches] = useState<Branch[]>([])
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [statsLoading, setStatsLoading] = useState(false)
    const [disconnectingBranchId, setDisconnectingBranchId] = useState<string | null>(null)
    const [selectedBranchStats, setSelectedBranchStats] = useState<any>(null)

    // View Mode: 'tree' (expandable hierarchy) vs 'flat' (list view)
    const [viewMode, setViewMode] = useState<"tree" | "flat">("tree")
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    // Search and Filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [levelFilter, setLevelFilter] = useState<"all" | "organization" | "branch" | "subbranch">("all")
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [overallStats, setOverallStats] = useState({
        totalBranches: 0,
        totalOrganizations: 0,
        totalSubBranches: 0,
        totalUsers: 0,
        activeCustomers: 0,
        totalDevices: 0,
        activeBranches: 0,
        totalLeads: 0,
        totalOLTs: 0,
        totalONTs: 0
    })

    const { confirm, ConfirmDialog } = useConfirmToast()

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        email: "",
        phoneNumber: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        contactPerson: "",
        logoUrl: "",
        parentId: "none",
        infraShareDeviceRequired: false,
        receiptRequired: false,
        smsEnabled: true,
        smsUseParentProvider: true,
        smsProviderCode: "",
    })

    useEffect(() => {
        if (user && !isGlobalAdmin && formData.parentId === "none" && user.branchId) {
            setFormData(prev => ({ ...prev, parentId: String(user.branchId) }))
        }
    }, [user, isGlobalAdmin])

    const [isActive, setIsActive] = useState(true)

    useEffect(() => {
        fetchBranches()
        fetchOverallStats()
    }, [])

    const fetchBranches = async () => {
        try {
            setLoading(true)
            const data = await apiRequest<Branch[]>("/branches")
            setBranches(data || [])
            updateOverallStats(data || [])
        } catch (error) {
            console.error("Failed to fetch branches:", error)
            toast.error("Failed to load branches")
        } finally {
            setLoading(false)
        }
    }

    const fetchOverallStats = async () => {
        try {
            const stats = await apiRequest<any>("/branches/stats/overall")
            if (stats) {
                setOverallStats(prev => ({ ...prev, ...stats }))
            }
        } catch (error) {
            console.error("Failed to fetch overall stats:", error)
        }
    }

    const updateOverallStats = (branchesData: Branch[]) => {
        const totalOrganizations = branchesData.filter(b => !b.parentId || b.parentId === "none").length
        const totalSubBranches = branchesData.filter(b => b.parentId && b.parentId !== "none").length
        const activeBranches = branchesData.filter(b => b.isActive).length
        const totalUsers = branchesData.reduce((sum, branch) => sum + (branch._count?.users || 0), 0)
        const totalCustomers = branchesData.reduce((sum, branch) => sum + (branch._count?.customers || 0), 0)
        const totalLeads = branchesData.reduce((sum, branch) => sum + (branch._count?.leads || 0), 0)
        const totalOLTs = branchesData.reduce((sum, branch) => sum + (branch._count?.olts || 0), 0)
        const totalONTs = branchesData.reduce((sum, branch) => sum + (branch._count?.onts || 0), 0)

        setOverallStats(prev => ({
            ...prev,
            totalBranches: branchesData.length,
            totalOrganizations,
            totalSubBranches,
            activeBranches,
            totalUsers,
            activeCustomers: totalCustomers,
            totalLeads,
            totalOLTs,
            totalONTs,
            totalDevices: totalOLTs + totalONTs
        }))
    }

    const fetchBranchStats = async (branchId: string) => {
        try {
            setStatsLoading(true)
            const stats = await apiRequest(`/branches/${branchId}/stats`)
            setSelectedBranchStats(stats)
        } catch (error) {
            console.error("Failed to fetch branch stats:", error)
            toast.error("Failed to load branch statistics")
        } finally {
            setStatsLoading(false)
        }
    }

    const validate = () => {
        if (!formData.name.trim()) {
            toast.error("Branch name is required")
            return false
        }
        if (!formData.code.trim()) {
            toast.error("Branch code is required")
            return false
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            toast.error("Please enter a valid email address")
            return false
        }
        return true
    }

    const saveBranch = async () => {
        if (!validate()) return

        const payload = {
            name: formData.name.trim(),
            code: formData.code.trim().toUpperCase(),
            email: formData.email.trim() || null,
            phoneNumber: formData.phoneNumber.trim() || null,
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            state: formData.state.trim() || null,
            zipCode: formData.zipCode.trim() || null,
            country: formData.country.trim() || null,
            contactPerson: formData.contactPerson.trim() || null,
            logoUrl: formData.logoUrl.trim() || null,
            isActive: isActive,
            parentId: formData.parentId !== "none" ? formData.parentId : null,
            infraShareDeviceRequired: formData.infraShareDeviceRequired,
            receiptRequired: formData.receiptRequired,
            smsEnabled: formData.smsEnabled,
            smsUseParentProvider: formData.smsUseParentProvider,
            smsProviderCode: formData.smsProviderCode || null,
        }

        try {
            setLoading(true)

            if (editingId) {
                await apiRequest(`/branches/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                })
                toast.success("Branch updated successfully")
            } else {
                await apiRequest("/branches", {
                    method: 'POST',
                    body: JSON.stringify(payload),
                })
                toast.success("Branch created successfully")
            }

            await fetchBranches()
            resetForm()
        } catch (error: any) {
            console.error("Save error:", error)
            toast.error(error.message || "Failed to save branch")
        } finally {
            setLoading(false)
        }
    }

    const editBranch = (branch: Branch) => {
        setEditingId(branch.id)
        setFormData({
            name: branch.name,
            code: branch.code,
            email: branch.email || "",
            phoneNumber: branch.phoneNumber || "",
            address: branch.address || "",
            city: branch.city || "",
            state: branch.state || "",
            zipCode: branch.zipCode || "",
            country: branch.country || "",
            contactPerson: branch.contactPerson || "",
            logoUrl: branch.logoUrl || "",
            parentId: branch.parent?.id ? String(branch.parent.id) : (branch.parentId ? String(branch.parentId) : "none"),
            infraShareDeviceRequired: branch.infraShareDeviceRequired === true,
            receiptRequired: branch.receiptRequired === true,
            smsEnabled: branch.smsEnabled !== false,
            smsUseParentProvider: branch.smsUseParentProvider !== false,
            smsProviderCode: branch.smsProviderCode || ""
        })
        setIsActive(branch.isActive)
    }

    const deleteBranch = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Branch",
            message: "Are you sure you want to delete this branch? This action cannot be undone.",
            type: "danger",
            confirmText: "Delete",
            cancelText: "Cancel",
        })

        if (!isConfirmed) return

        try {
            setLoading(true)
            await apiRequest(`/branches/${id}`, {
                method: 'DELETE',
            })
            toast.success("Branch deleted successfully")
            await fetchBranches()
        } catch (error: any) {
            console.error("Delete error:", error)
            toast.error(error.message || "Failed to delete branch")
        } finally {
            setLoading(false)
        }
    }

    const disconnectBranchSessions = async (branch: Branch) => {
        const customerCount = branch._count?.customers || 0
        const isConfirmed = await confirm({
            title: "Disconnect Branch Sessions",
            message: `Disconnect all active RADIUS sessions for ${branch.name}${customerCount ? ` (${customerCount} customers)` : ""}? Sub-branches under this branch are included.`,
            type: "danger",
            confirmText: "Disconnect",
            cancelText: "Cancel",
        })

        if (!isConfirmed) return

        try {
            setDisconnectingBranchId(branch.id)
            const response = await apiRequest<{
                success: boolean
                partialSuccess?: boolean
                message?: string
                totalUsers?: number
                disconnected?: any[]
                failed?: any[]
            }>(`/customer/disconnect/branch/${branch.id}/all`, {
                method: "POST",
                body: JSON.stringify({ includeSubBranches: true }),
            })

            const disconnected = response?.disconnected?.length || 0
            const failed = response?.failed?.length || 0
            if (failed > 0) {
                toast.error(response?.message || `Disconnected ${disconnected}; ${failed} failed`)
            } else {
                toast.success(response?.message || `Disconnected sessions for ${disconnected} users`)
            }
        } catch (error: any) {
            console.error("Branch disconnect error:", error)
            toast.error(error.message || "Failed to disconnect branch sessions")
        } finally {
            setDisconnectingBranchId(null)
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            code: "",
            email: "",
            phoneNumber: "",
            address: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
            contactPerson: "",
            logoUrl: "",
            parentId: isGlobalAdmin ? "none" : (user?.branchId ? String(user.branchId) : "none"),
            infraShareDeviceRequired: false,
            receiptRequired: false,
            smsEnabled: true,
            smsUseParentProvider: true,
            smsProviderCode: "",
        })
        setIsActive(true)
        setEditingId(null)
        setIsAdding(false)
        setSelectedBranchStats(null)
    }

    const startAdding = () => {
        resetForm()
        setIsAdding(true)
    }

    const cancelEdit = () => {
        resetForm()
    }

    const viewStats = async (branch: Branch) => {
        if (selectedBranchStats?.branch?.id === branch.id) {
            setSelectedBranchStats(null)
        } else {
            await fetchBranchStats(branch.id)
        }
    }

    const handleRefreshStats = async () => {
        await Promise.all([fetchBranches(), fetchOverallStats()])
    }

    // ==========================================
    // HIERARCHICAL TREE BUILDING & FILTER LOGIC
    // ==========================================
    const { treeRoots, allTreeNodesMap, totalOrgCount, totalBranchCount, totalSubCount } = useMemo(() => {
        const bMap = new Map<string, Branch>()
        branches.forEach(b => bMap.set(String(b.id), b))

        const childrenMap = new Map<string, Branch[]>()
        const rootBranches: Branch[] = []

        branches.forEach(b => {
            const pId = b.parentId || b.parent?.id
            if (pId && pId !== "none" && bMap.has(String(pId)) && String(pId) !== String(b.id)) {
                const list = childrenMap.get(String(pId)) || []
                list.push(b)
                childrenMap.set(String(pId), list)
            } else {
                rootBranches.push(b)
            }
        })

        let orgCount = 0
        let branchCount = 0
        let subCount = 0

        const nodesMap = new Map<string, TreeNode>()

        const createNode = (b: Branch, depth: number): TreeNode => {
            const directChildren = childrenMap.get(String(b.id)) || []
            const childNodes = directChildren.map(child => createNode(child, depth + 1))

            let totalSubs = childNodes.length
            childNodes.forEach(cn => { totalSubs += cn.totalSubCount })

            let level: "organization" | "branch" | "subbranch" = "organization"
            if (depth === 0) {
                level = "organization"
                orgCount++
            } else if (depth === 1) {
                level = "branch"
                branchCount++
            } else {
                level = "subbranch"
                subCount++
            }

            let matches = true
            if (levelFilter === "organization" && level !== "organization") matches = false
            if (levelFilter === "branch" && level !== "branch") matches = false
            if (levelFilter === "subbranch" && level !== "subbranch") matches = false
            if (statusFilter === "active" && !b.isActive) matches = false
            if (statusFilter === "inactive" && b.isActive) matches = false

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const matchName = (b.name || "").toLowerCase().includes(q)
                const matchCode = (b.code || "").toLowerCase().includes(q)
                const matchCity = (b.city || "").toLowerCase().includes(q)
                const matchState = (b.state || "").toLowerCase().includes(q)
                const matchAddress = (b.address || "").toLowerCase().includes(q)
                const matchContact = (b.contactPerson || "").toLowerCase().includes(q)
                const matchPhone = (b.phoneNumber || "").toLowerCase().includes(q)
                const matchEmail = (b.email || "").toLowerCase().includes(q)
                const matchParent = (b.parent?.name || "").toLowerCase().includes(q)
                if (!(matchName || matchCode || matchCity || matchState || matchAddress || matchContact || matchPhone || matchEmail || matchParent)) {
                    matches = false
                }
            }

            const hasMatchingChild = childNodes.some(cn => cn.matchesFilter || cn.hasMatchingDescendant)

            const node: TreeNode = {
                branch: b,
                level,
                depth,
                children: childNodes,
                totalSubCount: totalSubs,
                directSubCount: childNodes.length,
                matchesFilter: matches,
                hasMatchingDescendant: hasMatchingChild
            }

            nodesMap.set(String(b.id), node)
            return node
        }

        const roots = rootBranches.map(root => createNode(root, 0))

        return {
            treeRoots: roots,
            allTreeNodesMap: nodesMap,
            totalOrgCount: orgCount,
            totalBranchCount: branchCount,
            totalSubCount: subCount
        }
    }, [branches, searchQuery, levelFilter, statusFilter])

    useEffect(() => {
        if (searchQuery.trim() || levelFilter !== "all" || statusFilter !== "all") {
            const toExpand = new Set<string>()
            allTreeNodesMap.forEach((node, id) => {
                if (node.hasMatchingDescendant) {
                    toExpand.add(id)
                }
            })
            setExpandedIds(prev => new Set([...prev, ...toExpand]))
        }
    }, [searchQuery, levelFilter, statusFilter, allTreeNodesMap])

    const toggleExpand = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        setExpandedIds(prev => {
            const next = new Set(prev)
            const strId = String(id)
            if (next.has(strId)) next.delete(strId)
            else next.add(strId)
            return next
        })
    }

    const expandAll = () => {
        const allParentIds = new Set<string>()
        allTreeNodesMap.forEach((node, id) => {
            if (node.children.length > 0) {
                allParentIds.add(id)
            }
        })
        setExpandedIds(allParentIds)
    }

    const collapseAll = () => {
        setExpandedIds(new Set())
    }

    const visibleTreeRoots = useMemo(() => {
        if (!searchQuery.trim() && levelFilter === "all" && statusFilter === "all") {
            return treeRoots
        }
        return treeRoots.filter(r => r.matchesFilter || r.hasMatchingDescendant)
    }, [treeRoots, searchQuery, levelFilter, statusFilter])

    const flatMatchingNodes = useMemo(() => {
        const list: TreeNode[] = []
        allTreeNodesMap.forEach(node => {
            if (node.matchesFilter) list.push(node)
        })
        return list
    }, [allTreeNodesMap])

    const totalItemsCount = viewMode === "tree" ? visibleTreeRoots.length : flatMatchingNodes.length
    const totalPages = Math.max(1, Math.ceil(totalItemsCount / pageSize))

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(1)
    }, [totalPages, currentPage])

    const visibleRowsToRender = useMemo(() => {
        if (viewMode === "flat") {
            const start = (currentPage - 1) * pageSize
            return flatMatchingNodes.slice(start, start + pageSize)
        }

        const start = (currentPage - 1) * pageSize
        const paginatedRoots = visibleTreeRoots.slice(start, start + pageSize)

        const rows: TreeNode[] = []
        const traverse = (node: TreeNode) => {
            const shouldInclude = node.matchesFilter || node.hasMatchingDescendant
            if (!shouldInclude && (searchQuery.trim() || levelFilter !== "all" || statusFilter !== "all")) {
                return
            }

            rows.push(node)

            if (expandedIds.has(String(node.branch.id))) {
                node.children.forEach(child => traverse(child))
            }
        }

        paginatedRoots.forEach(root => traverse(root))
        return rows
    }, [viewMode, visibleTreeRoots, flatMatchingNodes, expandedIds, currentPage, pageSize, searchQuery, levelFilter, statusFilter])

    return (
        <div className="space-y-6">
            <ConfirmDialog />

            {(isAdding || editingId) && (
                <CardContainer
                    title={editingId ? "Edit Organization / Branch" : "Add New Organization / Branch"}
                    description={editingId ? "Update branch details, hierarchy & network preferences" : "Create a new head organization, main branch, or regional sub-branch"}
                    className="dark:bg-[#0f172a] dark:border-[#1e293b]"
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <Label className="dark:text-slate-300">Branch Name *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Arrownet Pvt Ltd or Charikot Branch"
                                        className="dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="dark:text-slate-300">Branch Code *</Label>
                                    <Input
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., BR-ARROWNET or SB-YATKHA"
                                        disabled={!!editingId}
                                        className="dark:bg-[#1e293b] dark:border-[#334155] dark:text-white uppercase font-mono"
                                    />
                                </div>
                                <div>
                                    <Label className="dark:text-slate-300">Contact Person</Label>
                                    <Input
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                        placeholder="e.g., Sushila Sharma"
                                        className="dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="dark:text-slate-300">Phone Number</Label>
                                        <Input
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            placeholder="9802022600"
                                            className="dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-300">Email Address</Label>
                                        <Input
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="info@arrownet.com.np"
                                            className="dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="dark:text-slate-300">Website / Logo URL</Label>
                                    <Input
                                        value={formData.logoUrl}
                                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label className="dark:text-slate-300">Address</Label>
                                    <Textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Full street address..."
                                        rows={2}
                                        className="dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="dark:text-slate-300">City</Label>
                                        <Input
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            placeholder="Kathmandu"
                                            className="dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-300">State / Province</Label>
                                        <Input
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            placeholder="Bagmati"
                                            className="dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="dark:text-slate-300">Zip / Postal Code</Label>
                                        <Input
                                            value={formData.zipCode}
                                            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                            placeholder="44600"
                                            className="dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-300">Country</Label>
                                        <Input
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            placeholder="Nepal"
                                            className="dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="dark:text-slate-300">Parent Organization / Branch</Label>
                                    <Select
                                        value={formData.parentId}
                                        onValueChange={(val) => setFormData({ ...formData, parentId: val })}
                                        disabled={!isGlobalAdmin && !editingId}
                                    >
                                        <SelectTrigger className="dark:bg-[#1e293b] dark:border-[#334155] dark:text-white">
                                            <SelectValue placeholder="Select Parent (None for Head Org)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- None (Head Organization) --</SelectItem>
                                            {branches
                                                .filter((b) => !editingId || b.id !== editingId)
                                                .map((b) => (
                                                    <SelectItem key={b.id} value={String(b.id)}>
                                                        {b.name} ({b.code})
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-between p-3.5 border rounded-lg dark:border-[#334155] dark:bg-[#1e293b]">
                                    <div>
                                        <h4 className="text-sm font-semibold dark:text-white">Active Status</h4>
                                        <p className="text-xs text-muted-foreground">Enable/Disable branch location</p>
                                    </div>
                                    <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-emerald-600" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-4 border-t dark:border-[#334155]">
                            <Button
                                onClick={saveBranch}
                                disabled={loading}
                                className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6"
                            >
                                <Save className="h-4 w-4" />
                                {loading ? "Saving..." : editingId ? "Update Branch" : "Create Branch"}
                            </Button>
                            <Button variant="outline" onClick={cancelEdit} disabled={loading} className="dark:border-[#334155] dark:text-slate-300">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </CardContainer>
            )}

            {!isAdding && !editingId && (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight dark:text-white">Organization & Branch Directory</h2>
                            <p className="text-sm text-muted-foreground dark:text-slate-400">
                                Explore and manage head organizations, operational branches, and regional sub-branches
                            </p>
                        </div>
                        <Button onClick={startAdding} className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold">
                            <Plus className="h-4 w-4" /> Add Branch
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-semibold dark:text-white">Branch Overview & Hierarchy</h3>
                                <p className="text-xs text-muted-foreground dark:text-slate-400">
                                    Live summary of Organizations ({totalOrgCount}), Branches ({totalBranchCount}), and Sub-Branches ({totalSubCount})
                                </p>
                            </div>
                        </div>
                        <BranchStatsCards
                            stats={overallStats}
                            loading={statsLoading}
                            onRefresh={handleRefreshStats}
                        />
                    </div>

                    {selectedBranchStats && (
                        <CardContainer title="Branch Statistics" className="mb-6 dark:bg-[#0f172a] dark:border-[#1e293b]">
                            {statsLoading ? (
                                <div className="text-center py-4 dark:text-slate-400">Loading statistics...</div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg border dark:border-blue-500/20">
                                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Users</div>
                                        <div className="text-2xl font-bold dark:text-white">{selectedBranchStats.counts?.users || 0}</div>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-lg border dark:border-emerald-500/20">
                                        <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Customers</div>
                                        <div className="text-2xl font-bold dark:text-white">{selectedBranchStats.counts?.customers || 0}</div>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-500/10 p-4 rounded-lg border dark:border-purple-500/20">
                                        <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Leads</div>
                                        <div className="text-2xl font-bold dark:text-white">{selectedBranchStats.counts?.leads || 0}</div>
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-lg border dark:border-amber-500/20">
                                        <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">OLTs</div>
                                        <div className="text-2xl font-bold dark:text-white">{selectedBranchStats.counts?.olts || 0}</div>
                                    </div>
                                    <div className="bg-pink-50 dark:bg-pink-500/10 p-4 rounded-lg border dark:border-pink-500/20">
                                        <div className="text-sm text-pink-600 dark:text-pink-400 font-medium">ONTs</div>
                                        <div className="text-2xl font-bold dark:text-white">{selectedBranchStats.counts?.onts || 0}</div>
                                    </div>
                                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-lg border dark:border-indigo-500/20">
                                        <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Splitters</div>
                                        <div className="text-2xl font-bold dark:text-white">{selectedBranchStats.counts?.splitters || 0}</div>
                                    </div>
                                </div>
                            )}
                        </CardContainer>
                    )}

                    <CardContainer
                        title="Branch Directory & Hierarchy"
                        description={`Total ${branches.length} records in system (${totalOrgCount} Organizations, ${totalBranchCount} Branches, ${totalSubCount} Sub-Branches)`}
                        className="dark:bg-[#0f172a] dark:border-[#1e293b]"
                    >
                        <div className="space-y-4">
                            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between pb-1">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by branch name, code, contact, phone, location, parent organization..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-8 text-xs h-9 dark:bg-[#1e293b] dark:border-[#334155]"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40 dark:bg-[#1e293b]">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode("tree")}
                                            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                viewMode === "tree"
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                            title="Interactive Expandable Tree View"
                                        >
                                            <FolderTree className="h-3.5 w-3.5" />
                                            Tree View
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode("flat")}
                                            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                viewMode === "flat"
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                            title="Flat Tabular List View"
                                        >
                                            <List className="h-3.5 w-3.5" />
                                            Flat List
                                        </button>
                                    </div>

                                    {viewMode === "tree" && (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={expandAll}
                                                className="h-9 text-xs px-2.5 dark:bg-[#1e293b] dark:border-[#334155]"
                                                title="Expand all branches & sub-branches"
                                            >
                                                Expand All
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={collapseAll}
                                                className="h-9 text-xs px-2.5 dark:bg-[#1e293b] dark:border-[#334155]"
                                                title="Collapse to top-level organizations"
                                            >
                                                Collapse All
                                            </Button>
                                        </div>
                                    )}

                                    <Select value={levelFilter} onValueChange={(val: any) => setLevelFilter(val)}>
                                        <SelectTrigger className="w-[170px] h-9 text-xs dark:bg-[#1e293b] dark:border-[#334155]">
                                            <SelectValue placeholder="All Levels" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Levels ({branches.length})</SelectItem>
                                            <SelectItem value="organization">Organizations ({totalOrgCount})</SelectItem>
                                            <SelectItem value="branch">Branches ({totalBranchCount})</SelectItem>
                                            <SelectItem value="subbranch">Sub-Branches ({totalSubCount})</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                                        <SelectTrigger className="w-[130px] h-9 text-xs dark:bg-[#1e293b] dark:border-[#334155]">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">Active Only</SelectItem>
                                            <SelectItem value="inactive">Inactive Only</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
                                        <SelectTrigger className="w-[105px] h-9 text-xs dark:bg-[#1e293b] dark:border-[#334155]">
                                            <SelectValue placeholder="10 / page" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10 / page</SelectItem>
                                            <SelectItem value="25">25 / page</SelectItem>
                                            <SelectItem value="50">50 / page</SelectItem>
                                            <SelectItem value="100">100 / page</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-12 text-muted-foreground dark:text-slate-400">Loading branches...</div>
                            ) : visibleRowsToRender.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground dark:text-slate-400 border rounded-lg border-dashed">
                                    {searchQuery || levelFilter !== "all" || statusFilter !== "all"
                                        ? "No branches match the specified search and filter criteria."
                                        : "No branches found. Click 'Add Branch' or use 'Import Branches' to add records."}
                                </div>
                            ) : (
                                <div className="rounded-xl border dark:border-[#1e293b] overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50 dark:bg-[#1e293b]">
                                            <TableRow className="dark:border-b-[#1e293b]">
                                                <TableHead className="w-32 dark:text-slate-400 font-semibold text-xs">Code</TableHead>
                                                <TableHead className="dark:text-slate-400 font-semibold text-xs">Name & Hierarchy</TableHead>
                                                <TableHead className="w-36 dark:text-slate-400 font-semibold text-xs">Level</TableHead>
                                                <TableHead className="dark:text-slate-400 font-semibold text-xs">Contact</TableHead>
                                                <TableHead className="dark:text-slate-400 font-semibold text-xs">Location</TableHead>
                                                <TableHead className="dark:text-slate-400 font-semibold text-xs">Subscribers & Devices</TableHead>
                                                <TableHead className="w-24 dark:text-slate-400 font-semibold text-xs">Status</TableHead>
                                                <TableHead className="w-24 dark:text-slate-400 font-semibold text-xs">Created</TableHead>
                                                <TableHead className="text-right dark:text-slate-400 font-semibold text-xs">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleRowsToRender.map((node) => {
                                                const { branch, level, depth, children, totalSubCount } = node
                                                const isExpanded = expandedIds.has(String(branch.id))
                                                const hasChildren = children.length > 0
                                                const indentStyle = viewMode === "tree" ? { paddingLeft: `${Math.max(12, depth * 28 + 12)}px` } : {}

                                                return (
                                                    <TableRow
                                                        key={branch.id}
                                                        onClick={() => hasChildren && toggleExpand(branch.id)}
                                                        className={`dark:border-b-[#1e293b] transition-colors ${
                                                            hasChildren ? "cursor-pointer" : ""
                                                        } ${
                                                            level === "organization"
                                                                ? "bg-card hover:bg-muted/40 font-medium"
                                                                : level === "branch"
                                                                ? "bg-amber-500/[0.02] dark:bg-amber-500/[0.03] hover:bg-amber-500/[0.06]"
                                                                : "bg-purple-500/[0.02] dark:bg-purple-500/[0.03] hover:bg-purple-500/[0.06]"
                                                        }`}
                                                    >
                                                        <TableCell className="font-medium dark:text-white">
                                                            <Badge variant="outline" className="font-mono text-xs dark:border-[#334155] dark:text-slate-300">
                                                                {branch.code}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell style={indentStyle}>
                                                            <div className="flex items-center gap-2">
                                                                {viewMode === "tree" && (
                                                                    <div className="shrink-0">
                                                                        {hasChildren ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => toggleExpand(branch.id, e)}
                                                                                className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center text-foreground transition-transform"
                                                                                title={isExpanded ? "Collapse sub-items" : "Expand sub-items"}
                                                                            >
                                                                                {isExpanded ? (
                                                                                    <ChevronDown className="h-4 w-4 text-primary" />
                                                                                ) : (
                                                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                                                )}
                                                                            </button>
                                                                        ) : depth > 0 ? (
                                                                            <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground ml-1 mr-1.5 opacity-60" />
                                                                        ) : (
                                                                            <div className="w-6" />
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-semibold text-sm dark:text-white flex items-center gap-1.5 flex-wrap">
                                                                        {level === "organization" ? (
                                                                            <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                                                                        ) : level === "branch" ? (
                                                                            <Building className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                                        ) : (
                                                                            <GitBranch className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                                                                        )}
                                                                        <span className="truncate">{branch.name}</span>
                                                                        {hasChildren && (
                                                                            <span
                                                                                onClick={(e) => toggleExpand(branch.id, e)}
                                                                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted/80 hover:bg-muted text-foreground border border-border transition-colors cursor-pointer"
                                                                            >
                                                                                <GitBranch className="h-3 w-3 text-purple-500" />
                                                                                {totalSubCount} {totalSubCount === 1 ? 'sub-item' : 'sub-items'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {branch.parent && (
                                                                        <div className="text-[11px] text-muted-foreground dark:text-slate-400 mt-0.5 flex items-center gap-1">
                                                                            <span>Parent:</span>
                                                                            <span className="font-medium text-foreground">{branch.parent.name}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {level === "organization" ? (
                                                                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-medium">
                                                                    <Building2 className="h-3 w-3 mr-1" />
                                                                    Organization
                                                                </Badge>
                                                            ) : level === "branch" ? (
                                                                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium">
                                                                    <Building className="h-3 w-3 mr-1" />
                                                                    Branch
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-medium">
                                                                    <GitBranch className="h-3 w-3 mr-1" />
                                                                    Sub-Branch
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-0.5 text-xs">
                                                                {branch.contactPerson && (
                                                                    <div className="font-medium text-foreground">{branch.contactPerson}</div>
                                                                )}
                                                                {branch.phoneNumber && (
                                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                                        <Phone className="h-3 w-3 shrink-0" />
                                                                        <span>{branch.phoneNumber}</span>
                                                                    </div>
                                                                )}
                                                                {branch.email && (
                                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                                        <Mail className="h-3 w-3 shrink-0" />
                                                                        <span className="truncate max-w-[150px]">{branch.email}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {branch.city || branch.address ? (
                                                                <div className="space-y-0.5 text-xs">
                                                                    {branch.city && (
                                                                        <div className="flex items-center gap-1 font-medium text-foreground">
                                                                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                            <span>{branch.city}{branch.state ? `, ${branch.state}` : ''}</span>
                                                                        </div>
                                                                    )}
                                                                    {branch.address && (
                                                                        <div className="text-muted-foreground truncate max-w-[160px]">
                                                                            {branch.address}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-1">
                                                                <Badge variant="secondary" className="text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none">
                                                                    Users: {branch._count?.users || 0}
                                                                </Badge>
                                                                <Badge variant="secondary" className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none">
                                                                    Cust: {branch._count?.customers || 0}
                                                                </Badge>
                                                                <Badge variant="secondary" className="text-[11px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-none">
                                                                    Leads: {branch._count?.leads || 0}
                                                                </Badge>
                                                                {(branch._count?.olts || 0) > 0 && (
                                                                    <Badge variant="secondary" className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none">
                                                                        OLT: {branch._count?.olts}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                className={`text-xs ${
                                                                    branch.isActive
                                                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                                        : "bg-red-500/10 text-red-600 border-red-500/20"
                                                                }`}
                                                                variant="outline"
                                                            >
                                                                {branch.isActive ? "Active" : "Inactive"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-xs text-muted-foreground">
                                                                {new Date(branch.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => viewStats(branch)}
                                                                    className="h-7 w-7 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                                                                    title="View Statistics"
                                                                    disabled={statsLoading}
                                                                >
                                                                    {statsLoading && selectedBranchStats?.branch?.id === branch.id ? (
                                                                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                                                    ) : (
                                                                        <BarChart3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                                    )}
                                                                </Button>
                                                                {isGlobalAdmin && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => window.location.href = `/branch/${branch.id}/settings`}
                                                                        className="h-7 w-7 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                                                                        title="Branch Settings"
                                                                    >
                                                                        <Settings className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => disconnectBranchSessions(branch)}
                                                                    className="h-7 w-7 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/20"
                                                                    title="Disconnect RADIUS sessions"
                                                                    disabled={disconnectingBranchId === branch.id || !(branch._count?.customers || 0)}
                                                                >
                                                                    {disconnectingBranchId === branch.id ? (
                                                                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
                                                                    ) : (
                                                                        <WifiOff className="h-3.5 w-3.5" />
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => editBranch(branch)}
                                                                    className="h-7 w-7 text-foreground hover:bg-muted"
                                                                    title="Edit"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => deleteBranch(branch.id)}
                                                                    className="h-7 w-7 text-destructive hover:bg-red-100 dark:hover:bg-red-500/20"
                                                                    title="Delete"
                                                                    disabled={branch._count && (branch._count.users > 0 || branch._count.customers > 0)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {totalItemsCount > 0 && (
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-xs text-muted-foreground">
                                    <div>
                                        {viewMode === "tree" ? (
                                            <>
                                                Showing <span className="font-semibold text-foreground">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                                                <span className="font-semibold text-foreground">
                                                    {Math.min(currentPage * pageSize, totalItemsCount)}
                                                </span>{" "}
                                                of <span className="font-semibold text-foreground">{totalItemsCount}</span> root organizations (with expandable sub-branches)
                                            </>
                                        ) : (
                                            <>
                                                Showing <span className="font-semibold text-foreground">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                                                <span className="font-semibold text-foreground">
                                                    {Math.min(currentPage * pageSize, totalItemsCount)}
                                                </span>{" "}
                                                of <span className="font-semibold text-foreground">{totalItemsCount}</span> branches
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 text-xs"
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            title="First Page"
                                        >
                                            <ChevronsLeft className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 text-xs"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            title="Previous Page"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="px-2 font-medium text-foreground">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 text-xs"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            title="Next Page"
                                        >
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 text-xs"
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            title="Last Page"
                                        >
                                            <ChevronsRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContainer>
                </>
            )}
        </div>
    )
}
