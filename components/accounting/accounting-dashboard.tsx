"use client"

import { useEffect, useMemo, useState } from "react"
import { CreditCard, FileText, Loader2, Package, Plus, RefreshCw, Search, Trash2, Users, Eye, Pencil } from "lucide-react"
import { ServicesAPI } from "@/lib/api/service"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-hot-toast"

type Provider = "TSHUL" | "NEPURIX"
type Resource = "customers" | "items" | "sales-invoices"

const valueOf = (row: any, keys: string[], fallback = "—") => {
  for (const key of keys) if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") return String(row[key])
  return fallback
}
const rowId = (row: any) => row?.Id ?? row?.id ?? row?.ReferenceId ?? row?.referenceId ?? row?.CustomerId ?? row?.customerId

// Human-readable labels for JSON keys
const humanLabel = (key: string): string => {
  const map: Record<string, string> = {
    Name: "Name", name: "Name",
    PanNo: "PAN No", panNo: "PAN No",
    Address: "Address", address: "Address",
    City: "City", city: "City",
    Province: "Province", province: "Province",
    PostalCode: "Postal Code", postalCode: "Postal Code",
    Country: "Country", country: "Country",
    Phone: "Phone", phone: "Phone",
    Email: "Email", email: "Email",
    ContactPerson: "Contact Person", contactPerson: "Contact Person",
    ContactPersonPhone: "Contact Person Phone", contactPersonPhone: "Contact Person Phone",
    ReferenceId: "Reference ID", referenceId: "Reference ID",
    Website: "Website", website: "Website",
    Bank: "Bank", bank: "Bank",
    AcNo: "Account No", acNo: "Account No",
    AcName: "Account Name", acName: "Account Name",
    CustomerId: "Customer ID", customerId: "Customer ID",
    Notes: "Notes", notes: "Notes",
    Code: "Code", code: "Code",
    Unit: "Unit", unit: "Unit",
    SalesRate: "Sales Rate", salesRate: "Sales Rate",
    IsTaxable: "Taxable", isTaxable: "Taxable",
    IsSalesItem: "Sales Item", isSalesItem: "Sales Item",
    IsServiceItem: "Service Item", isServiceItem: "Service Item",
    IsTSCApplied: "TSC Applied", isTSCApplied: "TSC Applied",
    ItemGroupReferenceId: "Item Group Ref ID", itemGroupReferenceId: "Item Group Ref ID",
    Id: "ID", id: "ID",
    Status: "Status", status: "Status",
    InvoiceNo: "Invoice No", invoiceNo: "Invoice No",
    InvoiceType: "Invoice Type", invoiceType: "Invoice Type",
    PaymentMode: "Payment Mode", paymentMode: "Payment Mode",
    Date: "Date", date: "Date",
    SubTotal: "Sub Total", subTotal: "Sub Total",
    TaxableAmount: "Taxable Amount", taxableAmount: "Taxable Amount",
    NetAmount: "Net Amount", netAmount: "Net Amount",
    Customer: "Customer", customer: "Customer",
    GeneralLedgerId: "General Ledger ID",
    GeneralLedgers: "General Ledgers",
    IsTdsEnabled: "TDS Enabled",
    TdsId: "TDS ID",
    TdsRate: "TDS Rate",
    AgentId: "Agent ID",
    Agent: "Agent",
    AreaId: "Area ID",
    Area: "Area",
    Username: "Username",
    CustomerTypeId: "Customer Type ID",
    CustomerType: "Customer Type",
  }
  return map[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).trim()
}

// Field definitions for each resource/provider form
interface FieldDef {
  key: string
  label: string
  type: "text" | "number" | "email" | "tel" | "toggle"
  placeholder?: string
  defaultValue?: string | number | boolean
}

