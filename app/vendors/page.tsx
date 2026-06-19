"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { Edit2, Loader2, Plus, Search, Trash2 } from "lucide-react"

type Vendor = {
  id: number
  name: string
  companyName?: string | null
  contactPerson?: string | null
  email?: string | null
  phoneNumber?: string | null
  panVatNumber?: string | null
  address?: string | null
}

const emptyForm = {
  name: "",
  companyName: "",
  contactPerson: "",
  email: "",
  phoneNumber: "",
  panVatNumber: "",
  address: "",
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [form, setForm] = useState(emptyForm)

  const loadVendors = async () => {
    setLoading(true)
    try {
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""
      const data = await apiRequest<Vendor[]>(`/vendors${query}`)
      setVendors(Array.isArray(data) ? data : (data as any)?.data || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load vendors")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVendors()
  }, [])

  const openCreate = () => {
    setEditingVendor(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setForm({
      name: vendor.name || "",
      companyName: vendor.companyName || "",
      contactPerson: vendor.contactPerson || "",
      email: vendor.email || "",
      phoneNumber: vendor.phoneNumber || "",
      panVatNumber: vendor.panVatNumber || "",
      address: vendor.address || "",
    })
    setDialogOpen(true)
  }

  const saveVendor = async () => {
    if (!form.name.trim()) {
      toast.error("Vendor name is required")
      return
    }

    setSaving(true)
    try {
      await apiRequest(editingVendor ? `/vendors/${editingVendor.id}` : "/vendors", {
        method: editingVendor ? "PUT" : "POST",
        body: JSON.stringify(form),
      })
      toast.success(editingVendor ? "Vendor updated" : "Vendor created")
      setDialogOpen(false)
      loadVendors()
    } catch (error: any) {
      toast.error(error.message || "Failed to save vendor")
    } finally {
      setSaving(false)
    }
  }

  const deleteVendor = async (vendor: Vendor) => {
    if (!confirm(`Delete vendor "${vendor.name}"?`)) return
    try {
      await apiRequest(`/vendors/${vendor.id}`, { method: "DELETE" })
      toast.success("Vendor deleted")
      loadVendors()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete vendor")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Vendor Management"
          description="Manage supplier details used by inventory and cable drums."
          actions={[{ label: "New Vendor", onClick: openCreate } as any]}
        />

        <CardContainer title="Vendors">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") loadVendors() }}
                placeholder="Search vendors..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadVendors}>Search</Button>
              <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Vendor</Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>PAN/VAT</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
                ) : vendors.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No vendors found.</TableCell></TableRow>
                ) : vendors.map(vendor => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendor.companyName || "-"}</TableCell>
                    <TableCell>
                      <div>{vendor.contactPerson || "-"}</div>
                      <div className="text-xs text-muted-foreground">{vendor.phoneNumber || vendor.email || ""}</div>
                    </TableCell>
                    <TableCell>{vendor.panVatNumber || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(vendor)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteVendor(vendor)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContainer>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>{editingVendor ? "Edit Vendor" : "New Vendor"}</DialogTitle>
            <DialogDescription>Store vendor contact and tax details for stock purchases.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Vendor Name</Label>
              <Input value={form.name} onChange={(event) => setForm(prev => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={form.companyName} onChange={(event) => setForm(prev => ({ ...prev, companyName: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input value={form.contactPerson} onChange={(event) => setForm(prev => ({ ...prev, contactPerson: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={form.phoneNumber} onChange={(event) => setForm(prev => ({ ...prev, phoneNumber: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(event) => setForm(prev => ({ ...prev, email: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>PAN/VAT Number</Label>
              <Input value={form.panVatNumber} onChange={(event) => setForm(prev => ({ ...prev, panVatNumber: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Textarea value={form.address} onChange={(event) => setForm(prev => ({ ...prev, address: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveVendor} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
