"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, FileDown, RefreshCw, Search, ShieldCheck, WalletCards } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CardContainer } from "@/components/ui/card-container"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import toast from "react-hot-toast"

const money = (value: number) => new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR" }).format(Number(value || 0))
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : "—"

const KHALTI_STATUS_MEANINGS = [
  { status: "Completed", http: "200", meaning: "Payment succeeded. Safe to activate/renew subscription and issue invoice." },
  { status: "Pending", http: "200", meaning: "Payment is pending/held. Do NOT activate service; re-check /api/khalti/status or contact Khalti." },
  { status: "Initiated", http: "200", meaning: "Payment initiated but not completed by customer yet. Do NOT activate service." },
  { status: "Refunded", http: "200", meaning: "Full amount refunded to customer. Do NOT activate service." },
  { status: "Partially Refunded", http: "200", meaning: "Partial refund issued. Hold service and reconcile manually." },
  { status: "Expired", http: "400", meaning: "Payment link expired (60 min default in production). Customer must re-initiate." },
  { status: "User canceled", http: "400", meaning: "Customer cancelled payment on Khalti checkout. Do NOT activate service." },
]

const KHALTI_ERROR_CODES = [
  { code: "400 - pidx is required", meaning: "Missing pidx in /epay/complete or /status request." },
  { code: "400 - Minimum NPR 10", meaning: "Khalti ePayment v2 requires at least NPR 10 (1000 paisa)." },
  { code: "400 - Amount mismatch", meaning: "Paid amount from Khalti lookup differs from expected invoice/package amount." },
  { code: "401 - Invalid token.", meaning: "Khalti Secret Key is invalid, mismatched (sandbox vs live), or missing 'Key ' prefix." },
  { code: "404 - Not found", meaning: "Customer, active subscription, or pidx not found." },
  { code: "500 / 504 - Timeout", meaning: "Network/Khalti timeout. Call POST /api/khalti/status with pidx before retrying." },
]

