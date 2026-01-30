// components/services/service-status-dashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Wifi,
    Shield,
    Server,
    Phone,
    Tv,
    CreditCard,
    Mail
} from "lucide-react";
import { ServiceStatus } from "@/types/service.types";
import { ServicesAPI } from "@/lib/api/service";
import { toast } from "react-hot-toast";

export function ServiceStatusDashboard() {
    const [statuses, setStatuses] = useState<ServiceStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStatuses = async () => {
        try {
            const response = await ServicesAPI.getAllServiceStatuses();
            setStatuses(response.data);
        } catch (error: any) {
            toast.error("Failed to load service statuses");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStatuses();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStatuses();
    };

    const getServiceIcon = (code: string) => {
        const icons: Record<string, React.ReactNode> = {
            TSHUL: <CreditCard className="h-4 w-4" />,
            RADIUS: <Shield className="h-4 w-4" />,
            NETTV: <Tv className="h-4 w-4" />,
            YEASTAR: <Phone className="h-4 w-4" />,
            MIKROTIK: <Server className="h-4 w-4" />,
            ESEWA: <CreditCard className="h-4 w-4" />,
            KHALTI: <CreditCard className="h-4 w-4" />,
            SMS_GATEWAY: <Mail className="h-4 w-4" />,
            EMAIL_SERVICE: <Mail className="h-4 w-4" />,
        };
        return icons[code] || <Server className="h-4 w-4" />;
    };

    const getStatusBadge = (status: ServiceStatus) => {
        if (!status.enabled) {
            return (
                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                    <XCircle className="h-3 w-3 mr-1" />
                    Disabled
                </Badge>
            );
        }

        if (!status.configured) {
            return (
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Configured
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
            </Badge>
        );
    };

    const activeServices = statuses.filter(s => s.enabled && s.configured).length;
    const totalServices = statuses.length;
    const healthPercentage = totalServices > 0 ? (activeServices / totalServices) * 100 : 0;

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Service Status Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-20" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Service Status Dashboard</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                        Monitor all integrated services
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </CardHeader>

            <CardContent>
                {/* Health Overview */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="font-medium">Overall Health</h3>
                            <p className="text-sm text-gray-500">
                                {activeServices} of {totalServices} services active
                            </p>
                        </div>
                        <div className="text-2xl font-bold">
                            {Math.round(healthPercentage)}%
                        </div>
                    </div>
                    <Progress value={healthPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                    </div>
                </div>

                {/* Services List */}
                <div className="space-y-4">
                    {statuses.map((status) => (
                        <div
                            key={status.code}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${status.enabled && status.configured
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {getServiceIcon(status.code)}
                                </div>
                                <div>
                                    <div className="font-medium">{status.serviceName || status.code}</div>
                                    <div className="text-xs text-gray-500">
                                        {status.baseUrl || 'No URL configured'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {getStatusBadge(status)}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={async () => {
                                        try {
                                            const result = await ServicesAPI.testServiceConnection(status.code);
                                            toast[result.connected ? 'success' : 'error'](result.message);
                                        } catch (error: any) {
                                            toast.error("Test failed");
                                        }
                                    }}
                                >
                                    <Wifi className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Status Legend</h4>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="text-xs">Active & Configured</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                            <span className="text-xs">Not Configured</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                            <span className="text-xs">Disabled</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                            <span className="text-xs">Error</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}