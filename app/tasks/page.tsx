"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Clock, 
  User, 
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  MapPin,
  Phone,
  Timer,
  LayoutGrid,
  List as ListIcon,
  MapPinOff,
  UserCheck,
  Hourglass,
  Activity,
  AlertCircle
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBranch } from "@/contexts/BranchContext"
import { useAuth } from "@/contexts/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface TaskActivityLog {
  id: number
  action: string
  lat?: number
  lon?: number
  timestamp: string
  notes?: string
  user?: { name: string }
}

interface Task {
  id: number
  title: string
  description?: string
  startTime?: string
  endTime?: string
  duration?: number
  status: string
  priority: string
  assignedTo?: { id: number; name: string; email: string }
  customer?: { id: number; customerUniqueId: string; lead: { firstName: string; lastName: string; phoneNumber?: string; address?: string } }
  ticket?: { id: number; ticketNumber: string; title: string }
  branch?: { id: number; name: string }
  createdAt: string
  startedAt?: string
  completedAt?: string
  workingDuration?: number
  totalDuration?: number
  activityLogs?: TaskActivityLog[]
  warning?: string | null
}

export default function TasksPage() {
  const { branches, selectedBranchId } = useBranch()
  const { user, hasPermission } = useAuth()
  const canCreateTask = hasPermission("tasks_create")
  
  const isGlobalAdmin = useMemo(() => {
    if (!user) return false
    const roleStr = typeof user.role === 'string' ? user.role : (user.role?.name || '')
    const roleName = roleStr.toLowerCase()
    return roleName.includes('admin') || roleName === 'administrator'
  }, [user])

  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  // Views and Filters
  const [activeTab, setActiveTab] = useState("all") // all, today, pending, timeline
  const [timelineMode, setTimelineMode] = useState<"daily" | "weekly">("daily")
  const [timelineDate, setTimelineDate] = useState<Date>(new Date())
  const [search, setSearch] = useState("")

  // Form State
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newStaffId, setNewStaffId] = useState("none")
  const [newStartTime, setNewStartTime] = useState("")
  const [newDuration, setNewDuration] = useState("60") // minutes
  const [newPriority, setNewPriority] = useState("MEDIUM")
  const [timeSlot, setTimeSlot] = useState("10:00")
  
  // Overlap Warning on creation
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)

  const metrics = useMemo(() => {
    const todayStr = new Date().toDateString();
    
    let today = 0;
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;

    tasks.forEach(t => {
      const isToday = t.startTime && new Date(t.startTime).toDateString() === todayStr;
      if (isToday) today++;
      
      if (t.status === "PENDING" || t.status === "ACCEPTED") pending++;
      else if (t.status === "IN_PROGRESS") inProgress++;
      else if (t.status === "COMPLETED") completed++;
      else if (t.status === "OVERDUE") overdue++;
      
      // Secondary check for overdue
      const isPast = t.endTime && new Date(t.endTime) < new Date();
      if (isPast && t.status !== "COMPLETED" && t.status !== "CANCELLED" && t.status !== "OVERDUE") {
        overdue++;
      }
    });

    return { today, pending, inProgress, completed, overdue };
  }, [tasks]);

  const predefinedTimeSlots = [
    { label: "08:00 AM", value: "08:00" },
    { label: "09:00 AM", value: "09:00" },
    { label: "10:00 AM", value: "10:00" },
    { label: "11:00 AM", value: "11:00" },
    { label: "12:00 PM", value: "12:00" },
    { label: "01:00 PM", value: "13:00" },
    { label: "02:00 PM", value: "14:00" },
    { label: "03:00 PM", value: "15:00" },
    { label: "04:00 PM", value: "16:00" },
    { label: "05:00 PM", value: "17:00" },
  ]

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiRequest<Task[]>("/tasks")
      setTasks(res || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const url = branches.length > 0 && selectedBranchId ? `/users?branchId=${selectedBranchId}` : "/users"
      const res = await apiRequest<any>(url)
      const list = Array.isArray(res) ? res : res?.data || []
      setUsers(list.filter((item: any) => {
        const roleName = typeof item.role === "string" ? item.role : item.role?.name
        return String(roleName || "").toLowerCase() !== "customer"
      }))
    } catch (e) {
      console.error(e)
    }
  }, [branches.length, selectedBranchId])

  useEffect(() => {
    fetchTasks()
    fetchUsers()
  }, [fetchTasks, fetchUsers])

  // Get full task details including activityLogs
  const fetchTaskDetails = async (taskId: number) => {
    try {
      const details = await apiRequest<Task>(`/tasks/${taskId}`)
      setSelectedTask(details)
    } catch (err) {
      toast.error("Failed to load task details")
    }
  }

  // Browser Geolocation Prompter
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
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      )
    })
  }

  const handleCreate = async () => {
    if (!canCreateTask) {
      toast.error("You do not have permission to schedule tasks.")
      return
    }

    if (!newTitle.trim()) {
      toast.error("Task title is required")
      return
    }
    
    setSubmitting(true)
    
    let finalStartTime = undefined
    if (newStartTime) {
        const date = new Date(newStartTime)
        const [hours, minutes] = timeSlot.split(':')
        date.setHours(Number(hours), Number(minutes), 0, 0)
        finalStartTime = date.toISOString()
    }

    try {
      const res = await apiRequest<Task & { warning?: string }>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          assignedToId: newStaffId !== "none" ? Number(newStaffId) : undefined,
          startTime: finalStartTime,
          duration: Number(newDuration),
          priority: newPriority,
          status: "PENDING"
        })
      })

      if (res.warning) {
        toast.error(res.warning, { duration: 6000 })
      } else {
        toast.success("Task scheduled successfully!")
      }

      setShowCreate(false)
      // Reset form
      setNewTitle(""); setNewDesc(""); setNewStaffId("none"); setNewStartTime(""); setNewDuration("60"); setNewPriority("MEDIUM")
      fetchTasks()
    } catch (error: any) {
      toast.error(error.message || "Failed to assign task")
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (taskId: number, status: string) => {
    let lat = null
    let lon = null

    // GPS validation for IN_PROGRESS or COMPLETED
    if (status === "IN_PROGRESS" || status === "COMPLETED") {
      try {
        toast.loading("Verifying GPS coordinates...", { id: "gps-verify" })
        const coords = await getCoordinates()
        lat = coords.lat
        lon = coords.lon
        toast.success("GPS Verified!", { id: "gps-verify" })
      } catch (err: any) {
        toast.error(err.message, { id: "gps-verify", duration: 5000 })
        return // Block execution
      }
    }

    try {
      const updated = await apiRequest<Task>(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ status, lat, lon })
      })

      if (updated.warning) {
        toast.error(updated.warning, { duration: 6000 })
      } else {
        toast.success(`Task marked as ${status.replace("_", " ").toLowerCase()}!`)
      }

      fetchTasks()
      // Reload details to update ActivityLogs
      fetchTaskDetails(taskId)
    } catch (error: any) {
      toast.error(error.message || "Failed to update task status")
    }
  }

  const filteredTasks = useMemo(() => {
    let list = tasks
    if (activeTab === "today") {
        const today = new Date().toDateString()
        list = list.filter(t => t.startTime && new Date(t.startTime).toDateString() === today)
    } else if (activeTab === "pending") {
        list = list.filter(t => t.status === "PENDING" || t.status === "ACCEPTED")
    }

    if (search) {
        const s = search.toLowerCase()
        list = list.filter(t => t.title.toLowerCase().includes(s) || t.customer?.customerUniqueId?.toLowerCase().includes(s))
    }
    return list
  }, [tasks, activeTab, search])

  // Scheduler Timeline Calculations
  const timelineData = useMemo(() => {
    if (activeTab !== "timeline") return []
    
    const staffList = users.length > 0 ? users : [{ id: 0, name: "Unassigned" }]
    
    return staffList.map(staff => {
      const staffTasks = tasks.filter(t => {
        if (staff.id === 0) return !t.assignedTo
        return t.assignedTo?.id === staff.id
      })

      // Filter tasks by date range depending on Mode
      let filtered: Task[] = []
      if (timelineMode === "daily") {
        const targetStr = timelineDate.toDateString()
        filtered = staffTasks.filter(t => t.startTime && new Date(t.startTime).toDateString() === targetStr)
      } else {
        // Weekly range
        const startOfWeek = new Date(timelineDate)
        startOfWeek.setDate(timelineDate.getDate() - timelineDate.getDay()) // Sunday
        startOfWeek.setHours(0,0,0,0)
        
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday
        endOfWeek.setHours(23,59,59,999)

        filtered = staffTasks.filter(t => {
          if (!t.startTime) return false
          const d = new Date(t.startTime)
          return d >= startOfWeek && d <= endOfWeek
        })
      }

      return {
        staff,
        tasks: filtered
      }
    })
  }, [tasks, users, activeTab, timelineMode, timelineDate])

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING": return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 px-2 py-0.5 text-[10px]">Pending</Badge>
      case "ACCEPTED": return <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 px-2 py-0.5 text-[10px]">Accepted</Badge>
      case "IN_PROGRESS": return <Badge className="bg-blue-500 hover:bg-blue-600 px-2 py-0.5 text-[10px]">In Progress</Badge>
      case "ON_HOLD": return <Badge className="bg-amber-500 hover:bg-amber-600 px-2 py-0.5 text-[10px]">On Hold</Badge>
      case "COMPLETED": return <Badge className="bg-emerald-500 hover:bg-emerald-600 px-2 py-0.5 text-[10px]">Completed</Badge>
      case "CANCELLED": return <Badge variant="destructive" className="px-2 py-0.5 text-[10px]">Cancelled</Badge>
      case "OVERDUE": return <Badge variant="destructive" className="bg-rose-150 text-rose-700 px-2 py-0.5 text-[10px]">Overdue</Badge>
      default: return <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">{status}</Badge>
    }
  }

  // Predefined columns for daily hours
  const hoursColumns = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]
  
  // Weekly columns
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const navigateTimeline = (direction: number) => {
    const next = new Date(timelineDate)
    if (timelineMode === "daily") {
      next.setDate(timelineDate.getDate() + direction)
    } else {
      next.setDate(timelineDate.getDate() + direction * 7)
    }
    setTimelineDate(next)
  }

  const openSlotCreator = (staffId: number, hourSlot?: string, dayOffset?: number) => {
    if (!canCreateTask) return
    setNewStaffId(staffId === 0 ? "none" : String(staffId))
    
    const targetDate = new Date(timelineDate)
    if (timelineMode === "weekly" && dayOffset !== undefined) {
      targetDate.setDate(timelineDate.getDate() - timelineDate.getDay() + dayOffset)
    }
    setNewStartTime(targetDate.toISOString().split('T')[0])
    
    if (hourSlot) {
      setTimeSlot(hourSlot)
    }
    setShowCreate(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ClipboardList className="h-8 w-8 text-primary" />
              Field Operations
            </h1>
            <p className="text-muted-foreground mt-1">Manage technician schedules, GPS validations, timelines, and maintenance tasks</p>
          </div>
          {canCreateTask && (
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" /> Schedule Job
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Assign New Task</DialogTitle>
                  <DialogDescription>Create and assign a task to field staff.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Task Title *</Label>
                    <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Fiber repair at Main St" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Additional instructions..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Assign Staff</Label>
                      <Select value={newStaffId} onValueChange={setNewStaffId}>
                        <SelectTrigger><SelectValue placeholder="Select Staff" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={newPriority} onValueChange={setNewPriority}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Time Slot</Label>
                      <Select value={timeSlot} onValueChange={setTimeSlot}>
                        <SelectTrigger><SelectValue placeholder="Choose Slot" /></SelectTrigger>
                        <SelectContent>
                          {predefinedTimeSlots.map(slot => (
                            <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (Minutes)</Label>
                      <Select value={newDuration} onValueChange={setNewDuration}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="240">4 hours</SelectItem>
                          <SelectItem value="480">Full day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Assign Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-in fade-in duration-300">
          {/* Today's Tasks */}
          <div className="p-4 border rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Today's Jobs</span>
              <span className="text-xl font-bold text-slate-850 dark:text-slate-200">{metrics.today}</span>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="p-4 border rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Hourglass className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Pending</span>
              <span className="text-xl font-bold text-slate-850 dark:text-slate-200">{metrics.pending}</span>
            </div>
          </div>

          {/* In Progress */}
          <div className="p-4 border rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-450">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">In Progress</span>
              <span className="text-xl font-bold text-slate-850 dark:text-slate-200">{metrics.inProgress}</span>
            </div>
          </div>

          {/* Completed */}
          <div className="p-4 border rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Completed</span>
              <span className="text-xl font-bold text-slate-855 dark:text-slate-200">{metrics.completed}</span>
            </div>
          </div>

          {/* Overdue */}
          <div className="p-4 border rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm col-span-2 md:col-span-1 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Overdue</span>
              <span className="text-xl font-bold text-rose-650 dark:text-rose-450">{metrics.overdue}</span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-2 rounded-xl">
            <TabsList className="bg-transparent border-none">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">All Tasks</TabsTrigger>
              <TabsTrigger value="today" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Today's Agenda</TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Pending</TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Scheduler Timeline</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search jobs..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-white border-none shadow-sm" 
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchTasks} className="bg-white shadow-sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="timeline" className="mt-6 border p-4 rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 space-y-4">
            {/* Timeline Scheduler Header controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateTimeline(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="font-bold text-sm min-w-[150px] text-center">
                  {timelineMode === "daily" 
                    ? timelineDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                    : `Week of ${new Date(timelineDate.getTime() - timelineDate.getDay()*24*60*60*1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                  }
                </span>
                <Button variant="outline" size="sm" onClick={() => navigateTimeline(1)}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setTimelineDate(new Date())}>Today</Button>
              </div>

              <div className="flex gap-2">
                <Button variant={timelineMode === "daily" ? "default" : "outline"} size="sm" onClick={() => setTimelineMode("daily")}>Daily View</Button>
                <Button variant={timelineMode === "weekly" ? "default" : "outline"} size="sm" onClick={() => setTimelineMode("weekly")}>Weekly View</Button>
              </div>
            </div>

            {/* Scheduler Timeline Grid */}
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
              <table className="w-full border-collapse min-w-[800px] text-left">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-900 text-xs font-semibold text-muted-foreground border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 w-48 border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-slate-100 dark:bg-slate-900 z-10">Technician</th>
                    {timelineMode === "daily" ? (
                      hoursColumns.map(hour => <th key={hour} className="p-3 text-center border-r border-slate-100 dark:border-slate-850 font-mono text-[10px]">{hour}</th>)
                    ) : (
                      weekdays.map((day, i) => {
                        const dayDate = new Date(timelineDate)
                        dayDate.setDate(timelineDate.getDate() - timelineDate.getDay() + i)
                        return (
                          <th key={day} className="p-3 text-center border-r border-slate-100 dark:border-slate-850">
                            <div>{day}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{dayDate.getDate()}</div>
                          </th>
                        )
                      })
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {timelineData.map(({ staff, tasks }) => (
                    <tr key={staff.id} className="hover:bg-white dark:hover:bg-slate-900 transition-colors">
                      <td className="p-3 font-semibold border-r border-slate-200 dark:border-slate-850 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] font-bold bg-slate-200 text-slate-700">{staff.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <span>{staff.name}</span>
                      </td>

                      {timelineMode === "daily" ? (() => {
                        let skipCount = 0;
                        return hoursColumns.map((hour, colIndex) => {
                          if (skipCount > 0) {
                            skipCount--;
                            return null;
                          }

                          const colHourNum = parseInt(hour.split(":")[0]);
                          
                          // Find if any task starts at this hour
                          const matched = tasks.find(t => {
                            if (!t.startTime) return false;
                            const d = new Date(t.startTime);
                            // check if same date
                            if (d.toDateString() !== timelineDate.toDateString()) return false;
                            return d.getHours() === colHourNum;
                          });

                          let colSpan = 1;
                          if (matched) {
                            let durationMin = matched.duration || 60;
                            if (matched.startTime && matched.endTime) {
                              const diffMs = new Date(matched.endTime).getTime() - new Date(matched.startTime).getTime();
                              durationMin = Math.round(diffMs / (1000 * 60));
                            }
                            const durationHours = Math.max(1, Math.ceil(durationMin / 60));
                            colSpan = Math.min(durationHours, hoursColumns.length - colIndex);
                            skipCount = colSpan - 1;
                          }

                          return (
                            <td 
                              key={hour} 
                              colSpan={colSpan} 
                              className={`p-2 text-center border-r border-slate-100 dark:border-slate-850 h-12 relative ${
                                colSpan > 1 ? "bg-slate-100/30 dark:bg-slate-900/10" : ""
                              }`}
                              style={{ width: colSpan * 80 }}
                            >
                              {matched ? (
                                <div 
                                  onClick={() => fetchTaskDetails(matched.id)}
                                  className={`p-1.5 rounded-lg border text-left cursor-pointer hover:shadow transition-shadow select-none overflow-hidden h-9 text-[10px] leading-tight ${
                                    matched.status === "COMPLETED" 
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                      : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                                  }`}
                                >
                                  <div className="font-semibold truncate">{matched.title}</div>
                                  <div className="text-[8px] text-muted-foreground truncate opacity-80 mt-0.5">
                                    {(() => {
                                      const start = new Date(matched.startTime!);
                                      const end = matched.endTime ? new Date(matched.endTime) : new Date(start.getTime() + (matched.duration || 60) * 60 * 1000);
                                      const fmt = (d: Date) => {
                                        let h = d.getHours();
                                        const m = d.getMinutes();
                                        const ap = h >= 12 ? 'PM' : 'AM';
                                        h = h % 12;
                                        h = h ? h : 12;
                                        return `${h}:${m < 10 ? '0' + m : m} ${ap}`;
                                      };
                                      return `${fmt(start)} - ${fmt(end)}`;
                                    })()}
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => openSlotCreator(staff.id, hour)}
                                  className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 bg-blue-50/20 dark:bg-blue-950/10 flex items-center justify-center transition-opacity"
                                >
                                  <Plus className="h-3 w-3 text-muted-foreground" />
                                </button>
                              )}
                            </td>
                          );
                        });
                      })() : (
                        weekdays.map((day, i) => {
                          const targetDay = new Date(timelineDate)
                          targetDay.setDate(timelineDate.getDate() - timelineDate.getDay() + i)
                          
                          // Find tasks on this weekday
                          const matchedList = tasks.filter(t => t.startTime && new Date(t.startTime).toDateString() === targetDay.toDateString())

                          return (
                            <td key={day} className="p-2 border-r border-slate-100 dark:border-slate-850 min-w-[100px] h-16 relative">
                              <div className="space-y-1">
                                {matchedList.map(task => (
                                  <div 
                                    key={task.id}
                                    onClick={() => fetchTaskDetails(task.id)}
                                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-[9px] truncate font-medium cursor-pointer border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                  >
                                    {task.title}
                                  </div>
                                ))}
                              </div>
                              <button 
                                onClick={() => openSlotCreator(staff.id, undefined, i)}
                                className="absolute bottom-1 right-1 opacity-0 hover:opacity-100 bg-slate-150 rounded p-0.5 transition-opacity"
                              >
                                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </td>
                          )
                        })
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* List and Grid Views */}
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
              <div className="lg:col-span-2 space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Loading operations...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed">
                    <CalendarIcon className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-muted-foreground">No tasks found</h3>
                    <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search criteria</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredTasks.map(task => (
                      <div 
                        key={task.id}
                        onClick={() => fetchTaskDetails(task.id)}
                        className={`group relative overflow-hidden p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                          selectedTask?.id === task.id ? "ring-2 ring-primary border-transparent" : "hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${
                              task.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 
                              task.priority === 'HIGH' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              <Timer className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{task.title}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {task.startTime ? new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD"}
                                      {task.duration && ` • ${task.duration}m`}
                                  </div>
                                  {getStatusBadge(task.status)}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{task.priority}</Badge>
                        </div>

                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                  <AvatarFallback className="rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] flex items-center justify-center font-bold">
                                      {task.assignedTo?.name?.charAt(0) || '?'}
                                  </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">{task.assignedTo?.name || "Unassigned"}</span>
                          </div>
                          {task.customer && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>{task.customer.customerUniqueId}</span>
                              </div>
                          )}
                          {task.customer?.lead?.address && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate max-w-[200px]">
                                  <MapPin className="h-3 w-3" />
                                  <span>{task.customer.lead.address}</span>
                              </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail side panel */}
              <div className="relative">
                <div className="sticky top-6">
                  {selectedTask ? (
                    <div className="overflow-hidden rounded-3xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl space-y-6 pb-6">
                      <div className="bg-primary p-6 text-primary-foreground">
                          <div className="flex justify-between items-start mb-4">
                              <Badge variant="outline" className="text-white border-white/20 bg-white/10">{selectedTask.priority} PRIORITY</Badge>
                              <div className="bg-white/10 p-2 rounded-lg"><LayoutGrid className="h-5 w-5" /></div>
                          </div>
                          <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
                          <p className="text-white/70 text-sm mt-2">{selectedTask.description || "Field operation task assigned to staff."}</p>
                      </div>

                      {/* Conflict overlap Warning Display */}
                      {selectedTask.warning && (
                        <div className="mx-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-xs flex gap-2.5 items-start">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                          <div>
                            <span className="font-semibold block mb-0.5">Scheduling Conflict Warning</span>
                            {selectedTask.warning}
                          </div>
                        </div>
                      )}

                      <div className="px-6 space-y-6">
                          {/* Time Slots */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-muted/30 rounded-2xl">
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Scheduled Date</p>
                                  <p className="text-sm font-semibold flex items-center gap-2">
                                      <CalendarIcon className="h-4 w-4 text-primary" />
                                      {selectedTask.startTime ? new Date(selectedTask.startTime).toLocaleDateString() : "Flexible"}
                                  </p>
                              </div>
                              <div className="p-4 bg-muted/30 rounded-2xl">
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Time Slot</p>
                                  <p className="text-sm font-semibold flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-primary" />
                                      {selectedTask.startTime ? new Date(selectedTask.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Anytime"}
                                  </p>
                              </div>
                          </div>

                          {/* Customer Info */}
                          {selectedTask.customer && (
                              <div className="space-y-3">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact Information</h4>
                                  <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                          <div className="p-2 bg-slate-105 dark:bg-slate-800 rounded-lg"><User className="h-4 w-4" /></div>
                                          <div>
                                              <p className="text-sm font-semibold">{selectedTask.customer.lead?.firstName} {selectedTask.customer.lead?.lastName}</p>
                                              <p className="text-[10px] text-muted-foreground">Customer ID: {selectedTask.customer.customerUniqueId}</p>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <div className="p-2 bg-slate-105 dark:bg-slate-800 rounded-lg"><Phone className="h-4 w-4" /></div>
                                          <p className="text-sm font-medium">{selectedTask.customer.lead?.phoneNumber || "+977-XXXXXXXXXX"}</p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <div className="p-2 bg-slate-105 dark:bg-slate-800 rounded-lg"><MapPin className="h-4 w-4" /></div>
                                          <p className="text-sm font-medium">{selectedTask.customer.lead?.address || "Location not provided"}</p>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {/* Technician Actions */}
                          <div className="space-y-3 border-t pt-4 border-slate-100 dark:border-slate-800">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">GPS Validation Actions</h4>
                              <div className="grid grid-cols-2 gap-3">
                                  <Button 
                                      variant="outline" 
                                      className="rounded-xl border-blue-100 bg-blue-50/30 text-blue-600 hover:bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400"
                                      onClick={() => handleStatusUpdate(selectedTask.id, "IN_PROGRESS")}
                                      disabled={selectedTask.status === "IN_PROGRESS" || selectedTask.status === "COMPLETED" || selectedTask.status === "CANCELLED" || (!isGlobalAdmin && selectedTask.assignedTo?.id !== user?.id && !hasPermission("tasks_manage"))}
                                  >
                                      Start Job (GPS)
                                  </Button>
                                  <Button 
                                      variant="outline" 
                                      className="rounded-xl border-emerald-100 bg-emerald-50/30 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400"
                                      onClick={() => handleStatusUpdate(selectedTask.id, "COMPLETED")}
                                      disabled={selectedTask.status === "COMPLETED" || selectedTask.status === "CANCELLED" || (!isGlobalAdmin && selectedTask.assignedTo?.id !== user?.id && !hasPermission("tasks_manage"))}
                                  >
                                      Complete (GPS)
                                  </Button>
                              </div>
                              <Button 
                                variant="ghost" 
                                className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-xs" 
                                onClick={() => handleStatusUpdate(selectedTask.id, "CANCELLED")}
                                disabled={selectedTask.status === "CANCELLED" || (!isGlobalAdmin && selectedTask.assignedTo?.id !== user?.id && !hasPermission("tasks_manage"))}
                              >
                                Cancel Task
                              </Button>
                          </div>

                          {/* Activity Logs Timeline */}
                          {selectedTask.activityLogs && selectedTask.activityLogs.length > 0 && (
                            <div className="space-y-3 border-t pt-4 border-slate-100 dark:border-slate-800">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <UserCheck className="h-3.5 w-3.5 text-primary" />
                                <span>Activity Audit Trail</span>
                              </h4>
                              <div className="space-y-4 pl-2 border-l border-slate-100 dark:border-slate-800 relative">
                                {selectedTask.activityLogs.map(log => (
                                  <div key={log.id} className="relative text-xs">
                                    {/* timeline marker */}
                                    <div className="absolute -left-[14px] top-1 h-2 w-2 rounded-full bg-primary ring-4 ring-white dark:ring-slate-900"></div>
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between items-center">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{log.action}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                      <p className="text-muted-foreground text-[11px]">{log.notes || `Status changed to ${log.action}`}</p>
                                      <div className="text-[10px] flex items-center gap-2 text-slate-500">
                                        <span>By: {log.user?.name || "System"}</span>
                                        {log.lat && log.lon && (
                                          <span className="flex items-center gap-0.5 text-primary">
                                            <MapPin className="h-3 w-3" />
                                            <span>{Number(log.lat).toFixed(4)}, {Number(log.lon).toFixed(4)}</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 h-[600px]">
                      <div className="p-6 bg-slate-55 dark:bg-slate-800 rounded-full mb-6">
                          <ListIcon className="h-12 w-12 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold">Operation Details</h3>
                      <p className="text-muted-foreground text-sm mt-2 max-w-[200px]">Select an active job from the list to view full details and manage status</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Today and Pending Tabs render just like the All view, but filtered */}
          <TabsContent value="today" className="mt-0">
            {/* Renders identical content container, scoped by useMemo filteredTasks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
              {/* Reuse list content for today */}
              <div className="lg:col-span-2 space-y-4">
                {filteredTasks.map(task => (
                  <div key={task.id} onClick={() => fetchTaskDetails(task.id)} className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 shadow-sm hover:shadow-md cursor-pointer ${selectedTask?.id === task.id ? "ring-2 ring-primary" : ""}`}>
                    <h3 className="font-bold text-lg">{task.title}</h3>
                    <p className="text-xs text-muted-foreground">{task.startTime ? new Date(task.startTime).toLocaleString() : "Flexible"}</p>
                    <div className="mt-3 flex gap-2">{getStatusBadge(task.status)}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="pending" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
              <div className="lg:col-span-2 space-y-4">
                {filteredTasks.map(task => (
                  <div key={task.id} onClick={() => fetchTaskDetails(task.id)} className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 shadow-sm hover:shadow-md cursor-pointer ${selectedTask?.id === task.id ? "ring-2 ring-primary" : ""}`}>
                    <h3 className="font-bold text-lg">{task.title}</h3>
                    <p className="text-xs text-muted-foreground">{task.startTime ? new Date(task.startTime).toLocaleString() : "Flexible"}</p>
                    <div className="mt-3 flex gap-2">{getStatusBadge(task.status)}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
