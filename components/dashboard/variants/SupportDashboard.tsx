"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Headphones, Ticket, CheckCircle2, Clock, MessageSquare, Loader2 } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function SupportDashboard() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [ticketsRes, tasksRes, usersRes] = await Promise.all([
          apiRequest('/tickets'),
          apiRequest('/tasks'),
          apiRequest('/users')
        ])
        
        setTickets(ticketsRes?.data || ticketsRes || [])
        setTasks(Array.isArray(tasksRes) ? tasksRes : [])
        
        // Filter users for technicians (roles containing tech, field, or support)
        const allUsers = Array.isArray(usersRes) ? usersRes : []
        const techs = allUsers.filter(u => {
          const roleName = String(u.role?.name || '').toLowerCase()
          return roleName.includes('tech') || roleName.includes('field') || roleName.includes('support')
        })
        
        // Only show technicians in the same branch if applicable
        const branchTechs = user?.branchId ? techs.filter(t => t.branchId === user.branchId || !t.branchId) : techs
        setTechnicians(branchTechs)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  const openTickets = tickets.filter(t => t.status === 'OPEN').length
  const criticalTickets = tickets.filter(t => t.priority === 'CRITICAL').length
  
  // Calculate SLA Compliance (resolved tickets within 24 hours)
  const slaCompliance = useMemo(() => {
    const resolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED')
    if (resolved.length === 0) return 100 // Default if no resolved tickets
    
    let metSla = 0
    resolved.forEach(t => {
      const created = new Date(t.createdAt).getTime()
      const resolvedAt = t.resolvedAt ? new Date(t.resolvedAt).getTime() : new Date(t.updatedAt).getTime()
      const diffHours = (resolvedAt - created) / (1000 * 60 * 60)
      if (diffHours <= 24) metSla++
    })
    return ((metSla / resolved.length) * 100).toFixed(1)
  }, [tickets])

  const activeTasks = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PENDING').length

  // Determine technician status based on tasks
  const technicianStatuses = useMemo(() => {
    return technicians.map(tech => {
      const techTasks = tasks.filter(t => t.assignedToId === tech.id)
      const hasActive = techTasks.some(t => t.status === 'IN_PROGRESS')
      return {
        ...tech,
        status: hasActive ? 'On Site' : 'Available',
        statusColor: hasActive ? 'bg-amber-500' : 'bg-green-500'
      }
    })
  }, [technicians, tasks])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
        <p className="text-muted-foreground">Manage customer inquiries and ticket resolution efficiency.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Open Tickets"
          value={loading ? "..." : openTickets.toString()}
          icon={<Ticket className="h-4 w-4" />}
          trend={{ value: 12, isPositive: false }}
          description="Awaiting technician response"
        />
        <StatsCard
          title="Critical Issues"
          value={loading ? "..." : criticalTickets.toString()}
          icon={<Clock className="h-4 w-4 text-red-500" />}
          trend={{ value: 5, isPositive: false }}
          description="Requires immediate action"
        />
        <StatsCard
          title="SLA Compliance (24h)"
          value={loading ? "..." : `${slaCompliance}%`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          trend={{ value: 0.5, isPositive: true }}
          description="Tickets resolved within 24h"
        />
        <StatsCard
          title="Active Tasks"
          value={loading ? "..." : activeTasks.toString()}
          icon={<Headphones className="h-4 w-4" />}
          description="Tasks in progress or pending"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : tickets.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">No recent tickets found.</div>
            ) : (
              <div className="space-y-4">
                {tickets.slice(0, 5).map((ticket: any) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.ticketNumber} • {ticket.subject?.firstName || ticket.customer?.firstName} {ticket.subject?.lastName || ticket.customer?.lastName}
                        </p>
                      </div>
                    </div>
                    <Badge variant={ticket.priority === 'CRITICAL' ? "destructive" : "outline"}>
                      {ticket.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Technician Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
               <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : technicianStatuses.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm">No technicians found in this branch.</div>
            ) : (
              <div className="space-y-4">
                {technicianStatuses.slice(0, 8).map((tech) => (
                  <div key={tech.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{tech.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{tech.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase">{tech.role?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${tech.statusColor}`} />
                      <span className="text-xs text-muted-foreground">{tech.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
