"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ISPTypesSettings } from "@/components/settings/isp-types-settings"
import { InternetPlansSettings } from "@/components/settings/internet-plans-settings"
import { ExtraChargesSettings } from "@/components/settings/billing-cycles-settings"
import { PaymentMethodsSettings } from "@/components/settings/payment-methods-settings"
import { ServiceAreasSettings } from "@/components/settings/service-areas-settings"
import { CardContainer } from "@/components/ui/card-container"
import { Building, Globe, Calendar, CreditCard, MapPin } from "lucide-react"

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("isp-types")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full justify-start border-b bg-transparent p-0">
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
          value="items-charges"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Calendar className="h-4 w-4" />
         Package Addon Charges
        </TabsTrigger>
        {/* <TabsTrigger
          value="payment-methods"
          className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <CreditCard className="h-4 w-4" />
          Payment Methods
        </TabsTrigger> */}
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

      <TabsContent value="items-charges" className="mt-6">
        <CardContainer
          title="Inventory Items for Package Addon Charges"
          description="Manage Items for Invoicing charges of extra services"
          gradientColor="#10b981"
        >
          <ExtraChargesSettings  />
        </CardContainer>
      </TabsContent>

      {/* <TabsContent value="payment-methods" className="mt-6">
        <CardContainer
          title="Payment Methods"
          description="Manage payment methods available to customers"
          gradientColor="#0ea5e9"
        >
          <PaymentMethodsSettings />
        </CardContainer>
      </TabsContent> */}
    </Tabs>
  )
}
