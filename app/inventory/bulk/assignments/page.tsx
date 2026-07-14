"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CardContainer } from "@/components/ui/card-container"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { Loader2, ArrowRightLeft, Check, RotateCcw, Wrench } from "lucide-react"
import { apiRequest } from "@/lib/api"

type Assignment = {
  id: number
  bulkInventoryId: number
  bulkInventory: {
    name: string
    unit: string
  }
  quantity: number
  branchId: number | null
  branch: { name: string } | null
  subBranchId: number | null
  subBranch: { name: string } | null
  userId: number | null
  user: { name: string } | null
  status: "ASSIGNED" | "USED" | "RETURNED"
  date: string
  remarks: string | null
}

export default function BulkAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL")

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    try {
      const url = statusFilter === "ALL" ? "/bulk-inventory/assignments" : `/bulk-inventory/assignments?status=${statusFilter}`
      const data = await apiRequest<Assignment[]>(url)
      setAssignments(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error("Failed to load assignments log")
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  // Update status (mark as USED or RETURNED)
  const handleUpdateStatus = async (id: number, status: "USED" | "RETURNED") => {
    const actionText = status === "USED" ? "used (consumed)" : "returned"
    if (!confirm(`Are you sure you want to mark this stock assignment as ${actionText}?`)) return
    
    setUpdatingId(id)
    try {
      await apiRequest(`/bulk-inventory/assignments/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
      })
      
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      toast.success(`Stock assignment marked as ${status}!`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update assignment status")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6 space-y-6">
        <PageHeader
          title="Stock Assignment Logs"
          description="Track wire meters, consumables, and accessory distributions to technicians and sub-branches"
        />

        <CardContainer 
          title="Assignment Ledger" 
          description="Ledger of active stock distributions and usage updates"
          action={
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned (Active)</SelectItem>
                  <SelectItem value="USED">Used (Consumed)</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No assignments found in log ledger.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="p-3">Date</th>
                    <th className="p-3">Consumable Item</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Assigned To</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Remarks</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                  {assignments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{a.bulkInventory?.name}</td>
                      <td className="p-3 font-mono font-medium">{a.quantity} {a.bulkInventory?.unit}</td>
                      <td className="p-3">
                        {a.user ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{a.user.name}</span>
                            <div className="text-[10px] text-muted-foreground">Technician</div>
                          </div>
                        ) : a.subBranch ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{a.subBranch.name}</span>
                            <div className="text-[10px] text-muted-foreground">Sub-Branch</div>
                          </div>
                        ) : a.branch ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{a.branch.name}</span>
                            <div className="text-[10px] text-muted-foreground">Branch</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">N/A</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                          a.status === "ASSIGNED" 
                            ? "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/20 dark:border-orange-900/30 dark:text-orange-400" 
                            : a.status === "USED" 
                            ? "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950/20 dark:border-slate-900/30 dark:text-slate-400" 
                            : "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400"
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate" title={a.remarks || ""}>{a.remarks || "—"}</td>
                      <td className="p-3 text-right">
                        {a.status === "ASSIGNED" ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleUpdateStatus(a.id, "USED")} 
                              disabled={updatingId !== null} 
                              className="h-7 text-[10px] flex items-center gap-1 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span>Consumed</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleUpdateStatus(a.id, "RETURNED")} 
                              disabled={updatingId !== null} 
                              className="h-7 text-[10px] flex items-center gap-1 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              <RotateCcw className="h-3 w-3 text-rose-600" />
                              <span>Return</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContainer>
      </div>
    </DashboardLayout>
  )
}
