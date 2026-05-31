"use client"

import { useState, useEffect } from "react"
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
import { Loader2, UserCheck, Building2 } from "lucide-react"
import toast from "react-hot-toast"

interface AssignDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: any
  onSuccess: () => void
}

export function AssignDeviceDialog({ open, onOpenChange, item, onSuccess }: AssignDeviceDialogProps) {
  const [assignType, setAssignType] = useState<"branch" | "user" | "customer">("branch")
  const [branches, setBranches] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [note, setNote] = useState("")
  const [qtyToAssign, setQtyToAssign] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && item) {
      setQtyToAssign("1")
    }
  }, [open, item])

  useEffect(() => {
    if (!open) return

    const loadData = async () => {
      setLoading(true)
      try {
        const [branchData, userData] = await Promise.all([
          apiRequest("/branches/my-access"),
          apiRequest("/users"),
        ])
        setBranches(branchData || [])
        setUsers(userData || [])
      } catch (err) {
        console.error("Failed to load assignment data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [open])

  // Load customers separately (can be large)
  useEffect(() => {
    if (!open || assignType !== "customer") return

    const loadCustomers = async () => {
      try {
        const data = await apiRequest("/customer?limit=200")
        setCustomers(data?.data || data || [])
      } catch (err) {
        console.error("Failed to load customers:", err)
      }
    }

    loadCustomers()
  }, [open, assignType])

  const handleSubmit = async () => {
    if (!selectedId) {
      toast.error("Please select an assignment target")
      return
    }

    const parsedQty = item && item.availableQty > 1 ? Number(qtyToAssign) : 1
    if (item && item.availableQty > 1 && (isNaN(parsedQty) || parsedQty <= 0 || parsedQty > item.availableQty)) {
      toast.error("Please enter a valid quantity")
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading("Assigning device...")

    try {
      if (assignType === "branch") {
        await apiRequest(`/inventory/${item.id}/transfer`, {
          method: "PUT",
          body: JSON.stringify({
            toBranchId: Number(selectedId),
            status: "ASSIGNED_TO_BRANCH",
            note: note || `Transferred to branch`,
            qty: parsedQty,
          }),
        })
      } else {
        await apiRequest(`/inventory/${item.id}/assign`, {
          method: "PUT",
          body: JSON.stringify({
            ...(assignType === "customer"
              ? { customerId: Number(selectedId) }
              : { userId: Number(selectedId) }),
            note: note || `Assigned to ${assignType}`,
            qty: parsedQty,
          }),
        })
      }

      toast.dismiss(loadingToast)
      toast.success(`Device assigned successfully!`)
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

  const resetForm = () => {
    setAssignType("branch")
    setSelectedId("")
    setNote("")
    setQtyToAssign("1")
  }

  const getCustomerName = (c: any) => {
    const lead = c.lead
    if (lead) {
      return `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || c.customerUniqueId || `#${c.id}`
    }
    return c.customerUniqueId || `#${c.id}`
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
            Assign <span className="font-semibold text-foreground">{item?.name || item?.serialNumber || "item"}</span> to a branch, user, or customer.
          </DialogDescription>
        </DialogHeader>

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
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={assignType} onValueChange={(v: any) => { setAssignType(v); setSelectedId(""); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="branch">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Branch
                  </div>
                </SelectItem>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> Staff / User
                  </div>
                </SelectItem>
                <SelectItem value="customer">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> Customer
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {assignType === "branch" ? "Select Branch" : assignType === "user" ? "Select User" : "Select Customer"}
            </Label>
            <Select value={selectedId} onValueChange={setSelectedId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={`Choose a ${assignType}...`} />
              </SelectTrigger>
              <SelectContent>
                {assignType === "branch" &&
                  branches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.name} {b.code ? `(${b.code})` : ""}
                    </SelectItem>
                  ))}
                {assignType === "user" &&
                  users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name || u.email} {u.role?.name ? `— ${u.role.name}` : ""}
                    </SelectItem>
                  ))}
                {assignType === "customer" &&
                  customers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {getCustomerName(c)} {c.customerUniqueId ? `(${c.customerUniqueId})` : ""}
                    </SelectItem>
                  ))}
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
                onChange={(e) => setQtyToAssign(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea
              placeholder="Add a note about this assignment..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedId}>
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
