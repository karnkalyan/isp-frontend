"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Pencil, Trash2, Save, X, Loader, RefreshCw, Eye, Search } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Pagination } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { apiRequest } from "@/lib/api"

// Type for an extra charge object from the API
type ExtraCharge = {
  id: number
  name: string
  code: string
  isTaxable: boolean
  isTscApplicable: boolean
  amount: number | null
  forPackageCreation: boolean
  isRenewal: boolean
  isDropWireDynamic?: boolean
  description: string | null
  // FIX #1: The API sends 'id', not 'packageId'.
  applicablePackages: { id: number }[]
}

// Type for the form's data structure
type FormItem = {
  name: string
  code: string
  isTaxable: boolean
  isTscApplicable: boolean
  amount: number
  forPackageCreation: boolean
  isRenewal: boolean
  isDropWireDynamic?: boolean
  description: string
  applicablePackageIds: number[]
}

export function ExtraChargesSettings() {
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [packagesModalCharge, setPackagesModalCharge] = useState<ExtraCharge | null>(null)
  const [packageOptions, setPackageOptions] = useState<Option[]>([])
  const [isApiCalling, setIsApiCalling] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const initialItems: FormItem = {
    name: "",
    code: "",
    isTaxable: false,
    isTscApplicable: false,
    amount: 0,
    forPackageCreation: false,
    isRenewal: false,
    description: "",
    applicablePackageIds: [],
  }

  const [items, setItems] = useState<FormItem>(initialItems)

  const IS_TAXABLE: Option[] = [
    { value: "false", label: "False" },
    { value: "true", label: "True" },
  ]

  const IS_TSC_APPLICABLE: Option[] = [
    { value: "false", label: "False" },
    { value: "true", label: "True" },
  ]

  // Memoize a map for quick package name lookups
  const packageMap = useMemo(() => {
    return new Map(packageOptions.map(opt => [Number(opt.value), opt.label]));
  }, [packageOptions]);

  const filteredCharges = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return extraCharges
    return extraCharges.filter(c =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.code || "").toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q)
    )
  }, [extraCharges, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredCharges.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedCharges = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return filteredCharges.slice(start, start + pageSize)
  }, [filteredCharges, safeCurrentPage, pageSize])

  // Fetches all extra charges from the API
  const fetchExtraCharges = async () => {
    try {
      const data = await apiRequest<ExtraCharge[]>("/extra-charges")
      setExtraCharges(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load extra charges:", err)
      toast.error("Could not load extra charges")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncWithTshul = async () => {
    try {
      setIsSyncing(true)
      const res = await apiRequest<{ success: boolean; message: string }>("/extra-charges/sync", {
        method: "POST"
      })
      toast.success(res.message || "Synced successfully with Account")
      await fetchExtraCharges()
    } catch (err: any) {
      console.error("Sync failed:", err)
      toast.error(err.message || "Failed to sync with Account")
    } finally {
      setIsSyncing(false)
    }
  }

  // Fetch initial data on component mount
  useEffect(() => {
    setIsLoading(true)
    apiRequest<{ id: number; packageName: string }[]>("/package-price")
      .then((raw) => {
        setPackageOptions(
          Array.isArray(raw)
            ? raw.map((p) => ({ value: String(p.id), label: p.packageName }))
            : []
        )
      })
      .catch((err) => {
        console.error("Load Package Price failed:", err)
        toast.error("Could not load Package Prices")
      })

    fetchExtraCharges()
  }, [])

  const resetForm = () => {
    setItems(initialItems)
    setIsAdding(false)
    setEditingId(null)
  }

  // Handle creating a new item
  const handleAdd = async () => {
    if (!items.name || !items.code || (!items.forPackageCreation && items.amount <= 0)) {
      toast.error("Name, code, and a positive amount are required (unless for package creation)")
      return
    }
    try {
      setIsApiCalling(true)
      await apiRequest("/extra-charges", {
        method: "POST",
        body: JSON.stringify(items),
      })
      toast.success("New item added successfully")
      resetForm()
      await fetchExtraCharges() // Refetch data
    } catch (err) {
      console.error("Add failed:", err)
      toast.error("Failed to add new item")
    } finally {
      setIsApiCalling(false)
    }
  }

  // Set up the form for editing an existing item
  const handleEdit = (charge: ExtraCharge) => {
    setEditingId(charge.id)
    setItems({
      name: charge.name,
      code: charge.code,
      amount: charge.amount || 0,
      isTaxable: charge.isTaxable,
      isTscApplicable: charge.isTscApplicable || false,
      forPackageCreation: charge.forPackageCreation || false,
      isRenewal: charge.isRenewal || false,
      isDropWireDynamic: charge.isDropWireDynamic || false,
      description: charge.description || "",
      applicablePackageIds: charge.applicablePackages.map(p => p.id),
    })
    setIsAdding(false) // Ensure "add" mode is off
  }

  // Handle updating an existing item
  const handleUpdate = async () => {
    if (!editingId) return
    if (!items.name || !items.code || (!items.forPackageCreation && items.amount <= 0)) {
      toast.error("Name, code, and a positive amount are required (unless for package creation)")
      return
    }

    try {
      setIsApiCalling(true)
      await apiRequest(`/extra-charges/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(items),
      })
      toast.success("Item updated successfully")
      resetForm()
      await fetchExtraCharges() // Refetch data
    } catch (err) {
      console.error("Update failed:", err)
      toast.error("Failed to update item")
    } finally {
      setIsApiCalling(false)
    }
  }

  // Handle deleting an item
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return
    }
    try {
      await apiRequest(`/extra-charges/${id}`, {
        method: "DELETE",
      })
      toast.success("Item deleted successfully")
      await fetchExtraCharges() // Refetch data
    } catch (err) {
      console.error("Delete failed:", err)
      toast.error("Failed to delete item")
    }
  }

  const handleCancel = () => {
    resetForm()
  }

  return (
    <div className="space-y-6">
      {(isAdding || editingId) && (
        <div className="bg-card border rounded-md p-4 mb-6">
          <h3 className="text-lg font-medium mb-4">
            {isAdding ? "Add New Item" : "Edit Item"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={items.name}
                onChange={(e) => setItems({ ...items, name: e.target.value })}
                placeholder="e.g., Drop Wire"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Product Code</Label>
              <Input
                id="code"
                value={items.code}
                onChange={(e) => setItems({ ...items, code: e.target.value.toUpperCase() })}
                placeholder="e.g., DW-001"
                disabled={!!editingId} // Disable code input when editing
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={items.description}
                onChange={(e) => setItems({ ...items, description: e.target.value })}
                placeholder="e.g., Extra fiber optic cable"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                value={items.amount}
                onChange={(e) => setItems({ ...items, amount: Number(e.target.value) || 0 })}
                disabled={items.forPackageCreation}
              />
            </div>

            <div>
              <Label htmlFor="isTaxable">Is Taxable</Label>
              <SearchableSelect
                options={IS_TAXABLE}
                value={String(items.isTaxable)}
                onValueChange={(v) =>
                  setItems((prev) => ({ ...prev, isTaxable: v === "true" }))
                }
                placeholder="Select taxable status"
              />
            </div>
            <div>
              <Label htmlFor="isDropWireDynamic">Drop Wire Primary (Dynamic/m)</Label>
              <SearchableSelect
                options={[
                  { value: "false", label: "False (Fixed)" },
                  { value: "true", label: "True (Rate × Meters)" },
                ]}
                value={String(Boolean(items.isDropWireDynamic))}
                onValueChange={(v) =>
                  setItems((prev) => ({ ...prev, isDropWireDynamic: v === "true" }))
                }
                placeholder="Select dynamic drop wire"
              />
            </div>
            <div>
              <Label htmlFor="isTscApplicable">Is TSC Applicable</Label>
              <SearchableSelect
                options={IS_TSC_APPLICABLE}
                value={String(items.isTscApplicable)}
                onValueChange={(v) =>
                  setItems((prev) => ({ ...prev, isTscApplicable: v === "true" }))
                }
                placeholder="Select TSC status"
              />
            </div>
            <div>
              <Label htmlFor="applicablePackages">Applicable Packages</Label>
              <SearchableSelect
                options={packageOptions}
                value={items.applicablePackageIds.map(String)}
                onValueChange={(v) =>
                  setItems(prev => ({
                    ...prev,
                    applicablePackageIds: (v as string[]).map(Number),
                  }))
                }
                placeholder="Select packages (or leave empty for all)"
                multiple
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <input
                id="forPackageCreation"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-350 text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                checked={items.forPackageCreation}
                onChange={(e) => setItems({ ...items, forPackageCreation: e.target.checked, amount: e.target.checked ? 0 : items.amount })}
              />
              <Label htmlFor="forPackageCreation" className="text-sm font-medium">For Package Creation</Label>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <input
                id="isRenewal"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-350 text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                checked={items.isRenewal}
                onChange={(e) => setItems({ ...items, isRenewal: e.target.checked })}
              />
              <Label htmlFor="isRenewal" className="text-sm font-medium">Include on Renewal</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={isAdding ? handleAdd : handleUpdate}
              disabled={isApiCalling}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              {isApiCalling ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editingId ? "Update Item" : "Add Item"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {!isAdding && !editingId && (
        <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Item
            </Button>

            <Button
              onClick={handleSyncWithTshul}
              disabled={isSyncing}
              variant="outline"
              className="border-slate-200 dark:border-slate-800"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} /> Sync with Account
            </Button>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search addon items by name or code..."
              className="pl-9 h-9"
            />
          </div>
        </div>
      )}

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name / Code</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Taxable</TableHead>
                <TableHead>TSC Applicable</TableHead>
                <TableHead>Renewal</TableHead>
                <TableHead>Applicable Packages</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <Loader className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : paginatedCharges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No extra charges found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCharges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{charge.name}</span>
                          {charge.forPackageCreation && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                              Package Creation Only
                            </span>
                          )}
                          {charge.isDropWireDynamic && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              Drop Wire Dynamic/m
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{charge.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(charge.amount || 0)}
                    </TableCell>
                    <TableCell>
                      {charge.isTaxable ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>
                      {charge.isTscApplicable ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>{charge.isRenewal ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {charge.applicablePackages.length > 0 ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPackagesModalCharge(charge)}
                          className="h-7 px-2 text-xs gap-1.5"
                          title="View applicable packages"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          <span>{charge.applicablePackages.length} {charge.applicablePackages.length === 1 ? "Package" : "Packages"}</span>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No Packages Selected</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(charge)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(charge.id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
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
        totalItems={filteredCharges.length}
        itemsPerPage={pageSize}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        showPageSizeSelector={true}
        pageSizeOptions={[10, 25, 50, 100]}
      />
      {/* Applicable Packages Modal */}
      {packagesModalCharge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-xl bg-background shadow-2xl border overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold">Applicable Packages — {packagesModalCharge.name}</h3>
                <p className="text-xs text-muted-foreground">{packagesModalCharge.applicablePackages.length} package(s) linked</p>
              </div>
              <button
                type="button"
                onClick={() => setPackagesModalCharge(null)}
                className="rounded p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {packagesModalCharge.applicablePackages.map((p) => {
                const label = packageMap.get(p.id) || `Package #${p.id}`
                return (
                  <div key={p.id} className="rounded border px-3 py-2 bg-muted/20 font-medium">
                    {label}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end border-t px-5 py-3">
              <Button type="button" size="sm" variant="outline" onClick={() => setPackagesModalCharge(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
