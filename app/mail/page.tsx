"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, FileText, Inbox, Loader2, Mail, Paperclip, Plus, RefreshCw, Search, Send, UserPlus, X } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiRequest } from "@/lib/api"
import { getDynamicBaseUrl } from "@/lib/api"
import { toast } from "react-hot-toast"

type RecipientType = "all" | "user" | "customer" | "lead"

type Recipient = {
  type: "user" | "lead" | "customer" | "manual"
  id: number | string
  name: string
  email: string
}

type RecipientGroups = {
  users: Recipient[]
  leads: Recipient[]
  customers: Recipient[]
}

type MailAttachment = {
  id: number | string
  filename: string
  contentType?: string
  size?: number
}

type MailRow = {
  id: number | string
  fromEmail?: string
  toEmails?: string
  subject?: string
  body?: string
  isRead?: boolean
  createdAt?: string
  attachments?: MailAttachment[]
}

const FALLBACK_EMAIL_TEMPLATES = [
  {
    id: "new_connection_customer",
    label: "New Connection - Customer",
    subject: "Welcome to Kisan Net",
    message: "Dear Customer,\n\nYour new internet connection request has been received successfully. Our team will contact you shortly for installation and activation.\n\nThank you,\nKisan Net"
  },
  {
    id: "support_ticket_customer",
    label: "Support Ticket - Customer",
    subject: "Support Ticket Created",
    message: "Dear Customer,\n\nYour support ticket has been created successfully. Our support team will review it and contact you soon.\n\nThank you,\nKisan Net Support"
  },
  {
    id: "support_ticket_user",
    label: "Support Ticket - Assigned User",
    subject: "Support Ticket Assigned",
    message: "Hello,\n\nA support ticket has been assigned to you. Please review the customer issue and update the ticket after action is taken.\n\nThank you."
  },
  {
    id: "task_assigned_user",
    label: "Task Assigned - User",
    subject: "New Task Assigned",
    message: "Hello,\n\nA new task has been assigned to you. Please check your task dashboard for details and update the status as work progresses.\n\nThank you."
  },
  {
    id: "lead_followup",
    label: "Lead Follow-up",
    subject: "Following Up On Your Internet Inquiry",
    message: "Dear Customer,\n\nThank you for your interest in our internet service. We are following up regarding your inquiry and would be happy to help you choose the right package.\n\nThank you,\nKisan Net"
  },
  {
    id: "payment_reminder",
    label: "Payment Reminder",
    subject: "Payment Reminder",
    message: "Dear Customer,\n\nThis is a friendly reminder that your internet service payment is due. Please complete payment to continue uninterrupted service.\n\nThank you,\nKisan Net"
  }
]

