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
import { Phone, User, ArrowRight } from "lucide-react"

interface TransferCallModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    call: any
    ispId: number
    onSuccess: () => void
}

interface Extension {
    extensionNumber: string
    extensionName: string
}

export default function TransferCallModal({
    open,
    onOpenChange,
    call,
    ispId,
    onSuccess
}: TransferCallModalProps) {
    const [loading, setLoading] = useState(false)
    const [extensions, setExtensions] = useState<Extension[]>([])
    const [transferType, setTransferType] = useState<'blind' | 'attended'>('blind')
    const [targetNumber, setTargetNumber] = useState("")
    const [selectedExtension, setSelectedExtension] = useState("")

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
                setExtensions(response.data || [])
            }
        } catch (error) {
            console.error("Error fetching extensions:", error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!call?.channelId) {
            toast.error("No call selected")
            return
        }

        let target = selectedExtension || targetNumber
        if (!target) {
            toast.error("Please select a target number or extension")
            return
        }

        try {
            setLoading(true)

            if (transferType === 'blind') {
                // Blind transfer
                const response = await apiRequest('/yeaster/calls/transfer', {
                    method: 'POST',
                    body: JSON.stringify({
                        channelId: call.channelId,
                        number: target,
                        dialpermission: 'permit'
                    })
                })

                if (response.success) {
                    toast.success(`Call transferred to ${target}`)
                    onSuccess()
                    onOpenChange(false)
                    resetForm()
                } else {
                    toast.error(response.error || "Failed to transfer call")
                }
            } else {
                // Attended transfer
                const response = await apiRequest('/yeaster/calls/attended-transfer', {
                    method: 'POST',
                    body: JSON.stringify({
                        channelId: call.channelId,
                        tonumber: target,
                        dialpermission: 'permit'
                    })
                })

                if (response.success) {
                    toast.success(`Initiating attended transfer to ${target}`)
                    onSuccess()
                    onOpenChange(false)
                    resetForm()
                } else {
                    toast.error(response.error || "Failed to initiate attended transfer")
                }
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to transfer call")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setTransferType('blind')
        setTargetNumber("")
        setSelectedExtension("")
    }

    const handleExtensionChange = (value: string) => {
        setSelectedExtension(value)
        setTargetNumber("")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Transfer Call</DialogTitle>
                    <DialogDescription>
                        Transfer call from {call?.caller} to another extension or number
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Current Call Info */}
                    <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-primary/10 p-2">
                                    <Phone className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Current Call</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-lg font-semibold">{call?.caller}</span>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-lg font-semibold">{call?.called}</span>
                                    </div>
                                </div>
                            </div>
                            {call?.duration && (
                                <div className="text-sm text-muted-foreground">
                                    Duration: {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transfer Type */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Transfer Type</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant={transferType === 'blind' ? 'default' : 'outline'}
                                    onClick={() => setTransferType('blind')}
                                    className="justify-start"
                                >
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Blind Transfer
                                </Button>
                                <Button
                                    type="button"
                                    variant={transferType === 'attended' ? 'default' : 'outline'}
                                    onClick={() => setTransferType('attended')}
                                    className="justify-start"
                                >
                                    <Phone className="mr-2 h-4 w-4" />
                                    Attended Transfer
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                {transferType === 'blind'
                                    ? "Direct transfer without consultation"
                                    : "Consult with target before transferring"}
                            </p>
                        </div>

                        {/* Target Selection */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Transfer to Extension</Label>
                                <Select
                                    value={selectedExtension}
                                    onValueChange={handleExtensionChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an extension" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {extensions.map((ext) => (
                                            <SelectItem key={ext.extensionNumber} value={ext.extensionNumber}>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    <span>{ext.extensionNumber} - {ext.extensionName}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or enter any number
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="targetNumber">External Number</Label>
                                <Input
                                    id="targetNumber"
                                    value={targetNumber}
                                    onChange={(e) => {
                                        setTargetNumber(e.target.value)
                                        setSelectedExtension("")
                                    }}
                                    placeholder="e.g., 9841XXXXXX"
                                    type="tel"
                                />
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
                        <Button type="submit" disabled={loading || (!selectedExtension && !targetNumber)}>
                            {loading ? "Transferring..." : `Transfer Call`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}