// components/services/service-manager.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Plus,
    Trash2,
    Save,
    X,
    AlertCircle,
    Upload,
    Download,
    Copy
} from "lucide-react";
import { Service, ServiceCategory, ISPService } from "@/types/service.types";
import { ServicesAPI } from "@/lib/api/service";
import { toast } from "react-hot-toast";

interface ServiceManagerProps {
    service?: ISPService;
    mode: 'add' | 'edit' | 'view';
    onSuccess?: () => void;
    onCancel?: () => void;
}

const categories: ServiceCategory[] = [
    "BILLING",
    "AUTHENTICATION",
    "PAYMENT",
    "STREAMING",
    "NETWORK",
    "VOIP",
    "SECURITY",
    "COMMUNICATION",
    "OTHER"
];

const defaultServiceTemplates = {
    TSHUL: {
        baseUrl: "https://api.tshul.com",
        apiVersion: "v1",
        config: { timeout: 30000, retryAttempts: 3 }
    },
    NETTV: {
        baseUrl: "https://resources.geniustv.dev.geniussystems.com.np",
        apiVersion: "v1",
        config: { timeout: 60000 }
    },
    YEASTAR: {
        baseUrl: "",
        apiVersion: "v1",
        config: { tcpPort: 8333, apiPort: 80 }
    },
    RADIUS: {
        baseUrl: "http://localhost:1812",
        apiVersion: "v1",
        config: { timeout: 10000 }
    },
    MIKROTIK: {
        baseUrl: "http://192.168.88.1",
        apiVersion: "v1",
        config: { port: 8728, useSSL: false }
    }
};

