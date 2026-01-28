"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LeadActions } from "./LeadActions"
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    User,
    Tag,
    CalendarDays
} from "lucide-react"

interface LeadTableProps {
    leads: any[]
    onDelete?: () => void
    showActions?: boolean
}

export function LeadTable({ leads, onDelete, showActions = true }: LeadTableProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatDateShort = (dateString: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    }

    const getStatusBadge = (status: string, converted: boolean = false) => {
        if (converted) {
            return (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 capitalize">
                    Converted
                </Badge>
            )
        }

        const statusConfig: Record<string, any> = {
            new: {
                color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
                label: "New"
            },
            contacted: {
                color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                label: "Contacted"
            },
            qualified: {
                color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
                label: "Qualified"
            },
            unqualified: {
                color: "bg-red-500/10 text-red-500 border-red-500/20",
                label: "Unqualified"
            }
        }

        const config = statusConfig[status] || statusConfig.new

        return (
            <Badge variant="outline" className={`${config.color} capitalize`}>
                {config.label}
            </Badge>
        )
    }

    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Next Follow-up</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Created</TableHead>
                        {showActions && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.map((lead) => (
                        <TableRow key={lead.id}>
                            <TableCell>
                                <div className="font-medium">
                                    {lead.firstName} {lead.middleName} {lead.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {lead.gender || "Not specified"}
                                </div>
                                {lead.membership && (
                                    <div className="text-xs text-muted-foreground">
                                        <Tag className="inline h-3 w-3 mr-1" />
                                        {lead.membership.name}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-sm">
                                        <Mail className="h-3 w-3" />
                                        {lead.email || "-"}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm">
                                        <Phone className="h-3 w-3" />
                                        {lead.phoneNumber || "-"}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    {lead.district && (
                                        <div className="flex items-center gap-1 text-sm">
                                            <MapPin className="h-3 w-3" />
                                            {lead.district}
                                        </div>
                                    )}
                                    {lead.province && (
                                        <div className="text-xs text-muted-foreground">
                                            {lead.province}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="capitalize">
                                    {lead.source?.replace('_', ' ') || "-"}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(lead.status, lead.convertedToCustomer)}
                            </TableCell>
                            <TableCell>
                                {lead.nextFollowUp ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <CalendarDays className="h-4 w-4 text-blue-500" />
                                        <div>
                                            <div>{formatDateShort(lead.nextFollowUp)}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-sm">No follow-up</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {lead.assignedUser ? (
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="font-medium">{lead.assignedUser.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {lead.assignedUser.role?.name || "No role"}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">Unassigned</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="text-sm">
                                    <Calendar className="inline h-3 w-3 mr-1" />
                                    {formatDate(lead.createdAt)}
                                </div>
                            </TableCell>
                            {showActions && (
                                <TableCell className="text-right">
                                    <LeadActions lead={lead} onDelete={onDelete} />
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}