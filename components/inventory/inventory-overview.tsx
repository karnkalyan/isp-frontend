"use client"

import React, { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    Package, 
    Search, 
    Filter, 
    ArrowRightLeft, 
    History,
    MoreVertical,
    CheckCircle2,
    AlertCircle,
    User,
    Building2,
    HardDrive,
    Users,
    Pencil,
    Trash2,
    Loader2
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { AssignDeviceDialog } from "@/components/inventory/assign-device-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type InventoryGroup = {
    key: string
    primary: any
    records: any[]
    rootSerial: string
    totalQty: number
    availableQty: number
    lastUpdated: string
}

const formatEponMacAddress = (value: string) => {
    const hex = value.replace(/[^a-fA-F0-9]/g, "").slice(0, 12).toLowerCase()
    return hex.match(/.{1,4}/g)?.join(".") || ""
}

const serializedTypes = new Set(["ONT", "OLT", "ROUTE", "SWITCH"])

const getRootSerial = (serial?: string | null) => {
    if (!serial) return ""
    return serial.split("-part-")[0]
}

const getInventoryGroupKey = (item: any) => {
    const rootSerial = getRootSerial(item.serialNumber)
    if (rootSerial) return `${item.type || ""}:${item.name || ""}:${rootSerial}`
    return `${item.type || ""}:${item.name || ""}:${item.model || ""}:${item.macAddress || ""}:item-${item.id}`
}

const getItemLocationLabel = (item: any) => {
    if (item.customer) return item.customer.customerUniqueId || "Customer"
    if (item.user) return `${item.user.name} (Staff)`
    if (item.branch) return item.branch.name
    return "Head Office"
}

