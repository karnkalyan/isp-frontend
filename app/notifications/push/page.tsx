"use client"

import { useState } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { apiRequest } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Send, Users, ShieldAlert, Loader2 } from "lucide-react"

export default function PushNotificationsPage() {
  const [segment, setSegment] = useState<"customer" | "staff">("customer")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and Body are required.",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      const result = await apiRequest<{ success: boolean; message: string; count: number }>("/notifications/send-push", {
        method: "POST",
        body: JSON.stringify({ segment, title, body }),
      })

      if (result.success) {
        toast({
          title: "Push Notifications Sent",
          description: result.message || `Broadcasted to ${result.count} devices.`,
        })
        setTitle("")
        setBody("")
      } else {
        toast({
          title: "Sending Failed",
          description: "Could not send push notifications.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error Sending Notification",
        description: error.message || "An error occurred.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="container max-w-2xl mx-auto py-8">
        <CardContainer
          title="Send Push Notifications"
          description="Send direct push notifications to customer or staff mobile apps via Expo"
        >
          <form onSubmit={handleSend} className="space-y-6 pt-4">
            {/* Target App Segment Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground block">
                Target App / Audience Segment
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSegment("customer")}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    segment === "customer"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-bold text-sm">Customer App</p>
                    <p className="text-xs text-muted-foreground">Broadcast to all customers</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSegment("staff")}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    segment === "staff"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-bold text-sm">Staff App</p>
                    <p className="text-xs text-muted-foreground">Broadcast to all field staff</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Notification Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-semibold text-muted-foreground block">
                Notification Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. System Maintenance Scheduled"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Notification Body */}
            <div className="space-y-2">
              <label htmlFor="body" className="text-sm font-semibold text-muted-foreground block">
                Message Body
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your push notification message details here..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                required
              />
            </div>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-6 text-base font-bold rounded-xl"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Broadcast...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Push Notification
                </>
              )}
            </Button>
          </form>
        </CardContainer>
      </div>
    </DashboardLayout>
  )
}
