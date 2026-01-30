// components/services/service-card.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Settings,
    Power,
    Wifi,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertCircle,
    ExternalLink,
    Shield,
    CreditCard,
    Tv,
    Phone,
    Server,
    Lock,
    Mail
} from "lucide-react";
import { ISPService, ServiceStatus } from "@/types/service.types";
import { ServicesAPI } from "@/lib/api/service";
import { toast } from "react-hot-toast";
import { ServiceConfigureDialog } from "./service-configure-dialog";
import { ServiceTestDialog } from "./service-test-dialog";
import { ServiceCredentialsDialog } from "./service-credentials-dialog";

interface ServiceCardProps {
    service: ISPService;
    onStatusChange: () => void;
}

const serviceIcons: Record<string, React.ReactNode> = {
    TSHUL: <CreditCard className="h-5 w-5" />,
    RADIUS: <Shield className="h-5 w-5" />,
    NETTV: <Tv className="h-5 w-5" />,
    YEASTAR: <Phone className="h-5 w-5" />,
    MIKROTIK: <Server className="h-5 w-5" />,
    HUAWEI_OLT: <Server className="h-5 w-5" />,
    ZTE_OLT: <Server className="h-5 w-5" />,
    FORTIGATE: <Shield className="h-5 w-5" />,
    ESEWA: <CreditCard className="h-5 w-5" />,
    KHALTI: <CreditCard className="h-5 w-5" />,
    SMS_GATEWAY: <Mail className="h-5 w-5" />,
    EMAIL_SERVICE: <Mail className="h-5 w-5" />
};

const categoryColors: Record<string, string> = {
    BILLING: "bg-green-100 text-green-800 border-green-200",
    AUTHENTICATION: "bg-blue-100 text-blue-800 border-blue-200",
    PAYMENT: "bg-purple-100 text-purple-800 border-purple-200",
    STREAMING: "bg-orange-100 text-orange-800 border-orange-200",
    NETWORK: "bg-gray-100 text-gray-800 border-gray-200",
    VOIP: "bg-pink-100 text-pink-800 border-pink-200",
    SECURITY: "bg-red-100 text-red-800 border-red-200",
    COMMUNICATION: "bg-cyan-100 text-cyan-800 border-cyan-200",
    OTHER: "bg-yellow-100 text-yellow-800 border-yellow-200"
};

export function ServiceCard({ service, onStatusChange }: ServiceCardProps) {
    const [loading, setLoading] = useState(false);
    const [showConfigure, setShowConfigure] = useState(false);
    const [showTest, setShowTest] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    const handleToggleActivation = async () => {
        try {
            setLoading(true);
            await ServicesAPI.toggleServiceActivation(service.service.code, !service.isActive);
            toast.success(`Service ${!service.isActive ? 'activated' : 'deactivated'} successfully`);
            onStatusChange();
        } catch (error: any) {
            toast.error(error.message || "Failed to update service status");
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        try {
            setLoading(true);
            const result = await ServicesAPI.testServiceConnection(service.service.code);
            setTestResult(result);
            setShowTest(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to test connection");
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = () => {
        if (!service.isActive) return <XCircle className="h-4 w-4 text-red-500" />;
        if (!service.baseUrl) return <AlertCircle className="h-4 w-4 text-amber-500" />;
        if (service.credentialCount === 0) return <AlertCircle className="h-4 w-4 text-amber-500" />;
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    };

    const getStatusText = () => {
        if (!service.isActive) return "Inactive";
        if (!service.baseUrl) return "Not Configured";
        if (service.credentialCount === 0) return "Missing Credentials";
        return "Active";
    };

    const getStatusColor = () => {
        if (!service.isActive) return "bg-red-100 text-red-800 border-red-200";
        if (!service.baseUrl || service.credentialCount === 0) return "bg-amber-100 text-amber-800 border-amber-200";
        return "bg-green-100 text-green-800 border-green-200";
    };

    return (
        <>
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${categoryColors[service.service.category]}`}>
                                {serviceIcons[service.service.code] || <Settings className="h-5 w-5" />}
                            </div>
                            <div>
                                <CardTitle className="text-lg">{service.service.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
                                        {getStatusIcon()} {getStatusText()}
                                    </Badge>
                                    <Badge variant="outline" className={`text-xs ${categoryColors[service.service.category]}`}>
                                        {service.service.category}
                                    </Badge>
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowConfigure(true)}
                            disabled={loading}
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="pb-3">
                    <p className="text-sm text-gray-600 mb-4">{service.service.description}</p>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-500">API URL:</span>
                                <div className="font-medium truncate" title={service.baseUrl || "Not set"}>
                                    {service.baseUrl || "Not configured"}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Version:</span>
                                <div className="font-medium">{service.apiVersion}</div>
                            </div>
                            <div>
                                <span className="text-gray-500">Credentials:</span>
                                <div className="font-medium">
                                    {service.credentialCount} {service.credentialCount === 1 ? 'credential' : 'credentials'}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Last Updated:</span>
                                <div className="font-medium">
                                    {new Date(service.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {service.baseUrl && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium mb-2">Connection Status</div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {service.isActive ? (
                                            <>
                                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                                <span className="text-sm text-green-600">Connected</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                                                <span className="text-sm text-gray-500">Disconnected</span>
                                            </>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleTestConnection}
                                        disabled={loading}
                                    >
                                        <Wifi className="h-3 w-3 mr-1" />
                                        Test
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="border-t pt-3 flex justify-between">
                    <div className="flex gap-2">
                        <Button
                            variant={service.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={handleToggleActivation}
                            disabled={loading}
                        >
                            <Power className="h-3 w-3 mr-1" />
                            {service.isActive ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCredentials(true)}
                            disabled={loading || !service.baseUrl}
                        >
                            <Lock className="h-3 w-3 mr-1" />
                            Credentials
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onStatusChange}
                            disabled={loading}
                        >
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {showConfigure && (
                <ServiceConfigureDialog
                    service={service}
                    open={showConfigure}
                    onOpenChange={setShowConfigure}
                    onSuccess={onStatusChange}
                />
            )}

            {showTest && testResult && (
                <ServiceTestDialog
                    service={service}
                    result={testResult}
                    open={showTest}
                    onOpenChange={setShowTest}
                />
            )}

            {showCredentials && (
                <ServiceCredentialsDialog
                    service={service}
                    open={showCredentials}
                    onOpenChange={setShowCredentials}
                    onSuccess={onStatusChange}
                />
            )}
        </>
    );
}