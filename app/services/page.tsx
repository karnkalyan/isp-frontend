// app/dashboard/services/page.tsx
"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceStatusDashboard } from "@/components/services/service-status-dashboard";
import { ServiceCatalog } from "@/components/services/service-catalog";
import { ActiveServicesList } from "@/components/services/active-services-list";
import { ServiceOperations } from "@/components/services/service-operations";
import {
    Grid3x3,
    BarChart3,
    Settings,
    PlayCircle,
    Plus
} from "lucide-react";

export default function ServicesPage() {
    const [activeTab, setActiveTab] = useState("status");

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Service Integrations"
                    description="Manage and monitor all integrated services"
                    actions={[
                        {
                            label: "Add Service",
                            onClick: () => setActiveTab("catalog"),
                            icon: <Plus className="h-4 w-4 mr-2" />
                        },
                        {
                            label: "Quick Test",
                            onClick: () => { },
                            variant: "outline",
                            icon: <PlayCircle className="h-4 w-4 mr-2" />
                        }
                    ]}
                />

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-4 md:w-auto">
                        <TabsTrigger value="status" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            <span className="hidden md:inline">Status</span>
                        </TabsTrigger>
                        <TabsTrigger value="active" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            <span className="hidden md:inline">Active Services</span>
                        </TabsTrigger>
                        <TabsTrigger value="catalog" className="flex items-center gap-2">
                            <Grid3x3 className="h-4 w-4" />
                            <span className="hidden md:inline">Catalog</span>
                        </TabsTrigger>
                        <TabsTrigger value="operations" className="flex items-center gap-2">
                            <PlayCircle className="h-4 w-4" />
                            <span className="hidden md:inline">Operations</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="status" className="space-y-6">
                        <ServiceStatusDashboard />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <ServiceOperations limit={5} />
                            </div>
                            <div className="space-y-6">
                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white border rounded-lg p-4">
                                        <div className="text-2xl font-bold">12</div>
                                        <div className="text-sm text-gray-500">Total Services</div>
                                    </div>
                                    <div className="bg-white border rounded-lg p-4">
                                        <div className="text-2xl font-bold text-green-600">8</div>
                                        <div className="text-sm text-gray-500">Active</div>
                                    </div>
                                    <div className="bg-white border rounded-lg p-4">
                                        <div className="text-2xl font-bold text-amber-600">3</div>
                                        <div className="text-sm text-gray-500">Configured</div>
                                    </div>
                                    <div className="bg-white border rounded-lg p-4">
                                        <div className="text-2xl font-bold text-gray-600">1</div>
                                        <div className="text-sm text-gray-500">Inactive</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="active">
                        <ActiveServicesList />
                    </TabsContent>

                    <TabsContent value="catalog">
                        <ServiceCatalog />
                    </TabsContent>

                    <TabsContent value="operations">
                        <ServiceOperations />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}