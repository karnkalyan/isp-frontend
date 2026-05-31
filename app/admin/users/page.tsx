"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { UserManagement } from "@/components/admin/user-management"
import { useAuth } from "@/contexts/AuthContext"


export default function UsersPage() {
  const router = useRouter()
  const { loading, hasPermission } = useAuth()
  const canReadUsers = hasPermission("users_read")

  useEffect(() => {
    if (!loading && !canReadUsers) {
      router.replace("/")
    }
  }, [canReadUsers, loading, router])

  if (loading || !canReadUsers) {
    return null
  }

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system users, roles, and permissions"
        actions={[
          {
            label: "Add User",
            href: "#add-user",
          },
        ]}
      />
      <UserManagement />
    </div>
  )
}
