"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Save, X, CreditCard, CheckCircle2 } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useSettings } from "@/contexts/settings-context"

export function PaymentMethodsSettings() {
  const { paymentMethods, setPaymentMethods } = useSettings()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [newMethod, setNewMethod] = useState<Omit<(typeof paymentMethods)[0], "id">>({
    name: "",
    code: "",
    isEnabled: true,
    isDefault: false,
    processingFee: 0,
  })

  const resetForm = () => {
    setNewMethod({
      name: "",
      code: "",
      isEnabled: true,
      isDefault: false,
      processingFee: 0,
    })
  }

  const handleAdd = () => {
    if (!newMethod.name || !newMethod.code) {
      toast.error("Name and code are required")
      return
    }

    const newId = (Math.max(...paymentMethods.map((method) => Number.parseInt(method.id))) + 1).toString()

    // If this new method is set as default, update all others to not be default
    let updatedMethods = [...paymentMethods]
    if (newMethod.isDefault) {
      updatedMethods = updatedMethods.map((method) => ({
        ...method,
        isDefault: false,
      }))
    }

    setPaymentMethods([...updatedMethods, { id: newId, ...newMethod }])
    setIsAdding(false)
    resetForm()
    toast.success("Payment method added successfully")
  }

  const handleEdit = (id: string) => {
    const method = paymentMethods.find((method) => method.id === id)
    if (method) {
      setNewMethod({
        name: method.name,
        code: method.code,
        isEnabled: method.isEnabled,
        isDefault: method.isDefault,
        processingFee: method.processingFee,
      })
      setEditingId(id)
    }
  }

  const handleUpdate = () => {
    if (!editingId) return

    if (!newMethod.name || !newMethod.code) {
      toast.error("Name and code are required")
      return
    }

    // If this method is being set as default, update all others to not be default
    let updatedMethods = [...paymentMethods]
    if (newMethod.isDefault) {
      updatedMethods = updatedMethods.map((method) => ({
        ...method,
        isDefault: method.id === editingId,
      }))
    } else {
      // Check if this was the default and is being unset
      const wasDefault = paymentMethods.find((method) => method.id === editingId)?.isDefault

      // If it was the default and is being unset, we need to set another one as default
      if (wasDefault) {
        // Find the first enabled method that's not this one and set it as default
        const firstOtherId = paymentMethods.find((method) => method.id !== editingId && method.isEnabled)?.id
        if (firstOtherId) {
          updatedMethods = updatedMethods.map((method) => ({
            ...method,
            isDefault: method.id === firstOtherId,
          }))
          toast.success("Another payment method was set as default")
        }
      } else {
        // Just update this method
        updatedMethods = updatedMethods.map((method) =>
          method.id === editingId ? { ...method, ...newMethod } : method,
        )
      }
    }

    setPaymentMethods(updatedMethods)
    setEditingId(null)
    resetForm()
    toast.success("Payment method updated successfully")
  }

  const handleDelete = (id: string) => {
    // Check if this is the default method
    const isDefault = paymentMethods.find((method) => method.id === id)?.isDefault

    if (isDefault && paymentMethods.length > 1) {
      // Find another enabled method to set as default
      const firstOtherId = paymentMethods.find((method) => method.id !== id && method.isEnabled)?.id

      // Set the other method as default and remove this one
      if (firstOtherId) {
        setPaymentMethods(
          paymentMethods
            .filter((method) => method.id !== id)
            .map((method) => ({
              ...method,
              isDefault: method.id === firstOtherId,
            })),
        )
        toast.success("Another payment method was set as default")
      } else {
        toast.error("Cannot delete the only default payment method")
        return
      }
    } else {
      setPaymentMethods(paymentMethods.filter((method) => method.id !== id))
    }

    toast.success("Payment method deleted successfully")
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    resetForm()
  }

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    // If disabling the default method, we need to set another one as default
    const method = paymentMethods.find((m) => m.id === id)

    if (method?.isDefault && !enabled) {
      // Find another enabled method to set as default
      const firstOtherId = paymentMethods.find((m) => m.id !== id && m.isEnabled)?.id

      if (firstOtherId) {
        setPaymentMethods(
          paymentMethods.map((m) => ({
            ...m,
            isEnabled: m.id === id ? enabled : m.isEnabled,
            isDefault: m.id === firstOtherId,
          })),
        )
        toast.success("Another payment method was set as default")
      } else {
        toast.error("Cannot disable the only enabled payment method")
        return
      }
    } else {
      setPaymentMethods(
        paymentMethods.map((m) => ({
          ...m,
          isEnabled: m.id === id ? enabled : m.isEnabled,
        })),
      )
    }

    toast.success(`Payment method ${enabled ? "enabled" : "disabled"} successfully`)
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-card border rounded-md p-4 mb-6">
          <h3 className="text-lg font-medium mb-4">{isAdding ? "Add New Payment Method" : "Edit Payment Method"}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Method Name</Label>
              <Input
                id="name"
                value={newMethod.name}
                onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                placeholder="e.g., Credit Card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Method Code</Label>
              <Input
                id="code"
                value={newMethod.code}
                onChange={(e) => setNewMethod({ ...newMethod, code: e.target.value.toUpperCase() })}
                placeholder="e.g., CREDIT_CARD"
              />
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <Label htmlFor="processingFee">Processing Fee (%)</Label>
            <div className="relative">
              <Input
                id="processingFee"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={newMethod.processingFee.toString()}
                onChange={(e) => setNewMethod({ ...newMethod, processingFee: Number.parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 2.9"
                className="pl-9"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>

          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="isEnabled"
                checked={newMethod.isEnabled}
                onCheckedChange={(checked) => setNewMethod({ ...newMethod, isEnabled: checked })}
              />
              <Label htmlFor="isEnabled">Enable Payment Method</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={newMethod.isDefault}
                disabled={!newMethod.isEnabled}
                onCheckedChange={(checked) => setNewMethod({ ...newMethod, isDefault: checked })}
              />
              <Label htmlFor="isDefault" className={!newMethod.isEnabled ? "text-muted-foreground" : ""}>
                Set as Default Payment Method
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>

            <Button
              onClick={isAdding ? handleAdd : handleUpdate}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {isAdding ? "Add Payment Method" : "Update Payment Method"}
            </Button>
          </div>
        </div>
      )}

      {/* Action Button */}
      {!isAdding && !editingId && (
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Payment Method
        </Button>
      )}

      {/* Payment Methods Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-[120px]">Processing Fee</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[120px]">Default</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No payment methods found. Add your first payment method.
                  </TableCell>
                </TableRow>
              ) : (
                paymentMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">{method.name}</span>
                          <span className="text-xs text-muted-foreground">{method.code}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{method.processingFee}%</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Switch
                          checked={method.isEnabled}
                          onCheckedChange={(checked) => handleToggleEnabled(method.id, checked)}
                          className="mr-2"
                        />
                        <span className={method.isEnabled ? "text-green-600" : "text-muted-foreground"}>
                          {method.isEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {method.isDefault ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span>Default</span>
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(method.id)} className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(method.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
