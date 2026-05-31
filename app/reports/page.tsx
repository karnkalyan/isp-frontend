"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CardContainer } from "@/components/ui/card-container"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { FileSpreadsheet, FileText, Download, Loader2, Calendar } from "lucide-react"
import { apiRequest, getDynamicBaseUrl } from "@/lib/api"

type Branch = {
  id: number
  name: string
  code: string
}

export default function ReportsPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingBranches, setLoadingBranches] = useState(true)

  // Filters for each report
  const [taskFilters, setTaskFilters] = useState({ startDate: "", endDate: "", status: "ALL", branchId: "ALL" })
  const [ticketFilters, setTicketFilters] = useState({ startDate: "", endDate: "", status: "ALL", branchId: "ALL" })
  const [drumFilters, setDrumFilters] = useState({ status: "ALL" })
  const [userFilters, setUserFilters] = useState({ branchId: "ALL" })

  // Export processing state
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await apiRequest<Branch[]>("/branches")
        setBranches(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Failed to load branches", err)
      } finally {
        setLoadingBranches(false)
      }
    }
    fetchBranches()
  }, [])

  const triggerDownload = async (reportType: string, format: string, params: Record<string, string>) => {
    const loaderId = `${reportType}_${format}`
    setDownloading(loaderId)
    try {
      const queryParams = new URLSearchParams()
      queryParams.append("format", format)
      Object.entries(params).forEach(([key, val]) => {
        if (val && val !== "ALL") {
          queryParams.append(key, val)
        }
      })

      const base = getDynamicBaseUrl().replace(/\/+$/, "")
      const url = `${base}/reports/${reportType}?${queryParams.toString()}`
      
      // We will perform a standard browser download
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "x-selected-branch-id": typeof window !== "undefined" ? localStorage.getItem("selected-branch-id") || "" : ""
        }
      })

      if (!response.ok) {
        throw new Error("Failed to export report")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      
      let ext = "csv"
      if (format === "excel" || format === "xlsx") ext = "xlsx"
      else if (format === "pdf") ext = "pdf"

      link.setAttribute("download", `${reportType}_report_${new Date().toISOString().split("T")[0]}.${ext}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success(`${reportType.toUpperCase()} report exported successfully!`)
    } catch (err: any) {
      toast.error(err.message || "Failed to download report")
    } finally {
      setDownloading(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6 space-y-6">
        <PageHeader
          title="Reporting & Exports Hub"
          description="Download system-wide audits, performance logs, and inventory statuses in Excel, CSV, or PDF format"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tasks Report Card */}
          <CardContainer title="Tasks Report" description="Export technicians task status, scheduled times, and durations">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={taskFilters.startDate} onChange={(e) => setTaskFilters(prev => ({ ...prev, startDate: e.target.value }))} className="h-9 border-slate-200 dark:border-slate-800" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={taskFilters.endDate} onChange={(e) => setTaskFilters(prev => ({ ...prev, endDate: e.target.value }))} className="h-9 border-slate-200 dark:border-slate-800" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={taskFilters.status} onValueChange={(v) => setTaskFilters(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Branch</Label>
                  <Select value={taskFilters.branchId} onValueChange={(v) => setTaskFilters(prev => ({ ...prev, branchId: v }))} disabled={loadingBranches}>
                    <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Branches</SelectItem>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => triggerDownload("tasks", "csv", taskFilters)} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "tasks_csv" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
                  <span>CSV</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerDownload("tasks", "excel", taskFilters)} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "tasks_excel" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />}
                  <span>Excel</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerDownload("tasks", "pdf", taskFilters)} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "tasks_pdf" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-rose-600" />}
                  <span>PDF</span>
                </Button>
              </div>
            </div>
          </CardContainer>

          {/* Tickets Report Card */}
          <CardContainer title="Support Tickets Report" description="Export ticketing categories, resolution statuses, and lead issues">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={ticketFilters.startDate} onChange={(e) => setTicketFilters(prev => ({ ...prev, startDate: e.target.value }))} className="h-9 border-slate-200 dark:border-slate-800" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={ticketFilters.endDate} onChange={(e) => setTicketFilters(prev => ({ ...prev, endDate: e.target.value }))} className="h-9 border-slate-200 dark:border-slate-800" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={ticketFilters.status} onValueChange={(v) => setTicketFilters(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Branch</Label>
                  <Select value={ticketFilters.branchId} onValueChange={(v) => setTicketFilters(prev => ({ ...prev, branchId: v }))} disabled={loadingBranches}>
                    <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Branches</SelectItem>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => triggerDownload("tickets", "csv", ticketFilters)} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "tickets_csv" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
                  <span>CSV</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerDownload("tickets", "excel", ticketFilters)} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "tickets_excel" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />}
                  <span>Excel</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerDownload("tickets", "pdf", ticketFilters)} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "tickets_pdf" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-rose-600" />}
                  <span>PDF</span>
                </Button>
              </div>
            </div>
          </CardContainer>

          {/* Bulk Stock Inventory Report Card */}
          <CardContainer title="Bulk stock Inventory" description="Download remaining consumable wire and bulk stock metrics">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">This report generates stock totals for Drop Wire, Fiber meters, and other consumables, including assigned and remaining quantities.</p>
              <div className="flex items-center gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => triggerDownload("inventory", "csv", {})} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "inventory_csv" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
                  <span>CSV</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerDownload("inventory", "excel", {})} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "inventory_excel" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />}
                  <span>Excel</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerDownload("inventory", "pdf", {})} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "inventory_pdf" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-rose-600" />}
                  <span>PDF</span>
                </Button>
              </div>
            </div>
          </CardContainer>

          {/* Fiber Cable Drums Report Card */}
          <CardContainer title="Cable Drums Inventory" description="Download capacities, manufacturing dates, serials, and usage details of fiber drums">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Drum Status</Label>
                <Select value={drumFilters.status} onValueChange={(v) => setDrumFilters({ status: v })}>
                  <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Drums</SelectItem>
                    <SelectItem value="IN_STOCK">In Stock</SelectItem>
                    <SelectItem value="ASSIGNED">Assigned (Active)</SelectItem>
                    <SelectItem value="USED">Depleted (Fully Used)</SelectItem>
                    <SelectItem value="SCRAPPED">Scrapped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => triggerDownload("drums", "csv", drumFilters)} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "drums_csv" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
                  <span>CSV</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerDownload("drums", "excel", drumFilters)} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "drums_excel" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />}
                  <span>Excel</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerDownload("drums", "pdf", drumFilters)} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "drums_pdf" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-rose-600" />}
                  <span>PDF</span>
                </Button>
              </div>
            </div>
          </CardContainer>

          {/* User Productivity Performance Report Card */}
          <CardContainer title="Productivity & User Performance" description="Track ticket resolution rates and tasks completed per technician">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Branch Filter</Label>
                <Select value={userFilters.branchId} onValueChange={(v) => setUserFilters({ branchId: v })} disabled={loadingBranches}>
                  <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Branches</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => triggerDownload("users", "csv", userFilters)} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "users_csv" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
                  <span>CSV</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerDownload("users", "excel", userFilters)} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "users_excel" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />}
                  <span>Excel</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerDownload("users", "pdf", userFilters)} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "users_pdf" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-rose-600" />}
                  <span>PDF</span>
                </Button>
              </div>
            </div>
          </CardContainer>

          {/* Branch Performance Statistics Card */}
          <CardContainer title="Branch Statistics" description="Overview of tasks, tickets, and active customers per branch">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Download detailed statistics summarizing customer counts, total created and completed tasks, and support ticket closing ratios across branches.</p>
              <div className="flex items-center gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => triggerDownload("branches", "csv", {})} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "branches_csv" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
                  <span>CSV</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerDownload("branches", "excel", {})} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "branches_excel" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />}
                  <span>Excel</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerDownload("branches", "pdf", {})} disabled={downloading !== null} className="flex-1 flex items-center gap-1.5 border-slate-200 dark:border-slate-800">
                  {downloading === "branches_pdf" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-rose-600" />}
                  <span>PDF</span>
                </Button>
              </div>
            </div>
          </CardContainer>
        </div>
      </div>
    </DashboardLayout>
  )
}