export default function KhaltiTransactionsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("transactions")
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ALL")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [serviceEnabled, setServiceEnabled] = useState<boolean | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [apiConfig, setApiConfig] = useState<any>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const query = new URLSearchParams({ page: String(page), limit: "25", status })
      if (search.trim()) query.set("search", search.trim())
      const response = await apiRequest<any>(`/khalti/transactions?${query}`, { suppressToast: true })
      setTransactions(response.transactions || [])
      setPagination(response.pagination || { total: 0, totalPages: 1 })
      setServiceEnabled(typeof response.serviceEnabled === "boolean" ? response.serviceEnabled : null)
    } catch (error: any) {
      setTransactions([])
      const msg = error?.message || "Failed to load Khalti transactions"
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  const loadConfig = useCallback(async () => {
    try {
      const res = await apiRequest<any>("/khalti/api-config", { suppressToast: true })
      setApiConfig(res)
    } catch {
      setApiConfig(null)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadConfig() }, [loadConfig])

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <WalletCards className="h-6 w-6 text-[#5C2D91]" />
              Khalti Transactions
            </h1>
            <p className="text-sm text-muted-foreground">Khalti ePayment v2 web &amp; mobile payment history, credentials &amp; API documentation.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/docs/Khalti_ePayment_API_Documentation.pdf"
              download="Khalti_ePayment_API_Documentation.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="default" className="flex items-center gap-1.5 bg-[#5C2D91] hover:bg-[#4a2376] text-white">
                <FileDown className="h-4 w-4" />
                Download PDF Docs
              </Button>
            </a>
            <Select value="khalti" onValueChange={(val) => router.push(`/services/${val}`)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Choose Gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="esewa">eSewa Gateway</SelectItem>
                <SelectItem value="khalti">Khalti Gateway</SelectItem>
                <SelectItem value="externalpayment">External Payment</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { load(); loadConfig() }} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="docs">API Docs &amp; Credentials</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <CardContainer title="Khalti ePayment Transactions" description={`${pagination.total} transaction(s)`}>
              {serviceEnabled === false && (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                  Khalti service is currently not enabled for this ISP. Enable it from Services or Payment Gateway settings to accept Khalti ePayment v2 renewals.
                </div>
              )}
              {errorMsg && (
                <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMsg}
                </div>
              )}
              <div className="mb-4 flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={event => { setSearch(event.target.value); setPage(1) }}
                    placeholder="Search customer, pidx, or reference"
                    className="pl-9"
                  />
                </div>
                <Select value={status} onValueChange={value => { setStatus(value); setPage(1) }}>
                  <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Package</th>
                      <th className="p-3">PIDX</th>
                      <th className="p-3">Reference</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(item => (
                      <tr key={item.id} className="border-b align-top">
                        <td className="p-3 whitespace-nowrap">{formatDate(item.paidAt || item.createdAt)}</td>
                        <td className="p-3">
                          <div className="font-medium">{item.customerName}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.customerUniqueId}{item.customerPhone ? ` · ${item.customerPhone}` : ""}
                          </div>
                        </td>
                        <td className="p-3 font-medium">{item.packageName || "—"}</td>
                        <td className="p-3 font-mono text-xs">{item.pidx || "—"}</td>
                        <td className="p-3 font-mono text-xs">{item.referenceCode || "—"}</td>
                        <td className="p-3 text-right font-semibold">{money(item.amount)}</td>
                        <td className="p-3">
                          <Badge variant={item.status === "COMPLETED" ? "success" : "secondary"}>{item.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && transactions.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">No Khalti transactions found.</div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page} of {Math.max(1, pagination.totalPages)}</span>
                <Button variant="outline" disabled={page >= pagination.totalPages || loading} onClick={() => setPage(value => value + 1)}>Next</Button>
              </div>
            </CardContainer>
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-4">
                <CardContainer title="Official Khalti PDF Documentation" description="Download complete integration manual">
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Includes Customer Portal API URLs, request/response payloads, timeout status check API (/api/khalti/status), error code meanings, and ISP credential setup.
                    </p>
                    <div className="flex flex-col gap-2">
                      <a
                        href="/docs/Khalti_ePayment_API_Documentation.pdf"
                        download="Khalti_ePayment_API_Documentation.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="w-full flex items-center justify-center gap-2 bg-[#5C2D91] hover:bg-[#4a2376] text-white">
                          <FileDown className="h-4 w-4" />
                          Download PDF Specification
                        </Button>
                      </a>
                      {apiConfig?.endpoints?.pdfDoc && (
                        <a href={apiConfig.endpoints.pdfDoc} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                            <FileDown className="h-4 w-4" />
                            Download Live ISP PDF
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContainer>

                <CardContainer title="ISP Khalti Credentials & URLs" description="Configured under Services -> Khalti">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                      <span className="text-muted-foreground">Environment</span>
                      <Badge variant={apiConfig?.isSandbox ? "secondary" : "success"}>
                        {apiConfig?.environment || "production"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                      <span className="text-muted-foreground">Secret Key</span>
                      <span className="font-mono font-medium">
                        {apiConfig?.secretKeyConfigured ? apiConfig.secretKeyMasked : "Not Configured"}
                      </span>
                    </div>
                    {[
                      { key: "khaltiBase", label: "Khalti Base URL", val: apiConfig?.khaltiBaseUrl || "https://khalti.com/api/v2" },
                      { key: "portalBase", label: "Portal Backend Base", val: apiConfig?.portalBaseUrl || "/api/khalti" },
                      { key: "returnUrl", label: "Callback Return URL", val: apiConfig?.returnUrl || "/payment/khalti/callback" },
                    ].map(row => (
                      <div key={row.key}>
                        <span className="text-xs text-muted-foreground">{row.label}</span>
                        <div className="flex items-center justify-between p-2 bg-muted rounded font-mono text-xs">
                          <span className="truncate">{row.val}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(row.val, row.key)}
                          >
                            {copiedKey === row.key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContainer>
              </div>

              <div className="md:col-span-7 space-y-4">
                <CardContainer title="Customer Portal API Endpoints & Timeout Status Check" description="Khalti ePayment v2 (KPG-2)">
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded border space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-[#5C2D91]" />
                        1. Initiate Payment: <code className="font-mono">POST /api/khalti/epay/initiate</code>
                      </div>
                      <p className="text-muted-foreground">
                        Body: <code>{"{ customerId, packageId, returnUrl, websiteUrl }"}</code> &rarr; Returns <code>pidx</code>, <code>payment_url</code>, <code>amount</code>.
                      </p>
                    </div>
                    <div className="p-3 rounded border space-y-1">
                      <div className="font-semibold">
                        2. Complete / Verify: <code className="font-mono">POST /api/khalti/epay/complete</code>
                      </div>
                      <p className="text-muted-foreground">
                        Body: <code>{"{ pidx, customerId, packageId }"}</code> &rarr; Calls Khalti <code>/epayment/lookup/</code>, verifies <code>Completed</code> status &amp; amount, renews subscription &amp; RADIUS.
                      </p>
                    </div>
                    <div className="p-3 rounded border space-y-1 bg-purple-50/40 dark:bg-purple-950/20">
                      <div className="font-semibold">
                        3. Status Check (Timeout Recovery): <code className="font-mono">POST /api/khalti/status</code> or <code className="font-mono">GET /api/khalti/status/:pidx</code>
                      </div>
                      <p className="text-muted-foreground">
                        Body: <code>{"{ pidx }"}</code> &rarr; Queries Khalti <code>/epayment/lookup/</code> and local order state without failing on Pending/Initiated.
                      </p>
                    </div>
                  </div>
                </CardContainer>

                <CardContainer title="Lookup Status & Error Code Meanings" description="Per Khalti ePayment v2 specification">
                  <div className="space-y-4 text-xs">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-1.5 pr-2">Status</th>
                          <th className="py-1.5 pr-2">HTTP</th>
                          <th className="py-1.5">Meaning &amp; Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {KHALTI_STATUS_MEANINGS.map(item => (
                          <tr key={item.status} className="border-b align-top">
                            <td className="py-1.5 pr-2 font-mono font-semibold">{item.status}</td>
                            <td className="py-1.5 pr-2 font-mono">{item.http}</td>
                            <td className="py-1.5 text-muted-foreground">{item.meaning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-1.5 pr-2">Error Code</th>
                          <th className="py-1.5">Meaning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {KHALTI_ERROR_CODES.map(err => (
                          <tr key={err.code} className="border-b align-top">
                            <td className="py-1.5 pr-2 font-mono font-semibold whitespace-nowrap">{err.code}</td>
                            <td className="py-1.5 text-muted-foreground">{err.meaning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
