// components/services/service-catalog.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Filter } from "lucide-react";
import { Service, ServiceCategory } from "@/types/service.types";
import { ServicesAPI } from "@/lib/api/service";
import { ServiceCatalogCard } from "./service-catalog-card";
import { toast } from "react-hot-toast";

const categories: ServiceCategory[] = [
    "ALL",
    "BILLING",
    "AUTHENTICATION",
    "PAYMENT",
    "STREAMING",
    "NETWORK",
    "VOIP",
    "SECURITY",
    "COMMUNICATION",
    "OTHER"
] as any;

export function ServiceCatalog() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | "ALL">("ALL");

    const fetchServices = async () => {
        try {
            setLoading(true);
            const filters: any = {};

            if (selectedCategory !== "ALL") {
                filters.category = selectedCategory;
            }

            if (searchQuery) {
                filters.search = searchQuery;
            }

            const response = await ServicesAPI.getServicesCatalog(filters);
            setServices(response.data);
        } catch (error: any) {
            toast.error("Failed to load services catalog");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [selectedCategory]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchServices();
    };

    const filteredServices = services.filter(service =>
        selectedCategory === "ALL" || service.category === selectedCategory
    );

    const getCategoryCount = (category: ServiceCategory) => {
        return services.filter(s => s.category === category).length;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-40 rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Service Catalog</CardTitle>
                <CardDescription>
                    Browse available services to integrate with your ISP
                </CardDescription>
            </CardHeader>

            <CardContent>
                {/* Search and Filters */}
                <div className="space-y-4 mb-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search services..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button type="submit">
                            <Filter className="h-4 w-4 mr-2" />
                            Search
                        </Button>
                    </form>

                    {/* Category Tabs */}
                    <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
                        <TabsList className="flex-wrap h-auto">
                            {categories.map((category) => (
                                <TabsTrigger key={category} value={category} className="relative">
                                    {category === "ALL" ? "All" : category}
                                    {category !== "ALL" && (
                                        <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                                            {getCategoryCount(category)}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                {/* Services Grid */}
                {filteredServices.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Search className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No services found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchQuery
                                ? `No services match "${searchQuery}"`
                                : "No services available in this category"}
                        </p>
                        {searchQuery && (
                            <Button variant="outline" onClick={() => setSearchQuery("")}>
                                Clear Search
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredServices.map((service) => (
                            <ServiceCatalogCard key={service.id} service={service} />
                        ))}
                    </div>
                )}

                {/* Statistics */}
                <div className="mt-8 pt-6 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{services.length}</div>
                            <div className="text-sm text-gray-500">Total Services</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">
                                {services.filter(s => s.isActive).length}
                            </div>
                            <div className="text-sm text-gray-500">Active Services</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">
                                {Array.from(new Set(services.map(s => s.category))).length}
                            </div>
                            <div className="text-sm text-gray-500">Categories</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">
                                {services.reduce((acc, s) => acc + (s._count?.ispServices || 0), 0)}
                            </div>
                            <div className="text-sm text-gray-500">Total Integrations</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}