"use client"

import { useEffect, useMemo, useState } from "react"
import { CreditCard, FileText, Loader2, Package, Plus, RefreshCw, Search, Users } from "lucide-react"
import { ServicesAPI } from "@/lib/api/service"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "react-hot-toast"

type Provider = "TSHUL" | "NEPURIX"
type Resource = "customers" | "items" | "sales-invoices"

const unwrapObject = (value: any) => value?.Data ?? value?.data ?? value ?? {}
const valueOf = (row: any, keys: string[], fallback = "—") => {
  for (const key of keys) if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") return String(row[key])
  return fallback
}
const rowId = (row: any) => row?.Id ?? row?.id ?? row?.ReferenceId ?? row?.referenceId ?? row?.CustomerId ?? row?.customerId

const templates: Record<Provider, Record<Resource, any>> = {
  TSHUL: {
    customers: { Name: "", ReferenceId: "", PanNo: "", Address: "", City: "", Province: "", PostalCode: "", Country: "Nepal", Phone: "", Email: "", ContactPerson: "", ContactPersonPhone: "" },
    items: { Name: "", Code: "", Unit: "Psc", ReferenceId: "", ItemGroupReferenceId: "TI-001", IsTaxable: true, IsSalesItem: true, IsServiceItem: true, SalesRate: 0 },
    "sales-invoices": { InvoiceType: "Cash", PaymentMode: "Cash", Date: "", CustomerReferenceId: "", SubTotal: 0, TaxableAmount: 0, NetAmount: 0, Detail: [] }
  },
  NEPURIX: {
    customers: { name: "", panNo: "", address: "", city: "", province: "", postalCode: "", country: "Nepal", phone: "", email: "", contactPerson: "", contactPersonPhone: "" },
    items: { Name: "", Code: "", Unit: "Psc", ReferenceId: "", IsTaxable: true, IsTSCApplied: false, IsSalesItem: true, IsServiceItem: true, SalesRate: 0 },
    "sales-invoices": { invoiceType: "Cash", paymentMode: "Cash", customer: "", date: "", remarks: "", subTotal: 0, taxableAmount: 0, discount: null, netAmount: 0, package: "", packageAmount: 0, activationDate: "", deactivationDate: "", detail: [], finTagDetail: [] }
  }
}

export function AccountingDashboard({ provider }: { provider: Provider }) {
  const [data, setData] = useState<any>({ totals: {}, customers: [], items: [], salesInvoices: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [resource, setResource] = useState<Resource>("customers")
  const [selected, setSelected] = useState<any>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [json, setJson] = useState("")
  const [saving, setSaving] = useState(false)

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

  const startCreate = () => {
    setEditingId(null)
    setJson(JSON.stringify(templates[provider][resource], null, 2))
    setEditorOpen(true)
  }

  const startEdit = async (row: any) => {
    const id = rowId(row)
    if (id === undefined || id === null) return toast.error("This record has no editable ID")
    try {
      const response = await ServicesAPI.getAccountingResource(provider, resource, id)
      setEditingId(id)
      setJson(JSON.stringify(unwrapObject(response.data), null, 2))
      setEditorOpen(true)
    } catch (error: any) { toast.error(error.message || "Failed to load complete details") }
  }

  const save = async () => {
    let payload
    try { payload = JSON.parse(json) } catch { return toast.error("JSON is invalid") }
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <CardContainer title="Customers" gradientColor="#10b981"><div className="flex items-center gap-3 py-2"><Users className="h-8 w-8 text-emerald-500"/><span className="text-3xl font-bold">{data.totals?.customers || 0}</span></div></CardContainer>
        <CardContainer title="Items" gradientColor="#3b82f6"><div className="flex items-center gap-3 py-2"><Package className="h-8 w-8 text-blue-500"/><span className="text-3xl font-bold">{data.totals?.items || 0}</span></div></CardContainer>
        <CardContainer title="Sales Invoices" gradientColor="#8b5cf6"><div className="flex items-center gap-3 py-2"><FileText className="h-8 w-8 text-violet-500"/><span className="text-3xl font-bold">{data.totals?.salesInvoices || 0}</span></div></CardContainer>
        <CardContainer title="Invoice Amount" gradientColor="#f59e0b"><div className="flex items-center gap-3 py-2"><CreditCard className="h-8 w-8 text-amber-500"/><span className="text-2xl font-bold">NPR {Number(data.totals?.invoiceAmount || 0).toLocaleString("en-NP")}</span></div></CardContainer>
      </div>
      {Object.values(data.errors || {}).some(Boolean) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Some provider collections could not be loaded: {Object.entries(data.errors || {}).filter(([, error]) => error).map(([name, error]) => `${name}: ${error}`).join("; ")}
        </div>
      )}

      <CardContainer title={`${provider === "TSHUL" ? "Tshul" : "Nepurix"} Accounting`} description="Customers, catalog items, and sales invoices from the accounting service" actions={[{ label: "Refresh", onClick: load, icon: <RefreshCw className="h-4 w-4"/>, variant: "outline" }]}>
        <Tabs value={resource} onValueChange={value => setResource(value as Resource)}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <TabsList><TabsTrigger value="customers">Customers</TabsTrigger><TabsTrigger value="items">Items</TabsTrigger><TabsTrigger value="sales-invoices">Sales Invoices</TabsTrigger></TabsList>
            <div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input className="pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search complete records"/></div><Button onClick={startCreate}><Plus className="mr-2 h-4 w-4"/>Add</Button></div>
          </div>
          {(["customers", "items", "sales-invoices"] as Resource[]).map(tab => <TabsContent key={tab} value={tab} className="mt-4"><div className="rounded-lg border overflow-auto"><Table><TableHeader><TableRow><TableHead>Name / Number</TableHead><TableHead>Reference / Contact</TableHead><TableHead>Amount / Rate</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={5}><div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin"/></div></TableCell></TableRow> : filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">No records found.</TableCell></TableRow> : filtered.map((row: any, index: number) => <TableRow key={`${rowId(row) ?? index}-${index}`}><TableCell><div className="font-medium">{valueOf(row, ["Name","name","Customer","customer","InvoiceNo","invoiceNo"])}</div><div className="text-xs text-muted-foreground">ID: {rowId(row) ?? "—"}</div></TableCell><TableCell>{valueOf(row, ["ReferenceId","referenceId","Email","email","Phone","phone"])}</TableCell><TableCell>{valueOf(row, ["NetAmount","netAmount","SalesRate","salesRate","Rate","rate"], "0")}</TableCell><TableCell><Badge variant="outline">{valueOf(row, ["Status","status","InvoiceType","invoiceType"], "Active")}</Badge></TableCell><TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => setSelected(row)}>Details</Button><Button size="sm" variant="outline" onClick={() => startEdit(row)}>Edit</Button></TableCell></TableRow>)}</TableBody></Table></div></TabsContent>)}
        </Tabs>
      </CardContainer>

      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}><DialogContent className="max-h-[85vh] max-w-3xl overflow-auto"><DialogHeader><DialogTitle>Complete Details</DialogTitle></DialogHeader><pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs">{JSON.stringify(selected, null, 2)}</pre></DialogContent></Dialog>
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{editingId === null ? "Create" : "Update"} {resource.replace("-", " ")}</DialogTitle><DialogDescription>Edit the complete provider payload. All supported fields are sent to {provider}.</DialogDescription></DialogHeader><Textarea className="min-h-[430px] font-mono text-xs" value={json} onChange={e => setJson(e.target.value)}/><DialogFooter><Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
