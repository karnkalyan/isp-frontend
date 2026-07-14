"use client"

import { useState, useEffect, useCallback } from "react"
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
  Megaphone,
  Plus,
  Loader2,
  Clock,
  Trash2,
  Edit,
  AlertCircle,
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

interface Notice {
  id: number
  title: string
  content: string
  priority: string
  isActive: boolean
  expiresAt?: string
  createdBy?: { id: number; name: string }
  branch?: { id: number; name: string }
  createdAt: string
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState("normal")
  const [expiresAt, setExpiresAt] = useState("")

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiRequest<any>("/notifications/notices?includeExpired=true")
      setNotices(res?.data || [])
    } catch (e) {
      setNotices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotices() }, [fetchNotices])

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      await apiRequest("/notifications/notices", {
        method: "POST",
        body: JSON.stringify({ title, content, priority, expiresAt: expiresAt || undefined }),
      })
      toast({ title: "Success", description: "Notice created" })
      setShowCreate(false)
      setTitle(""); setContent(""); setPriority("normal"); setExpiresAt("")
      fetchNotices()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this notice?")) return
    try {
      await apiRequest(`/notifications/notices/${id}`, { method: "DELETE" })
      toast({ title: "Notice deleted" })
      fetchNotices()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const toggleActive = async (notice: Notice) => {
    try {
      await apiRequest(`/notifications/notices/${notice.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !notice.isActive }),
      })
      fetchNotices()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "critical": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "normal": return "bg-blue-500"
      case "low": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary" />
            Notices
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage system-wide announcements and notices</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm hover:shadow-md">
              <Plus className="h-4 w-4" /> New Notice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Notice</DialogTitle>
              <DialogDescription>Create a system-wide notice or announcement.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notice title" />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Notice content..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expires At</Label>
                  <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Notice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : notices.length === 0 ? (
        <CardContainer title="" className="text-center py-16">
          <Megaphone className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No Notices</h3>
          <p className="text-sm text-muted-foreground">Create a notice to broadcast to all users.</p>
        </CardContainer>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map(notice => (
            <div key={notice.id} className={`p-5 rounded-xl border bg-card shadow-sm transition-all ${!notice.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(notice.priority)}>{notice.priority}</Badge>
                  {!notice.isActive && <Badge variant="secondary">Inactive</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(notice)}>
                    {notice.isActive ? <AlertCircle className="h-3.5 w-3.5" /> : <Megaphone className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(notice.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">{notice.title}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{notice.content}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(notice.createdAt).toLocaleDateString()}</span>
                {notice.createdBy && <span>by {notice.createdBy.name}</span>}
                {notice.expiresAt && <span>Expires: {new Date(notice.expiresAt).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
