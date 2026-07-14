"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { CardContainer } from "@/components/ui/card-container"
import { StatusBadge } from "@/components/ui/status-badge"
import { Progress } from "@/components/ui/progress"
import {
  MoreHorizontal,
  Wifi,
  Server,
  Laptop,
  Smartphone,
  Settings,
  Terminal,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

// Mock data
const devices = [
  {
    id: "DEV-001",
    name: "Core Router",
    type: "Router",
    ip: "192.168.1.1",
    status: "Online",
    load: 65,
    lastSeen: "2023-04-15T10:30:00",
  },
  {
    id: "DEV-002",
    name: "Main Switch",
    type: "Switch",
    ip: "192.168.1.2",
    status: "Online",
    load: 42,
    lastSeen: "2023-04-15T10:30:00",
  },
  {
    id: "DEV-003",
    name: "Backup Server",
    type: "Server",
    ip: "192.168.1.10",
    status: "Online",
    load: 78,
    lastSeen: "2023-04-15T10:30:00",
  },
  {
    id: "DEV-004",
    name: "Office AP-1",
    type: "Access Point",
    ip: "192.168.1.20",
    status: "Warning",
    load: 92,
    lastSeen: "2023-04-15T10:30:00",
  },
  {
    id: "DEV-005",
    name: "Customer Gateway",
    type: "Gateway",
    ip: "192.168.1.30",
    status: "Offline",
    load: 0,
    lastSeen: "2023-04-14T18:45:00",
  },
]

export function DeviceList() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), [])

  const isDarkMode = !mounted ? true : resolvedTheme === "dark"

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "Router":
      case "Gateway":
      case "Access Point":
        return <Wifi className="h-4 w-4 text-blue-400" />
      case "Switch":
        return <Server className="h-4 w-4 text-green-400" />
      case "Server":
        return <Server className="h-4 w-4 text-purple-400" />
      case "Laptop":
        return <Laptop className="h-4 w-4 text-slate-400" />
      case "Mobile":
        return <Smartphone className="h-4 w-4 text-slate-400" />
      default:
        return <Wifi className="h-4 w-4 text-slate-400" />
    }
  }

  const getLoadColor = (load: number) => {
    if (load < 50) return "bg-green-500"
    if (load < 80) return "bg-amber-500"
    return "bg-red-500"
  }

  return (
    <CardContainer title="Network Devices" description="Connected devices and their status" forceDarkMode={!mounted}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
              <th className={`text-left p-4 text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Device
              </th>
              <th className={`text-left p-4 text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Type
              </th>
              <th className={`text-left p-4 text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                IP Address
              </th>
              <th className={`text-left p-4 text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Status
              </th>
              <th className={`text-left p-4 text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Load
              </th>
              <th className={`text-left p-4 text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Last Seen
              </th>
              <th
                className={`text-right p-4 text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              ></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr
                key={device.id}
                className={`border-b ${isDarkMode ? "border-slate-800 hover:bg-slate-800/10" : "border-slate-200 hover:bg-slate-100/50"}`}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${isDarkMode ? "bg-slate-800/50" : "bg-slate-100"}`}>
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <div className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{device.name}</div>
                      <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{device.id}</div>
                    </div>
                  </div>
                </td>
                <td className={`p-4 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{device.type}</td>
                <td className={`p-4 text-sm font-mono ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  {device.ip}
                </td>
                <td className="p-4">
                  <StatusBadge
                    status={device.status.toLowerCase() as any}
                    className={device.status === "Warning" ? "bg-amber-500/20 text-amber-600" : undefined}
                  />
                </td>
                <td className="p-4">
                  <div className="w-full max-w-[100px]">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>{device.load}%</span>
                    </div>
                    <Progress value={device.load} className="h-1.5" indicatorClassName={getLoadColor(device.load)} />
                  </div>
                </td>
                <td className={`p-4 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  {new Date(device.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="p-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className={`w-[160px] ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                    >
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className={isDarkMode ? "bg-slate-800" : "bg-slate-200"} />
                      <DropdownMenuItem
                        className={
                          isDarkMode
                            ? "text-slate-400 hover:text-white focus:text-white hover:bg-slate-800 focus:bg-slate-800"
                            : "text-slate-700 hover:text-slate-900 focus:text-slate-900 hover:bg-slate-100 focus:bg-slate-100"
                        }
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={
                          isDarkMode
                            ? "text-slate-400 hover:text-white focus:text-white hover:bg-slate-800 focus:bg-slate-800"
                            : "text-slate-700 hover:text-slate-900 focus:text-slate-900 hover:bg-slate-100 focus:bg-slate-100"
                        }
                      >
                        <Terminal className="mr-2 h-4 w-4" />
                        SSH Access
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={
                          isDarkMode
                            ? "text-slate-400 hover:text-white focus:text-white hover:bg-slate-800 focus:bg-slate-800"
                            : "text-slate-700 hover:text-slate-900 focus:text-slate-900 hover:bg-slate-100 focus:bg-slate-100"
                        }
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reboot Device
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className={isDarkMode ? "bg-slate-800" : "bg-slate-200"} />
                      <DropdownMenuItem
                        className={
                          isDarkMode
                            ? "text-slate-400 hover:text-white focus:text-white hover:bg-slate-800 focus:bg-slate-800"
                            : "text-slate-700 hover:text-slate-900 focus:text-slate-900 hover:bg-slate-100 focus:bg-slate-100"
                        }
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        View Alerts
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`p-4 flex justify-center border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
        <Button
          variant="outline"
          className={
            isDarkMode
              ? "text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white"
              : "text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
          }
        >
          View All Devices
        </Button>
      </div>
    </CardContainer>
  )
}
