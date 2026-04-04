"use client"

import { useState } from "react"
import { ChevronDown, Filter, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface FilterState {
  search: string
  types: {
    residential: boolean
    business: boolean
    enterprise: boolean
  }
  status: {
    active: boolean
    draft: boolean
    archived: boolean
  }
  priceRange: [number, number]
  speedRange: [number, number]
}

export function TariffFilters({ onFiltersChange }: { onFiltersChange?: (filters: FilterState) => void }) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    types: {
      residential: false,
      business: false,
      enterprise: false,
    },
    status: {
      active: true,
      draft: false,
      archived: false,
    },
    priceRange: [0, 500],
    speedRange: [0, 2000],
  })

  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange?.(updatedFilters)
  }

  const handleTypeToggle = (type: keyof FilterState["types"]) => {
    handleFilterChange({
      types: {
        ...filters.types,
        [type]: !filters.types[type],
      },
    })
  }

  const handleStatusToggle = (status: keyof FilterState["status"]) => {
    handleFilterChange({
      status: {
        ...filters.status,
        [status]: !filters.status[status],
      },
    })
  }

  const handlePriceRangeChange = (value: number[]) => {
    handleFilterChange({
      priceRange: [value[0], value[1]] as [number, number],
    })
  }

  const handleSpeedRangeChange = (value: number[]) => {
    handleFilterChange({
      speedRange: [value[0], value[1]] as [number, number],
    })
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      types: {
        residential: false,
        business: false,
        enterprise: false,
      },
      status: {
        active: true,
        draft: false,
        archived: false,
      },
      priceRange: [0, 500],
      speedRange: [0, 2000],
    })
    onFiltersChange?.({
      search: "",
      types: {
        residential: false,
        business: false,
        enterprise: false,
      },
      status: {
        active: true,
        draft: false,
        archived: false,
      },
      priceRange: [0, 500],
      speedRange: [0, 2000],
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.types.residential || filters.types.business || filters.types.enterprise) count++
    if (filters.status.draft || filters.status.archived || !filters.status.active) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500) count++
    if (filters.speedRange[0] > 0 || filters.speedRange[1] < 2000) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-lg p-4 mb-6 border border-gray-800 shadow-lg">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tariff plans..."
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className="pl-9 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Type
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-800 text-gray-200">
              <DropdownMenuLabel>Plan Type</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuCheckboxItem
                checked={filters.types.residential}
                onCheckedChange={() => handleTypeToggle("residential")}
                className="hover:bg-gray-800"
              >
                Residential
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.types.business}
                onCheckedChange={() => handleTypeToggle("business")}
                className="hover:bg-gray-800"
              >
                Business
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.types.enterprise}
                onCheckedChange={() => handleTypeToggle("enterprise")}
                className="hover:bg-gray-800"
              >
                Enterprise
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Status
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-800 text-gray-200">
              <DropdownMenuLabel>Plan Status</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuCheckboxItem
                checked={filters.status.active}
                onCheckedChange={() => handleStatusToggle("active")}
                className="hover:bg-gray-800"
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status.draft}
                onCheckedChange={() => handleStatusToggle("draft")}
                className="hover:bg-gray-800"
              >
                Draft
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status.archived}
                onCheckedChange={() => handleStatusToggle("archived")}
                className="hover:bg-gray-800"
              >
                Archived
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white relative"
              >
                <Filter className="h-4 w-4 mr-2" />
                Advanced
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-gray-900 border-gray-800 text-gray-200">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-sm text-gray-300">Price Range</h4>
                    <span className="text-sm text-gray-400">
                      ${filters.priceRange[0]} - ${filters.priceRange[1]}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[filters.priceRange[0], filters.priceRange[1]]}
                    min={0}
                    max={500}
                    step={10}
                    onValueChange={handlePriceRangeChange}
                    className="[&>span]:bg-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-sm text-gray-300">Speed Range (Mbps)</h4>
                    <span className="text-sm text-gray-400">
                      {filters.speedRange[0]} - {filters.speedRange[1]}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[filters.speedRange[0], filters.speedRange[1]]}
                    min={0}
                    max={2000}
                    step={50}
                    onValueChange={handleSpeedRangeChange}
                    className="[&>span]:bg-blue-500"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-400 border-gray-700 hover:bg-gray-800 hover:text-white"
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsFilterOpen(false)}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {filters.search && (
            <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700">
              Search: {filters.search}
              <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleFilterChange({ search: "" })} />
            </Badge>
          )}

          {filters.types.residential && (
            <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700">
              Residential
              <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleTypeToggle("residential")} />
            </Badge>
          )}

          {filters.types.business && (
            <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700">
              Business
              <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleTypeToggle("business")} />
            </Badge>
          )}

          {filters.types.enterprise && (
            <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700">
              Enterprise
              <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleTypeToggle("enterprise")} />
            </Badge>
          )}

          {!filters.status.active && filters.status.draft && filters.status.archived && (
            <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700">
              Status: Draft, Archived
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() =>
                  handleFilterChange({
                    status: { active: true, draft: false, archived: false },
                  })
                }
              />
            </Badge>
          )}

          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 500) && (
            <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700">
              Price: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleFilterChange({ priceRange: [0, 500] })} />
            </Badge>
          )}

          {(filters.speedRange[0] > 0 || filters.speedRange[1] < 2000) && (
            <Badge variant="secondary" className="bg-gray-800 text-gray-300 hover:bg-gray-700">
              Speed: {filters.speedRange[0]} - {filters.speedRange[1]} Mbps
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange({ speedRange: [0, 2000] })}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-400 hover:text-white hover:bg-transparent px-2 h-6 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
