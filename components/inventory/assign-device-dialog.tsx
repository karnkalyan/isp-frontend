"use client"

import { useEffect, useState } from "react"
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
  const [selectedId, setSelectedId] = useState("")
  const [note, setNote] = useState("")
  const [qtyToAssign, setQtyToAssign] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const isAssignedToCustomer = item?.status === "ASSIGNED_TO_CUSTOMER" || Boolean(item?.customerId)

  useEffect(() => {
    if (open && item) {
      setQtyToAssign("1")
    }
  }, [open, item])

  useEffect(() => {
    if (!open) return

    const loadUsers = async () => {
      setLoading(true)
      try {
        const userData = await apiRequest("/users")
        setUsers(Array.isArray(userData) ? userData : [])
      } catch (err) {
        console.error("Failed to load users for inventory assignment:", err)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [open])

  const resetForm = () => {
    setSelectedId("")
    setNote("")
    setQtyToAssign("1")
  }

  const handleSubmit = async () => {
    if (!selectedId) {
      toast.error("Please select a user")
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
          userId: Number(selectedId),
          note: note || "Assigned to user",
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
            Assign <span className="font-semibold text-foreground">{item?.name || item?.serialNumber || "item"}</span> to a staff user.
          </DialogDescription>
        </DialogHeader>

        {isAssignedToCustomer && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This hardware is already assigned to a customer. Return it to stock, branch, or staff before assigning it again.
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
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Select User</Label>
            <Select value={selectedId} onValueChange={setSelectedId} disabled={loading || isAssignedToCustomer}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading users..." : "Choose a user..."} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name || user.email} {user.role?.name ? `- ${user.role.name}` : ""}
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
