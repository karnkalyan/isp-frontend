"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CardContainer } from "@/components/ui/card-container"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { Plus, Edit2, Trash2, Loader2, Send, Package, ShoppingBag, Eye, Save } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

type BulkInventory = {
  id: number
  name: string
  unit: string
  totalQuantity: number
  availableQuantity: number
  assignedQuantity: number
  usedQuantity: number
}

type Branch = {
  id: number
  name: string
}

type User = {
  id: number
  name: string
  email: string
}

export default function BulkInventoryPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission("bulk_inventory_create")
  const canUpdate = hasPermission("bulk_inventory_update")
  const canDelete = hasPermission("bulk_inventory_delete")

  const [items, setItems] = useState<BulkInventory[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Item form states
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<BulkInventory | null>(null)
  const [itemName, setItemName] = useState("")
  const [itemUnit, setItemUnit] = useState("Meters")
  const [itemQty, setItemQty] = useState("0")
  const [savingItem, setSavingItem] = useState(false)

  // Assignment modal states
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BulkInventory | null>(null)
  const [assignQty, setAssignQty] = useState("")
  const [assignType, setAssignType] = useState<"USER" | "BRANCH" | "SUBBRANCH">("USER")
  const [targetId, setTargetId] = useState("")
  const [remarks, setRemarks] = useState("")
  const [submittingAssign, setSubmittingAssign] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [inventoryData, branchData, userData] = await Promise.all([
        apiRequest<BulkInventory[]>("/bulk-inventory"),
        apiRequest<Branch[]>("/branches"),
        apiRequest<User[]>("/users")
      ])
      setItems(Array.isArray(inventoryData) ? inventoryData : [])
      setBranches(Array.isArray(branchData) ? branchData.filter(b => b.id) : [])
      
      // Handle different formats of user returns
      const userList = Array.isArray(userData) ? userData : (userData as any)?.data || []
      setUsers(Array.isArray(userList) ? userList : [])
    } catch (e) {
      toast.error("Failed to load inventory data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Create or Update Item
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim() || !itemUnit.trim()) {
      toast.error("Name and unit are required")
      return
    }

    setSavingItem(true)
    try {
      if (editingItem) {
        const updated = await apiRequest<BulkInventory>(`/bulk-inventory/${editingItem.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: itemName.trim(),
            unit: itemUnit.trim(),
            totalQuantity: parseFloat(itemQty)
          })
        })
        setItems(prev => prev.map(item => item.id === editingItem.id ? updated : item))
        toast.success("Inventory item updated!")
      } else {
        const created = await apiRequest<BulkInventory>("/bulk-inventory", {
          method: "POST",
          body: JSON.stringify({
            name: itemName.trim(),
            unit: itemUnit.trim(),
            totalQuantity: parseFloat(itemQty)
          })
        })
        setItems(prev => [...prev, created])
        toast.success("Inventory item added successfully!")
      }
      resetItemForm()
    } catch (err: any) {
      toast.error(err.message || "Failed to save item")
    } finally {
      setSavingItem(false)
    }
  }

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return
    try {
      await apiRequest(`/bulk-inventory/${id}`, { method: "DELETE" })
      setItems(prev => prev.filter(item => item.id !== id))
      toast.success("Item deleted successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item")
    }
  }

  // Handle Assign submit
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    const qty = parseFloat(assignQty)
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a positive assignment quantity")
      return
    }
    if (qty > selectedItem.availableQuantity) {
      toast.error(`Insufficient stock! Only ${selectedItem.availableQuantity} ${selectedItem.unit} available.`)
      return
    }
    if (!targetId) {
      toast.error("Please select a target assignee")
      return
    }

    setSubmittingAssign(true)
    try {
      const payload = {
        bulkInventoryId: selectedItem.id,
        quantity: qty,
        branchId: assignType === "BRANCH" ? parseInt(targetId) : null,
        subBranchId: assignType === "SUBBRANCH" ? parseInt(targetId) : null,
        userId: assignType === "USER" ? parseInt(targetId) : null,
        remarks
      }

      const res = await apiRequest<{ updatedItem: BulkInventory }>("/bulk-inventory/assignments", {
        method: "POST",
        body: JSON.stringify(payload)
      })

      if (res && res.updatedItem) {
        setItems(prev => prev.map(item => item.id === selectedItem.id ? res.updatedItem : item))
      }
      toast.success("Stock assigned successfully!")
      resetAssignForm()
    } catch (err: any) {
      toast.error(err.message || "Failed to complete assignment")
    } finally {
      setSubmittingAssign(false)
    }
  }

  const handleEditItemClick = (item: BulkInventory) => {
    setEditingItem(item)
    setItemName(item.name)
    setItemUnit(item.unit)
    setItemQty(String(item.totalQuantity))
    setShowItemForm(true)
  }

  const handleAssignClick = (item: BulkInventory) => {
    setSelectedItem(item)
    setShowAssignForm(true)
  }

  const resetItemForm = () => {
    setEditingItem(null)
    setItemName("")
    setItemUnit("Meters")
    setItemQty("0")
    setShowItemForm(false)
  }

  const resetAssignForm = () => {
    setSelectedItem(null)
    setAssignQty("")
    setTargetId("")
    setRemarks("")
    setShowAssignForm(false)
  }

  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6 space-y-6">
        <PageHeader
          title="Consumables & Bulk Inventory"
          description="Manage drop wire, fiber cable lengths, routers, and generic stock assignments"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            <CardContainer 
              title="Stock Overview" 
              description="Real-time quantities of bulk wire and cable stock"
              action={
                canCreate ? (
                  <Button onClick={() => setShowItemForm(true)} size="sm" className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    <span>Add Consumable</span>
                  </Button>
                ) : undefined
              }
            >
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No bulk items found. Create one.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(item => (
                    <div key={item.id} className="p-4 border rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">{item.name}</h4>
                          <span className="text-xs text-muted-foreground uppercase bg-slate-50 dark:bg-slate-850 px-2 py-0.5 rounded font-medium border border-slate-100 dark:border-slate-800">Unit: {item.unit}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {canUpdate && (
                            <Button variant="ghost" size="icon" onClick={() => handleEditItemClick(item)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Stock Info Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3 border-slate-100 dark:border-slate-800">
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground">Total Quantity</span>
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{item.totalQuantity} {item.unit}</div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground">Available Quantity</span>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">{item.availableQuantity} {item.unit}</div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground">Assigned Quantity</span>
                          <div className="font-semibold text-orange-600 dark:text-orange-400">{item.assignedQuantity + item.usedQuantity} {item.unit}</div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground">Used Quantity</span>
                          <div className="font-semibold text-slate-600 dark:text-slate-400">{item.usedQuantity} {item.unit}</div>
                        </div>
                        <div className="space-y-0.5 col-span-2 border-t pt-1.5 mt-1 border-slate-100 dark:border-slate-800">
                          <span className="text-muted-foreground">Remaining Assigned</span>
                          <div className="font-bold text-blue-600 dark:text-blue-400">{item.assignedQuantity} {item.unit}</div>
                        </div>
                      </div>

                      {canUpdate && (
                        <Button 
                          onClick={() => handleAssignClick(item)} 
                          disabled={item.availableQuantity <= 0} 
                          className="w-full flex items-center justify-center gap-2 mt-2 h-9 text-xs"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Assign Stock</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContainer>
          </div>

          {/* Right Column - Forms */}
          <div className="lg:col-span-1 space-y-6">
            {/* Item form */}
            {showItemForm && (
              <CardContainer title={editingItem ? "Edit Consumable" : "Add New Consumable"} description="Add drop wires, fiber cable parameters, or bulk accessories">
                <form onSubmit={handleItemSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Item Name</Label>
                    <Input id="name" placeholder="e.g. Drop Wire 2-Core" value={itemName} onChange={e => setItemName(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={itemUnit} onValueChange={setItemUnit}>
                        <SelectTrigger id="unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Meters">Meters</SelectItem>
                          <SelectItem value="Pcs">Pcs</SelectItem>
                          <SelectItem value="Rolls">Rolls</SelectItem>
                          <SelectItem value="Boxes">Boxes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="total">Total Quantity</Label>
                      <Input id="total" type="number" step="any" min="0" value={itemQty} onChange={e => setItemQty(e.target.value)} required />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={savingItem} className="flex-1 flex items-center justify-center gap-2">
                      {savingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      <span>{editingItem ? "Update Consumable" : "Add Consumable"}</span>
                    </Button>
                    <Button type="button" variant="outline" onClick={resetItemForm}>Cancel</Button>
                  </div>
                </form>
              </CardContainer>
            )}

            {/* Assign Form */}
            {showAssignForm && selectedItem && (
              <CardContainer title={`Assign ${selectedItem.name}`} description={`Distribute stock to staff or sub-branches. Available: ${selectedItem.availableQuantity} ${selectedItem.unit}`}>
                <form onSubmit={handleAssignSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="assignType">Assignment Mode</Label>
                    <Select value={assignType} onValueChange={(v: any) => { setAssignType(v); setTargetId(""); }}>
                      <SelectTrigger id="assignType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">To Technician / User</SelectItem>
                        <SelectItem value="BRANCH">To Branch Office</SelectItem>
                        <SelectItem value="SUBBRANCH">To Sub-Branch Office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="target">Select Assignee</Label>
                    <Select value={targetId} onValueChange={setTargetId}>
                      <SelectTrigger id="target">
                        <SelectValue placeholder="Choose target..." />
                      </SelectTrigger>
                      <SelectContent>
                        {assignType === "USER" ? (
                          users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.email})</SelectItem>)
                        ) : (
                          branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="qty">Quantity ({selectedItem.unit})</Label>
                    <Input id="qty" type="number" step="any" min="0.01" max={selectedItem.availableQuantity} value={assignQty} onChange={e => setAssignQty(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Input id="remarks" placeholder="Assignment description or project details" value={remarks} onChange={e => setRemarks(e.target.value)} />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={submittingAssign} className="flex-1 flex items-center justify-center gap-2">
                      {submittingAssign ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      <span>Confirm Assignment</span>
                    </Button>
                    <Button type="button" variant="outline" onClick={resetAssignForm}>Cancel</Button>
                  </div>
                </form>
              </CardContainer>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
