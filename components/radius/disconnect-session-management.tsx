"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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

type PackageItem = {
  id: number
  packageName?: string
  name?: string
  packageDuration?: string
  price?: number
}

function asList<T>(value: T[] | { data?: T[] } | null | undefined): T[] {
  if (Array.isArray(value)) return value
  return Array.isArray(value?.data) ? value.data : []
}

export function DisconnectSessionManagement() {
  const [mode, setMode] = useState<"all" | "branch" | "subBranch" | "pool">("all")
  const [branches, setBranches] = useState<BranchItem[]>([])
  const [pools, setPools] = useState<RadiusPool[]>([])
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [selectedHeadOffices, setSelectedHeadOffices] = useState<number[]>([])
  const [selectedBranches, setSelectedBranches] = useState<number[]>([])
  const [selectedSubBranches, setSelectedSubBranches] = useState<number[]>([])
  const [poolValue, setPoolValue] = useState("")
  const [packageId, setPackageId] = useState("")
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(false)
  const { confirm, ConfirmDialog } = useConfirmToast()

  useEffect(() => {
    async function loadData() {
      const [branchData, poolData, packageData] = await Promise.all([
        apiRequest<BranchItem[] | { data?: BranchItem[] }>("/branch").catch(() => []),
        apiRequest<{ success: boolean; data: RadiusPool[] }>("/settings/radius-pools").catch(() => ({ success: false, data: [] })),
        apiRequest<PackageItem[] | { data?: PackageItem[] }>("/package-price").catch(() => []),
      ])
      setBranches(asList(branchData))
      setPools(Array.isArray(poolData?.data) ? poolData.data.filter(pool => pool.isActive !== false) : [])
      setPackages(asList(packageData))
    }
    loadData()
  }, [])

  const headOffices = useMemo(() => branches.filter(branch => !branch.parentId && !branch.parent?.id), [branches])
  const headOfficeIds = useMemo(() => headOffices.map(branch => Number(branch.id)), [headOffices])
  const branchNodes = useMemo(
    () => branches.filter(branch => branch.parentId && headOfficeIds.includes(Number(branch.parentId))),
    [branches, headOfficeIds]
  )
  const branchNodeIds = useMemo(() => branchNodes.map(branch => Number(branch.id)), [branchNodes])

  const childrenByParent = useMemo(() => {
    const map = new Map<number, BranchItem[]>()
    branches.forEach(branch => {
      const parentId = Number(branch.parentId || branch.parent?.id || 0)
      if (!parentId) return
      map.set(parentId, [...(map.get(parentId) || []), branch])
    })
    return map
  }, [branches])

  const getDescendantBranchIds = useCallback((parentIds: number[]) => {
    const descendants = new Set<number>()
    const stack = [...parentIds]
    while (stack.length > 0) {
      const parentId = stack.pop()
      if (!parentId) continue
      for (const child of childrenByParent.get(parentId) || []) {
        const childId = Number(child.id)
        if (!descendants.has(childId)) {
          descendants.add(childId)
          stack.push(childId)
        }
      }
    }
    return Array.from(descendants)
  }, [childrenByParent])

  const getBranchPath = useCallback((branch: BranchItem) => {
    const byId = new Map(branches.map(item => [Number(item.id), item]))
    const names = [branch.name]
    let parent = branch.parentId ? byId.get(Number(branch.parentId)) : branch.parent?.id ? byId.get(Number(branch.parent.id)) : null
    while (parent) {
      names.unshift(parent.name)
      parent = parent.parentId ? byId.get(Number(parent.parentId)) : parent.parent?.id ? byId.get(Number(parent.parent.id)) : null
    }
    return names.join(" / ")
  }, [branches])

  const headOfficeOptions: Option[] = headOffices.map(branch => ({ value: String(branch.id), label: `${branch.name}${branch.code ? ` (${branch.code})` : ""}` }))
  const branchOptions: Option[] = (selectedHeadOffices.length > 0
    ? branchNodes.filter(branch => selectedHeadOffices.includes(Number(branch.parentId)))
    : branchNodes
  ).map(branch => ({ value: String(branch.id), label: getBranchPath(branch) }))

  const subBranchNodes = useMemo(() => {
    const directBranchIds = branchOptions.map(branch => Number(branch.value))
    const seedIds = selectedBranches.length > 0 ? selectedBranches : directBranchIds.length > 0 ? directBranchIds : branchNodeIds
    const descendantIds = new Set(getDescendantBranchIds(seedIds))
    return branches.filter(branch => descendantIds.has(Number(branch.id)))
  }, [branchOptions, branchNodeIds, branches, getDescendantBranchIds, selectedBranches])

  const subBranchOptions: Option[] = subBranchNodes.map(branch => ({ value: String(branch.id), label: getBranchPath(branch) }))

  const poolOptions: Option[] = pools.map(pool => ({
    value: pool.value,
    label: `${pool.name || pool.value} (${pool.value})`,
    description: pool.description,
  }))

  const packageOptions: Option[] = packages.map(pkg => ({
    value: String(pkg.id),
    label: pkg.packageName || pkg.name || `Package ${pkg.id}`,
    description: [pkg.packageDuration, typeof pkg.price === "number" ? `Rs. ${pkg.price}` : ""].filter(Boolean).join(" - "),
  }))

  const selectedLabel = useMemo(() => {
    if (mode === "all") return "selected customer filters"
    if (mode === "pool") return poolValue || "selected pool"
    return mode === "branch" ? "selected branch filters" : "selected sub-branch filters"
  }, [mode, poolValue])

  const selectedScopeIds = useMemo(() => {
    const selected = new Set<number>([
      ...selectedHeadOffices,
      ...selectedBranches,
      ...selectedSubBranches,
    ])
    getDescendantBranchIds(Array.from(selected)).forEach(id => selected.add(id))
    return Array.from(selected)
  }, [getDescendantBranchIds, selectedBranches, selectedHeadOffices, selectedSubBranches])

  const disconnect = async () => {
    if (mode === "branch" && selectedBranches.length === 0) return toast.error("Select a branch")
    if (mode === "subBranch" && selectedSubBranches.length === 0) return toast.error("Select a sub branch")
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
      const endpoint = "/customer/disconnect/filter/customers"
      const body = {
        branchIds: mode === "subBranch" ? [] : selectedScopeIds,
        subBranchIds: mode === "subBranch" ? selectedScopeIds : [],
        packageIds: packageId ? [Number(packageId)] : [],
        poolValue,
        status,
      }
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
      <CardContainer title="Disconnect Session Filters" description="Disconnect customer RADIUS sessions with branch, sub-branch, package, status, or pool filters.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Disconnect Mode</Label>
            <SearchableSelect
              options={[
                { value: "branch", label: "Branch wise" },
                { value: "subBranch", label: "Sub branch wise" },
                { value: "pool", label: "Pool wise" },
                { value: "all", label: "All customers / filters" },
              ]}
              value={mode}
              onValueChange={(value) => setMode((Array.isArray(value) ? value[0] : value) as any)}
            />
          </div>

          {mode === "branch" && (
            <>
              <div className="space-y-2">
                <Label>Head Office</Label>
                <SearchableSelect options={headOfficeOptions} value={selectedHeadOffices.map(String)} onValueChange={(value) => setSelectedHeadOffices((Array.isArray(value) ? value : [value]).map(Number).filter(Boolean))} placeholder="All head offices" multiple clearable />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <SearchableSelect options={branchOptions} value={selectedBranches.map(String)} onValueChange={(value) => setSelectedBranches((Array.isArray(value) ? value : [value]).map(Number).filter(Boolean))} placeholder="Select branches" multiple clearable />
              </div>
            </>
          )}

          {mode === "all" && (
            <>
              <div className="space-y-2">
                <Label>Head Office</Label>
                <SearchableSelect options={headOfficeOptions} value={selectedHeadOffices.map(String)} onValueChange={(value) => setSelectedHeadOffices((Array.isArray(value) ? value : [value]).map(Number).filter(Boolean))} placeholder="All head offices" multiple clearable />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <SearchableSelect options={branchOptions} value={selectedBranches.map(String)} onValueChange={(value) => setSelectedBranches((Array.isArray(value) ? value : [value]).map(Number).filter(Boolean))} placeholder="All branches" multiple clearable />
              </div>
              <div className="space-y-2">
                <Label>Sub Branch</Label>
                <SearchableSelect options={subBranchOptions} value={selectedSubBranches.map(String)} onValueChange={(value) => setSelectedSubBranches((Array.isArray(value) ? value : [value]).map(Number).filter(Boolean))} placeholder="All sub branches" multiple clearable />
              </div>
              <div className="space-y-2">
                <Label>Package</Label>
                <SearchableSelect options={packageOptions} value={packageId} onValueChange={(value) => setPackageId(Array.isArray(value) ? value[0] || "" : value)} placeholder="All packages" clearable />
              </div>
              <div className="space-y-2">
                <Label>Pool</Label>
                <SearchableSelect options={poolOptions} value={poolValue} onValueChange={(value) => setPoolValue(Array.isArray(value) ? value[0] || "" : value)} placeholder="All pools" clearable />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <SearchableSelect
                  options={[
                    { value: "all", label: "All status" },
                    { value: "active", label: "Active" },
                    { value: "draft", label: "Draft" },
                    { value: "inactive", label: "Inactive" },
                    { value: "suspended", label: "Suspended" },
                  ]}
                  value={status}
                  onValueChange={(value) => setStatus(Array.isArray(value) ? value[0] || "all" : value)}
                />
              </div>
            </>
          )}

          {mode === "subBranch" && (
            <>
              <div className="space-y-2">
                <Label>Head Office</Label>
                <SearchableSelect options={headOfficeOptions} value={selectedHeadOffices.map(String)} onValueChange={(value) => setSelectedHeadOffices((Array.isArray(value) ? value : [value]).map(Number).filter(Boolean))} placeholder="All head offices" multiple clearable />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <SearchableSelect options={branchOptions} value={selectedBranches.map(String)} onValueChange={(value) => setSelectedBranches((Array.isArray(value) ? value : [value]).map(Number).filter(Boolean))} placeholder="All branches" multiple clearable />
              </div>
              <div className="space-y-2">
                <Label>Sub Branch</Label>
                <SearchableSelect options={subBranchOptions} value={selectedSubBranches.map(String)} onValueChange={(value) => setSelectedSubBranches((Array.isArray(value) ? value : [value]).map(Number).filter(Boolean))} placeholder="Select sub branches" multiple clearable />
              </div>
            </>
          )}

          {mode === "pool" && (
            <>
              <div className="space-y-2">
                <Label>Pool</Label>
                <SearchableSelect options={poolOptions} value={poolValue} onValueChange={(value) => setPoolValue(Array.isArray(value) ? value[0] || "" : value)} placeholder="Select pool" />
              </div>
              <div className="space-y-2">
                <Label>Optional Head Office Filter</Label>
                <SearchableSelect options={headOfficeOptions} value={selectedHeadOffices.map(String)} onValueChange={(value) => setSelectedHeadOffices((Array.isArray(value) ? value : [value]).map(Number).filter(Boolean))} placeholder="All head offices" multiple clearable />
              </div>
              <div className="space-y-2">
                <Label>Optional Branch Filter</Label>
                <SearchableSelect options={branchOptions} value={selectedBranches.map(String)} onValueChange={(value) => setSelectedBranches((Array.isArray(value) ? value : [value]).map(Number).filter(Boolean))} placeholder="All branches" multiple clearable />
              </div>
              <div className="space-y-2">
                <Label>Optional Sub Branch Filter</Label>
                <SearchableSelect options={subBranchOptions} value={selectedSubBranches.map(String)} onValueChange={(value) => setSelectedSubBranches((Array.isArray(value) ? value : [value]).map(Number).filter(Boolean))} placeholder="All sub branches" multiple clearable />
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
