// app/dashboard/services/settings/page.tsx
"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Settings,
    Database,
    Shield,
    Bell,
    Globe,
    Clock,
    Save,
    RotateCcw
} from "lucide-react";

export default function ServiceSettingsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Service Settings"
                    description="Configure global service integration settings"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* General Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                                <CardDescription>Global service integration preferences</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Auto-Sync Services</Label>
                                            <p className="text-sm text-gray-500">
                                                Automatically sync service data periodically
                                            </p>
                                        </div>
                                        <Switch />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Enable Service Monitoring</Label>
                                            <p className="text-sm text-gray-500">
                                                Monitor service health and send alerts
                                            </p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Cache Service Responses</Label>
                                            <p className="text-sm text-gray-500">
                                                Cache API responses for better performance
                                            </p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Default API Timeout (seconds)</Label>
                                        <Input type="number" defaultValue="30" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Retry Attempts</Label>
                                        <Input type="number" defaultValue="3" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Sync Interval (minutes)</Label>
                                        <Select defaultValue="15">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5 minutes</SelectItem>
                                                <SelectItem value="15">15 minutes</SelectItem>
                                                <SelectItem value="30">30 minutes</SelectItem>
                                                <SelectItem value="60">60 minutes</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Log Retention (days)</Label>
                                        <Select defaultValue="30">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="7">7 days</SelectItem>
                                                <SelectItem value="30">30 days</SelectItem>
                                                <SelectItem value="90">90 days</SelectItem>
                                                <SelectItem value="365">1 year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Security Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Security Settings</CardTitle>
                                <CardDescription>Service authentication and security preferences</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Encrypt All Credentials</Label>
                                            <p className="text-sm text-gray-500">
                                                Encrypt service credentials in database
                                            </p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Require Two-Factor Authentication</Label>
                                            <p className="text-sm text-gray-500">
                                                Require 2FA for service configuration changes
                                            </p>
                                        </div>
                                        <Switch />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>IP Whitelisting</Label>
                                            <p className="text-sm text-gray-500">
                                                Restrict service access to specific IP addresses
                                            </p>
                                        </div>
                                        <Switch />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Allowed IP Addresses (comma-separated)</Label>
                                    <Input placeholder="192.168.1.1, 10.0.0.1" />
                                    <p className="text-xs text-gray-500">
                                        Leave empty to allow access from any IP address
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Session Timeout (minutes)</Label>
                                    <Select defaultValue="30">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="15">15 minutes</SelectItem>
                                            <SelectItem value="30">30 minutes</SelectItem>
                                            <SelectItem value="60">60 minutes</SelectItem>
                                            <SelectItem value="120">2 hours</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button className="w-full justify-start" variant="outline">
                                    <Database className="h-4 w-4 mr-2" />
                                    Clear Service Cache
                                </Button>
                                <Button className="w-full justify-start" variant="outline">
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reset All Settings
                                </Button>
                                <Button className="w-full justify-start" variant="outline">
                                    <Globe className="h-4 w-4 mr-2" />
                                    Test All Connections
                                </Button>
                                <Button className="w-full justify-start" variant="outline">
                                    <Bell className="h-4 w-4 mr-2" />
                                    Notification Settings
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Save Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Save Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Apply all changes to service integration settings
                                </p>
                                <div className="flex gap-2">
                                    <Button className="flex-1">
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                    <Button variant="outline">
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Statistics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>System Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Active Services</span>
                                    <span className="font-medium">8</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Total API Calls</span>
                                    <span className="font-medium">12,847</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Cache Size</span>
                                    <span className="font-medium">45.2 MB</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Uptime</span>
                                    <span className="font-medium">99.8%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Last Backup</span>
                                    <span className="font-medium">2 hours ago</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}