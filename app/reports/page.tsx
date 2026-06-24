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
import { FileSpreadsheet, FileText, Loader2, BarChart3, Users, UserPlus, Package, Ticket, ListChecks } from "lucide-react"
import { apiRequest, getDynamicBaseUrl } from "@/lib/api"

type Branch = {
  id: number
  name: string
  code: string
}

const REPORT_TYPES = [
  { value: "leads", label: "Leads Report", description: "Export sales leads database, sources, and assignment logs." },
  { value: "customers", label: "Customers Report", description: "Export customer details, statuses, and RADIUS username links." },
  { value: "tasks", label: "Tasks & Work Orders Report", description: "Export details on technical tasks, statuses, and durations." },
  { value: "tickets", label: "Support Tickets Report", description: "Export support categories, statuses, and resolution timelines." },
  { value: "inventory", label: "Bulk Stock Inventory", description: "Download remaining consumable drop wire and bulk device stock metrics." },
  { value: "drums", label: "Cable Drums Inventory", description: "Export capacities, manufacturing serials, and utilization metrics." },
  { value: "users", label: "Productivity & User Performance", description: "Track ticket resolution counts and tasks completed per technician." },
  { value: "branches", label: "Branch Performance Statistics", description: "Download total customers, open tasks, and closed tickets per branch." },
  { value: "yeastar-logs", label: "Yeastar PBX Sync Logs", description: "Export detailed API event logs and sync audits of Yeastar VoIP Integration." },
  { value: "asterisk-logs", label: "Asterisk VoIP Call Logs", description: "Export VoIP call logs, start times, durations, trunks, and call directions." },
  { value: "sms-logs", label: "Aakash SMS Delivery Logs", description: "Export transactional and campaign SMS transmission history and statuses." }
]

