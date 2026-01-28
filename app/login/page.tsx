import { LoginForm } from "@/components/auth/login-form"
import type { Metadata } from "next"



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

      {/* SimulISP branding */}
      <div className="mb-8 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="size-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6 text-white"
            >
              <path d="M6 9a6 6 0 0 1 6-6" />
              <path d="M3 9a9 9 0 0 1 9-9" />
              <circle cx="12" cy="9" r="3" />
              <path d="m12 12 0 12" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            <span className="text-primary">Radius Manager</span>
          </h1>
        </div>
      </div>

      {/* Login form */}
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  )
}
