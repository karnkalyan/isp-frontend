"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace("/login")
      return
    }

    const roleName = user.role?.name?.toLowerCase() || ""

    if (roleName === "customer") {
      router.replace("/customer/dashboard")
    } else {
      // All internal roles (Admin, Manager, Support, Technical, Field)
      // now go to the shared overview which is role-aware.
      router.replace("/dashboard/overview")
    }
  }, [user, loading, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
