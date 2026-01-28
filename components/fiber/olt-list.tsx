// components/fiber/olt-list.tsx
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { OLTCard } from "@/components/fiber/olt-card"
import { Card, CardContent } from "@/components/ui/card"
import type { OLT } from "@/types"

interface OLTListProps {
  olts: OLT[]
  loading: boolean
  onEdit: (olt: OLT) => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

export function OLTList({ olts, loading, onEdit, onDelete, onRefresh }: OLTListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredOLTs = olts.filter(
    (olt) =>
      olt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      olt.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      olt.ipAddress.includes(searchQuery) ||
      olt.model.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const gradientColor = "#10b981"

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-none">
        {/* Gradient borders */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-700" />
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-700" />
        <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-700" />

        {/* Background gradients */}
        <div
          className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
          }}
        />

        <CardContent className="p-4 relative z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search OLTs by name, location, IP or model..."
              className="pl-10 border-0 focus:ring-0 focus:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-700" />
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOLTs.map((olt, index) => (
            <motion.div
              key={olt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <OLTCard 
                olt={olt} 
                onEdit={() => onEdit(olt)}
                onDelete={() => onDelete(olt.id)}
                onRefresh={onRefresh}
              />
            </motion.div>
          ))}
          {filteredOLTs.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
              {searchQuery ? "No OLTs found matching your search criteria" : "No OLTs found. Add your first OLT."}
            </div>
          )}
        </div>
      )}
    </div>
  )
}