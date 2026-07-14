"use client"

import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { AdminDashboard } from "./variants/AdminDashboard"
import { SupportDashboard } from "./variants/SupportDashboard"
import { MarketingDashboard } from "./variants/MarketingDashboard"
import { TechnicalDashboard } from "./variants/TechnicalDashboard"
import { FieldDashboard } from "./variants/FieldDashboard"
import { CustomerDashboard } from "./variants/CustomerDashboard"
import { Loader2 } from "lucide-react"

export function RoleBasedDashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const roleName = user?.role?.name?.toLowerCase() || ""

  // Route to specific dashboards based on role
  if (roleName === "administrator" || roleName === "global manager" || roleName === "branch admin") {
    return <AdminDashboard />
  }

  if (roleName === "support" || roleName === "global support" || roleName === "branch support" || roleName === "support agent") {
    return <SupportDashboard />
  }

  if (roleName === "marketing" || roleName === "global marketing" || roleName === "branch marketing" || roleName === "marketing specialist") {
    return <MarketingDashboard />
  }

  if (roleName === "technical" || roleName === "global technical" || roleName === "branch technical" || roleName === "network engineer") {
    return <TechnicalDashboard />
  }

  if (roleName === "field staff" || roleName === "global field staff" || roleName === "branch field staff") {
    return <FieldDashboard />
  }

  if (roleName === "customer") {
    return <CustomerDashboard />
  }

  // Default fallback
  return <AdminDashboard />
}
