"use client"
import { useState, useEffect } from "react"
import { SystemSettings } from "./system-settings"
import { MailSettings } from "./mail-settings"
import { BranchSettings } from "./branch-settings"
import { EnhancementsSettings } from "./enhancements-settings"
import { LicenseSettings } from "./license-settings"
import { RolesList } from "@/components/admin/roles-list"
import { RolePermissionsMatrix } from "@/components/admin/role-permissions-matrix"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiRequest } from "@/lib/api"
import { CardContainer } from "@/components/ui/card-container"
import { BillingConfigurationSettings } from "@/components/settings/billing-configuration-settings"
import { TicketSettings } from "@/components/settings/ticket-settings"
import { RadiusPoolsSettings } from "@/components/settings/radius-pools-settings"
import { ServicesSyncSettings } from "@/components/settings/services-sync-settings"
import { PaymentGatewaySettings } from "./payment-gateway-settings"

export function MasterSettingsTabs() {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [showLicense, setShowLicense] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiRequest<Record<string, string>>("/settings")
        if (data && typeof data === 'object') {
          setShowLicense(data.showLicenseTab !== 'false')
        }
      } catch (e) {
        console.error("Failed to load settings in MasterSettingsTabs:", e)
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    const handleSettingsSaved = (e: CustomEvent<any>) => {
      if (e.detail && e.detail.showLicenseTab !== undefined) {
        setShowLicense(e.detail.showLicenseTab)
      }
    }
    window.addEventListener("system-settings-saved" as any, handleSettingsSaved)
    return () => window.removeEventListener("system-settings-saved" as any, handleSettingsSaved)
  }, [])

  useEffect(() => {
    const handleSecretLicenseToggle = async (event: KeyboardEvent) => {
      if (!(event.ctrlKey && event.altKey && event.shiftKey && event.key === "F12")) return
      event.preventDefault()
      const nextValue = !showLicense
      setShowLicense(nextValue)
      try {
        await apiRequest("/settings", {
          method: "POST",
          body: JSON.stringify({
            key: "showLicenseTab",
            value: String(nextValue),
            description: "Hidden license tab visibility setting",
          }),
          suppressToast: true,
        })
      } catch (error) {
        setShowLicense(!nextValue)
        console.error("Failed to toggle license tab:", error)
      }
    }

    window.addEventListener("keydown", handleSecretLicenseToggle)
    return () => window.removeEventListener("keydown", handleSecretLicenseToggle)
  }, [showLicense])

  return (
    <div className="w-full">
      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800 flex-wrap h-auto">
          <TabsTrigger value="system">System Overview</TabsTrigger>
          <TabsTrigger value="mail">Mail Setup</TabsTrigger>
          <TabsTrigger value="branch">Service & Branch Settings</TabsTrigger>
          <TabsTrigger value="enhancements">Enhancements & Customer Types</TabsTrigger>
          <TabsTrigger value="roles">Role & Sidebar Management</TabsTrigger>
          <TabsTrigger value="ticket-settings">Ticket Settings</TabsTrigger>
          <TabsTrigger value="billing-configuration">Billing Configuration</TabsTrigger>
          <TabsTrigger value="payment-gateway">Payment Gateway</TabsTrigger>
          <TabsTrigger value="radius-pools">RADIUS Pools</TabsTrigger>
          <TabsTrigger value="services-sync">Services Sync</TabsTrigger>
          {showLicense && <TabsTrigger value="license">License</TabsTrigger>}
        </TabsList>
        <TabsContent value="system">
          <SystemSettings />
        </TabsContent>
        <TabsContent value="mail">
          <MailSettings />
        </TabsContent>
        <TabsContent value="branch">
          <BranchSettings />
        </TabsContent>
        <TabsContent value="enhancements">
          <EnhancementsSettings />
        </TabsContent>
        <TabsContent value="roles">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-5">
              <RolesList 
                selectedRoleId={selectedRoleId}
                onRoleSelect={setSelectedRoleId}
              />
            </div>
            <div className="md:col-span-7">
              <RolePermissionsMatrix 
                selectedRoleId={selectedRoleId}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="ticket-settings">
          <CardContainer title="Ticket Types & SLA" description="Configure support queues and priority deadlines" gradientColor="#f97316">
            <TicketSettings />
          </CardContainer>
        </TabsContent>
        <TabsContent value="billing-configuration">
          <CardContainer title="Fiscal Years & Payment Methods" description="Configure fiscal sessions and accepted renewal payment methods" gradientColor="#0ea5e9">
            <BillingConfigurationSettings />
          </CardContainer>
        </TabsContent>
        <TabsContent value="payment-gateway">
          <PaymentGatewaySettings />
        </TabsContent>
        <TabsContent value="radius-pools">
          <CardContainer title="RADIUS Pool Management" description="Create Framed-Pool values and assign them to Internet Plans" gradientColor="#0ea5e9">
            <RadiusPoolsSettings />
          </CardContainer>
        </TabsContent>
        <TabsContent value="services-sync">
          <CardContainer title="Services Sync Manager" description="Sync packages, plans, devices, and VoIP log integrations across services" gradientColor="#f59e0b">
            <ServicesSyncSettings />
          </CardContainer>
        </TabsContent>
        {showLicense && (
          <TabsContent value="license">
            <LicenseSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
