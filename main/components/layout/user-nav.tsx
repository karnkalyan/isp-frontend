"use client"

import { useEffect, useState } from "react"
import { LogOut, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

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

/**
 * Helper to get the correct API URL based on the current browser domain
 */
const getDynamicApiUrl = (endpoint: string) => {
  const hostname = typeof window !== "undefined" ? window.location.hostname : ""
  // Default to Kisan or Env variable
  let base = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.radius.kisan.net.np"

  if (hostname.includes("namaste.net.np")) {
    base = "https://api.radius.namaste.net.np"
  } else if (hostname.includes("kisan.net.np")) {
    base = "https://api.radius.kisan.net.np"
  }
  
  return `${base}${endpoint}`
}

export function UserNav() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userInfoString = localStorage.getItem("user")
    if (userInfoString) {
      setUser(JSON.parse(userInfoString))
    }
  }, [])

  const handleLogout = async () => {
    const loadingToast = toast.loading("Logging out...")
    try {
      // UPDATED: Use dynamic URL instead of process.env
      const res = await fetch(getDynamicApiUrl("/auth/logout"), {
        method: "POST",
        credentials: "include",
      })

      if (!res.ok) throw new Error("Logout failed")

      toast.dismiss(loadingToast)
      localStorage.removeItem("user")
      toast.success("Logged out successfully")
      
      // Redirect to login
      router.push("/login")
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error("Logout failed. Please try again.")
      console.error("Logout error:", error)
    }
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  const buildAvatarUrl = (avatarPath?: string | null) => {
    // UPDATED: Use dynamic URL for profile pictures too
    const base = getDynamicApiUrl("").replace(/\/+$/, "")
    const pathPart = avatarPath?.replace(/^\/+/, "") ?? ""
    return pathPart ? `${base}/${pathPart}` : "/placeholder.svg"
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-8 w-8 rounded-full focus:outline-none" aria-label="User menu">
          <Avatar className="h-8 w-8 border border-border/50 hover:border-primary/50 transition-colors">
            <AvatarImage src={buildAvatarUrl(user.profilePicture)} alt={user.name} />
            <AvatarFallback className="bg-muted text-foreground dark:bg-slate-700 dark:text-slate-100">
              {getInitials(user.name || "User")}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 glass" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard/profile")} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings")} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}