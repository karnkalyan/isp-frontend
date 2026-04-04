"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Theme handling (your existing code)…
  useEffect(() => {
    setMounted(true);
    const checkDarkMode = () => {
      const dark = document.documentElement.classList.contains("dark");
      setIsDarkMode(dark);
      document.body.style.backgroundColor = dark ? "#0b1120" : "#f9fafb";
      document.body.style.color = dark ? "#f9fafb" : "#111827";
    };
    checkDarkMode();
    const obs = new MutationObserver(checkDarkMode);
    obs.observe(document.documentElement, { attributes: true });
    return () => obs.disconnect();
  }, []);

  // Sidebar / mobile handling (your existing code)…
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
    if (mounted) {
      const saved = localStorage.getItem("sidebar-state");
      if (saved) setSidebarOpen(saved === "open");
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem("sidebar-state", sidebarOpen ? "open" : "closed");
  }, [sidebarOpen, mounted]);

  const bgClass = isDarkMode ? "bg-[#0b1120]" : "bg-gray-50";

  return (
    <div className={`flex h-full ${bgClass}`} data-theme={isDarkMode ? "dark" : "light"}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
        {isMobile && <BottomNav />}
      </div>
    </div>
  );
}
