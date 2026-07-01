import { Suspense } from "react"
import ResetPasswordForm from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return <div className="min-h-screen w-full flex items-center justify-center bg-background px-4"><div className="w-full max-w-md"><Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}><ResetPasswordForm /></Suspense></div></div>
}
