"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CardContainer } from "@/components/ui/card-container"
import { PageHeader } from "@/components/ui/page-header"
import { apiRequest } from "@/lib/api"
import { Loader2, Package } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type AssignedItem = { id: number; name: string; type?: string; serialNumber?: string; ponSerialNumber?: string; macAddress?: string; model?: string; qty?: number; status?: string; updatedAt?: string }
type BulkAssignment = { id: number; quantity: number; status: string; remarks?: string; date?: string; bulkInventory?: { name: string; unit: string } }
type SelectedItem = { kind: "device"; item: AssignedItem } | { kind: "bulk"; item: BulkAssignment }

export default function MyAssignedInventoryPage() {
  const [items, setItems] = useState<AssignedItem[]>([])
  const [bulk, setBulk] = useState<BulkAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SelectedItem | null>(null)

  useEffect(() => {
    Promise.all([
      apiRequest<AssignedItem[]>("/inventory/assigned/me"),
      apiRequest<BulkAssignment[]>("/bulk-inventory/assignments/me"),
    ]).then(([assignedItems, assignments]) => {
      setItems(Array.isArray(assignedItems) ? assignedItems : [])
      setBulk(Array.isArray(assignments) ? assignments : [])
    }).catch(error => console.error("Failed to load assigned inventory", error))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6 px-4 py-6">
        <PageHeader title="My Assigned Items" description="Devices, tools, and consumables assigned to you" />
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
          <div className="grid gap-6 lg:grid-cols-2">
            <CardContainer title="Assigned Devices" description={`${items.length} item(s)`}>
              <div className="space-y-3">
                {items.length === 0 ? <p className="text-sm text-muted-foreground">No devices assigned.</p> : items.map(item => (
                  <button type="button" onClick={() => setSelected({ kind: "device", item })} key={item.id} className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-3"><Package className="h-4 w-4 text-primary" /><div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.serialNumber || item.model || "No serial number"}</p></div></div>
                    <span className="text-xs font-medium">{item.status || `x${item.qty || 1}`}</span>
                  </button>
                ))}
              </div>
            </CardContainer>
            <CardContainer title="Assigned Consumables" description={`${bulk.length} assignment(s)`}>
              <div className="space-y-3">
                {bulk.length === 0 ? <p className="text-sm text-muted-foreground">No consumables assigned.</p> : bulk.map(item => (
                  <button type="button" onClick={() => setSelected({ kind: "bulk", item })} key={item.id} className="flex w-full justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"><div><p className="font-medium">{item.bulkInventory?.name || "Inventory item"}</p><p className="text-xs text-muted-foreground">{item.status}</p></div><span className="font-semibold">{item.quantity} {item.bulkInventory?.unit}</span></button>
                ))}
              </div>
            </CardContainer>
          </div>
        )}
        <Dialog open={Boolean(selected)} onOpenChange={open => !open && setSelected(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Assigned Item Details</DialogTitle></DialogHeader>
            {selected?.kind === "device" && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <span className="text-muted-foreground">Name</span><span className="font-medium">{selected.item.name}</span>
                <span className="text-muted-foreground">Type</span><span>{selected.item.type || "—"}</span>
                <span className="text-muted-foreground">Model</span><span>{selected.item.model || "—"}</span>
                <span className="text-muted-foreground">Serial</span><span>{selected.item.serialNumber || "—"}</span>
                <span className="text-muted-foreground">PON Serial</span><span>{selected.item.ponSerialNumber || "—"}</span>
                <span className="text-muted-foreground">MAC Address</span><span>{selected.item.macAddress || "—"}</span>
                <span className="text-muted-foreground">Quantity</span><span>{selected.item.qty || 1}</span>
                <span className="text-muted-foreground">Status</span><span>{selected.item.status || "Assigned"}</span>
              </div>
            )}
            {selected?.kind === "bulk" && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <span className="text-muted-foreground">Item</span><span className="font-medium">{selected.item.bulkInventory?.name || "Inventory item"}</span>
                <span className="text-muted-foreground">Quantity</span><span>{selected.item.quantity} {selected.item.bulkInventory?.unit}</span>
                <span className="text-muted-foreground">Status</span><span>{selected.item.status}</span>
                <span className="text-muted-foreground">Assigned Date</span><span>{selected.item.date ? new Date(selected.item.date).toLocaleString() : "—"}</span>
                <span className="text-muted-foreground">Remarks</span><span>{selected.item.remarks || "—"}</span>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
