"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Copy, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Template categories and their virtual hosts
const templateCategories = [
  {
    id: "optical",
    name: "Optical",
    templates: [
      {
        id: "opt1",
        name: "PowerRx",
        description: "Optical interface receive power",
        parameter: "Device.Optical.Interface.1.RxPower",
      },
      {
        id: "opt2",
        name: "PowerTx",
        description: "Optical interface transmit power",
        parameter: "Device.Optical.Interface.1.TxPower",
      },
      {
        id: "opt3",
        name: "OpticalStatus",
        description: "Optical interface status",
        parameter: "Device.Optical.Interface.1.Status",
      },
    ],
  },
  {
    id: "wifi",
    name: "WiFi",
    templates: [
      {
        id: "wifi1",
        name: "WifiSSID",
        description: "WiFi SSID name",
        parameter: "Device.WiFi.SSID.1.SSID",
      },
      {
        id: "wifi2",
        name: "WifiPassword",
        description: "WiFi password",
        parameter: "Device.WiFi.AccessPoint.1.Security.KeyPassphrase",
      },
      {
        id: "wifi3",
        name: "WifiChannel",
        description: "WiFi channel",
        parameter: "Device.WiFi.Radio.1.Channel",
      },
      {
        id: "wifi4",
        name: "WifiEnabled",
        description: "WiFi enabled status",
        parameter: "Device.WiFi.Radio.1.Enable",
      },
    ],
  },
  {
    id: "system",
    name: "System",
    templates: [
      {
        id: "sys1",
        name: "FirmwareVersion",
        description: "Current firmware version",
        parameter: "Device.DeviceInfo.SoftwareVersion",
      },
      {
        id: "sys2",
        name: "SerialNumber",
        description: "Device serial number",
        parameter: "Device.DeviceInfo.SerialNumber",
      },
      {
        id: "sys3",
        name: "ModelName",
        description: "Device model name",
        parameter: "Device.DeviceInfo.ModelName",
      },
      {
        id: "sys4",
        name: "Uptime",
        description: "Device uptime in seconds",
        parameter: "Device.DeviceInfo.UpTime",
      },
    ],
  },
  {
    id: "wan",
    name: "WAN",
    templates: [
      {
        id: "wan1",
        name: "ConnectionUptime",
        description: "Connection uptime in seconds",
        parameter: "Device.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.Stats.ConnectionUpTime",
      },
      {
        id: "wan2",
        name: "DownstreamRate",
        description: "Downstream data rate",
        parameter: "Device.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.Stats.CurrentDownstreamRate",
      },
      {
        id: "wan3",
        name: "UpstreamRate",
        description: "Upstream data rate",
        parameter: "Device.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.Stats.CurrentUpstreamRate",
      },
      {
        id: "wan4",
        name: "WanIP",
        description: "WAN IP address",
        parameter: "Device.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress",
      },
    ],
  },
]

export function VirtualHostTemplates() {
  const [activeCategory, setActiveCategory] = useState("optical")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Parameter path copied to clipboard.",
    })
  }

  const addTemplate = (template: any) => {
    toast({
      title: "Template added",
      description: `Virtual host "${template.name}" has been added to your list.`,
    })
  }

  // Function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          {templateCategories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {templateCategories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="pt-6">
            <ScrollArea className="h-[500px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                {category.templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {category.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded truncate max-w-[150px] sm:max-w-[200px] md:max-w-[150px] lg:max-w-[200px] xl:max-w-[250px] inline-block">
                              {truncateText(template.parameter, 30)}
                            </code>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">{template.parameter}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(template.parameter)}
                          className="h-8"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addTemplate(template)}
                          className="h-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
