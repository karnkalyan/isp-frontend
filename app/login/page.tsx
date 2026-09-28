import { LoginForm } from "@/components/auth/login-form"
import { LoginBranding } from "@/components/auth/login-branding"
import type { Metadata } from "next"
import { Suspense } from "react"



export const metadata: Metadata = {
  title: "Radius Manager - Login Page",
  description: "ISP Management Login",
  generator: 'Kalyan Karn'
}

export default function LoginPage() {
 
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background with gradient */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
        {/* Network pattern overlay */}
        <div className="absolute inset-0 opacity-10 dark:opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="network-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path
                  d="M50 0 L100 50 L50 100 L0 50 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-primary"
                />
                <circle cx="50" cy="50" r="3" fill="currentColor" className="text-primary" />
                <circle cx="0" cy="50" r="2" fill="currentColor" className="text-primary" />
                <circle cx="100" cy="50" r="2" fill="currentColor" className="text-primary" />
                <circle cx="50" cy="0" r="2" fill="currentColor" className="text-primary" />
                <circle cx="50" cy="100" r="2" fill="currentColor" className="text-primary" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#network-pattern)" />
          </svg>
        </div>

        {/* Animated fiber optic lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[40%] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-pulse delay-100"></div>
          <div className="absolute top-[70%] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-pulse delay-200"></div>
        </div>
      </div>

      {/* Dynamic ISP Branding */}
      <LoginBranding />

      {/* Login form */}
      <div className="relative z-10">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center p-8 bg-white/80 dark:bg-black/40 rounded-xl shadow-lg border border-white/10 backdrop-blur-sm w-[450px] h-[350px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
