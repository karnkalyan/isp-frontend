// components/services/service-operations.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    PlayCircle,
    StopCircle,
    RefreshCw,
    Download,
    Upload,
    Terminal,
    BarChart,
    Activity,
    Clock,
    CheckCircle,
    XCircle,
    Tv,
    Phone,
    Shield
} from "lucide-react";
import { ServicesAPI } from "@/lib/api/service";
import { toast } from "react-hot-toast";

interface ServiceOperation {
    id: string;
    service: string;
    operation: string;
    status: 'success' | 'error' | 'running';
    timestamp: string;
    duration?: number;
    details?: any;
}

interface ServiceOperationsProps {
    limit?: number;
}

export function ServiceOperations({ limit }: ServiceOperationsProps) {
    const [operations, setOperations] = useState<ServiceOperation[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("recent");

    // Mock data for demonstration
    const mockOperations: ServiceOperation[] = [
        {
            id: "1",
            service: "NETTV",
            operation: "Sync Subscribers",
            status: "success",
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            duration: 2300,
        },
        {
            id: "2",
            service: "RADIUS",
            operation: "Create User",
            status: "success",
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            duration: 450,
        },
        {
            id: "3",
            service: "YEASTAR",
            operation: "Get Active Calls",
            status: "error",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            duration: 1200,
            details: "Connection timeout",
        },
        {
            id: "4",
            service: "TSHUL",
            operation: "Create Invoice",
            status: "success",
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            duration: 1800,
        },
        {
            id: "5",
            service: "MIKROTIK",
            operation: "Get System Resources",
            status: "running",
            timestamp: new Date().toISOString(),
        },
    ];

    useEffect(() => {
        setOperations(limit ? mockOperations.slice(0, limit) : mockOperations);
    }, [limit]);

    const handleQuickOperation = async (operation: string) => {
        try {
            setLoading(true);

            switch (operation) {
                case 'sync':
                    // Sync all services
                    toast.success("Starting sync operation...");
                    break;
                case 'test_all':
                    // Test all connections
                    toast.success("Testing all connections...");
                    break;
                case 'export':
                    // Export configuration
                    toast.success("Exporting configuration...");
                    break;
                case 'import':
                    // Import configuration
                    toast.success("Importing configuration...");
                    break;
            }

            // Add to operations log
            const newOp: ServiceOperation = {
                id: Date.now().toString(),
                service: "SYSTEM",
                operation: operation.charAt(0).toUpperCase() + operation.slice(1).replace('_', ' '),
                status: "running",
                timestamp: new Date().toISOString(),
            };

            setOperations(prev => [newOp, ...prev.slice(0, 9)]);

        } catch (error: any) {
            toast.error(error.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'running':
                return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const formatDuration = (ms?: number) => {
        if (!ms) return '';
        return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Service Operations</CardTitle>
                <CardDescription>Monitor and execute service operations</CardDescription>
            </CardHeader>

            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3">
                        <TabsTrigger value="recent">Recent</TabsTrigger>
                        <TabsTrigger value="quick">Quick Actions</TabsTrigger>
                        <TabsTrigger value="logs">Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="recent" className="space-y-4">
                        <div className="space-y-3">
                            {operations.map((op) => (
                                <div
                                    key={op.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(op.status)}
                                        <div>
                                            <div className="font-medium">{op.operation}</div>
                                            <div className="text-xs text-gray-500">
                                                {op.service} • {new Date(op.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {op.duration && (
                                            <Badge variant="outline" className="text-xs">
                                                {formatDuration(op.duration)}
                                            </Badge>
                                        )}
                                        <Badge variant={
                                            op.status === 'success' ? 'default' :
                                                op.status === 'error' ? 'destructive' : 'secondary'
                                        } className="text-xs">
                                            {op.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" size="sm" className="w-full">
                            <RefreshCw className="h-3 w-3 mr-2" />
                            Load More
                        </Button>
                    </TabsContent>

                    <TabsContent value="quick" className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="h-24 flex flex-col items-center justify-center gap-2"
                                onClick={() => handleQuickOperation('sync')}
                                disabled={loading}
                            >
                                <RefreshCw className="h-6 w-6" />
                                <span>Sync All</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="h-24 flex flex-col items-center justify-center gap-2"
                                onClick={() => handleQuickOperation('test_all')}
                                disabled={loading}
                            >
                                <Activity className="h-6 w-6" />
                                <span>Test All</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="h-24 flex flex-col items-center justify-center gap-2"
                                onClick={() => handleQuickOperation('export')}
                                disabled={loading}
                            >
                                <Download className="h-6 w-6" />
                                <span>Export Config</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="h-24 flex flex-col items-center justify-center gap-2"
                                onClick={() => handleQuickOperation('import')}
                                disabled={loading}
                            >
                                <Upload className="h-6 w-6" />
                                <span>Import Config</span>
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Service-specific Actions</h4>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="secondary" size="sm">
                                    <Tv className="h-3 w-3 mr-2" />
                                    NetTV: Sync
                                </Button>
                                <Button variant="secondary" size="sm">
                                    <Phone className="h-3 w-3 mr-2" />
                                    Yeastar: Get Calls
                                </Button>
                                <Button variant="secondary" size="sm">
                                    <Terminal className="h-3 w-3 mr-2" />
                                    Mikrotik: Resources
                                </Button>
                                <Button variant="secondary" size="sm">
                                    <Shield className="h-3 w-3 mr-2" />
                                    Radius: List Users
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="logs">
                        <ScrollArea className="h-[300px] rounded-md border p-4">
                            <div className="space-y-4">
                                {operations.map((op) => (
                                    <div key={op.id} className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-gray-500">
                                                {new Date(op.timestamp).toLocaleString()}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                {op.service}
                                            </Badge>
                                            <Badge variant={
                                                op.status === 'success' ? 'default' :
                                                    op.status === 'error' ? 'destructive' : 'secondary'
                                            } className="text-xs">
                                                {op.status}
                                            </Badge>
                                        </div>
                                        <div className="font-mono text-sm bg-gray-50 p-2 rounded">
                                            {op.operation}
                                            {op.details && (
                                                <div className="text-red-500 mt-1">{op.details}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                {/* Quick Stats */}
                <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span>{operations.filter(o => o.status === 'success').length} Success</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                <span>{operations.filter(o => o.status === 'error').length} Errors</span>
                            </div>
                        </div>
                        <div className="text-gray-500">
                            Last 24 hours
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}