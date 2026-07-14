"use client"

import React, { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Check, 
  X, 
  Loader2, 
  Filter, 
  User, 
  GitPullRequest, 
  HelpCircle 
} from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "@/contexts/AuthContext"
import { CardContainer } from "@/components/ui/card-container"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function RequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [typeFilter, setTypeFilter] = useState("ALL")

  // Action Dialog States
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    request: any | null
    actionType: "APPROVED" | "REJECTED" | null
  }>({
    open: false,
    request: null,
    actionType: null
  })
  const [actionReason, setActionReason] = useState("")

  const isGlobalAdmin = React.useMemo(() => {
    if (!user) return false
    const roleStr = typeof user.role === 'string' ? user.role : (user.role?.name || '')
    const roleName = roleStr.toLowerCase()
    return roleName === 'administrator' || 
           roleName === 'admin' || 
           roleName === 'isp_admin' || 
           roleName === 'super admin' || 
           roleName.startsWith('global')
  }, [user])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<any[]>("/billing/requests")
      setRequests(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast.error(e.message || "Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleAction = async () => {
    if (!actionDialog.request || !actionDialog.actionType) return
    try {
      setActionLoading(true)
      await apiRequest(`/billing/requests/${actionDialog.request.id}/action`, {
        method: "POST",
        body: JSON.stringify({
          status: actionDialog.actionType,
          reason: actionReason
        })
      })
      toast.success(`Request ${actionDialog.actionType.toLowerCase()} successfully`)
      setActionDialog({ open: false, request: null, actionType: null })
      setActionReason("")
      loadRequests()
    } catch (e: any) {
      toast.error(e.message || "Failed to process request action")
    } finally {
      setActionLoading(false)
    }
  }

  const filteredRequests = requests.filter(r => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false
    if (typeFilter !== "ALL" && r.type !== typeFilter) return false
    return true
  })

  const formatDetails = (type: string, details: any) => {
    if (type === "PACKAGE_CHANGE") {
      return `Change to Package ID: ${details.newPackageId}`
    }
    if (type === "DISCOUNT") {
      return `Discount of ${details.itemPrice} NPR on Order #${details.orderId} (${details.itemName})`
    }
    return JSON.stringify(details)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900/60 font-semibold">PENDING</Badge>
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/60 font-semibold">APPROVED</Badge>
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/60 font-semibold">REJECTED</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout>
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Branch Requests</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review and approve package change or discount adjustments requested by branches.</p>
        </div>
        <Button onClick={loadRequests} disabled={loading} variant="outline" className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitPullRequest className="h-4 w-4" />}
          Refresh List
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Filters */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 border-b pb-2">
            <Filter className="h-4 w-4" /> Filters
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase font-semibold">Status</Label>
            <select
              className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-background text-foreground p-2 text-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase font-semibold">Request Type</Label>
            <select
              className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-background text-foreground p-2 text-sm"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="PACKAGE_CHANGE">Package Change</option>
              <option value="DISCOUNT">Discount Adjustments</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="md:col-span-3">
          <CardContainer
            title="Requests Board"
            description="Manage requests sent from branches for administrative approval."
            className="shadow-sm border border-slate-200 dark:border-slate-800"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <span className="text-muted-foreground text-sm font-medium">Fetching requests...</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                <HelpCircle className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                <h3 className="font-bold text-slate-700 dark:text-slate-300">No Requests Found</h3>
                <p className="text-sm text-slate-400">There are no requests matching the filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800 shadow-sm bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="h-12 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Date & Branch</th>
                      <th className="h-12 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Customer</th>
                      <th className="h-12 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Details & Reason</th>
                      <th className="h-12 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
                      <th className="h-12 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Auditing</th>
                      <th className="h-12 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((r) => {
                      const custName = r.customer?.lead 
                        ? `${r.customer.lead.firstName || ""} ${r.customer.lead.lastName || ""}`.trim() 
                        : `Customer #${r.customerId}`
                      return (
                        <tr key={r.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">{r.branch?.name || `Branch #${r.branchId}`}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-primary">{custName}</div>
                            <div className="text-xs text-muted-foreground">ID: {r.customer?.customerUniqueId || r.customerId}</div>
                          </td>
                          <td className="p-4 space-y-1">
                            <div className="text-xs font-mono uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded w-max font-bold text-slate-600 dark:text-slate-400">
                              {r.type}
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                              {formatDetails(r.type, r.details)}
                            </div>
                            {r.reason && (
                              <div className="text-xs text-muted-foreground italic mt-0.5">
                                "{r.reason}"
                              </div>
                            )}
                          </td>
                          <td className="p-4">{getStatusBadge(r.status)}</td>
                          <td className="p-4 space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <User className="h-3 w-3" /> Req: {r.requestedByName}
                            </div>
                            {r.approvedByName && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <User className="h-3 w-3" /> App: {r.approvedByName}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {r.status === "PENDING" && isGlobalAdmin ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setActionDialog({ open: true, request: r, actionType: "APPROVED" })}
                                  className="h-8 bg-green-600 hover:bg-green-700 text-white font-medium"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setActionDialog({ open: true, request: r, actionType: "REJECTED" })}
                                  className="h-8 text-red-600 hover:text-red-700 border-red-200 dark:border-red-900/60 font-medium"
                                >
                                  <X className="h-3.5 w-3.5 mr-1" /> Reject
                                </Button>
                              </div>
                            ) : r.status === "PENDING" ? (
                              <span className="text-xs text-muted-foreground italic">Awaiting Admin</span>
                            ) : (
                              <span className="text-xs text-muted-foreground font-semibold uppercase">{r.status}</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContainer>
        </div>
      </div>

      {/* Confirmation & Reason Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, request: null, actionType: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.actionType === "APPROVED" ? "Approve Branch Request" : "Reject Branch Request"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionDialog.actionType?.toLowerCase()} this request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="p-3 bg-muted rounded-lg space-y-1">
              <div className="text-xs font-bold text-muted-foreground">REQUEST DETAILS</div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {actionDialog.request && formatDetails(actionDialog.request.type, actionDialog.request.details)}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason / Remarks (Optional)</Label>
              <Input 
                value={actionReason} 
                onChange={(e) => setActionReason(e.target.value)} 
                placeholder="Enter remarks for the branch log..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, request: null, actionType: null })} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction} 
              disabled={actionLoading}
              className={actionDialog.actionType === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {actionDialog.actionType === "APPROVED" ? "Approval" : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  )
}
