"use client"

import { useEffect, useMemo, useState } from "react"
import { WifiOff } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { CardContainer } from "@/components/ui/card-container"
import { apiRequest } from "@/lib/api"
import { useConfirmToast } from "@/hooks/use-confirm-toast"

type BranchItem = {
  id: number
  name: string
  code?: string
  parentId?: number | null
  parent?: { id: number; name: string } | null
}

type RadiusPool = {
  name: string
  value: string
  description?: string
  isActive?: boolean
}

function asList<T>(value: T[] | { data?: T[] } | null | undefined): T[] {
  if (Array.isArray(value)) return value
  return Array.isArray(value?.data) ? value.data : []
}

export function DisconnectSessionManagement() {
  const [mode, setMode] = useState<"branch" | "subBranch" | "pool">("branch")
  const [branches, setBranches] = useState<BranchItem[]>([])
  const [pools, setPools] = useState<RadiusPool[]>([])
  const [branchId, setBranchId] = useState("")
  const [subBranchId, setSubBranchId] = useState("")
  const [poolValue, setPoolValue] = useState("")
  const [loading, setLoading] = useState(false)
  const { confirm, ConfirmDialog } = useConfirmToast()

  useEffect(() => {
    async function loadData() {
      const [branchData, poolData] = await Promise.all([
        apiRequest<BranchItem[] | { data?: BranchItem[] }>("/branches").catch(() => []),
        apiRequest<{ success: boolean; data: RadiusPool[] }>("/settings/radius-pools").catch(() => ({ success: false, data: [] })),
      ])
      setBranches(asList(branchData))
      setPools(Array.isArray(poolData?.data) ? poolData.data.filter(pool => pool.isActive !== false) : [])
    }
    loadData()
  }, [])

  const branchOptions: Option[] = branches
    .filter(branch => !branch.parentId && !branch.parent?.id)
    .map(branch => ({ value: String(branch.id), label: `${branch.name}${branch.code ? ` (${branch.code})` : ""}` }))

  const subBranchOptions: Option[] = branches
    .filter(branch => branch.parentId || branch.parent?.id)
    .map(branch => ({ value: String(branch.id), label: `${branch.name}${branch.code ? ` (${branch.code})` : ""}` }))

  const poolOptions: Option[] = pools.map(pool => ({
    value: pool.value,
    label: `${pool.name || pool.value} (${pool.value})`,
    description: pool.description,
  }))

  const selectedLabel = useMemo(() => {
    if (mode === "pool") return poolValue || "selected pool"
    const id = mode === "branch" ? branchId : subBranchId
    return branches.find(branch => String(branch.id) === id)?.name || "selected branch"
  }, [mode, poolValue, branchId, subBranchId, branches])

  const disconnect = async () => {
    if (mode === "branch" && !branchId) return toast.error("Select a branch")
    if (mode === "subBranch" && !subBranchId) return toast.error("Select a sub branch")
    if (mode === "pool" && !poolValue) return toast.error("Select a pool")

    const ok = await confirm({
      title: "Disconnect Sessions",
      message: `Disconnect all matching active RADIUS sessions for ${selectedLabel}?`,
      type: "danger",
      confirmText: "Disconnect",
      cancelText: "Cancel",
    })
    if (!ok) return

    try {
      setLoading(true)
      const endpoint = mode === "pool"
        ? `/customer/disconnect/pool/${encodeURIComponent(poolValue)}/all`
        : `/customer/disconnect/branch/${mode === "branch" ? branchId : subBranchId}/all`
      const body = mode === "pool"
        ? { poolValue, branchIds: branchId ? [Number(branchId)] : [], subBranchIds: subBranchId ? [Number(subBranchId)] : [] }
        : { includeSubBranches: mode === "branch" }
      const response = await apiRequest<any>(endpoint, { method: "POST", body: JSON.stringify(body) })
      const disconnected = response?.disconnected?.length || 0
      const failed = response?.failed?.length || 0
      if (failed > 0) toast.error(response?.message || `Disconnected ${disconnected}; ${failed} failed`)
      else toast.success(response?.message || `Disconnected sessions for ${disconnected} users`)
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect sessions")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog />
      <CardContainer title="Disconnect Session Filters" description="Disconnect RADIUS sessions branch-wise, sub-branch-wise, or pool-wise.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Disconnect Mode</Label>
            <SearchableSelect
              options={[
                { value: "branch", label: "Branch wise" },
                { value: "subBranch", label: "Sub branch wise" },
                { value: "pool", label: "Pool wise" },
              ]}
              value={mode}
              onValueChange={(value) => setMode((Array.isArray(value) ? value[0] : value) as any)}
            />
          </div>

          {mode === "branch" && (
            <div className="space-y-2">
              <Label>Branch</Label>
              <SearchableSelect options={branchOptions} value={branchId} onValueChange={(value) => setBranchId(Array.isArray(value) ? value[0] || "" : value)} placeholder="Select branch" />
            </div>
          )}

          {mode === "subBranch" && (
            <div className="space-y-2">
              <Label>Sub Branch</Label>
              <SearchableSelect options={subBranchOptions} value={subBranchId} onValueChange={(value) => setSubBranchId(Array.isArray(value) ? value[0] || "" : value)} placeholder="Select sub branch" />
            </div>
          )}

          {mode === "pool" && (
            <>
              <div className="space-y-2">
                <Label>Pool</Label>
                <SearchableSelect options={poolOptions} value={poolValue} onValueChange={(value) => setPoolValue(Array.isArray(value) ? value[0] || "" : value)} placeholder="Select pool" />
              </div>
              <div className="space-y-2">
                <Label>Optional Branch Filter</Label>
                <SearchableSelect options={branchOptions} value={branchId} onValueChange={(value) => setBranchId(Array.isArray(value) ? value[0] || "" : value)} placeholder="All branches" />
              </div>
              <div className="space-y-2">
                <Label>Optional Sub Branch Filter</Label>
                <SearchableSelect options={subBranchOptions} value={subBranchId} onValueChange={(value) => setSubBranchId(Array.isArray(value) ? value[0] || "" : value)} placeholder="All sub branches" />
              </div>
            </>
          )}
        </div>
        <div className="mt-4">
          <Button onClick={disconnect} disabled={loading}>
            <WifiOff className="mr-2 h-4 w-4" /> {loading ? "Disconnecting..." : "Disconnect Sessions"}
          </Button>
        </div>
      </CardContainer>
    </div>
  )
}
