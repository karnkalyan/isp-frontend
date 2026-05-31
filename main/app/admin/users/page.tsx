"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { UserManagement } from "@/components/admin/user-management"


export default function UsersPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let canReadUsers = false
    const stored = localStorage.getItem("user")

    try {
      const user = stored ? JSON.parse(stored) : null
      canReadUsers = Boolean(user?.role?.permissions?.some((permission: any) => permission.name === "users_read"))
    } catch {
      canReadUsers = false
    }

    if (!canReadUsers) {
      router.replace("/")
    } else {
      setAllowed(true)
    }

    setChecked(true)
  }, [router])

  if (!checked || !allowed) {
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