export function ServiceManager({ service, mode, onSuccess, onCancel }: ServiceManagerProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        serviceCode: service?.service.code || "",
        name: service?.service.name || "",
        description: service?.service.description || "",
        category: service?.service.category || "OTHER" as ServiceCategory,
        iconUrl: service?.service.iconUrl || "",
        baseUrl: service?.baseUrl || "",
        apiVersion: service?.apiVersion || "v1",
        isActive: service?.isActive ?? true,
        isEnabled: service?.isEnabled ?? true,
        config: service?.config ? JSON.stringify(service.config, null, 2) : "{}",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.serviceCode) {
            newErrors.serviceCode = "Service code is required";
        }

        if (!formData.name) {
            newErrors.name = "Service name is required";
        }

        if (!formData.baseUrl && mode !== 'add') {
            newErrors.baseUrl = "Base URL is required for configuration";
        }

        try {
            JSON.parse(formData.config || "{}");
        } catch (error) {
            newErrors.config = "Invalid JSON configuration";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleTemplateSelect = (serviceCode: string) => {
        const template = defaultServiceTemplates[serviceCode as keyof typeof defaultServiceTemplates];
        if (template) {
            setFormData(prev => ({
                ...prev,
                serviceCode,
                baseUrl: template.baseUrl || "",
                apiVersion: template.apiVersion,
                config: JSON.stringify(template.config || {}, null, 2)
            }));

            // Auto-fill name from known services
            const knownServices: Record<string, string> = {
                TSHUL: "TShul Billing",
                NETTV: "NetTV Streaming",
                YEASTAR: "Yeastar VoIP",
                RADIUS: "FreeRadius",
                MIKROTIK: "MikroTik Router"
            };

            if (knownServices[serviceCode]) {
                handleInputChange("name", knownServices[serviceCode]);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        try {
            setLoading(true);

            if (mode === 'add') {
                // Create new service configuration
                await ServicesAPI.configureService({
                    serviceCode: formData.serviceCode,
                    baseUrl: formData.baseUrl || undefined,
                    apiVersion: formData.apiVersion,
                    config: JSON.parse(formData.config),
                    isActive: formData.isActive,
                });

                toast.success("Service added successfully");
            } else {
                // Update existing service
                await ServicesAPI.configureService({
                    serviceCode: formData.serviceCode,
                    baseUrl: formData.baseUrl || undefined,
                    apiVersion: formData.apiVersion,
                    config: JSON.parse(formData.config),
                    isActive: formData.isActive,
                });

                toast.success("Service updated successfully");
            }

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save service");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!service || !confirm("Are you sure you want to delete this service configuration?")) {
            return;
        }

        try {
            setLoading(true);
            // Deactivate instead of delete
            await ServicesAPI.toggleServiceActivation(service.service.code, false);
            toast.success("Service deactivated successfully");

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete service");
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicate = () => {
        const newCode = `${formData.serviceCode}_COPY`;
        setFormData(prev => ({
            ...prev,
            serviceCode: newCode,
            name: `${prev.name} (Copy)`
        }));
        toast.success("Service duplicated. Please review and save.");
    };

    const handleExport = () => {
        const exportData = {
            service: formData,
            timestamp: new Date().toISOString(),
            version: "1.0.0"
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `service-${formData.serviceCode}-config.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Configuration exported successfully");
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (data.service) {
                    setFormData(prev => ({
                        ...prev,
                        ...data.service,
                        config: typeof data.service.config === 'string'
                            ? data.service.config
                            : JSON.stringify(data.service.config || {}, null, 2)
                    }));
                    toast.success("Configuration imported successfully");
                }
            } catch (error) {
                toast.error("Failed to parse configuration file");
            }
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>
                            {mode === 'add' ? 'Add New Service' : mode === 'edit' ? 'Edit Service' : 'Service Details'}
                        </CardTitle>
                        <CardDescription>
                            {mode === 'add'
                                ? 'Configure a new service integration'
                                : mode === 'edit'
                                    ? 'Update service configuration'
                                    : 'View service configuration'}
                        </CardDescription>
                    </div>

                    {mode !== 'view' && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                disabled={loading}
                            >
                                <Download className="h-3 w-3 mr-2" />
                                Export
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDuplicate}
                                disabled={loading}
                            >
                                <Copy className="h-3 w-3 mr-2" />
                                Duplicate
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                    {mode === 'add' && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Start by selecting a service template or enter custom configuration
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Quick Templates */}
                    {mode === 'add' && (
                        <div className="space-y-3">
                            <Label>Quick Templates</Label>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(defaultServiceTemplates).map((serviceCode) => (
                                    <Badge
                                        key={serviceCode}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleTemplateSelect(serviceCode)}
                                    >
                                        {serviceCode}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Service Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="serviceCode">
                                    Service Code *
                                    {mode === 'add' && (
                                        <span className="text-xs text-gray-500 ml-2">(e.g., TSHUL, NETTV, YEASTAR)</span>
                                    )}
                                </Label>
                                <Input
                                    id="serviceCode"
                                    value={formData.serviceCode}
                                    onChange={(e) => handleInputChange("serviceCode", e.target.value.toUpperCase())}
                                    placeholder="TSHUL"
                                    disabled={mode === 'edit' || mode === 'view'}
                                    className={errors.serviceCode ? "border-red-500" : ""}
                                />
                                {errors.serviceCode && (
                                    <p className="text-xs text-red-500">{errors.serviceCode}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Service Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    placeholder="TShul Billing System"
                                    disabled={mode === 'view'}
                                    className={errors.name ? "border-red-500" : ""}
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-500">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value: ServiceCategory) => handleInputChange("category", value)}
                                    disabled={mode === 'view'}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    placeholder="Brief description of the service..."
                                    rows={3}
                                    disabled={mode === 'view'}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="iconUrl">Icon URL</Label>
                                <Input
                                    id="iconUrl"
                                    value={formData.iconUrl}
                                    onChange={(e) => handleInputChange("iconUrl", e.target.value)}
                                    placeholder="/icons/service.svg"
                                    disabled={mode === 'view'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Connection Configuration */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Connection Configuration</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="baseUrl">
                                    Base URL {mode !== 'add' && '*'}
                                </Label>
                                <Input
                                    id="baseUrl"
                                    value={formData.baseUrl}
                                    onChange={(e) => handleInputChange("baseUrl", e.target.value)}
                                    placeholder="https://api.example.com"
                                    disabled={mode === 'view'}
                                    className={errors.baseUrl ? "border-red-500" : ""}
                                />
                                {errors.baseUrl && (
                                    <p className="text-xs text-red-500">{errors.baseUrl}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                    The base URL for API requests (required for configuration)
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="apiVersion">API Version</Label>
                                <Input
                                    id="apiVersion"
                                    value={formData.apiVersion}
                                    onChange={(e) => handleInputChange("apiVersion", e.target.value)}
                                    placeholder="v1"
                                    disabled={mode === 'view'}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="config">
                                Configuration (JSON)
                                <span className="text-xs text-gray-500 ml-2">Service-specific settings</span>
                            </Label>
                            <Textarea
                                id="config"
                                value={formData.config}
                                onChange={(e) => handleInputChange("config", e.target.value)}
                                placeholder='{"timeout": 30000, "retryAttempts": 3}'
                                rows={6}
                                className={`font-mono text-sm ${errors.config ? "border-red-500" : ""}`}
                                disabled={mode === 'view'}
                            />
                            {errors.config && (
                                <p className="text-xs text-red-500">{errors.config}</p>
                            )}
                        </div>
                    </div>

                    {/* Status Controls */}
                    {mode !== 'view' && (
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="font-semibold">Status & Activation</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="isActive">Active Status</Label>
                                        <p className="text-xs text-gray-500">
                                            Enable or disable the service
                                        </p>
                                    </div>
                                    <Switch
                                        id="isActive"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                                        disabled={mode === 'view'}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="isEnabled">Enabled</Label>
                                        <p className="text-xs text-gray-500">
                                            Allow service to be used
                                        </p>
                                    </div>
                                    <Switch
                                        id="isEnabled"
                                        checked={formData.isEnabled}
                                        onCheckedChange={(checked) => handleInputChange("isEnabled", checked)}
                                        disabled={mode === 'view'}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Import Configuration */}
                    {mode === 'add' && (
                        <div className="space-y-2">
                            <Label>Import Configuration</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600 mb-2">
                                    Drag & drop a configuration file or click to browse
                                </p>
                                <Input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="hidden"
                                    id="import-config"
                                />
                                <Label
                                    htmlFor="import-config"
                                    className="cursor-pointer inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                                >
                                    Browse Files
                                </Label>
                                <p className="text-xs text-gray-500 mt-2">
                                    JSON format only. File should contain service configuration.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between border-t pt-6">
                    <div>
                        {mode === 'edit' && service && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deactivate Service
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                        )}

                        {mode !== 'view' && (
                            <Button type="submit" disabled={loading}>
                                <Save className="h-4 w-4 mr-2" />
                                {loading ? "Saving..." : mode === 'add' ? "Add Service" : "Save Changes"}
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}