export function InventoryOverview() {
    const [items, setItems] = useState<any[]>([])
    const [branches, setBranches] = useState<any[]>([])
    const [vendors, setVendors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [assignmentFilter, setAssignmentFilter] = useState<"all" | "customer" | "staff" | "unassigned">("all")
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [assignItem, setAssignItem] = useState<any>(null)

    // New dialog and history state
    const [bulkTransferOpen, setBulkTransferOpen] = useState(false)
    const [transferBranchId, setTransferBranchId] = useState("")

    const [returnDialogOpen, setReturnDialogOpen] = useState(false)
    const [returnItemObj, setReturnItemObj] = useState<any>(null)

    const [faultyDialogOpen, setFaultyDialogOpen] = useState(false)
    const [faultyItemObj, setFaultyItemObj] = useState<any>(null)

    const [historyOpen, setHistoryOpen] = useState(false)
    const [historyItemObj, setHistoryItemObj] = useState<any>(null)
    const [historyLogs, setHistoryLogs] = useState<any[]>([])
    const [loadingLogs, setLoadingLogs] = useState(false)
    const [detailsGroup, setDetailsGroup] = useState<InventoryGroup | null>(null)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [editForm, setEditForm] = useState({
        type: "ONT",
        name: "",
        model: "",
        serialNumber: "",
        ponSerialNumber: "",
        ponVendorIdIncluded: true,
        macAddress: "",
        branchId: "none",
        qty: "1",
        condition: "Good",
        vendorId: "none"
    })
    const [savingEdit, setSavingEdit] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteItemObj, setDeleteItemObj] = useState<any>(null)

    const fetchInventory = async () => {
        setLoading(true)
        try {
            const data = await apiRequest("/inventory")
            setItems(data || [])
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to fetch inventory", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInventory()
        apiRequest("/branches").then(data => setBranches(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [])).catch(() => {})
        apiRequest("/vendors").then(data => setVendors(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [])).catch(() => {})
    }, [])

    const toggleSelection = (id: number) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setSelectedIds(newSet)
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === selectableGroupedItems.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(selectableGroupedItems.map(group => group.primary.id)))
        }
    }

    const fetchItemLogs = async (itemId: number) => {
        setLoadingLogs(true)
        try {
            const data = await apiRequest(`/inventory/${itemId}/logs`)
            setHistoryLogs(Array.isArray(data) ? data : [])
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch item history logs", variant: "destructive" })
        } finally {
            setLoadingLogs(false)
        }
    }

    const openEditDialog = (item: any) => {
        setEditingItem(item)
        setEditForm({
            type: item.type || "ONT",
            name: item.name || "",
            model: item.model || "",
            serialNumber: item.serialNumber || "",
            ponSerialNumber: item.ponSerialNumber || "",
            ponVendorIdIncluded: item.ponVendorIdIncluded !== false,
            macAddress: item.macAddress || "",
            branchId: item.branchId ? String(item.branchId) : "none",
            qty: String(item.qty || 1),
            condition: item.condition || "Good",
            vendorId: item.vendorId ? String(item.vendorId) : "none"
        })
    }

    const updateEditForm = (field: string, value: string | boolean) => {
        setEditForm(prev => ({
            ...prev,
            [field]: field === "macAddress" ? formatEponMacAddress(String(value)) : value
        }))
    }

    const submitEdit = async () => {
        if (!editingItem) return
        const isSerialized = serializedTypes.has(editForm.type)
        setSavingEdit(true)
        try {
            await apiRequest(`/inventory/${editingItem.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    ...editForm,
                    branchId: editForm.branchId === "none" ? null : editForm.branchId,
                    qty: isSerialized ? 1 : parseInt(editForm.qty) || 1,
                    vendorId: editForm.vendorId === "none" ? null : editForm.vendorId
                })
            })
            toast({ title: "Success", description: "Inventory item updated successfully" })
            setEditingItem(null)
            fetchInventory()
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to update inventory item", variant: "destructive" })
        } finally {
            setSavingEdit(false)
        }
    }

    const confirmDeleteItem = (item: any) => {
        setDeleteItemObj(item)
        setDeleteDialogOpen(true)
    }

    const deleteInventoryItem = async () => {
        if (!deleteItemObj) return
        try {
            await apiRequest(`/inventory/${deleteItemObj.id}`, { method: "DELETE" })
            toast({ title: "Success", description: "Inventory item deleted successfully" })
            setSelectedIds(prev => {
                const next = new Set(prev)
                next.delete(deleteItemObj.id)
                return next
            })
            setDeleteItemObj(null)
            fetchInventory()
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to delete inventory item", variant: "destructive" })
        }
    }

    const handleBulkTransferClick = () => {
        if (selectedIds.size === 0) return
        setTransferBranchId("")
        setBulkTransferOpen(true)
    }

    const submitBulkTransfer = async () => {
        if (selectedIds.size === 0 || !transferBranchId) return
        const branchId = parseInt(transferBranchId)

        try {
            await apiRequest("/inventory/bulk-transfer", {
                method: "POST",
                body: JSON.stringify({
                    itemIds: Array.from(selectedIds),
                    toBranchId: branchId,
                    status: "ASSIGNED_TO_BRANCH",
                    note: "Bulk Transfer to Branch " + branchId
                })
            })
            toast({ title: "Success", description: "Items transferred successfully!" })
            setSelectedIds(new Set())
            setBulkTransferOpen(false)
            fetchInventory()
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    }

    const groupedItems = React.useMemo<InventoryGroup[]>(() => {
        const groups = new Map<string, any[]>()

        items.forEach(item => {
            const key = getInventoryGroupKey(item)
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(item)
        })

        return Array.from(groups.entries()).map(([key, records]) => {
            const sortedRecords = [...records].sort((a, b) => {
                const aIsRoot = a.serialNumber && !String(a.serialNumber).includes("-part-")
                const bIsRoot = b.serialNumber && !String(b.serialNumber).includes("-part-")
                if (aIsRoot && !bIsRoot) return -1
                if (!aIsRoot && bIsRoot) return 1
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            })
            const primary = sortedRecords.find(record => record.status === "IN_STOCK" && Number(record.availableQty || 0) > 0) || sortedRecords[0]
            const lastUpdated = sortedRecords.reduce((latest, record) => {
                return new Date(record.updatedAt).getTime() > new Date(latest).getTime() ? record.updatedAt : latest
            }, sortedRecords[0]?.updatedAt)

            return {
                key,
                primary,
                records: sortedRecords,
                rootSerial: getRootSerial(primary.serialNumber),
                totalQty: sortedRecords.reduce((sum, record) => sum + Number(record.qty || 1), 0),
                availableQty: sortedRecords
                    .filter(record => record.status === "IN_STOCK" || record.status === "ASSIGNED_TO_BRANCH")
                    .reduce((sum, record) => sum + Number(record.availableQty || 0), 0),
                lastUpdated
            }
        }).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    }, [items])

    const filteredGroupedItems = groupedItems.filter(group => {
        const search = searchTerm.toLowerCase()
        const matchesSearch = group.records.some(item =>
            item.name?.toLowerCase().includes(search) ||
            item.serialNumber?.toLowerCase().includes(search) ||
            item.macAddress?.toLowerCase().includes(search) ||
            item.customer?.customerUniqueId?.toLowerCase().includes(search) ||
            item.user?.name?.toLowerCase().includes(search) ||
            item.branch?.name?.toLowerCase().includes(search)
        )
        const matchesStatus = statusFilter === "all" || group.records.some(item => item.status === statusFilter)
        const matchesAssignment = assignmentFilter === "all" || group.records.some(item => {
            if (assignmentFilter === "customer") return Boolean(item.customerId || item.customer) || ["ASSIGNED_TO_CUSTOMER", "INSTALLED_AT_CUSTOMER"].includes(item.status)
            if (assignmentFilter === "staff") return Boolean(item.userId || item.user || item.assignedRoleId) || ["ASSIGNED_TO_USER", "ASSIGNED_TO_ROLE"].includes(item.status)
            return !item.customerId && !item.customer && !item.userId && !item.user && !item.assignedRoleId && !["ASSIGNED_TO_CUSTOMER", "INSTALLED_AT_CUSTOMER", "ASSIGNED_TO_USER", "ASSIGNED_TO_ROLE"].includes(item.status)
        })
        return matchesSearch && matchesStatus && matchesAssignment
    })

    const selectableGroupedItems = filteredGroupedItems.filter(group => group.primary)

    const getGroupedStatusSummary = (group: InventoryGroup) => {
        const statuses = group.records.reduce((acc: Record<string, number>, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1
            return acc
        }, {})
        return Object.entries(statuses)
    }

    const totalGroupedStock = groupedItems.length
    const availableGroupedStock = groupedItems.filter(group => group.records.some(item => item.status === 'IN_STOCK')).length
    const installedGroupedStock = groupedItems.filter(group => group.records.some(item => item.status === 'INSTALLED_AT_CUSTOMER' || item.status === 'ASSIGNED_TO_CUSTOMER')).length
    const faultyGroupedStock = groupedItems.filter(group => group.records.some(item => item.status === 'FAULTY')).length

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'IN_STOCK': return <Badge variant="success">In Stock</Badge>
            case 'ASSIGNED_TO_BRANCH': return <Badge variant="secondary">Branch Assigned</Badge>
            case 'ASSIGNED_TO_USER': return <Badge variant="warning">Staff Assigned</Badge>
            case 'ASSIGNED_TO_CUSTOMER': return <Badge className="bg-purple-500">Customer Assigned</Badge>
            case 'INSTALLED_AT_CUSTOMER': return <Badge className="bg-purple-500">Installed</Badge>
            case 'FAULTY': return <Badge variant="destructive">Faulty</Badge>
            default: return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                    <Package className="h-8 w-8 opacity-20 mb-2" />
                    <div className="text-sm opacity-80 uppercase tracking-wider font-semibold">Total Stock</div>
                    <div className="text-3xl font-black">{totalGroupedStock}</div>
                </div>
                <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-sm border-l-4 border-l-emerald-500">
                    <div className="text-xs text-muted-foreground uppercase mb-1">Available Items</div>
                    <div className="text-2xl font-bold">{availableGroupedStock}</div>
                </div>
                <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-sm border-l-4 border-l-indigo-500">
                    <div className="text-xs text-muted-foreground uppercase mb-1">Active Installations</div>
                    <div className="text-2xl font-bold">{installedGroupedStock}</div>
                </div>
                <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-sm border-l-4 border-l-rose-500">
                    <div className="text-xs text-muted-foreground uppercase mb-1">Faulty/Returned</div>
                    <div className="text-2xl font-bold">{faultyGroupedStock}</div>
                </div>
            </div>

            <CardContainer title="Stock Items">
                <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Inventory assignment categories">
                    {([
                        ["all", "All Items"],
                        ["customer", "Customer Assigned"],
                        ["staff", "Staff Assigned"],
                        ["unassigned", "Unassigned"],
                    ] as const).map(([value, label]) => (
                        <Button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={assignmentFilter === value}
                            variant={assignmentFilter === value ? "default" : "outline"}
                            size="sm"
                            className="whitespace-nowrap"
                            onClick={() => { setAssignmentFilter(value); setSelectedIds(new Set()) }}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name, serial, or MAC..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 && (
                            <Button variant="secondary" onClick={handleBulkTransferClick} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300">
                                <Users className="h-4 w-4 mr-2" />
                                Bulk Transfer ({selectedIds.size})
                            </Button>
                        )}
                        <Button 
                            variant={statusFilter === 'all' ? 'default' : 'outline'} 
                            onClick={() => setStatusFilter('all')}
                            size="sm"
                        >
                            All
                        </Button>
                        <Button 
                            variant={statusFilter === 'IN_STOCK' ? 'default' : 'outline'} 
                            onClick={() => setStatusFilter('IN_STOCK')}
                            size="sm"
                        >
                            Available
                        </Button>
                        <Button 
                            variant={statusFilter === 'INSTALLED_AT_CUSTOMER' ? 'default' : 'outline'} 
                            onClick={() => setStatusFilter('INSTALLED_AT_CUSTOMER')}
                            size="sm"
                        >
                            Installed
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800">
                            <TableRow>
                                <TableHead className="w-[40px]">
                                    <Checkbox 
                                        checked={selectedIds.size > 0 && selectedIds.size === selectableGroupedItems.length}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>Item / Model</TableHead>
                                <TableHead>Identifiers</TableHead>
                                <TableHead>Current Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Activity</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm text-muted-foreground">Loading inventory...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredGroupedItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        No items found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredGroupedItems.map((group) => {
                                    const item = group.primary
                                    return (
                                    <TableRow key={group.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <TableCell>
                                            <Checkbox 
                                                checked={selectedIds.has(item.id)}
                                                onCheckedChange={() => toggleSelection(item.id)}
                                                aria-label="Select row"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                                    <HardDrive className="h-4 w-4 text-slate-500" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm">{item.name}</div>
                                                    <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">{item.type}</div>
                                                    {group.records.length > 1 && (
                                                        <Badge variant="outline" className="mt-1 text-[10px]">
                                                            {group.records.length} assignment records
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit">SN: {group.rootSerial || item.serialNumber || "N/A"}</div>
                                                {item.macAddress && <div className="text-xs font-mono text-muted-foreground">MAC: {item.macAddress}</div>}
                                                <div className="text-xs text-muted-foreground">
                                                    Remaining Qty <span className="font-bold text-foreground">{group.availableQty}</span>/{group.totalQty}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {group.records.slice(0, 2).map(record => (
                                                    <div key={record.id} className="flex items-center gap-2 text-xs">
                                                        {record.customer || record.user ? (
                                                            <User className="h-3 w-3 text-purple-500" />
                                                        ) : (
                                                            <Building2 className="h-3 w-3 text-blue-500" />
                                                        )}
                                                        <span>{getItemLocationLabel(record)}</span>
                                                    </div>
                                                ))}
                                                {group.records.length > 2 && (
                                                    <button
                                                        className="text-xs text-primary hover:underline"
                                                        onClick={() => setDetailsGroup(group)}
                                                    >
                                                        +{group.records.length - 2} more in details
                                                    </button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {getGroupedStatusSummary(group).slice(0, 3).map(([status, count]) => (
                                                    <div key={status} className="flex items-center gap-1">
                                                        {getStatusBadge(status)}
                                                        {count > 1 && <span className="text-xs text-muted-foreground">x{count}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs">
                                                <div className="text-muted-foreground">{new Date(group.lastUpdated).toLocaleDateString()}</div>
                                                <div className="font-medium text-[10px]">{new Date(group.lastUpdated).toLocaleTimeString()}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        className="gap-2 cursor-pointer"
                                                        onClick={() => setDetailsGroup(group)}
                                                    >
                                                        <HardDrive className="h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="gap-2 cursor-pointer"
                                                        onClick={() => openEditDialog(item)}
                                                    >
                                                        <Pencil className="h-4 w-4" /> Edit Item
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="gap-2 cursor-pointer"
                                                        onClick={() => setAssignItem(item)}
                                                    >
                                                        <User className="h-4 w-4" /> Assign Item
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="gap-2 cursor-pointer"
                                                        onClick={() => {
                                                            setReturnItemObj(item)
                                                            setReturnDialogOpen(true)
                                                        }}
                                                    >
                                                        <ArrowRightLeft className="h-4 w-4" /> Return to Stock
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="gap-2 cursor-pointer"
                                                        onClick={() => {
                                                            setHistoryItemObj(item)
                                                            setHistoryLogs([])
                                                            setHistoryOpen(true)
                                                            fetchItemLogs(item.id)
                                                        }}
                                                    >
                                                        <History className="h-4 w-4" /> View History
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-rose-500 gap-2 cursor-pointer"
                                                        onClick={() => {
                                                            setFaultyItemObj(item)
                                                            setFaultyDialogOpen(true)
                                                        }}
                                                    >
                                                        <AlertCircle className="h-4 w-4" /> Mark Faulty
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="text-destructive gap-2 cursor-pointer"
                                                        onClick={() => confirmDeleteItem(item)}
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Delete Item
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContainer>

            {/* Edit Inventory Item */}
            <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null) }}>
                <DialogContent className="sm:max-w-[620px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-indigo-500" />
                            Edit Inventory Item
                        </DialogTitle>
                        <DialogDescription>
                            Update item details, identifiers, MAC address, and stock location.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                        <div className="space-y-2">
                            <Label>Item Type</Label>
                            <select
                                value={editForm.type}
                                onChange={(e) => updateEditForm("type", e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="ONT">ONT</option>
                                <option value="OLT">OLT</option>
                                <option value="DROPWIRE">Drop Wire / Cable</option>
                                <option value="ROUTE">Router</option>
                                <option value="SWITCH">Switch</option>
                                <option value="STB">STB</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Item Name</Label>
                            <Input value={editForm.name} onChange={(e) => updateEditForm("name", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Model</Label>
                            <Input value={editForm.model} onChange={(e) => updateEditForm("model", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Serial Number</Label>
                            <Input value={editForm.serialNumber} onChange={(e) => updateEditForm("serialNumber", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>PON Serial Number</Label>
                            <Input value={editForm.ponSerialNumber} onChange={(e) => updateEditForm("ponSerialNumber", e.target.value)} />
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <div className="pr-3">
                                <Label>Vendor ID included</Label>
                                <p className="text-xs text-muted-foreground">Encode the four-character vendor prefix when provisioning the OLT.</p>
                            </div>
                            <Switch checked={editForm.ponVendorIdIncluded} onCheckedChange={(checked) => updateEditForm("ponVendorIdIncluded", checked)} />
                        </div>
                        <div className="space-y-2">
                            <Label>MAC Address</Label>
                            <Input
                                value={editForm.macAddress}
                                onChange={(e) => updateEditForm("macAddress", e.target.value)}
                                placeholder="d05f.af07.c908"
                                className="font-mono lowercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Branch</Label>
                            <select
                                value={editForm.branchId}
                                onChange={(e) => updateEditForm("branchId", e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="none">Head Office</option>
                            {branches.map(branch => (
                                    <option key={branch.id} value={String(branch.id)}>{branch.parentId ? "Sub-branch: " : "Branch: "}{branch.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Vendor</Label>
                            <select
                                value={editForm.vendorId}
                                onChange={(e) => updateEditForm("vendorId", e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="none">No Vendor</option>
                                {vendors.map(vendor => (
                                    <option key={vendor.id} value={String(vendor.id)}>
                                        {vendor.name}{vendor.companyName ? ` - ${vendor.companyName}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                min="1"
                                value={serializedTypes.has(editForm.type) ? "1" : editForm.qty}
                                onChange={(e) => updateEditForm("qty", e.target.value)}
                                disabled={serializedTypes.has(editForm.type)}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Condition</Label>
                            <Input value={editForm.condition} onChange={(e) => updateEditForm("condition", e.target.value)} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                        <Button onClick={submitEdit} disabled={savingEdit}>
                            {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Grouped Assignment Details */}
            <Dialog open={!!detailsGroup} onOpenChange={(open) => { if (!open) setDetailsGroup(null) }}>
                <DialogContent className="sm:max-w-[850px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5 text-indigo-500" />
                            Inventory Assignment Details
                        </DialogTitle>
                        <DialogDescription>
                            Assignment records and split quantities for the selected stock item.
                        </DialogDescription>
                    </DialogHeader>

                    {detailsGroup && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="rounded-lg border p-3">
                                    <div className="text-xs text-muted-foreground">Item</div>
                                    <div className="font-semibold">{detailsGroup.primary.name}</div>
                                    <div className="text-xs text-muted-foreground">{detailsGroup.primary.type}</div>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <div className="text-xs text-muted-foreground">Root Serial</div>
                                    <div className="font-mono text-sm">{detailsGroup.rootSerial || "N/A"}</div>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <div className="text-xs text-muted-foreground">Quantity</div>
                                    <div className="font-semibold"><span className="font-bold text-foreground">{detailsGroup.availableQty}</span>/{detailsGroup.totalQty} remaining</div>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <div className="text-xs text-muted-foreground">Records</div>
                                    <div className="font-semibold">{detailsGroup.records.length}</div>
                                </div>
                            </div>

                            <div className="rounded-lg border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Serial / Part</TableHead>
                                            <TableHead>Assigned To</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Last Activity</TableHead>
                                            <TableHead className="w-[120px]">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detailsGroup.records.map(record => (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                    <div className="font-mono text-xs">{record.serialNumber || "N/A"}</div>
                                                    {record.serialNumber?.includes("-part-") && (
                                                        <Badge variant="outline" className="mt-1 text-[10px]">Split assignment</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{getItemLocationLabel(record)}</div>
                                                    {record.customer?.lead && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {[record.customer.lead.firstName, record.customer.lead.lastName].filter(Boolean).join(" ")}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(record.status)}</TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium"><span className="font-bold text-foreground">{record.availableQty || 0}</span>/{record.qty || 1}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs">
                                                        <div>{new Date(record.updatedAt).toLocaleDateString()}</div>
                                                        <div className="text-muted-foreground">{new Date(record.updatedAt).toLocaleTimeString()}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(record)}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setHistoryItemObj(record)
                                                                setHistoryLogs([])
                                                                setHistoryOpen(true)
                                                                fetchItemLogs(record.id)
                                                            }}
                                                        >
                                                            <History className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => confirmDeleteItem(record)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Assign Item Dialog */}
            <AssignDeviceDialog 
                open={!!assignItem}
                onOpenChange={(open) => { if (!open) setAssignItem(null) }}
                item={assignItem}
                onSuccess={fetchInventory}
            />

            {/* Bulk Transfer Dialog */}
            <Dialog open={bulkTransferOpen} onOpenChange={setBulkTransferOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Bulk Transfer Items</DialogTitle>
                        <DialogDescription>
                            Transfer {selectedIds.size} selected item(s) to a branch.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="branch-select">Target Branch</Label>
                            <select
                                id="branch-select"
                                value={transferBranchId}
                                onChange={(e) => setTransferBranchId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select a branch...</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id.toString()}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkTransferOpen(false)}>Cancel</Button>
                        <Button onClick={submitBulkTransfer} disabled={!transferBranchId}>Transfer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Return to Stock ConfirmDialog */}
            <ConfirmDialog
                open={returnDialogOpen}
                onOpenChange={setReturnDialogOpen}
                title="Return to Stock"
                description={`Return "${returnItemObj?.name || 'device'}" to stock.`}
                showInput={true}
                inputLabel="Return Note"
                inputPlaceholder="Enter reason or condition details..."
                showCheckbox={true}
                checkboxLabel="Mark device as faulty"
                confirmLabel="Return"
                onConfirm={async (note, isFaulty) => {
                    if (!returnItemObj) return
                    const status = isFaulty ? 'FAULTY' : 'IN_STOCK'
                    try {
                        await apiRequest(`/inventory/${returnItemObj.id}/return`, {
                            method: "PUT",
                            body: JSON.stringify({ status, note })
                        })
                        toast({ title: "Success", description: "Device returned successfully" })
                        fetchInventory()
                    } catch (err: any) {
                        toast({ title: "Error", description: err.message, variant: "destructive" })
                    }
                }}
            />

            {/* Mark Faulty ConfirmDialog */}
            <ConfirmDialog
                open={faultyDialogOpen}
                onOpenChange={setFaultyDialogOpen}
                title="Mark Device as Faulty"
                description={`Are you sure you want to mark "${faultyItemObj?.name || 'this device'}" as faulty? This will return the device to stock under FAULTY status.`}
                variant="destructive"
                showInput={true}
                inputLabel="Faulty Note / Description"
                inputPlaceholder="Describe the issue with the device..."
                confirmLabel="Mark Faulty"
                onConfirm={async (note) => {
                    if (!faultyItemObj) return
                    try {
                        await apiRequest(`/inventory/${faultyItemObj.id}/return`, {
                            method: "PUT",
                            body: JSON.stringify({ status: 'FAULTY', note })
                        })
                        toast({ title: "Success", description: "Device marked as faulty" })
                        fetchInventory()
                    } catch (err: any) {
                        toast({ title: "Error", description: err.message, variant: "destructive" })
                    }
                }}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Inventory Item"
                description={`Delete "${deleteItemObj?.name || 'this item'}" from inventory? This also removes its lifecycle history.`}
                variant="destructive"
                confirmLabel="Delete"
                onConfirm={deleteInventoryItem}
            />

            {/* View History Slide-over (Sheet) */}
            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
                <SheetContent className="overflow-y-auto sm:max-w-md w-full">
                    <SheetHeader className="pb-4 border-b">
                        <SheetTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-indigo-500" />
                            Device History
                        </SheetTitle>
                        <SheetDescription>
                            Timeline of lifecycle logs for this device.
                        </SheetDescription>
                    </SheetHeader>
                    {historyItemObj && (
                        <div className="py-4 space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border text-sm space-y-1">
                                <div><span className="font-semibold">Device:</span> {historyItemObj.name}</div>
                                <div><span className="font-semibold">Type:</span> {historyItemObj.type}</div>
                                <div><span className="font-semibold">SN:</span> <span className="font-mono">{historyItemObj.serialNumber}</span></div>
                                {historyItemObj.macAddress && <div><span className="font-semibold">MAC:</span> <span className="font-mono">{historyItemObj.macAddress}</span></div>}
                            </div>

                            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
                                {loadingLogs ? (
                                    <div className="flex items-center gap-2 py-4">
                                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs text-muted-foreground">Loading history...</span>
                                    </div>
                                ) : historyLogs.length === 0 ? (
                                    <div className="text-xs text-muted-foreground py-4">No history records found.</div>
                                ) : (
                                    historyLogs.map((log) => (
                                        <div key={log.id} className="relative">
                                            {/* Bullet dot */}
                                            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border bg-white dark:bg-slate-900 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                                    <span className="text-foreground capitalize">{((log.toStatus || log.action || '').replace(/_/g, ' ')).toLowerCase()}</span>
                                                    <span className="text-muted-foreground font-normal">{new Date(log.createdAt).toLocaleString()}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">{log.note || 'No notes provided.'}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
