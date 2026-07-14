"use client"

import React, { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-hot-toast"
import { Save, Plus, Pencil, Trash2, X, MapPin } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiRequest } from "@/lib/api"
import { useConfirmToast } from "@/hooks/use-confirm-toast"

type DiscountEntry = {
  enabled: boolean
  isPercent: boolean
  value: number // percent (0-100) when isPercent=true, otherwise flat amount
}

type Membership = {
  id: string
  name: string
  code: string
  description: string
  address: string
  details: string
  newMemberEnabled: boolean
  newMemberIsPercent: boolean
  newMemberValue: number
  renewalEnabled: boolean
  renewalIsPercent: boolean
  renewalValue: number
  isActive: boolean
}

export default function MembershipForm() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  // Use the confirm toast hook
  const { confirm, ConfirmDialog } = useConfirmToast()

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    address: "",
    details: "",
  })

  const [newMemberDiscount, setNewMemberDiscount] = useState<DiscountEntry>({
    enabled: true,
    isPercent: true,
    value: 13,
  })

  const [renewalDiscount, setRenewalDiscount] = useState<DiscountEntry>({
    enabled: true,
    isPercent: true,
    value: 10.5,
  })

  // Fetch memberships on component mount
  useEffect(() => {
    fetchMemberships()
  }, [])

  const fetchMemberships = async () => {
    try {
      setLoading(true)
      const data = await apiRequest("/membership")
      setMemberships(data)
    } catch (error) {
      console.error("Failed to fetch memberships:", error)
      toast.error("Failed to load memberships")
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    if (!formData.name.trim()) {
      toast.error("Membership name is required")
      return false
    }
    if (!formData.code.trim()) {
      toast.error("Membership code is required")
      return false
    }
    if (newMemberDiscount.enabled && newMemberDiscount.isPercent && 
        (newMemberDiscount.value < 0 || newMemberDiscount.value > 100)) {
      toast.error("New member discount percent must be between 0 and 100")
      return false
    }
    if (renewalDiscount.enabled && renewalDiscount.isPercent && 
        (renewalDiscount.value < 0 || renewalDiscount.value > 100)) {
      toast.error("Renewal discount percent must be between 0 and 100")
      return false
    }
    return true
  }

  const saveMembership = async () => {
    if (!validate()) return

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim(),
      address: formData.address.trim(),
      details: formData.details.trim(),
      discounts: {
        newMember: newMemberDiscount,
        renewal: renewalDiscount,
      },
    }

    try {
      setLoading(true)
      
      if (editingId) {
        // Update existing membership
        await apiRequest(`/membership/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        toast.success("Membership updated successfully")
      } else {
        // Create new membership
        await apiRequest("/membership", {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        toast.success("Membership created successfully")
      }

      // Refresh list and reset form
      fetchMemberships()
      resetForm()
    } catch (error: any) {
      console.error("Save error:", error)
      toast.error(error.message || "Failed to save membership")
    } finally {
      setLoading(false)
    }
  }

  const editMembership = (membership: Membership) => {
    setEditingId(membership.id)
    setFormData({
      name: membership.name,
      code: membership.code,
      description: membership.description || "",
      address: membership.address || "",
      details: membership.details || "",
    })
    setNewMemberDiscount({
      enabled: membership.newMemberEnabled,
      isPercent: membership.newMemberIsPercent,
      value: membership.newMemberValue,
    })
    setRenewalDiscount({
      enabled: membership.renewalEnabled,
      isPercent: membership.renewalIsPercent,
      value: membership.renewalValue,
    })
  }

  const deleteMembership = async (id: string) => {
    // Use the confirm toast instead of basic confirm
    const isConfirmed = await confirm({
      title: "Delete Membership",
      message: "Are you sure you want to delete this membership? This action cannot be undone.",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    })

    if (!isConfirmed) return

    try {
      setLoading(true)
      await apiRequest(`/membership/${id}`, {
        method: 'DELETE',
      })
      toast.success("Membership deleted successfully")
      fetchMemberships()
    } catch (error: any) {
      console.error("Delete error:", error)
      toast.error(error.message || "Failed to delete membership")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      address: "",
      details: "",
    })
    setNewMemberDiscount({ enabled: true, isPercent: true, value: 13 })
    setRenewalDiscount({ enabled: true, isPercent: true, value: 10.5 })
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

  return (
    <div className="space-y-6">
      {/* Render the confirm dialog */}
      <ConfirmDialog />

      {/* Form for Add/Edit */}
      {(isAdding || editingId) && (
        <CardContainer title={editingId ? "Edit Membership" : "Add New Membership"} description={editingId ? "Update membership details" : "Create a new membership plan"}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Membership Name <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Gold Membership" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">
                  Membership Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="e.g. GOLD"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea 
                  id="address" 
                  placeholder="Enter address (optional)" 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">Additional Details</Label>
                <Textarea 
                  id="details" 
                  placeholder="Enter additional details (optional)" 
                  value={formData.details} 
                  onChange={(e) => setFormData({...formData, details: e.target.value})} 
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe the membership..." 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                rows={3} 
              />
            </div>

            {/* Discounts Panel */}
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">New Member Discount</h4>
                    <div className="text-sm text-muted-foreground">Applied on first installation invoice</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Enable</span>
                      <Switch
                        checked={newMemberDiscount.enabled}
                        onCheckedChange={(v) => setNewMemberDiscount((s) => ({ ...s, enabled: Boolean(v) }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Type</span>
                    <Switch
                      checked={newMemberDiscount.isPercent}
                      onCheckedChange={(v) => setNewMemberDiscount((s) => ({ ...s, isPercent: Boolean(v) }))}
                    />
                    <span className="text-sm">{newMemberDiscount.isPercent ? "%" : "Flat"}</span>
                  </div>

                  <div>
                    <Label>Value</Label>
                    <Input
                      type="number"
                      placeholder={newMemberDiscount.isPercent ? "e.g. 13" : "e.g. 1500"}
                      value={newMemberDiscount.value}
                      onChange={(e) => setNewMemberDiscount((s) => ({ ...s, value: Number(e.target.value) }))}
                      min={0}
                      max={newMemberDiscount.isPercent ? 100 : undefined}
                      disabled={!newMemberDiscount.enabled}
                      step={newMemberDiscount.isPercent ? 0.1 : 1}
                    />
                  </div>

                  <div className="flex items-center">
                    <div className="text-sm text-muted-foreground">Preview: </div>
                    <div className="ml-2 font-medium">
                      {newMemberDiscount.enabled
                        ? newMemberDiscount.isPercent
                          ? `${newMemberDiscount.value}% off`
                          : `Flat ${newMemberDiscount.value} NPR off`
                        : "Disabled"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Renewal Discount</h4>
                    <div className="text-sm text-muted-foreground">Applied on recurring/recharge invoices</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Enable</span>
                      <Switch
                        checked={renewalDiscount.enabled}
                        onCheckedChange={(v) => setRenewalDiscount((s) => ({ ...s, enabled: Boolean(v) }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Type</span>
                    <Switch
                      checked={renewalDiscount.isPercent}
                      onCheckedChange={(v) => setRenewalDiscount((s) => ({ ...s, isPercent: Boolean(v) }))}
                    />
                    <span className="text-sm">{renewalDiscount.isPercent ? "%" : "Flat"}</span>
                  </div>

                  <div>
                    <Label>Value</Label>
                    <Input
                      type="number"
                      placeholder={renewalDiscount.isPercent ? "e.g. 10.5" : "e.g. 850"}
                      value={renewalDiscount.value}
                      onChange={(e) => setRenewalDiscount((s) => ({ ...s, value: Number(e.target.value) }))}
                      min={0}
                      max={renewalDiscount.isPercent ? 100 : undefined}
                      disabled={!renewalDiscount.enabled}
                      step={renewalDiscount.isPercent ? 0.1 : 1}
                    />
                  </div>

                  <div className="flex items-center">
                    <div className="text-sm text-muted-foreground">Preview: </div>
                    <div className="ml-2 font-medium">
                      {renewalDiscount.enabled
                        ? renewalDiscount.isPercent
                          ? `${renewalDiscount.value}% off`
                          : `Flat ${renewalDiscount.value} NPR off`
                        : "Disabled"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button 
                onClick={saveMembership} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> 
                {loading ? "Saving..." : editingId ? "Update Membership" : "Save Membership"}
              </Button>

              <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContainer>
      )}

      {/* List of Memberships */}
      {!isAdding && !editingId && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Memberships</h2>
              <p className="text-muted-foreground">Manage membership plans and discounts</p>
            </div>
            <Button onClick={startAdding} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Membership
            </Button>
          </div>

          <CardContainer>
            {loading ? (
              <div className="text-center py-8">Loading memberships...</div>
            ) : memberships.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No memberships found. Add your first membership plan.
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>New Member Discount</TableHead>
                      <TableHead>Renewal Discount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberships.map((membership) => (
                      <TableRow key={membership.id}>
                        <TableCell className="font-medium">{membership.code}</TableCell>
                        <TableCell>{membership.name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {membership.description || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {membership.address ? (
                              <>
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">
                                  {membership.address}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-2 ${!membership.newMemberEnabled ? 'text-muted-foreground' : ''}`}>
                            {membership.newMemberEnabled ? (
                              <>
                                <span className="font-medium">
                                  {membership.newMemberValue}
                                  {membership.newMemberIsPercent ? '%' : ' NPR'}
                                </span>
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  {membership.newMemberIsPercent ? 'Percent' : 'Flat'}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm">Disabled</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-2 ${!membership.renewalEnabled ? 'text-muted-foreground' : ''}`}>
                            {membership.renewalEnabled ? (
                              <>
                                <span className="font-medium">
                                  {membership.renewalValue}
                                  {membership.renewalIsPercent ? '%' : ' NPR'}
                                </span>
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  {membership.renewalIsPercent ? 'Percent' : 'Flat'}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm">Disabled</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            membership.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {membership.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => editMembership(membership)}
                              className="h-8 w-8 hover:bg-blue-100"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMembership(membership.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-red-100"
                              title="Delete"
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