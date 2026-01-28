// components/fiber/splitter-list.tsx
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Link, Wifi } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useConfirmToast } from "@/hooks/use-confirm-toast"
import type { Splitter } from "@/types"

interface SplitterListProps {
  splitters: Splitter[]
  loading: boolean
  onEdit: (splitter: Splitter) => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

export function SplitterList({ splitters, loading, onEdit, onDelete, onRefresh }: SplitterListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { confirm, ConfirmDialog } = useConfirmToast()

  const filteredSplitters = splitters.filter(
    (splitter) =>
      splitter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      splitter.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      splitter.type.includes(searchQuery) ||
      splitter.connectedOltName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: Splitter['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'inactive': return 'bg-gray-500/20 text-gray-400'
      case 'damaged': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getTypeColor = (type: Splitter['type']) => {
    switch (type) {
      case '1x4': return 'bg-blue-500/20 text-blue-400'
      case '1x8': return 'bg-purple-500/20 text-purple-400'
      case '1x16': return 'bg-indigo-500/20 text-indigo-400'
      case '1x32': return 'bg-pink-500/20 text-pink-400'
      case '1x64': return 'bg-rose-500/20 text-rose-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog />

      <Card className="relative overflow-hidden border-none">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-700" />
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-purple-700" />
        <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-purple-700" />

        <div
          className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />

        <CardContent className="p-4 relative z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search splitters by name, location, type or OLT..."
              className="pl-10 border-0 focus:ring-0 focus:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-700" />
      </Card>

      {loading ? (
        <div className="space-y-4">
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
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Connected OLT</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSplitters.map((splitter, index) => (
                <motion.tr
                  key={splitter.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-violet-500" />
                      {splitter.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(splitter.type)}>
                      {splitter.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {splitter.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-blue-500" />
                      {splitter.connectedOltName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {splitter.usedCapacity}/{splitter.totalCapacity} ports
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full ${
                            (splitter.usedCapacity / splitter.totalCapacity) > 0.8 ? 'bg-red-500' : 
                            (splitter.usedCapacity / splitter.totalCapacity) > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(splitter.usedCapacity / splitter.totalCapacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(splitter.status)}>
                      {splitter.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(splitter)}
                        className="h-8 w-8 p-0"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(splitter.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
              {filteredSplitters.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchQuery ? "No splitters found matching your search" : "No splitters found. Add your first splitter."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}