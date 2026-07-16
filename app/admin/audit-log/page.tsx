"use client"

import React, { useState, useEffect, useCallback } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarDateInput } from "@/components/ui/calendar-date-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { Loader2, Search, RefreshCw, ChevronLeft, ChevronRight, Eye, ArrowRight } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { OrchestrationConsole } from "@/components/ui/orchestration-console"

type AuditLog = {
  id: number
  userId: number | null
  user: {
    name: string
    email: string
    role?: { name: string }
  } | null
  action: string
  details: string
  ip: string | null
  browser: string | null
  timestamp: string
  changeCount?: number
  changes?: Array<{ field: string; previous: unknown; new: unknown }>
}

function displayAuditValue(value: unknown) {
  if (value === null || value === undefined) return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

type Pagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}

type ApiResponse = {
  data: AuditLog[]
  pagination: Pagination
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [actions, setActions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingActions, setLoadingActions] = useState(true)
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [selectedAction, setSelectedAction] = useState("ALL")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [pagination, setPagination] = useState<Pagination | null>(null)

  // Load distinct actions
  useEffect(() => {
    const fetchActions = async () => {
      try {
        const data = await apiRequest<string[]>("/audit-logs/actions")
        setActions(data || [])
      } catch (err) {
        console.error("Failed to load audit actions", err)
      } finally {
        setLoadingActions(false)
      }
    }
    fetchActions()
  }, [])

  // Load audit logs
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      queryParams.append("page", String(page))
      queryParams.append("limit", String(limit))
      if (search.trim()) queryParams.append("search", search.trim())
      if (selectedAction && selectedAction !== "ALL") queryParams.append("action", selectedAction)
      if (startDate) queryParams.append("startDate", startDate)
      if (endDate) queryParams.append("endDate", endDate)

      const response = await apiRequest<ApiResponse>(`/audit-logs?${queryParams.toString()}`)
      if (response) {
        setLogs(response.data || [])
        setPagination(response.pagination || null)
      }
    } catch (err) {
      toast.error("Failed to load audit logs")
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, selectedAction, startDate, endDate])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleReset = () => {
    setSearch("")
    setSelectedAction("ALL")
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <PageHeader
        title="System Audit Log"
        description="Track overall user interactions, configurations, actions, and security metrics"
      />

      {/* Filters */}
      <CardContainer title="Filters" description="Narrow down audit records by user search, actions, or date ranges">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="search">Search Keywords</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <CalendarDateInput
                id="search"
                placeholder="Details, IP, Browser..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action">Filter Action</Label>
            <Select value={selectedAction} onValueChange={(v) => { setSelectedAction(v); setPage(1); }}>
              <SelectTrigger id="action" className="border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                {actions.map((act) => (
                  <SelectItem key={act} value={act}>
                    {act}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <div className="relative">
              <Input
                id="startDate"
                value={startDate}
                onChange={(value) => { setStartDate(value); setPage(1); }}
                className="border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <div className="relative">
              <CalendarDateInput
                id="endDate"
                value={endDate}
                onChange={(value) => { setEndDate(value); setPage(1); }}
                className="border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1 border-slate-200 dark:border-slate-800">
              Reset
            </Button>
            <Button onClick={() => fetchLogs()} className="flex-1 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardContainer>

      {/* Logs Table */}
      <CardContainer title="Audit Logs Records" description="Real-time log of security events and configurations">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No audit logs found matching criteria.</div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Browser / Device</th>
                    <th className="p-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                  {logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 text-muted-foreground text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {log.user ? (
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{log.user.name}</span>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <span>{log.user.email}</span>
                                {log.user.role?.name && (
                                  <span className="bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded text-[9px] font-medium">{log.user.role.name}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">System / Anonymous</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30 px-2 py-0.5 rounded text-xs font-mono font-medium">
                            {log.action}
                          </span>
                          {!!log.changeCount && <div className="mt-1 text-[10px] text-muted-foreground">{log.changeCount} field{log.changeCount === 1 ? "" : "s"} changed</div>}
                        </td>
                        <td className="p-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {log.ip || "N/A"}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate" title={log.browser || ""}>
                          {log.browser || "N/A"}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                            className="text-primary flex items-center gap-1.5 ml-auto hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>{expandedLogId === log.id ? "Hide" : "View"}</span>
                          </Button>
                        </td>
                      </tr>

                      {expandedLogId === log.id && (
                        <tr>
                          <td colSpan={6} className="border-y border-border/70 bg-muted/25 p-4 dark:bg-slate-900/30">
                            <div className="space-y-3">
                              {log.changes?.length ? (
                                <div className="overflow-hidden rounded-lg border bg-card">
                                  <div className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold">Changed values</div>
                                  <div className="max-h-80 overflow-auto">
                                    <table className="w-full text-xs">
                                      <thead className="sticky top-0 bg-muted"><tr><th className="p-2 text-left">Field</th><th className="p-2 text-left">Previous value</th><th className="w-8 p-2" /><th className="p-2 text-left">New value</th></tr></thead>
                                      <tbody className="divide-y">{log.changes.map((change, index) => <tr key={`${change.field}-${index}`}><td className="p-2 font-mono font-medium">{change.field}</td><td className="max-w-[360px] break-all p-2 text-rose-600 dark:text-rose-400">{displayAuditValue(change.previous)}</td><td className="p-2 text-muted-foreground"><ArrowRight className="size-3.5" /></td><td className="max-w-[360px] break-all p-2 text-emerald-600 dark:text-emerald-400">{displayAuditValue(change.new)}</td></tr>)}</tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">This event did not change stored fields, or it was recorded before previous/new value tracking was enabled.</div>}
                              <OrchestrationConsole logs={[log]} title="Audit Execution Details" />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="text-xs text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} audit logs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-slate-200 dark:border-slate-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="border-slate-200 dark:border-slate-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContainer>
    </div>
  )
}
