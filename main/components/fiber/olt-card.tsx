"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import {
  Server,
  Thermometer,
  Clock,
  ChevronDown,
  ChevronUp,
  Settings,
  RefreshCw,
  AlertTriangle,
  Users,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"

interface OLT {
  id: string
  name: string
  location: string
  status: string
  ipAddress: string
  totalPorts: number
  activePorts: number
  uptime: string
  temperature: number
  lastSeen: string
  utilizationPercent: number
}

interface OLTCardProps {
  olt: OLT
}

export function OLTCard({ olt }: OLTCardProps) {
  const [expanded, setExpanded] = useState(false)

  // Determine gradient colors based on status
  const getGradient = () => {
    switch (olt.status) {
      case "active":
        return "from-emerald-500 to-teal-700"
      case "warning":
        return "from-amber-500 to-orange-700"
      case "inactive":
        return "from-slate-500 to-slate-700"
      default:
        return "from-slate-500 to-slate-700"
    }
  }

  // Determine temperature color
  const getTempColor = () => {
    if (olt.temperature > 45) return "text-red-500"
    if (olt.temperature > 40) return "text-amber-500"
    return "text-emerald-500"
  }

  return (
    <Card className="overflow-hidden border-none shadow-lg relative">
      {/* Top gradient */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getGradient()}`} />

      {/* Left gradient */}
      <div className={`absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b ${getGradient()}`} />

      {/* Right gradient */}
      <div className={`absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b ${getGradient()}`} />

      {/* Background gradient */}
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${getGradient()}`} />

      {/* Top-left corner gradient */}
      <div
        className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${
            olt.status === "active" ? "#10b981" : olt.status === "warning" ? "#f59e0b" : "#64748b"
          } 0%, transparent 70%)`,
        }}
      />

      {/* Bottom-right corner gradient */}
      <div
        className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${
            olt.status === "active" ? "#10b981" : olt.status === "warning" ? "#f59e0b" : "#64748b"
          } 0%, transparent 70%)`,
        }}
      />

      <CardHeader className="pb-2 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{olt.name}</h3>
            <p className="text-sm text-muted-foreground">{olt.location}</p>
          </div>
          <StatusBadge status={olt.status as any} />
        </div>
      </CardHeader>

      <CardContent className="pb-3 relative z-10">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-muted-foreground" />
            <span className="text-sm">{olt.ipAddress}</span>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer size={16} className={getTempColor()} />
            <span className="text-sm">{olt.temperature}°C</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            <span className="text-sm">{olt.uptime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-muted-foreground" />
            <span className="text-sm">
              {olt.activePorts}/{olt.totalPorts} ports
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Utilization</span>
            <span>{olt.utilizationPercent}%</span>
          </div>
          <Progress
            value={olt.utilizationPercent}
            className="h-2"
            indicatorClassName={`${
              olt.utilizationPercent > 90
                ? "bg-red-500"
                : olt.utilizationPercent > 75
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
          />
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex justify-between relative z-10">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs hover:bg-transparent"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp size={14} className="mr-1" /> Less
            </>
          ) : (
            <>
              <ChevronDown size={14} className="mr-1" /> More
            </>
          )}
        </Button>

        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent">
            <RefreshCw size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent">
            <Settings size={14} />
          </Button>
        </div>
      </CardFooter>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden relative z-10"
          >
            <div className="px-6 pb-6 pt-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="ghost" size="sm" className="w-full hover:bg-transparent">
                  View ONTs
                </Button>
                <Button variant="ghost" size="sm" className="w-full hover:bg-transparent">
                  Port Map
                </Button>
                <Button variant="ghost" size="sm" className="w-full hover:bg-transparent">
                  Configuration
                </Button>
                <Button variant="ghost" size="sm" className="w-full hover:bg-transparent">
                  Logs
                </Button>
              </div>

              {olt.status === "warning" && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-md">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span className="text-sm">High temperature warning</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom gradient */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${getGradient()}`} />
    </Card>
  )
}
