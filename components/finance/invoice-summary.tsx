"use client"

import { useEffect, useState } from "react"
import { StatsDisplay } from "@/components/ui/stats-display"
import { DollarSign, CreditCard, AlertTriangle, CheckCircle } from "lucide-react"
import { apiRequest } from "@/lib/api"

export function InvoiceSummary() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await apiRequest("/billing/invoices/summary")
        if (res.success) {
          setData(res.summary)
        }
      } catch (err) {
        console.error("Failed to fetch invoice summary:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  const formatNpr = (val: any) => {
    const num = Number(val || 0)
    return new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(num)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsDisplay
        title="Total Revenue"
        value={loading ? "..." : formatNpr(data?.totalRevenue?.value)}
        icon={<DollarSign className="h-5 w-5 text-white" />}
        iconColor="#3B82F6"
        subtitle={loading ? "Loading..." : `${data?.totalRevenue?.count || 0} paid invoices`}
      />
      <StatsDisplay
        title="Pending"
        value={loading ? "..." : formatNpr(data?.pending?.value)}
        icon={<CreditCard className="h-5 w-5 text-white" />}
        iconColor="#F59E0B"
        subtitle={loading ? "Loading..." : `${data?.pending?.count || 0} invoices`}
      />
      <StatsDisplay
        title="Overdue"
        value={loading ? "..." : formatNpr(data?.overdue?.value)}
        icon={<AlertTriangle className="h-5 w-5 text-white" />}
        iconColor="#EF4444"
        subtitle={loading ? "Loading..." : `${data?.overdue?.count || 0} invoices`}
      />
      <StatsDisplay
        title="Paid"
        value={loading ? "..." : formatNpr(data?.paid?.value)}
        icon={<CheckCircle className="h-5 w-5 text-white" />}
        iconColor="#10B981"
        subtitle={loading ? "Loading..." : `${data?.paid?.count || 0} invoices`}
      />
    </div>
  )
}
