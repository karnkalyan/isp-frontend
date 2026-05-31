"use client"

import { useEffect, useState, useCallback } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { StatusBadge } from "@/components/ui/status-badge"
import { MoreHorizontal, FileText, Loader2, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"

export function InvoicesList() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/billing/invoices?page=${page}&limit=10`
      if (search) url += `&search=${encodeURIComponent(search)}`
      if (status !== "all") url += `&status=${status}`
      
      const res = await apiRequest(url)
      if (res.success) {
        setInvoices(res.invoices)
        setTotalPages(res.pagination.totalPages || 1)
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err)
      toast.error("Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleMarkPaid = async (orderId: number, amount: number) => {
    const invId = prompt("Enter Invoice Number to mark as paid:")
    if (!invId) return
    try {
      toast.loading("Processing payment...", { id: "payment" })
      await apiRequest("/billing/pay", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          invoiceId: invId,
          amount,
          paymentMethod: "CASH"
        })
      })
      toast.success("Payment recorded successfully", { id: "payment" })
      fetchInvoices()
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment", { id: "payment" })
    }
  }

  const formatNpr = (val: number) => {
    return new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(val)
  }

  return (
    <CardContainer title="Recent Invoices" description="Latest customer invoices and payments">
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Input
            placeholder="Search by invoice number or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-background border-input text-foreground rounded-lg"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex gap-2 items-center w-full md:w-auto">
          <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
            <SelectTrigger className="w-full md:w-40 bg-background border-input text-foreground">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
            <FileText className="h-12 w-12 mb-3 text-muted-foreground/60 mx-auto" />
            <p>No invoices found matching criteria.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Invoice ID</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Customer</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Package</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Amount</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border/60 hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full p-2 bg-blue-500/15">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{invoice.invoiceId}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-semibold text-foreground">{invoice.customer}</div>
                    <div className="text-xs text-muted-foreground">{invoice.customerId}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-foreground/80">{new Date(invoice.date).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4 text-sm text-foreground/80">{invoice.packageName}</td>
                  <td className="p-4 text-sm font-semibold text-foreground">{formatNpr(invoice.amount)}</td>
                  <td className="p-4">
                    <StatusBadge status={invoice.status as any} />
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px] bg-popover border-border text-popover-foreground">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem className="cursor-pointer" onClick={() => toast.success(`Invoice: ${invoice.invoiceId}`)}>
                          View details
                        </DropdownMenuItem>
                        {invoice.status !== "paid" && (
                          <>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem className="text-green-600 focus:text-green-600 focus:bg-green-50 dark:focus:bg-green-950 cursor-pointer" onClick={() => handleMarkPaid(invoice.id, invoice.amount)}>
                              Mark as paid
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="p-4 flex justify-between items-center border-t border-border mt-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="text-foreground"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="text-foreground"
          >
            Next
          </Button>
        </div>
      )}
    </CardContainer>
  )
}
