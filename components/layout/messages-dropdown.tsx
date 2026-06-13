"use client"

import { useState, useEffect } from "react"
import { Mail, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { apiRequest } from "@/lib/api"

interface MessagesDropdownProps {
  className?: string
}

export function MessagesDropdown({ className }: MessagesDropdownProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  const fetchMessages = async () => {
      try {
          const data = await apiRequest("/messages")
          setMessages(Array.isArray(data) ? data : [])
      } catch (e) {
          console.error(e)
      }
  }

  useEffect(() => {
      if (open) {
        fetchMessages()
        markAllAsRead()
      }
  }, [open])

  useEffect(() => {
      fetchMessages() 
  }, [])

  const unreadCount = messages.filter((msg) => !msg.isRead).length

  const markAllAsRead = async () => {
      const hasUnread = messages.some((msg) => !msg.isRead)
      if (!hasUnread) return
      try {
          await apiRequest("/messages/read-all", { method: "PUT", suppressToast: true })
          setMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })))
      } catch (e) {
          console.error(e)
      }
  }

  const markOneAsRead = async (id: number | string) => {
      setMessages((prev) => prev.map((msg) => msg.id === id ? { ...msg, isRead: true } : msg))
      try {
          await apiRequest(`/messages/${id}/read`, { method: "PUT", suppressToast: true })
      } catch (e) {
          console.error(e)
      }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)} aria-label="Messages">
          <Mail className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80"
        align="end"
        style={{
          background: isDarkMode
            ? "linear-gradient(to bottom, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))"
            : "linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(241, 245, 249, 0.95))",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: isDarkMode ? "0 10px 25px -5px rgba(0, 0, 0, 0.5)" : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.8)",
        }}
      >
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2 border-b border-border/20">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 opacity-70" />
            <span className="font-semibold">Messages</span>
            {unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-normal" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuGroup className="max-h-[300px] overflow-auto py-1">
          {messages.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No messages</div>
          ) : messages.slice(0, 5).map((message) => (
            <DropdownMenuItem key={message.id} className="focus:bg-transparent" onSelect={() => markOneAsRead(message.id)}>
              <div
                className={cn(
                  "flex items-start w-full p-2 rounded-md cursor-pointer transition-all duration-200",
                  !message.isRead ? "bg-primary/5" : "",
                  "hover:bg-primary/10",
                )}
              >
                <Avatar className="h-9 w-9 mr-2">
                  <AvatarFallback>{message.sender?.name?.substring(0, 2) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn("text-sm truncate", !message.isRead && "font-semibold")}>{message.sender?.name}</p>
                    <span className="flex items-center text-xs text-muted-foreground whitespace-nowrap ml-1">
                      {!message.isRead ? (
                        <span className="flex items-center">
                          <span className="mr-1 h-2 w-2 rounded-full bg-blue-500"></span>
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Check className="mr-1 h-3 w-3 text-green-500" />
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs line-clamp-1">{message.content}</p>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="opacity-50" />
        <div className="p-2 flex gap-2">
          <Link href="/messages" onClick={() => setOpen(false)} className="w-full">
            <Button variant="outline" size="sm" className="w-full justify-center text-xs h-8">
              View all
            </Button>
          </Link>
          <Link href="/messages" onClick={() => setOpen(false)} className="w-full">
            <Button variant="default" size="sm" className="w-full justify-center text-xs h-8">
              New message
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
