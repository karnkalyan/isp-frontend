"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Command } from "cmdk"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Search, X, User, FileText, Laptop, ArrowRight } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type SearchCategory = "customers" | "invoices" | "devices" | "all"

type SearchResult = {
  id: string
  title: string
  subtitle?: string
  type: SearchCategory
  icon?: React.ReactNode
  url: string
  avatar?: string
  initials?: string
  status?: "active" | "inactive" | "pending"
}

// Mock data for search results
const mockSearchResults: SearchResult[] = [
  {
    id: "cust-1",
    title: "Alex Johnson",
    subtitle: "alex.johnson@example.com",
    type: "customers",
    icon: <User className="h-4 w-4" />,
    url: "/customers/alex-johnson",
    avatar: "/abstract-letter-aj.png",
    initials: "AJ",
    status: "active",
  },
  {
    id: "cust-2",
    title: "Sarah Williams",
    subtitle: "sarah.williams@example.com",
    type: "customers",
    icon: <User className="h-4 w-4" />,
    url: "/customers/sarah-williams",
    avatar: "/stylized-sw.png",
    initials: "SW",
    status: "active",
  },
  {
    id: "cust-3",
    title: "Michael Brown",
    subtitle: "michael.brown@example.com",
    type: "customers",
    icon: <User className="h-4 w-4" />,
    url: "/customers/michael-brown",
    avatar: "/monogram-mb.png",
    initials: "MB",
    status: "inactive",
  },
  {
    id: "inv-1",
    title: "Invoice #INV-2023-001",
    subtitle: "Alex Johnson - $89.99",
    type: "invoices",
    icon: <FileText className="h-4 w-4" />,
    url: "/invoices/INV-2023-001",
    status: "active",
  },
  {
    id: "inv-2",
    title: "Invoice #INV-2023-002",
    subtitle: "Sarah Williams - $129.99",
    type: "invoices",
    icon: <FileText className="h-4 w-4" />,
    url: "/invoices/INV-2023-002",
    status: "pending",
  },
  {
    id: "dev-1",
    title: "Router RT-9087",
    subtitle: "Alex Johnson - Online",
    type: "devices",
    icon: <Laptop className="h-4 w-4" />,
    url: "/devices/RT-9087",
    status: "active",
  },
  {
    id: "dev-2",
    title: "Modem MD-5432",
    subtitle: "Sarah Williams - Offline",
    type: "devices",
    icon: <Laptop className="h-4 w-4" />,
    url: "/devices/MD-5432",
    status: "inactive",
  },
]

interface SearchModalProps {
  className?: string
}

export function SearchModalEnhanced({ className }: SearchModalProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("all")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  // Filter results based on query and active category
  useEffect(() => {
    if (query.length === 0) {
      setResults([])
      return
    }

    setLoading(true)

    // Simulate API call delay
    const timer = setTimeout(() => {
      const filtered = mockSearchResults.filter((result) => {
        const matchesQuery =
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          (result.subtitle && result.subtitle.toLowerCase().includes(query.toLowerCase()))

        const matchesCategory = activeCategory === "all" || result.type === activeCategory

        return matchesQuery && matchesCategory
      })

      setResults(filtered)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, activeCategory])

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    } else {
      setQuery("")
      setResults([])
      setActiveCategory("all")
    }
  }, [open])

  const getStatusColor = (status?: string) => {
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

  return (
    <>
      <Button
        variant="outline"
        className={cn("relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2", className)}
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" aria-hidden="true" />
        <span className="hidden xl:inline-flex">Search...</span>
        <span className="sr-only">Search</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-[550px] p-0 gap-0"
          style={{
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(13, 17, 31, 0.95), rgba(20, 24, 44, 0.95))"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 245, 255, 0.95))",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: isDarkMode ? "0 8px 32px rgba(0, 0, 0, 0.4)" : "0 8px 32px rgba(0, 0, 0, 0.1)",
            border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(255, 255, 255, 0.5)",
          }}
        >
          <Command className="bg-transparent" loop>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Search for customers, invoices, or devices..."
              />
              {query && (
                <Button variant="ghost" className="h-6 w-6 p-0 mr-1" onClick={() => setQuery("")}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Category filters */}
            {query && (
              <div className="flex items-center gap-2 px-3 py-2 border-b">
                <Button
                  variant={activeCategory === "all" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setActiveCategory("all")}
                >
                  All
                </Button>
                <Button
                  variant={activeCategory === "customers" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setActiveCategory("customers")}
                >
                  Customers
                </Button>
                <Button
                  variant={activeCategory === "invoices" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setActiveCategory("invoices")}
                >
                  Invoices
                </Button>
                <Button
                  variant={activeCategory === "devices" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setActiveCategory("devices")}
                >
                  Devices
                </Button>
              </div>
            )}

            <Command.List className="max-h-[300px] overflow-auto py-2">
              {query.length > 0 && (
                <>
                  {loading && (
                    <div className="p-4 text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                      <p className="mt-2 text-sm text-muted-foreground">Searching...</p>
                    </div>
                  )}

                  {!loading && results.length === 0 && (
                    <div className="py-6 text-center">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Search className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="mt-2 text-sm font-medium">No results found</p>
                      <p className="text-xs text-muted-foreground mt-1">Try searching for something else</p>
                    </div>
                  )}

                  {!loading && results.length > 0 && (
                    <Command.Group>
                      {results.map((result) => (
                        <Command.Item
                          key={result.id}
                          value={result.title}
                          className="px-4 py-2 cursor-pointer"
                          onSelect={() => {
                            console.log(`Selected: ${result.title}`)
                            setOpen(false)
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {result.type === "customers" ? (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={result.avatar || "/placeholder.svg"} alt={result.title} />
                                <AvatarFallback>{result.initials}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                {result.icon}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate">{result.title}</p>
                                <div className="flex items-center gap-2">
                                  {result.status && (
                                    <span className={`h-2 w-2 rounded-full ${getStatusColor(result.status)}`} />
                                  )}
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                </div>
                              </div>
                              {result.subtitle && (
                                <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                              )}
                            </div>
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}
                </>
              )}

              {query.length === 0 && (
                <div className="py-6 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-sm font-medium">Type to search customers, invoices, or devices</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setQuery("customer")
                        setActiveCategory("customers")
                      }}
                    >
                      Customers
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setQuery("invoice")
                        setActiveCategory("invoices")
                      }}
                    >
                      Invoices
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setQuery("device")
                        setActiveCategory("devices")
                      }}
                    >
                      Devices
                    </Button>
                  </div>
                </div>
              )}
            </Command.List>
            <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
              <div>
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">⌘K</kbd>
                <span className="ml-1">to search</span>
              </div>
              <div>
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">↵</kbd>
                <span className="ml-1">to select</span>
              </div>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
