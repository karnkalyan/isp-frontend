"use client"

import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { Download, Upload, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TR069DeviceFirmwareProps {
  deviceId: string
}

export function TR069DeviceFirmware({ deviceId }: TR069DeviceFirmwareProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState(0)

  // Mock firmware data
  const currentFirmware = {
    version: "v3.20.1",
    releaseDate: "2023-01-15",
    status: "current",
  }

  const availableFirmware = {
    version: "v3.21.0",
    releaseDate: "2023-04-05",
    status: "available",
    size: "8.4 MB",
    releaseNotes: [
      "Improved WiFi stability",
      "Fixed DHCP lease renewal issue",
      "Enhanced security features",
      "Added support for IPv6 prefix delegation",
      "Improved VPN passthrough functionality",
    ],
  }

  const firmwareHistory = [
    {
      version: "v3.20.1",
      date: "2023-01-15",
      status: "success",
    },
    {
      version: "v3.19.5",
      date: "2022-11-02",
      status: "success",
    },
    {
      version: "v3.18.2",
      date: "2022-08-17",
      status: "failed",
    },
    {
      version: "v3.17.0",
      date: "2022-05-30",
      status: "success",
    },
  ]

  const updateFirmware = () => {
    setIsUpdating(true)
    setUpdateProgress(0)

    // Simulate firmware update with progress
    const interval = setInterval(() => {
      setUpdateProgress((prev) => {
        const newProgress = prev + 5
        if (newProgress >= 100) {
          clearInterval(interval)
          setIsUpdating(false)
          toast.success("Firmware updated successfully")
          return 100
        }
        return newProgress
      })
    }, 500)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <CardContainer title="Current Firmware" gradientColor="#6366f1">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">Version</div>
                <div className="text-xl font-medium">{currentFirmware.version}</div>
              </div>
              <Badge variant="outline" className="text-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Current
              </Badge>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Release Date</div>
              <div>{currentFirmware.releaseDate}</div>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="Available Update" gradientColor="#22c55e">
          {isUpdating ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Updating Firmware...</div>
                <div className="text-sm text-muted-foreground mb-4">Do not power off the device during the update</div>
              </div>

              <Progress value={updateProgress} className="h-2" />

              <div className="flex justify-between text-sm">
                <span>Downloading and verifying</span>
                <span>{updateProgress}%</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground">New Version</div>
                  <div className="text-xl font-medium">{availableFirmware.version}</div>
                </div>
                <Badge variant="outline" className="text-blue-500 bg-blue-50 dark:bg-blue-900/20">
                  <Download className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Release Date</div>
                  <div>{availableFirmware.releaseDate}</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Size</div>
                  <div>{availableFirmware.size}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">Release Notes</div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {availableFirmware.releaseNotes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end">
                <Button onClick={updateFirmware}>
                  <Upload className="h-4 w-4 mr-2" />
                  Update Firmware
                </Button>
              </div>
            </div>
          )}
        </CardContainer>
      </div>

      <CardContainer title="Firmware History" gradientColor="#3b82f6">
        <div className="space-y-4">
          {firmwareHistory.map((firmware, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-center gap-3">
                {firmware.status === "success" ? (
                  <div className="rounded-full bg-green-100 p-1.5 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                ) : (
                  <div className="rounded-full bg-red-100 p-1.5 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{firmware.version}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {firmware.date}
                  </div>
                </div>
              </div>
              <Badge variant={firmware.status === "success" ? "success" : "destructive"} className="capitalize">
                {firmware.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContainer>
    </div>
  )
}
