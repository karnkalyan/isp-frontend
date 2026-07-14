"use client"

import { useEffect, useRef, useState } from "react"
import { Bot, CheckCircle2, Clock3, PanelRightClose, Plus, Send, ShieldCheck, Wrench } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AgentAvatar } from "./agent-avatar"
import { AiAgentConversationsAPI, AiAgentsAPI, type AgentMessage } from "@/lib/api/ai-agent"

type Agent = any

export function AgentChat({ initialAgentId }: { initialAgentId?: string }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [agentId, setAgentId] = useState(initialAgentId || "auto")
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [contextOpen, setContextOpen] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)
  const agent = agents.find(a => String(a.id) === agentId) || agents.find(a => a.slug === "manager") || agents[0]

  const load = async () => {
    const [agentResponse, conversationResponse] = await Promise.all([AiAgentsAPI.list(), AiAgentConversationsAPI.list()])
    setAgents(agentResponse.data)
    setConversations(conversationResponse.data)
    if (initialAgentId) {
      const found = agentResponse.data.find((item: any) => String(item.id) === initialAgentId || item.slug === initialAgentId)
      if (found) setAgentId(String(found.id))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, sending])

  const openConversation = async (conversation: any) => {
    setConversationId(conversation.id)
    setAgentId(String(conversation.agentId))
    setMessages((await AiAgentConversationsAPI.messages(conversation.id)).data)
  }

  const newConversation = () => {
    setConversationId(null)
    setMessages([])
    setAgentId("auto")
  }

  const send = async () => {
    const content = text.trim()
    if (!content || sending) return
    const optimistic: any = { id: -Date.now(), role: "user", senderType: "USER", content, createdAt: new Date().toISOString() }
    setMessages(current => [...current, optimistic])
    setText("")
    setSending(true)

    try {
      let id = conversationId
      if (!id) {
        const created = await AiAgentConversationsAPI.create(agentId === "auto" ? undefined : Number(agentId), content.slice(0, 100), content)
        id = created.data.id
        setConversationId(id)
        const routed = (created.data as any).agent
        if (routed) setAgentId(String(routed.id))
      }

      const result = await AiAgentConversationsAPI.send(id, content)
      if ((result.data as any).agent?.id) setAgentId(String((result.data as any).agent.id))
      setMessages(current => [...current.filter(item => item.id !== optimistic.id), result.data.userMessage, result.data.assistant])
      setConversations((await AiAgentConversationsAPI.list()).data)
    } catch (error: any) {
      setMessages(current => [...current, { ...optimistic, id: -Date.now() - 1, role: "assistant", senderType: "AGENT", content: error.message || "Unable to complete the request." }])
    } finally {
      setSending(false)
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
              {messages.map(message => (
                <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role !== "user" && <AgentAvatar icon={agent?.avatar} className="size-8" />}
                  <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm border bg-card"}`}>
                    {message.content}
                    {message.role !== "user" && Array.isArray((message.structuredData as any)?.performed) && (message.structuredData as any).performed.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
                        {(message.structuredData as any).performed.map((item: string) => <Badge key={item} variant="secondary"><CheckCircle2 className="mr-1 size-3" />{item}</Badge>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && <div className="flex gap-3"><AgentAvatar icon={agent?.avatar} className="size-8" /><div className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground"><Clock3 className="mr-2 inline size-4 animate-pulse" />Checking authorized records...</div></div>}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <div className="border-t bg-card p-4">
            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-background p-2">
              <textarea value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send() } }} className="min-h-11 max-h-32 flex-1 resize-none bg-transparent px-2 py-3 text-sm outline-none" placeholder="Ask about live operational data or request a task..." />
              <Button size="icon" onClick={send} disabled={!text.trim() || sending}><Send /></Button>
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
                <Context title="Database permissions" items={(agent.permissions || []).filter((item: any) => item.canRead || item.canExecute).map((item: any) => item.module)} />
                <Context title="Enabled tools" items={(agent.tools || []).filter((item: any) => item.enabled).map((item: any) => item.toolName)} tool />
                <div className="rounded-xl border p-3 text-xs text-muted-foreground"><ShieldCheck className="mb-2 size-4 text-primary" />Write operations remain approval-gated and are recorded in the audit log.</div>
              </div>
            </ScrollArea>
          </aside>
        )}
      </div>
    </DashboardLayout>
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
