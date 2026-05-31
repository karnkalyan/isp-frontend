"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

const pathPermissionMap: Record<string, string> = {
  "/admin/users": "users_read",
  "/admin/roles": "roles_read",
  "/customers": "customer_read",
  "/branch": "branches_read",
  "/department": "departments_read",
  "/membership": "membership_read",
  "/leads": "lead_read",
  "/existing-isp": "existingisp_read",
  "/sms-campaign": "lead_read",
  "/tr069": "olt_read",
  "/nas": "nas_read",
  "/fiber/olt": "olt_read",
  "/fiber/ont": "olt_read",
  "/fiber/map": "olt_read",
  "/inventory": "isp_read",
  "/inventory/bulk": "bulk_inventory_read",
  "/drums": "drums_read",
  "/finance/recharge": "billing_read_self",
  "/finance/renew": "billing_read_self",
  "/finance/invoices": "billing_read_self",
  "/finance/invoice-ranges": "billing_update",
  "/tasks": "tasks_read_self",
  "/tickets": "tickets_read_self",
  "/dashboard/settings": "settings_read",
  "/master-settings": "settings_read",
  "/reports": "reports_read",
  "/admin/audit-log": "audit_log_read",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(true);

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

  useEffect(() => {
    if (loading || !mounted) return;

    // Guard matching paths
    const keys = Object.keys(pathPermissionMap).sort((a, b) => b.length - a.length);
    const matchedKey = keys.find(key => pathname === key || pathname.startsWith(key + "/"));

    if (matchedKey) {
      const permission = pathPermissionMap[matchedKey];
      if (!hasPermission(permission)) {
        setIsAuthorized(false);
        toast.error("Access Denied: You do not have permission to view this page.");
        router.push("/");
        return;
      }
    }
    setIsAuthorized(true);
  }, [pathname, user, loading, router, hasPermission, mounted]);

  return (
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
          {isAuthorized ? children : <div className="flex items-center justify-center h-full">Redirecting...</div>}
        </main>
        {isMobile && <BottomNav />}
      </div>
    </div>
  );
}