const getCustomerFields = (provider: Provider): FieldDef[] => {
  const common: FieldDef[] = [
    { key: provider === "TSHUL" ? "Name" : "name", label: "Name", type: "text", placeholder: "Customer name" },
    { key: provider === "TSHUL" ? "PanNo" : "panNo", label: "PAN No", type: "text", placeholder: "PAN number" },
    { key: provider === "TSHUL" ? "Address" : "address", label: "Address", type: "text", placeholder: "Street address" },
    { key: provider === "TSHUL" ? "City" : "city", label: "City", type: "text", placeholder: "City" },
    { key: provider === "TSHUL" ? "Province" : "province", label: "Province", type: "text", placeholder: "Province" },
    { key: provider === "TSHUL" ? "PostalCode" : "postalCode", label: "Postal Code", type: "text", placeholder: "Postal code" },
    { key: provider === "TSHUL" ? "Country" : "country", label: "Country", type: "text", placeholder: "Country", defaultValue: "Nepal" },
    { key: provider === "TSHUL" ? "Phone" : "phone", label: "Phone", type: "tel", placeholder: "Phone number" },
    { key: provider === "TSHUL" ? "Email" : "email", label: "Email", type: "email", placeholder: "Email address" },
    { key: provider === "TSHUL" ? "ContactPerson" : "contactPerson", label: "Contact Person", type: "text", placeholder: "Contact person name" },
    { key: provider === "TSHUL" ? "ContactPersonPhone" : "contactPersonPhone", label: "Contact Person Phone", type: "tel", placeholder: "Contact person phone" },
  ]
  if (provider === "TSHUL") {
    return [
      ...common,
      { key: "ReferenceId", label: "Reference ID", type: "text", placeholder: "Reference ID" },
    ]
  }
  return common
}

const getItemFields = (provider: Provider): FieldDef[] => {
  const common: FieldDef[] = [
    { key: "Name", label: "Name", type: "text", placeholder: "Item name" },
    { key: "Code", label: "Code", type: "text", placeholder: "Item code" },
    { key: "Unit", label: "Unit", type: "text", placeholder: "e.g. Psc", defaultValue: "Psc" },
    { key: "SalesRate", label: "Sales Rate", type: "number", placeholder: "0", defaultValue: 0 },
    { key: "IsTaxable", label: "Taxable", type: "toggle", defaultValue: true },
    { key: "IsSalesItem", label: "Sales Item", type: "toggle", defaultValue: true },
    { key: "IsServiceItem", label: "Service Item", type: "toggle", defaultValue: true },
  ]
  if (provider === "TSHUL") {
    return [
      ...common,
      { key: "ReferenceId", label: "Reference ID", type: "text", placeholder: "Reference ID" },
      { key: "ItemGroupReferenceId", label: "Item Group Ref ID", type: "text", placeholder: "e.g. TI-001", defaultValue: "TI-001" },
    ]
  }
  // NEPURIX
  return [
    ...common,
    { key: "ReferenceId", label: "Reference ID", type: "text", placeholder: "Reference ID" },
    { key: "IsTSCApplied", label: "TSC Applied", type: "toggle", defaultValue: false },
  ]
}

// Build default form data from field definitions
const buildDefaults = (fields: FieldDef[]): Record<string, any> => {
  const data: Record<string, any> = {}
  for (const f of fields) {
    data[f.key] = f.defaultValue !== undefined ? f.defaultValue : (f.type === "number" ? 0 : f.type === "toggle" ? false : "")
  }
  return data
}

