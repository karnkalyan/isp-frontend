"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RotateCw, Settings, RefreshCw, Download, AlertTriangle, Wifi, Gauge, MoreHorizontal } from "lucide-react"
import { toast } from "react-hot-toast"

export function TR069DeviceActions() {
  const handleAction = (action: string) => {
    toast.success(`${action} action initiated`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => handleAction("Reboot")}>
        <RotateCw className="h-4 w-4 mr-2" />
        Reboot
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleAction("Configure")}>
        <Settings className="h-4 w-4 mr-2" />
        Configure
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleAction("Refresh")}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            More Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleAction("Download Logs")}>
            <Download className="h-4 w-4 mr-2" />
            Download Logs
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("Factory Reset")}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Factory Reset
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("WiFi Settings")}>
            <Wifi className="h-4 w-4 mr-2" />
            WiFi Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("Speed Test")}>
            <Gauge className="h-4 w-4 mr-2" />
            Speed Test
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
