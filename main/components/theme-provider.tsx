"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useEffect } from "react"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Apply theme immediately on mount
  useEffect(() => {
    // Add a class to indicate JS is loaded
    document.documentElement.classList.add("js-loaded")
    document.documentElement.classList.remove("no-js")

    // Check for stored theme or system preference immediately
    const storedTheme = localStorage.getItem("theme")
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    // Apply dark mode immediately if needed
    if (storedTheme === "dark" || (!storedTheme && systemPrefersDark)) {
      document.documentElement.classList.add("dark")
      document.documentElement.style.setProperty("--theme-bg", "#0b1120")
      document.documentElement.style.setProperty("--theme-text", "#f9fafb")
      document.documentElement.style.setProperty("--theme-card", "#1e293b")
      document.documentElement.style.setProperty("--theme-card-foreground", "#f9fafb")
      document.documentElement.style.setProperty("--theme-border", "#334155")
      document.documentElement.style.setProperty("--theme-muted", "#334155")
      document.documentElement.style.setProperty("--theme-muted-foreground", "#94a3b8")
      document.body.style.backgroundColor = "#0b1120"
      document.body.style.color = "#f9fafb"
    }

    // Apply theme immediately
    const applyTheme = () => {
      const isDark = document.documentElement.classList.contains("dark")

      // Apply theme-specific CSS variables directly for immediate visual feedback
      if (isDark) {
        document.documentElement.style.setProperty("--theme-bg", "#0b1120")
        document.documentElement.style.setProperty("--theme-text", "#f9fafb")
        document.documentElement.style.setProperty("--theme-card", "#1e293b")
        document.documentElement.style.setProperty("--theme-card-foreground", "#f9fafb")
        document.documentElement.style.setProperty("--theme-border", "#334155")
        document.documentElement.style.setProperty("--theme-muted", "#334155")
        document.documentElement.style.setProperty("--theme-muted-foreground", "#94a3b8")
        document.body.style.backgroundColor = "#0b1120"
        document.body.style.color = "#f9fafb"
      } else {
        document.documentElement.style.setProperty("--theme-bg", "#f9fafb")
        document.documentElement.style.setProperty("--theme-text", "#111827")
        document.documentElement.style.setProperty("--theme-card", "#ffffff")
        document.documentElement.style.setProperty("--theme-card-foreground", "#111827")
        document.documentElement.style.setProperty("--theme-border", "#e2e8f0")
        document.documentElement.style.setProperty("--theme-muted", "#f1f5f9")
        document.documentElement.style.setProperty("--theme-muted-foreground", "#64748b")
        document.body.style.backgroundColor = "#f9fafb"
        document.body.style.color = "#111827"
      }
    }

    // Apply theme immediately
    applyTheme()

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          mutation.target === document.documentElement
        ) {
          applyTheme()
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
