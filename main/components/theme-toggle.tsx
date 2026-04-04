"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useCallback } from "react"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Memoize the toggle function to prevent unnecessary re-renders
  const toggleTheme = useCallback(() => {
    // Determine the new theme
    const newTheme = resolvedTheme === "dark" ? "light" : "dark"

    // Add a class to disable transitions during theme change
    document.documentElement.classList.add("disable-transitions")

    // Apply theme change immediately to DOM before React updates
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(newTheme)
    document.documentElement.style.colorScheme = newTheme

    // Apply theme-specific CSS variables directly for immediate visual feedback
    if (newTheme === "dark") {
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

    // Force a repaint to ensure immediate visual update
    const repaint = document.body.offsetHeight

    // Update localStorage for persistence
    localStorage.setItem("theme", newTheme)

    // Then update the theme state
    setTheme(newTheme)

    // Re-enable transitions after a short delay
    setTimeout(() => {
      document.documentElement.classList.remove("disable-transitions")
    }, 10)
  }, [resolvedTheme, setTheme])

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <div className="h-5 w-5 bg-muted rounded-full" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="transition-all duration-300"
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
