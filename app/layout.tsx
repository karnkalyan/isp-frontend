import type React from "react";
import type { Metadata } from "next";
import Script from "next/script";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

export const metadata: Metadata = {
  title: "Radius Manager - ISP Dashboard",
  description: "ISP Management Dashboard",
  generator: "Simulcast Technologies Pvt Ltd",
  applicationName: "ISP Manager",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  let theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    localStorage.setItem('theme', theme);
                  }

                  var root = document.documentElement;
                  if (theme === 'dark') {
                    root.classList.add('dark');
                    root.style.colorScheme = 'dark';
                    root.style.setProperty('--theme-bg', '#0b1120');
                    root.style.setProperty('--theme-text', '#f9fafb');
                    root.style.setProperty('--theme-card', '#1e293b');
                    root.style.setProperty('--theme-card-foreground', '#f9fafb');
                    root.style.setProperty('--theme-border', '#334155');
                    root.style.setProperty('--theme-muted', '#334155');
                    root.style.setProperty('--theme-muted-foreground', '#94a3b8');
                  } else {
                    root.classList.remove('dark');
                    root.style.colorScheme = 'light';
                    root.style.setProperty('--theme-bg', '#f9fafb');
                    root.style.setProperty('--theme-text', '#111827');
                    root.style.setProperty('--theme-card', '#ffffff');
                    root.style.setProperty('--theme-card-foreground', '#111827');
                    root.style.setProperty('--theme-border', '#e2e8f0');
                    root.style.setProperty('--theme-muted', '#f1f5f9');
                    root.style.setProperty('--theme-muted-foreground', '#64748b');
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
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WebSocketProvider>
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
          </WebSocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}