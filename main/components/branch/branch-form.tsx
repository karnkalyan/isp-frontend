"use client"

import React, { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-hot-toast"
import { Save, Plus, Pencil, Trash2, MapPin, Building, Phone, Mail, Globe, User, BarChart3 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { apiRequest } from "@/lib/api"
import { useConfirmToast } from "@/hooks/use-confirm-toast"
import { BranchStatsCards } from "./branch-stat-cards"

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
    createdAt: string
    updatedAt: string
    _count?: {
        users: number
        customers: number
        leads: number
        olts: number
        onts: number
    }
}

export default function BranchForm() {
    const [branches, setBranches] = useState<Branch[]>([])
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [statsLoading, setStatsLoading] = useState(false)
    const [selectedBranchStats, setSelectedBranchStats] = useState<any>(null)
    const [overallStats, setOverallStats] = useState({
        totalBranches: 0,
        totalUsers: 0,
        activeCustomers: 0,
        totalDevices: 0,
        activeBranches: 0,
        totalLeads: 0,
        totalOLTs: 0,
        totalONTs: 0
    })

    // Use the confirm toast hook
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
    })

    const [isActive, setIsActive] = useState(true)

    // Fetch branches on component mount
    useEffect(() => {
        fetchBranches()
        fetchOverallStats()
    }, [])

    const fetchBranches = async () => {
        try {
            setLoading(true)
            const data = await apiRequest("/branches")
            setBranches(data)
            updateOverallStats(data)
        } catch (error) {
            console.error("Failed to fetch branches:", error)
            toast.error("Failed to load branches")
        } finally {
            setLoading(false)
        }
    }

    const fetchOverallStats = async () => {
        try {
            const stats = await apiRequest("/branches/stats/overall")
            setOverallStats(stats)
        } catch (error) {
            console.error("Failed to fetch overall stats:", error)
        }
    }

    const updateOverallStats = (branchesData: Branch[]) => {
        const activeBranches = branchesData.filter(b => b.isActive).length
        const totalUsers = branchesData.reduce((sum, branch) => sum + (branch._count?.users || 0), 0)
        const totalCustomers = branchesData.reduce((sum, branch) => sum + (branch._count?.customers || 0), 0)
        const totalLeads = branchesData.reduce((sum, branch) => sum + (branch._count?.leads || 0), 0)
        const totalOLTs = branchesData.reduce((sum, branch) => sum + (branch._count?.olts || 0), 0)
        const totalONTs = branchesData.reduce((sum, branch) => sum + (branch._count?.onts || 0), 0)

        setOverallStats(prev => ({
            ...prev,
            totalBranches: branchesData.length,
            activeBranches,
            totalUsers,
            activeCustomers: totalCustomers, // Note: You might want to filter active customers
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
        }

        try {
            setLoading(true)

            if (editingId) {
                // Update existing branch
                await apiRequest(`/branches/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                })
                toast.success("Branch updated successfully")
            } else {
                // Create new branch
                await apiRequest("/branches", {
                    method: 'POST',
                    body: JSON.stringify(payload),
                })
                toast.success("Branch created successfully")
            }

            // Refresh list and reset form
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
        await fetchBranches()
        toast.success("Stats refreshed")
    }

    return (
        <div className="space-y-6">
            {/* Render the confirm dialog */}
            <ConfirmDialog />

            {/* Form for Add/Edit */}
            {(isAdding || editingId) && (
                <CardContainer
                    title={editingId ? "Edit Branch" : "Add New Branch"}
                    description={editingId ? "Update branch details" : "Create a new branch"}
                    icon={Building}
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Branch Name <span className="text-red-500 dark:text-red-400">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Main Branch, Kathmandu"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="dark:bg-[#1e293b] dark:border-[#334155]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">
                                    Branch Code <span className="text-red-500 dark:text-red-400">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    placeholder="e.g. MB-KTM"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="dark:bg-[#1e293b] dark:border-[#334155]"
                                />
                                <p className="text-xs text-muted-foreground dark:text-slate-400">Unique identifier for the branch</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson" className="dark:text-slate-300">Contact Person</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                    <Input
                                        id="contactPerson"
                                        placeholder="e.g. John Doe"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                        className="pl-10 dark:bg-[#1e293b] dark:border-[#334155]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber" className="dark:text-slate-300">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                    <Input
                                        id="phoneNumber"
                                        placeholder="e.g. +977 1234567890"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        className="pl-10 dark:bg-[#1e293b] dark:border-[#334155]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="dark:text-slate-300">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="e.g. branch@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="pl-10 dark:bg-[#1e293b] dark:border-[#334155]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="logoUrl" className="dark:text-slate-300">Logo URL</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                    <Input
                                        id="logoUrl"
                                        placeholder="https://example.com/logo.png"
                                        value={formData.logoUrl}
                                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                        className="pl-10 dark:bg-[#1e293b] dark:border-[#334155]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="dark:text-slate-300">Address</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                <Textarea
                                    id="address"
                                    placeholder="Enter full address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={2}
                                    className="pl-10 dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city" className="dark:text-slate-300">City</Label>
                                <Input
                                    id="city"
                                    placeholder="e.g. Kathmandu"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="dark:bg-[#1e293b] dark:border-[#334155]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state" className="dark:text-slate-300">State/Province</Label>
                                <Input
                                    id="state"
                                    placeholder="e.g. Bagmati"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    className="dark:bg-[#1e293b] dark:border-[#334155]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country" className="dark:text-slate-300">Country</Label>
                                <Input
                                    id="country"
                                    placeholder="e.g. Nepal"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="dark:bg-[#1e293b] dark:border-[#334155]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="zipCode" className="dark:text-slate-300">Zip/Postal Code</Label>
                                <Input
                                    id="zipCode"
                                    placeholder="e.g. 44600"
                                    value={formData.zipCode}
                                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                    className="dark:bg-[#1e293b] dark:border-[#334155]"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg dark:border-[#334155] dark:bg-[#1e293b]">
                                <div>
                                    <h4 className="font-medium dark:text-white">Branch Status</h4>
                                    <p className="text-sm text-muted-foreground dark:text-slate-400">Active branches can be assigned to users and customers</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm dark:text-slate-300">{isActive ? "Active" : "Inactive"}</span>
                                    <Switch
                                        checked={isActive}
                                        onCheckedChange={setIsActive}
                                        className="data-[state=checked]:bg-green-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t dark:border-[#334155]">
                            <Button
                                onClick={saveBranch}
                                disabled={loading}
                                className="flex items-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-700"
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

            {/* List of Branches */}
            {!isAdding && !editingId && (
                <>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight dark:text-white">Branches</h2>
                            <p className="text-muted-foreground dark:text-slate-400">Manage your ISP branches and locations</p>
                        </div>
                        <Button onClick={startAdding} className="flex items-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-700">
                            <Plus className="h-4 w-4" /> Add Branch
                        </Button>
                    </div>

                    {/* Overall Stats with Refresh */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold dark:text-white">Branch Overview</h3>
                                <p className="text-sm text-muted-foreground dark:text-slate-400">Real-time statistics across all branches</p>
                            </div>
                            {/* <Button
                                variant="outline"
                                onClick={handleRefreshStats}
                                className="dark:border-[#334155] dark:text-slate-300"
                            >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Refresh Stats
                            </Button> */}
                        </div>
                        <BranchStatsCards
                            stats={overallStats}
                            loading={statsLoading}
                            onRefresh={handleRefreshStats}
                        />
                    </div>

                    {/* Selected Branch Statistics */}
                    {selectedBranchStats && (
                        <CardContainer title="Branch Statistics" className="mb-6 dark:bg-[#0f172a] dark:border-[#1e293b]">
                            {statsLoading ? (
                                <div className="text-center py-4 dark:text-slate-400">Loading statistics...</div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg border dark:border-blue-500/20">
                                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Users</div>
                                        <div className="text-2xl font-bold dark:text-white">{selectedBranchStats.counts.users}</div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-lg border dark:border-green-500/20">
                                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">Customers</div>
                                        <div className="text-2xl font-bold dark:text-white">{selectedBranchStats.counts.customers}</div>
                                        <div className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
                                            Active: {selectedBranchStats.customerStats?.active || 0}
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-500/10 p-4 rounded-lg border dark:border-purple-500/20">
                                        <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Leads</div>
                                        <div className="text-2xl font-bold dark:text-white">{selectedBranchStats.counts.leads}</div>
                                        <div className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
                                            New: {selectedBranchStats.leadStats?.new || 0}
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-500/10 p-4 rounded-lg border dark:border-orange-500/20">
                                        <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">OLTs</div>
                                        <div className="text-2xl font-bold dark:text-white">{selectedBranchStats.counts.olts}</div>
                                    </div>
                                    <div className="bg-pink-50 dark:bg-pink-500/10 p-4 rounded-lg border dark:border-pink-500/20">
                                        <div className="text-sm text-pink-600 dark:text-pink-400 font-medium">ONTs</div>
                                        <div className="text-2xl font-bold dark:text-white">{selectedBranchStats.counts.onts}</div>
                                    </div>
                                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-lg border dark:border-indigo-500/20">
                                        <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Splitters</div>
                                        <div className="text-2xl font-bold dark:text-white">{selectedBranchStats.counts.splitters}</div>
                                    </div>
                                </div>
                            )}
                        </CardContainer>
                    )}

                    <CardContainer className="dark:bg-[#0f172a] dark:border-[#1e293b]">
                        {loading ? (
                            <div className="text-center py-8 dark:text-slate-400">Loading branches...</div>
                        ) : branches.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground dark:text-slate-400">
                                No branches found. Add your first branch.
                            </div>
                        ) : (
                            <div className="rounded-md border dark:border-[#1e293b] overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="dark:border-b-[#1e293b] dark:hover:bg-[#1e293b]">
                                            <TableHead className="dark:text-slate-400">Code</TableHead>
                                            <TableHead className="dark:text-slate-400">Branch Name</TableHead>
                                            <TableHead className="dark:text-slate-400">Contact</TableHead>
                                            <TableHead className="dark:text-slate-400">Location</TableHead>
                                            <TableHead className="dark:text-slate-400">Statistics</TableHead>
                                            <TableHead className="dark:text-slate-400">Status</TableHead>
                                            <TableHead className="dark:text-slate-400">Created</TableHead>
                                            <TableHead className="text-right dark:text-slate-400">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {branches.map((branch) => (
                                            <TableRow key={branch.id} className="dark:border-b-[#1e293b] dark:hover:bg-[#1e293b]">
                                                <TableCell className="font-medium dark:text-white">
                                                    <Badge variant="outline" className="font-mono dark:border-[#334155] dark:text-slate-300">
                                                        {branch.code}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium dark:text-white">{branch.name}</div>
                                                    {branch.contactPerson && (
                                                        <div className="text-sm text-muted-foreground dark:text-slate-400">
                                                            {branch.contactPerson}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {branch.email && (
                                                            <div className="flex items-center gap-2 text-sm dark:text-slate-300">
                                                                <Mail className="h-3 w-3" />
                                                                {branch.email}
                                                            </div>
                                                        )}
                                                        {branch.phoneNumber && (
                                                            <div className="flex items-center gap-2 text-sm dark:text-slate-300">
                                                                <Phone className="h-3 w-3" />
                                                                {branch.phoneNumber}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {branch.city ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 dark:text-slate-300">
                                                                <MapPin className="h-3 w-3 text-muted-foreground dark:text-slate-500" />
                                                                <span>{branch.city}</span>
                                                            </div>
                                                            {branch.address && (
                                                                <div className="text-xs text-muted-foreground dark:text-slate-500 truncate max-w-[200px]">
                                                                    {branch.address}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground dark:text-slate-500">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant="secondary" className="text-xs dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                                                            Users: {branch._count?.users || 0}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
                                                            Customers: {branch._count?.customers || 0}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20">
                                                            Leads: {branch._count?.leads || 0}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`${branch.isActive
                                                            ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
                                                            : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30"
                                                            }`}
                                                    >
                                                        {branch.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-muted-foreground dark:text-slate-400">
                                                        {new Date(branch.createdAt).toLocaleDateString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => viewStats(branch)}
                                                            className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                                                            title="View Statistics"
                                                            disabled={statsLoading}
                                                        >
                                                            {statsLoading && selectedBranchStats?.branch?.id === branch.id ? (
                                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 dark:border-blue-400 border-t-transparent" />
                                                            ) : (
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                                </svg>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => editBranch(branch)}
                                                            className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => deleteBranch(branch.id)}
                                                            className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20"
                                                            title="Delete"
                                                            disabled={branch._count && (branch._count.users > 0 || branch._count.customers > 0)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContainer>
                </>
            )}
        </div>
    )
}