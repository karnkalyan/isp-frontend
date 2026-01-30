// components/services/active-services-list.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, RefreshCw } from "lucide-react";
import { ISPService } from "@/types/service.types";
import { ServicesAPI } from "@/lib/api/service";
import { ServiceCard } from "./service-card";
import { toast } from "react-hot-toast";

export function ActiveServicesList() {
    const [services, setServices] = useState<ISPService[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await ServicesAPI.getISPServices(true);
            setServices(response.data);
        } catch (error: any) {
            toast.error("Failed to load services");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchServices();
    };

    const filteredServices = services.filter((service) => {
        // Search filter
        const matchesSearch =
            service.service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.service.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.service.description.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        let matchesStatus = true;
        if (statusFilter === "active") matchesStatus = service.isActive;
        if (statusFilter === "inactive") matchesStatus = !service.isActive;
        if (statusFilter === "configured") matchesStatus = !!service.baseUrl;
        if (statusFilter === "unconfigured") matchesStatus = !service.baseUrl;

        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: services.length,
        active: services.filter(s => s.isActive).length,
        configured: services.filter(s => !!s.baseUrl).length,
        withCredentials: services.filter(s => s.credentialCount > 0).length,
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Services</CardTitle>
                    <CardDescription>Services configured for your ISP</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-64 rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle>Active Services</CardTitle>
                        <CardDescription>Services configured for your ISP</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {/* Stats and Filters */}
                <div className="space-y-4 mb-6">
                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                            <div className="text-sm text-blue-600">Total Services</div>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                            <div className="text-2xl font-bold text-green-700">{stats.active}</div>
                            <div className="text-sm text-green-600">Active</div>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                            <div className="text-2xl font-bold text-purple-700">{stats.configured}</div>
                            <div className="text-sm text-purple-600">Configured</div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                            <div className="text-2xl font-bold text-amber-700">{stats.withCredentials}</div>
                            <div className="text-sm text-amber-600">With Credentials</div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search services..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="active">Active</TabsTrigger>
                                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                                <TabsTrigger value="configured">Configured</TabsTrigger>
                                <TabsTrigger value="unconfigured">Unconfigured</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {/* Services Grid */}
                {filteredServices.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Filter className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No services found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchQuery
                                ? `No services match "${searchQuery}"`
                                : "No services match the selected filters"}
                        </p>
                        {searchQuery && (
                            <Button variant="outline" onClick={() => setSearchQuery("")}>
                                Clear Search
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredServices.map((service) => (
                            <ServiceCard
                                key={service.id}
                                service={service}
                                onStatusChange={fetchServices}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}