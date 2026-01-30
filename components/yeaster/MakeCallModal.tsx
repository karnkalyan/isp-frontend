"use client"

import { useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone, User, Clock, Loader2, AlertCircle } from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"

interface MakeCallModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    ispId: number
    onSuccess: () => void
}

export default function MakeCallModal({
    open,
    onOpenChange,
    ispId,
    onSuccess
}: MakeCallModalProps) {
    const [loading, setLoading] = useState(false)
    const [caller, setCaller] = useState("")
    const [callee, setCallee] = useState("")
    const [autoAnswer, setAutoAnswer] = useState(false)
    const [callType, setCallType] = useState("extension")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!caller || !callee) {
            toast.error("Please enter both caller and callee numbers")
            return
        }

        setLoading(true)
        try {
            await apiRequest(`/yeastar/${ispId}/call/make`, {
                method: 'POST',
                body: JSON.stringify({
                    caller,
                    callee,
                    autoAnswer
                })
            })

            toast.success("Call initiated successfully")
            onSuccess()
            onOpenChange(false)

            // Reset form
            setCaller("")
            setCallee("")
            setAutoAnswer(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to initiate call")
        } finally {
            setLoading(false)
        }
    }

    const handleQuickCall = (extension: string) => {
        setCaller(extension)
        setCallee(extension === "1001" ? "1002" : "1001")
        toast.success(`Quick call set up: ${caller} → ${callee}`)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Make a Call
                        </DialogTitle>
                        <DialogDescription>
                            Initiate a call through Yeastar PBX. Enter caller and callee information below.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Call Type Selection */}
                        <div className="space-y-2">
                            <Label>Call Type</Label>
                            <Select value={callType} onValueChange={setCallType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select call type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="extension">Extension to Extension</SelectItem>
                                    <SelectItem value="external">Extension to External</SelectItem>
                                    <SelectItem value="emergency">Emergency Call</SelectItem>
                                    <SelectItem value="conference">Conference Call</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Quick Call Buttons */}
                        <div className="space-y-2">
                            <Label className="text-sm">Quick Calls</Label>
                            <div className="flex flex-wrap gap-2">
                                {["1001", "1002", "1003", "1004", "1005"].map((ext) => (
                                    <Button
                                        key={ext}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickCall(ext)}
                                    >
                                        Call {ext}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Caller */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="caller" className="text-right">
                                Caller
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="caller"
                                    placeholder="e.g., 1001"
                                    value={caller}
                                    onChange={(e) => setCaller(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Source extension or number
                                </p>
                            </div>
                        </div>

                        {/* Callee */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="callee" className="text-right">
                                Callee
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="callee"
                                    placeholder="e.g., 1002 or +9779841234567"
                                    value={callee}
                                    onChange={(e) => setCallee(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Destination extension or external number
                                </p>
                            </div>
                        </div>

                        {/* Auto Answer */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="autoAnswer"
                                checked={autoAnswer}
                                onCheckedChange={(checked) => setAutoAnswer(checked === true)}
                            />
                            <Label
                                htmlFor="autoAnswer"
                                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Enable auto-answer
                            </Label>
                        </div>

                        {/* Help Text */}
                        <div className="rounded-lg bg-muted p-3">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="text-xs text-muted-foreground">
                                    <p className="font-medium mb-1">Call Guidelines:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Internal extensions: 3-4 digits (e.g., 1001)</li>
                                        <li>External numbers: Include country code (e.g., +9779841234567)</li>
                                        <li>Auto-answer is only available for internal extensions</li>
                                        <li>Emergency calls bypass certain restrictions</li>
                                    </ul>
                                </div>
                            </div>
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
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Initiating Call...
                                </>
                            ) : (
                                <>
                                    <Phone className="mr-2 h-4 w-4" />
                                    Make Call
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}