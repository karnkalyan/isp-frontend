"use client"

import { useState } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, MoreVertical, Router } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function TR069DeviceList() {
  const [searchQuery, setSearchQuery] = useState("")

  const devices = [
    {
      id: "tl-wr940n",
      name: "TL-WR940N",
      serialNumber: "F81D0F123456",
      ipAddress: "192.168.1.1",
      status: "online",
      signal: 85,
      lastContact: "4/10/2023 8:32:45 AM",
      uptime: "24d 12h 30m",
    },
    {
      id: "dir-615",
      name: "DIR-615",
      serialNumber: "ABCD1234FGH",
      ipAddress: "192.168.1.2",
      status: "warning",
      signal: 65,
      lastContact: "4/10/2023 7:15:22 AM",
      uptime: "12d 4h 15m",
    },
    {
      id: "e1200",
      name: "E1200",
      serialNumber: "ZX8765123FU",
      ipAddress: "192.168.1.3",
      status: "offline",
      signal: 0,
      lastContact: "4/9/2023 10:24:10 PM",
      uptime: "0d 0h 0m",
    },
    {
      id: "rt-ac3200",
      name: "RT-AC3200",
      serialNumber: "RT3200ABC20P",
      ipAddress: "192.168.1.4",
      status: "online",
      signal: 90,
      lastContact: "4/10/2023 8:10:35 AM",
      uptime: "45d 9h 22m",
    },
    {
      id: "r7000",
      name: "R7000",
      serialNumber: "NX1234567B9",
      ipAddress: "192.168.1.5",
      status: "online",
      signal: 78,
      lastContact: "4/10/2023 8:15:17 AM",
      uptime: "30d 18h 5m",
    },
  ]

  const filteredDevices = devices.filter(
    (device) =>
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.ipAddress.includes(searchQuery),
  )

  return (
    <CardContainer
      title="Device Status"
      description="View and manage all customer premises equipment"
      gradientColor="#6366f1"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-slate-100 dark:bg-slate-800 p-1.5">
                        <Router className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <Link href={`/tr069/device/${device.id}`} className="font-medium hover:underline">
                          {device.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{device.serialNumber}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{device.ipAddress}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        device.status === "online" ? "success" : device.status === "warning" ? "warning" : "destructive"
                      }
                      className="capitalize"
                    >
                      {device.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={device.signal}
                        className="w-16 h-2"
                        indicatorClassName={
                          device.signal > 70 ? "bg-green-500" : device.signal > 30 ? "bg-amber-500" : "bg-red-500"
                        }
                      />
                      <span className="text-xs">{device.signal}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{device.lastContact}</TableCell>
                  <TableCell>{device.uptime}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Link href={`/tr069/device/${device.id}`} className="w-full">
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Reboot Device</DropdownMenuItem>
                        <DropdownMenuItem>Update Firmware</DropdownMenuItem>
                        <DropdownMenuItem>Run Diagnostics</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </CardContainer>
  )
}
