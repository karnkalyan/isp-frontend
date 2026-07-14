"use client"

import { useMemo } from "react"
import { Activity, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { ActiveSessions } from "@/components/dashboard/active-sessions"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RealTimeStats } from "@/components/dashboard/real-time-stats"
import { NepaliCalendarWidget } from "@/components/dashboard/nepali-calendar-widget"

export function AdminDashboard() {
  const { user } = useAuth()
  const isGlobal = user?.role?.name === "Administrator" || user?.role?.name === "Global Manager"

  const title = useMemo(() => {
    if (!user) return "Operations overview"
    if (isGlobal && !user.selectedBranchId) return user.isp?.companyName || "Operations overview"
    return `${user.selectedBranch?.name || user.branch?.name || "Branch"} operations`
  }, [isGlobal, user])

  const description = isGlobal && !user?.selectedBranchId
    ? "System-wide customer, revenue, support, and network health."
    : "Customer, task, support, and network health for the selected branch."

  return (
    <div className="space-y-5">
      <header className="relative isolate overflow-hidden rounded-[18px] bg-[#2B0D3A] px-5 py-5 text-white shadow-[0_12px_32px_rgba(43,13,58,.16)] md:px-6 md:py-6">
        <svg aria-hidden="true" viewBox="0 0 760 180" className="pointer-events-none absolute inset-y-0 right-0 -z-10 h-full w-[62%] opacity-45" preserveAspectRatio="none">
          <path d="M20 122 C140 20 215 164 330 70 S540 30 735 112" fill="none" stroke="#76549A" strokeWidth="2" />
          <path d="M55 145 C180 165 225 28 365 116 S570 145 740 48" fill="none" stroke="#E11D72" strokeWidth="2" />
          <path d="M140 35 C255 18 280 142 445 62 S625 75 750 30" fill="none" stroke="#DCCBFF" strokeWidth="1.5" />
          {[['140','35'],['330','70'],['365','116'],['540','47'],['625','75'],['735','112']].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="#F8F7FA" />)}
          <circle cx="225" cy="108" r="7" fill="#E11D72" /><circle cx="445" cy="62" r="7" fill="#E11D72" />
        </svg>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl min-w-0">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[#DCCBFF]">
              <Sparkles className="size-3.5 text-[#E11D72]" />Kashtrix command center
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-white md:text-[30px]">{title}</h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/70">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-white/20 bg-white/10 text-white"><Activity className="size-3.5 text-[#8DD4B2]" />Live system</Badge>
            {user?.role?.name === "Administrator" && <Badge variant="outline" className="gap-1.5 border-white/20 bg-white/10 text-white"><ShieldCheck className="size-3.5" />Administrator</Badge>}
            <Link href="/dashboard/real-time" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-[#2B0D3A] transition-colors hover:bg-[#F4EEFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              Network console <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <StatsCards />

      <section className="grid items-start gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8"><RevenueChart /></div>
        <div className="grid gap-4 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
          <Card>
            <CardHeader><CardTitle>Quick actions</CardTitle><CardDescription>Common operational workflows</CardDescription></CardHeader>
            <CardContent><QuickActions /></CardContent>
          </Card>
          <NepaliCalendarWidget />
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7"><ActiveSessions /></div>
        <div className="xl:col-span-5"><ActivityFeed /></div>
      </section>

      <Card>
        <CardHeader className="border-b"><CardTitle>Infrastructure health</CardTitle><CardDescription>OLT availability and network capacity</CardDescription></CardHeader>
        <CardContent className="pt-4"><RealTimeStats /></CardContent>
      </Card>
    </div>
  )
}
