"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Building, Plus, Trash2, ShieldAlert, Loader2, Power } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"

export default function InvoiceRangesPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Restrict to global admins
  const isGlobal = useMemo(() => {
    if (!user) return false
    const roleStr = typeof user.role === 'string' ? user.role : (user.role?.name || '')
    const roleName = roleStr.toLowerCase()
    return roleName === 'administrator' || 
           roleName === 'admin' || 
           roleName === 'isp_admin' || 
           roleName === 'super admin' || 
           roleName.startsWith('global')
  }, [user])

  const [branches, setBranches] = useState<any[]>([])
  const [ranges, setRanges] = useState<any[]>([])
  const [fiscalYears, setFiscalYears] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [selectedBranchId, setSelectedBranchId] = useState("")
  const [rangeStart, setRangeStart] = useState("")
  const [rangeEnd, setRangeEnd] = useState("")
  const [fiscalYearId, setFiscalYearId] = useState("")

  const loadData = async () => {
    setLoadingData(true)
    try {
      const [branchesRes, rangesRes, fiscalRes] = await Promise.all([
        apiRequest("/branch"),
        apiRequest("/billing/invoice-ranges"),
        apiRequest("/billing/fiscal-years")
      ])
      
      setBranches(Array.isArray(branchesRes) ? branchesRes : (branchesRes?.data || []))
      setRanges(rangesRes?.ranges || [])
      const years = Array.isArray(fiscalRes) ? fiscalRes : []
      setFiscalYears(years)
      if (!fiscalYearId) setFiscalYearId(String((years.find((y:any) => y.isActive) || years[0])?.id || ""))
    } catch (err) {
      console.error("Failed to load invoice ranges data:", err)
      toast.error("Failed to load allocations data")
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (!loading && !isGlobal) {
      router.replace("/")
      return
    }
    if (isGlobal) {
      loadData()
    }
  }, [isGlobal, loading, router])

  if (loading || !isGlobal) {
    return null
  }

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBranchId) return toast.error("Please select a branch")
    if (!fiscalYearId) return toast.error("Please select a fiscal year")
    if (!rangeStart || !rangeEnd) return toast.error("Range bounds are required")

    setSubmitting(true)
    try {
      await apiRequest("/billing/invoice-ranges", {
        method: "POST",
        body: JSON.stringify({
          branchId: Number(selectedBranchId),
          fiscalYearId: Number(fiscalYearId),
          rangeStart: Number(rangeStart),
          rangeEnd: Number(rangeEnd)
        })
      })
      toast.success("Invoice range allocated successfully!")
      setSelectedBranchId("")
      setRangeStart("")
      setRangeEnd("")
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to allocate range")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (rangeId: number, currentStatus: boolean) => {
    try {
      await apiRequest(`/billing/invoice-ranges/${rangeId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentStatus })
      })
      toast.success("Range status updated")
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to update range status")
    }
  }

  const handleDeleteRange = async (rangeId: number) => {
    if (!confirm("Are you sure you want to delete this range allocation?")) return
    try {
      await apiRequest(`/billing/invoice-ranges/${rangeId}`, {
        method: "DELETE"
      })
      toast.success("Range allocation removed successfully")
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete range")
    }
  }

  const branchName = (branchId: number) => {
    const br = branches.find(b => b.id === branchId)
    return br ? br.name : `Branch #${branchId}`
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Invoice Range Allocation"
          description="Allocate dedicated invoice ID ranges to branches and sub-branches"
          icon={Building}
        />

        <div className="grid gap-6 md:grid-cols-3">
          {/* Step 1: Allocate Range Form */}
          <div className="md:col-span-1">
            <CardContainer title="Allocate Range" description="Define bounds for a branch">
              <form onSubmit={handleAllocate} className="space-y-4">
                <div className="space-y-2"><Label>Fiscal Year</Label><Select value={fiscalYearId} onValueChange={setFiscalYearId}><SelectTrigger><SelectValue placeholder="Choose fiscal year" /></SelectTrigger><SelectContent>{fiscalYears.map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}{y.isActive ? " (Current)" : ""}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2">
                  <Label htmlFor="branch" className="text-foreground">Branch</Label>
                  <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger className="bg-background border-input text-foreground">
                      <SelectValue placeholder="Choose a branch..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start" className="text-foreground">Range Start ID</Label>
                  <Input
                    id="start"
                    type="number"
                    placeholder="e.g. 1000"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="bg-background border-input text-foreground"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end" className="text-foreground">Range End ID</Label>
                  <Input
                    id="end"
                    type="number"
                    placeholder="e.g. 2000"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="bg-background border-input text-foreground"
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground font-bold rounded-lg gap-2">
                  <Plus className="h-4 w-4" />
                  {submitting ? "Allocating..." : "Allocate Range"}
                </Button>
              </form>
            </CardContainer>
          </div>

          {/* Table: List of Allocations */}
          <div className="md:col-span-2">
            <CardContainer title="Active Allocations" description="Manage invoice bounds mapped to active branches">
              {loadingData ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : ranges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                  <ShieldAlert className="h-10 w-10 text-muted-foreground/60 mb-3" />
                  <p>No range allocations created yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-semibold">Branch Name</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Fiscal Year</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-center">Start</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-center">End</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-center">Current</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-center">Status</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ranges.map((r) => (
                        <TableRow key={r.id} className="border-b border-border/60 hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground">{branchName(r.branchId)}</TableCell>
                          <TableCell>{fiscalYears.find(y => y.id === r.fiscalYearId)?.name || "Legacy"}</TableCell>
                          <TableCell className="text-center font-mono text-foreground/80">{r.rangeStart}</TableCell>
                          <TableCell className="text-center font-mono text-foreground/80">{r.rangeEnd}</TableCell>
                          <TableCell className="text-center font-mono text-foreground/80">{r.current}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={r.isActive ? "success" : "secondary"}>
                              {r.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right p-2">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleActive(r.id, r.isActive)}
                                className={`h-8 w-8 rounded-md ${r.isActive ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                                title={r.isActive ? "Deactivate" : "Activate"}
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRange(r.id)}
                                className="h-8 w-8 rounded-md text-rose-500 hover:bg-rose-500/10"
                                title="Delete Allocation"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
