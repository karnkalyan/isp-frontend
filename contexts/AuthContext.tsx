"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api";

export interface UserBranch {
  id: number;
  userId: number;
  branchId: number;
  branch: {
    id: number;
    name: string;
    code: string;
    isActive: boolean;
    parentId?: number | null;
    [key: string]: any;
  };
}

export interface UserRole {
  id: number;
  name: string;
  permissions: { id: number; name: string; menuName: string }[];
}

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  roleId: number | null;
  role: UserRole | null;
  status: string;
  ispId: number | null;
  branchId: number | null;
  branch: any | null;
  userBranches: UserBranch[];
  profilePicture: string | null;
  department?: { id: number; name: string } | null;
  [key: string]: any;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u);
    if (typeof window !== "undefined") {
      const isRemembered = localStorage.getItem("remember-me") === "true";
      if (u) {
        if (isRemembered) {
          localStorage.setItem("user", JSON.stringify(u));
          sessionStorage.removeItem("user");
        } else {
          sessionStorage.setItem("user", JSON.stringify(u));
          localStorage.removeItem("user");
        }
      } else {
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiRequest<{ user: AuthUser }>("/auth/me");
      if (data?.user) {
        setUser(data.user);
      }
    } catch (err) {
      // If /me fails (401), user is not authenticated
      console.warn("Auth refresh failed:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!permission) return true;
      if (!user?.role?.permissions) return false;
      return user.role.permissions.some((p) => p.name === permission);
    },
    [user]
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("selected-branch-id");
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
  }, [setUser]);

  // On mount: try storage first, then validate via /me
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isRemembered = localStorage.getItem("remember-me") === "true";
      const stored = isRemembered
        ? localStorage.getItem("user")
        : sessionStorage.getItem("user");
      if (stored) {
        try {
          setUserState(JSON.parse(stored));
        } catch {
          // Invalid JSON, clear it
          localStorage.removeItem("user");
          sessionStorage.removeItem("user");
        }
      }
    }
    // Always verify with server
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, setUser, refreshUser, hasPermission, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
