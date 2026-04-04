"use client"

import { useState } from "react"
import { Bell, Mail, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2 md:gap-4">
          <SidebarTrigger className="md:hidden" />
          <div className="hidden md:block">
            <span className="text-xl font-bold bg-gradient-to-r from-green-500 via-blue-500 to-green-500 bg-clip-text text-transparent">
              Simul ISP
            </span>
          </div>
        </div>

        <div className={`${searchOpen ? "flex" : "hidden md:flex"} flex-1 items-center px-2 md:px-4`}>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-full bg-background/60 pl-8 pr-4 focus-visible:ring-primary/50 glass-bg"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative md:hidden" onClick={() => setSearchOpen(!searchOpen)}>
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="icon" className="relative hidden md:flex">
            <Mail className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              3
            </span>
          </Button>

          <Button variant="ghost" size="icon" className="relative hidden md:flex">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white">
              5
            </span>
          </Button>

          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
