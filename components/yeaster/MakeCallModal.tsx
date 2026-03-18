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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { Phone, User, PhoneCall } from "lucide-react"

interface MakeCallModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    ispId: number
    onSuccess: () => void
}

interface Extension {
    extensionNumber: string
    extensionName: string
    registered?: boolean
}

export default function MakeCallModal({
    open,
    onOpenChange,
    ispId,
    onSuccess
}: MakeCallModalProps) {
    const [loading, setLoading] = useState(false)
    const [extensions, setExtensions] = useState<Extension[]>([])
    const [selectedExtension, setSelectedExtension] = useState("")
    const [targetNumber, setTargetNumber] = useState("")

    // Fetch available extensions
    useEffect(() => {
        if (open) {
            fetchExtensions()
        }
    }, [open])

    const fetchExtensions = async () => {
        try {
            const response = await apiRequest<{ success: boolean; data: Extension[] }>('/yeaster/extensions/db')
            if (response.success) {
                // Filter only registered extensions
                const registeredExtensions = (response.data || []).filter(ext => ext.registered)
                setExtensions(registeredExtensions)

                if (registeredExtensions.length > 0) {
                    setSelectedExtension(registeredExtensions[0].extensionNumber)
                }
            }
        } catch (error) {
            console.error("Error fetching extensions:", error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedExtension) {
            toast.error("Please select an extension")
            return
        }

        if (!targetNumber) {
            toast.error("Please enter a target number")
            return
        }

        try {
            setLoading(true)

            // You'll need to implement this endpoint on your backend
            const response = await apiRequest('/yeaster/calls/make', {
                method: 'POST',
                body: JSON.stringify({
                    extension: selectedExtension,
                    number: targetNumber,
                    ispId: ispId
                })
            })

            if (response.success) {
                toast.success(`Call initiated from ${selectedExtension} to ${targetNumber}`)
                onSuccess()
                onOpenChange(false)
                resetForm()
            } else {
                toast.error(response.error || "Failed to initiate call")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to initiate call")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setTargetNumber("")
    }

    const getExtensionName = (extNumber: string) => {
        const ext = extensions.find(e => e.extensionNumber === extNumber)
        return ext ? `${ext.extensionNumber} - ${ext.extensionName}` : extNumber
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Make Call</DialogTitle>
                    <DialogDescription>
                        Initiate a new call from an extension
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Caller Extension */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>From Extension</Label>
                            <Select
                                value={selectedExtension}
                                onValueChange={setSelectedExtension}
                                disabled={extensions.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select extension">
                                        {selectedExtension && getExtensionName(selectedExtension)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {extensions.map((ext) => (
                                        <SelectItem key={ext.extensionNumber} value={ext.extensionNumber}>
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    <span>{ext.extensionNumber} - {ext.extensionName}</span>
                                                </div>
                                                {ext.registered && (
                                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {extensions.length === 0 && (
                                <p className="text-sm text-amber-600">
                                    No registered extensions available. Please register an extension first.
                                </p>
                            )}
                        </div>

                        {/* Target Number */}
                        <div className="space-y-2">
                            <Label htmlFor="targetNumber">To Number *</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="targetNumber"
                                    value={targetNumber}
                                    onChange={(e) => setTargetNumber(e.target.value)}
                                    placeholder="e.g., 9841XXXXXX"
                                    type="tel"
                                    className="pl-10"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Enter extension number for internal call or full number for external call
                            </p>
                        </div>

                        {/* Preview */}
                        <div className="rounded-lg bg-muted/50 p-4">
                            <div className="flex items-center justify-center gap-4">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">From</p>
                                    <p className="text-lg font-semibold">
                                        {selectedExtension ? getExtensionName(selectedExtension) : "Select extension"}
                                    </p>
                                </div>
                                <PhoneCall className="h-6 w-6 text-primary" />
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">To</p>
                                    <p className="text-lg font-semibold">
                                        {targetNumber || "Enter number"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false)
                                resetForm()
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !selectedExtension || !targetNumber || extensions.length === 0}
                        >
                            <Phone className="mr-2 h-4 w-4" />
                            {loading ? "Initiating..." : "Make Call"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}