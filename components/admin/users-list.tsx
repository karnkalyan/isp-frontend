  "use client"

  import { useState } from "react"
  import { DataTable } from "@/components/ui/data-table"
  import type { User } from "@/components/admin/user-management"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { Eye, Edit, Trash2, Search } from "lucide-react"
  import { Badge } from "@/components/ui/badge"
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
  import { format } from "date-fns"

  interface Option {
    label: string
    value: string
  }

  interface UsersListProps {
    users: User[]
    roleOptions: Option[]
    departmentOptions: Option[]
    onView: (user: User) => void
    onEdit: (user: User) => void
    onDelete: (user: User) => void
    buildAvatarUrl: (avatarPath?: string | null) => string
  }

  export function UsersList({
    users,
    roleOptions,
    departmentOptions,
    onView,
    onEdit,
    onDelete,
    buildAvatarUrl,
  }: UsersListProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const term = searchTerm.toLowerCase()

    const roleToLabel = (value: any) => {
      const str = String(value)
      return roleOptions.find((r) => r.value === str)?.label ?? str
    }

    const deptToLabel = (value: any) => {
      if (value == null) return "-"
      const str = String(value)
      return departmentOptions.find((d) => d.value === str)?.label ?? str
    }

    const filteredUsers = users.filter((user) => {
      const nameMatch  = user.name?.toLowerCase().includes(term)    ?? false
      const emailMatch = user.email?.toLowerCase().includes(term)   ?? false
      const roleMatch  = roleToLabel(user.role).toLowerCase().includes(term)
      const deptMatch  = deptToLabel(user.department).toLowerCase().includes(term)
      return nameMatch || emailMatch || roleMatch || deptMatch
    })
    

    const getInitials = (name: string) =>
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()

    const formatDate = (dateString: string) => {
      if (!dateString || dateString === "-") return "-"
      try {
        return format(new Date(dateString), "MMM d, yyyy")
      } catch {
        return dateString
      }
    }

    const columns = [
      {
        key: "user",
        header: "User",
        cell: (user: User) => (
          <div className="flex items-center gap-3">
            <Avatar>
            <AvatarImage src={buildAvatarUrl(user.avatar)} alt={user.name} />
              <AvatarFallback className="bg-muted text-foreground dark:bg-slate-700 dark:text-slate-100">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-foreground dark:text-slate-100">{user.name}</div>
              <div className="text-sm text-muted-foreground dark:text-slate-400">{user.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "Role",
        cell: (user: User) => <div className="text-foreground dark:text-slate-300">{roleToLabel(user.role)}</div>,
      },
      {
        key: "department",
        header: "Department",
        cell: (user: User) => <div className="text-foreground dark:text-slate-300">{deptToLabel(user.department)}</div>,
      },
      {
        key: "status",
        header: "Status",
        cell: (user: User) => (
          <Badge
            variant={user.status === "active" ? "success" : user.status === "pending" ? "warning" : "destructive"}
            className="capitalize"
          >
            {user.status}
          </Badge>
        ),
      },
      {
        key: "lastLogin",
        header: "Last Login",
        cell: (user: User) => <div className="text-foreground dark:text-slate-300">{formatDate(user.lastLogin)}</div>,
      },
      {
        key: "actions",
        header: "Actions",
        cell: (user: User) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onView(user)} className="h-8 w-8">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(user)} className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(user)}
              className="h-8 w-8 text-destructive hover:text-destructive/90"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ]

    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="w-full pl-9 bg-background dark:bg-slate-800/50 border-input dark:border-0 focus-visible:ring-0 text-foreground dark:text-slate-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <DataTable
          data={filteredUsers}
          columns={columns}
          emptyState={
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground dark:text-slate-400 mb-2">No users found</p>
              <p className="text-sm text-muted-foreground/70 dark:text-slate-500">Try adjusting your search terms</p>
            </div>
          }
        />
      </div>
    )
  }
