"use client"

import { useState } from "react"
import { FilterContainer } from "@/components/ui/filter-container"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download, Plus, Calendar, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export function InvoiceFilters() {
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const addFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter])
    }
  }

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter((f) => f !== filter))
  }

  return (
    <div className="space-y-4">
      <FilterContainer>
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search invoices..."
              className="pl-8 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
            />
          </div>
          <Select>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700 text-slate-100 focus:ring-blue-500">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border border-slate-800 text-slate-100">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200"
            onClick={() => addFilter("Date: Last 30 days")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200"
            onClick={() => addFilter("Custom Filter")}
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200"
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </FilterContainer>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter}
              variant="outline"
              className="flex items-center gap-1 border-slate-700 text-slate-300 bg-slate-800/50 px-3 py-1"
            >
              {filter}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent hover:text-slate-100"
                onClick={() => removeFilter(filter)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {filter} filter</span>
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-slate-400 hover:text-slate-100 hover:bg-transparent"
            onClick={() => setActiveFilters([])}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
