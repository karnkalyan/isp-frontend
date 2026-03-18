// app/services/[id]/page.tsx - FIXED VERSION
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Settings,
    Wifi,
    Activity,
    Database,
    FileText,
    Terminal,
    History,
    BarChart,
    Shield,
    AlertCircle
} from "lucide-react";
import { ISPService, ServiceStatus } from "@/types/service.types";
import { ServicesAPI } from "@/lib/api/service";
import { toast } from "react-hot-toast";
import { ServiceManager } from "@/components/services/service-manager";
import { ServiceCredentialsDialog } from "@/components/services/service-credentials-dialog";
import { ServiceTestDialog } from "@/components/services/service-test-dialog";

export default function ServiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const serviceId = params.id as string;

    const [service, setService] = useState<ISPService | null>(null);
    const [status, setStatus] = useState<ServiceStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [showCredentials, setShowCredentials] = useState(false);
    const [showTest, setShowTest] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);

    const fetchServiceDetails = async () => {
        try {
            setLoading(true);
            // Fetch ISP services and find the one with matching ID
            const response = await ServicesAPI.getISPServices(true);
            const foundService = response.data.find(s => s.id.toString() === serviceId);

            if (foundService) {
                setService(foundService);
                // Fetch service status
                const statusResponse = await ServicesAPI.getServiceStatus(foundService.service.code);
                setStatus(statusResponse.data);
            } else {
                toast.error("Service not found");
                router.push("/services");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load service details");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (serviceId) {
            fetchServiceDetails();
        }
    }, [serviceId]);

    const handleTestConnection = async () => {
        if (!service) return;

        try {
            const result = await ServicesAPI.testServiceConnection(service.service.code);
            setTestResult(result);
            setShowTest(true);
        } catch (error: any) {
            toast.error(error.message || "Test failed");
        }
    };

    const handleViewLogs = () => {
        // This would be a separate page for service logs
        toast.success("Logs feature coming soon");
    };

    const handleViewAnalytics = () => {
        // This would be a separate page for service analytics
        toast.success("Analytics feature coming soon");
    };

    const handleServiceUpdated = () => {
        fetchServiceDetails();
        setEditMode(false);
    };

    const getStatusColor = () => {
        if (!status?.enabled) return "bg-gray-100 text-gray-800 border-gray-200";
        if (!status.configured) return "bg-amber-100 text-amber-800 border-amber-200";
        return "bg-green-100 text-green-800 border-green-200";
    };

    const getStatusText = () => {
        if (!status?.enabled) return "Disabled";
        if (!status.configured) return "Not Configured";
        return "Active";
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-64" />
                    </div>
                    <Skeleton className="h-64 w-full" />
                </div>
            </DashboardLayout>
        );
    }

    if (!service) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Service Not Found</h2>
                    <p className="text-gray-500 mb-6">The service you're looking for doesn't exist.</p>
                    <Button onClick={() => router.push("/services")}>
                        Back to Services
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <PageHeader
                    title={service.service.name}
                    description={service.service.description}
                    backButton
                    actions={[
                        {
                            label: "Test Connection",
                            onClick: handleTestConnection,
                            variant: "outline",
                            icon: <Wifi className="h-4 w-4 mr-2" />
                        },
                        {
                            label: "Manage Credentials",
                            onClick: () => setShowCredentials(true),
                            variant: "outline",
                            icon: <Shield className="h-4 w-4 mr-2" />
                        },
                        {
                            label: editMode ? "Cancel Edit" : "Edit Service",
                            onClick: () => setEditMode(!editMode),
                            variant: editMode ? "outline" : "default",
                            icon: <Settings className="h-4 w-4 mr-2" />
                        }
                    ]}
                />

                {/* Status Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <Badge className={`mt-1 ${getStatusColor()}`}>
                                        {getStatusText()}
                                    </Badge>
                                </div>
                                <Activity className="h-8 w-8 text-gray-300" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">API URL</p>
                                    <p className="font-medium truncate" title={service.baseUrl || "Not set"}>
                                        {service.baseUrl || "Not configured"}
                                    </p>
                                </div>
                                <Terminal className="h-8 w-8 text-gray-300" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Credentials</p>
                                    <p className="font-medium">
                                        {service.credentialCount} {service.credentialCount === 1 ? 'credential' : 'credentials'}
                                    </p>
                                </div>
                                <Database className="h-8 w-8 text-gray-300" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Last Updated</p>
                                    <p className="font-medium">
                                        {new Date(service.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <History className="h-8 w-8 text-gray-300" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                {editMode ? (
                    <ServiceManager
                        service={service}
                        mode="edit"
                        onSuccess={handleServiceUpdated}
                        onCancel={() => setEditMode(false)}
                    />
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="configuration">Configuration</TabsTrigger>
                            <TabsTrigger value="operations">Operations</TabsTrigger>
                            <TabsTrigger value="logs">Logs</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Service Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Service Code</h4>
                                                <p className="font-medium">{service.service.code}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Category</h4>
                                                <Badge variant="outline">{service.service.category}</Badge>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">API Version</h4>
                                                <p className="font-medium">{service.apiVersion}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Active Status</h4>
                                                <Badge variant={service.isActive ? "default" : "outline"}>
                                                    {service.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Enabled</h4>
                                                <Badge variant={service.isEnabled ? "default" : "outline"}>
                                                    {service.isEnabled ? "Enabled" : "Disabled"}
                                                </Badge>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Created</h4>
                                                <p className="font-medium">
                                                    {new Date(service.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Button
                                            variant="outline"
                                            className="h-24 flex flex-col items-center justify-center gap-2"
                                            onClick={handleTestConnection}
                                        >
                                            <Wifi className="h-6 w-6" />
                                            <span>Test Connection</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-24 flex flex-col items-center justify-center gap-2"
                                            onClick={() => setShowCredentials(true)}
                                        >
                                            <Shield className="h-6 w-6" />
                                            <span>Manage Credentials</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-24 flex flex-col items-center justify-center gap-2"
                                            onClick={handleViewLogs}
                                        >
                                            <FileText className="h-6 w-6" />
                                            <span>View Logs</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="configuration">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configuration Details</CardTitle>
                                    <CardDescription>Current service configuration</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Base URL</h4>
                                            <code className="block p-3 bg-gray-50 rounded-lg text-sm font-mono">
                                                {service.baseUrl || "Not configured"}
                                            </code>
                                        </div>

                                        {service.config && Object.keys(service.config).length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Service Configuration</h4>
                                                <pre className="p-3 bg-gray-50 rounded-lg text-sm overflow-auto max-h-80">
                                                    {JSON.stringify(service.config, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="operations">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Service Operations</CardTitle>
                                    <CardDescription>Available operations for this service</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    if (service.service.code === 'NETTV') {
                                                        ServicesAPI.getNetTVSubscribers(1, 10)
                                                            .then(() => toast.success("Fetched NetTV subscribers"))
                                                            .catch(err => toast.error(err.message));
                                                    } else {
                                                        toast.info(`Operations for ${service.service.code} coming soon`);
                                                    }
                                                }}
                                            >
                                                Test Operation
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleTestConnection}
                                            >
                                                Test Connection
                                            </Button>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Service-specific operations will be available based on service type.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="logs">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Service Logs</CardTitle>
                                    <CardDescription>Recent activity and logs</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-gray-500">
                                        <FileText className="h-12 w-12 mx-auto mb-4" />
                                        <p>Logs feature coming soon</p>
                                        <Button variant="outline" className="mt-4" onClick={handleViewLogs}>
                                            View Logs
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            {/* Modals */}
            {service && showCredentials && (
                <ServiceCredentialsDialog
                    service={service}
                    open={showCredentials}
                    onOpenChange={setShowCredentials}
                    onSuccess={fetchServiceDetails}
                />
            )}

            {service && showTest && testResult && (
                <ServiceTestDialog
                    service={service}
                    result={testResult}
                    open={showTest}
                    onOpenChange={setShowTest}
                />
            )}
        </DashboardLayout>
    );
}