"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import type { CalendarSystem } from "@/lib/calendar-system"

const CalendarContext = createContext<{ system: CalendarSystem; setViewSystem: (system: CalendarSystem) => void; loading: boolean }>({ system: "AD", setViewSystem: () => undefined, loading: true })

export function CalendarSystemProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [system, setSystem] = useState<CalendarSystem>("AD")
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    apiRequest<{ system?: string }>("/settings/calendar-system", { suppressToast: true })
      .then(settings => setSystem(String(settings.system || "AD").toUpperCase() === "BS" ? "BS" : "AD"))
      .finally(() => setLoading(false))
  }, [user, authLoading])
  useEffect(() => {
    const saved = (event: Event) => {
      const value = String((event as CustomEvent).detail?.defaultCalendarSystem || "").toUpperCase()
      if (value === "AD" || value === "BS") setSystem(value)
    }
    window.addEventListener("system-settings-saved", saved)
    return () => window.removeEventListener("system-settings-saved", saved)
  }, [])
  const value = useMemo(() => ({ system, setViewSystem: setSystem, loading }), [system, loading])
  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}

export const useCalendarSystem = () => useContext(CalendarContext)
