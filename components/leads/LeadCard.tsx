"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LeadActions } from "./LeadActions"
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    User,
    Building,
    Tag
} from "lucide-react"

interface LeadCardProps {
    lead: any
    onDelete?: () => void
}

export function LeadCard({ lead, onDelete }: LeadCardProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            new: "bg-blue-100 text-blue-800",
            contacted: "bg-yellow-100 text-yellow-800",
            qualified: "bg-purple-100 text-purple-800",
            unqualified: "bg-red-100 text-red-800",
            converted: "bg-green-100 text-green-800"
        }
        return colors[status] || colors.new
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">
                            {lead.firstName} {lead.middleName} {lead.lastName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getStatusColor(lead.status)}>
                                {lead.status}
                            </Badge>
                            {lead.source && (
                                <Badge variant="outline" className="capitalize">
                                    {lead.source.replace('_', ' ')}
                                </Badge>
                            )}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pb-3">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{lead.email || "No email"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{lead.phoneNumber || "No phone"}</span>
                    </div>

                    {lead.district && (
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>{lead.district}{lead.province ? `, ${lead.province}` : ''}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Created: {formatDate(lead.createdAt)}</span>
                    </div>

                    {lead.assignedUser && (
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-500" />
                            <span>Assigned to: {lead.assignedUser.name}</span>
                        </div>
                    )}

                    {lead.membership && (
                        <div className="flex items-center gap-2 text-sm">
                            <Building className="h-4 w-4 text-gray-500" />
                            <span>Membership: {lead.membership.name}</span>
                        </div>
                    )}

                    {lead.interestedPackage && (
                        <div className="flex items-center gap-2 text-sm">
                            <Tag className="h-4 w-4 text-gray-500" />
                            <span>Package: {lead.interestedPackage.packageName || lead.interestedPackage.name}</span>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="pt-3 border-t">
                <div className="w-full flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                        ID: {lead.id.substring(0, 8)}...
                    </div>
                    <div className="flex gap-1">
                        <LeadActions lead={lead} onDelete={onDelete} />
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}