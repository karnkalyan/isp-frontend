"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Menu, Search, X, Headset } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { SearchModal } from "@/components/layout/search-modal";
import { MessagesDropdown } from "@/components/layout/messages-dropdown";
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown";
import { InquiryDialog } from "@/components/layout/inquery";
import { BranchSwitcher } from "@/components/layout/branch-switcher";
import { apiRequest } from "@/lib/api";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const [activeCallsCount, setActiveCallsCount] = useState(0);
  const { on } = useWebSocket();
  const { user } = useAuth();
  const assignedExtension = String(user?.yeastarExt || user?.extId || "").trim();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check active calls and open inquiry on realtime call events
  useEffect(() => {
    const checkActiveCalls = async () => {
      try {
        const response = await apiRequest<any>(`/yeaster/calls/my-extension`, { method: "GET" });
        const count = (response?.data?.calllist || []).reduce(
          (total: number, item: any) => total + (item.numbercalls?.length || 0),
          0
        );
        setActiveCallsCount(count);
      } catch (error) {
        console.error("Failed to fetch active calls:", error);
        setActiveCallsCount(0);
      }
    };

    checkActiveCalls();

    const handleCallEvent = (event: any) => {
      const eventType = String(event?.eventType || event?.data?.event || "").toLowerCase();
      if (!["callstatus", "newcdr", "forward", "tranfer", "transfer", "callfailed"].includes(eventType)) return;

      const members = event?.data?.members || [];
      const isForMe = assignedExtension && members.some((member: any) =>
        String(member.ext?.number || "") === assignedExtension ||
        String(member.inbound?.to || "") === assignedExtension ||
        String(member.inbound?.callpath || "") === assignedExtension ||
        String(member.outbound?.from || "") === assignedExtension ||
        String(member.outbound?.to || "") === assignedExtension
      );
      if (!isForMe) return;

      const statuses = members.flatMap((member: any) => [
        member.ext?.memberstatus,
        member.inbound?.memberstatus,
        member.outbound?.memberstatus,
      ].filter(Boolean));
      const ended = eventType === "newcdr" || statuses.some((status: string) => String(status).toUpperCase() === "BYE");
      setActiveCallsCount(prev => ended ? Math.max(0, prev - 1) : Math.max(1, prev));
      setInquiryDialogOpen(true);
      checkActiveCalls();
    };

    const unsubscribeStatus = on("yeastar.call.status", handleCallEvent);
    const unsubscribeEvent = on("yeastar.event", handleCallEvent);

    return () => {
      unsubscribeStatus();
      unsubscribeEvent();
    };
  }, [on, assignedExtension]);

  const handleOpenChange = (open: boolean) => {
    setSearchModalOpen(open);
    if (!open) setSearchQuery("");
  };

  // Derive styles from resolvedTheme — no MutationObserver needed.
  // During SSR / before mount, default to light so server & client match.
  const isDark = mounted && resolvedTheme === "dark";

  const headerStyle: React.CSSProperties = {
    background: isDark
      ? "linear-gradient(to right, rgba(13, 17, 31, 0.8), rgba(20, 24, 44, 0.8))"
      : "linear-gradient(to right, rgba(255, 255, 255, 0.8), rgba(240, 245, 255, 0.8))",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: isDark
      ? "1px solid rgba(255, 255, 255, 0.05)"
      : "1px solid rgba(0, 0, 0, 0.05)",
    boxShadow: isDark
      ? "0 4px 30px rgba(0, 0, 0, 0.1)"
      : "0 4px 30px rgba(0, 0, 0, 0.05)",
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full glass-navbar"
        style={headerStyle}
        suppressHydrationWarning
      >
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Toggle menu">
              <Menu className="h-5 w-5" />
            </Button>
            <BranchSwitcher className="hidden lg:flex" />
          </div>

          {/* Search */}
          <div className={`${showSearch ? "flex" : "hidden md:flex"} flex-1 items-center px-2 md:px-4 max-w-md ml-4`}>
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              <Input
                type="search"
                placeholder="Search customers, invoices, devices..."
                className="w-full h-9 rounded-full pl-10 pr-12 focus-visible:ring-primary/50 border-border/50 bg-background/30 backdrop-blur-sm transition-all duration-200 group-hover:bg-background/50 group-hover:border-primary/30"
                onClick={() => setSearchModalOpen(true)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setSearchModalOpen(true)}
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
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
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
              onClick={() => setInquiryDialogOpen(true)}
              aria-label="Call Inquiry"
              title="Call Inquiry"
            >
              <Headset className="h-5 w-5" />
              {activeCallsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-[9px] text-white items-center justify-center">
                    {activeCallsCount > 9 ? "9+" : activeCallsCount}
                  </span>
                </span>
              )}
            </Button>

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

            <MessagesDropdown className="hidden md:flex" />
            <NotificationsDropdown className="hidden md:flex" />
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>

      <SearchModal open={searchModalOpen} onOpenChange={handleOpenChange} initialQuery={searchQuery} />

      <InquiryDialog
        open={inquiryDialogOpen}
        onOpenChange={setInquiryDialogOpen}
        onCallsCountChange={setActiveCallsCount}
      />
    </>
  );
}
