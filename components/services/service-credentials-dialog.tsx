// components/services/service-credentials-dialog.tsx - FIXED
"use client";

import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { ISPService, ServiceCredential, CredentialType } from "@/types/service.types";
import { ServicesAPI } from "@/lib/api/service";
import { toast } from "react-hot-toast";

interface ServiceCredentialsDialogProps {
    service: ISPService;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const credentialTypes: { value: CredentialType; label: string }[] = [
    { value: "api_key", label: "API Key" },
    { value: "username_password", label: "Username/Password" },
    { value: "app_key_secret", label: "App Key/Secret" },
    { value: "oauth2", label: "OAuth 2.0" },
    { value: "token", label: "Token" },
    { value: "ssh_key", label: "SSH Key" },
];

export function ServiceCredentialsDialog({
    service,
    open,
    onOpenChange,
    onSuccess,
}: ServiceCredentialsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState<ServiceCredential[]>([]);
    const [newCredential, setNewCredential] = useState<Partial<ServiceCredential>>({
        credentialType: "api_key",
        key: "",
        value: "",
        label: "",
        isEncrypted: true,
    });
    const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (open && service.credentials) {
            // Make sure credentials is an array
            const credsArray = Array.isArray(service.credentials)
                ? service.credentials
                : Object.values(service.credentials);
            setCredentials(credsArray);
        }
    }, [open, service.credentials]);

    const handleAddCredential = () => {
        if (!newCredential.key || !newCredential.value) {
            toast.error("Key and value are required");
            return;
        }

        const credential: ServiceCredential = {
            id: Date.now(), // Temporary ID
            credentialType: newCredential.credentialType || "api_key",
            key: newCredential.key,
            value: newCredential.value,
            label: newCredential.label || newCredential.key,
            isEncrypted: newCredential.isEncrypted !== false,
            isActive: true,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ispServiceId: service.id
        };

        setCredentials([...credentials, credential]);
        setNewCredential({
            credentialType: "api_key",
            key: "",
            value: "",
            label: "",
            isEncrypted: true,
        });
    };

    const handleRemoveCredential = (index: number) => {
        setCredentials(credentials.filter((_, i) => i !== index));
    };

    const handleUpdateCredential = (index: number, field: keyof ServiceCredential, value: any) => {
        const updated = [...credentials];
        updated[index] = { ...updated[index], [field]: value };
        setCredentials(updated);
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            // Prepare credentials for API
            const credentialsToSave = credentials.map(cred => ({
                credentialType: cred.credentialType,
                key: cred.key,
                value: cred.value,
                label: cred.label || cred.key,
                isEncrypted: cred.isEncrypted,
                description: cred.description || ''
            }));

            const response = await ServicesAPI.setServiceCredentials(
                service.service.code,
                credentialsToSave
            );

            if (response.success) {
                toast.success(response.message || "Credentials saved successfully");
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(response.error || "Failed to save credentials");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save credentials");
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (index: number) => {
        setShowPassword((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Manage Credentials - {service.service.name}</DialogTitle>
                    <DialogDescription>
                        Add or update credentials for the service. Sensitive values will be encrypted.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Add new credential */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="text-sm font-medium">Add New Credential</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="credentialType">Type</Label>
                                <Select
                                    value={newCredential.credentialType}
                                    onValueChange={(value: CredentialType) =>
                                        setNewCredential({ ...newCredential, credentialType: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {credentialTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="key">Key *</Label>
                                <Input
                                    id="key"
                                    placeholder="username, api_key, etc."
                                    value={newCredential.key}
                                    onChange={(e) => setNewCredential({ ...newCredential, key: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="label">Display Label</Label>
                                <Input
                                    id="label"
                                    placeholder="Username, API Key, etc."
                                    value={newCredential.label}
                                    onChange={(e) => setNewCredential({ ...newCredential, label: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="value">Value *</Label>
                                <div className="relative">
                                    <Input
                                        id="value"
                                        type={newCredential.isEncrypted && !showPassword[-1] ? "password" : "text"}
                                        placeholder="Enter value"
                                        value={newCredential.value}
                                        onChange={(e) => setNewCredential({ ...newCredential, value: e.target.value })}
                                    />
                                    {newCredential.isEncrypted && (
                                        <button
                                            type="button"
                                            className="absolute right-2 top-2"
                                            onClick={() => togglePasswordVisibility(-1)}
                                        >
                                            {showPassword[-1] ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="encrypt"
                                    checked={newCredential.isEncrypted}
                                    onCheckedChange={(checked) => setNewCredential({ ...newCredential, isEncrypted: checked })}
                                />
                                <Label htmlFor="encrypt" className="text-sm">
                                    Encrypt sensitive value
                                </Label>
                            </div>

                            <Button type="button" variant="outline" size="sm" onClick={handleAddCredential}>
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                            </Button>
                        </div>
                    </div>

                    {/* Existing credentials */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium">Current Credentials ({credentials.length})</h3>
                        {credentials.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                No credentials configured yet
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {credentials.map((cred, index) => (
                                    <div key={index} className="p-3 border rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {cred.credentialType}
                                                </Badge>
                                                <span className="font-medium">{cred.label || cred.key}</span>
                                                {cred.isEncrypted && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Encrypted
                                                    </Badge>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveCredential(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Key</Label>
                                                <Input
                                                    value={cred.key}
                                                    onChange={(e) => handleUpdateCredential(index, "key", e.target.value)}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Value</Label>
                                                <div className="relative">
                                                    <Input
                                                        type={cred.isEncrypted && !showPassword[index] ? "password" : "text"}
                                                        value={cred.value}
                                                        onChange={(e) => handleUpdateCredential(index, "value", e.target.value)}
                                                        className="h-8"
                                                    />
                                                    {cred.isEncrypted && (
                                                        <button
                                                            type="button"
                                                            className="absolute right-2 top-2"
                                                            onClick={() => togglePasswordVisibility(index)}
                                                        >
                                                            {showPassword[index] ? (
                                                                <EyeOff className="h-3 w-3" />
                                                            ) : (
                                                                <Eye className="h-3 w-3" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    checked={cred.isEncrypted}
                                                    onCheckedChange={(checked) =>
                                                        handleUpdateCredential(index, "isEncrypted", checked)
                                                    }
                                                />
                                                <Label className="text-xs">Encrypt</Label>
                                            </div>
                                            <Input
                                                placeholder="Description (optional)"
                                                value={cred.description || ""}
                                                onChange={(e) => handleUpdateCredential(index, "description", e.target.value)}
                                                className="h-8 w-48"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading || credentials.length === 0}>
                        {loading ? "Saving..." : "Save All Credentials"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}