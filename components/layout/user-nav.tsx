"use client"

import { useState } from "react"
import { LogOut, Users, RotateCcw, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiRequest, getDynamicBaseUrl } from "@/lib/api"
import { toast } from "react-hot-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"

export function UserNav() {
  const router = useRouter()
  const { user, impersonating, logout, switchUser, revertToAdmin } = useAuth()
  const [switchOpen, setSwitchOpen] = useState(false)
  const [usersList, setUsersList] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [switching, setSwitching] = useState(false)

  const roleLower = String(user?.role?.name || "").toLowerCase()
  const isAdmin = ["admin", "isp_admin", "administrator", "super_admin", "global admin", "global_admin"].includes(roleLower)

  const openSwitchModal = async () => {
    setSwitchOpen(true)
    setUserSearch("")
    if (usersList.length === 0) {
      try {
        setLoadingUsers(true)
        const res = await apiRequest<any>("/users?excludeCustomers=true")
        const list = Array.isArray(res) ? res : (res?.data || res?.users || [])
        setUsersList(list.filter((u: any) => String(u?.role?.name || u?.role || "").toLowerCase() !== "customer" && !u?.customerId))
      } catch (err: any) {
        toast.error(err?.message || "Failed to load users")
      } finally {
        setLoadingUsers(false)
      }
    }
  }

  const handleSwitchTo = async (targetId: number) => {
    try {
      setSwitching(true)
      await switchUser(targetId)
      setSwitchOpen(false)
    } catch (err: any) {
      toast.error(err?.message || "Failed to switch user")
    } finally {
      setSwitching(false)
    }
  }

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
    <>
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
        {impersonating && (
          <DropdownMenuItem
            onClick={() => revertToAdmin().catch((e: any) => toast.error(e?.message || "Failed to switch back"))}
            className="cursor-pointer text-amber-600 focus:text-amber-600 font-medium"
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Switch Back to Admin</span>
          </DropdownMenuItem>
        )}
        {(isAdmin || impersonating) && (
          <DropdownMenuItem onClick={openSwitchModal} className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Switch User</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-500 focus:text-red-500">
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

      <Dialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Switch User Account</DialogTitle>
            <DialogDescription>
              Log in as another staff/admin user immediately without entering credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, or role..."
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {loadingUsers ? (
                <p className="text-xs text-muted-foreground py-6 text-center md:col-span-2">Loading users...</p>
              ) : (() => {
                const filtered = usersList
                  .filter((u) => Number(u.id) !== Number(user.id))
                  .filter((u) => {
                    const roleStr = String(u.role?.name || u.role || "").toLowerCase()
                    if (roleStr.includes("customer") || roleStr.includes("subscriber")) return false
                    if (u.customer || u.customerId) return false
                    return true
                  })
                  .filter((u) => {
                    const q = userSearch.trim().toLowerCase()
                    if (!q) return true
                    return (
                      String(u.name || "").toLowerCase().includes(q) ||
                      String(u.email || "").toLowerCase().includes(q) ||
                      String(u.role?.name || "").toLowerCase().includes(q)
                    )
                  })
                if (filtered.length === 0) {
                  return <p className="text-xs text-muted-foreground py-6 text-center md:col-span-2">No matching users found.</p>
                }
                return filtered.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-sm truncate">{u.name || u.email}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {u.email} • <span className="font-medium text-primary">{u.role?.name || "User"}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={switching}
                      onClick={() => handleSwitchTo(u.id)}
                      className="h-8 px-3 text-xs shrink-0"
                    >
                      Switch
                    </Button>
                  </div>
                ))
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
