"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"

interface EditExtensionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    extension: any
    ispId: number
    onSuccess: () => void
}

export default function EditExtensionModal({
    open,
    onOpenChange,
    extension,
    ispId,
    onSuccess
}: EditExtensionModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        number: "",
        extensionName: "",
        username: "",
        registername: "",
        registerpassword: "",
        status: "active"
    })

    useEffect(() => {
        if (extension) {
            setFormData({
                number: extension.extensionNumber || "",
                extensionName: extension.extensionName || "",
                username: extension.username || "",
                registername: extension.registername || "",
                registerpassword: "",
                status: extension.status || "active"
            })
        }
    }, [extension])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.number || !formData.extensionName) {
            toast.error("Extension number and name are required")
            return
        }

        try {
            setLoading(true)

            const response = await apiRequest('/yeaster/extensions', {
                method: 'PUT',
                body: JSON.stringify(formData)
            })

            if (response.success) {
                toast.success("Extension updated successfully")
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error(response.error || "Failed to update extension")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update extension")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Extension</DialogTitle>
                    <DialogDescription>
                        Update extension settings. Leave password blank to keep existing.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="number">Extension Number *</Label>
                            <Input
                                id="number"
                                value={formData.number}
                                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                placeholder="e.g., 101"
                                required
                                disabled
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="extensionName">Extension Name *</Label>
                            <Input
                                id="extensionName"
                                value={formData.extensionName}
                                onChange={(e) => setFormData({ ...formData, extensionName: e.target.value })}
                                placeholder="e.g., John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="username">SIP Username</Label>
                        <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="SIP username"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="registername">Register Name</Label>
                            <Input
                                id="registername"
                                value={formData.registername}
                                onChange={(e) => setFormData({ ...formData, registername: e.target.value })}
                                placeholder="Register name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="registerpassword">Password</Label>
                            <Input
                                id="registerpassword"
                                type="password"
                                value={formData.registerpassword}
                                onChange={(e) => setFormData({ ...formData, registerpassword: e.target.value })}
                                placeholder="Leave blank to keep existing"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="status"
                            checked={formData.status === "active"}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, status: checked ? "active" : "inactive" })
                            }
                        />
                        <Label htmlFor="status">
                            {formData.status === "active" ? "Active" : "Inactive"}
                        </Label>
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
                            {loading ? "Updating..." : "Update Extension"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}