"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import { useConfirmToast } from "@/hooks/use-confirm-toast"
import { apiRequest } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
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
    const { user } = useAuth()
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

    const handleCall = (phoneNumber = lead.phoneNumber) => {
        if (phoneNumber) {
            const extension = String(user?.yeastarExt || user?.extId || "").trim()
            if (!extension) {
                toast.error("No Yeastar extension is assigned to your user account")
                return
            }

            apiRequest(`/yeaster/calls/make`, {
                method: 'POST',
                body: JSON.stringify({
                    extension,
                    caller: extension,
                    callee: phoneNumber,
                    number: phoneNumber,
                    autoanswer: "yes",
                })
            })
                .then(() => toast.success("Calling " + phoneNumber))
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

                {lead.secondaryContactNumber && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCall(lead.secondaryContactNumber)}
                        className="h-8 w-8 hover:bg-blue-100"
                        title="Call Secondary"
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
