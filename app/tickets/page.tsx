"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CardContainer } from "@/components/ui/card-container"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { apiRequest } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  MessageSquare,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Send,
  Mail,
  Building,
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
import { Checkbox } from "@/components/ui/checkbox"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { useBranch } from "@/contexts/BranchContext"
import { useAuth } from "@/contexts/AuthContext"
import { useWebSocket } from "@/contexts/WebSocketContext"

interface Ticket {
  id: number
  ticketNumber: string
  title: string
  description?: string
  status: string
  priority: string
  category?: string
  createdAt: string
  updatedAt: string
  customer?: { id: number; firstName: string; lastName: string; email: string }
  subject?: { 
    type: 'CUSTOMER' | 'LEAD'; 
    id: number; 
    uniqueId: string; 
    firstName: string; 
    lastName: string; 
    email: string;
    phoneNumber?: string;
  }
  assignedTo?: { id: number; name: string; email: string }
  createdBy?: { id: number; name: string; email: string  }
  branch?: { id: number; name: string }
  _count?: { comments: number }
  comments?: any[]
  resolution?: string
}

function TicketsContent() {
  const searchParams = useSearchParams()
  const { branches, selectedBranchId } = useBranch()
  const { hasPermission } = useAuth()
  const { on } = useWebSocket()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")

  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newPriority, setNewPriority] = useState("MEDIUM")
  const [newCategory, setNewCategory] = useState("")
  const [newBranchId, setNewBranchId] = useState<string>("none")
  const [notifyEmail, setNotifyEmail] = useState(true)
  
  const [subjectType, setSubjectType] = useState<"CUSTOMER" | "LEAD" | "NONE">("NONE")
  const [subjectId, setSubjectId] = useState<string>("none")
  const [customers, setCustomers] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [assignableUsers, setAssignableUsers] = useState<any[]>([])
  const [assignedToId, setAssignedToId] = useState<string>("none")
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreate(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (showCreate) {
      const fetchSubjects = async () => {
        setLoadingSubjects(true)
        try {
          const [custRes, leadRes] = await Promise.all([
            apiRequest<any>("/customer?limit=100"),
            apiRequest<any>("/lead?limit=100")
          ])
          setCustomers(custRes?.data || [])
          setLeads(leadRes?.data || [])
        } catch (e) {
          console.error("Failed to fetch subjects", e)
        } finally {
          setLoadingSubjects(false)
        }
      }
      fetchSubjects()
    }
  }, [showCreate])

  useEffect(() => {
    if (!showCreate) return
    const fetchUsers = async () => {
      try {
        const users = await apiRequest<any[]>("/users")
        const branchId = newBranchId !== "none" ? Number(newBranchId) : selectedBranchId
        setAssignableUsers((users || []).filter((user: any) => {
          const roleName = String(user.role?.name || "").toLowerCase()
          if (roleName === "customer") return false
          if (!branchId) return true
          return user.branchId === branchId || user.branch?.id === branchId || user.userBranches?.some((ub: any) => ub.branch?.id === branchId)
        }))
      } catch (error) {
        console.error("Failed to fetch assignable users", error)
        setAssignableUsers([])
      }
    }
    fetchUsers()
  }, [showCreate, newBranchId, selectedBranchId])

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (priorityFilter !== "all") params.set("priority", priorityFilter)

      const res = await apiRequest<any>(`/tickets?${params.toString()}`)
      setTickets(res?.data || [])
      setTotalPages(res?.pagination?.totalPages || 1)
      setTotal(res?.pagination?.total || 0)
    } catch (error: any) {
      console.error(error)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, priorityFilter])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    return on("data.updated", (event: any) => {
      if (event?.entity !== "ticket_comment" || event?.action !== "created") return
      const ticketId = Number(event.ticketId)
      setTickets(current => current.map(ticket => ticket.id === ticketId
        ? { ...ticket, _count: { comments: (ticket._count?.comments || 0) + 1 } }
        : ticket))
      apiRequest<Ticket>(`/tickets/${ticketId}`).then(detail => {
        setSelectedTicket(current => current?.id === ticketId ? detail : current)
      }).catch(() => undefined)
    })
  }, [on])

  const subjectHref = (subject: Ticket["subject"]) => {
    if (!subject) return "#"
    return subject.type === "CUSTOMER" ? `/customers/${subject.id}` : `/leads/${subject.id}`
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setSubmitting(true)
    try {
      await apiRequest("/tickets", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          priority: newPriority,
          category: newCategory || undefined,
          customerId: subjectType === "CUSTOMER" && subjectId !== "none" ? Number(subjectId) : undefined,
          leadId: subjectType === "LEAD" && subjectId !== "none" ? Number(subjectId) : undefined,
          targetBranchId: newBranchId !== "none" ? newBranchId : undefined,
          assignedToId: assignedToId !== "none" ? Number(assignedToId) : undefined,
          notifyEmail,
        }),
      })
      toast({ title: "Success", description: "Ticket created" })
      setShowCreate(false)
      setNewTitle("")
      setNewDescription("")
      setNewPriority("MEDIUM")
      setNewCategory("")
      setNewBranchId("none")
      setAssignedToId("none")
      setSubjectType("NONE")
      setSubjectId("none")
      setNotifyEmail(false)
      fetchTickets()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const selectTicket = async (ticket: Ticket) => {
    try {
      const detail = await apiRequest<Ticket>(`/tickets/${ticket.id}`)
      setSelectedTicket(detail)
    } catch (e) {
      setSelectedTicket(ticket)
    }
  }

  const handleStatusChange = async (ticketId: number, status: string) => {
    try {
      await apiRequest(`/tickets/${ticketId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })
      toast({ title: "Status updated" })
      fetchTickets()
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null)
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return
    setSubmitting(true)
    try {
      await apiRequest(`/tickets/${selectedTicket.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newComment }),
      })
      setNewComment("")
      const detail = await apiRequest<Ticket>(`/tickets/${selectedTicket.id}`)
      if (detail) setSelectedTicket(detail)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-500"
      case "IN_PROGRESS": return "bg-amber-500"
      case "RESOLVED": return "bg-green-500"
      case "CLOSED": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "HIGH": return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "MEDIUM": return <Clock className="h-4 w-4 text-yellow-500" />
      case "LOW": return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default: return null
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy className="h-7 w-7 text-primary" />
            Support Tickets
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{total} total tickets</p>
        </div>
        {hasPermission("tickets_create") && (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm hover:shadow-md">
              <Plus className="h-4 w-4" /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>Create a new support ticket.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><MessageSquare className="w-4 h-4"/> Subject *</Label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Enter brief subject" />
              </div>
              <div className="space-y-2">
                <Label>Detailed Description</Label>
                <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Details..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="connectivity">Connectivity</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <SearchableSelect
                    options={[
                      { value: "none", label: "Unassigned" },
                      ...assignableUsers.map(user => ({ 
                        value: user.id.toString(), 
                        label: user.name || user.email 
                      }))
                    ]}
                    value={assignedToId}
                    onValueChange={setAssignedToId as (val: string | string[]) => void}
                    placeholder="Search staff..."
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject Type</Label>
                  <Select value={subjectType} onValueChange={(v: any) => { setSubjectType(v); setSubjectId("none"); }}>
                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">General (No Subject)</SelectItem>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="LEAD">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {subjectType !== "NONE" && (
                  <div className="space-y-2 col-span-2">
                    <Label>{subjectType === "CUSTOMER" ? "Select Customer" : "Select Lead"}</Label>
                    <SearchableSelect
                      options={subjectType === "CUSTOMER" 
                        ? customers.map(c => ({ value: c.id.toString(), label: `${c.firstName} ${c.lastName} (${c.customerUniqueId})` }))
                        : leads.map(l => ({ value: l.id.toString(), label: `${l.firstName} ${l.lastName} (Lead #${l.id})` }))
                      }
                      value={subjectId}
                      onValueChange={setSubjectId as (val: string | string[]) => void}
                      placeholder={loadingSubjects ? "Loading..." : "Search..."}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Building className="w-4 h-4"/> Target Branch</Label>
                  <Select value={newBranchId} onValueChange={setNewBranchId}>
                    <SelectTrigger><SelectValue placeholder="General / No branch" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General / No branch</SelectItem>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Checkbox id="notify" checked={notifyEmail} onCheckedChange={(c) => setNotifyEmail(c as boolean)} />
                <Label htmlFor="notify" className="flex items-center gap-1 cursor-pointer font-normal">
                  <Mail className="w-4 h-4 text-muted-foreground" /> Send Email Notification to Customer/Assignee
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={v => { setPriorityFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchTickets}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : tickets.length === 0 ? (
            <CardContainer title="" className="text-center py-12">
              <LifeBuoy className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No tickets found</p>
            </CardContainer>
          ) : (
            <>
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => selectTicket(ticket)}
                  className={`p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer ${
                    selectedTicket?.id === ticket.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(ticket.priority)}
                      <span className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</span>
                      <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                   <h3 className="font-medium mb-1">{ticket.title}</h3>
                   <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {ticket.subject && (
                      <Link href={subjectHref(ticket.subject)} onClick={event => event.stopPropagation()} className="flex items-center gap-1 font-medium text-primary hover:underline">
                        <Badge variant="outline" className="text-[10px] h-4 px-1">{ticket.subject.type}</Badge>
                        {ticket.subject.firstName} {ticket.subject.lastName}
                      </Link>
                    )}
                     {ticket.assignedTo && <span>→ {ticket.assignedTo.name}</span>}
                     {ticket._count && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{ticket._count.comments}</span>}
                   </div>
                </div>
              ))}
              {/* Pagination */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedTicket ? (
            <CardContainer title={`Ticket ${selectedTicket.ticketNumber}`} className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg">{selectedTicket.title}</h3>
                  {selectedTicket.description && <p className="text-sm text-muted-foreground mt-2">{selectedTicket.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Status:</div>
                  <div>
                    <Select value={selectedTicket.status} onValueChange={v => handleStatusChange(selectedTicket.id, v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="text-muted-foreground">Priority:</div>
                   <div className="flex items-center gap-1">{getPriorityIcon(selectedTicket.priority)} {selectedTicket.priority}</div>
                  {selectedTicket.subject && (
                     <>
                      <div className="text-muted-foreground">{selectedTicket.subject.type === 'CUSTOMER' ? 'Customer:' : 'Lead:'}</div>
                      <Link href={subjectHref(selectedTicket.subject)} className="block rounded p-1 -m-1 text-primary hover:bg-primary/5 hover:underline">
                        <p className="font-medium">{selectedTicket.subject.firstName} {selectedTicket.subject.lastName}</p>
                        <p className="text-[10px]">{selectedTicket.subject.uniqueId}</p>
                      </Link>
                     </>
                   )}
                  {selectedTicket.assignedTo && (
                    <>
                      <div className="text-muted-foreground">Assigned To:</div>
                      <div>{selectedTicket.assignedTo.name}</div>
                    </>
                  )}
                  <div className="text-muted-foreground">Created:</div>
                  <div>{new Date(selectedTicket.createdAt).toLocaleString()}</div>
                </div>

                {/* Comments */}
                <div className="border-t pt-3 space-y-3">
                  <h4 className="text-sm font-medium">Comments</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {selectedTicket.comments?.map(c => (
                      <div key={c.id} className="bg-white dark:bg-slate-800 p-2 rounded-lg border text-sm">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{c.user?.name}</span>
                          <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-muted-foreground">{c.content}</p>
                      </div>
                    ))}
                    {(!selectedTicket.comments || selectedTicket.comments.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-3">No comments yet</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add comment..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddComment()}
                      className="flex-1"
                    />
                    <Button size="icon" onClick={handleAddComment} disabled={submitting || !newComment.trim()}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContainer>
          ) : (
            <CardContainer title="" className="text-center py-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Select a ticket to view details</p>
            </CardContainer>
          )}
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading tickets...</div>}>
      <TicketsContent />
    </Suspense>
  )
}
