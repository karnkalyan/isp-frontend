"use client"

import { Button } from "@/components/ui/button"
import type { User } from "@/components/admin/user-management"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { ArrowLeft, Edit } from "lucide-react"

interface Option {
  label: string
  value: string
}

interface UserDetailsProps {
  user: User
  roles: Option[]
  departments: Option[]
  onEdit: () => void
  onBack: () => void
  buildAvatarUrl: (avatarPath?: string | null) => string;
}

export function UserDetails({ user, roles, departments, onEdit, onBack, buildAvatarUrl }: UserDetailsProps) {
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "-") return "-"
    try {
      return format(new Date(dateString), "PPpp")
    } catch {
      return dateString
    }
  }

  // Build the full avatar URL

  // Map raw values to labels
  const roleLabel = roles.find((r) => r.value === String(user.role))?.label ?? String(user.role)
  const deptLabel =
    departments.find((d) => d.value === String(user.department))?.label ?? user.department ?? "-"

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4 p-0 hover:bg-transparent">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Users
      </Button>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col items-center md:items-start">
          <Avatar className="h-24 w-24">
            <AvatarImage src={buildAvatarUrl(user.avatar)} alt={user.name} />
            <AvatarFallback className="bg-muted text-foreground dark:bg-slate-700 dark:text-slate-100 text-2xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="mt-4 text-center md:text-left">
            <h3 className="text-xl font-bold text-foreground dark:text-slate-100">{user.name}</h3>
            <p className="text-muted-foreground dark:text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground dark:text-slate-400 mb-1">Role</h4>
              <p className="text-foreground dark:text-slate-100">{roleLabel}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground dark:text-slate-400 mb-1">Department</h4>
              <p className="text-foreground dark:text-slate-100">{deptLabel}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground dark:text-slate-400 mb-1">Status</h4>
              <Badge
                variant={
                  user.status === "active"
                    ? "success"
                    : user.status === "pending"
                    ? "warning"
                    : "destructive"
                }
                className="capitalize"
              >
                {user.status}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground dark:text-slate-400 mb-1">Last Login</h4>
              <p className="text-foreground dark:text-slate-100">{formatDate(user.lastLogin)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground dark:text-slate-400 mb-1">Created At</h4>
              <p className="text-foreground dark:text-slate-100">{formatDate(user.createdAt)}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">Permissions</h4>
            <div className="flex flex-wrap gap-2">
              {user.permissions && user.permissions.length > 0 ? (
                user.permissions.map((permission) => (
                  <Badge
                    key={permission}
                    variant="outline"
                    className="bg-muted dark:bg-slate-800 border-border dark:border-slate-700"
                  >
                    {permission}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground dark:text-slate-400">No permissions assigned</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onEdit} className="flex items-center">
          <Edit className="h-4 w-4 mr-2" />
          Edit User
        </Button>
      </div>
    </div>
  )
}
