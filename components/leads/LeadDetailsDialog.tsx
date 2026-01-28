"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Building,
    Package,
    Tag,
    History,
    CheckCircle,
    AlertCircle,
    Phone as PhoneIcon,
    MapPin as MapPinIcon,
    User as UserIcon,
    Clock,
    MessageSquare,
    Navigation
} from "lucide-react"

interface LeadDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    lead: any
}

export function LeadDetailsDialog({ open, onOpenChange, lead }: LeadDetailsDialogProps) {
    if (!lead) return null

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusBadge = (status: string, converted: boolean = false) => {
        if (converted) {
            return (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Converted
                </Badge>
            )
        }

        const statusConfig: Record<string, any> = {
            new: {
                color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
                icon: AlertCircle,
                label: "New"
            },
            contacted: {
                color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                icon: PhoneIcon,
                label: "Contacted"
            },
            qualified: {
                color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
                icon: CheckCircle,
                label: "Qualified"
            },
            unqualified: {
                color: "bg-red-500/10 text-red-500 border-red-500/20",
                icon: AlertCircle,
                label: "Unqualified"
            }
        }

        const config = statusConfig[status] || statusConfig.new
        const Icon = config.icon

        return (
            <Badge variant="outline" className={`${config.color} flex items-center`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Lead Details</DialogTitle>
                    <DialogDescription>
                        Complete information about {lead.firstName} {lead.lastName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm text-muted-foreground">Full Name</Label>
                                <p className="text-lg font-semibold">
                                    {lead.firstName} {lead.middleName} {lead.lastName}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm text-muted-foreground">Gender</Label>
                                    <p className="font-medium">{lead.gender || "Not specified"}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Age</Label>
                                    <p className="font-medium">{lead.metadata?.age || "Not provided"}</p>
                                </div>
                            </div>

                            {lead.membership && (
                                <div>
                                    <Label className="text-sm text-muted-foreground">Membership</Label>
                                    <div className="flex items-center gap-2">
                                        <Building className="h-4 w-4 text-gray-500" />
                                        <p className="font-medium">{lead.membership.name} ({lead.membership.code})</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm text-muted-foreground">Email</Label>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <p className="font-medium">{lead.email || "Not provided"}</p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm text-muted-foreground">Phone Number</Label>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <p className="font-medium">{lead.phoneNumber || "Not provided"}</p>
                                </div>
                            </div>

                            {lead.secondaryContactNumber && (
                                <div>
                                    <Label className="text-sm text-muted-foreground">Secondary Phone</Label>
                                    <div className="flex items-center gap-2">
                                        <PhoneIcon className="h-4 w-4 text-gray-500" />
                                        <p className="font-medium">{lead.secondaryContactNumber}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Lead Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Status</Label>
                            {getStatusBadge(lead.status, lead.convertedToCustomer)}
                        </div>

                        <div>
                            <Label className="text-sm text-muted-foreground">Source</Label>
                            <p className="font-medium capitalize">{lead.source?.replace('_', ' ') || "Not provided"}</p>
                        </div>

                        <div>
                            <Label className="text-sm text-muted-foreground">Assigned To</Label>
                            {lead.assignedUser ? (
                                <div className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-gray-500" />
                                    <p className="font-medium">{lead.assignedUser.name}</p>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Unassigned</p>
                            )}
                        </div>
                    </div>

                    {/* Location Information */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <MapPinIcon className="h-4 w-4" />
                            Location Information
                        </Label>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {lead.district && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">District</Label>
                                    <p className="font-medium">{lead.district}</p>
                                </div>
                            )}

                            {lead.province && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">Province</Label>
                                    <p className="font-medium">{lead.province}</p>
                                </div>
                            )}

                            {lead.street && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">Street</Label>
                                    <p className="font-medium">{lead.street}</p>
                                </div>
                            )}
                        </div>

                        {lead.address && (
                            <div>
                                <Label className="text-xs text-muted-foreground">Address</Label>
                                <p className="font-medium">{lead.address}</p>
                            </div>
                        )}

                        {lead.metadata?.fullAddress && (
                            <div>
                                <Label className="text-xs text-muted-foreground">Full Address</Label>
                                <p className="font-medium">{lead.metadata.fullAddress}</p>
                            </div>
                        )}

                        {lead.metadata?.latitude && lead.metadata?.longitude && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Latitude</Label>
                                    <p className="font-mono text-sm">{lead.metadata.latitude}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Longitude</Label>
                                    <p className="font-mono text-sm">{lead.metadata.longitude}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Package Information */}
                    {lead.interestedPackage && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Interested Package
                            </Label>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">
                                            {lead.interestedPackage.packageName || lead.interestedPackage.name}
                                        </p>
                                        {lead.interestedPackage.price && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                NPR {lead.interestedPackage.price}
                                            </p>
                                        )}
                                        {lead.interestedPackage.description && (
                                            <p className="text-sm text-gray-600 mt-2">
                                                {lead.interestedPackage.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {lead.notes && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Notes
                            </Label>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="whitespace-pre-wrap">{lead.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Timeline
                        </Label>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">Created</span>
                                </div>
                                <span className="text-sm text-gray-600">{formatDate(lead.createdAt)}</span>
                            </div>

                            {lead.updatedAt && lead.updatedAt !== lead.createdAt && (
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm">Last Updated</span>
                                    </div>
                                    <span className="text-sm text-gray-600">{formatDate(lead.updatedAt)}</span>
                                </div>
                            )}

                            {lead.convertedAt && (
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-sm text-green-600">Converted to Customer</span>
                                    </div>
                                    <span className="text-sm text-green-600">{formatDate(lead.convertedAt)}</span>
                                </div>
                            )}

                            {lead.nextFollowUp && (
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm text-blue-600">Next Follow-up</span>
                                    </div>
                                    <span className="text-sm text-blue-600">{formatDate(lead.nextFollowUp)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    {!lead.convertedToCustomer && (
                        <Button onClick={() => {
                            onOpenChange(false)
                            window.location.href = `/leads/edit/${lead.id}`
                        }}>
                            Edit Lead
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}