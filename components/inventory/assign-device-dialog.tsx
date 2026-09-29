"use client"

import { useEffect, useState, useMemo } from "react"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Loader2, UserCheck } from "lucide-react"
import toast from "react-hot-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AssignDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: any
  onSuccess: () => void
}

export function AssignDeviceDialog({ open, onOpenChange, item, onSuccess }: AssignDeviceDialogProps) {
  const [users, setUsers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all")
  const [selectedId, setSelectedId] = useState("")
  const [note, setNote] = useState("")
  const [qtyToAssign, setQtyToAssign] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const isAssignedToCustomer = item?.status === "ASSIGNED_TO_CUSTOMER" || Boolean(item?.customerId)

  useEffect(() => {
    if (open && item) {
      setQtyToAssign("1")
      if (item.branchId) {
        setSelectedBranchId(String(item.branchId))
      } else {
        setSelectedBranchId("all")
      }
    }
  }, [open, item])

  useEffect(() => {
    if (!open) return

    const loadData = async () => {
      setLoading(true)
      try {
        const [userData, branchData] = await Promise.all([
          apiRequest("/users"),
          apiRequest("/branches")
        ])

        // Only include staff users - strictly filter out customer accounts
        const staffUsers = (Array.isArray(userData) ? userData : []).filter((u: any) => {
          const roleName = String(u.role?.name || u.role || "").toLowerCase()
          return !roleName.includes("customer") && !u.customerId
        })
        setUsers(staffUsers)

        const activeBranches = (Array.isArray(branchData) ? branchData : []).filter((b: any) => b.isActive !== false)
        setBranches(activeBranches)
      } catch (err) {
        console.error("Failed to load users/branches for inventory assignment:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [open])

  // Filter staff users based on selected branch
  const filteredUsers = useMemo(() => {
    if (selectedBranchId === "all") return users
    const bId = Number(selectedBranchId)
    return users.filter((u: any) => 
      u.branchId === bId || 
      u.userBranches?.some((ub: any) => ub.branchId === bId)
    )
  }, [users, selectedBranchId])

  // Find the branch admin for the currently selected branch
  const currentBranchAdmin = useMemo(() => {
    if (selectedBranchId === "all") return null
    const bId = Number(selectedBranchId)
    return users.find((u: any) => {
      const roleName = String(u.role?.name || u.role || "").toLowerCase()
      const isBranchAdmin = roleName.includes("branch admin") || roleName.includes("branch_admin")
      const matchesBranch = u.branchId === bId || u.userBranches?.some((ub: any) => ub.branchId === bId)
      return isBranchAdmin && matchesBranch
    }) || null
  }, [users, selectedBranchId])

  // When branch changes, auto-select the branch admin
  const handleBranchChange = (branchIdVal: string) => {
    setSelectedBranchId(branchIdVal)
    if (branchIdVal === "all") {
      setSelectedId("")
      return
    }
    const bId = Number(branchIdVal)
    const admin = users.find((u: any) => {
      const roleName = String(u.role?.name || u.role || "").toLowerCase()
      const isBranchAdmin = roleName.includes("branch admin") || roleName.includes("branch_admin")
      const matchesBranch = u.branchId === bId || u.userBranches?.some((ub: any) => ub.branchId === bId)
      return isBranchAdmin && matchesBranch
    })
    if (admin) {
      setSelectedId(String(admin.id))
    } else {
      // Fallback to first user in branch if no explicit branch admin role exists
      const firstBranchUser = users.find((u: any) => 
        u.branchId === bId || u.userBranches?.some((ub: any) => ub.branchId === bId)
      )
      setSelectedId(firstBranchUser ? String(firstBranchUser.id) : "")
    }
  }

  const resetForm = () => {
    setSelectedId("")
    setSelectedBranchId("all")
    setNote("")
    setQtyToAssign("1")
  }

  const handleSubmit = async () => {
    if (!selectedId && selectedBranchId === "all") {
      toast.error("Please select a branch or user to assign")
      return
    }

    if (isAssignedToCustomer) {
      toast.error("Return this hardware from the customer before assigning it again")
      return
    }

    const parsedQty = item && item.availableQty > 1 ? Number(qtyToAssign) : 1
    if (item && item.availableQty > 1 && (isNaN(parsedQty) || parsedQty <= 0 || parsedQty > item.availableQty)) {
      toast.error("Please enter a valid quantity")
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading("Assigning item...")

    try {
      await apiRequest(`/inventory/${item.id}/assign`, {
        method: "PUT",
        body: JSON.stringify({
          userId: selectedId ? Number(selectedId) : undefined,
          branchId: selectedBranchId !== "all" ? Number(selectedBranchId) : undefined,
          note: note || (currentBranchAdmin && selectedId === String(currentBranchAdmin.id) 
            ? `Assigned to Branch Admin (${currentBranchAdmin.name})` 
            : "Assigned to staff user"),
          qty: parsedQty,
        }),
      })

      toast.dismiss(loadingToast)
      toast.success("Item assigned successfully")
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (err: any) {
      toast.dismiss(loadingToast)
      toast.error(err.message || "Failed to assign item")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Assign Item
          </DialogTitle>
          <DialogDescription>
            Assign <span className="font-semibold text-foreground">{item?.name || item?.serialNumber || "item"}</span> to a branch or staff user.
          </DialogDescription>
        </DialogHeader>

        {isAssignedToCustomer && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This hardware is currently assigned to customer <span className="font-semibold">{item?.customer?.name || item?.customer?.customerUniqueId || "Unknown"}</span>. Direct inventory assignment to customers is disabled. Return it to stock before reassigning.
            </AlertDescription>
          </Alert>
        )}

        {item && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{item.type}</span>
            </div>
            {item.serialNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serial:</span>
                <span className="font-mono text-xs">{item.serialNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium">{item.status?.replace(/_/g, " ")}</span>
            </div>
            {item.branch && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Branch:</span>
                <span className="font-medium">{item.branch.name}</span>
              </div>
            )}
            {item.customer && (
              <div className="flex justify-between text-purple-600 dark:text-purple-400">
                <span>Assigned Customer:</span>
                <span className="font-medium">{item.customer.name} ({item.customer.customerUniqueId})</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Assign Branch Selector */}
          <div className="space-y-2">
            <Label>Assign Branch</Label>
            <Select value={selectedBranchId} onValueChange={handleBranchChange} disabled={loading || isAssignedToCustomer}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading branches..." : "Choose a branch..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches (Global)</SelectItem>
                {branches.map((branch: any) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name} {branch.code ? `(${branch.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentBranchAdmin && (
              <p className="text-xs text-muted-foreground">
                Branch Admin: <span className="font-semibold text-foreground">{currentBranchAdmin.name}</span> (Auto-selected below)
              </p>
            )}
          </div>

          {/* Select User Dropdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select User</Label>
              {selectedBranchId !== "all" && (
                <span className="text-[11px] text-muted-foreground">
                  Filtered by selected branch
                </span>
              )}
            </div>
            <Select value={selectedId} onValueChange={setSelectedId} disabled={loading || isAssignedToCustomer}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading users..." : "Choose a staff user..."} />
              </SelectTrigger>
              <SelectContent>
                {filteredUsers.length === 0 ? (
                  <div className="p-2 text-xs text-center text-muted-foreground">
                    No staff users found in this branch
                  </div>
                ) : (
                  filteredUsers.map((user: any) => {
                    const isBranchAdmin = String(user.role?.name || "").toLowerCase().includes("branch admin")
                    return (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name || user.email} {user.role?.name ? `(${user.role.name})` : ""} {isBranchAdmin ? "★" : ""}
                      </SelectItem>
                    )
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {item && item.availableQty > 1 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="qty-input">Quantity to Assign</Label>
                <span className="text-xs text-muted-foreground font-semibold">
                  Remaining Qty: <span className="font-bold text-foreground">{item.availableQty}</span>
                </span>
              </div>
              <Input
                id="qty-input"
                type="number"
                min="1"
                max={item.availableQty}
                value={qtyToAssign}
                onChange={(event) => setQtyToAssign(event.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea
              placeholder="Add a note about this assignment..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedId || isAssignedToCustomer}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...
              </>
            ) : (
              "Assign Item"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
