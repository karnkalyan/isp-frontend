"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { CardContainer } from "@/components/ui/card-container"

export function CustomerFilters() {
  const [searchQuery, setSearchQuery] = useState("")
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  return (
    <CardContainer title="" gradientColor={isDarkMode ? "#3B82F6" : "#3B82F6"} forceDarkMode={false}>
      <div
        className={`relative z-10 rounded-lg border p-4 shadow-sm theme-critical ${
          isDarkMode
            ? "bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700"
            : "bg-gradient-to-b from-white to-gray-50 border-gray-200"
        }`}
      >
        <div className="flex flex-col space-y-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4 relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200"}`}
            />
          </div>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Select defaultValue="all">
              <SelectTrigger
                className={`w-[140px] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200"}`}
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent
                className={isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200"}
              >
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger
                className={`w-[140px] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200"}`}
              >
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent
                className={isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200"}
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
              className={`sm:w-[100px] ${isDarkMode ? "border-slate-700 text-white" : "border-gray-200"}`}
            >
              Filters
            </Button>
          </div>
        </div>
      </div>
    </CardContainer>
  )
}
