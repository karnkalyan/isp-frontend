"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface LeadFiltersProps {
    searchQuery: string
    setSearchQuery: (value: string) => void
    statusFilter: string
    setStatusFilter: (value: string) => void
    sourceFilter: string
    setSourceFilter: (value: string) => void
    onSearch: (e: React.FormEvent) => void
    onClearFilters: () => void
    showSourceFilter?: boolean
    showStatusFilter?: boolean
}

const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "unqualified", label: "Unqualified" },
    { value: "converted", label: "Converted" }
]

const SOURCE_OPTIONS = [
    { value: "all", label: "All Sources" },
    { value: "website", label: "Website" },
    { value: "referral", label: "Referral" },
    { value: "social_media", label: "Social Media" },
    { value: "advertisement", label: "Advertisement" },
    { value: "cold_call", label: "Cold Call" },
    { value: "walk_in", label: "Walk-in" },
    { value: "event", label: "Event" },
    { value: "other", label: "Other" }
]

export function LeadFilters({
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    onSearch,
    onClearFilters,
    showSourceFilter = true,
    showStatusFilter = true
}: LeadFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
                <form onSubmit={onSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name, email, or phone..."
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

            <div className="flex gap-2">
                {showStatusFilter && (
                    <div className="w-40">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map(status => (
                                    <SelectItem key={status.value} value={status.value}>
                                        {status.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {showSourceFilter && (
                    <div className="w-40">
                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                                {SOURCE_OPTIONS.map(source => (
                                    <SelectItem key={source.value} value={source.value}>
                                        {source.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <Button
                    variant="outline"
                    onClick={onClearFilters}
                    className="flex items-center gap-2"
                >
                    <X className="h-4 w-4" />
                    Clear
                </Button>
            </div>
        </div>
    )
}