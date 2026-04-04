"use client"

import { StatsDisplay } from "@/components/ui/stats-display"
import { DollarSign, CreditCard, AlertTriangle, CheckCircle } from "lucide-react"

export function InvoiceSummary() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsDisplay
        title="Total Revenue"
        value="$24,567.89"
        icon={<DollarSign className="h-5 w-5 text-white" />}
        iconColor="#3B82F6"
        change={{ value: 12.5, type: "increase" }}
        subtitle="This month"
      />
      <StatsDisplay
        title="Pending"
        value="$3,452.00"
        icon={<CreditCard className="h-5 w-5 text-white" />}
        iconColor="#F59E0B"
        change={{ value: 2.4, type: "increase" }}
        subtitle="8 invoices"
      />
      <StatsDisplay
        title="Overdue"
        value="$1,890.65"
        icon={<AlertTriangle className="h-5 w-5 text-white" />}
        iconColor="#EF4444"
        change={{ value: 5.1, type: "decrease" }}
        subtitle="3 invoices"
      />
      <StatsDisplay
        title="Paid"
        value="$19,225.24"
        icon={<CheckCircle className="h-5 w-5 text-white" />}
        iconColor="#10B981"
        change={{ value: 18.3, type: "increase" }}
        subtitle="42 invoices"
      />
    </div>
  )
}
