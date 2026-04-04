"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import {
    X,
    PhoneCall,
    Mail as MailIcon,
    Users as UsersIcon,
    Map as MapIcon,
    MessageSquare,
    CalendarDays
} from "lucide-react"

type FollowUpType = 'CALL' | 'EMAIL' | 'MEETING' | 'VISIT' | 'OTHER'
type FollowUpStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MISSED'

interface User {
    id: string
    name: string
    email: string
}

interface FollowUp {
    id: string
    leadId: string
    type: FollowUpType
    status: FollowUpStatus
    title: string
    description?: string
    scheduledAt: string
    completedAt?: string
    notes?: string
    outcome?: string
    assignedUserId: string
    assignedUser: {
        id: string
        name: string
        email: string
    }
    createdAt: string
    updatedAt: string
}

interface FollowUpDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    lead: {
        id: string
        firstName: string
        lastName: string
        assignedUserId?: string
    }
    followUp?: FollowUp | null
    onSuccess?: () => void
    users: User[]
}

const FOLLOW_UP_TYPE_OPTIONS = [
    { value: "CALL", label: "Phone Call", icon: PhoneCall },
    { value: "EMAIL", label: "Email", icon: MailIcon },
    { value: "MEETING", label: "Meeting", icon: UsersIcon },
    { value: "VISIT", label: "Site Visit", icon: MapIcon },
    { value: "OTHER", label: "Other", icon: MessageSquare }
]

const FOLLOW_UP_STATUS_OPTIONS = [
    { value: "SCHEDULED", label: "Scheduled" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "MISSED", label: "Missed" }
]

const OUTCOME_OPTIONS = [
    { value: "left_message", label: "Left Message" },
    { value: "no_answer", label: "No Answer" },
    { value: "busy", label: "Line Busy" },
    { value: "interested", label: "Interested" },
    { value: "not_interested", label: "Not Interested" },
    { value: "call_back", label: "Will Call Back" },
    { value: "follow_up", label: "Need Follow-up" },
    { value: "converted", label: "Converted to Customer" }
]

export function FollowUpDialog({
    open,
    onOpenChange,
    lead,
    followUp,
    onSuccess,
    users
}: FollowUpDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        type: "CALL" as FollowUpType,
        title: "",
        description: "",
        scheduledAt: "",
        assignedUserId: "",
        notes: "",
        status: "SCHEDULED" as FollowUpStatus,
        outcome: ""
    })

    // Initialize form when dialog opens or followUp changes
    useEffect(() => {
        if (followUp) {
            setFormData({
                type: followUp.type,
                title: followUp.title,
                description: followUp.description || "",
                scheduledAt: followUp.scheduledAt.split('T')[0],
                assignedUserId: followUp.assignedUserId,
                notes: followUp.notes || "",
                status: followUp.status,
                outcome: followUp.outcome || ""
            })
        } else {
            // Set default values for new follow-up
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)

            setFormData({
                type: "CALL",
                title: `Follow-up with ${lead.firstName} ${lead.lastName}`,
                description: "",
                scheduledAt: tomorrow.toISOString().split('T')[0],
                assignedUserId: lead.assignedUserId || "",
                notes: "",
                status: "SCHEDULED",
                outcome: ""
            })
        }
    }, [followUp, lead, open])

    const handleChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const validateForm = () => {
        if (!formData.title.trim()) {
            toast.error("Follow-up title is required")
            return false
        }
        if (!formData.scheduledAt.trim()) {
            toast.error("Scheduled date is required")
            return false
        }
        return true
    }

    const handleSave = async () => {
        if (!validateForm()) return

        try {
            setLoading(true)

            if (followUp) {
                await apiRequest(`/followup/follow-ups/${followUp.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                })
                toast.success("Follow-up updated successfully")
            } else {
                await apiRequest(`/followup/leads/${lead.id}/follow-ups`, {
                    method: 'POST',
                    body: JSON.stringify(formData)
                })
                toast.success("Follow-up created successfully")
            }

            onSuccess?.()
            onOpenChange(false)
            resetForm()
        } catch (error: any) {
            console.error("Follow-up save error:", error)
            toast.error(error.message || "Failed to save follow-up")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            type: "CALL",
            title: "",
            description: "",
            scheduledAt: "",
            assignedUserId: "",
            notes: "",
            status: "SCHEDULED",
            outcome: ""
        })
    }

    const userOptions = users.map(user => ({
        value: user.id,
        label: user.name,
        description: user.email
    }))

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{followUp ? "Edit Follow-up" : "Create Follow-up"}</DialogTitle>
                    <DialogDescription>
                        {followUp
                            ? "Update follow-up information"
                            : `Schedule a follow-up with ${lead.firstName} ${lead.lastName}`
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => handleChange("type", value as FollowUpType)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FOLLOW_UP_TYPE_OPTIONS.map((type) => {
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

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => handleChange("status", value as FollowUpStatus)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FOLLOW_UP_STATUS_OPTIONS.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            placeholder="Enter follow-up title"
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Enter follow-up description"
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="scheduledAt">
                                Scheduled Date & Time <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="scheduledAt"
                                type="datetime-local"
                                value={formData.scheduledAt}
                                onChange={(e) => handleChange("scheduledAt", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assignedUserId">Assigned To</Label>
                            <SearchableSelect
                                options={userOptions}
                                value={formData.assignedUserId}
                                onValueChange={(value) => handleChange("assignedUserId", value)}
                                placeholder="Select user"
                                emptyMessage="No users found"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="outcome">Outcome</Label>
                        <Select
                            value={formData.outcome}
                            onValueChange={(value) => handleChange("outcome", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select outcome (if completed)" />
                            </SelectTrigger>
                            <SelectContent>
                                {OUTCOME_OPTIONS.map((outcome) => (
                                    <SelectItem key={outcome.value} value={outcome.value}>
                                        {outcome.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Enter any additional notes..."
                            value={formData.notes}
                            onChange={(e) => handleChange("notes", e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
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
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : followUp ? "Update Follow-up" : "Create Follow-up"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}