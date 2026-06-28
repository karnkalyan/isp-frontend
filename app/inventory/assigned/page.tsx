"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CardContainer } from "@/components/ui/card-container"
import { PageHeader } from "@/components/ui/page-header"
import { apiRequest } from "@/lib/api"
import { Loader2, Package } from "lucide-react"

type AssignedItem = { id: number; name: string; serialNumber?: string; model?: string; qty?: number; status?: string }
type BulkAssignment = { id: number; quantity: number; status: string; bulkInventory?: { name: string; unit: string } }

export default function MyAssignedInventoryPage() {
  const [items, setItems] = useState<AssignedItem[]>([])
  const [bulk, setBulk] = useState<BulkAssignment[]>([])
  const [loading, setLoading] = useState(true)

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
                  <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3"><Package className="h-4 w-4 text-primary" /><div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.serialNumber || item.model || "No serial number"}</p></div></div>
                    <span className="text-xs font-medium">{item.status || `x${item.qty || 1}`}</span>
                  </div>
                ))}
              </div>
            </CardContainer>
            <CardContainer title="Assigned Consumables" description={`${bulk.length} assignment(s)`}>
              <div className="space-y-3">
                {bulk.length === 0 ? <p className="text-sm text-muted-foreground">No consumables assigned.</p> : bulk.map(item => (
                  <div key={item.id} className="flex justify-between rounded-lg border p-3"><div><p className="font-medium">{item.bulkInventory?.name || "Inventory item"}</p><p className="text-xs text-muted-foreground">{item.status}</p></div><span className="font-semibold">{item.quantity} {item.bulkInventory?.unit}</span></div>
                ))}
              </div>
            </CardContainer>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
