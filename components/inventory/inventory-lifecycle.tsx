"use client"

import { useState, useEffect } from "react"
import { apiRequest } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBranch } from "@/contexts/BranchContext"
import { Loader2, History, Package, Search } from "lucide-react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"

export function InventoryLifecycle() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { selectedBranchId } = useBranch()

  useEffect(() => {
    if (!selectedBranchId) return
    const fetchLifecycle = async () => {
      setLoading(true)
      try {
        const response = await apiRequest(`/inventory?branchId=${selectedBranchId}&includeLogs=true`)
        if (response.success) {
          setItems(response.data)
        }
      } catch (err) {
        console.error("Failed to fetch inventory lifecycle", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLifecycle()
  }, [selectedBranchId])

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(search.toLowerCase()) || 
    item.serialNumber?.toLowerCase().includes(search.toLowerCase()) ||
    item.macAddress?.toLowerCase().includes(search.toLowerCase()) ||
    item.type?.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenHistory = (item: any) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  if (!selectedBranchId) {
    return (
      <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl">
        Please select a branch to view inventory lifecycle.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, type, sn, mac..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex bg-muted/30 p-2 rounded-lg text-sm gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span> In Stock
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span> Assigned
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span> Faulty
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 rounded-xl border-2 border-dashed">
          <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No inventory lifecycle data found.</p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device / Type</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>MAC Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(item => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{item.name}</span>
                      <div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {item.type}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.serialNumber || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.macAddress || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      item.status === 'IN_STOCK' ? 'success' : 
                      item.status === 'ASSIGNED' ? 'default' : 
                      item.status === 'FAULTY' ? 'destructive' : 'secondary'
                    }>
                      {(item.status || '').replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenHistory(item)}
                      className="gap-2"
                    >
                      <History className="h-3.5 w-3.5" />
                      View History
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Device Lifecycle History
            </DialogTitle>
            <DialogDescription>
              Timeline tracking for {selectedItem?.name} (SN: {selectedItem?.serialNumber})
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="max-h-[380px] overflow-y-auto pr-2 space-y-6 relative pl-6 before:absolute before:inset-y-0 before:left-2.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {selectedItem?.logs && selectedItem.logs.length > 0 ? (
                selectedItem.logs.map((log: any, idx: number) => (
                  <div key={log.id} className="relative flex flex-col gap-1">
                    <div className="absolute -left-[20px] top-1.5 flex items-center justify-center w-3 h-3 rounded-full border border-background bg-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-background" />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold text-sm">{(log.action || '').replace(/_/g, ' ')}</span>
                      <time className="text-[10px] text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded border border-muted/50 mt-1">
                      {log.note || 'No notes left during this action.'}
                    </div>
                    {idx === 0 && (
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 font-normal">
                          LATEST
                        </Badge>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-6">
                  No tracking logs recorded yet.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
