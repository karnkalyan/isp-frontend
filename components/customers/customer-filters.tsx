"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardContainer } from "@/components/ui/card-container"

export function CustomerFilters() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <CardContainer title="" gradientColor="#3B82F6" forceDarkMode={false}>
      <div
        className="relative z-10 rounded-lg border p-4 shadow-sm theme-critical bg-gradient-to-b from-white to-gray-50 border-gray-200 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700"
      >
        <div className="flex flex-col space-y-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4 relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Select defaultValue="all">
              <SelectTrigger
                className="w-[140px] bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent
                className="bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger
                className="w-[140px] bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent
                className="bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="fiber-basic">Fiber Basic</SelectItem>
                <SelectItem value="fiber-pro">Fiber Pro</SelectItem>
                <SelectItem value="fiber-ultra">Fiber Ultra</SelectItem>
                <SelectItem value="fiber-business">Business</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="sm:w-[100px] border-gray-200 dark:border-slate-700 dark:text-white"
            >
              Filters
            </Button>
          </div>
        </div>
      </div>
    </CardContainer>
  )
}
