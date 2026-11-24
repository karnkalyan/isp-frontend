"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"

type LineItem = {
  itemName: string
  quantity: string
  unitPrice: string
  referenceId: string
  isTaxable: boolean
}

export function CreateCustomInvoiceModal({
  open,
  onOpenChange,
  fixedCustomerId,
  fixedCustomerName,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  fixedCustomerId?: number
  fixedCustomerName?: string
  onCreated?: () => void | Promise<void>
}) {
  const [customerId, setCustomerId] = useState(fixedCustomerId ? String(fixedCustomerId) : "")
  const [customerSearch, setCustomerSearch] = useState("")
  const [customers, setCustomers] = useState<any[]>([])
  const [catalogItems, setCatalogItems] = useState<any[]>([])
  const [fiscalYears, setFiscalYears] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [fiscalYearId, setFiscalYearId] = useState("")
  const [paymentMethodId, setPaymentMethodId] = useState("")
  const [invoiceType, setInvoiceType] = useState<"cash" | "credit">("cash")
  const [invoiceId, setInvoiceId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [items, setItems] = useState<LineItem[]>([
    { itemName: "", quantity: "1", unitPrice: "", referenceId: "", isTaxable: true }
  ])

  useEffect(() => {
    if (!open) return
    if (fixedCustomerId) setCustomerId(String(fixedCustomerId))
    Promise.all([
      apiRequest<any[]>("/extra-charges").catch(() => []),
      apiRequest<any[]>("/billing/fiscal-years").catch(() => []),
      apiRequest<any[]>("/billing/payment-methods?enabled=true").catch(() => []),
      ...(fixedCustomerId ? [] : [apiRequest<any>("/customer?limit=50").catch(() => [])])
    ]).then(([charges, years, methods, custRes]) => {
      setCatalogItems(Array.isArray(charges) ? charges : [])
      setFiscalYears(Array.isArray(years) ? years : [])
      setFiscalYearId(String((years || []).find((y: any) => y.isActive)?.id || ""))
      setPaymentMethods(Array.isArray(methods) ? methods : [])
      setPaymentMethodId(String((methods || []).find((m: any) => m.isDefault)?.id || methods?.[0]?.id || ""))
      if (!fixedCustomerId && custRes) {
        const list = Array.isArray(custRes) ? custRes : (custRes?.data || [])
        setCustomers(list)
      }
    })
  }, [open, fixedCustomerId])

  useEffect(() => {
    if (!open || fixedCustomerId) return
    const q = customerSearch.trim()
    const timer = setTimeout(() => {
      const endpoint = q ? `/customer?search=${encodeURIComponent(q)}&limit=50` : "/customer?limit=50"
      apiRequest<any>(endpoint, { suppressToast: true })
        .then((custRes) => {
          const list = Array.isArray(custRes) ? custRes : (custRes?.data || [])
          setCustomers(list)
        })
        .catch(() => {})
    }, 250)
    return () => clearTimeout(timer)
  }, [open, fixedCustomerId, customerSearch])

  const addItem = () => {
    setItems(prev => [...prev, { itemName: "", quantity: "1", unitPrice: "", referenceId: "", isTaxable: true }])
  }

  const removeItem = (idx: number) => {
    setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)
  }

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  const handleCatalogPick = (idx: number, chargeId: string) => {
    const found = catalogItems.find(c => String(c.id) === chargeId)
    if (!found) return
    updateItem(idx, {
      itemName: found.name || "",
      unitPrice: String(found.amount ?? 0),
      referenceId: found.referenceId || "",
      isTaxable: found.isTaxable !== false
    })
  }

  const totalAmount = items.reduce((sum, it) => {
    const qty = Math.max(1, Number(it.quantity || 1))
    const price = Math.max(0, Number(it.unitPrice || 0))
    const line = qty * price
    return sum + (it.isTaxable ? line * 1.13 : line)
  }, 0)

  const handleSubmit = async () => {
    const targetCustId = fixedCustomerId || Number(customerId)
    if (!targetCustId) return toast.error("Select a customer")
    const validItems = items.filter(it => it.itemName.trim() && Number(it.unitPrice) >= 0)
    if (validItems.length === 0) return toast.error("Add at least one valid item")
    if (invoiceType === "cash" && !paymentMethodId) return toast.error("Select a payment mode")

    setSubmitting(true)
    try {
      await apiRequest("/billing/create-custom-invoice", {
        method: "POST",
        body: JSON.stringify({
          customerId: targetCustId,
          items: validItems.map(it => ({
            itemName: it.itemName.trim(),
            quantity: Number(it.quantity || 1),
            unitPrice: Number(it.unitPrice || 0),
            referenceId: it.referenceId || undefined,
            isTaxable: it.isTaxable
          })),
          invoiceType,
          paymentMethodId: invoiceType === "cash" ? Number(paymentMethodId) : undefined,
          invoiceId: invoiceType === "cash" ? invoiceId.trim() || undefined : undefined,
          fiscalYearId: fiscalYearId ? Number(fiscalYearId) : undefined
        })
      })
      toast.success("Customer invoice created successfully")
      setItems([{ itemName: "", quantity: "1", unitPrice: "", referenceId: "", isTaxable: true }])
      setInvoiceId("")
      onOpenChange(false)
      if (onCreated) await onCreated()
    } catch (err: any) {
      toast.error(err?.message || "Failed to create invoice")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Customer Invoice</DialogTitle>
          <DialogDescription>
            {fixedCustomerName
              ? `Create an item invoice (Drop Wire, ONT, IPTV, etc.) for ${fixedCustomerName}.`
              : "Select a customer and add one or more billable items."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!fixedCustomerId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Search Customer</Label>
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Filter by name or ID..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers
                      .filter(c => {
                        const q = customerSearch.trim().toLowerCase()
                        if (!q) return true
                        const first = c.firstName || c.lead?.firstName || ""
                        const last = c.lastName || c.lead?.lastName || ""
                        const phone = c.phoneNumber || c.lead?.phoneNumber || ""
                        const name = `${first} ${last} ${c.customerUniqueId || ""} ${phone}`.toLowerCase()
                        return name.includes(q)
                      })
                      .slice(0, 50)
                      .map(c => {
                        const fullName = [c.firstName || c.lead?.firstName, c.middleName || c.lead?.middleName, c.lastName || c.lead?.lastName]
                          .filter(Boolean)
                          .join(" ")
                          .trim()
                        const phone = c.phoneNumber || c.lead?.phoneNumber
                        return (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.customerUniqueId || `CUST-${c.id}`}{fullName ? ` — ${fullName}` : ""}{phone ? ` (${phone})` : ""}
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Invoice Items</Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-7 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            </div>
            <div className="space-y-2.5">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end rounded-lg border p-2.5 bg-muted/20">
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-[11px]">Quick Pick Product</Label>
                    <select
                      onChange={(e) => handleCatalogPick(idx, e.target.value)}
                      defaultValue=""
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="">— Custom / Pick —</option>
                      {catalogItems.map(c => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name} (Rs. {c.amount || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-4 space-y-1">
                    <Label className="text-[11px]">Item Name *</Label>
                    <Input
                      value={it.itemName}
                      onChange={(e) => updateItem(idx, { itemName: e.target.value })}
                      placeholder="e.g. Drop Wire, ONT, IPTV"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-[11px]">Qty / Meter</Label>
                    <Input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-[11px]">Unit Price (NPR)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={it.unitPrice}
                      onChange={(e) => updateItem(idx, { unitPrice: e.target.value })}
                      placeholder="0"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(idx)}
                      className="h-9 w-9 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Invoice Type</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={invoiceType === "cash" ? "default" : "outline"} onClick={() => setInvoiceType("cash")}>
                  Cash (Paid)
                </Button>
                <Button type="button" size="sm" variant={invoiceType === "credit" ? "default" : "outline"} onClick={() => setInvoiceType("credit")}>
                  Credit (Unpaid)
                </Button>
              </div>
            </div>
            {invoiceType === "cash" && (
              <>
                <div className="space-y-1.5">
                  <Label>Payment Mode</Label>
                  <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                    <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Receipt Number (Optional)</Label>
                  <Input value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} placeholder="e.g. 1024" />
                </div>
              </>
            )}
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Amount (incl. applicable 13% VAT)</span>
            <span className="text-lg font-bold text-primary">NPR {Math.round(totalAmount * 100) / 100}</span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
