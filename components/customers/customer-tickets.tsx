"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Clock, MessageSquare } from "lucide-react"

// Mock data for support tickets
const tickets = [
  {
    id: "TKT-001",
    title: "Internet Connection Issue",
    description: "Customer reports intermittent connection drops during peak hours.",
    status: "open",
    priority: "medium",
    createdAt: "2023-04-25T10:30:00Z",
    updatedAt: "2023-04-26T14:15:00Z",
    assignedTo: "John Technician",
  },
  {
    id: "TKT-002",
    title: "Speed Test Results Below Plan",
    description: "Customer's speed tests showing 250 Mbps instead of 500 Mbps subscribed.",
    status: "resolved",
    priority: "high",
    createdAt: "2023-03-18T09:45:00Z",
    updatedAt: "2023-03-20T11:20:00Z",
    assignedTo: "Sarah Engineer",
    resolution: "Replaced ONT device which resolved the speed issues.",
  },
  {
    id: "TKT-003",
    title: "Billing Inquiry",
    description: "Customer questioning charge for equipment rental that should be included in plan.",
    status: "resolved",
    priority: "low",
    createdAt: "2023-02-05T13:10:00Z",
    updatedAt: "2023-02-05T15:45:00Z",
    assignedTo: "Mike Billing",
    resolution: "Confirmed equipment rental is included. Issued refund for incorrect charge.",
  },
]

export function CustomerTickets() {
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "in-progress":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high":
        return isDarkMode ? "text-red-400" : "text-red-600"
      case "medium":
        return isDarkMode ? "text-amber-400" : "text-amber-600"
      case "low":
        return isDarkMode ? "text-blue-400" : "text-blue-600"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-4">
      {Array.isArray(tickets) && tickets.length > 0 ? (
        tickets.map((ticket) => (
          <div
            key={ticket.id}
            className={`rounded-lg border p-4 shadow-sm hover:shadow-md transition-all ${isDarkMode ? "border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800" : "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100"} ${
              expandedTicket === ticket.id ? (isDarkMode ? "bg-slate-800/50" : "bg-slate-100/50") : ""
            }`}
          >
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(ticket.status)}
                <div>
                  <div className="font-medium">{ticket.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {ticket.id} • {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${getPriorityClass(ticket.priority)}`}>
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    ticket.status === "open"
                      ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-800 dark:text-amber-400"
                      : ticket.status === "in-progress"
                        ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-800 dark:text-blue-400"
                        : "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-800 dark:text-green-400"
                  }`}
                >
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </span>
              </div>
            </div>

            {expandedTicket === ticket.id && (
              <div className="mt-4 space-y-4">
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-900" : "bg-white"} shadow-sm`}>
                  <p className="text-sm">{ticket.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Assigned To</div>
                    <div className="text-sm font-medium">{ticket.assignedTo}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Last Updated</div>
                    <div className="text-sm font-medium">{new Date(ticket.updatedAt).toLocaleString()}</div>
                  </div>
                </div>

                {ticket.resolution && (
                  <div>
                    <div className="text-xs text-muted-foreground">Resolution</div>
                    <div className="text-sm mt-1">{ticket.resolution}</div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {ticket.status === "open" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
                      >
                        Add Comment
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm hover:shadow-md transition-all"
                      >
                        Contact Support
                      </Button>
                    </>
                  )}
                  {ticket.status === "resolved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
                    >
                      Reopen Ticket
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg shadow-sm">
          <p className="text-muted-foreground">No tickets found</p>
        </div>
      )}

      <div className="flex justify-center mt-4">
        <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm hover:shadow-md transition-all">
          Create New Support Ticket
        </Button>
      </div>
    </div>
  )
}
