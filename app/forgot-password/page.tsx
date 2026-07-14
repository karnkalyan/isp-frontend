import type { Metadata } from "next"
import ForgotPasswordForm from "@/components/auth/forgot-password-form"
import { BrandLogo } from "@/components/brand-logo"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Kashtrix password",
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      {/* Background gradient effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-15 bg-[#4A1B7A] blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full opacity-10 bg-[#E11D72] blur-3xl"></div>
      </div>

      <div className="container relative z-10 flex flex-col items-center justify-center px-4 py-10 md:px-6">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <BrandLogo variant="text" priority className="mx-auto h-8 max-w-[230px]" />
            <p className="mt-2 text-muted-foreground">Reset your password</p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
