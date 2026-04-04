// components/services/service-quick-actions.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Zap,
    Rocket,
    Shield,
    Database,
    Globe,
    Cpu,
    BarChart,
    Terminal,
    Code,
    Key
} from "lucide-react";
import { ServicesAPI } from "@/lib/api/services";
import { toast } from "react-hot-toast";

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    service: string;
    action: string;
    color: string;
}

export function ServiceQuickActions() {
    const [loading, setLoading] = useState(false);
    const [selectedService, setSelectedService] = useState<string>("all");

    const quickActions: QuickAction[] = [
        {
            id: "sync-all",
            title: "Sync All Services",
            description: "Sync data from all active services",
            icon: <Database className="h-5 w-5" />,
            service: "all",
            action: "sync",
            color: "bg-blue-100 text-blue-700 border-blue-200"
        },
        {
            id: "test-connections",
            title: "Test All Connections",
            description: "Test connectivity for all services",
            icon: <Globe className="h-5 w-5" />,
            service: "all",
            action: "test",
            color: "bg-green-100 text-green-700 border-green-200"
        },
        {
            id: "clear-cache",
            title: "Clear Service Cache",
            description: "Clear cached service data",
            icon: <Cpu className="h-5 w-5" />,
            service: "all",
            action: "clear_cache",
            color: "bg-purple-100 text-purple-700 border-purple-200"
        },
        {
            id: "nettv-sync",
            title: "Sync NetTV Subscribers",
            description: "Sync all NetTV subscribers",
            icon: <BarChart className="h-5 w-5" />,
            service: "NETTV",
            action: "sync_subscribers",
            color: "bg-orange-100 text-orange-700 border-orange-200"
        },
        {
            id: "yeastar-calls",
            title: "Get Active Calls",
            description: "Fetch current active calls",
            icon: <Terminal className="h-5 w-5" />,
            service: "YEASTAR",
            action: "get_calls",
            color: "bg-pink-100 text-pink-700 border-pink-200"
        },
        {
            id: "mikrotik-stats",
            title: "Router Statistics",
            description: "Get MikroTik system stats",
            icon: <Code className="h-5 w-5" />,
            service: "MIKROTIK",
            action: "get_stats",
            color: "bg-cyan-100 text-cyan-700 border-cyan-200"
        },
        {
            id: "radius-users",
            title: "List Radius Users",
            description: "Get all Radius users",
            icon: <Shield className="h-5 w-5" />,
            service: "RADIUS",
            action: "list_users",
            color: "bg-red-100 text-red-700 border-red-200"
        },
        {
            id: "refresh-tokens",
            title: "Refresh Tokens",
            description: "Refresh all service tokens",
            icon: <Key className="h-5 w-5" />,
            service: "all",
            action: "refresh_tokens",
            color: "bg-amber-100 text-amber-700 border-amber-200"
        }
    ];

    const filteredActions = selectedService === "all"
        ? quickActions
        : quickActions.filter(action => action.service === selectedService || action.service === "all");

    const handleQuickAction = async (action: QuickAction) => {
        try {
            setLoading(true);

            let message = "";
            let success = false;

            switch (action.action) {
                case "sync":
                    message = "Syncing all services...";
                    // Implement sync logic
                    break;
                case "test":
                    message = "Testing all connections...";
                    // Implement test logic
                    break;
                case "sync_subscribers":
                    message = "Syncing NetTV subscribers...";
                    // Implement NetTV sync
                    break;
                case "get_calls":
                    message = "Fetching active calls...";
                    // Implement Yeastar calls
                    break;
                default:
                    message = "Executing action...";
            }

            toast.loading(message, { duration: 2000 });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast.success("Action completed successfully");

        } catch (error: any) {
            toast.error(error.message || "Action failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription>
                            Common service operations at your fingertips
                        </CardDescription>
                    </div>
                    <div className="w-48">
                        <Select value={selectedService} onValueChange={setSelectedService}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by service" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Services</SelectItem>
                                <SelectItem value="NETTV">NetTV</SelectItem>
                                <SelectItem value="YEASTAR">Yeastar</SelectItem>
                                <SelectItem value="MIKROTIK">MikroTik</SelectItem>
                                <SelectItem value="RADIUS">Radius</SelectItem>
                                <SelectItem value="TSHUL">TShul</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredActions.map((action) => (
                        <button
                            key={action.id}
                            className={`p-4 border rounded-lg text-left hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${action.color} hover:opacity-90`}
                            onClick={() => handleQuickAction(action)}
                            disabled={loading}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 rounded-lg ${action.color.replace('100', '50').replace('700', '600')}`}>
                                    {action.icon}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {action.service === "all" ? "All" : action.service}
                                </Badge>
                            </div>
                            <h3 className="font-semibold mb-1">{action.title}</h3>
                            <p className="text-sm opacity-80">{action.description}</p>
                        </button>
                    ))}
                </div>

                {/* Custom Action */}
                <div className="mt-6 p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium mb-1">Custom Service Action</h4>
                            <p className="text-sm text-gray-600">Execute custom operation on any service</p>
                        </div>
                        <Rocket className="h-8 w-8 text-gray-400" />
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="custom-service">Service</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select service" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NETTV">NetTV</SelectItem>
                                    <SelectItem value="YEASTAR">Yeastar</SelectItem>
                                    <SelectItem value="MIKROTIK">MikroTik</SelectItem>
                                    <SelectItem value="RADIUS">Radius</SelectItem>
                                    <SelectItem value="TSHUL">TShul</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="custom-action">Action</Label>
                            <Input
                                id="custom-action"
                                placeholder="e.g., sync, test, restart"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="custom-params">Parameters (JSON)</Label>
                            <Input
                                id="custom-params"
                                placeholder='{"param": "value"}'
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button>
                            Execute Custom Action
                        </Button>
                    </div>
                </div>

                {/* Action History */}
                <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium mb-3">Recent Actions</h4>
                    <div className="space-y-2">
                        {[
                            { action: "NetTV Subscribers Synced", time: "2 minutes ago", success: true },
                            { action: "Yeastar Calls Fetched", time: "5 minutes ago", success: true },
                            { action: "MikroTik Connection Test", time: "10 minutes ago", success: false },
                            { action: "All Services Tested", time: "15 minutes ago", success: true },
                        ].map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-3">
                                    {item.success ? (
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    ) : (
                                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                    )}
                                    <span className="text-sm">{item.action}</span>
                                </div>
                                <span className="text-xs text-gray-500">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}