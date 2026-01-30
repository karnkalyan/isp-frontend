// components/services/service-catalog-card.tsx
"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Settings,
    ExternalLink,
    CheckCircle,
    XCircle,
    CreditCard,
    Shield,
    Tv,
    Phone,
    Server,
    Mail
} from "lucide-react";
import { Service } from "@/types/service.types";
import { ServiceConfigureDialog } from "./service-configure-dialog";
import { useState } from "react";

interface ServiceCatalogCardProps {
    service: Service;
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

export function ServiceCatalogCard({ service }: ServiceCatalogCardProps) {
    const [showConfigure, setShowConfigure] = useState(false);

    return (
        <>
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-lg ${categoryColors[service.category]}`}>
                                {serviceIcons[service.code] || <Settings className="h-5 w-5" />}
                            </div>
                            <div>
                                <h3 className="font-semibold">{service.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={`text-xs ${categoryColors[service.category]}`}>
                                        {service.category}
                                    </Badge>
                                    {service.isActive ? (
                                        <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800 border-gray-200">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Inactive
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                            {service._count?.ispServices || 0} ISP(s)
                        </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {service.description}
                    </p>

                    <div className="text-xs text-gray-500 mb-2">
                        <span className="font-medium">Service Code:</span> {service.code}
                    </div>
                </CardContent>

                <CardFooter className="border-t pt-4 flex justify-between">
                    <div className="text-xs text-gray-500">
                        Updated {new Date(service.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowConfigure(true)}
                        >
                            <Settings className="h-3 w-3 mr-1" />
                            Configure
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                        >
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {showConfigure && (
                <ServiceConfigureDialog
                    service={{
                        id: 0,
                        ispId: 0,
                        serviceId: service.id,
                        isActive: false,
                        isEnabled: true,
                        isDeleted: false,
                        baseUrl: "",
                        apiVersion: "v1",
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        service: service,
                        credentials: [],
                        credentialCount: 0
                    }}
                    open={showConfigure}
                    onOpenChange={setShowConfigure}
                    onSuccess={() => { }}
                />
            )}
        </>
    );
}