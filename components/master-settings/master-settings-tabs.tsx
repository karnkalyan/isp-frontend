"use client"
import { useEffect, useState } from "react"
import { SystemSettings } from "./system-settings"
import { MailSettings } from "./mail-settings"
import { BranchSettings } from "./branch-settings"
import { EnhancementsSettings } from "./enhancements-settings"
import { LicenseGenerator, LicenseSettings } from "./license-settings"
import { RolesList } from "@/components/admin/roles-list"
import { RolePermissionsMatrix } from "@/components/admin/role-permissions-matrix"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function MasterSettingsTabs() {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [showLicenseGenerator, setShowLicenseGenerator] = useState(false)
  const secret = "Kasvian@123Kalyan!@#"

  useEffect(() => {
    let buffer = ""
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      buffer = `${buffer}${event.key}`.slice(-secret.length)
      if (buffer === secret) {
        setShowLicenseGenerator(true)
        buffer = ""
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="w-full">
      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="system">System Overview</TabsTrigger>
          <TabsTrigger value="mail">Mail Setup</TabsTrigger>
          <TabsTrigger value="branch">Service & Branch Settings</TabsTrigger>
          <TabsTrigger value="enhancements">Enhancements & Customer Types</TabsTrigger>
          <TabsTrigger value="roles">Role & Sidebar Management</TabsTrigger>
          <TabsTrigger value="license">License</TabsTrigger>
          {showLicenseGenerator && <TabsTrigger value="license-generator">License Generator</TabsTrigger>}
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
        <TabsContent value="license">
          <LicenseSettings />
        </TabsContent>
        {showLicenseGenerator && (
          <TabsContent value="license-generator">
            <LicenseGenerator onGenerated={() => setShowLicenseGenerator(false)} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
