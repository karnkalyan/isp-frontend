// app/services/settings/page.tsx
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ServicesAPI, type ServiceAnalytics } from "@/lib/api/service";
import { ISPService, Service, ServiceStatus } from "@/types/service.types";
import { ServiceConfigureDialog } from "@/components/services/service-configure-dialog";
import { ServiceCredentialsDialog } from "@/components/services/service-credentials-dialog";
import { ServiceTestDialog } from "@/components/services/service-test-dialog";
import {
    CheckCircle,
    Clock,
    Database,
    CreditCard,
    Loader2,
    Lock,
    Phone,
    PlayCircle,
    RefreshCw,
    Settings,
    Smartphone,
    Wifi,
    XCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

const SMS_PROVIDER_CODES = ["AAKASHSMS", "SPARROWSMS"];
const VOIP_PROVIDER_CODES = ["YEASTAR", "ASTERISK"];
const ACCOUNTING_PROVIDER_CODES = ["TSHUL", "NEPURIX"];
const GROUPED_SERVICE_CODES = [...SMS_PROVIDER_CODES, ...VOIP_PROVIDER_CODES, ...ACCOUNTING_PROVIDER_CODES, "SMS_GATEWAY"];

type ProviderGroup = {
    key: "sms" | "voip" | "accounting";
    title: string;
    description: string;
    category: string;
    codes: string[];
    icon: ReactNode;
};

const providerGroups: ProviderGroup[] = [
    {
        key: "sms",
        title: "SMS Gateway",
        description: "Aakash SMS and Sparrow SMS providers. Choose one as the default SMS gateway.",
        category: "COMMUNICATION",
        codes: SMS_PROVIDER_CODES,
        icon: <Smartphone className="h-5 w-5" />
    },
    {
        key: "voip",
        title: "VoIP Provider",
        description: "Yeastar and Asterisk PBX providers. Choose one as the default VoIP provider.",
        category: "VOIP",
        codes: VOIP_PROVIDER_CODES,
        icon: <Phone className="h-5 w-5" />
    },
    {
        key: "accounting",
        title: "Accounting Provider",
        description: "Tshul and Nepurix accounting integrations. Choose exactly one default provider for sales invoices.",
        category: "BILLING",
        codes: ACCOUNTING_PROVIDER_CODES,
        icon: <CreditCard className="h-5 w-5" />
    }
];

function isConfigured(service: ISPService) {
    return Boolean(service.baseUrl || service.credentialCount > 0);
}

function isDefaultProvider(service: ISPService) {
    return Boolean(service.config && typeof service.config === "object" && service.config.isDefault === true);
}

function ServiceStateBadge({ service }: { service: ISPService }) {
    if (!service.isActive) {
        return (
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                <XCircle className="h-3 w-3 mr-1" />
                Inactive
            </Badge>
        );
    }

    if (!isConfigured(service)) {
        return (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                <Clock className="h-3 w-3 mr-1" />
                Needs config
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
        </Badge>
    );
}

export default function ServiceSettingsPage() {
    const router = useRouter();
    const [catalog, setCatalog] = useState<Service[]>([]);
    const [ispServices, setIspServices] = useState<ISPService[]>([]);
    const [statuses, setStatuses] = useState<ServiceStatus[]>([]);
    const [analytics, setAnalytics] = useState<ServiceAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [testingAll, setTestingAll] = useState(false);
    const [activeService, setActiveService] = useState<ISPService | null>(null);
    const [testResult, setTestResult] = useState<any>(null);
    const [dialog, setDialog] = useState<"configure" | "credentials" | "test" | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setRefreshing(true);
            const [catalogRes, servicesRes, statusesRes, analyticsRes] = await Promise.all([
                ServicesAPI.getServicesCatalog(),
                ServicesAPI.getISPServices(true),
                ServicesAPI.getAllServiceStatuses(),
                ServicesAPI.getServiceAnalytics().catch(() => null)
            ]);

            if (catalogRes.success) setCatalog(catalogRes.data || []);
            if (servicesRes.success) setIspServices(servicesRes.data || []);
            if (statusesRes.success) setStatuses(statusesRes.data || []);
            if (analyticsRes?.success) setAnalytics(analyticsRes.data);
        } catch (err: any) {
            toast.error(err.message || "Failed to load service settings");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const configuredCodes = useMemo(
        () => new Set(ispServices.map((service) => service.service.code)),
        [ispServices]
    );

    const unconfiguredCatalog = useMemo(
        () => catalog.filter((service) => !configuredCodes.has(service.code) && !GROUPED_SERVICE_CODES.includes(service.code)),
        [catalog, configuredCodes]
    );

    const regularServices = useMemo(
        () =>
            ispServices.filter(
                (service) =>
                    !SMS_PROVIDER_CODES.includes(service.service.code) &&
                    !VOIP_PROVIDER_CODES.includes(service.service.code) &&
                    !ACCOUNTING_PROVIDER_CODES.includes(service.service.code)
            ),
        [ispServices]
    );

    const stats = {
        catalog: analytics?.totalServices ?? catalog.length,
        configured: analytics?.configuredServices ?? ispServices.filter(isConfigured).length,
        active: analytics?.activeServices ?? ispServices.filter((service) => service.isActive).length,
        healthy: statuses.filter((status) => status.enabled && status.configured && !status.error).length
    };

    const openDialog = (service: ISPService, nextDialog: "configure" | "credentials") => {
        setActiveService(service);
        setDialog(nextDialog);
    };

    const handleTestService = async (service: ISPService) => {
        try {
            setActionLoading(`${service.service.code}:test`);
            const result = await ServicesAPI.testServiceConnection(service.service.code);
            setTestResult(result);
            setActiveService(service);
            setDialog("test");
        } catch (err: any) {
            toast.error(err.message || "Failed to test service connection");
        } finally {
            setActionLoading(null);
        }
    };

    const handleSetDefault = async (service: ISPService) => {
        try {
            setActionLoading(`${service.service.code}:default`);
            const config = service.config && typeof service.config === "object" ? service.config : {};
            const response = await ServicesAPI.configureService({
                serviceCode: service.service.code,
                baseUrl: service.baseUrl,
                apiVersion: service.apiVersion,
                config: { ...config, isDefault: true },
                isActive: service.isActive
            });

            if (response.success) {
                toast.success(`${service.service.name} is now the default provider`);
                await loadData();
            } else {
                toast.error((response as any).error || "Failed to update default provider");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update default provider");
        } finally {
            setActionLoading(null);
        }
    };

    const handleTestAll = async () => {
        try {
            setTestingAll(true);
            const response = await ServicesAPI.testAllServices();
            if (response.success) {
                toast.success(
                    `Connection tests completed: ${response.summary.connected}/${response.summary.total} connected`
                );
            } else {
                toast.error("Failed to test services");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to test services");
        } finally {
            setTestingAll(false);
        }
    };

    const renderServiceRow = (service: ISPService) => (
        <div key={service.id} className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{service.service.name}</h3>
                    <Badge variant="secondary" className="font-mono text-xs">
                        {service.service.code}
                    </Badge>
                    <ServiceStateBadge service={service} />
                    {isDefaultProvider(service) && <Badge>Default</Badge>}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{service.service.description}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    <span>URL: {service.baseUrl || "Not configured"}</span>
                    <span>API: {service.apiVersion || "v1"}</span>
                    <span>Credentials: {service.credentialCount}</span>
                    <span>Updated: {new Date(service.updatedAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openDialog(service, "configure")}>
                    <Settings className="h-3.5 w-3.5 mr-1" />
                    Configure
                </Button>
                <Button variant="outline" size="sm" onClick={() => openDialog(service, "credentials")}>
                    <Lock className="h-3.5 w-3.5 mr-1" />
                    Credentials
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestService(service)}
                    disabled={actionLoading === `${service.service.code}:test`}
                >
                    <Wifi className="h-3.5 w-3.5 mr-1" />
                    Test
                </Button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <Skeleton className="h-16 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((item) => (
                            <Skeleton key={item} className="h-28 rounded-lg" />
                        ))}
                    </div>
                    <Skeleton className="h-96 rounded-lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Service Settings"
                    description="Actual configured services, provider defaults, credentials and connection health"
                    actions={[
                        {
                            label: refreshing ? "Refreshing" : "Refresh",
                            onClick: loadData,
                            variant: "outline",
                            icon: <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                        },
                        {
                            label: testingAll ? "Testing" : "Test All",
                            onClick: handleTestAll,
                            variant: "outline",
                            icon: testingAll ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <PlayCircle className="h-4 w-4 mr-2" />
                            )
                        }
                    ]}
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{stats.catalog}</div>
                            <div className="text-sm text-muted-foreground">Catalog services</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-blue-600">{stats.configured}</div>
                            <div className="text-sm text-muted-foreground">Configured</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                            <div className="text-sm text-muted-foreground">Active</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-purple-600">{stats.healthy}</div>
                            <div className="text-sm text-muted-foreground">Healthy statuses</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">
                        {providerGroups.map((group) => {
                            const providers = ispServices.filter((service) => group.codes.includes(service.service.code));

                            return (
                                <Card key={group.key}>
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg border p-2">{group.icon}</div>
                                            <div>
                                                <CardTitle>{group.title}</CardTitle>
                                                <CardDescription>{group.description}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {providers.length === 0 ? (
                                            <div className="rounded-lg border border-dashed p-6 text-center">
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    No {group.title.toLowerCase()} providers are configured yet.
                                                </p>
                                                <Button onClick={() => router.push("/services/add")}>Configure Provider</Button>
                                            </div>
                                        ) : (
                                            providers.map((provider) => (
                                                <div key={provider.id} className="rounded-lg border p-4">
                                                    {renderServiceRow(provider)}
                                                    {!isDefaultProvider(provider) && (
                                                        <div className="mt-3 flex justify-end">
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => handleSetDefault(provider)}
                                                                disabled={actionLoading === `${provider.service.code}:default`}
                                                            >
                                                                Set as Default
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}

                        <Card>
                            <CardHeader>
                                <CardTitle>Configured Services</CardTitle>
                                <CardDescription>Services enabled for this ISP from the backend service table.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {regularServices.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-8 text-center">
                                        <Database className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                        <p className="text-sm text-muted-foreground">No regular services configured yet.</p>
                                    </div>
                                ) : (
                                    regularServices.map(renderServiceRow)
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Available To Configure</CardTitle>
                                <CardDescription>Catalog services that are not configured for this ISP.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {unconfiguredCatalog.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Every catalog service has an ISP configuration.</p>
                                ) : (
                                    unconfiguredCatalog.slice(0, 8).map((service) => (
                                        <div key={service.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">{service.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{service.code}</div>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => router.push("/services/add")}>
                                                Add
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Updates</CardTitle>
                                <CardDescription>Latest service configuration activity.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {(analytics?.recentActivities || []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No service activity yet.</p>
                                ) : (
                                    analytics!.recentActivities.map((activity) => (
                                        <div key={activity.id} className="rounded-lg border p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="font-medium text-sm">{activity.serviceName}</div>
                                                <Badge variant={activity.status === "active" ? "default" : "secondary"}>
                                                    {activity.status}
                                                </Badge>
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {activity.serviceCode} updated {new Date(activity.lastUpdated).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {dialog === "configure" && activeService && (
                <ServiceConfigureDialog
                    service={activeService}
                    open
                    onOpenChange={(open) => setDialog(open ? "configure" : null)}
                    onSuccess={loadData}
                />
            )}

            {dialog === "credentials" && activeService && (
                <ServiceCredentialsDialog
                    service={activeService}
                    open
                    onOpenChange={(open) => setDialog(open ? "credentials" : null)}
                    onSuccess={loadData}
                />
            )}

            {dialog === "test" && activeService && testResult && (
                <ServiceTestDialog
                    service={activeService}
                    result={testResult}
                    open
                    onOpenChange={(open) => setDialog(open ? "test" : null)}
                />
            )}
        </DashboardLayout>
    );
}