export default function MailPage() {
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox")
  const [composeOpen, setComposeOpen] = useState(false)
  const [groups, setGroups] = useState<RecipientGroups>({ users: [], leads: [], customers: [] })
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([])
  const [recipientType, setRecipientType] = useState<RecipientType>("all")
  const [recipientSearch, setRecipientSearch] = useState("")
  const [manualEmail, setManualEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [composeTemplates, setComposeTemplates] = useState(FALLBACK_EMAIL_TEMPLATES)
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [sending, setSending] = useState(false)
  const [inbox, setInbox] = useState<MailRow[]>([])
  const [sent, setSent] = useState<MailRow[]>([])
  const [selectedInboxId, setSelectedInboxId] = useState<number | string | null>(null)
  const [selectedSentId, setSelectedSentId] = useState<number | string | null>(null)
  const [mailSearch, setMailSearch] = useState("")
  const [loadingMail, setLoadingMail] = useState(false)
  const [refreshingFolder, setRefreshingFolder] = useState<"inbox" | "sent" | null>(null)
  const [inboxMessage, setInboxMessage] = useState("")

  const selectedKeys = useMemo(() => new Set(selectedRecipients.map(item => `${item.type}:${item.id}`)), [selectedRecipients])

  const filteredInbox = useMemo(() => filterMail(inbox, mailSearch), [inbox, mailSearch])
  const filteredSent = useMemo(() => filterMail(sent, mailSearch), [sent, mailSearch])
  const selectedInbox = filteredInbox.find(row => row.id === selectedInboxId) || filteredInbox[0] || null
  const selectedSent = filteredSent.find(row => row.id === selectedSentId) || filteredSent[0] || null

  function filterMail(rows: MailRow[], query: string) {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(row =>
      [row.subject, row.fromEmail, row.toEmails, row.body]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(q))
    )
  }

  const formatBytes = (size?: number) => {
    if (!size && size !== 0) return ""
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const downloadAttachment = (mailId: number | string, attachment: MailAttachment) => {
    const url = `${getDynamicBaseUrl()}/mail/inbox/${mailId}/attachments/${attachment.id}`
    window.open(url, "_blank")
  }

  const applyTemplate = (id: string) => {
    setTemplateId(id)
    const template = composeTemplates.find(item => item.id === id)
    if (!template) return
    setSubject(template.subject)
    setMessage(template.message)
  }

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const rows = await apiRequest<any[]>("/templates?channel=EMAIL", { suppressToast: true })
        const templates = Array.isArray(rows)
          ? rows.filter(row => row.isActive !== false && row.isActive !== 0).map(row => ({
              id: String(row.id),
              label: row.name,
              subject: row.subject || "",
              message: row.body || ""
            }))
          : []
        if (templates.length) setComposeTemplates(templates)
      } catch {
        setComposeTemplates(FALLBACK_EMAIL_TEMPLATES)
      }
    }
    loadTemplates()
  }, [])

  const fetchRecipients = async () => {
    if (!recipientSearch.trim()) {
      setGroups({ users: [], leads: [], customers: [] })
      toast.error("Enter a search term first")
      return
    }
    try {
      setLoadingRecipients(true)
      const query = `?type=${recipientType}&search=${encodeURIComponent(recipientSearch.trim())}`
      const data = await apiRequest<RecipientGroups>(`/mail/recipients${query}`)
      setGroups({ users: data.users || [], leads: data.leads || [], customers: data.customers || [] })
    } catch (error: any) {
      toast.error(error.message || "Failed to load recipients")
    } finally {
      setLoadingRecipients(false)
    }
  }

  const fetchMailbox = async (folder: "inbox" | "sent") => {
    try {
      setLoadingMail(true)
      if (folder === "inbox") {
        const data = await apiRequest<{ configured?: boolean; data?: MailRow[]; message?: string } | MailRow[]>("/mail/inbox")
        const rows = Array.isArray(data) ? data : data.data || []
        setInbox(rows)
        setSelectedInboxId(rows[0]?.id || null)
        setInboxMessage(Array.isArray(data) ? "" : data.message || "")
      } else {
        const rows = await apiRequest<MailRow[]>("/mail/sent")
        const safeRows = Array.isArray(rows) ? rows : []
        setSent(safeRows)
        setSelectedSentId(safeRows[0]?.id || null)
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to load ${folder}`)
    } finally {
      setLoadingMail(false)
    }
  }

  const refreshMailbox = async (folder: "inbox" | "sent") => {
    if (folder === "sent") {
      try {
        setRefreshingFolder("sent")
        const rows = await apiRequest<MailRow[]>("/mail/sent")
        const safeRows = Array.isArray(rows) ? rows : []
        setSent(safeRows)
        setSelectedSentId(prev => safeRows.some(row => row.id === prev) ? prev : safeRows[0]?.id || null)
      } catch (error: any) {
        toast.error(error.message || "Failed to refresh sent mail")
      } finally {
        setRefreshingFolder(null)
      }
      return
    }
    try {
      setRefreshingFolder("inbox")
      const data = await apiRequest<{ configured?: boolean; synced?: number; data?: MailRow[]; message?: string }>("/mail/inbox/refresh", {
        method: "POST"
      })
      const rows = data.data || []
      setInbox(rows)
      setSelectedInboxId(prev => rows.some(row => row.id === prev) ? prev : rows[0]?.id || null)
      setInboxMessage(data.message || "")
      if (data.configured === false) {
        toast.error(data.message || "IMAP is not configured")
      } else {
        toast.success(`Inbox synced${typeof data.synced === "number" ? `: ${data.synced} new` : ""}`)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to refresh inbox")
    } finally {
      setRefreshingFolder(null)
    }
  }

  useEffect(() => {
    if (activeTab === "inbox") fetchMailbox("inbox")
    if (activeTab === "sent") fetchMailbox("sent")
  }, [activeTab])

  const toggleRecipient = (recipient: Recipient) => {
    const key = `${recipient.type}:${recipient.id}`
    setSelectedRecipients(prev => selectedKeys.has(key) ? prev.filter(item => `${item.type}:${item.id}` !== key) : [...prev, recipient])
  }

  const addManualEmail = () => {
    const email = manualEmail.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address")
      return
    }
    const recipient: Recipient = { type: "manual", id: email, name: email, email }
    if (!selectedKeys.has(`manual:${email}`)) setSelectedRecipients(prev => [...prev, recipient])
    setManualEmail("")
  }

  const sendMail = async () => {
    if (selectedRecipients.length === 0) {
      toast.error("Select or enter at least one recipient")
      return
    }
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required")
      return
    }
    try {
      setSending(true)
      const result = await apiRequest<{ sent: number; failed: number }>("/mail/send", {
        method: "POST",
        body: JSON.stringify({ recipients: selectedRecipients, subject, message })
      })
      if (result.sent > 0) {
        toast.success(`Sent ${result.sent} email${result.sent === 1 ? "" : "s"}`)
        setSubject("")
        setMessage("")
        setSelectedRecipients([])
        setComposeOpen(false)
        if (activeTab === "sent") {
          await fetchMailbox("sent")
        } else {
          setActiveTab("sent")
        }
      } else {
        toast.error("No emails were sent. Check SMTP settings.")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send mail")
    } finally {
      setSending(false)
    }
  }

  const renderGroup = (title: string, items: Recipient[]) => (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{title}</div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground border rounded-md p-3">No results</div>
      ) : items.map(item => {
        const key = `${item.type}:${item.id}`
        const checked = selectedKeys.has(key)
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggleRecipient(item)}
            className={`w-full text-left rounded-md border p-3 transition-colors ${checked ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{item.name}</div>
                <div className="text-xs text-muted-foreground truncate">{item.email}</div>
              </div>
              <Badge variant={checked ? "default" : "outline"}>{checked ? "Selected" : item.type}</Badge>
            </div>
          </button>
        )
      })}
    </div>
  )

  const renderMailbox = (folder: "inbox" | "sent") => {
    const rows = folder === "inbox" ? filteredInbox : filteredSent
    const selectedMail = folder === "inbox" ? selectedInbox : selectedSent
    const selectMail = folder === "inbox" ? setSelectedInboxId : setSelectedSentId
    const isRefreshing = refreshingFolder === folder

    return (
      <CardContainer title={folder === "inbox" ? "Inbox" : "Sent Mail"} description={folder === "inbox" ? "Incoming mailbox from IMAP" : "Outgoing emails sent from webmail"}>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" value={mailSearch} onChange={e => setMailSearch(e.target.value)} placeholder={`Search ${folder} mail`} />
            </div>
            <Button variant="outline" size="sm" onClick={() => refreshMailbox(folder)} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {isRefreshing ? "Syncing" : "Refresh"}
            </Button>
          </div>

          {inboxMessage && folder === "inbox" && (
            <div className="rounded-md border p-3 text-sm text-muted-foreground">{inboxMessage}</div>
          )}

          {loadingMail && rows.length === 0 ? (
            <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <div className="rounded-md border p-10 text-center text-sm text-muted-foreground">No mail found</div>
          ) : (
            <div className="grid h-[62vh] overflow-hidden rounded-md border lg:grid-cols-[360px_1fr]">
              <div className="h-full border-r bg-muted/20 overflow-auto">
                {rows.map(row => {
                  const isActive = selectedMail?.id === row.id
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => selectMail(row.id)}
                      className={`w-full border-b p-4 text-left transition-colors ${isActive ? "bg-background" : "hover:bg-background/70"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`truncate text-sm ${row.isRead === false && folder === "inbox" ? "font-bold" : "font-semibold"}`}>
                            {row.subject || "(no subject)"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {folder === "inbox" ? row.fromEmail || "-" : row.toEmails || "-"}
                          </div>
                        </div>
                        {!!row.attachments?.length && <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </div>
                      {row.body && <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{row.body}</div>}
                      <div className="mt-2 text-[11px] text-muted-foreground">{row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}</div>
                    </button>
                  )
                })}
              </div>

              <div className="flex h-[62vh] min-h-0 flex-col bg-background">
                {selectedMail ? (
                  <>
                    <div className="border-b p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h2 className="text-xl font-semibold">{selectedMail.subject || "(no subject)"}</h2>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <div>{folder === "inbox" ? "From" : "To"}: {folder === "inbox" ? selectedMail.fromEmail || "-" : selectedMail.toEmails || "-"}</div>
                            {folder === "inbox" && <div>To: {selectedMail.toEmails || "-"}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {selectedMail.createdAt ? new Date(selectedMail.createdAt).toLocaleString() : ""}
                        </div>
                      </div>
                    </div>

                    {!!selectedMail.attachments?.length && (
                      <div className="border-b p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                          <Paperclip className="h-4 w-4" />
                          Attachments
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedMail.attachments.map(attachment => (
                            <button
                              key={attachment.id}
                              type="button"
                              onClick={() => downloadAttachment(selectedMail.id, attachment)}
                              className="flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
                            >
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>{attachment.filename}</span>
                              <span className="text-xs text-muted-foreground">{formatBytes(attachment.size)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="min-h-0 flex-1 overflow-y-auto p-5">
                      <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-foreground">
                        {selectedMail.body || "No message body available."}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Select an email to view details</div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContainer>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="h-6 w-6" /> Webmail</h1>
            <p className="text-sm text-muted-foreground">Mail inbox, sent mail, and compose are separate from internal chat messages.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={activeTab === "inbox" ? "default" : "outline"} onClick={() => setActiveTab("inbox")}><Inbox className="h-4 w-4 mr-2" /> Inbox</Button>
            <Button variant={activeTab === "sent" ? "default" : "outline"} onClick={() => setActiveTab("sent")}><Send className="h-4 w-4 mr-2" /> Sent</Button>
          </div>
        </div>

        {activeTab === "inbox" && renderMailbox("inbox")}
        {activeTab === "sent" && renderMailbox("sent")}

        <Button
          className="fixed bottom-6 right-6 z-40 h-14 rounded-full px-5 shadow-lg"
          onClick={() => setComposeOpen(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Compose
        </Button>

        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Compose Mail</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 overflow-y-auto pr-1 lg:grid-cols-[390px_1fr]" style={{ maxHeight: "calc(90vh - 90px)" }}>
            <CardContainer title="Recipients" description="Choose users, customers, leads, or enter emails manually">
              <div className="space-y-4">
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={recipientType}
                    onChange={e => setRecipientType(e.target.value as RecipientType)}
                  >
                    <option value="all">All</option>
                    <option value="user">Users</option>
                    <option value="customer">Customers</option>
                    <option value="lead">Leads</option>
                  </select>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" value={recipientSearch} onChange={e => setRecipientSearch(e.target.value)} placeholder="Search name or email" onKeyDown={e => e.key === "Enter" && fetchRecipients()} />
                    </div>
                    <Button variant="outline" onClick={fetchRecipients} disabled={loadingRecipients}>
                      {loadingRecipients ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="Manual email address" onKeyDown={e => e.key === "Enter" && addManualEmail()} />
                  <Button variant="outline" onClick={addManualEmail}><UserPlus className="h-4 w-4" /></Button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Selected</div>
                  <div className="flex min-h-10 flex-wrap gap-2 rounded-md border p-2">
                    {selectedRecipients.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No recipients selected</span>
                    ) : selectedRecipients.map(item => (
                      <Badge key={`${item.type}:${item.id}`} variant="secondary" className="gap-2">
                        {item.name}
                        <button type="button" onClick={() => toggleRecipient(item)} className="text-muted-foreground hover:text-foreground">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-5 max-h-[46vh] overflow-auto pr-1">
                  {renderGroup("Users", groups.users)}
                  {renderGroup("Leads", groups.leads)}
                  {renderGroup("Customers", groups.customers)}
                </div>
              </div>
            </CardContainer>

            <CardContainer title="Compose" description="Write and send outgoing email">
              <div className="space-y-4">
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={templateId}
                  onChange={e => applyTemplate(e.target.value)}
                >
                  <option value="">Select predefined email template</option>
                  {composeTemplates.map(template => (
                    <option key={template.id} value={template.id}>{template.label}</option>
                  ))}
                </select>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message..." rows={16} />
                <div className="flex justify-end">
                  <Button onClick={sendMail} disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Mail
                  </Button>
                </div>
              </div>
            </CardContainer>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
