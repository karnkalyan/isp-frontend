// components/services/active-services-list.tsx - GROUPED VERSION
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Search, 
    Filter, 
    RefreshCw,
    Settings,
    Power,
    Lock,
    Wifi,
    CheckCircle,
    XCircle,
    AlertCircle,
    Phone,
    Smartphone,
    CreditCard
} from "lucide-react";
import { ISPService } from "@/types/service.types";
import { ServicesAPI } from "@/lib/api/service";
import { ServiceCard } from "./service-card";
import { toast } from "react-hot-toast";
import { ServiceConfigureDialog } from "./service-configure-dialog";
import { ServiceTestDialog } from "./service-test-dialog";
import { ServiceCredentialsDialog } from "./service-credentials-dialog";

interface GroupedServiceCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    category: string;
    services: ISPService[];
    onStatusChange: () => void;
}

function GroupedServiceCard({
    title,
    description,
    icon,
    category,
    services,
    onStatusChange
}: GroupedServiceCardProps) {
    const router = useRouter();
    const [activeService, setActiveService] = useState<ISPService | null>(null);
    const [showConfigure, setShowConfigure] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [showTest, setShowTest] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleToggleActivation = async (service: ISPService) => {
        try {
            setActionLoading(service.service.code + '-toggle');
            await ServicesAPI.toggleServiceActivation(service.service.code, !service.isActive);
            toast.success(`Service ${!service.isActive ? 'activated' : 'deactivated'} successfully`);
            onStatusChange();
        } catch (error: any) {
            toast.error(error.message || "Failed to update service status");
        } finally {
            setActionLoading(null);
        }
    };

    const handleTestConnection = async (service: ISPService) => {
        try {
            setActionLoading(service.service.code + '-test');
            const result = await ServicesAPI.testServiceConnection(service.service.code);
            setTestResult(result);
            setActiveService(service);
            setShowTest(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to test connection");
        } finally {
            setActionLoading(null);
        }
    };

    const handleSetDefault = async (targetService: ISPService) => {
        try {
            setActionLoading(targetService.service.code + '-default');
            const currentConfig = targetService.config && typeof targetService.config === 'object' ? targetService.config : {};
            const newConfig = { ...currentConfig, isDefault: true };
            
            await ServicesAPI.configureService({
                serviceCode: targetService.service.code,
                baseUrl: targetService.baseUrl,
                apiVersion: targetService.apiVersion,
                config: newConfig,
                isActive: targetService.isActive
            });
            toast.success(`${targetService.service.name} set as default successfully`);
            onStatusChange();
        } catch (error: any) {
            toast.error(error.message || "Failed to set default service");
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusIcon = (service: ISPService) => {
        if (!service.isActive) return <XCircle className="h-3.5 w-3.5 text-red-500" />;
        if (!service.baseUrl) return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />;
        if (service.credentialCount === 0) return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />;
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    };

    const getStatusText = (service: ISPService) => {
        if (!service.isActive) return "Inactive";
        if (!service.baseUrl) return "Not Configured";
        if (service.credentialCount === 0) return "Missing Credentials";
        return "Active";
    };

    const getStatusColor = (service: ISPService) => {
        if (!service.isActive) return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30";
        if (!service.baseUrl || service.credentialCount === 0) return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30";
    };

    const categoryColors: Record<string, string> = {
        COMMUNICATION: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/30",
        VOIP: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30",
    };

    return (
        <Card className="hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] rounded-xl overflow-hidden relative col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${categoryColors[category] || "bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400"}`}>
                            {icon}
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">{title}</CardTitle>
                            <CardDescription className="mt-1 text-sm">{description}</CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className={`text-xs px-2.5 py-1 ${categoryColors[category] || ""}`}>
                        {category}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {services.map((service) => {
                        const isDefault = service.config && service.config.isDefault === true;
                        const isLoading = actionLoading?.startsWith(service.service.code);
                        
                        return (
                            <div 
                                key={service.id} 
                                className={`p-5 rounded-xl border transition-all relative flex flex-col justify-between h-full group ${
                                    isDefault 
                                        ? "bg-primary/5 border-primary/45 shadow-sm dark:bg-primary/5" 
                                        : "bg-card border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700"
                                }`}
                            >
                                {isDefault && (
                                    <Badge className="absolute -top-2.5 left-4 bg-primary text-white shadow-sm gap-1 text-[10px] font-bold px-2 py-0.5">
                                        ★ DEFAULT PROVIDER
                                    </Badge>
                                )}
                                
                                <div className="mb-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-base font-bold text-foreground">{service.service.name}</h4>
                                            <div className="text-xs text-muted-foreground font-mono mt-0.5">{service.service.code}</div>
                                        </div>
                                        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getStatusColor(service)}`}>
                                            <span className="flex items-center gap-1">
                                                {getStatusIcon(service)}
                                                {getStatusText(service)}
                                            </span>
                                        </Badge>
                                    </div>

                                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{service.service.description}</p>

                                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-3 mb-2">
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">API URL</span>
                                            <span className="font-semibold block truncate" title={service.baseUrl || "Not set"}>
                                                {service.baseUrl || "Not configured"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Version</span>
                                            <span className="font-semibold block">{service.apiVersion || "v1"}</span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Credentials</span>
                                            <span className="font-semibold block">{service.credentialCount} active</span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Last Updated</span>
                                            <span className="font-semibold block">{new Date(service.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                                    <Button
                                        variant={service.isActive ? "destructive" : "default"}
                                        size="sm"
                                        className="h-8 text-xs flex-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleActivation(service);
                                        }}
                                        disabled={!!isLoading}
                                    >
                                        <Power className="h-3 w-3 mr-1" />
                                        {service.isActive ? "Deactivate" : "Activate"}
                                    </Button>

                                    {(service.service.code === 'TSHUL' || service.service.code === 'NEPURIX') && (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(service.service.code === 'TSHUL' ? '/tshul' : '/nepurix');
                                            }}
                                        >
                                            Dashboard
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs flex-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveService(service);
                                            setShowConfigure(true);
                                        }}
                                        disabled={!!isLoading}
                                    >
                                        <Settings className="h-3 w-3 mr-1" />
                                        Configure
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveService(service);
                                            setShowCredentials(true);
                                        }}
                                        disabled={!!isLoading || !service.baseUrl}
                                        title="Credentials"
                                    >
                                        <Lock className="h-3.5 w-3.5" />
                                    </Button>

                                    {service.baseUrl && service.isActive && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleTestConnection(service);
                                            }}
                                            disabled={!!isLoading}
                                            title="Test Connection"
                                        >
                                            <Wifi className="h-3.5 w-3.5" />
                                        </Button>
                                    )}

                                    {service.isActive && service.credentialCount > 0 && !isDefault && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 text-xs w-full mt-1 bg-primary/10 text-primary hover:bg-primary/20"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSetDefault(service);
                                            }}
                                            disabled={!!isLoading}
                                        >
                                            ★ Set as Default
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>

            {showConfigure && activeService && (
                <ServiceConfigureDialog
                    service={activeService}
                    open={showConfigure}
                    onOpenChange={setShowConfigure}
                    onSuccess={onStatusChange}
                />
            )}

            {showTest && activeService && testResult && (
                <ServiceTestDialog
                    service={activeService}
                    result={testResult}
                    open={showTest}
                    onOpenChange={setShowTest}
                />
            )}

            {showCredentials && activeService && (
                <ServiceCredentialsDialog
                    service={activeService}
                    open={showCredentials}
                    onOpenChange={setShowCredentials}
                    onSuccess={onStatusChange}
                />
            )}
        </Card>
    );
}

export function ActiveServicesList() {
    const router = useRouter();
    const [services, setServices] = useState<ISPService[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await ServicesAPI.getISPServices(true);
            if (response.success) {
                setServices(response.data);
            } else {
                toast.error("Failed to load services");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load services");
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
            (service.service.description && service.service.description.toLowerCase().includes(searchQuery.toLowerCase()));

        // Status filter
        let matchesStatus = true;
        if (statusFilter === "active") matchesStatus = service.isActive;
        if (statusFilter === "inactive") matchesStatus = !service.isActive;
        if (statusFilter === "configured") matchesStatus = !!service.baseUrl;
        if (statusFilter === "unconfigured") matchesStatus = !service.baseUrl;

        return matchesSearch && matchesStatus;
    });

    const smsServices = filteredServices.filter(s => s.service.code === 'AAKASHSMS' || s.service.code === 'SPARROWSMS');
    const voipServices = filteredServices.filter(s => s.service.code === 'YEASTAR' || s.service.code === 'ASTERISK');
    const accountingServices = filteredServices.filter(s => s.service.code === 'TSHUL' || s.service.code === 'NEPURIX');
    const otherServices = filteredServices.filter(s => 
        s.service.code !== 'AAKASHSMS' && 
        s.service.code !== 'SPARROWSMS' && 
        s.service.code !== 'YEASTAR' && 
        s.service.code !== 'ASTERISK' &&
        s.service.code !== 'TSHUL' &&
        s.service.code !== 'NEPURIX' &&
        s.service.code !== 'SMS_GATEWAY'
    );

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
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/services/add')}
                        >
                            Add Service
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {/* Stats and Filters */}
                <div className="space-y-4 mb-6">
                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 dark:bg-blue-950/20 dark:border-blue-900/30">
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.total}</div>
                            <div className="text-sm text-blue-600 dark:text-blue-500">Total Services</div>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-3 dark:bg-green-950/20 dark:border-green-900/30">
                            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.active}</div>
                            <div className="text-sm text-green-600 dark:text-green-500">Active</div>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 dark:bg-purple-950/20 dark:border-purple-900/30">
                            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.configured}</div>
                            <div className="text-sm text-purple-600 dark:text-purple-500">Configured</div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 dark:bg-amber-950/20 dark:border-amber-900/30">
                            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.withCredentials}</div>
                            <div className="text-sm text-amber-600 dark:text-amber-500">With Credentials</div>
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
                        <div className="flex gap-2 justify-center">
                            {searchQuery && (
                                <Button variant="outline" onClick={() => setSearchQuery("")}>
                                    Clear Search
                                </Button>
                            )}
                            <Button onClick={() => router.push('/services/add')}>
                                Add New Service
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {smsServices.length > 0 && (
                            <GroupedServiceCard
                                title="SMS Gateway"
                                description="Configure and manage SMS communication channels. Select a default provider for automatic alerts."
                                icon={<Smartphone className="h-6 w-6" />}
                                category="COMMUNICATION"
                                services={smsServices}
                                onStatusChange={fetchServices}
                            />
                        )}

                        {voipServices.length > 0 && (
                            <GroupedServiceCard
                                title="VOIP Services"
                                description="Configure and manage Yeastar & Asterisk PBX integrations. Select a default provider for call routing."
                                icon={<Phone className="h-6 w-6" />}
                                category="VOIP"
                                services={voipServices}
                                onStatusChange={fetchServices}
                            />
                        )}

                        {accountingServices.length > 0 && (
                            <GroupedServiceCard
                                title="Accounting Provider"
                                description="Configure Tshul and Nepurix integrations. Select one default provider for accounting sales invoices."
                                icon={<CreditCard className="h-6 w-6" />}
                                category="BILLING"
                                services={accountingServices}
                                onStatusChange={fetchServices}
                            />
                        )}

                        {otherServices.map((service) => (
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
