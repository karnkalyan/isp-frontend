"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { useEffect, useState } from "react";

function applyThemeStyles(isDark: boolean) {
  const root = document.documentElement;

  root.classList.add("js-loaded");
  root.classList.remove("no-js");

  if (isDark) {
    root.style.colorScheme = "dark";
    root.style.setProperty("--theme-bg", "#0b1120");
    root.style.setProperty("--theme-text", "#f9fafb");
    root.style.setProperty("--theme-card", "#1e293b");
    root.style.setProperty("--theme-card-foreground", "#f9fafb");
    root.style.setProperty("--theme-border", "#334155");
    root.style.setProperty("--theme-muted", "#334155");
    root.style.setProperty("--theme-muted-foreground", "#94a3b8");
    document.body.style.backgroundColor = "#0b1120";
    document.body.style.color = "#f9fafb";
  } else {
    root.style.colorScheme = "light";
    root.style.setProperty("--theme-bg", "#f9fafb");
    root.style.setProperty("--theme-text", "#111827");
    root.style.setProperty("--theme-card", "#ffffff");
    root.style.setProperty("--theme-card-foreground", "#111827");
    root.style.setProperty("--theme-border", "#e2e8f0");
    root.style.setProperty("--theme-muted", "#f1f5f9");
    root.style.setProperty("--theme-muted-foreground", "#64748b");
    document.body.style.backgroundColor = "#f9fafb";
    document.body.style.color = "#111827";
  }
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const root = document.documentElement;

    const applyTheme = () => {
      const isDark = root.classList.contains("dark");
      applyThemeStyles(isDark);
    };

    // Sync initial theme
    try {
      const storedTheme = localStorage.getItem("theme");

      if (!storedTheme) {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        if (prefersDark) {
          root.classList.add("dark");
          localStorage.setItem("theme", "dark");
        } else {
          root.classList.remove("dark");
          localStorage.setItem("theme", "light");
        }
      }

      applyTheme();
    } catch (error) {
      console.error("Theme initialization failed:", error);
    }

    // Watch for class changes on <html> (next-themes toggles "dark" class)
    const observer = new MutationObserver(() => {
      applyTheme();
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Cross-tab sync
    const onStorageChange = (event: StorageEvent) => {
      if (event.key === "theme") {
        applyTheme();
      }
    };

    window.addEventListener("storage", onStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);

  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}