"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Download, Upload } from "lucide-react"

export function VirtualHostBulkImport() {
  const [jsonData, setJsonData] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  const sampleData = [
    {
      name: "PowerRx",
      description: "Optical interface receive power",
      parameter: "Device.Optical.Interface.1.RxPower",
      category: "Optical",
      status: "active",
    },
    {
      name: "PowerTx",
      description: "Optical interface transmit power",
      parameter: "Device.Optical.Interface.1.TxPower",
      category: "Optical",
      status: "active",
    },
    {
      name: "WifiSSID",
      description: "WiFi SSID name",
      parameter: "Device.WiFi.SSID.1.SSID",
      category: "WiFi",
      status: "active",
    },
  ]

  const exampleJsonFormat = JSON.stringify(sampleData, null, 2)

  const downloadTemplate = () => {
    const dataStr = JSON.stringify(sampleData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = "virtual-hosts-template.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const handleImport = async () => {
    setIsImporting(true)

    try {
      // Validate JSON
      const parsedData = JSON.parse(jsonData)

      if (!Array.isArray(parsedData)) {
        throw new Error("Imported data must be an array")
      }

      // Validate each item
      parsedData.forEach((item, index) => {
        if (!item.name || !item.parameter || !item.category) {
          throw new Error(`Item at index ${index} is missing required fields (name, parameter, category)`)
        }
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Import successful",
        description: `${parsedData.length} virtual hosts have been imported.`,
      })

      // Clear the textarea
      setJsonData("")
    } catch (error) {
      toast({
        title: "Import failed",
        description: `Error: ${error instanceof Error ? error.message : "Invalid JSON format"}`,
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>

        <Textarea
          placeholder={exampleJsonFormat}
          className="min-h-[300px] font-mono text-sm"
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Paste your JSON array of virtual host definitions. Each object should include name, description, parameter,
          category, and status fields.
        </p>

        <div className="flex justify-end">
          <Button
            onClick={handleImport}
            disabled={!jsonData.trim() || isImporting}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? "Importing..." : "Import Virtual Hosts"}
          </Button>
        </div>
      </div>
    </div>
  )
}
