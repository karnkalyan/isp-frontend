"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, Loader2, Mail, MessageSquare, Plus, RotateCcw, Save, Search, Trash2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"

type Channel = "EMAIL" | "SMS"

type TemplateRow = {
  id?: number
  channel: Channel
  eventKey: string
  name: string
  subject?: string
  body: string
  isActive: boolean | number
  isDefault?: boolean | number
}

type EventMeta = {
  eventKey: string
  label: string
  variables: string[]
}

const emptyTemplate: TemplateRow = {
  channel: "EMAIL",
  eventKey: "customer_new_connection",
  name: "",
  subject: "",
  body: "",
  isActive: true
}

export default function MailTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [events, setEvents] = useState<EventMeta[]>([])
  const [selectedId, setSelectedId] = useState<number | "new">("new")
  const [draft, setDraft] = useState<TemplateRow>(emptyTemplate)
  const [channel, setChannel] = useState<Channel>("EMAIL")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return templates
      .filter(template => template.channel === channel)
      .filter(template => !q || [template.name, template.eventKey, template.subject, template.body].some(value => String(value || "").toLowerCase().includes(q)))
  }, [templates, channel, search])

  const activeEvent = events.find(event => event.eventKey === draft.eventKey)

  const loadData = async () => {
    try {
      setLoading(true)
      const [rows, meta] = await Promise.all([
        apiRequest<TemplateRow[]>("/templates"),
        apiRequest<{ events: EventMeta[] }>("/templates/meta")
      ])
      setTemplates(Array.isArray(rows) ? rows : [])
      setEvents(meta.events || [])
      if (selectedId !== "new") {
        const current = rows.find(row => row.id === selectedId)
        if (current) setDraft({ ...current, isActive: current.isActive !== false && current.isActive !== 0 })
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const startNew = (nextChannel = channel) => {
    setSelectedId("new")
    setChannel(nextChannel)
    setDraft({ ...emptyTemplate, channel: nextChannel })
  }

  const selectTemplate = (template: TemplateRow) => {
    setSelectedId(template.id || "new")
    setChannel(template.channel)
    setDraft({ ...template, isActive: template.isActive !== false && template.isActive !== 0 })
  }

  const duplicateTemplate = () => {
    setSelectedId("new")
    setDraft(prev => ({ ...prev, id: undefined, name: `${prev.name} Copy`, isDefault: false }))
  }

  const saveTemplate = async () => {
    if (!draft.name.trim() || !draft.eventKey.trim() || !draft.body.trim()) {
      toast.error("Name, event, and body are required")
      return
    }
    if (draft.channel === "EMAIL" && !String(draft.subject || "").trim()) {
      toast.error("Email subject is required")
      return
    }
    try {
      setSaving(true)
      const payload = { ...draft, isActive: Boolean(draft.isActive) }
      if (selectedId === "new") {
        await apiRequest("/templates", { method: "POST", body: JSON.stringify(payload) })
      } else {
        await apiRequest(`/templates/${selectedId}`, { method: "PUT", body: JSON.stringify(payload) })
      }
      toast.success("Template saved")
      await loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  const deleteTemplate = async () => {
    if (selectedId === "new" || draft.isDefault) return
    try {
      await apiRequest(`/templates/${selectedId}`, { method: "DELETE" })
      toast.success("Template deleted")
      startNew(channel)
      await loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template")
    }
  }

  const resetDefaults = async () => {
    try {
      await apiRequest("/templates/reset-defaults", { method: "POST" })
      toast.success("Default templates restored")
      await loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to restore defaults")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold"><Mail className="h-6 w-6" /> Mail & SMS Templates</h1>
            <p className="text-sm text-muted-foreground">Design reusable ISP messages for support, tasks, customers, leads, recharge, and subscription events.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetDefaults}><RotateCcw className="mr-2 h-4 w-4" /> Restore Defaults</Button>
            <Button onClick={() => startNew(channel)}><Plus className="mr-2 h-4 w-4" /> New Template</Button>
          </div>
        </div>

        <Tabs value={channel} onValueChange={value => startNew(value as Channel)}>
          <TabsList>
            <TabsTrigger value="EMAIL"><Mail className="mr-2 h-4 w-4" /> Email</TabsTrigger>
            <TabsTrigger value="SMS"><MessageSquare className="mr-2 h-4 w-4" /> SMS</TabsTrigger>
          </TabsList>

          <TabsContent value={channel}>
            <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
              <CardContainer title="Templates" description="Select an existing template to edit">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates" />
                  </div>
                  <div className="h-[64vh] overflow-y-auto rounded-md border">
                    {loading ? (
                      <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
                    ) : filtered.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">No templates found</div>
                    ) : filtered.map(template => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => selectTemplate(template)}
                        className={`w-full border-b p-4 text-left hover:bg-muted/60 ${selectedId === template.id ? "bg-muted" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{template.name}</div>
                            <div className="truncate text-xs text-muted-foreground">{template.eventKey}</div>
                          </div>
                          <div className="flex gap-1">
                            {template.isDefault ? <Badge variant="outline">Default</Badge> : null}
                            <Badge variant={template.isActive ? "default" : "secondary"}>{template.isActive ? "Active" : "Off"}</Badge>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContainer>

              <CardContainer title={selectedId === "new" ? "Create Template" : "Template Designer"} description="Use variables like {customerName}, {ticketNumber}, {packageName}, or {expiryDate}">
                <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Template Name</Label>
                        <Input value={draft.name} onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Recharge Success" />
                      </div>
                      <div className="space-y-2">
                        <Label>Event</Label>
                        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.eventKey} onChange={e => setDraft(prev => ({ ...prev, eventKey: e.target.value }))}>
                          {events.map(event => <option key={event.eventKey} value={event.eventKey}>{event.label} ({event.eventKey})</option>)}
                        </select>
                      </div>
                    </div>

                    {draft.channel === "EMAIL" && (
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input value={draft.subject || ""} onChange={e => setDraft(prev => ({ ...prev, subject: e.target.value }))} placeholder="Email subject" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>{draft.channel === "EMAIL" ? "Email Body" : "SMS Message"}</Label>
                      <Textarea className="min-h-[330px] font-mono text-sm" value={draft.body} onChange={e => setDraft(prev => ({ ...prev, body: e.target.value }))} placeholder="Write template content..." />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Switch checked={Boolean(draft.isActive)} onCheckedChange={checked => setDraft(prev => ({ ...prev, isActive: checked }))} />
                        <div>
                          <div className="text-sm font-medium">Active</div>
                          <div className="text-xs text-muted-foreground">Inactive templates are not used automatically.</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={duplicateTemplate} disabled={!draft.name}><Copy className="mr-2 h-4 w-4" /> Duplicate</Button>
                        <Button variant="outline" onClick={deleteTemplate} disabled={selectedId === "new" || Boolean(draft.isDefault)}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                        <Button onClick={saveTemplate} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save</Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-md border p-4">
                      <div className="mb-3 text-sm font-semibold">Available Variables</div>
                      <div className="flex flex-wrap gap-2">
                        {(activeEvent?.variables || ["customerName", "ticketNumber", "packageName", "expiryDate", "amount", "userName"]).map(variable => (
                          <button
                            key={variable}
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(`{${variable}}`)}
                            className="rounded-md border px-2 py-1 font-mono text-xs hover:bg-muted"
                          >
                            {`{${variable}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md border p-4">
                      <div className="mb-3 text-sm font-semibold">Preview</div>
                      {draft.channel === "EMAIL" && <div className="mb-3 rounded-md bg-muted p-3 text-sm font-medium">{draft.subject || "Subject preview"}</div>}
                      <div className="max-h-[360px] overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-sm leading-6">
                        {draft.body || "Template body preview"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContainer>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
