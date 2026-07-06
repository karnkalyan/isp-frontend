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
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await ServicesAPI.getAccountingDashboard(provider)
      setData(response.data || { totals: {}, customers: [], items: [], salesInvoices: [] })
    } catch (error: any) { toast.error(error.message || `Failed to load ${provider}`) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [provider])

  const rows = resource === "customers" ? data.customers : resource === "items" ? data.items : data.salesInvoices
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows || []
    return (rows || []).filter((row: any) => JSON.stringify(row).toLowerCase().includes(term))
  }, [rows, search])

  // Get fields for current resource and provider
  const currentFields = resource === "customers" ? getCustomerFields(provider) : resource === "items" ? getItemFields(provider) : []
  const isInvoice = resource === "sales-invoices"

  const handleFormChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const startCreate = () => {
    setEditingId(null)
    if (isInvoice) {
      // Sales invoices still use JSON editor because of complex nested structures
      const template = provider === "TSHUL"
        ? { InvoiceType: "Cash", PaymentMode: "Cash", Date: "", CustomerReferenceId: "", SubTotal: 0, TaxableAmount: 0, NetAmount: 0, Detail: [] }
        : { invoiceType: "Cash", paymentMode: "Cash", customer: "", date: "", remarks: "", subTotal: 0, taxableAmount: 0, discount: null, netAmount: 0, package: "", packageAmount: 0, activationDate: "", deactivationDate: "", detail: [], finTagDetail: [] }
      setInvoiceJson(JSON.stringify(template, null, 2))
    } else {
      setFormData(buildDefaults(currentFields))
    }
    setEditorOpen(true)
  }

  const startEdit = async (row: any) => {
    const id = rowId(row)
    if (id === undefined || id === null) return toast.error("This record has no editable ID")
    try {
      const response = await ServicesAPI.getAccountingResource(provider, resource, id)
      const rawData = response.data?.Data ?? response.data?.data ?? response.data ?? {}
      setEditingId(id)
      if (isInvoice) {
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
      try { payload = JSON.parse(invoiceJson) } catch { return toast.error("JSON is invalid") }
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
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">No records found.</TableCell></TableRow>
                    ) : filtered.map((row: any, index: number) => (
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
                ? `Edit the JSON payload for the sales invoice. All supported fields are sent to ${provider}.`
                : `Fill in the fields below. Required fields are marked with the field label.`
              }
            </DialogDescription>
          </DialogHeader>

          {isInvoice ? (
            <Textarea
              className="min-h-[430px] font-mono text-xs"
              value={invoiceJson}
              onChange={e => setInvoiceJson(e.target.value)}
            />
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
