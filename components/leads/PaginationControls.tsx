"use client"

import { Button } from "@/components/ui/button"
import {
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    SkipBack,
    SkipForward
} from "lucide-react"

interface PaginationInfo {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
}

interface PaginationControlsProps {
    pagination: PaginationInfo
    onPageChange: (page: number) => void
}

export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
    const pageNumbers = []
    const maxPagesToShow = 5

    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxPagesToShow / 2))
    let endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1)

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
    }

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{" "}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{" "}
                {pagination.totalItems} entries
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(1)}
                    disabled={!pagination.hasPreviousPage || pagination.currentPage === 1}
                    className="h-8 w-8"
                >
                    <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="h-8 w-8"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {startPage > 1 && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(1)}
                            className="h-8 w-8"
                        >
                            1
                        </Button>
                        {startPage > 2 && <span className="px-2">...</span>}
                    </>
                )}

                {pageNumbers.map(page => (
                    <Button
                        key={page}
                        variant={pagination.currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className="h-8 w-8"
                    >
                        {page}
                    </Button>
                ))}

                {endPage < pagination.totalPages && (
                    <>
                        {endPage < pagination.totalPages - 1 && <span className="px-2">...</span>}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(pagination.totalPages)}
                            className="h-8 w-8"
                        >
                            {pagination.totalPages}
                        </Button>
                    </>
                )}

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="h-8 w-8"
                >
                    <ChevronRightIcon className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(pagination.totalPages)}
                    disabled={!pagination.hasNextPage || pagination.currentPage === pagination.totalPages}
                    className="h-8 w-8"
                >
                    <SkipForward className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}