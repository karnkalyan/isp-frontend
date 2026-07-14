"use client"

import React, { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CardContainer } from "@/components/ui/card-container"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "react-hot-toast"
import { Loader2, Ruler, CheckCircle2, ChevronRight, Send } from "lucide-react"
import { apiRequest } from "@/lib/api"

type DrumAssignment = {
  id: number
  drumId: number
  drum: {
    serialNumber: string
    drumType: string
    fiberType: string
  }
  assignedTo: string | null
  assignedDate: string
  assignedLength: number
  usedLength: number
  remainingLength: number
  location: string | null
  remarks: string | null
  branch: { name: string } | null
  user: { name: string } | null
}

export default function DrumAssignmentsPage() {
  const [assignments, setAssignments] = useState<DrumAssignment[]>([])
  const [loading, setLoading] = useState(true)

  // Report Usage Modal state
  const [selectedAssignment, setSelectedAssignment] = useState<DrumAssignment | null>(null)
  const [usedLengthInput, setUsedLengthInput] = useState("")
  const [reporting, setReporting] = useState(false)

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiRequest<DrumAssignment[]>("/drums/assignments")
      setAssignments(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error("Failed to load drum assignments ledger")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const handleReportUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignment) return
    const usedVal = parseFloat(usedLengthInput)
    if (isNaN(usedVal) || usedVal <= 0) {
      toast.error("Please enter a positive length used")
      return
    }
    if (usedVal > selectedAssignment.remainingLength) {
      toast.error(`Reported length cannot exceed remaining length (${selectedAssignment.remainingLength}m)`)
      return
    }

    setReporting(true)
    try {
      await apiRequest(`/drums/assignments/${selectedAssignment.id}/usage`, {
        method: "PUT",
        body: JSON.stringify({ usedLength: usedVal })
      })

      toast.success("Fiber usage reported successfully!")
      
      // Update local state
      setAssignments(prev => prev.map(a => {
        if (a.id === selectedAssignment.id) {
          const newUsed = a.usedLength + usedVal
          const newRemaining = a.remainingLength - usedVal
          return {
            ...a,
            usedLength: newUsed,
            remainingLength: newRemaining
          }
        }
        return a
      }))

      setSelectedAssignment(null)
      setUsedLengthInput("")
    } catch (err: any) {
      toast.error(err.message || "Failed to report usage")
    } finally {
      setReporting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6 space-y-6">
        <PageHeader
          title="Fiber Assignments & Layout Tracker"
          description="Track dispatched cable lengths, layout locations, and report fiber usage"
        />

        <CardContainer title="Layout Assignments" description="Ledger of active fiber cable layouts and consumption reporting">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No active fiber assignments found.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="p-3">Assign Date</th>
                    <th className="p-3">Drum Serial</th>
                    <th className="p-3">Assignee / Team</th>
                    <th className="p-3">Location Details</th>
                    <th className="p-3">Lengths (Assigned / Remaining)</th>
                    <th className="p-3">Consumption</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                  {assignments.map(a => {
                    const consumedPercentage = Math.round((a.usedLength / a.assignedLength) * 100)

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 text-xs text-muted-foreground">{new Date(a.assignedDate).toLocaleDateString()}</td>
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{a.drum?.serialNumber}</span>
                            <div className="text-[10px] text-muted-foreground">{a.drum?.drumType} • {a.drum?.fiberType}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-355">{a.assignedTo || "Unnamed Team"}</span>
                            <div className="text-[10px] text-muted-foreground">
                              {a.user ? `User: ${a.user.name}` : a.branch ? `Branch: ${a.branch.name}` : "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-xs text-slate-700 dark:text-slate-300 max-w-[150px] truncate" title={a.location || ""}>{a.location || "—"}</td>
                        <td className="p-3 font-mono">
                          <div className="space-y-0.5 text-xs">
                            <div>Assigned: <span className="font-bold">{a.assignedLength}m</span></div>
                            <div className="text-blue-600 dark:text-blue-400">Remaining: <span className="font-bold">{a.remainingLength}m</span></div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1 max-w-[100px]">
                            <div className="text-[10px] text-muted-foreground flex justify-between">
                              <span>Used: {a.usedLength}m</span>
                              <span>{consumedPercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${consumedPercentage}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          {a.remainingLength > 0 ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedAssignment(a)}
                              className="h-7 text-[10px] flex items-center gap-1 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              <Ruler className="h-3 w-3 text-blue-600" />
                              <span>Report Usage</span>
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Fully Used</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContainer>

        {/* Report Usage Modal */}
        {selectedAssignment && (
          <Dialog open={selectedAssignment !== null} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Report Fiber Consumption</DialogTitle>
                <DialogDescription>
                  Enter the length of fiber cable used from reel <b>{selectedAssignment.drum?.serialNumber}</b>. Remaining in this assignment: <b>{selectedAssignment.remainingLength}m</b>.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleReportUsageSubmit} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="usedLen">Used Length (meters)</Label>
                  <Input 
                    id="usedLen" 
                    type="number" 
                    step="any" 
                    min="0.01" 
                    max={selectedAssignment.remainingLength} 
                    value={usedLengthInput}
                    onChange={e => setUsedLengthInput(e.target.value)}
                    placeholder={`e.g. 50 (max ${selectedAssignment.remainingLength}m)`} 
                    required 
                    autoFocus
                  />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setSelectedAssignment(null)}>Cancel</Button>
                  <Button type="submit" disabled={reporting} className="flex items-center gap-1.5">
                    {reporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span>Submit Report</span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}
