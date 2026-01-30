"use client"

import React, { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { toast } from "react-hot-toast"
import {
    Save,
    Plus,
    Pencil,
    Trash2,
    Users,
    Building,
    Search,
    Archive,
    RotateCcw,
    Filter,
    X,
    MapPin,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { departmentApi } from "@/lib/api/department"
import { useConfirmToast } from "@/hooks/use-confirm-toast"
import type { Department } from "@/types/department"
import { apiRequest } from "@/lib/api"

type Branch = {
    id: string
    name: string
    code: string
}

interface PaginationInfo {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
}

interface DepartmentResponse {
    data: Department[]
    pagination: PaginationInfo
}

export default function DepartmentForm() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [deletedDepartments, setDeletedDepartments] = useState<Department[]>([])
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingDeleted, setLoadingDeleted] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [branches, setBranches] = useState<Branch[]>([])
    const [activeTab, setActiveTab] = useState("active")

    // Pagination state
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
    })

    const [deletedPagination, setDeletedPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
    })

    // Filters
    const [filters, setFilters] = useState({
        includeInactive: false,
        branchId: "all",
    })

    // Use the confirm toast hook
    const { confirm, ConfirmDialog } = useConfirmToast()

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        branchId: "none",
        isActive: true,
    })

    // Fetch departments and branches on component mount
    useEffect(() => {
        fetchDepartments()
        fetchBranches()
    }, [])

    useEffect(() => {
        if (activeTab === "deleted") {
            fetchDeletedDepartments()
        }
    }, [activeTab])

    const fetchBranches = async () => {
        try {
            const data = await apiRequest("/branches")
            setBranches(data)
        } catch (error) {
            console.error("Failed to fetch branches:", error)
        }
    }

    const fetchDepartments = async (page: number = 1, search: string = "") => {
        try {
            setLoading(true)
            const params: any = {
                page,
                limit: pagination.limit
            }

            if (filters.includeInactive) params.includeInactive = true
            if (filters.branchId && filters.branchId !== "all" && filters.branchId !== "none") {
                params.branchId = filters.branchId
            }

            // Only add search param if searchQuery exists
            if (search) {
                params.search = search
            } else if (searchQuery && searchQuery.trim()) {
                params.search = searchQuery.trim()
            }

            console.log("Fetching departments with params:", params)

            const response = await departmentApi.getAll(params)

            if (response && response.data) {
                setDepartments(response.data)
                if (response.pagination) {
                    setPagination(response.pagination)
                }
            } else {
                setDepartments(response || [])
            }
        } catch (error) {
            console.error("Failed to fetch departments:", error)
            toast.error("Failed to load departments")
            setDepartments([])
        } finally {
            setLoading(false)
        }
    }

    const fetchDeletedDepartments = async (page: number = 1) => {
        try {
            setLoadingDeleted(true)
            const params = {
                page,
                limit: deletedPagination.limit
            }

            const response = await departmentApi.getDeleted(params)

            if (response && response.data) {
                setDeletedDepartments(response.data)
                if (response.pagination) {
                    setDeletedPagination(response.pagination)
                }
            } else {
                setDeletedDepartments(response || [])
            }
        } catch (error) {
            console.error("Failed to fetch deleted departments:", error)
            toast.error("Failed to load deleted departments")
            setDeletedDepartments([])
        } finally {
            setLoadingDeleted(false)
        }
    }

    const searchDepartments = async (page: number = 1) => {
        try {
            setLoading(true)
            const params: any = {
                page,
                limit: pagination.limit
            }

            if (filters.includeInactive) params.includeInactive = true
            if (filters.branchId && filters.branchId !== "all" && filters.branchId !== "none") {
                params.branchId = filters.branchId
            }

            console.log("Searching with query:", searchQuery)
            console.log("Search params:", params)

            const response = await departmentApi.search(searchQuery.trim(), params)

            if (response && response.data) {
                setDepartments(response.data)
                if (response.pagination) {
                    setPagination(response.pagination)
                }
            } else {
                setDepartments(response || [])
            }
        } catch (error) {
            console.error("Search error:", error)
            toast.error("Failed to search departments")
            setDepartments([])
        } finally {
            setLoading(false)
        }
    }

    const validate = () => {
        if (!formData.name.trim()) {
            toast.error("Department name is required")
            return false
        }
        return true
    }

    const saveDepartment = async () => {
        if (!validate()) return

        const payload = {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            branchId: formData.branchId === "none" ? null : formData.branchId,
            isActive: formData.isActive,
        }

        try {
            setLoading(true)

            if (editingId) {
                // Update existing department
                await departmentApi.update(editingId, payload)
                toast.success("Department updated successfully")
            } else {
                // Create new department
                await departmentApi.create(payload)
                toast.success("Department created successfully")
            }

            // Refresh list and reset form
            if (searchQuery.trim()) {
                searchDepartments(1)
            } else {
                fetchDepartments(1)
            }
            resetForm()
        } catch (error: any) {
            console.error("Save error:", error)
            toast.error(error.message || "Failed to save department")
        } finally {
            setLoading(false)
        }
    }

    const editDepartment = (department: Department) => {
        setEditingId(department.id)
        setFormData({
            name: department.name,
            description: department.description || "",
            branchId: department.branchId || "none",
            isActive: department.isActive,
        })
        setIsAdding(true)
    }

    const deleteDepartment = async (department: Department) => {
        const isConfirmed = await confirm({
            title: "Delete Department",
            message: `Are you sure you want to delete "${department.name}"? This will move it to the recycle bin.`,
            type: "danger",
            confirmText: "Delete",
            cancelText: "Cancel",
        })

        if (!isConfirmed) return

        try {
            setLoading(true)
            await departmentApi.delete(department.id)
            toast.success("Department moved to recycle bin")
            if (searchQuery.trim()) {
                searchDepartments(pagination.page)
            } else {
                fetchDepartments(pagination.page)
            }
            if (activeTab === "deleted") {
                fetchDeletedDepartments(deletedPagination.page)
            }
        } catch (error: any) {
            console.error("Delete error:", error)
            toast.error(error.message || "Failed to delete department")
        } finally {
            setLoading(false)
        }
    }

    const restoreDepartment = async (department: Department) => {
        const isConfirmed = await confirm({
            title: "Restore Department",
            message: `Are you sure you want to restore "${department.name}"?`,
            type: "warning",
            confirmText: "Restore",
            cancelText: "Cancel",
        })

        if (!isConfirmed) return

        try {
            setLoading(true)
            await departmentApi.restore(department.id)
            toast.success("Department restored successfully")
            fetchDepartments(pagination.page)
            fetchDeletedDepartments(deletedPagination.page)
        } catch (error: any) {
            console.error("Restore error:", error)
            toast.error(error.message || "Failed to restore department")
        } finally {
            setLoading(false)
        }
    }

    const toggleDepartmentStatus = async (department: Department) => {
        const action = department.isActive ? "deactivate" : "activate"
        const isConfirmed = await confirm({
            title: `${action === 'activate' ? 'Activate' : 'Deactivate'} Department`,
            message: `Are you sure you want to ${action} "${department.name}"?`,
            type: action === 'deactivate' ? "warning" : "info",
            confirmText: action === 'activate' ? 'Activate' : 'Deactivate',
            cancelText: "Cancel",
        })

        if (!isConfirmed) return

        try {
            setLoading(true)
            await departmentApi.toggleStatus(department.id)
            toast.success(`Department ${action}d successfully`)
            if (searchQuery.trim()) {
                searchDepartments(pagination.page)
            } else {
                fetchDepartments(pagination.page)
            }
        } catch (error: any) {
            console.error("Toggle status error:", error)
            toast.error(error.message || `Failed to ${action} department`)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            branchId: "none",
            isActive: true,
        })
        setEditingId(null)
        setIsAdding(false)
    }

    const startAdding = () => {
        resetForm()
        setIsAdding(true)
    }

    const cancelEdit = () => {
        resetForm()
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            searchDepartments(1) // Reset to page 1 when searching
        } else {
            fetchDepartments(1) // Reset to page 1 when clearing search
        }
    }

    const clearFilters = () => {
        setFilters({
            includeInactive: false,
            branchId: "all",
        })
        setSearchQuery("")
        fetchDepartments(1)
    }

    const applyFilters = () => {
        if (searchQuery.trim()) {
            searchDepartments(1)
        } else {
            fetchDepartments(1)
        }
    }

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            if (searchQuery.trim()) {
                searchDepartments(newPage)
            } else {
                fetchDepartments(newPage)
            }
        }
    }

    const handleDeletedPageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= deletedPagination.totalPages) {
            fetchDeletedDepartments(newPage)
        }
    }

    const handleLimitChange = (newLimit: number) => {
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
        if (searchQuery.trim()) {
            searchDepartments(1)
        } else {
            fetchDepartments(1)
        }
    }

    const handleDeletedLimitChange = (newLimit: number) => {
        setDeletedPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
        fetchDeletedDepartments(1)
    }

    const getStatusBadge = (department: Department) => {
        if (department.isDeleted) {
            return (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400">
                    <Archive className="h-3 w-3 mr-1" /> Deleted
                </Badge>
            )
        }

        if (department.isActive) {
            return (
                <Badge className="bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                    Active
                </Badge>
            )
        }

        return (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400">
                Inactive
            </Badge>
        )
    }

    const getBranchBadge = (department: Department) => {
        if (!department.branch) {
            return (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400">
                    ISP Level
                </Badge>
            )
        }

        return (
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                {department.branch.code}
            </Badge>
        )
    }

    return (
        <div className="space-y-6">
            {/* Render the confirm dialog */}
            <ConfirmDialog />

            {/* Form for Add/Edit */}
            {(isAdding || editingId) && (
                <CardContainer
                    title={editingId ? "Edit Department" : "Add New Department"}
                    description={editingId ? "Update department details" : "Create a new department"}
                    icon={Building}
                    className="border dark:border-gray-800"
                >
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Department Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Sales Department, Technical Support"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="dark:bg-gray-900 dark:border-gray-700"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">Unique name for the department</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the department's responsibilities and functions..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="dark:bg-gray-900 dark:border-gray-700"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">Optional: Provide details about this department</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="branchId">Branch (Optional)</Label>
                                    <Select
                                        value={formData.branchId}
                                        onValueChange={(value) => setFormData({ ...formData, branchId: value })}
                                    >
                                        <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700">
                                            <SelectValue placeholder="Select a branch (optional)" />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                                            <SelectItem value="none">No Branch (ISP Level)</SelectItem>
                                            {branches.map((branch) => (
                                                <SelectItem key={branch.id} value={branch.id}>
                                                    {branch.name} ({branch.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Leave empty for ISP-level department</p>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-800 dark:bg-gray-900/50">
                                    <div>
                                        <h4 className="font-medium dark:text-gray-200">Department Status</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Active departments can be assigned to users</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm dark:text-gray-300">{formData.isActive ? "Active" : "Inactive"}</span>
                                        <Switch
                                            checked={formData.isActive}
                                            onCheckedChange={(v) => setFormData({ ...formData, isActive: Boolean(v) })}
                                            className="data-[state=checked]:bg-green-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t dark:border-gray-800">
                            <Button
                                onClick={saveDepartment}
                                disabled={loading}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                            >
                                <Save className="h-4 w-4" />
                                {loading ? "Saving..." : editingId ? "Update Department" : "Create Department"}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={cancelEdit}
                                disabled={loading}
                                className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </CardContainer>
            )}

            {/* List of Departments */}
            {!isAdding && !editingId && (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight dark:text-gray-100">Departments</h2>
                            <p className="text-gray-500 dark:text-gray-400">Organize users into departments for better management</p>
                        </div>
                        <Button
                            onClick={startAdding}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                        >
                            <Plus className="h-4 w-4" /> Add Department
                        </Button>
                    </div>

                    {/* Filters Panel */}
                    <CardContainer className="border dark:border-gray-800">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Search Bar */}
                                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                        <Input
                                            placeholder="Search departments by name or description..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 dark:bg-gray-900 dark:border-gray-700"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        className="dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        Search
                                    </Button>
                                    {searchQuery && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setSearchQuery("")
                                                fetchDepartments(1)
                                            }}
                                            className="dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
                                        >
                                            <X className="h-4 w-4 mr-1" /> Clear
                                        </Button>
                                    )}
                                </form>

                                {/* Filter Toggle */}
                                <Button
                                    variant="outline"
                                    onClick={() => setFilters({ ...filters, includeInactive: !filters.includeInactive })}
                                    className={`flex items-center gap-2 ${filters.includeInactive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                >
                                    <Filter className="h-4 w-4" />
                                    {filters.includeInactive ? "Showing All" : "Active Only"}
                                </Button>
                            </div>

                            {/* Additional Filters */}
                            <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <Label htmlFor="branchFilter" className="text-sm dark:text-gray-400">Filter by Branch</Label>
                                    <Select
                                        value={filters.branchId}
                                        onValueChange={(value) => setFilters({ ...filters, branchId: value })}
                                    >
                                        <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700">
                                            <SelectValue placeholder="Select branch filter">
                                                {filters.branchId === "all" ? "All Branches" :
                                                    filters.branchId === "none" ? "ISP Level Only" :
                                                        branches.find(b => b.id === filters.branchId)?.name || "Select branch"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                                            <SelectItem value="all">All Branches</SelectItem>
                                            <SelectItem value="none">ISP Level Only</SelectItem>
                                            {branches.map((branch) => (
                                                <SelectItem key={branch.id} value={branch.id}>
                                                    {branch.name} ({branch.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={applyFilters}
                                        className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        Apply Filters
                                    </Button>
                                    {(filters.includeInactive || (filters.branchId !== "all" && filters.branchId !== "none") || searchQuery) && (
                                        <Button
                                            variant="ghost"
                                            onClick={clearFilters}
                                            className="dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
                                        >
                                            <X className="h-4 w-4 mr-1" /> Clear Filters
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContainer>

                    {/* Tabs for Active/Deleted */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                        <TabsList className="bg-gray-100 dark:bg-gray-900">
                            <TabsTrigger
                                value="active"
                                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                            >
                                <Building className="h-4 w-4 mr-2" />
                                Active Departments
                                <Badge className="ml-2 bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                    {pagination.total}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="deleted"
                                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                            >
                                <Archive className="h-4 w-4 mr-2" />
                                Recycle Bin
                                <Badge className="ml-2 bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400">
                                    {deletedPagination.total}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="active" className="space-y-4">
                            <CardContainer className="border dark:border-gray-800">
                                {loading ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                        <p className="mt-2">Loading departments...</p>
                                    </div>
                                ) : departments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Building className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700" />
                                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No departments found</h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {searchQuery || (filters.branchId !== "all" && filters.branchId !== "none") || filters.includeInactive
                                                ? "Try adjusting your search or filters"
                                                : "Get started by creating your first department"}
                                        </p>
                                        {!searchQuery && !(filters.branchId !== "all" && filters.branchId !== "none") && !filters.includeInactive && (
                                            <Button
                                                onClick={startAdding}
                                                className="mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                            >
                                                <Plus className="h-4 w-4 mr-2" /> Add Department
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="rounded-md border overflow-hidden dark:border-gray-800">
                                            <Table>
                                                <TableHeader className="bg-gray-50 dark:bg-gray-900">
                                                    <TableRow className="hover:bg-transparent dark:border-gray-800">
                                                        <TableHead className="dark:text-gray-300">Name</TableHead>
                                                        <TableHead className="dark:text-gray-300">Description</TableHead>
                                                        <TableHead className="dark:text-gray-300">Branch</TableHead>
                                                        <TableHead className="dark:text-gray-300">Users</TableHead>
                                                        <TableHead className="dark:text-gray-300">Status</TableHead>
                                                        <TableHead className="dark:text-gray-300">Created</TableHead>
                                                        <TableHead className="text-right dark:text-gray-300">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {departments.map((department) => (
                                                        <TableRow
                                                            key={department.id}
                                                            className="hover:bg-gray-50 dark:hover:bg-gray-900/50 dark:border-gray-800"
                                                        >
                                                            <TableCell className="font-medium dark:text-gray-200">
                                                                <div className="font-medium">{department.name}</div>
                                                            </TableCell>
                                                            <TableCell className="dark:text-gray-300">
                                                                <div className="text-sm max-w-md truncate">
                                                                    {department.description || "-"}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {getBranchBadge(department)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="secondary" className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800">
                                                                        <Users className="h-3 w-3" />
                                                                        {department._count?.users || 0}
                                                                    </Badge>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {getStatusBadge(department)}
                                                            </TableCell>
                                                            <TableCell className="dark:text-gray-300">
                                                                <div className="text-sm">
                                                                    {new Date(department.createdAt).toLocaleDateString()}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => editDepartment(department)}
                                                                        className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>

                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => toggleDepartmentStatus(department)}
                                                                        className={`h-8 w-8 ${department.isActive
                                                                            ? 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                                                                            : 'hover:bg-green-100 dark:hover:bg-green-900/30'
                                                                            }`}
                                                                        title={department.isActive ? "Deactivate" : "Activate"}
                                                                    >
                                                                        {department.isActive ? (
                                                                            <span className="text-yellow-600 dark:text-yellow-400 text-xs">●</span>
                                                                        ) : (
                                                                            <span className="text-green-600 dark:text-green-400 text-xs">●</span>
                                                                        )}
                                                                    </Button>

                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => deleteDepartment(department)}
                                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                                                                        title="Delete"
                                                                        disabled={department._count && department._count.users > 0}
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

                                        {/* Pagination Controls */}
                                        {pagination.totalPages > 1 && (
                                            <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-800">
                                                <div className="text-sm text-muted-foreground">
                                                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                                                    <span className="font-medium">
                                                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                                                    </span>{" "}
                                                    of <span className="font-medium">{pagination.total}</span> departments
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm text-muted-foreground">Rows per page:</span>
                                                        <select
                                                            className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700"
                                                            value={pagination.limit}
                                                            onChange={(e) => handleLimitChange(Number(e.target.value))}
                                                        >
                                                            <option value="5">5</option>
                                                            <option value="10">10</option>
                                                            <option value="25">25</option>
                                                            <option value="50">50</option>
                                                            <option value="100">100</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex items-center space-x-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handlePageChange(pagination.page - 1)}
                                                            disabled={!pagination.hasPreviousPage}
                                                            className="dark:border-gray-700 dark:text-gray-300"
                                                        >
                                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                                            Previous
                                                        </Button>

                                                        <div className="flex items-center space-x-1">
                                                            {(() => {
                                                                const pages = []
                                                                const maxVisiblePages = 5
                                                                let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2))
                                                                let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1)

                                                                if (endPage - startPage + 1 < maxVisiblePages) {
                                                                    startPage = Math.max(1, endPage - maxVisiblePages + 1)
                                                                }

                                                                for (let i = startPage; i <= endPage; i++) {
                                                                    pages.push(
                                                                        <Button
                                                                            key={i}
                                                                            variant={pagination.page === i ? "default" : "outline"}
                                                                            size="sm"
                                                                            onClick={() => handlePageChange(i)}
                                                                            className="dark:border-gray-700 dark:text-gray-300"
                                                                        >
                                                                            {i}
                                                                        </Button>
                                                                    )
                                                                }

                                                                return pages
                                                            })()}
                                                        </div>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handlePageChange(pagination.page + 1)}
                                                            disabled={!pagination.hasNextPage}
                                                            className="dark:border-gray-700 dark:text-gray-300"
                                                        >
                                                            Next
                                                            <ChevronRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContainer>
                        </TabsContent>

                        <TabsContent value="deleted" className="space-y-4">
                            <CardContainer className="border dark:border-gray-800">
                                {loadingDeleted ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                        <p className="mt-2">Loading deleted departments...</p>
                                    </div>
                                ) : deletedDepartments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Archive className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700" />
                                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Recycle bin is empty</h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Deleted departments will appear here
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="rounded-md border overflow-hidden dark:border-gray-800">
                                            <Table>
                                                <TableHeader className="bg-gray-50 dark:bg-gray-900">
                                                    <TableRow className="hover:bg-transparent dark:border-gray-800">
                                                        <TableHead className="dark:text-gray-300">Name</TableHead>
                                                        <TableHead className="dark:text-gray-300">Description</TableHead>
                                                        <TableHead className="dark:text-gray-300">Branch</TableHead>
                                                        <TableHead className="dark:text-gray-300">Users</TableHead>
                                                        <TableHead className="dark:text-gray-300">Deleted On</TableHead>
                                                        <TableHead className="text-right dark:text-gray-300">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {deletedDepartments.map((department) => (
                                                        <TableRow
                                                            key={department.id}
                                                            className="hover:bg-gray-50 dark:hover:bg-gray-900/50 dark:border-gray-800"
                                                        >
                                                            <TableCell className="font-medium dark:text-gray-200">
                                                                <div className="font-medium text-gray-600 dark:text-gray-400">{department.name}</div>
                                                            </TableCell>
                                                            <TableCell className="dark:text-gray-300">
                                                                <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                                                                    {department.description || "-"}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {getBranchBadge(department)}
                                                            </TableCell>
                                                            <TableCell className="dark:text-gray-300">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="secondary" className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800">
                                                                        <Users className="h-3 w-3" />
                                                                        {department._count?.users || 0}
                                                                    </Badge>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="dark:text-gray-300">
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {new Date(department.updatedAt).toLocaleDateString()}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => restoreDepartment(department)}
                                                                        className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900/30"
                                                                        title="Restore"
                                                                    >
                                                                        <RotateCcw className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                                    </Button>

                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        disabled
                                                                        className="h-8 w-8 text-gray-400 cursor-not-allowed"
                                                                        title="Permanently delete (coming soon)"
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

                                        {/* Deleted Pagination Controls */}
                                        {deletedPagination.totalPages > 1 && (
                                            <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-800">
                                                <div className="text-sm text-muted-foreground">
                                                    Showing <span className="font-medium">{(deletedPagination.page - 1) * deletedPagination.limit + 1}</span> to{" "}
                                                    <span className="font-medium">
                                                        {Math.min(deletedPagination.page * deletedPagination.limit, deletedPagination.total)}
                                                    </span>{" "}
                                                    of <span className="font-medium">{deletedPagination.total}</span> deleted departments
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm text-muted-foreground">Rows per page:</span>
                                                        <select
                                                            className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700"
                                                            value={deletedPagination.limit}
                                                            onChange={(e) => handleDeletedLimitChange(Number(e.target.value))}
                                                        >
                                                            <option value="5">5</option>
                                                            <option value="10">10</option>
                                                            <option value="25">25</option>
                                                            <option value="50">50</option>
                                                            <option value="100">100</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex items-center space-x-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeletedPageChange(deletedPagination.page - 1)}
                                                            disabled={!deletedPagination.hasPreviousPage}
                                                            className="dark:border-gray-700 dark:text-gray-300"
                                                        >
                                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                                            Previous
                                                        </Button>

                                                        <div className="flex items-center space-x-1">
                                                            {(() => {
                                                                const pages = []
                                                                const maxVisiblePages = 5
                                                                let startPage = Math.max(1, deletedPagination.page - Math.floor(maxVisiblePages / 2))
                                                                let endPage = Math.min(deletedPagination.totalPages, startPage + maxVisiblePages - 1)

                                                                if (endPage - startPage + 1 < maxVisiblePages) {
                                                                    startPage = Math.max(1, endPage - maxVisiblePages + 1)
                                                                }

                                                                for (let i = startPage; i <= endPage; i++) {
                                                                    pages.push(
                                                                        <Button
                                                                            key={i}
                                                                            variant={deletedPagination.page === i ? "default" : "outline"}
                                                                            size="sm"
                                                                            onClick={() => handleDeletedPageChange(i)}
                                                                            className="dark:border-gray-700 dark:text-gray-300"
                                                                        >
                                                                            {i}
                                                                        </Button>
                                                                    )
                                                                }

                                                                return pages
                                                            })()}
                                                        </div>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeletedPageChange(deletedPagination.page + 1)}
                                                            disabled={!deletedPagination.hasNextPage}
                                                            className="dark:border-gray-700 dark:text-gray-300"
                                                        >
                                                            Next
                                                            <ChevronRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContainer>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    )
}