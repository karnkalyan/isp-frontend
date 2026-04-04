"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VirtualHostsList } from "@/components/tr069/virtual-hosts-list"
import { VirtualHostForm } from "@/components/tr069/virtual-host-form"
import { VirtualHostBulkImport } from "@/components/tr069/virtual-host-bulk-import"
import { VirtualHostTemplates } from "@/components/tr069/virtual-host-templates"
import { CardContainer } from "@/components/ui/card-container"

export default function VirtualHostsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          heading="ACS Virtual Hosts"
          subheading="Define and manage virtual host codes for TR-069 parameters"
        />

        <Tabs defaultValue="list" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="list">Virtual Hosts</TabsTrigger>
            <TabsTrigger value="add">Add New Host</TabsTrigger>
            <TabsTrigger value="import">Bulk Import</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <CardContainer title="Virtual Hosts List" description="View and manage your TR-069 virtual hosts">
              <VirtualHostsList />
            </CardContainer>
          </TabsContent>

          <TabsContent value="add">
            <CardContainer title="Add New Virtual Host" description="Create a new TR-069 virtual host configuration">
              <VirtualHostForm />
            </CardContainer>
          </TabsContent>

          <TabsContent value="import">
            <CardContainer title="Bulk Import" description="Import multiple virtual hosts at once using JSON format">
              <VirtualHostBulkImport />
            </CardContainer>
          </TabsContent>

          <TabsContent value="templates">
            <CardContainer
              title="Virtual Host Templates"
              description="Use these pre-defined templates to quickly add common virtual hosts to your system"
            >
              <VirtualHostTemplates />
            </CardContainer>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
