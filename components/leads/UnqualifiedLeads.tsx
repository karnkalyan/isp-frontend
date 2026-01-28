"use client"

import React, { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { PaginationControls } from "./PaginationControls"
import { LeadActions } from "./LeadActions"
import {
    Search,
    Mail,
    Phone,
    MapPin,
    User,
    TrendingDownIcon
} from "lucide-react"

export function UnqualifiedLeads() {
    const [leads, setLeads] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPreviousPage: false
    })

    const fetchUsers = async () => {
        try {
            const data = await apiRequest("/users")
            const processedUsers = Array.isArray(data)
                ? data.map((user: any) => ({
                    ...user,
                    id: String(user.id)
                }))
                : []
            setUsers(processedUsers)
        } catch (error: any) {
            console.error("Failed to fetch users:", error)
        }
    }

    const fetchUnqualifiedLeads = async (page?: number) => {
        try {
            setLoading(true)
            const currentPage = page || pagination.currentPage

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: pagination.itemsPerPage.toString(),
                unqualified: 'true'
            })

            if (searchQuery) params.append('search', searchQuery)

            const response = await apiRequest(`/lead?${params.toString()}`)

            setLeads(response.data || [])
            setPagination(response.pagination || pagination)
        } catch (error: any) {
            toast.error(error.message || "Failed to load unqualified leads")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
        fetchUnqualifiedLeads()
    }, [])

    useEffect(() => {
        fetchUnqualifiedLeads()
    }, [pagination.currentPage, searchQuery])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPagination(prev => ({ ...prev, currentPage: 1 }))
    }

    return (
        <CardContainer title="Unqualified Leads" description="Leads that are not suitable for conversion">
            {/* Search Bar */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search unqualified leads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit" variant="default">
                            <Search className="h-4 w-4 mr-2" />
                            Search
                        </Button>
                    </form>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading unqualified leads...</div>
            ) : leads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No unqualified leads found.
                </div>
            ) : (
                <>
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Assigned To</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {lead.firstName} {lead.middleName} {lead.lastName}
                                            </div>
                                            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 mt-1">
                                                <TrendingDownIcon className="h-3 w-3 mr-1" />
                                                Unqualified
                                            </Badge>
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
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {lead.source?.replace('_', ' ') || "-"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground max-w-xs truncate">
                                                {lead.notes || "No reason specified"}
                                            </div>
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
                                                {new Date(lead.createdAt).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <LeadActions lead={lead} onDelete={fetchUnqualifiedLeads} users={users} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <PaginationControls
                        pagination={pagination}
                        onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                    />
                </>
            )}
        </CardContainer>
    )
}