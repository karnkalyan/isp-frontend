"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, X, ArrowRight, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apiRequest } from "@/lib/api"
import { cn } from "@/lib/utils"

export function LeadSearchHero() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const response = await apiRequest(`/lead?search=${encodeURIComponent(query)}`)
        let dataArray = []
        if (response && response.data && Array.isArray(response.data)) {
          dataArray = response.data
        } else if (Array.isArray(response)) {
          dataArray = response
        }
        setResults(dataArray.slice(0, 6)) // Limit to top 6 results
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (lead: any) => {
    router.push(`/leads/view/${lead.id}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-green-500/10 rounded-full blur-[80px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 max-w-2xl"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
          Lead Intelligence Search
        </h1>
        <p className="text-muted-foreground text-lg">
          Fast, intelligent search for your ISP leads. Find, track, and convert in seconds.
        </p>
      </motion.div>

      <div className="w-full max-w-2xl relative">
        <div 
          className={cn(
            "relative group transition-all duration-300 transform rounded-2xl p-1",
            isFocused ? "bg-gradient-to-r from-primary to-blue-600 shadow-2xl scale-[1.02]" : "bg-border/20 shadow-lg"
          )}
        >
          <div className="relative bg-background rounded-xl overflow-hidden">
            <Search className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 transition-colors duration-200",
              isFocused ? "text-primary" : "text-muted-foreground"
            )} />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search leads by name, email, or phone number..."
              className="h-16 pl-14 pr-16 text-lg border-none focus-visible:ring-0 rounded-none bg-transparent"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-muted"
                onClick={() => setQuery("")}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
            {loading && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {(results.length > 0 || (query && !loading && results.length === 0)) && isFocused && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-4 z-50 pt-2"
            >
              <Card className="shadow-2xl border-primary/20 overflow-hidden backdrop-blur-xl bg-background/95">
                <div className="max-h-[400px] overflow-y-auto">
                  {results.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {results.map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary/10 cursor-pointer transition-colors group"
                          onClick={() => handleSelect(lead)}
                        >
                          <Avatar className="h-10 w-10 border border-primary/10">
                            <AvatarFallback className="bg-primary/5 text-primary">
                              {lead.firstName[0]}{lead.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                              {lead.firstName} {lead.lastName}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {lead.phoneNumber || lead.email || "No contact info"}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-medium uppercase",
                              lead.status === 'qualified' ? "bg-green-500/10 text-green-600" :
                              lead.status === 'unqualified' ? "bg-red-500/10 text-red-600" :
                              "bg-blue-500/10 text-blue-600"
                            )}>
                              {lead.status}
                            </span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-4">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">No leads found for "{query}"</p>
                      <p className="text-xs text-muted-foreground mt-1 text-center w-full">Try a different name or phone number</p>
                    </div>
                  )}
                </div>
                {results.length > 0 && (
                  <div className="p-3 bg-muted/30 border-t flex justify-center">
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => router.push(`/leads?search=${encodeURIComponent(query)}`)}
                    >
                      View all results
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-12 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground"
      >
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50">
          <kbd className="px-1 text-[10px] border rounded bg-background">ESC</kbd> to clear
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50">
          <kbd className="px-1 text-[10px] border rounded bg-background">ENT</kbd> to select
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50">
          <Users className="h-3.5 w-3.5" /> Lead Specific
        </span>
      </motion.div>
    </div>
  )
}
