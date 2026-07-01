"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ISPTypesSettings } from "@/components/settings/isp-types-settings"
import { InternetPlansSettings } from "@/components/settings/internet-plans-settings"
import { ExtraChargesSettings } from "@/components/settings/billing-cycles-settings"
import { PaymentMethodsSettings } from "@/components/settings/payment-methods-settings"
import { ServiceAreasSettings } from "@/components/settings/service-areas-settings"
import { PackageCreationSettings } from "@/components/settings/package-creation-settings"
import { ServicesSyncSettings } from "@/components/settings/services-sync-settings"
import { RadiusPoolsSettings } from "@/components/settings/radius-pools-settings"
import { Building, Globe, MapPin, Calendar, PlusCircle, RefreshCw, Database } from "lucide-react"
import { CardContainer } from "@/components/ui/card-container"
import { BillingConfigurationSettings } from "@/components/settings/billing-configuration-settings"
import { TicketSettings } from "@/components/settings/ticket-settings"

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("isp-types")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full justify-start border-b bg-transparent p-0 flex-wrap">
        <TabsTrigger
          value="ticket-settings"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        ><Building className="h-4 w-4" /> Ticket Settings</TabsTrigger>
        <TabsTrigger
          value="billing-configuration"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Calendar className="h-4 w-4" /> Billing Configuration
        </TabsTrigger>
        <TabsTrigger
          value="isp-types"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Building className="h-4 w-4" />
          Connection Types
        </TabsTrigger>
        <TabsTrigger
          value="internet-plans"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Globe className="h-4 w-4" />
          Internet Plans
        </TabsTrigger>
        <TabsTrigger
          value="package-price"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <MapPin className="h-4 w-4" />
          Package Prices
        </TabsTrigger>
        <TabsTrigger
          value="package-creation"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <PlusCircle className="h-4 w-4" />
          Package Creation
        </TabsTrigger>
        <TabsTrigger
          value="items-charges"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Calendar className="h-4 w-4" />
         Package Addon Charges
        </TabsTrigger>
        <TabsTrigger
          value="radius-pools"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Database className="h-4 w-4" />
          RADIUS Pools
        </TabsTrigger>
        <TabsTrigger
          value="services-sync"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <RefreshCw className="h-4 w-4" />
          Services Sync
        </TabsTrigger>
      </TabsList>

      <TabsContent value="isp-types" className="mt-6">
        <CardContainer
          title="Connection Types"
          description="Manage the types of Internet Service Providers Connection in the system"
          gradientColor="#6366f1"
        >
          <ISPTypesSettings />
        </CardContainer>
      </TabsContent>
      <TabsContent value="billing-configuration" className="mt-6">
        <CardContainer title="Fiscal Years & Payment Methods" description="Configure fiscal sessions and accepted renewal payment methods" gradientColor="#0ea5e9">
          <BillingConfigurationSettings />
        </CardContainer>
      </TabsContent>
      <TabsContent value="ticket-settings" className="mt-6"><CardContainer title="Ticket Types & SLA" description="Configure support queues and priority deadlines" gradientColor="#f97316"><TicketSettings /></CardContainer></TabsContent>

      <TabsContent value="internet-plans" className="mt-6">
        <CardContainer
          title="Internet Plans"
          description="Configure internet plans and packages offered by your ISPs"
          gradientColor="#8b5cf6"
        >
          <InternetPlansSettings />
        </CardContainer>
      </TabsContent>

      <TabsContent value="package-price" className="mt-6">
        <CardContainer
          title="Package Prices"
          description="Set prices for different packages based on service areas"
          gradientColor="#ec4899"
        >
          <ServiceAreasSettings />
        </CardContainer>
      </TabsContent>

      <TabsContent value="package-creation" className="mt-6">
        <CardContainer
          title="Package Creation"
          description="Manage ISP package plans, subscription options, duration tiers, and extra charges"
          gradientColor="#10b981"
        >
          <PackageCreationSettings />
        </CardContainer>
      </TabsContent>

      <TabsContent value="items-charges" className="mt-6">
        <CardContainer
          title="Inventory Items for Package Addon Charges"
          description="Manage Items for Invoicing charges of extra services"
          gradientColor="#10b981"
        >
          <ExtraChargesSettings  />
        </CardContainer>
      </TabsContent>
      <TabsContent value="radius-pools" className="mt-6">
        <CardContainer
          title="RADIUS Pool Management"
          description="Create Framed-Pool values and assign them to Internet Plans"
          gradientColor="#0ea5e9"
        >
          <RadiusPoolsSettings />
        </CardContainer>
      </TabsContent>
      <TabsContent value="services-sync" className="mt-6">
        <CardContainer
          title="Services Sync Manager"
          description="Sync packages, plans, devices, and VoIP log integrations across services"
          gradientColor="#f59e0b"
        >
          <ServicesSyncSettings />
        </CardContainer>
      </TabsContent>
    </Tabs>
  )
}
