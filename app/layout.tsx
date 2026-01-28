import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "react-hot-toast"

// Import the SettingsProvider
// import { SettingsProvider } from "@/contexts/settings-context"

export const metadata: Metadata = {
  title: "Radius Manager - ISP Dashboard",
  description: "ISP Management Dashboard",
  generator: 'Simulcast Technologies Pvt Ltd',
  applicationName: 'ISP Manager'
}

// Update the RootLayout component to wrap children with SettingsProvider
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Critical theme detection script - must be as small and fast as possible */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Get theme from localStorage or system preference
                  let theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    localStorage.setItem('theme', theme);
                  }
                  
                  // Apply theme immediately to prevent flash
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                    document.documentElement.style.setProperty('--theme-bg', '#0b1120');
                    document.documentElement.style.setProperty('--theme-text', '#f9fafb');
                    document.documentElement.style.setProperty('--theme-card', '#1e293b');
                    document.documentElement.style.setProperty('--theme-card-foreground', '#f9fafb');
                    document.documentElement.style.setProperty('--theme-border', '#334155');
                    document.documentElement.style.setProperty('--theme-muted', '#334155');
                    document.documentElement.style.setProperty('--theme-muted-foreground', '#94a3b8');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                    document.documentElement.style.setProperty('--theme-bg', '#f9fafb');
                    document.documentElement.style.setProperty('--theme-text', '#111827');
                    document.documentElement.style.setProperty('--theme-card', '#ffffff');
                    document.documentElement.style.setProperty('--theme-card-foreground', '#111827');
                    document.documentElement.style.setProperty('--theme-border', '#e2e8f0');
                    document.documentElement.style.setProperty('--theme-muted', '#f1f5f9');
                    document.documentElement.style.setProperty('--theme-muted-foreground', '#64748b');
                  }
                } catch (e) {
                  console.error('Theme detection failed:', e);
                }
              })();
            `,
          }}
        />

        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        {/* Leaflet Marker Fix */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />


      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* <SettingsProvider> */}
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--theme-card)",
                color: "var(--theme-card-foreground)",
                border: "1px solid var(--theme-border)",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "white",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "white",
                },
              },
            }}
          />
          {/* </SettingsProvider> */}
        </ThemeProvider>
      </body>
    </html>
  )
}
