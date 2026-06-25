"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiRequest } from "@/lib/api"

type RadiusPool = {
  id: string
  name: string
  value: string
  description: string
  type: string
  isActive: boolean
}

const EMPTY_POOL = { name: "", value: "", description: "", type: "ipv4", isActive: true }

export function RadiusPoolsSettings() {
  const [pools, setPools] = useState<RadiusPool[]>([])
  const [form, setForm] = useState(EMPTY_POOL)
  const [loading, setLoading] = useState(false)

  const loadPools = async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: RadiusPool[] }>("/settings/radius-pools")
      setPools(Array.isArray(response?.data) ? response.data : [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load RADIUS pools")
    }
  }

  useEffect(() => {
    loadPools()
  }, [])

  const savePool = async () => {
    const value = form.value.trim()
    if (!value) {
      toast.error("Pool value is required")
      return
    }

    try {
      setLoading(true)
      await apiRequest("/settings/radius-pools", {
        method: "POST",
        body: JSON.stringify({ ...form, name: form.name.trim() || value, value }),
      })
      toast.success("RADIUS pool saved")
      setForm(EMPTY_POOL)
      await loadPools()
    } catch (error: any) {
      toast.error(error.message || "Failed to save RADIUS pool")
    } finally {
      setLoading(false)
    }
  }

  const deletePool = async (value: string) => {
    try {
      await apiRequest(`/settings/radius-pools/${encodeURIComponent(value)}`, { method: "DELETE" })
      toast.success("RADIUS pool deleted")
      await loadPools()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete RADIUS pool")
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.5fr_auto] md:items-end">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Main IPv4 Pool" />
        </div>
        <div className="space-y-2">
          <Label>Pool Value</Label>
          <Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="pool6" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Used for 100 Mbps plans" />
        </div>
        <Button onClick={savePool} disabled={loading}>
          <Plus className="mr-2 h-4 w-4" /> Save Pool
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Value Used In Radius</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No pools created yet.</TableCell>
              </TableRow>
            ) : pools.map((pool) => (
              <TableRow key={pool.value}>
                <TableCell className="font-medium">{pool.name}</TableCell>
                <TableCell className="font-mono text-sm">{pool.value}</TableCell>
                <TableCell className="text-muted-foreground">{pool.description || "-"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePool(pool.value)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
