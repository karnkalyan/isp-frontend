"use client"

import { useState, useEffect, useMemo } from "react"
import { useTheme } from "next-themes"
import { CardContainer } from "@/components/ui/card-container"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Laptop, Smartphone, Tablet, Tv, Wifi, Router, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function ActiveSessions() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await apiRequest<{ success: boolean; data: any[] }>("/olt/active-sessions")
      if (response && response.success && Array.isArray(response.data)) {
        setSessions(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch active sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 60000) // Update every 1 minute
    return () => clearInterval(interval)
  }, [])

  const isDarkMode = !mounted ? true : resolvedTheme === "dark"

  const filteredSessions = useMemo(() => {
    if (activeTab === "all") return sessions
    if (activeTab === "active") return sessions.filter(s => s.duration && s.duration !== "0h 0m")
    if (activeTab === "offline") return sessions.filter(s => !s.duration || s.duration === "0h 0m")
    return sessions
  }, [sessions, activeTab])

  const getStatusIcon = (session: any) => {
    const isOnline = session.duration && session.duration !== "0h 0m"
    if (isOnline) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    return <XCircle className="h-4 w-4 text-rose-500" />
  }

  return (
    <CardContainer
      title="Network Sessions"
      description={`${sessions.filter(s => s.duration && s.duration !== "0h 0m").length} active ONT connections`}
      forceDarkMode={!mounted}
    >
      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className={`${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="offline">Offline</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="sm" onClick={fetchSessions} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-[350px] pr-4">
              {loading && sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <RefreshCw className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-sm">Fetching network status...</p>
                </div>
              ) : filteredSessions.length > 0 ? (
                <div className="space-y-3">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
                        isDarkMode 
                          ? "border-slate-800/50 bg-slate-900/50 hover:bg-slate-800/50" 
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${isDarkMode ? "bg-slate-800 text-primary" : "bg-primary/10 text-primary"}`}>
                          <Router className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                              {session.username}
                            </span>
                            <Badge variant="outline" className="text-[10px] h-4 py-0 font-normal">
                              {session.deviceType}
                            </Badge>
                          </div>
                          <div className={`text-xs mt-0.5 font-mono ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            {session.ipAddress} • {session.location}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                          <div className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                            Uptime
                          </div>
                          <div className={`text-sm font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                            {session.duration || "---"}
                          </div>
                        </div>
                        <div className={`p-2 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                          {getStatusIcon(session)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <Wifi className="h-12 w-12 mb-3" />
                  <p className="text-lg font-medium">No sessions found</p>
                  <p className="text-sm">Current filter: {activeTab}</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </CardContainer>
  )
}
