// components/services/service-configure-dialog.tsx
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
    const [formData, setFormData] = useState({
        baseUrl: service.baseUrl || "",
        apiVersion: service.apiVersion || "v1",
        isActive: service.isActive,
        config: service.config ? JSON.stringify(service.config, null, 2) : "{}",
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

            await ServicesAPI.configureService({
                serviceCode: service.service.code,
                baseUrl: formData.baseUrl || undefined,
                apiVersion: formData.apiVersion,
                config,
                isActive: formData.isActive,
            });

            toast.success("Service configuration updated successfully");
            onSuccess();
            onOpenChange(false);
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