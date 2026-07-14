"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Mock data for OLT ports
const mockPorts = {
  "olt-001": {
    name: "Huawei MA5800-X7",
    cards: [
      {
        id: "card-1",
        name: "Card 1",
        ports: Array(16)
          .fill(null)
          .map((_, i) => ({
            id: `port-${i + 1}`,
            number: i + 1,
            type: "PON",
            status: i < 12 ? "active" : i === 12 ? "warning" : i === 13 ? "error" : "inactive",
            onts: i < 12 ? Math.floor(Math.random() * 32) + 16 : 0,
            maxOnts: 64,
          })),
      },
      {
        id: "card-2",
        name: "Card 2",
        ports: Array(16)
          .fill(null)
          .map((_, i) => ({
            id: `port-${i + 17}`,
            number: i + 17,
            type: "PON",
            status: i < 10 ? "active" : "inactive",
            onts: i < 10 ? Math.floor(Math.random() * 32) + 16 : 0,
            maxOnts: 64,
          })),
      },
    ],
  },
  "olt-002": {
    name: "ZTE C320",
    cards: [
      {
        id: "card-1",
        name: "Card 1",
        ports: Array(8)
          .fill(null)
          .map((_, i) => ({
            id: `port-${i + 1}`,
            number: i + 1,
            type: "PON",
            status: i < 7 ? "active" : "inactive",
            onts: i < 7 ? Math.floor(Math.random() * 32) + 16 : 0,
            maxOnts: 64,
          })),
      },
    ],
  },
}

export function OLTPortsVisualization() {
  const [selectedOLT, setSelectedOLT] = useState("olt-001")
  const [viewMode, setViewMode] = useState("grid")

  const olt = mockPorts[selectedOLT as keyof typeof mockPorts]
  const gradientColor = "#10b981" // Emerald color for consistent styling

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-64">
          <Select value={selectedOLT} onValueChange={setSelectedOLT}>
            <SelectTrigger className="border-0 focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Select OLT" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="olt-001">Huawei MA5800-X7</SelectItem>
              <SelectItem value="olt-002">ZTE C320</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={viewMode} onValueChange={setViewMode} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="relative overflow-hidden border-none">
        {/* Top gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-700" />

        {/* Left gradient */}
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-700" />

        {/* Right gradient */}
        <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-700" />

        {/* Top-left corner gradient */}
        <div
          className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
          }}
        />

        {/* Bottom-right corner gradient */}
        <div
          className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`,
          }}
        />

        <CardHeader className="relative z-10">
          <CardTitle>{olt.name} - Port Status</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          {viewMode === "grid" ? (
            <div className="space-y-8">
              {olt.cards.map((card) => (
                <div key={card.id} className="space-y-4">
                  <h3 className="text-lg font-medium">{card.name}</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-8 lg:grid-cols-16 gap-3">
                    {card.ports.map((port, index) => (
                      <TooltipProvider key={port.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2, delay: index * 0.03 }}
                              className="relative"
                            >
                              <div
                                className={`
                                  aspect-square rounded-md flex items-center justify-center text-sm font-medium
                                  ${
                                    port.status === "active"
                                      ? "bg-gradient-to-br from-emerald-500/20 to-teal-700/20"
                                      : port.status === "warning"
                                        ? "bg-gradient-to-br from-amber-500/20 to-orange-700/20"
                                        : port.status === "error"
                                          ? "bg-gradient-to-br from-red-500/20 to-rose-700/20"
                                          : "bg-gradient-to-br from-slate-500/10 to-slate-700/10"
                                  }
                                `}
                              >
                                {port.number}
                                {port.status === "active" && (
                                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500"></div>
                                )}
                                {port.status === "warning" && (
                                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500"></div>
                                )}
                                {port.status === "error" && (
                                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></div>
                                )}
                              </div>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1 p-1">
                              <p className="font-medium">Port {port.number}</p>
                              <p className="text-xs">Type: {port.type}</p>
                              <p className="text-xs">
                                ONTs: {port.onts}/{port.maxOnts}
                              </p>
                              <p className="text-xs">
                                Status:
                                <Badge
                                  className={`ml-1 ${
                                    port.status === "active"
                                      ? "bg-emerald-500/20 text-emerald-400 border-0"
                                      : port.status === "warning"
                                        ? "bg-amber-500/20 text-amber-400 border-0"
                                        : port.status === "error"
                                          ? "bg-red-500/20 text-red-400 border-0"
                                          : "bg-slate-500/20 text-slate-400 border-0"
                                  }`}
                                >
                                  {port.status}
                                </Badge>
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {olt.cards.map((card) => (
                <div key={card.id} className="space-y-4">
                  <h3 className="text-lg font-medium">{card.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {card.ports.map((port) => (
                      <motion.div
                        key={port.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`
                          p-4 rounded-md relative overflow-hidden
                          ${
                            port.status === "active"
                              ? "bg-emerald-500/5"
                              : port.status === "warning"
                                ? "bg-amber-500/5"
                                : port.status === "error"
                                  ? "bg-red-500/5"
                                  : "bg-slate-500/5"
                          }
                        `}
                      >
                        {/* Port card mini gradients */}
                        <div
                          className={`absolute top-0 left-0 right-0 h-0.5 ${
                            port.status === "active"
                              ? "bg-emerald-500"
                              : port.status === "warning"
                                ? "bg-amber-500"
                                : port.status === "error"
                                  ? "bg-red-500"
                                  : "bg-slate-500"
                          }`}
                        ></div>

                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Port {port.number}</h4>
                          <Badge
                            className={`
                              ${
                                port.status === "active"
                                  ? "bg-emerald-500/20 text-emerald-400 border-0"
                                  : port.status === "warning"
                                    ? "bg-amber-500/20 text-amber-400 border-0"
                                    : port.status === "error"
                                      ? "bg-red-500/20 text-red-400 border-0"
                                      : "bg-slate-500/20 text-slate-400 border-0"
                              }
                            `}
                          >
                            {port.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p>Type: {port.type}</p>
                          <p>
                            ONTs: {port.onts}/{port.maxOnts}
                          </p>
                          <div className="w-full bg-slate-700/30 rounded-full h-1.5 mt-2">
                            <div
                              className={`h-1.5 rounded-full ${
                                port.onts / port.maxOnts > 0.8 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${(port.onts / port.maxOnts) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-700" />
      </Card>
    </div>
  )
}
