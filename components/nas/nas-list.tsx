"use client"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Server, Edit, Trash2, Check, AlertTriangle, Ban, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { CardContainer } from "@/components/ui/card-container"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useConfirmToast } from "@/hooks/use-confirm-toast"

export interface Nas {
  id: number
  nasname: string
  shortname: string
  type: string
  ports?: string | null
  secret: string
  server?: string | null
  community?: string | null
  description?: string | null
  isActive: boolean
  isDeleted: boolean
  isDefault: boolean
  ispId?: number | null
  branchId?: number | null
  createdAt: string
  updatedAt: string
}

export function NasList() {
  const [selectedNas, setSelectedNas] = useState<string[]>([])
  const [nasList, setNasList] = useState<Nas[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { confirm, ConfirmDialog } = useConfirmToast()

  const fetchNas = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await apiRequest<Nas[]>('/nas')
      setNasList(data || [])
    } catch (error: any) {
      console.error("Error fetching NAS:", error)
      setError(error.message || "Failed to fetch NAS devices")
      toast.error("Failed to load NAS devices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNas()
  }, [])

  const handleResync = async () => {
    try {
      setSyncing(true)
      const toastId = toast.loading("Syncing with Radius server...")

      const response = await apiRequest<{ message: string, stats: any }>('/nas/resync')

      toast.success(
        `Sync complete! Pull: ${response.stats?.syncedFromRadiusToLocal || 0}, Push: ${response.stats?.syncedFromLocalToRadius || 0}`,
        { id: toastId }
      )
      fetchNas()
    } catch (error: any) {
      setSyncing(false)
      toast.error(error.message || "Failed to sync NAS with radius server")
    } finally {
      setSyncing(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedNas.length === nasList.length) {
      setSelectedNas([])
    } else {
      setSelectedNas(nasList.map((nas) => nas.id.toString()))
    }
  }

  const toggleSelectNas = (id: string) => {
    if (selectedNas.includes(id)) {
      setSelectedNas(selectedNas.filter((nasId) => nasId !== id))
    } else {
      setSelectedNas([...selectedNas, id])
    }
  }

  const handleEditNas = (nasId: string) => {
    router.push(`/nas/${nasId}`)
  }

  const handleDeleteNas = async (nasId: string) => {
    const confirmed = await confirm({
      title: "Delete NAS",
      message: "Are you sure you want to delete this NAS? This action cannot be undone.",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    })

    if (!confirmed) return

    try {
      toast.loading("Deleting NAS...", { id: `delete-${nasId}` })
      await apiRequest(`/nas/${nasId}`, { method: 'DELETE' })

      toast.success("NAS deleted successfully", { id: `delete-${nasId}` })
      setNasList(nasList.filter(n => n.id.toString() !== nasId))
      setSelectedNas(selectedNas.filter(id => id !== nasId))
    } catch (error: any) {
      toast.error(error.message || "Failed to delete NAS", { id: `delete-${nasId}` })
    }
  }

  if (loading) {
    return (
      <CardContainer title="NAS Devices" description="Network Access Servers connected to Radius">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CardContainer>
    )
  }

  if (error) {
    return (
      <CardContainer title="NAS Devices" description="Network Access Servers connected to Radius">
        <div className="flex flex-col items-center py-12 gap-2">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchNas()}>
            Retry
          </Button>
        </div>
      </CardContainer>
    )
  }

  return (
    <>
    <ConfirmDialog />
    <CardContainer
      title="NAS Devices"
      description="Network Access Servers connected to Radius"
      action={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResync}
            disabled={syncing}
          >
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Resync with Radius
          </Button>
        </div>
      }
    >
      <div className="rounded-md border mt-2">
        <div className="relative w-full overflow-auto">
          {nasList.length === 0 ? (
            <div className="text-center py-12">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No NAS devices found</p>
              <Button variant="outline" size="sm" onClick={() => router.push('/nas/new')} className="mt-4">
                Add New NAS
              </Button>
            </div>
          ) : (
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium w-12">
                    <Checkbox
                      checked={selectedNas.length === nasList.length && nasList.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium">NAS Name (IP)</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Shortname</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Tags</th>
                  <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {nasList.map((nas) => {
                  const nasId = nas.id.toString()

                  return (
                    <tr
                      key={nasId}
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleEditNas(nasId)}
                    >
                      <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedNas.includes(nasId)}
                          onCheckedChange={() => toggleSelectNas(nasId)}
                          aria-label={`Select ${nas.shortname}`}
                        />
                      </td>
                      <td className="p-4 align-middle font-mono font-medium">
                        {nas.nasname}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="font-medium">{nas.shortname}</div>
                        <div className="text-xs text-muted-foreground">{nas.description || 'No description'}</div>
                      </td>
                      <td className="p-4 align-middle capitalize">
                        {nas.type}
                      </td>
                      <td className="p-4 align-middle">
                        {nas.isActive ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {nas.isDefault && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                            Default
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditNas(nasId)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit NAS
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteNas(nasId)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </CardContainer>
    </>
  )
}
