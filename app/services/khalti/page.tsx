"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Search, WalletCards } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CardContainer } from "@/components/ui/card-container"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import toast from "react-hot-toast"

const money = (value: number) => new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR" }).format(Number(value || 0))
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : "—"

export default function KhaltiTransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ALL")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [serviceEnabled, setServiceEnabled] = useState<boolean | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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

  useEffect(() => { load() }, [load])

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <WalletCards className="h-6 w-6 text-[#5C2D91]" />
              Khalti Transactions
            </h1>
            <p className="text-sm text-muted-foreground">Khalti ePayment v2 web &amp; mobile payment history for this ISP.</p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
            </Button>
          </div>
        </div>
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
      </div>
    </DashboardLayout>
  )
}
