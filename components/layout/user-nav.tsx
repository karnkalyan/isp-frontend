"use client"

import { LogOut, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"
import { getDynamicBaseUrl } from "@/lib/api"

export function UserNav() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  const buildAvatarUrl = (avatarPath?: string | null) => {
    const base = getDynamicBaseUrl().replace(/\/+$/, "")
    const pathPart = avatarPath?.replace(/^\/+/, "") ?? ""
    return pathPart ? `${base}/${pathPart}` : "/placeholder.svg"
  }

  if (!user) return null

  const roleName = user.role?.name || "User"
  const branchName = user.branch?.name || null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-8 w-8 rounded-full focus:outline-none" aria-label="User menu">
          <Avatar className="h-8 w-8 border border-border/50 hover:border-primary/50 transition-colors">
            <AvatarImage src={buildAvatarUrl(user.profilePicture)} alt={user.name || "User"} />
            <AvatarFallback className="bg-muted text-foreground dark:bg-slate-700 dark:text-slate-100">
              {getInitials(user.name || "User")}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 glass" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1.5">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {roleName}
              </Badge>
              {branchName && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {branchName}
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-500 focus:text-red-500">
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
