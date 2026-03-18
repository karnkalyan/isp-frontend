"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Pencil, Trash2, Save, X, Loader } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { apiRequest } from "@/lib/api"

// Type for an extra charge object from the API
type ExtraCharge = {
  id: number
  name: string
  code: string
  isTaxable: boolean
  amount: number
  description: string | null
  // FIX #1: The API sends 'id', not 'packageId'.
  applicablePackages: { id: number }[]
}

// Type for the form's data structure
type FormItem = {
  name: string
  code: string
  isTaxable: boolean
  amount: number
  description: string
  applicablePackageIds: number[]
}

export function ExtraChargesSettings() {
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [packageOptions, setPackageOptions] = useState<Option[]>([])
  const [isApiCalling, setIsApiCalling] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const initialItems: FormItem = {
    name: "",
    code: "",
    isTaxable: false,
    amount: 0,
    description: "",
    applicablePackageIds: [],
  }

  const [items, setItems] = useState<FormItem>(initialItems)

  const IS_TAXABLE: Option[] = [
    { value: "false", label: "False" },
    { value: "true", label: "True" },
  ]

  // Memoize a map for quick package name lookups
  const packageMap = useMemo(() => {
    return new Map(packageOptions.map(opt => [Number(opt.value), opt.label]));
  }, [packageOptions]);

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
    if (!items.name || !items.code || items.amount <= 0) {
      toast.error("Name, code, and a positive amount are required")
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
      amount: charge.amount,
      isTaxable: charge.isTaxable,
      description: charge.description || "",
      // FIX #2: Use p.id to correctly populate the form state.
      applicablePackageIds: charge.applicablePackages.map(p => p.id),
    })
    setIsAdding(false) // Ensure "add" mode is off
  }

  // Handle updating an existing item
  const handleUpdate = async () => {
    if (!editingId) return
    if (!items.name || !items.code || items.amount <= 0) {
      toast.error("Name, code, and a positive amount are required")
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                value={items.amount}
                onChange={(e) => setItems({ ...items, amount: Number(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="isTaxable">Is Taxable</Label>
              <SearchableSelect
                id="isTaxable"
                options={IS_TAXABLE}
                value={String(items.isTaxable)}
                onValueChange={(v) =>
                  setItems((prev) => ({ ...prev, isTaxable: v === "true" }))
                }
                placeholder="Select taxable status"
              />
            </div>
            <div>
              <Label htmlFor="applicablePackages">Applicable Packages</Label>
              <SearchableSelect
                id="applicablePackages"
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
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Item
        </Button>
      )}

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name / Code</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Taxable</TableHead>
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
              ) : extraCharges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No extra charges found.
                  </TableCell>
                </TableRow>
              ) : (
                extraCharges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{charge.name}</span>
                        <span className="text-xs text-muted-foreground">{charge.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(charge.amount)}
                    </TableCell>
                    <TableCell>
                      {charge.isTaxable ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>
                      {charge.applicablePackages.length > 0
                        // FIX #3: Use p.id to correctly look up the package name.
                        ? charge.applicablePackages.map(p => packageMap.get(p.id)).filter(Boolean).join(', ')
                        : "No Packages Selected"}
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
    </div>
  )
}