"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { apiRequest } from "@/lib/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import {
  Loader2, 
  Send, 
  Plus,
  Search, 
  MessageSquare,
  Check,
  CheckCheck,
  Building2,
  Phone,
  MapPin,
  ExternalLink,
  UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"
import { useWebSocket } from "@/contexts/WebSocketContext"

interface CustomerDetails {
  id: number
  customerUniqueId?: string
  branchId?: number
  branch?: { id: number; name: string; code?: string }
  lead?: {
    phoneNumber?: string
    email?: string
    address?: string
    street?: string
    district?: string
    branch?: { id: number; name: string; code?: string }
  }
}

interface MessageUser {
  id: number
  name: string
  email?: string
  branchId?: number
  role?: any
  branch?: { id: number; name: string; code?: string }
  customer?: CustomerDetails
}

interface Message {
  id: number
  content: string
  createdAt: string
  isRead: boolean
  senderId: number
  receiverId: number | null
  branchId?: number | null
  branch?: { id: number; name: string; code?: string }
  sender: MessageUser
  receiver: MessageUser | null
}

function isCustomer(user: any) {
  if (!user) return false
  if (user.customer || user.customerId) return true
  const roleName = String(user.role?.name || user.role || "").toLowerCase()
  return roleName.includes("customer")
}

function getCustomerBranch(user: any, msg?: Message | null) {
  return (
    user?.customer?.branch?.name ||
    user?.customer?.lead?.branch?.name ||
    user?.branch?.name ||
    msg?.branch?.name ||
    null
  )
}

function getCustomerUniqueId(user: any) {
  return user?.customer?.customerUniqueId || null
}

function getCustomerPhone(user: any) {
  return user?.customer?.lead?.phoneNumber || null
}

function getCustomerAddress(user: any) {
  const street = user?.customer?.lead?.street
  const address = user?.customer?.lead?.address
  const district = user?.customer?.lead?.district
  return [street, address, district].filter(Boolean).join(", ") || null
}

export default function MessagesPage() {
  const { user: authUser } = useAuth()
  const { on } = useWebSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [myId, setMyId] = useState<number | null>(null)
  
  // New chat states
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loadingTeam, setLoadingTeam] = useState(false)
  const [teamSearch, setTeamSearch] = useState("")
  const [ispName, setIspName] = useState("Your ISP")
  const isCustomerUser = Boolean(authUser?.customerId) || String(authUser?.role?.name || authUser?.role || "").toLowerCase().includes("customer")

  const cleanIspName = (value?: string) => String(value || "Your ISP")
    .replace(/\s+(pvt\.?\s*ltd\.?|private\s+limited)\s*$/i, "")
    .trim()

  const fetchMessages = async () => {
    try {
      const data = await apiRequest<Message[]>("/messages")
      setMessages(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to load messages", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      setLoadingTeam(true)
      const data = await apiRequest<any[]>("/messages/recipients")
      if (Array.isArray(data)) {
        setTeamMembers(data.filter(u => u.id !== myId))
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error)
    } finally {
      setLoadingTeam(false)
    }
  }

  const markMessagesAsRead = async (fromUserId: number) => {
    if (!myId) return
    try {
      // Mark all messages from this user as read
      const unreadMessages = messages.filter(msg => 
        msg.senderId === fromUserId && msg.receiverId === myId && !msg.isRead
      )
      
      for (const msg of unreadMessages) {
        await apiRequest(`/messages/${msg.id}/read`, {
          method: "PUT",
          suppressToast: true
        })
      }
      
      // Update local state to reflect read status
      setMessages(messages.map(msg => 
        (msg.senderId === fromUserId && msg.receiverId === myId && !msg.isRead)
          ? { ...msg, isRead: true }
          : msg
      ))

      if (unreadMessages.length > 0) {
        window.dispatchEvent(new CustomEvent("messages-updated"))
      }
    } catch (error) {
      console.error("Failed to mark messages as read:", error)
    }
  }

  // Set myId from AuthContext first, then fallback to /auth/me
  useEffect(() => {
    if (authUser?.id) {
      setMyId(authUser.id)
    } else {
      const fetchMe = async () => {
        try {
          const me = await apiRequest<any>("/auth/me")
          // The /auth/me endpoint returns { user: { id, ... } }
          setMyId(me?.user?.id || me?.id)
        } catch (e) {
          console.error("Failed to fetch current user:", e)
        }
      }
      fetchMe()
    }
    fetchMessages()
  }, [authUser])

  useEffect(() => {
    if (!isCustomerUser) return
    apiRequest<any>("/customer/profile", { suppressToast: true })
      .then(response => setIspName(cleanIspName(response?.data?.isp?.companyName)))
      .catch(() => setIspName("Your ISP"))
  }, [isCustomerUser])

  useEffect(() => {
    if (newChatOpen) {
      fetchTeamMembers()
    }
  }, [newChatOpen, myId])

  useEffect(() => {
    const unsubscribe = on("chat.message", (message: Message) => {
      setMessages(prev => {
        const exists = prev.some(item => item.id === message.id)
        const next = exists ? prev.map(item => item.id === message.id ? message : item) : [message, ...prev]
        return next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      })
      window.dispatchEvent(new CustomEvent("messages-updated"))
    })
    return unsubscribe
  }, [on])

  // Mark messages as read when a conversation is selected
  useEffect(() => {
    if (selectedUserId && myId) {
      markMessagesAsRead(selectedUserId)
    }
  }, [selectedUserId, myId])

  useEffect(() => {
    if (!isCustomerUser || !myId) return
    const unread = messages.filter(message => (message.receiverId === myId || !message.receiverId) && message.senderId !== myId && !message.isRead)
    if (unread.length === 0) return

    Promise.all(unread.map(message => apiRequest(`/messages/${message.id}/read`, {
      method: "PUT",
      suppressToast: true
    }))).then(() => {
      const readIds = new Set(unread.map(message => message.id))
      setMessages(current => current.map(message => readIds.has(message.id) ? { ...message, isRead: true } : message))
      window.dispatchEvent(new CustomEvent("messages-updated"))
    }).catch(error => console.error("Failed to mark ISP chat as read:", error))
  }, [messages, myId, isCustomerUser])

  // Group messages by conversation
  const conversations = useMemo(() => {
    if (!myId) return []
    const groups: Record<number, { user: any; lastMessage: Message; unreadCount: number }> = {}

    messages.forEach(msg => {
      let otherUser: any = null
      if (msg.senderId === myId) {
        otherUser = msg.receiver
      } else if (msg.receiverId === myId) {
        otherUser = msg.sender
      } else {
        // Staff viewing support message where neither is myId
        const isSenderCustomer = isCustomer(msg.sender)
        const isReceiverCustomer = isCustomer(msg.receiver)
        if (isSenderCustomer) otherUser = msg.sender
        else if (isReceiverCustomer) otherUser = msg.receiver
        else otherUser = msg.sender
      }
      if (!otherUser) return

      if (!groups[otherUser.id]) {
        groups[otherUser.id] = {
          user: { ...otherUser },
          lastMessage: msg,
          unreadCount: 0
        }
      }

      // Merge customer/branch metadata if available in msg
      const currentGrpUser = groups[otherUser.id].user
      if (!currentGrpUser.customer && (msg.senderId === otherUser.id ? msg.sender?.customer : msg.receiver?.customer)) {
        currentGrpUser.customer = msg.senderId === otherUser.id ? msg.sender?.customer : msg.receiver?.customer
      }
      if (!currentGrpUser.branch && (msg.branch || (msg.senderId === otherUser.id ? msg.sender?.branch : msg.receiver?.branch))) {
        currentGrpUser.branch = msg.branch || (msg.senderId === otherUser.id ? msg.sender?.branch : msg.receiver?.branch)
      }

      if ((msg.receiverId === myId || !msg.receiverId) && msg.senderId !== myId && !msg.isRead) {
        groups[otherUser.id].unreadCount++
      }

      // Keep the latest message
      if (new Date(msg.createdAt) > new Date(groups[otherUser.id].lastMessage.createdAt)) {
        groups[otherUser.id].lastMessage = msg
      }
    })

    return Object.values(groups).sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    )
  }, [messages, myId])

  const currentChatMessages = useMemo(() => {
    if (!myId) return []
    if (isCustomerUser) {
      // Deduplicate any broadcast duplicate messages
      const seen = new Set<string>()
      const uniqueMessages: Message[] = []
      const sorted = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      for (const msg of sorted) {
        if (msg.senderId === myId) {
          const timeBucket = Math.floor(new Date(msg.createdAt).getTime() / 3000)
          const key = `${msg.content?.trim()}_${timeBucket}`
          if (seen.has(key)) continue
          seen.add(key)
        }
        uniqueMessages.push(msg)
      }
      return uniqueMessages
    }
    if (!selectedUserId) return []

    const selectedConv = conversations.find(c => c.user.id === selectedUserId)
    const isTargetCustomer = isCustomer(selectedConv?.user)

    return messages
      .filter(msg => {
        const isDirect = (msg.senderId === myId && msg.receiverId === selectedUserId) ||
                         (msg.senderId === selectedUserId && msg.receiverId === myId)
        if (isDirect) return true
        if (isTargetCustomer) {
          // If chatting with customer, also include any staff messages to/from this customer
          return (msg.senderId === selectedUserId && !msg.receiverId) ||
                 (msg.senderId === selectedUserId) ||
                 (msg.receiverId === selectedUserId)
        }
        return false
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [messages, selectedUserId, conversations, myId, isCustomerUser])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    // Timeout gives DOM time to layout newly rendered messages
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" })
    }, 50)
  }

  // Scroll to bottom when conversation changes or initializes
  useEffect(() => {
    if (selectedUserId || isCustomerUser) {
      scrollToBottom("auto")
    }
  }, [selectedUserId, isCustomerUser])

  // Auto-scroll when new messages arrive or are added to current chat
  useEffect(() => {
    if (currentChatMessages.length > 0) {
      scrollToBottom("smooth")
    }
  }, [currentChatMessages.length, currentChatMessages[currentChatMessages.length - 1]?.id])

  const handleSend = async () => {
    if ((!selectedUserId && !isCustomerUser) || !content.trim()) return
    try {
      await apiRequest("/messages", {
        method: "POST",
        body: JSON.stringify({ receiverId: selectedUserId || undefined, content })
      })
      setContent("")
      fetchMessages()
      scrollToBottom("smooth")
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" })
    }
  }

  const selectedConv = selectedUserId ? conversations.find(c => c.user.id === selectedUserId) : null
  const selectedUser = selectedUserId
    ? selectedConv?.user || teamMembers.find(t => t.id === selectedUserId)
    : isCustomerUser
      ? { name: ispName, role: null }
      : null

  const selectedUserIsCust = !isCustomerUser && isCustomer(selectedUser)
  const selectedBranchName = selectedUserIsCust ? getCustomerBranch(selectedUser, selectedConv?.lastMessage) : null
  const selectedCustId = selectedUserIsCust ? getCustomerUniqueId(selectedUser) : null
  const selectedPhone = selectedUserIsCust ? getCustomerPhone(selectedUser) : null
  const selectedAddress = selectedUserIsCust ? getCustomerAddress(selectedUser) : null

  return (
    <DashboardLayout>
      <div className={`flex overflow-hidden bg-white dark:bg-slate-950 ${isCustomerUser ? "h-[calc(100dvh-8.5rem)] rounded-2xl border shadow-sm md:m-4 md:h-[calc(100vh-7rem)]" : "h-[calc(100vh-80px)] rounded-xl border shadow-sm m-6"}`}>
        {/* Sidebar */}
        {!isCustomerUser && <div className="w-84 border-r flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-4 border-b space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {isCustomerUser ? "Support Chat" : "Messages"}
              </h1>
              <Button onClick={() => setNewChatOpen(true)} variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-9 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : conversations.length === 0 ? (
                <div className="space-y-3 p-6 text-center text-sm text-muted-foreground">
                  <MessageSquare className="mx-auto h-8 w-8 opacity-50" />
                  <p>No conversations found</p>
                  {isCustomerUser && (
                    <Button size="sm" onClick={() => setSelectedUserId(null)} className="gap-2">
                      <Send className="h-4 w-4" /> Message Support
                    </Button>
                  )}
                </div>
              ) : (
                conversations
                  .filter(c => c.user.name.toLowerCase().includes(search.toLowerCase()))
                  .map(conv => {
                    const convIsCustomer = isCustomer(conv.user)
                    const convBranch = convIsCustomer ? getCustomerBranch(conv.user, conv.lastMessage) : null
                    const convCustId = convIsCustomer ? getCustomerUniqueId(conv.user) : null

                    return (
                      <button
                        key={conv.user.id}
                        onClick={() => setSelectedUserId(conv.user.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all ${
                          selectedUserId === conv.user.id 
                            ? "bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" 
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <Avatar className="h-10 w-10 border shrink-0 mt-0.5">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {conv.user.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left overflow-hidden min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-semibold text-sm truncate">{conv.user.name}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                              {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Branch & Customer ID Badge in Sidebar */}
                          {convIsCustomer && (
                            <div className="flex items-center gap-1.5 flex-wrap my-1">
                              {convBranch ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <Building2 className="h-2.5 w-2.5 shrink-0" />
                                  <span className="truncate max-w-[120px]">{convBranch}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  HQ / Main
                                </span>
                              )}
                              {convCustId && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800">
                                  {convCustId}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? "font-bold text-slate-900 dark:text-white" : "text-muted-foreground"}`}>
                              {conv.lastMessage.senderId === myId && "You: "}{conv.lastMessage.content}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge className="h-4 min-w-[16px] px-1 ml-2 text-[10px] flex items-center justify-center">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
              )}
            </div>
          </ScrollArea>
        </div>}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
          {selectedUserId || isCustomerUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-950 z-10 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 border shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {selectedUser?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="font-bold text-base leading-none truncate">{selectedUser?.name}</h2>
                      {selectedCustId && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {selectedCustId}
                        </span>
                      )}
                      {selectedBranchName && (
                        <Badge variant="outline" className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Branch: {selectedBranchName}
                        </Badge>
                      )}
                    </div>
                    {isCustomerUser ? (
                      <p className="text-xs text-emerald-600 font-medium">Support Agent • Usually replies soon</p>
                    ) : selectedUserIsCust ? (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="uppercase tracking-wider font-semibold text-[10px] text-slate-500">Customer</span>
                        {selectedPhone && (
                          <a href={`tel:${selectedPhone}`} className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                            <Phone className="h-3 w-3 text-emerald-600" />
                            {selectedPhone}
                          </a>
                        )}
                        {selectedAddress && (
                          <span className="inline-flex items-center gap-1 truncate max-w-[280px]">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{selectedAddress}</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {selectedUser?.role?.name || 'Staff Member'}
                      </p>
                    )}
                  </div>
                </div>

                {!isCustomerUser && (
                  <div className="flex items-center gap-2">
                    {selectedUserIsCust && selectedCustId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => window.open(`/customers?search=${encodeURIComponent(selectedCustId)}`, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Customer Profile
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4 bg-slate-50/30 dark:bg-slate-900/10">
                {currentChatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[300px]">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
                    <p className="text-sm">No messages yet. Send a message to start the conversation.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentChatMessages.map((msg, i) => {
                      const isMe = msg.senderId === myId
                      const showTime = i === 0 || 
                        new Date(msg.createdAt).getTime() - new Date(currentChatMessages[i-1].createdAt).getTime() > 1000 * 60 * 30

                      return (
                        <div key={msg.id} className="space-y-1">
                          {showTime && (
                            <div className="flex justify-center my-4">
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-muted-foreground">
                                {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] group relative ${isMe ? "items-end" : "items-start"}`}>
                              <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                                isMe 
                                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                                  : "bg-white dark:bg-slate-800 border rounded-tl-none"
                              }`}>
                                {msg.content}
                              </div>
                              <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMe && (
                                  msg.isRead ? <CheckCheck className="h-3 w-3 text-blue-500" /> : <Check className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} className="h-1 w-full" />
                  </div>
                )}
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 border-t bg-white dark:bg-slate-950">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Input 
                    placeholder={isCustomerUser ? `Message ${ispName}...` : "Type a message..."}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                  />
                  <Button 
                    size="icon" 
                    className="h-10 w-10 rounded-xl shrink-0" 
                    disabled={!content.trim()}
                    onClick={handleSend}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Your Messages</h2>
              <p className="text-muted-foreground max-w-xs mx-auto">
                {isCustomerUser ? "Send a message to support or continue an existing conversation." : "Select a conversation from the left to start chatting or create a new message."}
              </p>
              <Button onClick={() => isCustomerUser ? setSelectedUserId(null) : setNewChatOpen(true)} className="mt-6 gap-2">
                {isCustomerUser ? <Send className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {isCustomerUser ? "Message Support" : "Start New Chat"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {!isCustomerUser && <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Select a support team member to start a conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[250px] pr-4">
              {loadingTeam ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center p-4 text-sm text-muted-foreground">
                  No team members found
                </div>
              ) : (
                <div className="space-y-2">
                  {teamMembers
                    .filter(u => u.name?.toLowerCase().includes(teamSearch.toLowerCase()))
                    .map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUserId(user.id)
                          setNewChatOpen(false)
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-left"
                      >
                        <Avatar className="h-8 w-8 border">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-semibold truncate">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {user.role?.name || 'User'}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>}
    </DashboardLayout>
  )
}
