"use client"

import { useEffect, useRef, useState } from "react"
import { Activity, Bot, CheckCircle2, ClipboardList, Clock3, PanelRightClose, Plus, RotateCcw, Send, ShieldCheck, Sparkles, StopCircle, Ticket, Wrench } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"
import { AgentAvatar } from "./agent-avatar"
import { AiAgentApprovalsAPI, AiAgentConversationsAPI, AiAgentsAPI, type AgentMessage } from "@/lib/api/ai-agent"

type Agent = any

export function AgentChat({ initialAgentId }: { initialAgentId?: string }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [agentId, setAgentId] = useState(initialAgentId || "auto")
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [conversationContext, setConversationContext] = useState<any>(null)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [contextOpen, setContextOpen] = useState(true)
  const [workingAgent, setWorkingAgent] = useState<Agent | null>(null)
  const [workOpen, setWorkOpen] = useState(false)
  const [workMode, setWorkMode] = useState<"task" | "ticket">("task")
  const [workAgentId, setWorkAgentId] = useState("")
  const [workTitle, setWorkTitle] = useState("")
  const [workDescription, setWorkDescription] = useState("")
  const [workPriority, setWorkPriority] = useState("MEDIUM")
  const [savingWork, setSavingWork] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const requestControllerRef = useRef<AbortController | null>(null)
  const agent = agents.find(a => String(a.id) === agentId) || agents.find(a => a.slug === "manager") || agents[0]
  const latestAssistant = [...messages].reverse().find(message => message.role === "assistant")
  const memoryState = (latestAssistant?.structuredData as any)?.memory
  const canViewDebug = /admin/i.test(String((latestAssistant?.structuredData as any)?.userRole || ""))

  const load = async () => {
    const [agentResponse, conversationResponse] = await Promise.all([AiAgentsAPI.list(), AiAgentConversationsAPI.list()])
    setAgents(agentResponse.data)
    setConversations(conversationResponse.data)
    if (initialAgentId) {
      const found = agentResponse.data.find((item: any) => String(item.id) === initialAgentId || item.slug === initialAgentId)
      if (found) setAgentId(String(found.id))
    }
    const rememberedId = Number(window.localStorage.getItem("kashtrix-ai-conversation-id") || 0)
    const remembered = conversationResponse.data.find((item: any) => item.id === rememberedId)
    if (remembered) await openConversation(remembered)
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, sending])
  useEffect(() => {
    if (!conversationId || !["AWAITING_APPROVAL", "APPROVED", "EXECUTING"].includes(conversationContext?.pendingAction?.status)) return
    const timer = window.setInterval(() => { AiAgentConversationsAPI.context(conversationId).then(result => setConversationContext(result.data)).catch(() => undefined) }, 3000)
    return () => window.clearInterval(timer)
  }, [conversationId, conversationContext?.pendingAction?.status])

  const openConversation = async (conversation: any) => {
    setConversationId(conversation.id)
    setAgentId(String(conversation.agentId))
    const [messageResult, contextResult] = await Promise.all([AiAgentConversationsAPI.messages(conversation.id), AiAgentConversationsAPI.context(conversation.id)])
    setMessages(messageResult.data)
    setConversationContext(contextResult.data)
    window.localStorage.setItem("kashtrix-ai-conversation-id", String(conversation.id))
  }

  const newConversation = () => {
    setConversationId(null)
    setMessages([])
    setConversationContext(null)
    setAgentId("auto")
    window.localStorage.removeItem("kashtrix-ai-conversation-id")
  }

  const send = async (override?: string) => {
    const content = (typeof override === "string" ? override : text).trim()
    if (!content || sending) return
    const optimistic: any = { id: -Date.now(), role: "user", senderType: "USER", content, createdAt: new Date().toISOString() }
    setMessages(current => [...current, optimistic])
    setText("")
    setSending(true)
    const controller = new AbortController()
    requestControllerRef.current = controller

    try {
      if (conversationId) {
        setWorkingAgent(agent || null)
      } else {
        const routedPreview = await AiAgentConversationsAPI.routeIntent(content, agentId === "auto" ? undefined : Number(agentId)).catch(() => null)
        if (routedPreview?.data?.agent) setWorkingAgent(routedPreview.data.agent)
      }
      let id = conversationId
      if (!id) {
        const created = await AiAgentConversationsAPI.create(agentId === "auto" ? undefined : Number(agentId), content.slice(0, 100), content)
        id = created.data.id
        setConversationId(id)
        window.localStorage.setItem("kashtrix-ai-conversation-id", String(id))
        const routed = (created.data as any).agent
        if (routed) setAgentId(String(routed.id))
      }

      const result = await AiAgentConversationsAPI.send(id, content, [], {
        chatId: String(id), conversationId: id, selectedAgentId: agentId === "auto" ? undefined : Number(agentId),
        parentMessageId: messages.length ? messages[messages.length - 1].id : undefined,
        currentRoute: window.location.pathname,
        selectedContext: { customerId: conversationContext?.selectedCustomerId, deviceId: conversationContext?.selectedDeviceId, ticketId: conversationContext?.selectedTicketId, nasId: conversationContext?.selectedNasId, pendingActionId: conversationContext?.pendingAction?.id }
      }, controller.signal)
      if ((result.data as any).agent?.id) setAgentId(String((result.data as any).agent.id))
      setMessages(current => [...current.filter(item => item.id !== optimistic.id), result.data.userMessage, result.data.assistant])
      if ((result.data as any).conversationState) setConversationContext((result.data as any).conversationState)
      else setConversationContext((await AiAgentConversationsAPI.context(id)).data)
      setConversations((await AiAgentConversationsAPI.list()).data)
    } catch (error: any) {
      if (error?.name === "AbortError") setMessages(current => current.filter(item => item.id !== optimistic.id))
      else setMessages(current => [...current, { ...optimistic, id: -Date.now() - 1, role: "assistant", senderType: "AGENT", content: `I'm sorry, I couldn't complete that just yet. ${error.message || "Please try again in a moment."}` }])
    } finally {
      setSending(false)
      setWorkingAgent(null)
      requestControllerRef.current = null
    }
  }

  const decideApproval = async (decision: "approve" | "reject") => {
    const approvalId = Number(conversationContext?.pendingAction?.approvalId || 0)
    if (!approvalId) return
    try {
      await AiAgentApprovalsAPI.decide(approvalId, decision)
      toast.success(decision === "approve" ? "Approval granted; execution is queued." : "Approval rejected.")
      if (conversationId) setConversationContext((await AiAgentConversationsAPI.context(conversationId)).data)
    } catch (error: any) { toast.error(error.message || "The approval could not be updated.") }
  }

  const openWork = (mode: "task" | "ticket") => {
    setWorkMode(mode)
    setWorkAgentId(String(agent?.id || agents.find(item => item.slug === "noc")?.id || ""))
    setWorkTitle(text.trim().slice(0, 120))
    setWorkDescription(text.trim())
    setWorkOpen(true)
  }

  const createWork = async () => {
    if (!workAgentId || !workTitle.trim()) return
    setSavingWork(true)
    try {
      const result = await AiAgentsAPI.createTask(workAgentId, {
        title: workTitle.trim(),
        description: workDescription.trim(),
        priority: workPriority,
        createTicket: workMode === "ticket",
      })
      toast.success(result.message || "Work assigned successfully")
      setWorkOpen(false)
      setWorkTitle("")
      setWorkDescription("")
    } catch (error: any) {
      toast.error(error.message ? `I couldn't assign that yet: ${error.message}` : "I couldn't assign that yet. Please try again.")
    } finally {
      setSavingWork(false)
    }
  }

  if (loading) {
    return <DashboardLayout><div className="flex h-full items-center justify-center">Loading conversations...</div></DashboardLayout>
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100dvh-56px)] overflow-hidden bg-background">
        <aside className="hidden w-72 shrink-0 flex-col border-r bg-card lg:flex">
          <div className="border-b p-4"><Button className="w-full justify-start" onClick={newConversation}><Plus />New conversation</Button></div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {conversations.length ? conversations.map(conversation => (
                <button key={conversation.id} onClick={() => openConversation(conversation)} className={`w-full rounded-xl p-3 text-left ${conversationId === conversation.id ? "bg-secondary" : "hover:bg-secondary/50"}`}>
                  <p className="truncate text-sm font-medium">{conversation.title}</p>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span className="truncate">{conversation.agent?.name || "AI Agent"}</span><span>{conversation.messageCount || 0} msgs</span></div>
                </button>
              )) : <p className="p-5 text-center text-sm text-muted-foreground">No conversations yet.</p>}
            </div>
          </ScrollArea>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
            <AgentAvatar icon={agent?.avatar} active={agent?.status === "ACTIVE"} />
            <div>
              <h1 className="text-sm font-semibold">{agentId === "auto" ? "Manager AI" : agent?.name || "AI Chat"}</h1>
              <p className="text-xs text-muted-foreground">{agentId === "auto" ? "Automatically selects the right specialist" : `${agent?.role} - ${agent?.department}`}</p>
            </div>
            {!conversationId && (
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger className="ml-auto w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Manager AI - Auto-route</SelectItem>
                  {agents.filter(a => a.slug !== "manager" && a.status === "ACTIVE").map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Badge variant="secondary" className={conversationId ? "ml-auto" : ""}>Live data</Badge>
            <Badge variant="outline" className="hidden gap-1.5 sm:flex"><Clock3 className="size-3" />Memory: 10 min</Badge>
            <Button variant="ghost" size="icon" onClick={() => setContextOpen(!contextOpen)}><PanelRightClose /></Button>
          </header>

          <ScrollArea className="flex-1">
            <div className="mx-auto max-w-3xl space-y-5 p-5 py-8">
              {!messages.length && (
                <div className="mx-auto max-w-lg py-20 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Bot /></div>
                  <h2 className="mt-4 text-xl font-semibold">What needs to get done?</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Ask about customers, invoices, tickets, OLTs, splitters, Radius sessions, inventory, revenue, or operational work.</p>
                </div>
              )}
              {messages.map((message, messageIndex) => (
                <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role !== "user" && <AgentAvatar icon={(message.structuredData as any)?.agent?.avatar || agent?.avatar} className="size-8" />}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "whitespace-pre-wrap rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm border bg-card shadow-sm"}`}>
                    {message.role !== "user" && (message.structuredData as any)?.agent?.name && (
                      <div className="mb-2 flex items-center gap-1.5 border-b pb-2 text-[11px] font-semibold text-primary"><Sparkles className="size-3" />{(message.structuredData as any).agent.name} handled this</div>
                    )}
                    {message.role !== "user" && (message.structuredData as any)?.memory?.reset && (
                      <div className="mb-2 text-[10px] text-muted-foreground">Previous context expired after 10 minutes of inactivity, so I started a fresh check.</div>
                    )}
                    {message.role === "user" ? message.content : <ChatMessageContent content={message.content} />}
                    {message.role !== "user" && Array.isArray((message.structuredData as any)?.performed) && (message.structuredData as any).performed.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
                        {(message.structuredData as any).performed.map((item: string) => <Badge key={item} variant="secondary"><CheckCircle2 className="mr-1 size-3" />{humanToolName(item)}</Badge>)}
                      </div>
                    )}
                    {message.role !== "user" && messageIndex === messages.length - 1 && !sending && (
                      <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-[11px] text-muted-foreground" onClick={() => { const previousUser = messages.slice(0, messageIndex).reverse().find(item => item.role === "user"); if (previousUser) send(previousUser.content) }}><RotateCcw className="size-3" />Retry safely</Button>
                    )}
                  </div>
                </div>
              ))}
              {conversationContext?.pendingAction && !["COMPLETED", "CANCELLED", "REJECTED", "EXPIRED"].includes(conversationContext.pendingAction.status) && (
                <PendingActionCard action={conversationContext.pendingAction} disabled={sending} onConfirm={() => send("yes")} onEdit={() => setText(`Create NAS ${conversationContext.pendingAction.displayArguments?.ipAddress || ""}`.trim())} onCancel={() => send("cancel")} onApprove={() => decideApproval("approve")} onReject={() => decideApproval("reject")} />
              )}
              {Array.isArray(conversationContext?.toolExecutions) && conversationContext.toolExecutions.slice(0, 3).map((execution: any) => <ToolProgress key={execution.id} execution={execution} />)}
              {sending && <div className="flex gap-3"><AgentAvatar icon={workingAgent?.avatar || agent?.avatar} className="size-8" /><div className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground"><Clock3 className="mr-2 inline size-4 animate-pulse" />{workingAgent?.name || agent?.name || "The right specialist"} is checking this now...</div></div>}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <div className="border-t bg-card p-4">
            <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => openWork("task")}><ClipboardList className="size-3.5" />Assign AI task</Button>
              <Button variant="outline" size="sm" onClick={() => openWork("ticket")}><Ticket className="size-3.5" />Create AI ticket</Button>
              <span className="ml-auto hidden text-[10px] text-muted-foreground sm:block">Context clears after 10 minutes idle{memoryState?.expiresAt ? "" : "."}</span>
            </div>
            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-background p-2">
              <textarea value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send() } }} className="min-h-11 max-h-32 flex-1 resize-none bg-transparent px-2 py-3 text-sm outline-none" placeholder="Ask about live operational data or request a task..." />
              {sending ? <Button size="icon" variant="destructive" onClick={() => requestControllerRef.current?.abort()} aria-label="Stop generation"><StopCircle /></Button> : <Button size="icon" onClick={() => send()} disabled={!text.trim()}><Send /></Button>}
            </div>
          </div>
        </main>

        {contextOpen && agent && (
          <aside className="hidden w-80 shrink-0 border-l bg-card xl:block">
            <ScrollArea className="h-full">
              <div className="space-y-6 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current agent</p>
                  <div className="mt-3 flex gap-3"><AgentAvatar icon={agent.avatar} active /><div><p className="text-sm font-semibold">{agent.name}</p><p className="text-xs text-muted-foreground">{agent.department}</p></div></div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conversation context</p>
                  <div className="mt-3 space-y-2 text-xs">
                    <ContextValue label="Active customer" value={conversationContext?.selectedCustomerId} />
                    <ContextValue label="Active device" value={conversationContext?.selectedDeviceId} />
                    <ContextValue label="Current intent" value={conversationContext?.currentIntent?.replace(/_/g, " ")} />
                    <ContextValue label="Current action" value={conversationContext?.currentAction?.replace(/_/g, " ")} />
                    <ContextValue label="Current NAS" value={conversationContext?.selectedNasId} />
                    <ContextValue label="Approval" value={conversationContext?.pendingAction?.approvalId ? `#${conversationContext.pendingAction.approvalId} · ${conversationContext.pendingAction.status}` : conversationContext?.pendingAction?.status} />
                    <ContextValue label="Routed specialist" value={conversationContext?.lastRoute?.resolvedIntent ? agent.name : agent.name} />
                    <ContextValue label="Last successful tool" value={conversationContext?.lastSuccessfulTool?.toolName} />
                  </div>
                </div>
                {Array.isArray(conversationContext?.toolExecutions) && <Context title="Recent tool activity" items={conversationContext.toolExecutions.slice(0, 5).map((item: any) => `${humanToolName(item.toolName)} · ${String(item.status).replace(/_/g, " ")}`)} tool />}
                <Context title="Database permissions" items={(agent.permissions || []).filter((item: any) => item.canRead || item.canExecute).map((item: any) => item.module)} />
                <Context title="Enabled tools" items={(agent.tools || []).filter((item: any) => item.enabled).map((item: any) => item.toolName)} tool />
                <div className="rounded-xl border p-3 text-xs text-muted-foreground"><ShieldCheck className="mb-2 size-4 text-primary" />Write operations remain approval-gated and are recorded in the audit log.</div>
                {canViewDebug && conversationContext?.debugTrace && (
                  <details className="rounded-xl border p-3 text-xs">
                    <summary className="cursor-pointer font-semibold">Resolution debug</summary>
                    <dl className="mt-3 space-y-2 text-muted-foreground">
                      <ContextValue label="Resolution" value={conversationContext.debugTrace.resolution} />
                      <ContextValue label="Selected tool" value={conversationContext.debugTrace.selectedTool} />
                      <ContextValue label="Intent source" value={conversationContext.debugTrace.intentSource} />
                      <ContextValue label="Authorization" value={conversationContext.debugTrace.authorizedTools?.length ? `${conversationContext.debugTrace.authorizedTools.length} tool(s) allowed` : "No executable tool allowed"} />
                      <ContextValue label="Tool status" value={conversationContext.debugTrace.toolStatus} />
                      <ContextValue label="Response type" value={conversationContext.debugTrace.finalResponseType} />
                      <ContextValue label="Fallback reason" value={conversationContext.debugTrace.fallbackReason} />
                    </dl>
                  </details>
                )}
              </div>
            </ScrollArea>
          </aside>
        )}

        <Dialog open={workOpen} onOpenChange={setWorkOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{workMode === "ticket" ? "Create ticket for an AI agent" : "Assign work to an AI agent"}</DialogTitle>
              <DialogDescription>Describe the result you need in normal language. The specialist detects the work type, targets, completion email, and approval requirement automatically.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2"><Label>Assigned specialist</Label><Select value={workAgentId} onValueChange={setWorkAgentId}><SelectTrigger><SelectValue placeholder="Select an agent" /></SelectTrigger><SelectContent>{agents.filter(item => item.status === "ACTIVE" && item.slug !== "manager").map(item => <SelectItem key={item.id} value={String(item.id)}>{item.name} · {item.department}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Title</Label><Input value={workTitle} onChange={event => setWorkTitle(event.target.value)} placeholder="What needs to be completed?" /></div>
              <div className="grid gap-2"><Label>Description</Label><Textarea value={workDescription} onChange={event => setWorkDescription(event.target.value)} placeholder="Explain the issue and the expected result in normal language." /></div>
              <div className="grid gap-2"><Label>Priority</Label><Select value={workPriority} onValueChange={setWorkPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Low</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="CRITICAL">Critical</SelectItem></SelectContent></Select></div>
              <p className="rounded-xl bg-muted p-3 text-[11px] text-muted-foreground"><ShieldCheck className="mr-1 inline size-3" />Passwords and shared secrets are removed automatically. Mention a configured vault credential reference instead.</p>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setWorkOpen(false)}>Cancel</Button><Button loading={savingWork} disabled={!workAgentId || !workTitle.trim()} onClick={createWork}>{workMode === "ticket" ? "Create and assign ticket" : "Assign task"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

function humanToolName(value: string) {
  const known: Record<string, string> = { getCustomer: "Customer verified", getCustomerServices: "Services checked", getCustomerSummary: "Customer summary checked", getTR069DeviceDetails: "Router details checked", getTR069WifiDetails: "Wi-Fi checked", getOLTStatus: "OLT checked", getSplitterDetails: "Splitter checked", createTicket: "Ticket created" }
  return known[value] || value.replace(/^get/, "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, letter => letter.toUpperCase())
}

function PendingActionCard({ action, disabled, onConfirm, onEdit, onCancel, onApprove, onReject }: { action: any; disabled: boolean; onConfirm: () => void; onEdit: () => void; onCancel: () => void; onApprove: () => void; onReject: () => void }) {
  const args = action.displayArguments || action.input || {}
  const waiting = action.status === "AWAITING_CONFIRMATION"
  return (
    <div className="ml-11 max-w-xl rounded-2xl border border-primary/20 bg-card p-4 shadow-depth">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Wrench className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">Create NAS</p><Badge variant="outline">{String(action.status || "AWAITING_CONFIRMATION").replace(/_/g, " ")}</Badge></div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-muted-foreground">IP address</dt><dd className="font-data font-medium">{args.ipAddress || args.nasIp || "Not provided"}</dd></div><div><dt className="text-muted-foreground">Secret</dt><dd className="font-medium">••••••••</dd></div>{(args.radiusServerIp || args.radiusServerAddress) && <div><dt className="text-muted-foreground">Radius server</dt><dd className="font-data font-medium">{args.radiusServerIp || args.radiusServerAddress}</dd></div>}<div><dt className="text-muted-foreground">Approval</dt><dd>{action.approvalId ? `#${action.approvalId}` : action.requiresApproval ? "Required" : "Not required"}</dd></div></dl>
          {action.error && <p className="mt-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{action.error}</p>}
          {waiting && <div className="mt-4 flex gap-2"><Button size="sm" disabled={disabled} onClick={onConfirm}><CheckCircle2 className="size-3.5" />Confirm</Button><Button size="sm" variant="outline" disabled={disabled} onClick={onEdit}>Edit</Button><Button size="sm" variant="outline" disabled={disabled} onClick={onCancel}>Cancel</Button></div>}
          {action.status === "AWAITING_APPROVAL" && action.approvalId && <div className="mt-4 flex gap-2"><Button size="sm" disabled={disabled} onClick={onApprove}><ShieldCheck className="size-3.5" />Approve</Button><Button size="sm" variant="destructive" disabled={disabled} onClick={onReject}>Reject</Button></div>}
        </div>
      </div>
    </div>
  )
}

function ToolProgress({ execution }: { execution: any }) {
  const active = execution.status === "EXECUTING"
  return <div className="ml-11 flex max-w-xl items-center gap-3 rounded-xl border bg-card px-4 py-3 text-xs shadow-sm"><Activity className={`size-4 text-primary ${active ? "animate-pulse" : ""}`} /><div className="min-w-0 flex-1"><p className="font-medium">{humanToolName(execution.toolName)}</p><p className="text-muted-foreground">{String(execution.status || "PENDING").replace(/_/g, " ")}{execution.durationMs ? ` · ${execution.durationMs} ms` : ""}</p></div>{execution.status === "COMPLETED" && <CheckCircle2 className="size-4 text-success" />}</div>
}

function ContextValue({ label, value }: { label: string; value?: string | null }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"><span className="text-muted-foreground">{label}</span><span className="truncate text-right font-medium">{value || "Not selected"}</span></div>
}

function InlineFormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  return <>{parts.map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong> : <span key={index}>{part}</span>)}</>
}

function ChatMessageContent({ content }: { content: string }) {
  const lines = String(content || "").replace(/\r\n/g, "\n").split("\n")
  return (
    <div className="space-y-2.5 text-foreground">
      {lines.map((raw, index) => {
        const line = raw.trim()
        if (!line) return <div key={index} className="h-1" aria-hidden="true" />
        const numbered = line.match(/^(\d+)[.)]\s+(.*)$/)
        if (numbered) return (
          <div key={index} className="mt-3 flex items-start gap-2.5 first:mt-0">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{numbered[1]}</span>
            <p className="min-w-0 flex-1"><InlineFormattedText text={numbered[2]} /></p>
          </div>
        )
        const bullet = line.match(/^[*-]\s+(.*)$/)
        if (bullet) return (
          <div key={index} className="flex items-start gap-2 pl-7">
            <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-primary/60" />
            <p className="min-w-0 flex-1 text-foreground/90"><InlineFormattedText text={bullet[1]} /></p>
          </div>
        )
        return <p key={index} className="whitespace-pre-wrap break-words text-foreground/90"><InlineFormattedText text={line} /></p>
      })}
    </div>
  )
}

function Context({ title, items, tool = false }: { title: string; items: string[]; tool?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="mt-2 space-y-2">
        {items.length ? items.map(item => (
          <div key={item} className="flex items-center gap-2 rounded-lg border p-2.5 text-xs">
            {tool ? <Wrench className="size-3.5 text-primary" /> : <CheckCircle2 className="size-3.5 text-primary" />}
            {item}
          </div>
        )) : <p className="text-xs text-muted-foreground">None configured.</p>}
      </div>
    </div>
  )
}
