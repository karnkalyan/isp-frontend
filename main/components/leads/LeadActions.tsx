"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import { useConfirmToast } from "@/hooks/use-confirm-toast"
import { apiRequest } from "@/lib/api"
import { useRouter } from "next/navigation"
import { FollowUpDialog } from "./FollowUpDialog"
import {
    Edit,
    Trash2,
    Eye,
    Clock,
    UserPlus,
    Phone
} from "lucide-react"

interface LeadActionsProps {
    lead: any
    onDelete?: () => void
    onConvert?: () => void
    onFollowUp?: () => void
    users?: any[]
}

export function LeadActions({ lead, onDelete, onConvert, onFollowUp, users = [] }: LeadActionsProps) {
    const router = useRouter()
    const { confirm } = useConfirmToast()
    const [showFollowUpDialog, setShowFollowUpDialog] = useState(false)

    const handleDelete = async () => {
        const isConfirmed = await confirm({
            title: "Delete Lead",
            message: "Are you sure you want to delete this lead?",
            type: "danger",
            confirmText: "Delete",
            cancelText: "Cancel"
        })

        if (!isConfirmed) return

        try {
            await apiRequest(`/lead/${lead.id}`, { method: 'DELETE' })
            toast.success("Lead deleted successfully")
            onDelete?.()
        } catch (error: any) {
            toast.error("Failed to delete lead")
        }
    }

    const handleCall = () => {
        if (lead.phoneNumber) {
            // Implement call functionality
            const callPayload = {
                destination: lead.phoneNumber,
            };

            apiRequest(`/yeaster/makeCalls`, {
                method: 'POST',
                body: JSON.stringify(callPayload)
            })
                .then(() => toast.success("Calling " + lead.phoneNumber))
                .catch(() => toast.error("Failed to make call"))
        } else {
            toast.error("Phone number is not available")
        }
    }

    const handleFollowUpSuccess = () => {
        toast.success("Follow-up created successfully")
        onFollowUp?.()
    }

    return (
        <>
            <FollowUpDialog
                open={showFollowUpDialog}
                onOpenChange={setShowFollowUpDialog}
                lead={lead}
                onSuccess={handleFollowUpSuccess}
                users={users}
            />

            <div className="flex justify-end gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/leads/view/${lead.id}`)}
                    className="h-8 w-8 hover:bg-blue-100"
                    title="View"
                >
                    <Eye className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/leads/edit/${lead.id}`)}
                    className="h-8 w-8 hover:bg-green-100"
                    title="Edit"
                >
                    <Edit className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFollowUpDialog(true)}
                    className="h-8 w-8 hover:bg-purple-100"
                    title="Add Follow-up"
                >
                    <Clock className="h-4 w-4 text-purple-600" />
                </Button>

                {!lead.convertedToCustomer && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/leads/convert/${lead.id}`)}
                        className="h-8 w-8 hover:bg-green-100"
                        title="Convert to Customer"
                    >
                        <UserPlus className="h-4 w-4 text-green-600" />
                    </Button>
                )}

                {lead.phoneNumber && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCall}
                        className="h-8 w-8 hover:bg-blue-100"
                        title="Call"
                    >
                        <Phone className="h-4 w-4 text-blue-600" />
                    </Button>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-red-100"
                    title="Delete"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </>
    )
}