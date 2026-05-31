"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, UserPlus, Target, Loader2 } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { UpcomingFollowUps } from "@/components/dashboard/upcoming-follow-ups"
import { apiRequest } from "@/lib/api"

export function MarketingDashboard() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeads() {
      try {
        const data = await apiRequest('/leads')
        setLeads(data?.data || data || [])
      } catch (error) {
        console.error("Failed to fetch leads:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchLeads()
  }, [])

  const totalLeads = leads.length
  const convertedLeads = leads.filter(l => l.status === 'converted').length
  const newLeads = leads.filter(l => l.status === 'new').length
  const contactedLeads = leads.filter(l => l.status === 'contacted' || l.status === 'negotiation').length
  
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Sales & Growth</h1>
        <p className="text-muted-foreground">Monitor lead generation and customer conversion metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Leads"
          value={loading ? "..." : totalLeads.toString()}
          icon={<UserPlus className="h-4 w-4" />}
          trend={{ value: 24, isPositive: true }}
          description="Pipeline total"
        />
        <StatsCard
          title="Conversion Rate"
          value={loading ? "..." : `${conversionRate}%`}
          icon={<Target className="h-4 w-4" />}
          trend={{ value: 2.1, isPositive: true }}
          description="Lead to customer"
        />
        <StatsCard
          title="Active Marketing"
          value="4"
          icon={<TrendingUp className="h-4 w-4" />}
          description="Running campaigns"
        />
        <StatsCard
          title="Converted Customers"
          value={loading ? "..." : convertedLeads.toString()}
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 4, isPositive: true }}
          description="Successfully onboarded"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : totalLeads === 0 ? (
              <p className="text-muted-foreground">No data for funnel.</p>
            ) : (
              <div className="w-full max-w-md space-y-4">
                <div className="relative h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold">Total Leads ({totalLeads})</span>
                </div>
                <div className="relative h-12 bg-primary/40 rounded-lg flex items-center justify-center mx-4">
                  <span className="text-sm font-bold">New/Raw ({newLeads})</span>
                </div>
                <div className="relative h-12 bg-primary/60 rounded-lg flex items-center justify-center mx-8">
                  <span className="text-sm font-bold">In Progress ({contactedLeads})</span>
                </div>
                <div className="relative h-12 bg-primary rounded-lg flex items-center justify-center mx-12">
                  <span className="text-sm font-bold text-white">Closed/Converted ({convertedLeads})</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="col-span-3">
          <UpcomingFollowUps />
        </div>
      </div>
    </div>
  )
}