export default function ReportsPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingBranches, setLoadingBranches] = useState(true)
  const [overview, setOverview] = useState<any>(null)
  
  // Single selection state
  const [selectedReport, setSelectedReport] = useState("leads")
  
  // Unified Filters State
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "ALL",
    branchId: "ALL",
    drumStatus: "ALL"
  })

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
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      const res = await apiRequest<any>("/reports/overview")
      setOverview(res)
    } catch (err) {
      console.error("Failed to load report overview", err)
    }
  }

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

      toast.success(`${REPORT_TYPES.find(r => r.value === reportType)?.label || reportType.toUpperCase()} exported successfully!`)
    } catch (err: any) {
      toast.error(err.message || "Failed to download report")
    } finally {
      setDownloading(null)
    }
  }

  // Dynamic filter visibility checks
  const hasDateFilter = ["leads", "tasks", "tickets", "sms-logs"].includes(selectedReport)
  const hasStatusFilter = ["leads", "customers", "tasks", "tickets", "drums", "sms-logs"].includes(selectedReport)
  const hasBranchFilter = ["leads", "customers", "tasks", "tickets", "users"].includes(selectedReport)

  const handleExport = (format: string) => {
    const params: Record<string, string> = {}
    if (hasDateFilter) {
      params.startDate = filters.startDate
      params.endDate = filters.endDate
    }
    if (hasStatusFilter) {
      params.status = selectedReport === "drums" ? filters.drumStatus : filters.status
    }
    if (hasBranchFilter) {
      params.branchId = filters.branchId
    }
    triggerDownload(selectedReport, format, params)
  }

  const handleReportChange = (val: string) => {
    setSelectedReport(val)
    // Reset filters to defaults for clean state
    setFilters({
      startDate: "",
      endDate: "",
      status: "ALL",
      branchId: "ALL",
      drumStatus: "ALL"
    })
  }

  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6 space-y-6">
        <PageHeader
          title="Reporting & Exports Hub"
          description={`${overview?.isp?.companyName || overview?.isp?.name || "ISP"} reporting, audits, performance logs, and inventory exports`}
        />

        {/* Overview Stat Widgets */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          {[
            { label: "Total Leads", value: overview?.data?.totalLeads ?? 0, icon: UserPlus, color: "text-cyan-600" },
            { label: "Total Customers", value: overview?.data?.totalCustomers ?? 0, icon: Users, color: "text-emerald-600" },
            { label: "Inactive / Expired", value: overview?.data?.inactiveCustomers ?? 0, icon: BarChart3, color: "text-amber-600" },
            { label: "Inventory Devices", value: overview?.data?.inventoryItems ?? 0, icon: Package, color: "text-indigo-600" },
            { label: "Open Tickets", value: overview?.data?.openTickets ?? 0, icon: Ticket, color: "text-rose-600" },
            { label: "Pending Tasks", value: overview?.data?.pendingTasks ?? 0, icon: ListChecks, color: "text-blue-600" },
          ].map((item) => (
            <CardContainer key={item.label} title={item.label}>
              <div className="flex items-center gap-3 py-1">
                <item.icon className={`h-7 w-7 ${item.color}`} />
                <div className="text-2xl font-bold">{item.value}</div>
              </div>
            </CardContainer>
          ))}
        </div>

        {/* Rebuilt Unified Reports Dashboard Panel */}
        <CardContainer title="Dynamic Exporter Panel" description="Select a report type to configure dynamic filters and export to CSV, Excel, or PDF.">
          <div className="space-y-6 max-w-4xl">
            {/* Report Selection Dropdown */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Select Report Type</Label>
              <Select value={selectedReport} onValueChange={handleReportChange}>
                <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 bg-background max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {REPORT_TYPES.map((report) => (
                    <SelectItem key={report.value} value={report.value}>
                      {report.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">
                {REPORT_TYPES.find(r => r.value === selectedReport)?.description}
              </p>
            </div>

            {/* Dynamic Filter Layout Block */}
            {(hasDateFilter || hasStatusFilter || hasBranchFilter) && (
              <div className="border border-border/80 dark:border-slate-800 rounded-xl p-4 bg-muted/20 space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Report Filters</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Date Filters */}
                  {hasDateFilter && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Start Date</Label>
                        <Input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                          className="h-9 border-slate-200 dark:border-slate-800 bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">End Date</Label>
                        <Input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                          className="h-9 border-slate-200 dark:border-slate-800 bg-background"
                        />
                      </div>
                    </>
                  )}

                  {/* Status Filters */}
                  {hasStatusFilter && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      {selectedReport === "drums" ? (
                        <Select value={filters.drumStatus} onValueChange={(v) => setFilters(prev => ({ ...prev, drumStatus: v }))}>
                          <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="ALL">All Drums</SelectItem>
                            <SelectItem value="IN_STOCK">In Stock</SelectItem>
                            <SelectItem value="ASSIGNED">Assigned (Active)</SelectItem>
                            <SelectItem value="USED">Depleted (Fully Used)</SelectItem>
                            <SelectItem value="SCRAPPED">Scrapped</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
                          <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            {selectedReport === "leads" && (
                              <>
                                <SelectItem value="NEW">New</SelectItem>
                                <SelectItem value="CONTACTED">Contacted</SelectItem>
                                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                                <SelectItem value="CONVERTED">Converted</SelectItem>
                                <SelectItem value="LOST">Lost</SelectItem>
                              </>
                            )}
                            {selectedReport === "customers" && (
                              <>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                              </>
                            )}
                            {selectedReport === "tasks" && (
                              <>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                <SelectItem value="OVERDUE">Overdue</SelectItem>
                              </>
                            )}
                            {selectedReport === "tickets" && (
                              <>
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                              </>
                            )}
                            {selectedReport === "sms-logs" && (
                              <>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="skipped">Skipped</SelectItem>
                                <SelectItem value="queued">Queued</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Branch Filters */}
                  {hasBranchFilter && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Branch</Label>
                      <Select value={filters.branchId} onValueChange={(v) => setFilters(prev => ({ ...prev, branchId: v }))} disabled={loadingBranches}>
                        <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800 bg-background">
                          <SelectValue placeholder="All Branches" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="ALL">All Branches</SelectItem>
                          {branches.map(b => (
                            <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions Block */}
            <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => handleExport("csv")}
                disabled={downloading !== null}
                className="flex-1 flex items-center justify-center gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                {downloading === `${selectedReport}_csv` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                )}
                <span>Export CSV</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleExport("excel")}
                disabled={downloading !== null}
                className="flex-1 flex items-center justify-center gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                {downloading === `${selectedReport}_excel` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                )}
                <span>Export Excel</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleExport("pdf")}
                disabled={downloading !== null}
                className="flex-1 flex items-center justify-center gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                {downloading === `${selectedReport}_pdf` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 text-rose-600" />
                )}
                <span>Export PDF</span>
              </Button>
            </div>
          </div>
        </CardContainer>
      </div>
    </DashboardLayout>
  )
}
