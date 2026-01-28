"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Menu, Search, X, MessageSquare, Phone, Headset } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/layout/user-nav"
import { SearchModal } from "@/components/layout/search-modal"
import { MessagesDropdown } from "@/components/layout/messages-dropdown"
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown"
import { Badge } from "@/components/ui/badge"
import { InquiryDialog } from "@/components/layout/inquery"

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false)
  const [activeCallsCount, setActiveCallsCount] = useState(0)

  // Check for dark mode
  useEffect(() => {
    // Initial check
    setIsDarkMode(document.documentElement.classList.contains("dark"))

    // Set up observer for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"))
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  // Add keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchModalOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Periodically check for active calls
  useEffect(() => {
    const checkActiveCalls = async () => {
      try {
        // You can add API call here to get active calls count
        // For now, we'll simulate with random count
        // const response = await apiRequest(`/yeaster/extensionQuery`, { method: 'GET' })
        // if (response?.data?.calllist) {
        //   setActiveCallsCount(response.data.calllist.length)
        // }
      } catch (error) {
        console.error("Failed to fetch active calls:", error)
      }
    }

    // Initial check
    checkActiveCalls()

    // Check every 30 seconds if inquiry dialog is not open
    const interval = setInterval(() => {
      if (!inquiryDialogOpen) {
        checkActiveCalls()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [inquiryDialogOpen])

  const handleSearchClick = () => {
    setSearchModalOpen(true)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchModalOpen(true)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setSearchModalOpen(open)
    if (!open) {
      setSearchQuery("")
    }
  }

  // Handler for Inquiry button
  const handleInquiryClick = () => {
    setInquiryDialogOpen(true)
  }

  // New handler for Call button
  const handleCallClick = () => {
    alert("Call button clicked! This could initiate a call or show a call dialog.")
    // You can replace this with actual functionality like:
    // - Opening a call dialog
    // - Triggering a VoIP call
    // - Showing a list of contacts to call
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full glass-navbar"
        style={{
          background: isDarkMode
            ? "linear-gradient(to right, rgba(13, 17, 31, 0.8), rgba(20, 24, 44, 0.8))"
            : "linear-gradient(to right, rgba(255, 255, 255, 0.8), rgba(240, 245, 255, 0.8))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: isDarkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: isDarkMode ? "0 4px 30px rgba(0, 0, 0, 0.1)" : "0 4px 30px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Toggle menu">
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Search - compact version */}
          <div className={`${showSearch ? "flex" : "hidden md:flex"} flex-1 items-center px-2 md:px-4 max-w-md ml-4`}>
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              <Input
                type="search"
                placeholder="Search customers, invoices, devices..."
                className="w-full h-9 rounded-full pl-10 pr-12 focus-visible:ring-primary/50 border-border/50 bg-background/30 backdrop-blur-sm transition-all duration-200 group-hover:bg-background/50 group-hover:border-primary/30"
                onClick={handleSearchClick}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-10 top-1/2 -translate-y-1/2 h-7 w-7 opacity-70 hover:opacity-100"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Inquiry Button */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex relative"
              onClick={handleInquiryClick}
              aria-label="Call Inquiry"
              title="Call Inquiry"
            >
              <Headset className="h-5 w-5" />
              {activeCallsCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="sr-only">{activeCallsCount} active calls</span>
                </>
              )}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </Button>

            {/* Call Button */}
            {/* <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={handleCallClick}
              aria-label="Make a call"
              title="Make a call"
            >
              <Phone className="h-5 w-5" />
            </Button> */}

            {/* Mobile search toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowSearch(!showSearch)}
              aria-label={showSearch ? "Close search" : "Open search"}
            >
              {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            {/* Notification icons - hidden on mobile */}
            <MessagesDropdown className="hidden md:flex" />
            <NotificationsDropdown className="hidden md:flex" />

            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>

      <SearchModal open={searchModalOpen} onOpenChange={handleOpenChange} initialQuery={searchQuery} />
      
      {/* Inquiry Dialog */}
      <InquiryDialog 
        open={inquiryDialogOpen} 
        onOpenChange={setInquiryDialogOpen}
        onCallsCountChange={setActiveCallsCount}
      />
    </>
  )
}