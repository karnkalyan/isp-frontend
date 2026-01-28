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
import {
    Search,
    Mail,
    User,
    CheckCircle,
    History
} from "lucide-react"

export function ConvertedLeads() {
    const [leads, setLeads] = useState<any[]>([])
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

    const fetchConvertedLeads = async (page?: number) => {
        try {
            setLoading(true)
            const currentPage = page || pagination.currentPage

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: pagination.itemsPerPage.toString(),
                converted: 'true'
            })

            if (searchQuery) params.append('search', searchQuery)

            const response = await apiRequest(`/lead?${params.toString()}`)

            setLeads(response.data || [])
            setPagination(response.pagination || pagination)
        } catch (error: any) {
            toast.error(error.message || "Failed to load converted leads")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchConvertedLeads()
    }, [pagination.currentPage, searchQuery])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPagination(prev => ({ ...prev, currentPage: 1 }))
    }

    return (
        <CardContainer title="Converted Leads" description="Leads that have been converted to customers">
            {/* Search Bar */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search converted leads..."
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
                <div className="text-center py-8">Loading converted leads...</div>
            ) : leads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No converted leads found.
                </div>
            ) : (
                <>
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Converted By</TableHead>
                                    <TableHead>Converted At</TableHead>
                                    <TableHead>Original Source</TableHead>
                                    <TableHead>Actions</TableHead>
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
                                                {lead.email || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {lead.customers && lead.customers.length > 0 ? (
                                                <div className="space-y-1">
                                                    {lead.customers.map(customer => (
                                                        <div key={customer.id} className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">
                                                                {customer.firstName} {customer.lastName}
                                                            </span>
                                                            <Badge variant="outline" className="text-xs">
                                                                Customer
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">No customer linked</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {lead.convertedBy ? (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span>{lead.convertedBy.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">System</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm flex items-center gap-1">
                                                <History className="h-3 w-3" />
                                                {lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString() : "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {lead.source?.replace('_', ' ') || "-"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => window.location.href = `/leads/view/${lead.id}`}
                                                className="h-8 w-8 hover:bg-blue-100"
                                                title="View"
                                            >
                                                <Search className="h-4 w-4" />
                                            </Button>
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