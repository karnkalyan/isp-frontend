"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Read the real theme only after hydration — this is the correct moment.
    const dark = document.documentElement.classList.contains("dark");
    setIsDarkMode(dark);
    setMounted(true);

    document.body.style.backgroundColor = dark ? "#0b1120" : "#f9fafb";
    document.body.style.color = dark ? "#f9fafb" : "#111827";

    const obs = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
      document.body.style.backgroundColor = isDark ? "#0b1120" : "#f9fafb";
      document.body.style.color = isDark ? "#f9fafb" : "#111827";
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const resize = () => {
      setIsMobile(window.innerWidth < 768);
      setSidebarOpen(window.innerWidth >= 1024);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem("sidebar-state");
    if (saved) setSidebarOpen(saved === "open");
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sidebar-state", sidebarOpen ? "open" : "closed");
  }, [sidebarOpen, mounted]);

  return (
    // suppressHydrationWarning tells React "I know this div will differ between
    // server and client — don't warn, don't try to patch it up."
    // The inline style sets the background instantly via CSS variable (already
    // set by your layout.tsx inline script), so there's zero visible flash.
    <div
      className="flex h-full"
      style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}
      data-theme={mounted ? (isDarkMode ? "dark" : "light") : undefined}
      suppressHydrationWarning
    >
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
        {isMobile && <BottomNav />}
      </div>
    </div>
  );
}