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
import { Phone, PhoneCall, UserCheck } from "lucide-react"

interface MakeCallModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    ispId: number
    onSuccess: () => void
}

interface Extension {
    extensionNumber: string
    extensionName: string
    status?: string
    registered?: boolean
}

interface AuthMeResponse {
    user?: {
        yeastarExt?: string | null
    }
}

export default function MakeCallModal({
    open,
    onOpenChange,
    ispId,
    onSuccess
}: MakeCallModalProps) {
    const [loading, setLoading] = useState(false)
    const [assignedExtension, setAssignedExtension] = useState<Extension | null>(null)
    const [targetNumber, setTargetNumber] = useState("")
    const [autoAnswer, setAutoAnswer] = useState("yes")

    // Fetch available extensions & reset form on close
    useEffect(() => {
        if (open) {
            fetchExtensions()
        } else {
            resetForm()
        }
    }, [open])

    const fetchExtensions = async () => {
        try {
            const me = await apiRequest<AuthMeResponse>('/auth/me')
            const assignedExt = String(me.user?.yeastarExt || "").trim()

            if (!assignedExt) {
                setAssignedExtension(null)
                return
            }

            const response = await apiRequest<{ success: boolean; data: Extension[] }>('/yeaster/extensions/db')
            if (response.success) {
                const assignedExtension = (response.data || []).find((ext) =>
                    ext.extensionNumber === assignedExt
                )

                if (assignedExtension) {
                    setAssignedExtension(assignedExtension)
                } else {
                    setAssignedExtension({
                        extensionNumber: assignedExt,
                        extensionName: assignedExt,
                        status: "Unknown",
                        registered: false
                    })
                }
            }
        } catch (error) {
            console.error("Error fetching extensions:", error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!assignedExtension) {
            toast.error("No VoIP extension is assigned to your user account")
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
                    caller: assignedExtension.extensionNumber,
                    callee: targetNumber.trim(),
                    extension: assignedExtension.extensionNumber,
                    number: targetNumber.trim(),
                    autoanswer: autoAnswer,
                    ispId: ispId
                })
            })

            if (response.success) {
                toast.success(`Call initiated from ${assignedExtension.extensionNumber} to ${targetNumber}`)
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
        setAutoAnswer("yes")
    }

    const getExtensionName = () => {
        if (!assignedExtension) return "Not assigned"
        return `${assignedExtension.extensionNumber} - ${assignedExtension.extensionName || assignedExtension.extensionNumber}`
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
                            <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{getExtensionName()}</span>
                                </div>
                                {assignedExtension?.registered && (
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                )}
                            </div>
                            {!assignedExtension && (
                                <p className="text-sm text-amber-600">
                                    No VoIP extension is assigned to your user account.
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

                        <div className="space-y-2">
                            <Label>Auto Answer</Label>
                            <Select value={autoAnswer} onValueChange={setAutoAnswer}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Auto answer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no">No</SelectItem>
                                    <SelectItem value="yes">Yes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Preview */}
                        <div className="rounded-lg bg-muted/50 p-4">
                            <div className="flex items-center justify-center gap-4">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">From</p>
                                    <p className="text-lg font-semibold">
                                        {getExtensionName()}
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
                            disabled={loading || !assignedExtension || !targetNumber}
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
