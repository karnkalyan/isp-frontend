"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ServiceIntegrationSettings } from "./service-settings"
import { SystemSettings } from "./system-settings"
import { IntegrationSettings } from "./integration-settings"

export function MasterSettingsTabs() {
  return (
    <Tabs defaultValue="services" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="services">Service Settings</TabsTrigger>
        <TabsTrigger value="system">System Settings</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
      </TabsList>

      <TabsContent value="services" className="space-y-6">
        <ServiceIntegrationSettings />
      </TabsContent>

      <TabsContent value="system" className="space-y-6">
        <SystemSettings />
      </TabsContent>

      <TabsContent value="integrations" className="space-y-6">
        <IntegrationSettings />
      </TabsContent>
    </Tabs>
  )
}
