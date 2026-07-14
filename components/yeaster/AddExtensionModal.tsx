"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { Users, Plus } from "lucide-react"

interface AddExtensionModalProps {
    ispId: number
    onSuccess: () => void
    trigger?: React.ReactNode
}

export default function AddExtensionModal({
    ispId,
    onSuccess,
    trigger
}: AddExtensionModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        number: "",
        extensionName: "",
        username: "",
        registername: "",
        registerpassword: "",
        confirmPassword: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.number || !formData.extensionName || !formData.username ||
            !formData.registername || !formData.registerpassword) {
            toast.error("All fields are required")
            return
        }

        if (formData.registerpassword !== formData.confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        try {
            setLoading(true)

            const response = await apiRequest('/yeaster/extensions', {
                method: 'POST',
                body: JSON.stringify({
                    number: formData.number,
                    username: formData.username,
                    extensionName: formData.extensionName,
                    registername: formData.registername,
                    registerpassword: formData.registerpassword
                })
            })

            if (response.success) {
                toast.success(`Extension ${formData.number} added successfully`)
                onSuccess()
                resetForm()
                setOpen(false)
            } else {
                toast.error(response.error || "Failed to add extension")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to add extension")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            number: "",
            extensionName: "",
            username: "",
            registername: "",
            registerpassword: "",
            confirmPassword: ""
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger ? (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            ) : (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Extension
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Extension</DialogTitle>
                    <DialogDescription>
                        Configure a new extension for your PBX system
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
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="extensionName">Display Name *</Label>
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
                        <Label htmlFor="username">SIP Username *</Label>
                        <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="SIP authentication username"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="registername">Register Name *</Label>
                            <Input
                                id="registername"
                                value={formData.registername}
                                onChange={(e) => setFormData({ ...formData, registername: e.target.value })}
                                placeholder="Registration name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="registerpassword">Password *</Label>
                            <Input
                                id="registerpassword"
                                type="password"
                                value={formData.registerpassword}
                                onChange={(e) => setFormData({ ...formData, registerpassword: e.target.value })}
                                placeholder="Secure password"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="Confirm password"
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setOpen(false)
                                resetForm()
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            <Users className="mr-2 h-4 w-4" />
                            {loading ? "Adding..." : "Add Extension"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}