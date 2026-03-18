"use client"

import { useState } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { WifiIcon, Plus, Server, Globe, Phone } from "lucide-react"

interface AddTrunkModalProps {
    ispId: number
    onSuccess: () => void
    trigger?: React.ReactNode
}

export default function AddTrunkModal({
    ispId,
    onSuccess,
    trigger
}: AddTrunkModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        trunkname: "",
        trunktype: "sip",
        host: "",
        port: "",
        username: "",
        password: "",
        register: "true"
    })

    const trunkTypes = [
        { value: "sip", label: "SIP Trunk", icon: Phone },
        { value: "iax", label: "IAX Trunk", icon: Server },
        { value: "pstn", label: "PSTN Gateway", icon: Globe }
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.trunkname || !formData.trunktype || !formData.host) {
            toast.error("Trunk name, type, and host are required")
            return
        }

        try {
            setLoading(true)

            const response = await apiRequest('/yeaster/trunks', {
                method: 'POST',
                body: JSON.stringify({
                    trunkname: formData.trunkname,
                    trunktype: formData.trunktype,
                    host: formData.host,
                    port: formData.port || undefined,
                    username: formData.username || undefined,
                    password: formData.password || undefined,
                    register: formData.register === "true"
                })
            })

            if (response.success) {
                toast.success(`Trunk ${formData.trunkname} added successfully`)
                onSuccess()
                resetForm()
                setOpen(false)
            } else {
                toast.error(response.error || "Failed to add trunk")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to add trunk")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            trunkname: "",
            trunktype: "sip",
            host: "",
            port: "",
            username: "",
            password: "",
            register: "true"
        })
    }

    const getTrunkIcon = (type: string) => {
        const trunkType = trunkTypes.find(t => t.value === type)
        return trunkType ? trunkType.icon : WifiIcon
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
                        Add Trunk
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Trunk</DialogTitle>
                    <DialogDescription>
                        Configure a new trunk connection for your PBX system
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="trunkname">Trunk Name *</Label>
                        <Input
                            id="trunkname"
                            value={formData.trunkname}
                            onChange={(e) => setFormData({ ...formData, trunkname: e.target.value })}
                            placeholder="e.g., VoIP Provider SIP"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Trunk Type *</Label>
                        <Select
                            value={formData.trunktype}
                            onValueChange={(value) => setFormData({ ...formData, trunktype: value })}
                        >
                            <SelectTrigger>
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            const Icon = getTrunkIcon(formData.trunktype)
                                            return <Icon className="h-4 w-4" />
                                        })()}
                                        {trunkTypes.find(t => t.value === formData.trunktype)?.label}
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {trunkTypes.map((type) => {
                                    const Icon = type.icon
                                    return (
                                        <SelectItem key={type.value} value={type.value}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4" />
                                                {type.label}
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="host">Host/Server *</Label>
                            <Input
                                id="host"
                                value={formData.host}
                                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                                placeholder="e.g., sip.provider.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="port">Port</Label>
                            <Input
                                id="port"
                                value={formData.port}
                                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                                placeholder="e.g., 5060"
                                type="number"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="Authentication username"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Authentication password"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Registration</Label>
                        <Select
                            value={formData.register}
                            onValueChange={(value) => setFormData({ ...formData, register: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Register (Keep Alive)</SelectItem>
                                <SelectItem value="false">Peer (No Registration)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {formData.register === "true"
                                ? "Trunk will register with provider and maintain connection"
                                : "Trunk will operate as a peer connection"
                            }
                        </p>
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
                            <WifiIcon className="mr-2 h-4 w-4" />
                            {loading ? "Adding..." : "Add Trunk"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}