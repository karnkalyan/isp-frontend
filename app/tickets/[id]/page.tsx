"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { apiRequest } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LifeBuoy,
  ArrowLeft,
  Clock,
  User,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  ExternalLink,
  Navigation,
  ClipboardList,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Building,
  Activity,
  Timer,
  ChevronRight,
  Edit,
  Trash2,
  Check,
  Plus
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { openDirectionsFromCurrentLocation } from "@/lib/directions"

interface TicketDetail {
  id: number
  ticketNumber: string
  title: string
  description?: string
  status: string
  priority: string
  category?: string
  ticketTypeId?: number
  departmentId?: number
  responseDueAt?: string
  resolutionDueAt?: string
  closeDueAt?: string
  firstRespondedAt?: string
  resolution?: string
  createdAt: string
  updatedAt: string
  subject?: {
    type: "CUSTOMER" | "LEAD" | "GUEST"
    id: number
    uniqueId: string
    firstName: string
    lastName: string
    email: string
    phoneNumber?: string
    address?: string
  }
  assignedTo?: { id: number; name: string; email: string }
  createdBy?: { id: number; name: string; email: string }
  branch?: { id: number; name: string }
  comments?: any[]
  tasks?: TaskDetail[]
}

interface TaskDetail {
  id: number
  title: string
  description?: string
  status: string
  priority: string
  startTime?: string
  endTime?: string
  duration?: number
  assignedTo?: { id: number; name: string; email: string }
  customer?: {
    id: number
    customerUniqueId: string
    lead?: { firstName: string; lastName: string; phoneNumber?: string; address?: string }
  }
  activityLogs?: {
    id: number
    action: string
    lat?: number
    lon?: number
    timestamp: string
    notes?: string
  }[]
  createdAt: string
  startedAt?: string
  completedAt?: string
  workingDuration?: number
  totalDuration?: number
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, hasPermission } = useAuth()
  const ticketId = params.id as string
  const userRoleName = String(typeof user?.role === "string" ? user.role : user?.role?.name || "").toLowerCase()
  const isFieldStaff = userRoleName.includes("field staff") || userRoleName.includes("field_staff")

  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState<any[]>([])
  const [ticketTypes, setTicketTypes] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true)
      const detail = await apiRequest<TicketDetail>(`/tickets/${ticketId}`)
      setTicket(detail)
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to load ticket details", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    fetchTicket()
  }, [fetchTicket])

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const [types, deps, users] = await Promise.all([
          apiRequest<any[]>("/tickets/types?active=true"),
          apiRequest<any>("/department"),
          apiRequest<any[]>("/users"),
        ])
        setTicketTypes(Array.isArray(types) ? types : [])
        setDepartments(Array.isArray(deps) ? deps : deps?.data || [])
        setAssignableUsers(
          (users || []).filter((u: any) => {
            const roleName = String(u.role?.name || "").toLowerCase()
            return roleName !== "customer"
          })
        )
      } catch (e) {
        console.error(e)
      }
    }
    loadConfigs()
  }, [])

  const handleStatusChange = async (status: string) => {
    if (!ticket) return
    if (status === "CLOSED" && isFieldStaff) {
      toast({ title: "Access Denied", description: "Field Staff are not authorized to close tickets.", variant: "destructive" })
      return
    }
    try {
      await apiRequest(`/tickets/${ticket.id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })
      toast({ title: "Success", description: `Ticket status updated to ${status.replace("_", " ")}` })
      fetchTicket()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const handleReassign = async (userId: string) => {
    if (!ticket) return
    try {
      await apiRequest(`/tickets/${ticket.id}`, {
        method: "PUT",
        body: JSON.stringify({ assignedToId: userId !== "none" ? Number(userId) : null }),
      })
      toast({ title: "Success", description: "Ticket reassigned successfully" })
      fetchTicket()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket) return
    setSubmitting(true)
    try {
      await apiRequest(`/tickets/${ticket.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newComment }),
      })
      setNewComment("")
      toast({ title: "Success", description: "Comment added successfully" })
      fetchTicket()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-500 text-white"
      case "IN_PROGRESS": return "bg-amber-500 text-white"
      case "RESOLVED": return "bg-green-500 text-white"
      case "CLOSED": return "bg-gray-500 text-white"
      default: return "bg-gray-500 text-white"
    }
  }

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case "OPEN": return "border-l-blue-500"
      case "IN_PROGRESS": return "border-l-amber-500"
      case "RESOLVED": return "border-l-green-500"
      case "CLOSED": return "border-l-gray-400"
      default: return "border-l-gray-400"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
      case "HIGH": return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "MEDIUM": return <Clock className="h-4 w-4 text-yellow-500" />
      case "LOW": return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default: return null
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
      case "HIGH": return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400"
      case "MEDIUM": return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "LOW": return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400"
      default: return ""
    }
  }

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">Pending</Badge>
      case "ACCEPTED": return <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[10px]">Accepted</Badge>
      case "IN_PROGRESS": return <Badge className="bg-blue-500 hover:bg-blue-600 text-[10px]">In Progress</Badge>
      case "ON_HOLD": return <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px]">On Hold</Badge>
      case "COMPLETED": return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px]">Completed</Badge>
      case "CANCELLED": return <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>
      default: return <Badge variant="secondary" className="text-[10px]">{status}</Badge>
    }
  }

  const subjectHref = (subject: TicketDetail["subject"]) => {
    if (!subject) return "#"
    if (subject.type === "GUEST") return "#"
    return subject.type === "CUSTOMER" ? `/customers/${subject.id}` : `/leads/${subject.id}`
  }

  const getDurationsAndSLA = (t: TicketDetail) => {
    const created = new Date(t.createdAt)
    const now = new Date()
    let rtHours = "Pending"
    if (t.comments && t.comments.length > 0) {
      const staffComment = t.comments.find((c: any) => c.user && c.user.id !== t.subject?.id)
      if (staffComment) {
        const diff = new Date(staffComment.createdAt).getTime() - created.getTime()
        rtHours = (Math.max(0.1, diff / (1000 * 60 * 60))).toFixed(1) + " hrs"
      }
    }
    let ttrHours = "Open"
    if (t.status === "RESOLVED" || t.status === "CLOSED") {
      const diff = new Date(t.updatedAt).getTime() - created.getTime()
      ttrHours = (Math.max(0.1, diff / (1000 * 60 * 60))).toFixed(1) + " hrs"
    }
    let slaStatus = "Met SLA"
    if (t.responseDueAt && new Date(t.responseDueAt) < now && rtHours === "Pending") slaStatus = "Response Overdue"
    else if (t.resolutionDueAt && new Date(t.resolutionDueAt) < now && t.status !== "RESOLVED" && t.status !== "CLOSED") slaStatus = "Resolve Overdue"
    return { rtHours, ttrHours, slaStatus }
  }

  const typeName = useMemo(() => {
    if (!ticket?.ticketTypeId) return "Unclassified"
    return ticketTypes.find(t => t.id === ticket.ticketTypeId)?.name || "Unclassified"
  }, [ticket, ticketTypes])

  const deptName = useMemo(() => {
    if (!ticket?.departmentId) return "General"
    return departments.find(d => d.id === ticket.departmentId)?.name || "General"
  }, [ticket, departments])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="text-center py-20">
            <LifeBuoy className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-700">Ticket Not Found</h2>
            <p className="text-muted-foreground mt-2">The ticket you're looking for doesn't exist or has been deleted.</p>
            <Button className="mt-6" onClick={() => router.push("/tickets")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tickets
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const sla = getDurationsAndSLA(ticket)

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.push("/tickets")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-primary">{ticket.ticketNumber}</span>
                <Badge className={`${getStatusColor(ticket.status)} font-semibold text-xs`}>{ticket.status.replace("_", " ")}</Badge>
                <Badge variant="outline" className={`font-semibold text-xs ${getPriorityBadgeColor(ticket.priority)}`}>
                  {getPriorityIcon(ticket.priority)}
                  <span className="ml-1">{ticket.priority}</span>
                </Badge>
              </div>
              <h1 className="text-xl font-bold mt-1">{ticket.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasPermission("tasks_create") && (
              <Button variant="outline" className="gap-1.5 text-xs" asChild>
                <Link href={`/tasks?ticketId=${ticket.id}&create=true`}>
                  <ClipboardList className="h-3.5 w-3.5" /> Schedule Task
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Details Card */}
            <div className={`rounded-2xl border-l-4 ${getStatusBorderColor(ticket.status)} border bg-card shadow-sm overflow-hidden`}>
              <div className="p-6 space-y-5">
                {/* Description */}
                {ticket.description && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Description</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/40 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Type</p>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{typeName}</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Department</p>
                    <p className="text-xs font-semibold">{deptName}</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Branch</p>
                    <p className="text-xs font-semibold flex items-center gap-1.5">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      {ticket.branch?.name || "Global / Main"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Created</p>
                    <p className="text-xs font-semibold flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(ticket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                {/* SLA Metrics */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">SLA Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Response Time</p>
                      <p className="text-sm font-bold mt-1 font-mono">{sla.rtHours}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Time to Resolve</p>
                      <p className="text-sm font-bold mt-1 font-mono">{sla.ttrHours}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">SLA Status</p>
                      <Badge variant={sla.slaStatus.includes("Overdue") ? "destructive" : "outline"} className="mt-1 text-[10px] font-bold">
                        {sla.slaStatus}
                      </Badge>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Response Due</p>
                      <p className="text-xs font-semibold mt-1">
                        {ticket.responseDueAt ? new Date(ticket.responseDueAt).toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status & Assignment Controls */}
                {hasPermission("tickets_update") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Update Status</Label>
                      <Select value={ticket.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          {!isFieldStaff && <SelectItem value="CLOSED">Closed</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned To</Label>
                      <Select value={ticket.assignedTo ? String(ticket.assignedTo.id) : "none"} onValueChange={handleReassign}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {assignableUsers.map(u => (
                            <SelectItem key={u.id} value={String(u.id)}>{u.name || u.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Tasks Section */}
            {ticket.tasks && ticket.tasks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Assigned Field Tasks ({ticket.tasks.length})
                </h3>
                <div className="space-y-3">
                  {ticket.tasks.map(task => (
                    <div key={task.id} className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">Task #{task.id}</span>
                            {getTaskStatusBadge(task.status)}
                            <Badge variant="outline" className="text-[10px]">{task.priority}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {task.startTime ? new Date(task.startTime).toLocaleDateString() : "Flexible"}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignedTo?.name || "Unassigned"}
                          </span>
                          {task.startTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(task.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                          {task.duration && (
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {task.duration >= 60 ? `${Math.floor(task.duration / 60)}h ${task.duration % 60 ? (task.duration % 60) + "m" : ""}` : `${task.duration}m`}
                            </span>
                          )}
                          {task.customer && (
                            <Link href={`/customers/${task.customer.id}`} className="flex items-center gap-1 text-primary hover:underline" onClick={e => e.stopPropagation()}>
                              {task.customer.customerUniqueId}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>

                        {/* Task Activity Logs */}
                        {task.activityLogs && task.activityLogs.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Recent Activity</p>
                            <div className="space-y-1.5">
                              {task.activityLogs.slice(0, 3).map(log => (
                                <div key={log.id} className="flex items-center gap-2 text-[11px]">
                                  <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${log.action === "COMPLETED" ? "bg-emerald-500" : log.action === "IN_PROGRESS" ? "bg-blue-500" : "bg-slate-400"}`} />
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{log.action === "COMMENT" ? "Note" : log.action.replace("_", " ")}</span>
                                  <span className="text-muted-foreground">{log.notes || ""}</span>
                                  {log.lat && log.lon && (
                                    <span className="text-primary font-mono text-[9px]">
                                      <MapPin className="h-2.5 w-2.5 inline" /> GPS
                                    </span>
                                  )}
                                  <span className="ml-auto text-muted-foreground font-mono text-[10px]">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* GPS Duration Info */}
                        {(task.startedAt || task.completedAt) && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-[10px]">
                            {task.startedAt && (
                              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-2">
                                <p className="font-bold text-blue-600">Started</p>
                                <p className="font-mono">{new Date(task.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                            )}
                            {task.completedAt && (
                              <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-2">
                                <p className="font-bold text-emerald-600">Completed</p>
                                <p className="font-mono">{new Date(task.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                            )}
                            {task.workingDuration != null && task.workingDuration > 0 && (
                              <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-lg p-2">
                                <p className="font-bold text-indigo-600">Working Time</p>
                                <p className="font-mono">{Math.round(task.workingDuration / 60)} min</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments / Activity Log */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-slate-50 dark:bg-slate-900">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Comments & Activity Log ({ticket.comments?.length || 0})
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                  {ticket.comments?.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                          {c.user?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{c.user?.name || "System"}</span>
                          <span className="text-muted-foreground font-mono text-[10px]">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-350 whitespace-pre-wrap">{c.content}</p>
                        {c.isInternal && (
                          <Badge variant="outline" className="text-[9px] mt-1.5 text-amber-600 border-amber-200 bg-amber-50">Internal Note</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!ticket.comments || ticket.comments.length === 0) && (
                    <div className="text-center py-8">
                      <MessageSquare className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No comments yet. Be the first to add one.</p>
                    </div>
                  )}
                </div>

                {/* Add Comment */}
                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddComment()}
                    className="flex-1 rounded-lg"
                  />
                  <Button size="icon" onClick={handleAddComment} disabled={submitting || !newComment.trim()} className="h-9 w-9 shrink-0">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Subject/Contact Card */}
            {ticket.subject && (
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {ticket.subject.type === "CUSTOMER" ? "Customer Details" : ticket.subject.type === "LEAD" ? "Lead Details" : "Contact Details"}
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {ticket.subject.firstName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {ticket.subject.type !== "GUEST" ? (
                        <Link href={subjectHref(ticket.subject)} className="font-bold text-primary hover:underline flex items-center gap-1">
                          {ticket.subject.firstName} {ticket.subject.lastName}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <p className="font-bold">{ticket.subject.firstName} {ticket.subject.lastName}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {ticket.subject.uniqueId}
                      </p>
                    </div>
                  </div>

                  {ticket.subject.email && (
                    <div className="flex items-center gap-2 text-xs">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-slate-700 dark:text-slate-300">{ticket.subject.email}</span>
                    </div>
                  )}
                  {ticket.subject.phoneNumber && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-slate-700 dark:text-slate-300">{ticket.subject.phoneNumber}</span>
                    </div>
                  )}
                  {ticket.subject.address && (
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{ticket.subject.address}</span>
                    </div>
                  )}
                  {ticket.subject.address && (
                    <Button variant="outline" className="w-full gap-2 text-xs" size="sm" onClick={() => openDirectionsFromCurrentLocation(ticket.subject!.address || "")}>
                      <Navigation className="h-3.5 w-3.5" /> Get Directions
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Ticket Meta Card */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-slate-50 dark:bg-slate-900">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ticket Information</h3>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Created By</span>
                  <span className="font-bold">{ticket.createdBy?.name || "System"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Assigned To</span>
                  <span className="font-bold">{ticket.assignedTo?.name || "Unassigned"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Category</span>
                  <span className="font-bold">{ticket.category || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Updated</span>
                  <span className="font-mono text-muted-foreground">{new Date(ticket.updatedAt).toLocaleString()}</span>
                </div>

                {ticket.resolution && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-muted-foreground font-semibold block mb-1">Resolution</span>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{ticket.resolution}</p>
                  </div>
                )}

                {/* SLA Deadlines */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-muted-foreground font-semibold block">SLA Deadlines</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Response Due</span>
                      <span className="font-mono">{ticket.responseDueAt ? new Date(ticket.responseDueAt).toLocaleString() : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolution Due</span>
                      <span className="font-mono">{ticket.resolutionDueAt ? new Date(ticket.resolutionDueAt).toLocaleString() : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Close Due</span>
                      <span className="font-mono">{ticket.closeDueAt ? new Date(ticket.closeDueAt).toLocaleString() : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Summary Card */}
            {ticket.tasks && ticket.tasks.length > 0 && (
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-slate-50 dark:bg-slate-900">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="h-3.5 w-3.5 text-primary" />
                    Tasks Summary
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                      <p className="text-lg font-extrabold">{ticket.tasks.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Total</p>
                    </div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                      <p className="text-lg font-extrabold text-emerald-600">{ticket.tasks.filter(t => t.status === "COMPLETED").length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
