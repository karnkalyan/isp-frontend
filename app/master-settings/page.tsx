"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { MasterSettingsTabs } from "@/components/master-settings/master-settings-tabs"

export default function MasterSettingsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const isGlobal = useMemo(() => {
    if (!user) return false
    const roleStr = typeof user.role === 'string' ? user.role : (user.role?.name || '')
    const roleName = roleStr.toLowerCase()
    return roleName === 'administrator' || 
           roleName === 'admin' || 
           roleName === 'isp_admin' || 
           roleName === 'super admin' || 
           roleName.startsWith('global')
  }, [user])

  useEffect(() => {
    if (!loading && !isGlobal) {
      router.replace("/")
    }
  }, [isGlobal, loading, router])

  if (loading || !isGlobal) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6 space-y-6">
        <PageHeader
          title="Master Settings"
          description="Configure system-wide settings and service integrations"
        />
        <MasterSettingsTabs />
      </div>
    </DashboardLayout>
  )
}
