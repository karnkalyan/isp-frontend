import type { Metadata } from "next"
import ForgotPasswordForm from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot Password | Simul ISP Dashboard",
  description: "Reset your Simul ISP Dashboard password",
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      {/* Background gradient effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-20 bg-green-500 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full opacity-20 bg-green-500 blur-3xl"></div>
      </div>

      <div className="container relative z-10 flex flex-col items-center justify-center px-4 py-10 md:px-6">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">Simul ISP Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Reset your password</p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
