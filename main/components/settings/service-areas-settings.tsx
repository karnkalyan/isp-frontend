"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Save, X } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pagination } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { apiRequest } from "@/lib/api"

// Duration options
const DURATION_OPTIONS: Option[] = [
  { value: "1 day", label: "1 day" },
  { value: "3 day", label: "3 days" },
  { value: "5 day", label: "5 days" },
  { value: "7 day", label: "7 days" },
  { value: "1 month", label: "1 month" },
  { value: "3 month", label: "3 months" },
  { value: "6 month", label: "6 months" },
  { value: "12 month", label: "12 months" },
]

// API type
export type PackagePrice = {
  id: number
  planId: number
  packageDuration: string | null
  price: number
  packageName: string
  refrenceId: string
  isTrial: boolean
  packagePlanDetails: {
    planName: string
    downSpeed: number
    upSpeed: number
  }
  oneTimeCharges: { id: number; name: string }[]
}

type FormData = {
  planId: number
  packageDuration: string
  price: number
  isTrial: boolean
}

export function ServiceAreasSettings() {
  const [prices, setPrices] = useState<PackagePrice[]>([])
  const [planOptions, setPlanOptions] = useState<Option[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const start = (currentPage - 1) * itemsPerPage
  const paginated = prices.slice(start, start + itemsPerPage)

  const [formData, setFormData] = useState<FormData>({
    planId: 0,
    packageDuration: "",
    price: 0,
    isTrial: false,
  })

  // helper to fetch prices
  const fetchPrices = async () => {
    try {
      const data = await apiRequest<PackagePrice[]>("/package-price")
      setPrices(
        (data || []).map((p) => ({
          ...p,
          packageDuration:
            p.packageDuration && p.packageDuration !== "undefined"
              ? p.packageDuration
              : "",
          isTrial: p.isTrial ?? false,
        }))
      )
    } catch (err) {
      console.error("Load prices failed:", err)
      toast.error("Could not load package prices")
    }
  }

  // initial load
  useEffect(() => {
    fetchPrices()
  }, [])

  // fetch plan options
  useEffect(() => {
    apiRequest<{ id: number; planName: string }[]>("/pkgplan")
      .then((raw) => {
        setPlanOptions(
          Array.isArray(raw)
            ? raw.map((p) => ({ value: String(p.id), label: p.planName }))
            : []
        )
      })
      .catch((err) => {
        console.error("Load plans failed:", err)
        toast.error("Could not load plans")
      })
  }, [])

  const resetForm = () =>
    setFormData({ planId: 0, packageDuration: "", price: 0, isTrial: false })

  // add
  const handleAdd = async () => {
    if (!formData.planId || !formData.packageDuration || Number.isNaN(formData.price)) {
      toast.error("Plan, duration & price are required")
      return
    }
    try {
      await apiRequest<PackagePrice>("/package-price", {
        method: "POST",
        body: JSON.stringify(formData),
      })
      toast.success("New Package Price added successfully")
      resetForm()
      setIsAdding(false)
      await fetchPrices()
    } catch (err) {
      console.error("Add failed:", err)
      toast.error("Failed to add")
    }
  }

  // edit click
  const handleEditClick = (id: number) => {
    const item = prices.find((p) => p.id === id)
    if (!item) return
    setFormData({
      planId: item.planId,
      packageDuration: item.packageDuration || "",
      price: item.price,
      isTrial: item.isTrial ?? false,
    })
    setEditingId(id)
    setIsAdding(false)
  }

  // update
  const handleUpdate = async () => {
    if (
      editingId === null ||
      !formData.planId ||
      !formData.packageDuration ||
      Number.isNaN(formData.price)
    ) {
      toast.error("Plan, duration & price are required")
      return
    }
    try {
      await apiRequest<PackagePrice>(`/package-price/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      })
      toast.success("Updated successfully")
      resetForm()
      setEditingId(null)
      await fetchPrices()
    } catch (err) {
      console.error("Update failed:", err)
      toast.error("Failed to update")
    }
  }

  // delete
  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/package-price/${id}`, { method: "DELETE" })
      toast.success("Deleted")
      await fetchPrices()
    } catch (err) {
      console.error("Delete failed:", err)
      toast.error("Failed to delete")
    }
  }

  const handleCancel = () => {
    resetForm()
    setIsAdding(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      {(isAdding || editingId !== null) && (
        <div className="bg-card border rounded-md p-4">
          <h3 className="text-lg mb-4">
            {isAdding ? "Add Package Price" : "Edit Package Price"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1">Plan</label>
              <SearchableSelect
                options={planOptions}
                value={formData.planId.toString()}
                onValueChange={(v) =>
                  setFormData((fd) => ({ ...fd, planId: Number(v) }))
                }
                placeholder="Select plan"
              />
            </div>
            <div>
              <label className="block mb-1">Duration</label>
              <SearchableSelect
                options={DURATION_OPTIONS}
                value={formData.packageDuration}
                onValueChange={(v) =>
                  setFormData((fd) => ({ ...fd, packageDuration: v as string }))
                }
                placeholder="Select duration"
              />
            </div>
            <div>
              <label className="block mb-1">Price (Rs.)</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData((fd) => ({
                    ...fd,
                    price: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="e.g. 2500"
              />
            </div>
          </div>

          {/* isTrial Switch */}
          <div className="flex items-center space-x-2 mt-4">
            <label htmlFor="isTrial" className="text-sm font-medium">
              Trial Package
            </label>
            <Switch
              id="isTrial"
              checked={formData.isTrial}
              onCheckedChange={(c) =>
                setFormData((fd) => ({ ...fd, isTrial: c }))
              }
            />
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={isAdding ? handleAdd : handleUpdate}>
              <Save className="mr-2 h-4 w-4" />
              {isAdding ? "Add" : "Update"}
            </Button>
          </div>
        </div>
      )}

      {!isAdding && editingId === null && (
        <Button onClick={() => { resetForm(); setIsAdding(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Add Package Price
        </Button>
      )}

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package Name</TableHead>
              <TableHead>Plan Name</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Down / Up (Mbps)</TableHead>
              <TableHead>Price (Rs.)</TableHead>
              <TableHead>Trial</TableHead>
              <TableHead>One-Time Charges</TableHead>
              <TableHead>Reference ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                  Loading… or no package prices.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map(pkg => (
                <TableRow key={pkg.id}>
                  <TableCell>{pkg.packageName}</TableCell>
                  <TableCell>{pkg.packagePlanDetails.planName}</TableCell>
                  <TableCell>{pkg.packageDuration || "—"}</TableCell>
                  <TableCell>{pkg.packagePlanDetails.downSpeed} / {pkg.packagePlanDetails.upSpeed}</TableCell>
                  <TableCell>Rs. {pkg.price}</TableCell>
                  <TableCell>{pkg.isTrial ? "Yes" : "No"}</TableCell>
                  <TableCell>{pkg.oneTimeCharges.map(c => c.name).join(", ") || "—"}</TableCell>
                  <TableCell>{pkg.refrenceId || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex space-x-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(pkg.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg.id)}>
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

      <Pagination
        totalItems={prices.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
