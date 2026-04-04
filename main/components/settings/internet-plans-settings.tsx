"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Save, X, Zap, Download, Upload, Infinity } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { apiRequest } from "@/lib/api"

export type InternetPlan = {
  id: string
  name: string
  code: string
  connectionType: number
  downloadSpeed: number
  uploadSpeed: number
  dataLimit: number
  price: number
  isPopular: boolean
  description: string
  deviceLimit?: number      // use backend name
}



export type ISPType = {
  id: number             // numeric ID
  name: string
  code: string
  description: string
  icon: string
  isEnabled: boolean
  isExtra: boolean
}

const DEFAULT_PLAN: Omit<InternetPlan, "id"> = {
  name: "",
  code: "",
  connectionType: 0,
  downloadSpeed: 0,
  uploadSpeed: 0,
  dataLimit: 0,
  price: 0,
  isPopular: false,
  description: "",
  deviceLimit: 1,
}



export function InternetPlansSettings() {
  const [ispTypes, setIspTypes] = useState<ISPType[]>([])
  const [internetPlans, setInternetPlans] = useState<InternetPlan[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newPlan, setNewPlan] = useState(DEFAULT_PLAN)

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

  const ISP_TYPE_OPTIONS: Option<number>[] = ispTypes.map((t) => ({
    value: t.id,
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
  dataLimit: Number(r.dataLimit ?? 0),
  price: Number(r.price ?? 0),
  isPopular: Boolean(r.isPopular),
  description: String(r.description ?? ""),
  deviceLimit: Number(r.deviceLimit ?? r.numDevices ?? 1), // prefer deviceLimit
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

  const handleAdd = async () => {
    if (!validateForm()) return
const payload = {
  planName: newPlan.name,
  planCode: newPlan.code,
  connectionType: newPlan.connectionType,
  dataLimit: newPlan.dataLimit,
  downSpeed: newPlan.downloadSpeed,
  upSpeed: newPlan.uploadSpeed,
  isPopular: newPlan.isPopular,
  description: newPlan.description,
  deviceLimit: Number(newPlan.deviceLimit ?? 1),
}

    try {
      await apiRequest("/pkgplan", { method: 'POST', body: JSON.stringify(payload) })
      toast.success("Internet plan added successfully")
      resetForm()
      setIsAdding(false)
      pkgplans()
} catch (err: any) {
  console.error("Failed to add internet plan:", err);
  // toast.error(err.message || "Failed to add internet plan. Please try again.");
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
    const payload = {
      planName: newPlan.name,
      planCode: newPlan.code,
      connectionType: newPlan.connectionType,
      dataLimit: newPlan.dataLimit,
      downSpeed: newPlan.downloadSpeed,
      upSpeed: newPlan.uploadSpeed,
      isPopular: newPlan.isPopular,
      description: newPlan.description,
      deviceLimit: newPlan.numDevices,
    }
    try {
      await apiRequest(`/pkgplan/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
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
      // toast.error("Failed to delete internet plan. Please try again.")
    }
  }

  const handleCancel = () => {
    resetForm()
    setEditingId(null)
    setIsAdding(false)
  }

  const formatDataLimit = (limit: number | string) => {
    const num = typeof limit === "string" ? parseInt(limit, 10) : limit;
    return num === 0 ? "Unlimited" : `${num}`;
  }
  

  const selectedType = useMemo(() => {
    return ispTypes.find((t) => t.id === newPlan.connectionType)
  }, [ispTypes, newPlan.connectionType])

  return (
    <div className="space-y-6">
      {(isAdding || editingId) && (
        <div className="bg-card border rounded-md p-4 mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editingId ? "Edit Internet Plan" : "Add New Internet Plan"}
          </h3>

          {/* Name & Code */}
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

          {/* Connection Type & Data Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="connectionType">Connection Type</Label>
              <SearchableSelect
                  options={ISP_TYPE_OPTIONS.map(opt => ({ ...opt, value: String(opt.value) }))}
                  value={String(newPlan.connectionType)}
                  onValueChange={(v) =>
                    setNewPlan({ ...newPlan, connectionType: Number(v) })
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


          {/* Speeds */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="downloadSpeed">Download Speed</Label>
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
              <Label htmlFor="uploadSpeed">Upload Speed</Label>
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
          </div>

          {/* Popular & Description */}
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="isPopular"
              checked={newPlan.isPopular}
              onCheckedChange={(c) => setNewPlan({ ...newPlan, isPopular: c })}
            />
            <Label htmlFor="isPopular">Mark as Popular Plan</Label>
          </div>
          <div className="space-y-2 mb-6">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newPlan.description}
              onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Actions */}
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
      )}

      {!isAdding && !editingId && (
        <Button onClick={() => setIsAdding(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Internet Plan
        </Button>
      )}

      {/* Plans Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-[150px]">Connection Type</TableHead>
                <TableHead className="w-[150px]">Speed</TableHead>
                <TableHead className="w-[120px]">Data Limit</TableHead>
                {/* <TableHead className="w-[100px]">Price</TableHead> */}
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {internetPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No internet plans found. Add one above.
                  </TableCell>
                </TableRow>
              ) : (
                internetPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{plan.name}</span>
                        <span className="text-xs text-muted-foreground">{plan.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
  {
    ispTypes.find(t => t.id === plan.connectionType)?.name
    || "(unknown)"
  }
</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-1 text-amber-500" />
                        <span>{plan.downloadSpeed}Mbps / {plan.uploadSpeed}Mbps</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDataLimit(plan.dataLimit)}</TableCell>
                    {/* <TableCell>${plan.price.toFixed(2)}/mo</TableCell> */}
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
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
    </div>
  )
}
