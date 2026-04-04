// app/services/add/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { ServiceManager } from "@/components/services/service-manager";
import { ServiceCatalog } from "@/components/services/service-catalog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Plus,
    Grid3x3,
    Settings,
    ArrowLeft
} from "lucide-react";

export default function AddServicePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("catalog");

    const handleSuccess = () => {
        router.push("/services");
    };

    const handleCancel = () => {
        router.push("/services");
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Add New Service"
                    description="Configure a new service integration"
                    backButton
                    actions={[
                        {
                            label: "View All Services",
                            onClick: () => router.push("/services"),
                            variant: "outline",
                            icon: <ArrowLeft className="h-4 w-4 mr-2" />
                        }
                    ]}
                />

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="catalog" className="flex items-center gap-2">
                            <Grid3x3 className="h-4 w-4" />
                            Browse Catalog
                        </TabsTrigger>
                        <TabsTrigger value="custom" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Custom Configuration
                        </TabsTrigger>
                        <TabsTrigger value="import" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Import Configuration
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="catalog">
                        <div className="space-y-6">
                            <ServiceCatalog />

                            <div className="p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Can't find what you're looking for?</h3>
                                        <p className="text-gray-600">
                                            Configure a custom service with your own settings
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab("custom")}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Configure Custom Service
                                    </button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="custom">
                        <ServiceManager
                            mode="add"
                            onSuccess={handleSuccess}
                            onCancel={handleCancel}
                        />
                    </TabsContent>

                    <TabsContent value="import">
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                                <Plus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Import Service Configuration</h3>
                                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                    Upload a JSON file containing service configuration to quickly add multiple services
                                </p>

                                <div className="space-y-4 max-w-md mx-auto">
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <h4 className="font-medium mb-2">Supported Format</h4>
                                        <pre className="text-xs bg-white p-2 rounded text-left">
                                            {`{
  "services": [
    {
      "code": "NETTV",
      "name": "NetTV Streaming",
      "baseUrl": "https://api.example.com",
      "apiVersion": "v1",
      "config": {}
    }
  ]
}`}
                                        </pre>
                                    </div>

                                    <div className="flex items-center justify-center gap-4">
                                        <button
                                            onClick={() => setActiveTab("catalog")}
                                            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                        >
                                            Browse Catalog Instead
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("custom")}
                                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                                        >
                                            Configure Manually
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}