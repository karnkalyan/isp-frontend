"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CreateTicketRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/tickets?create=true")
  }, [router])

  return null
}
