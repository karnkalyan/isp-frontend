"use client"

import { PageHeader } from "@/components/ui/page-header"
import { RolesList } from "@/components/admin/roles-list"
import { RolePermissionsMatrix } from "@/components/admin/role-permissions-matrix"
import { useState } from "react"

export default function UserRolesPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRoleSelect = (roleId: number | null) => {
    setSelectedRoleId(roleId)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Roles & Permissions"
        description="Manage user roles and assign permissions"
        actions={[
          { 
            label: "Audit Log", 
            href: "/admin/audit-log",
            variant: "outline"
          },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <RolesList 
            key={`roles-${refreshKey}`}
            selectedRoleId={selectedRoleId}
            onRoleSelect={handleRoleSelect}
          />
        </div>
        <div className="md:col-span-7">
          <RolePermissionsMatrix 
            key={`permissions-${refreshKey}`}
            selectedRoleId={selectedRoleId}
          />
        </div>
      </div>
    </div>
  )
}