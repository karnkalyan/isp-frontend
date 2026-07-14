"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { AccountingDashboard } from "@/components/accounting/accounting-dashboard"
export default function NepurixPage() { return <DashboardLayout><div className="space-y-6"><PageHeader title="Nepurix Accounting" description="Live customers, items, and sales invoices"/><AccountingDashboard provider="NEPURIX"/></div></DashboardLayout> }
