"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { User, FileText, Wifi, X } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type SearchResult = {
  id: string
  title: string
  description: string
  url: string
  category: string
  avatar?: string
  initials?: string
  status?: "active" | "inactive" | "pending"
}

// Mock database of search results
const searchDatabase: SearchResult[] = [
  {
    id: "CUST-001",
    title: "Alex Johnson",
    description: "Premium Plan • $89.99/mo • Active since Jan 2023",
    url: "/customers/CUST-001",
    category: "Customers",
    avatar: "/abstract-letter-aj.png",
    initials: "AJ",
    status: "active",
  },
  {
    id: "CUST-002",
    title: "Sarah Williams",
    description: "Business Plan • $129.99/mo • Active since Mar 2022",
    url: "/customers/CUST-002",
    category: "Customers",
    avatar: "/stylized-sw.png",
    initials: "SW",
    status: "active",
  },
  {
    id: "CUST-003",
    title: "Michael Brown",
    description: "Standard Plan • $59.99/mo • Active since Nov 2023",
    url: "/customers/CUST-003",
    category: "Customers",
    avatar: "/monogram-mb.png",
    initials: "MB",
    status: "active",
  },
  {
    id: "CUST-004",
    title: "Emily Davis",
    description: "Premium Plan • $89.99/mo • Active since Feb 2023",
    url: "/customers/CUST-004",
    category: "Customers",
    avatar: "/ed-initials-abstract.png",
    initials: "ED",
    status: "inactive",
  },
  {
    id: "CUST-005",
    title: "David Wilson",
    description: "Business Plan • $129.99/mo • Pending activation",
    url: "/customers/CUST-005",
    category: "Customers",
    avatar: "/abstract-dw.png",
    initials: "DW",
    status: "pending",
  },
  {
    id: "INV-2023-04",
    title: "Invoice #INV-2023-04",
    description: "Amount: $89.99 • Due: 15/05/2023 • Alex Johnson",
    url: "/finance/invoices/INV-2023-04",
    category: "Invoices",
  },
  {
    id: "INV-2023-05",
    title: "Invoice #INV-2023-05",
    description: "Amount: $129.99 • Due: 22/05/2023 • Sarah Williams",
    url: "/finance/invoices/INV-2023-05",
    category: "Invoices",
  },
  {
    id: "ONT-5678",
    title: "Router ONT-5678",
    description: "Status: Online • Uptime: 15 days • Alex Johnson",
    url: "/networking/devices/ONT-5678",
    category: "Devices",
  },
  {
    id: "ONT-5679",
    title: "Router ONT-5679",
    description: "Status: Offline • Last seen: 2 hours ago • Emily Davis",
    url: "/networking/devices/ONT-5679",
    category: "Devices",
  },
]

type SearchModalProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  initialQuery?: string
}

export function SearchModal({ open, onOpenChange, initialQuery = "" }: SearchModalProps) {
  const [query, setQuery] = useState(initialQuery || "")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"
  const inputRef = useRef<HTMLInputElement>(null)

  // Dynamic search function - triggered on keyup
  const performSearch = (searchQuery: string, category: string | null = null) => {
    if (!searchQuery.trim() && !category) {
      setResults([])
      return
    }

    // Filter results based on query and category
    let filteredResults = searchDatabase

    // Filter by category if selected
    if (category) {
      filteredResults = filteredResults.filter((result) => result.category === category)
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      filteredResults = filteredResults.filter(
        (result) =>
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.id.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setResults(filteredResults)
  }

  // Handle input change
  const handleQueryChange = (value: string) => {
    setQuery(value)
    performSearch(value, selectedCategory)
  }

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category)
    performSearch(query, category === selectedCategory ? null : category)
  }

  const handleSelect = (result: SearchResult) => {
    router.push(result.url)
    if (typeof onOpenChange === "function") {
      onOpenChange(false)
    }
  }

  const handleCloseModal = () => {
    if (typeof onOpenChange === "function") {
      onOpenChange(false)
    }
  }

  // Reset query when modal closes
  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      setSelectedCategory(null)
    } else if (initialQuery) {
      setQuery(initialQuery)
      performSearch(initialQuery)
    }

    // Focus the input when modal opens
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open, initialQuery])

  const getStatusColor = (status?: string) => {
    if (!status) return ""
    switch (status) {
      case "active":
        return "bg-green-500"
      case "inactive":
        return "bg-red-500"
      case "pending":
        return "bg-amber-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Customers":
        return <User className="h-4 w-4 text-blue-500" />
      case "Invoices":
        return <FileText className="h-4 w-4 text-amber-500" />
      case "Devices":
        return <Wifi className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent
        className="sm:max-w-[500px] p-0 border-none overflow-hidden rounded-xl"
        style={{
          background: isDarkMode
            ? "linear-gradient(to bottom, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))"
            : "linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(241, 245, 249, 0.95))",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: isDarkMode ? "0 10px 25px -5px rgba(0, 0, 0, 0.5)" : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.8)",
        }}
      >
        <Command className="rounded-lg bg-transparent">
          {/* Search input - properly centered with no duplicate icons */}
          <div className="flex items-center px-4 py-3 border-b border-border/20">
            <div className="relative w-full">
              <CommandInput
                ref={inputRef}
                placeholder="Search for customers, invoices, or devices"
                className="flex h-10 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none"
                value={query}
                onValueChange={handleQueryChange}
              />
              {query && (
                <button
                  onClick={() => handleQueryChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </button>
              )}
            </div>
          </div>

          <CommandList>
            {query.trim() === "" && results.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
                  <svg
                    className="h-8 w-8 text-muted-foreground opacity-70"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">Type to search customers, invoices, or devices</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 px-6">
                  <Button
                    variant={selectedCategory === "Customers" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleCategorySelect("Customers")}
                  >
                    Customers
                  </Button>
                  <Button
                    variant={selectedCategory === "Invoices" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleCategorySelect("Invoices")}
                  >
                    Invoices
                  </Button>
                  <Button
                    variant={selectedCategory === "Devices" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleCategorySelect("Devices")}
                  >
                    Devices
                  </Button>
                </div>
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty>
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
                    <svg
                      className="h-8 w-8 text-muted-foreground opacity-50"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
                </div>
              </CommandEmpty>
            ) : (
              <>
                {["Customers", "Invoices", "Devices"].map((category) => {
                  const categoryResults = results.filter((result) => result.category === category)
                  if (categoryResults.length === 0) return null

                  return (
                    <CommandGroup key={category} heading={category} className="py-2">
                      {categoryResults.map((result) => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleSelect(result)}
                          className="mx-2 my-1 rounded-md cursor-pointer transition-all duration-200 hover:bg-primary/10"
                        >
                          <div className="flex items-center gap-2 w-full py-1">
                            {result.category === "Customers" && result.avatar ? (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={result.avatar || "/placeholder.svg"} alt={result.title} />
                                <AvatarFallback>{result.initials}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                {getCategoryIcon(result.category)}
                              </div>
                            )}
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">{result.title}</p>
                                {result.status && (
                                  <span className={`h-2 w-2 rounded-full ${getStatusColor(result.status)}`}></span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
                })}
              </>
            )}
          </CommandList>

          <div className="p-2 border-t border-border/20 flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">⌘K</kbd>
              <span>to search</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">↵</kbd>
              <span>to select</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
