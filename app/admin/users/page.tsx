import { PageHeader } from "@/components/ui/page-header"
import { UserManagement } from "@/components/admin/user-management"


export default function UsersPage() {
  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system users, roles, and permissions"
        actions={[
          {
            label: "Add User",
            href: "#add-user",
            variant: "default",
          },
        ]}
      />
      <UserManagement />
    </div>
  )
}
