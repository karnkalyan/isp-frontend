"use client"

import { useState, useEffect, useMemo } from "react"
import { apiRequest } from "@/lib/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { 
  Mail, 
  Loader2, 
  Send, 
  Plus,
  Search, 
  MoreVertical, 
  MessageSquare,
  User,
  Clock,
  Check,
  CheckCheck
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

interface Message {
  id: number
  content: string
  createdAt: string
  isRead: boolean
  senderId: number
  receiverId: number
  sender: { id: number; name: string; role: any }
  receiver: { id: number; name: string; role: any }
}

export default function MessagesPage() {
  const { user: authUser } = useAuth()
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
      const data = await apiRequest<any[]>("/users")
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
    if (newChatOpen) {
      fetchTeamMembers()
    }
  }, [newChatOpen, myId])

  // Mark messages as read when a conversation is selected
  useEffect(() => {
    if (selectedUserId && myId) {
      markMessagesAsRead(selectedUserId)
    }
  }, [selectedUserId, myId])

  // Group messages by conversation
  const conversations = useMemo(() => {
    if (!myId) return []
    const groups: Record<number, { user: any; lastMessage: Message; unreadCount: number }> = {}

    messages.forEach(msg => {
      const otherUser = msg.senderId === myId ? msg.receiver : msg.sender
      if (!otherUser) return

      if (!groups[otherUser.id]) {
        groups[otherUser.id] = {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0
        }
      }

      if (msg.receiverId === myId && !msg.isRead) {
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
    if (!selectedUserId || !myId) return []
    return messages
      .filter(msg => 
        (msg.senderId === myId && msg.receiverId === selectedUserId) ||
        (msg.senderId === selectedUserId && msg.receiverId === myId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [messages, selectedUserId, myId])

  const handleSend = async () => {
    if (!selectedUserId || !content.trim()) return
    try {
      await apiRequest("/messages", {
        method: "POST",
        body: JSON.stringify({ receiverId: selectedUserId, content })
      })
      setContent("")
      fetchMessages()
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" })
    }
  }

  const selectedUser = conversations.find(c => c.user.id === selectedUserId)?.user || teamMembers.find(t => t.id === selectedUserId)

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-80px)] flex overflow-hidden bg-white dark:bg-slate-950 rounded-xl border shadow-sm m-6">
        {/* Sidebar */}
        <div className="w-80 border-r flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-4 border-b space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Messages
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
                <div className="text-center p-8 text-sm text-muted-foreground">No conversations found</div>
              ) : (
                conversations
                  .filter(c => c.user.name.toLowerCase().includes(search.toLowerCase()))
                  .map(conv => (
                  <button
                    key={conv.user.id}
                    onClick={() => setSelectedUserId(conv.user.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all ${
                      selectedUserId === conv.user.id 
                        ? "bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" 
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="bg-primary/10 text-primary">{conv.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left overflow-hidden">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-semibold text-sm truncate">{conv.user.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
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
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
          {selectedUserId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-slate-950 z-10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback className="bg-primary/10 text-primary">{selectedUser?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-bold text-sm leading-none mb-1">{selectedUser?.name}</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{selectedUser?.role?.name || 'User'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Search className="h-4 w-4"/></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreVertical className="h-4 w-4"/></Button>
                </div>
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
                  </div>
                )}
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 border-t bg-white dark:bg-slate-950">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Input 
                    placeholder="Type a message..." 
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
                Select a conversation from the left to start chatting or create a new message.
              </p>
              <Button onClick={() => setNewChatOpen(true)} className="mt-6 gap-2">
                <Plus className="h-4 w-4" /> Start New Chat
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Select a team member to start a conversation.
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
      </Dialog>
    </DashboardLayout>
  )
}
