"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, MoreVertical, Code } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { VirtualHostForm } from "./virtual-host-form"
import { toast } from "@/hooks/use-toast"

// Sample data for virtual hosts
const initialVirtualHosts = [
  {
    id: "1",
    name: "PowerRx",
    description: "Optical interface receive power",
    parameter: "Device.Optical.Interface.1.RxPower",
    category: "Optical",
    lastUsed: "2023-10-15T14:30:00",
    status: "active",
  },
  {
    id: "2",
    name: "PowerTx",
    description: "Optical interface transmit power",
    parameter: "Device.Optical.Interface.1.TxPower",
    category: "Optical",
    lastUsed: "2023-10-14T09:15:00",
    status: "active",
  },
  {
    id: "3",
    name: "WifiSSID",
    description: "WiFi SSID name",
    parameter: "Device.WiFi.SSID.1.SSID",
    category: "WiFi",
    lastUsed: "2023-10-10T11:45:00",
    status: "active",
  },
  {
    id: "4",
    name: "WifiPassword",
    description: "WiFi password",
    parameter: "Device.WiFi.AccessPoint.1.Security.KeyPassphrase",
    category: "WiFi",
    lastUsed: "2023-10-10T11:45:00",
    status: "active",
  },
  {
    id: "5",
    name: "FirmwareVersion",
    description: "Current firmware version",
    parameter: "Device.DeviceInfo.SoftwareVersion",
    category: "System",
    lastUsed: "2023-10-08T16:20:00",
    status: "active",
  },
  {
    id: "6",
    name: "SerialNumber",
    description: "Device serial number",
    parameter: "Device.DeviceInfo.SerialNumber",
    category: "System",
    lastUsed: "2023-10-05T10:30:00",
    status: "active",
  },
  {
    id: "7",
    name: "ConnectionUptime",
    description: "Connection uptime in seconds",
    parameter: "Device.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.Stats.ConnectionUpTime",
    category: "WAN",
    lastUsed: "2023-10-12T08:45:00",
    status: "active",
  },
  {
    id: "8",
    name: "DownstreamRate",
    description: "Downstream data rate",
    parameter: "Device.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.Stats.CurrentDownstreamRate",
    category: "WAN",
    lastUsed: "2023-10-12T08:45:00",
    status: "active",
  },
  {
    id: "9",
    name: "UpstreamRate",
    description: "Upstream data rate",
    parameter: "Device.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.Stats.CurrentUpstreamRate",
    category: "WAN",
    lastUsed: "2023-10-12T08:45:00",
    status: "active",
  },
  {
    id: "10",
    name: "LanIPAddress",
    description: "LAN IP address",
    parameter: "Device.LAN.IPAddress",
    category: "LAN",
    lastUsed: "2023-10-11T14:20:00",
    status: "inactive",
  },
]

export function VirtualHostsList() {
  const [virtualHosts, setVirtualHosts] = useState(initialVirtualHosts)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingHost, setEditingHost] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [hostToDelete, setHostToDelete] = useState<string | null>(null)

  const filteredHosts = virtualHosts.filter(
    (host) =>
      host.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.parameter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEdit = (host: any) => {
    setEditingHost(host)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setHostToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (hostToDelete) {
      setVirtualHosts(virtualHosts.filter((host) => host.id !== hostToDelete))
      toast({
        title: "Virtual host deleted",
        description: "The virtual host has been deleted successfully.",
      })
      setIsDeleteDialogOpen(false)
      setHostToDelete(null)
    }
  }

  const handleSaveEdit = (updatedHost: any) => {
    setVirtualHosts(virtualHosts.map((host) => (host.id === updatedHost.id ? updatedHost : host)))
    setIsEditDialogOpen(false)
    setEditingHost(null)
    toast({
      title: "Virtual host updated",
      description: "The virtual host has been updated successfully.",
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Parameter path copied to clipboard.",
    })
  }

  const executeVirtualHost = (host: any) => {
    toast({
      title: "Command executed",
      description: `Virtual host "${host.name}" command executed successfully.`,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search virtual hosts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={() => {
            setEditingHost(null)
            setIsEditDialogOpen(true)
          }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Virtual Host
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Virtual Host</TableHead>
                <TableHead>Parameter</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No virtual hosts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredHosts.map((host) => (
                  <TableRow key={host.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-slate-100 dark:bg-slate-800 p-1.5">
                          <Code className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <div className="font-medium">{host.name}</div>
                          <div className="text-xs text-muted-foreground">{host.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{host.parameter}</TableCell>
                    <TableCell>{host.category}</TableCell>
                    <TableCell>
                      <Badge variant={host.status === "active" ? "success" : "destructive"} className="capitalize">
                        {host.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(host)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyToClipboard(host.parameter)}>
                            Copy Parameter
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => executeVirtualHost(host)}>Execute</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(host.id)} className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingHost ? "Edit Virtual Host" : "Add Virtual Host"}</DialogTitle>
            <DialogDescription>
              {editingHost
                ? "Update the virtual host details below."
                : "Fill in the details to create a new virtual host."}
            </DialogDescription>
          </DialogHeader>
          <VirtualHostForm
            initialData={
              editingHost || {
                name: "",
                description: "",
                parameter: "",
                category: "Optical",
                status: "active",
              }
            }
            onSubmit={(data) => {
              if (editingHost) {
                handleSaveEdit(data)
              } else {
                const newId = (Math.max(...virtualHosts.map((host) => Number.parseInt(host.id))) + 1).toString()
                const newHost = {
                  id: newId,
                  ...data,
                  lastUsed: new Date().toISOString(),
                }
                setVirtualHosts([...virtualHosts, newHost])
                setIsEditDialogOpen(false)
                toast({
                  title: "Virtual host added",
                  description: "The virtual host has been added successfully.",
                })
              }
            }}
            onCancel={() => setIsEditDialogOpen(false)}
            isDialog
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this virtual host? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
