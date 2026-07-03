// components/services/service-configure-dialog.tsx - FIXED VERSION
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ISPService } from "@/types/service.types";
import { ServicesAPI } from "@/lib/api/service";
import { toast } from "react-hot-toast";

const defaultServiceTemplates: Record<string, { baseUrl: string; apiVersion: string; config: string }> = {
    TSHUL: {
        baseUrl: "https://kisan-net.tshul.app/api",
        apiVersion: "v1",
        config: JSON.stringify({
            timeout: 30000,
            retryAttempts: 3,
            demoCredentials: {
                username: "demo@kisan.net.np",
                password: "demo@kisan.net.np@123"
            }
        }, null, 2)
    },
    NEPURIX: {
        baseUrl: "https://your-nepurix-host.example",
        apiVersion: "v1",
        config: JSON.stringify({ isDefault: true, timeout: 30000, retryAttempts: 3 }, null, 2)
    },
    RADIUS: {
        baseUrl: "http://10.3.2.6:3005/api",
        apiVersion: "v1",
        config: JSON.stringify({
            timeout: 10000,
            secret: "Kisan@radius",
            defaultCredentials: {
                username: "radius",
                password: "Kisan@radius"
            }
        }, null, 2)
    },
    YEASTAR: {
        baseUrl: "http://10.3.2.50",
        apiVersion: "v2.0.0",
        config: JSON.stringify({
            tcp_port: 8333,
            api_port: 80,
            version: "2.0.0",
            defaultCredentials: {
                pbx_ip: "10.3.2.50",
                username: "kisan",
                password: "Kisan@123"
            }
        }, null, 2)
    },
    ASTERISK: {
        baseUrl: "http://10.3.2.51",
        apiVersion: "v1",
        config: JSON.stringify({
            ami_port: 5038,
            ari_port: 8088,
            ari_app_name: "kisan",
            defaultCredentials: {
                ami_host: "10.3.2.51",
                ami_port: "5038",
                ami_username: "kisan_ami",
                ami_password: "AmiPassword@123",
                ari_host: "10.3.2.51",
                ari_port: "8088",
                ari_username: "kisan_ari",
                ari_password: "AriPassword@123",
                ari_app_name: "kisan"
            }
        }, null, 2)
    },
    NETTV: {
        baseUrl: "https://resources.geniustv.dev.geniussystems.com.np",
        apiVersion: "v1",
        config: JSON.stringify({
            timeout: 60000,
            retry: 3,
            defaultCredentials: {
                api_key: "5c232ef1fdf138",
                api_secret: "72b7b119b2b98983e1ad33a385b08df489",
                app_key: "",
                app_secret: ""
            }
        }, null, 2)
    },
    MIKROTIK: {
        baseUrl: "http://10.1.5.2",
        apiVersion: "v1",
        config: JSON.stringify({
            port: 8728,
            use_ssl: false,
            timeout: 5000,
            defaultCredentials: {
                username: "bipin",
                password: "bipin"
            }
        }, null, 2)
    },
    ESEWA: {
        baseUrl: "https://rc-epay.esewa.com.np",
        apiVersion: "v1",
        config: JSON.stringify({
            integrationMode: "TOKEN_BASED",
            environment: "uat",
            tokenEnabled: true,
            epayEnabled: true,
            productCode: "EPAYTEST",
            epaySecretKey: "8gBm/:&EnhH.1/q",
            timeout: 30000
        }, null, 2)
    },
    KHALTI: {
        baseUrl: "https://khalti.com/api/v2",
        apiVersion: "v2",
        config: JSON.stringify({
            environment: "test",
            timeout: 30000
        }, null, 2)
    },
    GENIEACS: {
        baseUrl: "http://10.3.2.6:7557",
        apiVersion: "v1",
        config: JSON.stringify({
            timeout: 10000,
            defaultCredentials: {
                username: "admin",
                password: "password",
                base_url: "http://10.3.2.6:7557"
            }
        }, null, 2)
    },
    AAKASHSMS: {
        baseUrl: "https://sms.aakashsms.com",
        apiVersion: "v4",
        config: JSON.stringify({
            timeout: 30000,
            defaultCredentials: {
                auth_token: "",
                sender_id: ""
            }
        }, null, 2)
    },
    SPARROWSMS: {
        baseUrl: "http://api.sparrowsms.com/v2",
        apiVersion: "v2",
        config: JSON.stringify({
            timeout: 30000,
            defaultCredentials: {
                auth_token: "",
                sender_id: ""
            }
        }, null, 2)
    }
};

interface ServiceConfigureDialogProps {
    service: ISPService;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ServiceConfigureDialog({
    service,
    open,
    onOpenChange,
    onSuccess,
}: ServiceConfigureDialogProps) {
    const [loading, setLoading] = useState(false);
    
    // Determine the template config based on the service code if service has no baseUrl (catalog view)
    const template = defaultServiceTemplates[service.service.code];
    
    const [formData, setFormData] = useState({
        baseUrl: service.baseUrl || template?.baseUrl || "",
        apiVersion: service.apiVersion || template?.apiVersion || "v1",
        isActive: service.isActive,
        config: service.config 
            ? (typeof service.config === 'string' ? service.config : JSON.stringify(service.config, null, 2))
            : (template?.config || "{}"),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            let config;
            try {
                config = JSON.parse(formData.config);
            } catch {
                throw new Error("Invalid JSON configuration");
            }

            const response = await ServicesAPI.configureService({
                serviceCode: service.service.code,
                baseUrl: formData.baseUrl || undefined,
                apiVersion: formData.apiVersion,
                config,
                isActive: formData.isActive,
            });

            if (response.success) {
                toast.success(response.message || "Service configuration updated successfully");
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error((response as any).error || "Failed to update service configuration");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update service configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Configure {service.service.name}</DialogTitle>
                        <DialogDescription>
                            Update the service configuration and connection settings.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="baseUrl">Base URL *</Label>
                            <Input
                                id="baseUrl"
                                placeholder="https://api.example.com"
                                value={formData.baseUrl}
                                onChange={(e) => handleInputChange("baseUrl", e.target.value)}
                                required
                            />
                            <p className="text-xs text-gray-500">
                                The base URL for the service API (e.g., https://api.example.com)
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="apiVersion">API Version</Label>
                            <Input
                                id="apiVersion"
                                placeholder="v1"
                                value={formData.apiVersion}
                                onChange={(e) => handleInputChange("apiVersion", e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="config">Configuration (JSON)</Label>
                            <Textarea
                                id="config"
                                placeholder="{}"
                                value={formData.config}
                                onChange={(e) => handleInputChange("config", e.target.value)}
                                rows={6}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500">
                                Service-specific configuration in JSON format
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="isActive">Service Status</Label>
                                <p className="text-xs text-gray-500">
                                    Enable or disable this service
                                </p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