// ========== FormFields component ==========
function FormFields({
  fields,
  formData,
  onChange,
}: {
  fields: FieldDef[]
  formData: Record<string, any>
  onChange: (key: string, value: any) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => (
        <div key={field.key} className={field.type === "toggle" ? "flex items-center justify-between rounded-lg border p-3" : "space-y-2"}>
          {field.type === "toggle" ? (
            <>
              <Label htmlFor={field.key} className="text-sm font-medium">{field.label}</Label>
              <Switch
                id={field.key}
                checked={!!formData[field.key]}
                onCheckedChange={(checked) => onChange(field.key, checked)}
              />
            </>
          ) : (
            <>
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.key] ?? ""}
                onChange={(e) =>
                  onChange(field.key, field.type === "number" ? Number(e.target.value) || 0 : e.target.value)
                }
              />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// ========== DetailsView component ==========
function DetailsView({ data }: { data: any }) {
  if (!data || typeof data !== "object") return <p className="text-muted-foreground">No data available</p>

  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== "")

  return (
    <div className="space-y-1">
      {entries.map(([key, value]) => {
        const isNested = typeof value === "object" && !Array.isArray(value)
        const isArray = Array.isArray(value)

        return (
          <div key={key} className="grid grid-cols-3 gap-2 py-2 border-b border-border/50 last:border-0">
            <div className="text-sm font-medium text-muted-foreground col-span-1">{humanLabel(key)}</div>
            <div className="text-sm col-span-2 break-all">
              {typeof value === "boolean" ? (
                <Badge variant={value ? "default" : "outline"}>{value ? "Yes" : "No"}</Badge>
              ) : isNested ? (
                <pre className="text-xs bg-muted rounded p-2 whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
              ) : isArray ? (
                <pre className="text-xs bg-muted rounded p-2 whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
              ) : (
                <span>{String(value)}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function InvoiceForm({
  provider,
  customers,
  items,
  payload,
  setPayload,
}: {
  provider: Provider
  customers: any[]
  items: any[]
  payload: any
  setPayload: React.Dispatch<React.SetStateAction<any>>
}) {
  const isTshul = provider === "TSHUL"

  const calculateTotals = (details: any[]) => {
    let subTotal = 0
    details.forEach((d) => {
      const qty = Number(d[isTshul ? "Quantity" : "quantity"] || 0)
      const rate = Number(d[isTshul ? "Rate" : "rate"] || 0)
      subTotal += qty * rate
    })
    return {
      subTotal: Number(subTotal.toFixed(2)),
      taxableAmount: Number(subTotal.toFixed(2)),
      netAmount: Number((subTotal * 1.13).toFixed(2)), // Default 13% tax/VAT
    }
  }

  const handleDetailChange = (index: number, field: string, value: any) => {
    const detailKey = isTshul ? "Detail" : "detail"
    const newDetails = [...(payload[detailKey] || [])]
    newDetails[index] = { ...newDetails[index], [field]: value }

    if (field === "rate" || field === "Rate" || field === "quantity" || field === "Quantity") {
      const qty = Number(newDetails[index][isTshul ? "Quantity" : "quantity"] || 0)
      const rate = Number(newDetails[index][isTshul ? "Rate" : "rate"] || 0)
      const basicAmount = Number((qty * rate).toFixed(2))
      newDetails[index][isTshul ? "BasicAmount" : "basicAmount"] = basicAmount
      newDetails[index][isTshul ? "Amount" : "amount"] = basicAmount
    }

    const updatedPayload = { ...payload, [detailKey]: newDetails }
    const totals = calculateTotals(newDetails)
    updatedPayload[isTshul ? "SubTotal" : "subTotal"] = totals.subTotal
    updatedPayload[isTshul ? "TaxableAmount" : "taxableAmount"] = totals.taxableAmount
    updatedPayload[isTshul ? "NetAmount" : "netAmount"] = totals.netAmount
    if (!isTshul) {
      updatedPayload.packageAmount = totals.netAmount
    }

    setPayload(updatedPayload)
  }

  const addDetailRow = () => {
    const detailKey = isTshul ? "Detail" : "detail"
    const newRow = isTshul
      ? { Item: "", Quantity: 1, Rate: 0, BasicAmount: 0, Amount: 0, Tax: "VAT" }
      : { item: "", quantity: 1, rate: 0, basicAmount: 0, amount: 0, tax: "VAT" }
    setPayload({ ...payload, [detailKey]: [...(payload[detailKey] || []), newRow] })
  }

  const removeDetailRow = (index: number) => {
    const detailKey = isTshul ? "Detail" : "detail"
    const newDetails = (payload[detailKey] || []).filter((_: any, i: number) => i !== index)
    
    const updatedPayload = { ...payload, [detailKey]: newDetails }
    const totals = calculateTotals(newDetails)
    updatedPayload[isTshul ? "SubTotal" : "subTotal"] = totals.subTotal
    updatedPayload[isTshul ? "TaxableAmount" : "taxableAmount"] = totals.taxableAmount
    updatedPayload[isTshul ? "NetAmount" : "netAmount"] = totals.netAmount
    if (!isTshul) {
      updatedPayload.packageAmount = totals.netAmount
    }
    setPayload(updatedPayload)
  }

  const handleFieldChange = (field: string, value: any) => {
    setPayload({ ...payload, [field]: value })
  }

  const handleItemSelect = (index: number, itemName: string) => {
    const matchedItem = items.find((it) => (it.Name || it.name || "") === itemName)
    const rate = matchedItem ? Number(matchedItem.SalesRate || matchedItem.salesRate || 0) : 0
    const detailKey = isTshul ? "Detail" : "detail"
    const newDetails = [...(payload[detailKey] || [])]
    
    newDetails[index] = {
      ...newDetails[index],
      [isTshul ? "Item" : "item"]: itemName,
      [isTshul ? "Rate" : "rate"]: rate,
      [isTshul ? "BasicAmount" : "basicAmount"]: Number((rate * (newDetails[index][isTshul ? "Quantity" : "quantity"] || 1)).toFixed(2)),
      [isTshul ? "Amount" : "amount"]: Number((rate * (newDetails[index][isTshul ? "Quantity" : "quantity"] || 1)).toFixed(2)),
      [isTshul ? "Tax" : "tax"]: matchedItem?.IsTaxable ? "VAT" : "None",
    }

    const updatedPayload = { ...payload, [detailKey]: newDetails }
    const totals = calculateTotals(newDetails)
    updatedPayload[isTshul ? "SubTotal" : "subTotal"] = totals.subTotal
    updatedPayload[isTshul ? "TaxableAmount" : "taxableAmount"] = totals.taxableAmount
    updatedPayload[isTshul ? "NetAmount" : "netAmount"] = totals.netAmount
    if (!isTshul) {
      updatedPayload.packageAmount = totals.netAmount
    }
    setPayload(updatedPayload)
  }

  const handleCustomerSelect = (custValue: string) => {
    if (isTshul) {
      handleFieldChange("CustomerReferenceId", custValue)
    } else {
      const matched = customers.find((c) => String(rowId(c)) === custValue)
      const name = matched ? (matched.Name || matched.name || matched.customerName || "") : custValue
      handleFieldChange("customer", name)
    }
  }

  const invoiceType = payload[isTshul ? "InvoiceType" : "invoiceType"] ?? "Cash"
  const paymentMode = payload[isTshul ? "PaymentMode" : "paymentMode"] ?? "Cash"
  const customerVal = isTshul ? (payload.CustomerReferenceId ?? "") : (customers.find((c) => (c.Name || c.name || "") === payload.customer) ? String(rowId(customers.find((c) => (c.Name || c.name || "") === payload.customer))) : "")
  const dateVal = payload[isTshul ? "Date" : "date"] ?? ""
  const subTotal = payload[isTshul ? "SubTotal" : "subTotal"] ?? 0
  const taxableAmount = payload[isTshul ? "TaxableAmount" : "taxableAmount"] ?? 0
  const netAmount = payload[isTshul ? "NetAmount" : "netAmount"] ?? 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Invoice Type</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={invoiceType}
            onChange={(e) => handleFieldChange(isTshul ? "InvoiceType" : "invoiceType", e.target.value)}
          >
            <option value="Cash">Cash</option>
            <option value="Credit">Credit</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Payment Mode {invoiceType === "Cash" && "*"}</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={paymentMode}
            onChange={(e) => handleFieldChange(isTshul ? "PaymentMode" : "paymentMode", e.target.value)}
            disabled={invoiceType === "Credit"}
          >
            <option value="Cash">Cash</option>
            <option value="Fonepay">Fonepay</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Wallet">Wallet</option>
            <option value="eSewa">eSewa</option>
            <option value="Khalti">Khalti</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Customer *</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={customerVal}
            onChange={(e) => handleCustomerSelect(e.target.value)}
          >
            <option value="">Select customer</option>
            {customers.map((c, i) => (
              <option key={i} value={String(rowId(c))}>
                {c.Name || c.name || c.customerName} (Ref: {rowId(c)})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Invoice Date (Nepali Date YYYY-MM-DD) *</Label>
          <Input
            value={dateVal}
            onChange={(e) => handleFieldChange(isTshul ? "Date" : "date", e.target.value)}
            placeholder="e.g. 2083-02-26"
          />
        </div>

        {!isTshul && (
          <div className="space-y-2">
            <Label>Package Name</Label>
            <Input
              value={payload.package ?? ""}
              onChange={(e) => handleFieldChange("package", e.target.value)}
              placeholder="e.g. 50Mbps-PR"
            />
          </div>
        )}
      </div>

      {!isTshul && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Package Amount</Label>
            <Input
              type="number"
              value={payload.packageAmount ?? 0}
              onChange={(e) => handleFieldChange("packageAmount", Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Activation Date (YYYY-MM-DD)</Label>
            <Input
              value={payload.activationDate ?? ""}
              onChange={(e) => handleFieldChange("activationDate", e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div className="space-y-2">
            <Label>Deactivation Date (YYYY-MM-DD)</Label>
            <Input
              value={payload.deactivationDate ?? ""}
              onChange={(e) => handleFieldChange("deactivationDate", e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Remarks / Notes</Label>
        <Textarea
          value={isTshul ? (payload.Notes ?? "") : (payload.remarks ?? "")}
          onChange={(e) => handleFieldChange(isTshul ? "Notes" : "remarks", e.target.value)}
          placeholder="Enter remarks..."
          rows={2}
        />
      </div>

      <div className="space-y-2 border rounded-lg p-3">
        <div className="flex items-center justify-between border-b pb-2">
          <Label className="text-sm font-semibold">Line Items (Details) *</Label>
          <Button type="button" size="sm" variant="outline" onClick={addDetailRow}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Row
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-[100px]">Qty</TableHead>
                <TableHead className="w-[120px]">Rate</TableHead>
                <TableHead className="w-[150px]">Tax</TableHead>
                <TableHead className="w-[120px] text-right">Amount</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payload[isTshul ? "Detail" : "detail"] || []).map((detail: any, index: number) => {
                const itemVal = detail[isTshul ? "Item" : "item"] ?? ""
                const qtyVal = detail[isTshul ? "Quantity" : "quantity"] ?? 1
                const rateVal = detail[isTshul ? "Rate" : "rate"] ?? 0
                const taxVal = detail[isTshul ? "Tax" : "tax"] ?? "VAT"
                const amountVal = detail[isTshul ? "Amount" : "amount"] ?? 0

                return (
                  <TableRow key={index}>
                    <TableCell>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={itemVal}
                        onChange={(e) => handleItemSelect(index, e.target.value)}
                      >
                        <option value="">Select Item</option>
                        {items.map((it, i) => (
                          <option key={i} value={it.Name || it.name}>
                            {it.Name || it.name}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-9 text-xs"
                        min={1}
                        value={qtyVal}
                        onChange={(e) => handleDetailChange(index, isTshul ? "Quantity" : "quantity", Number(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-9 text-xs"
                        value={rateVal}
                        onChange={(e) => handleDetailChange(index, isTshul ? "Rate" : "rate", Number(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={taxVal}
                        onChange={(e) => handleDetailChange(index, isTshul ? "Tax" : "tax", e.target.value)}
                      >
                        <option value="VAT">VAT (13%)</option>
                        <option value="TSC">TSC (13%)</option>
                        <option value="TSC + VAT">TSC + VAT</option>
                        <option value="None">None (0%)</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right font-medium text-xs">
                      NPR {amountVal.toLocaleString("en-NP", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeDetailRow(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!payload[isTshul ? "Detail" : "detail"] || payload[isTshul ? "Detail" : "detail"].length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground text-xs py-4">
                    No line items added yet. Click "Add Row" to add.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 border-t pt-3">
        <div className="grid grid-cols-2 gap-4 text-sm w-[300px]">
          <div className="text-muted-foreground">Subtotal:</div>
          <div className="text-right font-medium">NPR {subTotal.toLocaleString("en-NP", { minimumFractionDigits: 2 })}</div>

          <div className="text-muted-foreground flex items-center gap-1">
            <span>Taxable Amt:</span>
          </div>
          <div className="text-right font-medium">
            <Input
              type="number"
              className="h-7 text-right text-xs"
              value={taxableAmount}
              onChange={(e) => handleFieldChange(isTshul ? "TaxableAmount" : "taxableAmount", Number(e.target.value) || 0)}
            />
          </div>

          <div className="text-base font-bold text-foreground">Net Total:</div>
          <div className="text-right font-bold text-foreground">
            <Input
              type="number"
              className="h-8 text-right text-sm font-bold"
              value={netAmount}
              onChange={(e) => handleFieldChange(isTshul ? "NetAmount" : "netAmount", Number(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ========== Main Dashboard ==========
export function AccountingDashboard({ provider }: { provider: Provider }) {
  const [data, setData] = useState<any>({ totals: {}, customers: [], items: [], salesInvoices: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [resource, setResource] = useState<Resource>("customers")
  const [selected, setSelected] = useState<any>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [invoiceJson, setInvoiceJson] = useState("")
  const [invoicePayload, setInvoicePayload] = useState<any>(null)
  const [useFormEditor, setUseFormEditor] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  // Pagination states
  const [page, setPage] = useState(1)
  const limit = 10

  const load = async () => {
    setLoading(true)
    try {
      const response = await ServicesAPI.getAccountingDashboard(provider)
      setData(response.data || { totals: {}, customers: [], items: [], salesInvoices: [] })
    } catch (error: any) { toast.error(error.message || `Failed to load ${provider}`) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [provider])

  useEffect(() => {
    setPage(1)
  }, [resource, search])

  const rows = resource === "customers" ? data.customers : resource === "items" ? data.items : data.salesInvoices
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows || []
    return (rows || []).filter((row: any) => JSON.stringify(row).toLowerCase().includes(term))
  }, [rows, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
  const paginatedRows = useMemo(() => {
    return filtered.slice((page - 1) * limit, page * limit)
  }, [filtered, page])

  // Get fields for current resource and provider
  const currentFields = resource === "customers" ? getCustomerFields(provider) : resource === "items" ? getItemFields(provider) : []
  const isInvoice = resource === "sales-invoices"

  const handleFormChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const startCreate = () => {
    setEditingId(null)
    setUseFormEditor(true)
    if (isInvoice) {
      const template = provider === "TSHUL"
        ? { InvoiceType: "Cash", PaymentMode: "Cash", Date: "", CustomerReferenceId: "", SubTotal: 0, TaxableAmount: 0, NetAmount: 0, Detail: [] }
        : { invoiceType: "Cash", paymentMode: "Cash", customer: "", date: "", remarks: "", subTotal: 0, taxableAmount: 0, discount: null, netAmount: 0, package: "", packageAmount: 0, activationDate: "", deactivationDate: "", detail: [], finTagDetail: [] }
      setInvoicePayload(template)
      setInvoiceJson(JSON.stringify(template, null, 2))
    } else {
      setFormData(buildDefaults(currentFields))
    }
    setEditorOpen(true)
  }

  const startEdit = async (row: any) => {
    const id = rowId(row)
    if (id === undefined || id === null) return toast.error("This record has no editable ID")
    setUseFormEditor(true)
    try {
      const response = await ServicesAPI.getAccountingResource(provider, resource, id)
      const rawData = response.data?.Data ?? response.data?.data ?? response.data ?? {}
      setEditingId(id)
      if (isInvoice) {
        setInvoicePayload(rawData)
        setInvoiceJson(JSON.stringify(rawData, null, 2))
      } else {
        // Map API response to form data using field keys
        const mapped: Record<string, any> = {}
        for (const field of currentFields) {
          mapped[field.key] = rawData[field.key] ?? ""
        }
        setFormData(mapped)
      }
      setEditorOpen(true)
    } catch (error: any) { toast.error(error.message || "Failed to load complete details") }
  }

  const save = async () => {
    let payload: any
    if (isInvoice) {
      if (useFormEditor) {
        payload = invoicePayload
      } else {
        try { payload = JSON.parse(invoiceJson) } catch { return toast.error("JSON is invalid") }
      }

      // Check required fields for invoice payload
      const isTshul = provider === "TSHUL"
      const details = payload[isTshul ? "Detail" : "detail"] || []
      const cust = isTshul ? payload.CustomerReferenceId : payload.customer
      const dt = isTshul ? payload.Date : payload.date

      if (!cust) return toast.error("Customer is required")
      if (!dt) return toast.error("Date is required")
      if (details.length === 0) return toast.error("At least one line item (detail) is required")
    } else {
      payload = { ...formData }
    }
    setSaving(true)
    try {
      if (editingId === null) await ServicesAPI.createAccountingResource(provider, resource, payload)
      else await ServicesAPI.updateAccountingResource(provider, resource, editingId, payload)
      toast.success(`${resource.replace("-", " ")} ${editingId === null ? "created" : "updated"}`)
      setEditorOpen(false)
      await load()
    } catch (error: any) { toast.error(error.message || "Save failed") }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const id = rowId(deleteTarget)
    if (id === undefined || id === null) return toast.error("This record has no ID to delete")
    setDeleting(true)
    try {
      await ServicesAPI.deleteAccountingResource(provider, resource, id)
      toast.success(`${resource.replace("-", " ")} deleted successfully`)
      setDeleteTarget(null)
      await load()
    } catch (error: any) { toast.error(error.message || "Delete failed") }
    finally { setDeleting(false) }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <CardContainer title="Customers" gradientColor="#10b981"><div className="flex items-center gap-3 py-2"><Users className="h-8 w-8 text-emerald-500"/><span className="text-3xl font-bold">{data.totals?.customers || 0}</span></div></CardContainer>
        <CardContainer title="Items" gradientColor="#3b82f6"><div className="flex items-center gap-3 py-2"><Package className="h-8 w-8 text-blue-500"/><span className="text-3xl font-bold">{data.totals?.items || 0}</span></div></CardContainer>
        <CardContainer title="Sales Invoices" gradientColor="#8b5cf6"><div className="flex items-center gap-3 py-2"><FileText className="h-8 w-8 text-violet-500"/><span className="text-3xl font-bold">{data.totals?.salesInvoices || 0}</span></div></CardContainer>
        <CardContainer title="Invoice Amount" gradientColor="#f59e0b"><div className="flex items-center gap-3 py-2"><CreditCard className="h-8 w-8 text-amber-500"/><span className="text-2xl font-bold">NPR {Number(data.totals?.invoiceAmount || 0).toLocaleString("en-NP")}</span></div></CardContainer>
      </div>

      {/* Error Banner */}
      {Object.values(data.errors || {}).some(Boolean) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-900 dark:text-amber-200">
          Some provider collections could not be loaded: {Object.entries(data.errors || {}).filter(([, error]) => error).map(([name, error]) => `${name}: ${error}`).join("; ")}
        </div>
      )}

      {/* Main Data Table */}
      <CardContainer
        title={`${provider === "TSHUL" ? "Tshul" : "Nepurix"} Accounting`}
        description="Customers, catalog items, and sales invoices from the accounting service"
        actions={[{ label: "Refresh", onClick: load, icon: <RefreshCw className="h-4 w-4"/>, variant: "outline" }]}
      >
        <Tabs value={resource} onValueChange={value => setResource(value as Resource)}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <TabsList>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="sales-invoices">Sales Invoices</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                <Input className="pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..."/>
              </div>
              <Button onClick={startCreate}><Plus className="mr-2 h-4 w-4"/>Add</Button>
            </div>
          </div>

          {(["customers", "items", "sales-invoices"] as Resource[]).map(tab => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name / Number</TableHead>
                      <TableHead>Reference / Contact</TableHead>
                      <TableHead>Amount / Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5}><div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin"/></div></TableCell></TableRow>
                    ) : paginatedRows.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">No records found.</TableCell></TableRow>
                    ) : paginatedRows.map((row: any, index: number) => (
                      <TableRow key={`${rowId(row) ?? index}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{valueOf(row, ["Name","name","Customer","customer","InvoiceNo","invoiceNo"])}</div>
                          <div className="text-xs text-muted-foreground">ID: {rowId(row) ?? "—"}</div>
                        </TableCell>
                        <TableCell>{valueOf(row, ["ReferenceId","referenceId","Email","email","Phone","phone"])}</TableCell>
                        <TableCell>{valueOf(row, ["NetAmount","netAmount","SalesRate","salesRate","Rate","rate"], "0")}</TableCell>
                        <TableCell><Badge variant="outline">{valueOf(row, ["Status","status","InvoiceType","invoiceType"], "Active")}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setSelected(row)} title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => startEdit(row)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {tab !== "sales-invoices" && (
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(row)} title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Pagination Controls */}
        <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>Showing {filtered.length ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, filtered.length)} of {filtered.length}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(1)}>First</Button>
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(prev => prev - 1)}>Prev</Button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(prev => prev + 1)}>Next</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(totalPages)}>Last</Button>
          </div>
        </div>
      </CardContainer>

      {/* Details Dialog - Structured View */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {resource === "customers" ? "Customer" : resource === "items" ? "Item" : "Invoice"} Details
            </DialogTitle>
            <DialogDescription>
              Complete details for {valueOf(selected, ["Name", "name", "Customer", "customer", "InvoiceNo", "invoiceNo"])}
            </DialogDescription>
          </DialogHeader>
          <DetailsView data={selected} />
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog - Proper Form UI */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editingId === null ? "Create" : "Update"} {resource === "customers" ? "Customer" : resource === "items" ? "Item" : "Sales Invoice"}</DialogTitle>
            <DialogDescription>
              {isInvoice
                ? `Provide the sales invoice details. You can toggle between Form Editor and JSON view.`
                : `Fill in the fields below. Required fields are marked with the field label.`
              }
            </DialogDescription>
          </DialogHeader>

          {isInvoice ? (
            <div className="space-y-4">
              <div className="flex justify-end gap-2 border-b pb-2">
                <Button
                  type="button"
                  variant={useFormEditor ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (!useFormEditor) {
                      try {
                        const parsed = JSON.parse(invoiceJson)
                        setInvoicePayload(parsed)
                      } catch (e) {
                        toast.error("Cannot switch to Form: JSON code contains syntax errors")
                        return
                      }
                    }
                    setUseFormEditor(true)
                  }}
                >
                  Form Editor
                </Button>
                <Button
                  type="button"
                  variant={!useFormEditor ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (useFormEditor) {
                      setInvoiceJson(JSON.stringify(invoicePayload, null, 2))
                    }
                    setUseFormEditor(false)
                  }}
                >
                  JSON Code
                </Button>
              </div>

              {useFormEditor ? (
                <InvoiceForm
                  provider={provider}
                  customers={data.customers || []}
                  items={data.items || []}
                  payload={invoicePayload}
                  setPayload={setInvoicePayload}
                />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="invoiceJson">Invoice Payload (JSON)</Label>
                  <Textarea
                    id="invoiceJson"
                    className="font-mono text-xs min-h-[350px]"
                    rows={15}
                    value={invoiceJson}
                    onChange={(e) => setInvoiceJson(e.target.value)}
                  />
                </div>
              )}
            </div>
          ) : (
            <FormFields
              fields={currentFields}
              formData={formData}
              onChange={handleFormChange}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              {editingId === null ? "Create" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={`Delete ${resource === "customers" ? "Customer" : "Item"}`}
        description={`Are you sure you want to delete "${valueOf(deleteTarget, ["Name", "name"])}"? This action cannot be undone and will remove the record from ${provider}.`}
        onConfirm={() => handleDelete()}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </div>
  )
}
