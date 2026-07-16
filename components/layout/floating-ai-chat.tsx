"use client"

import { useEffect, useRef, useState } from "react"
import { Bot, ExternalLink, MessageSquare, Send, Sparkles, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AiAgentConversationsAPI } from "@/lib/api/ai-agent"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

type MiniMessage = { role: "user" | "assistant"; content: string }
const greeting: MiniMessage = { role: "assistant", content: "Hi - I'm Manager AI. Describe the outcome you need and I'll route it to the right specialist." }

export function FloatingAiChat() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [aiMode, setAiMode] = useState(true)
  const [text, setText] = useState("")
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const [messages, setMessages] = useState<MiniMessage[]>([greeting])
  const [restored, setRestored] = useState(false)
  const restoredKeyRef = useRef("")
  const storageKey = `kashtrix-floating-ai-chat:${user?.id || "guest"}`

  useEffect(() => {
    if (!user?.id) return
    setRestored(false)
    let active = true
    const restore = async () => {
      try {
        const raw = sessionStorage.getItem(storageKey)
        if (!raw) return
        const saved = JSON.parse(raw)
        setOpen(Boolean(saved.open))
        setAiMode(saved.aiMode !== false)
        setText(typeof saved.text === "string" ? saved.text : "")
        const savedMessages = Array.isArray(saved.messages) ? saved.messages.filter((item: any) => item?.role && typeof item.content === "string") : []
        if (savedMessages.length) setMessages(savedMessages)
        const id = Number(saved.conversationId || 0)
        if (id) {
          setConversationId(id)
          try {
            const response = await AiAgentConversationsAPI.messages(id)
            if (active && response.data?.length) setMessages(response.data.map(item => ({ role: item.role, content: item.content })))
          } catch {
            if (active) setConversationId(null)
          }
        }
      } catch {
        sessionStorage.removeItem(storageKey)
      } finally {
        if (active) { restoredKeyRef.current = storageKey; setRestored(true) }
      }
    }
    restore()
    return () => { active = false }
  }, [user?.id, storageKey])

  useEffect(() => {
    if (!user?.id || !restored || restoredKeyRef.current !== storageKey) return
    sessionStorage.setItem(storageKey, JSON.stringify({ open, aiMode, text, conversationId, messages, updatedAt: Date.now() }))
  }, [user?.id, storageKey, restored, open, aiMode, text, conversationId, messages])

  useEffect(() => {
    const refreshUnread = () => apiRequest<any[]>("/messages", { suppressToast: true }).then(items => {
      if (Array.isArray(items)) setUnread(items.filter(item => item.receiverId === user?.id && !item.isRead).length)
    }).catch(() => undefined)
    refreshUnread()
    window.addEventListener("messages-updated", refreshUnread)
    return () => window.removeEventListener("messages-updated", refreshUnread)
  }, [user?.id])

  const toggle = () => {
    setOpen(value => !value)
    setUnread(0)
  }

  const send = async () => {
    const content = text.trim()
    if (!content || sending) return

    setMessages(value => [...value, { role: "user", content }])
    setText("")
    setSending(true)

    try {
      let id = conversationId
      if (!id) {
        const created = await AiAgentConversationsAPI.create(undefined, content.slice(0, 80), content)
        id = created.data.id
        setConversationId(id)
      }
      const result = await AiAgentConversationsAPI.send(id, content)
      setMessages(value => [...value, { role: "assistant", content: result.data.assistant.content }])
      if (!open) setUnread(value => value + 1)
    } catch (error) {
      setMessages(value => [...value, { role: "assistant", content: error instanceof Error ? error.message : "AI is temporarily unavailable." }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {open && (
        <section className="fixed bottom-24 right-4 z-50 flex h-[min(620px,calc(100dvh-8rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[24px] border bg-card shadow-[0_28px_90px_rgba(29,12,43,.28)] animate-in sm:right-6">
          <header className="flex items-center gap-3 border-b p-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Bot className="size-5" /></div>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-sm font-semibold">Manager AI</h2>
              <p className="text-xs text-muted-foreground">Routes work to specialist agents</p>
            </div>
            <Button variant="ghost" size="icon" onClick={toggle}><X /></Button>
          </header>

          <div className="flex items-center justify-between border-b bg-secondary/35 px-4 py-2.5">
            <span className="flex items-center gap-2 text-xs font-medium"><Sparkles className="size-3.5 text-primary" />AI routing mode</span>
            <button onClick={() => setAiMode(!aiMode)} className={`relative h-6 w-11 rounded-full transition-colors ${aiMode ? "bg-primary" : "bg-muted"}`} aria-pressed={aiMode}>
              <span className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${aiMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-background/55 p-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-5 ${message.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border bg-card"}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {sending && <div className="text-xs text-muted-foreground animate-pulse">Manager AI is selecting a specialist...</div>}
          </div>

          <footer className="border-t bg-card p-3">
            <div className="flex gap-2">
              <Input value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === "Enter") send() }} placeholder="Describe a task or ask a question..." />
              <Button size="icon" onClick={send} disabled={!text.trim() || sending}><Send /></Button>
            </div>
            <Link href="/ai-agents/chat" className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-primary">Open full AI workspace <ExternalLink className="size-3" /></Link>
          </footer>
        </section>
      )}

      <Button onClick={toggle} size="icon" aria-label="Open AI chat" className={`fixed bottom-6 right-5 z-50 size-14 rounded-full border-4 border-background shadow-[0_16px_42px_rgba(74,27,122,.3)] hover:scale-105 sm:right-6 ${unread > 0 && !open ? "animate-chat-vibrate" : ""}`}>
        {open ? <X className="size-6" /> : <MessageSquare className="size-6" />}
        {unread > 0 && !open && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full border-2 border-background bg-[#e11d72] px-1 text-[10px] text-white">{unread}</span>}
      </Button>
    </>
  )
}
