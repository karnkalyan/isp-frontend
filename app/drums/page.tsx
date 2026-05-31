"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CardContainer } from "@/components/ui/card-container"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { Plus, Edit2, Trash2, Loader2, Send, Cable, Activity, Search, Calendar, Save, Eye } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"

type Drum = {
  id: number
  serialNumber: string
  drumType: string
  fiberType: string
  capacity: number
  totalLength: number
  assignedLength: number
  usedLength: number
  remainingLength: number
  manufacturer: string | null
  purchaseDate: string | null
  status: "IN_STOCK" | "ASSIGNED" | "USED" | "SCRAPPED"
}

type Branch = {
  id: number
  name: string
}

type User = {
  id: number
  name: string
  email: string
}

export default function DrumsPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission("drums_create")
  const canUpdate = hasPermission("drums_update")
  const canDelete = hasPermission("drums_delete")

  const [drums, setDrums] = useState<Drum[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  // Drum Form Modal
  const [showDrumForm, setShowDrumForm] = useState(false)
  const [editingDrum, setEditingDrum] = useState<Drum | null>(null)
  const [serial, setSerial] = useState("")
  const [drumType, setDrumType] = useState("Armored")
  const [fiberType, setFiberType] = useState("G.652.D")
  const [totalLength, setTotalLength] = useState("")
  const [capacity, setCapacity] = useState("")
  const [manufacturer, setManufacturer] = useState("")
  const [purchaseDate, setPurchaseDate] = useState("")
  const [savingDrum, setSavingDrum] = useState(false)

  // Assignment Modal
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [selectedDrum, setSelectedDrum] = useState<Drum | null>(null)
  const [assignLength, setAssignLength] = useState("")
  const [assignTo, setAssignTo] = useState("")
  const [assignType, setAssignType] = useState<"USER" | "BRANCH">("USER")
  const [targetId, setTargetId] = useState("")
  const [location, setLocation] = useState("")
  const [remarks, setRemarks] = useState("")
  const [submittingAssign, setSubmittingAssign] = useState(false)

  // Details Modal
  const [viewingDrumId, setViewingDrumId] = useState<number | null>(null)
  const [viewingDrumDetails, setViewingDrumDetails] = useState<any | null>(null)
  const [loadingViewDetails, setLoadingViewDetails] = useState(false)

  const handleViewDrumClick = async (id: number) => {
    setViewingDrumId(id)
    setLoadingViewDetails(true)
    try {
      const data = await apiRequest<any>(`/drums/${id}`)
      setViewingDrumDetails(data)
    } catch (err) {
      toast.error("Failed to load drum details")
      setViewingDrumId(null)
    } finally {
      setLoadingViewDetails(false)
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (search.trim()) queryParams.append("search", search.trim())
      if (statusFilter && statusFilter !== "ALL") queryParams.append("status", statusFilter)

      const [drumsData, branchData, userData] = await Promise.all([
        apiRequest<Drum[]>(`/drums?${queryParams.toString()}`),
        apiRequest<Branch[]>("/branches"),
        apiRequest<User[]>("/users")
      ])
      setDrums(Array.isArray(drumsData) ? drumsData : [])
      setBranches(Array.isArray(branchData) ? branchData.filter(b => b.id) : [])
      
      const userList = Array.isArray(userData) ? userData : (userData as any)?.data || []
      setUsers(Array.isArray(userList) ? userList : [])
    } catch (e) {
      toast.error("Failed to load drums and assignees data")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Create or Update Drum
  const handleDrumSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serial.trim() || !drumType.trim() || !fiberType.trim() || !totalLength) {
      toast.error("Required fields: Serial, Drum Type, Fiber Type, Total Length")
      return
    }

    setSavingDrum(true)
    try {
      if (editingDrum) {
        const updated = await apiRequest<Drum>(`/drums/${editingDrum.id}`, {
          method: "PUT",
          body: JSON.stringify({
            drumType,
            fiberType,
            totalLength: parseFloat(totalLength),
            capacity: capacity ? parseFloat(capacity) : parseFloat(totalLength),
            manufacturer: manufacturer.trim() || null,
            purchaseDate: purchaseDate || null
          })
        })
        setDrums(prev => prev.map(d => d.id === editingDrum.id ? updated : d))
        toast.success("Cable drum updated successfully!")
      } else {
        const created = await apiRequest<Drum>("/drums", {
          method: "POST",
          body: JSON.stringify({
            serialNumber: serial.trim(),
            drumType,
            fiberType,
            totalLength: parseFloat(totalLength),
            capacity: capacity ? parseFloat(capacity) : parseFloat(totalLength),
            manufacturer: manufacturer.trim() || null,
            purchaseDate: purchaseDate || null
          })
        })
        setDrums(prev => [created, ...prev])
        toast.success("New cable drum registered!")
      }
      resetDrumForm()
    } catch (err: any) {
      toast.error(err.message || "Failed to save drum")
    } finally {
      setSavingDrum(false)
    }
  }

  const handleDeleteDrum = async (id: number) => {
    if (!confirm("Are you sure you want to delete this fiber drum?")) return
    try {
      await apiRequest(`/drums/${id}`, { method: "DELETE" })
      setDrums(prev => prev.filter(d => d.id !== id))
      toast.success("Drum deleted successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete drum")
    }
  }

  // Handle Assign submit
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDrum) return
    const length = parseFloat(assignLength)
    const availableToAssign = selectedDrum.totalLength - selectedDrum.assignedLength
    if (isNaN(length) || length <= 0) {
      toast.error("Please enter a positive assignment length")
      return
    }
    if (length > availableToAssign) {
      toast.error(`Insufficient stock! Only ${availableToAssign}m remaining to assign.`)
      return
    }
    if (!targetId) {
      toast.error("Please select a target assignee")
      return
    }

    setSubmittingAssign(true)
    try {
      const payload = {
        drumId: selectedDrum.id,
        assignedLength: length,
        assignedTo: assignTo.trim() || null,
        branchId: assignType === "BRANCH" ? parseInt(targetId) : null,
        userId: assignType === "USER" ? parseInt(targetId) : null,
        location,
        remarks
      }

      const res = await apiRequest<{ updatedDrum: Drum }>("/drums/assignments", {
        method: "POST",
        body: JSON.stringify(payload)
      })

      if (res && res.updatedDrum) {
        setDrums(prev => prev.map(d => d.id === selectedDrum.id ? res.updatedDrum : d))
      }
      toast.success("Fiber length assigned successfully!")
      resetAssignForm()
    } catch (err: any) {
      toast.error(err.message || "Failed to assign fiber")
    } finally {
      setSubmittingAssign(false)
    }
  }

  const handleEditDrumClick = (drum: Drum) => {
    setEditingDrum(drum)
    setSerial(drum.serialNumber)
    setDrumType(drum.drumType)
    setFiberType(drum.fiberType)
    setTotalLength(String(drum.totalLength))
    setCapacity(String(drum.capacity))
    setManufacturer(drum.manufacturer || "")
    setPurchaseDate(drum.purchaseDate ? drum.purchaseDate.split("T")[0] : "")
    setShowDrumForm(true)
  }

  const handleAssignClick = (drum: Drum) => {
    setSelectedDrum(drum)
    setShowAssignForm(true)
  }

  const resetDrumForm = () => {
    setEditingDrum(null)
    setSerial("")
    setDrumType("Armored")
    setFiberType("G.652.D")
    setTotalLength("")
    setCapacity("")
    setManufacturer("")
    setPurchaseDate("")
    setShowDrumForm(false)
  }

  const resetAssignForm = () => {
    setSelectedDrum(null)
    setAssignLength("")
    setAssignTo("")
    setTargetId("")
    setLocation("")
    setRemarks("")
    setShowAssignForm(false)
  }

  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6 space-y-6">
        <PageHeader
          title="Fiber Cable Drum Management"
          description="Register fiber cable reels, track assignments, and verify usage on optical fiber deployments"
        />

        {/* Filters & Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Serial, Fiber Type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 border-slate-200 dark:border-slate-800 h-9"
              />
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="IN_STOCK">In Stock</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned (Active)</SelectItem>
                  <SelectItem value="USED">Depleted (Used)</SelectItem>
                  <SelectItem value="SCRAPPED">Scrapped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {canCreate && (
            <Button onClick={() => setShowDrumForm(true)} className="flex items-center gap-1.5 w-full sm:w-auto h-9">
              <Plus className="h-4 w-4" />
              <span>Register Drum</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Drums List */}
          <div className="lg:col-span-2 space-y-6">
            <CardContainer title="Cable Reels Ledger" description="Detailed list of registered optical cable reels">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : drums.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No fiber drums found. Register one.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {drums.map(drum => {
                    const availableToAssign = drum.totalLength - drum.assignedLength
                    const remainingLength = drum.totalLength - drum.usedLength
                    const usedPercentage = Math.min(100, Math.round((drum.usedLength / drum.totalLength) * 100))

                    return (
                      <div key={drum.id} className="p-4 border rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 space-y-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 font-mono tracking-tight flex items-center gap-1.5">
                              <Cable className="h-4 w-4 text-blue-500" />
                              {drum.serialNumber}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                              <span>{drum.drumType}</span>
                              <span>•</span>
                              <span>{drum.fiberType}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase ${
                              drum.status === "IN_STOCK" 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30" 
                                : drum.status === "ASSIGNED" 
                                ? "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/20 dark:border-orange-900/30" 
                                : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950/20"
                            }`}>
                              {drum.status}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => handleViewDrumClick(drum.id)} className="h-7 w-7 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20">
                              <Eye className="h-3 w-3" />
                            </Button>
                            {canUpdate && (
                              <Button variant="ghost" size="icon" onClick={() => handleEditDrumClick(drum)} className="h-7 w-7 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteDrum(drum.id)} className="h-7 w-7 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Fiber Usage Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Fiber Usage Progress</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-350">{usedPercentage}% Used</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${usedPercentage}%` }}></div>
                          </div>
                        </div>

                        {/* Metrage details */}
                        <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3 border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Total Reel Capacity</span>
                            <span className="font-semibold">{drum.totalLength}m</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Remaining Reel Fiber</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{remainingLength}m</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Assigned to Teams</span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">{drum.assignedLength}m</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Unassigned (In Stock)</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{availableToAssign}m</span>
                          </div>
                        </div>

                        {canUpdate && drum.status !== "USED" && drum.status !== "SCRAPPED" && availableToAssign > 0 && (
                          <Button 
                            onClick={() => handleAssignClick(drum)} 
                            className="w-full flex items-center justify-center gap-2 mt-2 h-9 text-xs"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Assign Item</span>
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContainer>
          </div>

          {/* Reel Forms Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Drum registration Form */}
            {showDrumForm && (
              <CardContainer title={editingDrum ? "Modify Cable Reel" : "Register Cable Reel"} description="Configure reel serial, parameters, manufacturer details">
                <form onSubmit={handleDrumSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="serial">Reel Serial Number</Label>
                    <Input id="serial" placeholder="e.g. SN-REEL-94819" value={serial} onChange={e => setSerial(e.target.value)} disabled={editingDrum !== null} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dtype">Drum Type</Label>
                      <Select value={drumType} onValueChange={setDrumType}>
                        <SelectTrigger id="dtype">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Armored">Armored Reel</SelectItem>
                          <SelectItem value="Unarmored">Unarmored Reel</SelectItem>
                          <SelectItem value="Drop Cable">Drop Cable Drum</SelectItem>
                          <SelectItem value="Ribbon">Ribbon Reel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ftype">Fiber Type</Label>
                      <Select value={fiberType} onValueChange={setFiberType}>
                        <SelectTrigger id="ftype">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="G.652.D">G.652.D Single-Mode</SelectItem>
                          <SelectItem value="G.657.A1">G.657.A1 Bend-Insensitive</SelectItem>
                          <SelectItem value="OM3">OM3 Multi-Mode</SelectItem>
                          <SelectItem value="OM4">OM4 Multi-Mode</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="length">Reel Fiber Length (m)</Label>
                      <Input id="length" type="number" step="any" min="1" value={totalLength} onChange={e => setTotalLength(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="capacity">Capacity (m)</Label>
                      <Input id="capacity" type="number" step="any" min="1" placeholder="defaults to length" value={capacity} onChange={e => setCapacity(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="mfg">Manufacturer</Label>
                      <Input id="mfg" placeholder="e.g. Sterlite, Corning" value={manufacturer} onChange={e => setManufacturer(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="purchDate">Purchase Date</Label>
                      <Input id="purchDate" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={savingDrum} className="flex-1 flex items-center justify-center gap-2">
                      {savingDrum ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      <span>{editingDrum ? "Update Reel" : "Register Reel"}</span>
                    </Button>
                    <Button type="button" variant="outline" onClick={resetDrumForm}>Cancel</Button>
                  </div>
                </form>
              </CardContainer>
            )}

            {/* Assign Form */}
            {showAssignForm && selectedDrum && (
              <CardContainer title={`Assign Reel ${selectedDrum.serialNumber}`} description="Assign fiber length to dispatch.">
                <form onSubmit={handleAssignSubmit} className="space-y-4">
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    Remaining Qty <span className="font-bold text-foreground">{selectedDrum.totalLength - selectedDrum.assignedLength}m</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="assignType">Assignment Mode</Label>
                    <Select value={assignType} onValueChange={(v: any) => { setAssignType(v); setTargetId(""); }}>
                      <SelectTrigger id="assignType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">To Technician / User</SelectItem>
                        <SelectItem value="BRANCH">To Branch Office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="target">Select Assignee</Label>
                    <Select value={targetId} onValueChange={setTargetId}>
                      <SelectTrigger id="target">
                        <SelectValue placeholder="Choose target..." />
                      </SelectTrigger>
                      <SelectContent>
                        {assignType === "USER" ? (
                          users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.email})</SelectItem>)
                        ) : (
                          branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="teamName">Custom Assignee / Team Name</Label>
                    <Input id="teamName" placeholder="e.g. Field Team A, Fiber Layout Team" value={assignTo} onChange={e => setAssignTo(e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="len">Assigned Length (m)</Label>
                    <Input id="len" type="number" step="any" min="0.01" max={selectedDrum.totalLength - selectedDrum.assignedLength} value={assignLength} onChange={e => setAssignLength(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="loc">Location Details</Label>
                    <Input id="loc" placeholder="e.g. Sector-4 layout, Main highway" value={location} onChange={e => setLocation(e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Input id="remarks" placeholder="Assignment details" value={remarks} onChange={e => setRemarks(e.target.value)} />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={submittingAssign} className="flex-1 flex items-center justify-center gap-2">
                      {submittingAssign ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      <span>Assign Item</span>
                    </Button>
                    <Button type="button" variant="outline" onClick={resetAssignForm}>Cancel</Button>
                  </div>
                </form>
              </CardContainer>
            )}
          </div>
        </div>

        {viewingDrumId && (
          <Dialog open={viewingDrumId !== null} onOpenChange={(open) => !open && setViewingDrumId(null)}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Cable className="h-5 w-5 text-indigo-500" />
                  <span>Cable Drum Details & Usage History</span>
                </DialogTitle>
                <DialogDescription>
                  Detailed metadata and layout consumption trail for serial: <b className="font-mono text-slate-800 dark:text-slate-200">{viewingDrumDetails?.serialNumber}</b>
                </DialogDescription>
              </DialogHeader>

              {loadingViewDetails ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : viewingDrumDetails ? (
                <div className="space-y-6">
                  {/* Drum Metadata Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs">
                    <div>
                      <span className="text-muted-foreground block">Drum Type</span>
                      <span className="font-bold text-sm">{viewingDrumDetails.drumType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Fiber Type</span>
                      <span className="font-bold text-sm">{viewingDrumDetails.fiberType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Status</span>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20">{viewingDrumDetails.status}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Manufacturer</span>
                      <span className="font-bold text-sm">{viewingDrumDetails.manufacturer || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Total Length</span>
                      <span className="font-bold text-sm">{viewingDrumDetails.totalLength}m</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Used Length</span>
                      <span className="font-bold text-sm text-rose-600">{viewingDrumDetails.usedLength}m</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Remaining Length</span>
                      <span className="font-bold text-sm text-blue-600">{viewingDrumDetails.remainingLength}m</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Purchase Date</span>
                      <span className="font-bold text-sm">{viewingDrumDetails.purchaseDate ? new Date(viewingDrumDetails.purchaseDate).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>

                  {/* Usage History Table */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Usage & Assignment History</h4>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 border-b text-[10px] font-semibold uppercase text-muted-foreground">
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Location</th>
                            <th className="p-2.5">Assigned</th>
                            <th className="p-2.5">Used</th>
                            <th className="p-2.5">Remaining</th>
                            <th className="p-2.5">Assignee</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-slate-700 dark:text-slate-300">
                          {!viewingDrumDetails.assignments || viewingDrumDetails.assignments.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-muted-foreground italic">No assignments recorded for this drum.</td>
                            </tr>
                          ) : (
                            viewingDrumDetails.assignments.map((a: any) => (
                              <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                <td className="p-2.5">{new Date(a.assignedDate).toLocaleDateString()}</td>
                                <td className="p-2.5 max-w-[120px] truncate" title={a.location || ""}>{a.location || "—"}</td>
                                <td className="p-2.5 font-semibold">{a.assignedLength}m</td>
                                <td className="p-2.5 text-rose-600">{a.usedLength}m</td>
                                <td className="p-2.5 text-blue-600">{a.remainingLength}m</td>
                                <td className="p-2.5">
                                  <div className="font-medium">{a.assignedTo || "—"}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {a.user ? `User: ${a.user.name}` : a.branch ? `Branch: ${a.branch.name}` : ""}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}

              <DialogFooter className="border-t pt-3 mt-4">
                <Button variant="outline" onClick={() => setViewingDrumId(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}
