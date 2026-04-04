"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { CardContainer } from "@/components/ui/card-container"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Laptop, Smartphone, Tablet, Tv, Wifi } from "lucide-react"

// Mock data for active sessions
const generateSessions = () => {
  const deviceTypes = ["desktop", "mobile", "tablet", "smart-tv", "other"]
  const locations = ["Main Office", "Branch Office", "Remote Site", "Data Center", "Edge Location"]
  const protocols = ["PPPoE", "DHCP", "Static", "L2TP", "PPTP"]

  return Array.from({ length: 20 }, (_, i) => ({
    id: `SESSION-${1000 + i}`,
    username: `user${100 + i}@example.com`,
    ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    deviceType: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    protocol: protocols[Math.floor(Math.random() * protocols.length)],
    duration: `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
    dataUsed: `${(Math.random() * 10).toFixed(2)} GB`,
  }))
}

export function ActiveSessions() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [sessions, setSessions] = useState(generateSessions())
  const [activeTab, setActiveTab] = useState("all")

  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), [])

  const isDarkMode = !mounted ? true : resolvedTheme === "dark"

  // Simulate session updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update a session
      const updatedSessions = [...sessions]
      const randomIndex = Math.floor(Math.random() * sessions.length)
      updatedSessions[randomIndex] = {
        ...updatedSessions[randomIndex],
        dataUsed: `${(Math.random() * 10).toFixed(2)} GB`,
        duration: `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
      }

      setSessions(updatedSessions)
    }, 10000)

    return () => clearInterval(interval)
  }, [sessions])

  const filteredSessions =
    activeTab === "all" ? sessions : sessions.filter((session) => session.deviceType === activeTab)

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "desktop":
        return <Laptop className="h-4 w-4" />
      case "mobile":
        return <Smartphone className="h-4 w-4" />
      case "tablet":
        return <Tablet className="h-4 w-4" />
      case "smart-tv":
        return <Tv className="h-4 w-4" />
      default:
        return <Wifi className="h-4 w-4" />
    }
  }

  return (
    <CardContainer
      title="Active Sessions"
      description={`${sessions.length} users currently connected`}
      forceDarkMode={!mounted}
    >
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`mb-4 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="desktop">Desktop</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="tablet">Tablet</TabsTrigger>
          <TabsTrigger value="smart-tv">Smart TV</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-0">
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-3 border rounded-md ${
                    isDarkMode ? "border-slate-800 hover:bg-slate-800/30" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div>
                      <div className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        {session.username}
                      </div>
                      <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {session.ipAddress}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                        {session.protocol}
                      </div>
                      <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {session.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                        {session.duration}
                      </div>
                      <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {session.dataUsed}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </CardContainer>
  )
}
