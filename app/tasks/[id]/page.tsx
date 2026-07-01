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
import { toast } from "react-hot-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ClipboardList,
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
  MapPin,
  Phone,
  Mail,
  Calendar,
  Building,
  Activity,
  Timer,
  Trash2,
  Check,
  Plus
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { openDirectionsFromCurrentLocation } from "@/lib/directions"

interface TaskActivityLog {
  id: number
  action: string
  lat?: number
  lon?: number
  timestamp: string
  notes?: string
  user?: { id: number; name: string }
}

interface TaskDetail {
  id: number
  title: string
  description?: string
  startTime?: string
  endTime?: string
  duration?: number
  status: string
  priority: string
  assignedTo?: { id: number; name: string; email: string; profilePicture?: string | null }
  customer?: { 
    id: number; 
    customerUniqueId: string; 
    lead?: { 
      firstName: string; 
      lastName: string; 
      phoneNumber?: string; 
      address?: string; 
      street?: string 
    } 
  }
  ticket?: { 
    id: number; 
    ticketNumber: string; 
    title: string; 
    description?: string;
    lead?: { id: number; address?: string; street?: string }; 
    customer?: { id: number; customerUniqueId: string; lead?: { firstName: string; lastName: string; phoneNumber?: string; address?: string; street?: string } } 
  }
  branch?: { id: number; name: string }
  createdAt: string
  startedAt?: string
  completedAt?: string
  workingDuration?: number
  totalDuration?: number
  activityLogs?: TaskActivityLog[]
  warning?: string | null
  createdBy?: { id: number; name: string } | null
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, hasPermission } = useAuth()
  const taskId = params.id as string

  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState<any[]>([])
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const isGlobalAdmin = useMemo(() => {
    if (!user) return false
    const roleStr = typeof user.role === 'string' ? user.role : (user.role?.name || '')
    const roleName = roleStr.toLowerCase()
    return roleName.includes('admin') || roleName === 'administrator' || roleName === 'superadmin' || roleName === 'super_admin'
  }, [user])

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true)
      const detail = await apiRequest<TaskDetail>(`/tasks/${taskId}`)
      setTask(detail)
    } catch (e: any) {
      toast.error("Failed to load task details")
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  useEffect(() => {
    const loadAssignableUsers = async () => {
      try {
        const users = await apiRequest<any[]>("/users")
        setAssignableUsers(
          (users || []).filter((u: any) => {
            const roleName = String(u.role?.name || "").toLowerCase()
            return roleName !== "customer"
          })
        )
      } catch (e) {
        console.error("Failed to load assignable users", e)
      }
    }
    loadAssignableUsers()
  }, [])

  const getCoordinates = (): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GPS Geolocation is not supported by your browser."))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          })
        },
        (err) => {
          let msg = "GPS Location Access Denied."
          if (err.code === err.PERMISSION_DENIED) {
            msg = "Access Denied: GPS coordinate verification is mandatory for field tasks. Please enable browser location permissions."
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = "GPS Position unavailable."
          } else if (err.code === err.TIMEOUT) {
            msg = "GPS Timeout."
          }
          reject(new Error(msg))
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  const handleStatusChange = async (status: string) => {
    if (!task) return
    setUpdatingStatus(true)
    let lat = null
    let lon = null

    if (status === "IN_PROGRESS" || status === "COMPLETED") {
      try {
        toast.loading("Verifying GPS coordinates...", { id: "gps-verify" })
        const coords = await getCoordinates()
        lat = coords.lat
        lon = coords.lon
        toast.success("GPS Verified!", { id: "gps-verify" })
      } catch (err: any) {
        toast.error(err.message, { id: "gps-verify" })
        setUpdatingStatus(false)
        return
      }
    }

    try {
      const updated = await apiRequest<TaskDetail>(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ status, lat, lon }),
      })
      if (updated.warning) {
        toast.error(updated.warning, { duration: 6000 })
      } else {
        toast.success(`Task status updated to ${status.replace("_", " ").toLowerCase()}`)
      }
      fetchTask()
    } catch (e: any) {
      toast.error(e.message || "Failed to update task status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleReassign = async (userId: string) => {
    if (!task) return
    try {
      const body = { assignedToId: userId !== "none" ? Number(userId) : null }
      const updated = await apiRequest<TaskDetail>(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      })
      if (updated.warning) {
        toast.error(updated.warning, { duration: 6000 })
      } else {
        toast.success("Task reassigned successfully")
      }
      fetchTask()
    } catch (e: any) {
      toast.error(e.message || "Failed to reassign task")
    }
  }

  const handleDelete = async () => {
    if (!task) return
    if (!confirm("Are you sure you want to delete this task?")) return
    try {
      await apiRequest(`/tasks/${task.id}`, { method: "DELETE" })
      toast.success("Task deleted successfully")
      router.push("/tasks")
    } catch (e: any) {
      toast.error(e.message || "Failed to delete task")
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return
    setSubmittingComment(true)
    try {
      await apiRequest(`/tasks/${task.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newComment.trim() }),
      })
      setNewComment("")
      toast.success("Work progress note added")
      fetchTask()
    } catch (e: any) {
      toast.error(e.message || "Failed to add note")
    } finally {
      setSubmittingComment(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-slate-100 text-slate-700 border-slate-200"
      case "ACCEPTED": return "bg-sky-50 text-sky-700 border-sky-200"
      case "IN_PROGRESS": return "bg-blue-500 text-white"
      case "ON_HOLD": return "bg-amber-500 text-white"
      case "COMPLETED": return "bg-emerald-500 text-white"
      case "CANCELLED": return "bg-red-500 text-white"
      default: return "bg-gray-500 text-white"
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-100 text-red-750 border-red-200 dark:bg-red-900/20 dark:text-red-400"
      case "HIGH": return "bg-orange-100 text-orange-755 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400"
      case "MEDIUM": return "bg-yellow-100 text-yellow-755 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "LOW": return "bg-green-100 text-green-755 border-green-200 dark:bg-green-900/20 dark:text-green-400"
      default: return ""
    }
  }

  const taskDestination = (t: TaskDetail) =>
    t.customer?.lead?.address ||
    t.customer?.lead?.street ||
    t.ticket?.customer?.lead?.address ||
    t.ticket?.customer?.lead?.street ||
    t.ticket?.lead?.address ||
    t.ticket?.lead?.street ||
    ""

  const isTechnicianActionsDisabled = useMemo(() => {
    if (!task) return true
    if (!user) return true
    if (isGlobalAdmin) return false
    if (hasPermission("tasks_manage")) return false
    return task.assignedTo?.id !== user.id
  }, [task, user, isGlobalAdmin, hasPermission])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!task) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="text-center py-20">
            <ClipboardList className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-700">Task Not Found</h2>
            <p className="text-muted-foreground mt-2">The task you're looking for doesn't exist or has been deleted.</p>
            <Button className="mt-6" onClick={() => router.push("/tasks")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tasks
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const destinationStr = taskDestination(task)

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.push("/tasks")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold text-primary">Task #{task.id}</span>
                <Badge className={`${getStatusColor(task.status)} font-semibold text-xs`}>{task.status.replace("_", " ")}</Badge>
                <Badge variant="outline" className={`font-semibold text-xs ${getPriorityBadgeColor(task.priority)}`}>
                  <Clock className="h-3 w-3 mr-1 inline" />
                  {task.priority}
                </Badge>
              </div>
              <h1 className="text-xl font-bold mt-1">{task.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasPermission("tasks_delete") && (
              <Button variant="outline" className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs gap-1.5" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" /> Delete Task
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden p-6 space-y-5">
              {/* Description */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Description</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {task.description || "Field operation task scheduled for staff."}
                </p>
              </div>

              {/* Task Details Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/40 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Scheduled Date</p>
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    {task.startTime ? new Date(task.startTime).toLocaleDateString() : "Flexible"}
                  </p>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Time Slot</p>
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    {task.startTime ? new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Anytime"}
                  </p>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Duration</p>
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-primary shrink-0" />
                    {task.duration ? (task.duration >= 60 ? `${Math.floor(task.duration / 60)}h ${task.duration % 60 ? (task.duration % 60) + "m" : ""}` : `${task.duration}m`) : "60m"}
                  </p>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Branch</p>
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                    {task.branch?.name || "Global / Main"}
                  </p>
                </div>
              </div>

              {/* Status and Assignment controls */}
              {hasPermission("tasks_update") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Update Status</Label>
                    <Select value={task.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned Technician</Label>
                    <Select value={task.assignedTo ? String(task.assignedTo.id) : "none"} onValueChange={handleReassign}>
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

            {/* GPS Duration Tracking Info */}
            {(task.startedAt || task.completedAt || (task.workingDuration != null && task.workingDuration > 0)) && (
              <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">GPS Location & Duration Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {task.startedAt && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
                      <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Started At</p>
                      <p className="font-mono text-sm font-bold mt-1">{new Date(task.startedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {task.completedAt && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30">
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Completed At</p>
                      <p className="font-mono text-sm font-bold mt-1">{new Date(task.completedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {task.workingDuration != null && task.workingDuration > 0 && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/30">
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Working Time</p>
                      <p className="font-mono text-sm font-bold mt-1">{Math.round(task.workingDuration / 60)} minutes</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress Activity Logs / Comments */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-slate-50 dark:bg-slate-900">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Work Progress Notes & Logs ({task.activityLogs?.length || 0})
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
                  {task.activityLogs?.map(log => {
                    const isComment = log.action === 'COMMENT'
                    return (
                      <div key={log.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                            {log.user?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 p-3 rounded-xl border ${isComment ? 'bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-150' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {isComment ? `Note by ${log.user?.name || 'Staff'}` : log.action}
                            </span>
                            <span className="text-muted-foreground font-mono text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-slate-650 dark:text-slate-300 whitespace-pre-wrap">{log.notes || `State changed to ${log.action}`}</p>
                          {log.lat && log.lon && (
                            <div className="text-[9.5px] text-primary flex items-center gap-1 mt-1 font-semibold">
                              <MapPin className="h-3 w-3" />
                              <span>GPS Verified: {Number(log.lat).toFixed(6)}, {Number(log.lon).toFixed(6)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {(!task.activityLogs || task.activityLogs.length === 0) && (
                    <div className="text-center py-8">
                      <MessageSquare className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No progress notes logged yet.</p>
                    </div>
                  )}
                </div>

                {/* Add Comment */}
                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Input
                    placeholder="Add work progress note..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddComment()}
                    className="flex-1 rounded-lg"
                  />
                  <Button size="icon" onClick={handleAddComment} disabled={submittingComment || !newComment.trim()} className="h-9 w-9 shrink-0">
                    {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Context & Sidebar */}
          <div className="space-y-6">
            {/* Technician Profile Card */}
            <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Assigned Technician</h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {task.assignedTo?.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-150">{task.assignedTo?.name || "Unassigned"}</p>
                  <p className="text-xs text-muted-foreground">{task.assignedTo?.email || "No email linked"}</p>
                </div>
              </div>
            </div>

            {/* GPS Verification Quick Actions */}
            <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">GPS Validation Actions</h3>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl border-blue-100 bg-blue-50/30 text-blue-600 hover:bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20"
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  disabled={task.status === "IN_PROGRESS" || task.status === "COMPLETED" || task.status === "CANCELLED" || isTechnicianActionsDisabled}
                >
                  <Activity className="h-4 w-4 mr-2" /> Start Job (GPS)
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl border-emerald-100 bg-emerald-50/30 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20"
                  onClick={() => handleStatusChange("COMPLETED")}
                  disabled={task.status === "COMPLETED" || task.status === "CANCELLED" || isTechnicianActionsDisabled}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Complete Job (GPS)
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-rose-500 hover:bg-rose-50 rounded-xl text-xs" 
                  onClick={() => handleStatusChange("CANCELLED")}
                  disabled={task.status === "CANCELLED" || isTechnicianActionsDisabled}
                >
                  <XCircle className="h-3.5 w-3.5 mr-2" /> Cancel Task
                </Button>
              </div>
            </div>

            {/* Linked Customer Profile Details */}
            {task.customer && (
              <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Customer Profile Details</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {task.customer.lead?.firstName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/customers/${task.customer.id}`} className="font-bold text-primary hover:underline flex items-center gap-1 text-sm">
                        {task.customer.lead?.firstName} {task.customer.lead?.lastName}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <p className="text-[10px] text-muted-foreground font-mono">ID: {task.customer.customerUniqueId}</p>
                    </div>
                  </div>

                  {task.customer.lead?.phoneNumber && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-slate-700 dark:text-slate-300">{task.customer.lead.phoneNumber}</span>
                    </div>
                  )}
                  {destinationStr && (
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{destinationStr}</span>
                    </div>
                  )}
                  {destinationStr && (
                    <Button variant="outline" className="w-full gap-2 text-xs mt-1" size="sm" onClick={() => openDirectionsFromCurrentLocation(destinationStr)}>
                      <Navigation className="h-3.5 w-3.5" /> Get Directions
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Linked Ticket Details */}
            {task.ticket && (
              <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <div className="p-4 border-b bg-slate-50 dark:bg-slate-900">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Linked Support Ticket</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{task.ticket.ticketNumber}</span>
                    <Link href={`/tickets/${task.ticket.id}`} className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5">
                      View Ticket <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{task.ticket.title}</p>
                  
                  {task.ticket.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3 border-t pt-2 mt-2">{task.ticket.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Task Info Metadata */}
            <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Task Information</h3>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Created By</span>
                <span className="font-bold">{task.createdBy?.name || "System"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Created At</span>
                <span className="font-mono text-muted-foreground">{new Date(task.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-mono text-muted-foreground">{new Date(task.createdAt).toLocaleString() !== new Date(task.createdAt).toLocaleString() ? new Date(task.createdAt).toLocaleString() : new Date(task.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
