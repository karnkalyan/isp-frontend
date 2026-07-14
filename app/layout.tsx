// app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { BranchProvider } from "@/contexts/BranchContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LicenseExpiredModal } from "@/components/license-expired-modal";

export const metadata: Metadata = {
  title: { default: "Kashtrix", template: "%s | Kashtrix" },
  description: "AI-native telecom OSS/BSS and automation platform",
  applicationName: "Kashtrix",
  icons: {
    icon: "/kashtrix-logo/icons-logo.png",
    apple: "/kashtrix-logo/icons-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 
          Use a regular <script> tag via dangerouslySetInnerHTML instead of next/script.
          next/script with beforeInteractive inside <head> in the app router
          can cause SSR issues. A raw inline script is safe because it only
          runs in the browser when the HTML is parsed.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  if (!theme) {
                    theme = 'dark';
                    localStorage.setItem('theme', theme);
                  }

                  var root = document.documentElement;
                  if (theme === 'dark') {
                    root.classList.add('dark');
                    root.style.colorScheme = 'dark';
                    root.style.setProperty('--theme-bg', '#1B2027');
                    root.style.setProperty('--theme-text', '#F3F6F8');
                    root.style.setProperty('--theme-card', '#212831');
                    root.style.setProperty('--theme-card-foreground', '#F3F6F8');
                    root.style.setProperty('--theme-border', '#3A444F');
                    root.style.setProperty('--theme-muted', '#2A333E');
                    root.style.setProperty('--theme-muted-foreground', '#87929D');
                  } else {
                    root.classList.remove('dark');
                    root.style.colorScheme = 'light';
                    root.style.setProperty('--theme-bg', '#FFFFFF');
                    root.style.setProperty('--theme-text', '#202A31');
                    root.style.setProperty('--theme-card', '#ffffff');
                    root.style.setProperty('--theme-card-foreground', '#202A31');
                    root.style.setProperty('--theme-border', '#CAD4DB');
                    root.style.setProperty('--theme-muted', '#E8EFF2');
                    root.style.setProperty('--theme-muted-foreground', '#64727D');
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
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <WebSocketProvider>
              <BranchProvider>
                {children}
              </BranchProvider>
              <LicenseExpiredModal />
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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
