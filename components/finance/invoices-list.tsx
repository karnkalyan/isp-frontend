"use client"

import { useEffect, useState, useCallback } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { StatusBadge } from "@/components/ui/status-badge"
import { MoreHorizontal, FileText, Loader2, Printer, Search } from "lucide-react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"

const numberToWords = (amount: number) => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  const toWords = (n: number): string => {
    if (n < 20) return ones[n]
    if (n < 100) return `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim()
    if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred ${toWords(n % 100)}`.trim()
    if (n < 100000) return `${toWords(Math.floor(n / 1000))} Thousand ${toWords(n % 1000)}`.trim()
    if (n < 10000000) return `${toWords(Math.floor(n / 100000))} Lakh ${toWords(n % 100000)}`.trim()
    return `${toWords(Math.floor(n / 10000000))} Crore ${toWords(n % 10000000)}`.trim()
  }
  return `${toWords(Math.round(amount)) || "Zero"} Only`
}

function PrintableInvoice({ invoice, isp }: { invoice: any, isp: any }) {
  const subtotal = Number(invoice?.amount || 0)
  const taxableAmount = subtotal
  const vat = Math.round(taxableAmount * 0.13 * 100) / 100
  const total = Math.round((taxableAmount + vat) * 100) / 100
  const items = invoice?.items?.length ? invoice.items : [{ itemName: invoice?.packageName || "Internet Package", itemPrice: subtotal }]
  const printedAt = new Date()

  return (
    <div id="printable-invoice" className="printable-invoice relative mx-auto bg-white p-5 text-black">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="-rotate-45 text-6xl font-bold tracking-widest text-slate-300/50">COPY OF ORIGINAL</div>
      </div>
      <div className="relative border-2 border-black p-3">
        <div className="grid grid-cols-[1fr_auto] gap-4">
          <div className="text-center">
            <div className="text-xl font-bold">{isp?.companyName || isp?.name || "ISP"}</div>
            <div className="text-sm font-semibold">{isp?.address || "Address"}</div>
            <div className="text-sm font-semibold">
              Tel: {isp?.phoneNumber || "-"} {isp?.masterEmail ? ` Email: ${isp.masterEmail}` : ""}
            </div>
          </div>
          <div className="text-right text-sm">
            <div>Transaction Date:</div>
            <div>{new Date(invoice?.date || Date.now()).toLocaleString()}</div>
            <div className="mt-4">Copy of Original 1</div>
            <div className="mt-4">Reprint Date:</div>
            <div>{printedAt.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 items-start">
          <div>
            <div className="font-bold">TPIN</div>
            <div className="mt-1 inline-flex border border-black font-mono text-sm">
              {String(isp?.panNo || "000000000").split("").map((digit: string, index: number) => (
                <span key={index} className="border-r border-black px-1 last:border-r-0">{digit}</span>
              ))}
            </div>
          </div>
          <div className="text-center text-3xl font-bold">INVOICE</div>
          <div className="text-right text-xl">Invoice No.: <span className="text-2xl font-semibold">{invoice?.invoiceId}</span></div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div className="grid grid-cols-[110px_1fr] gap-y-2">
            <div className="font-bold">Username:</div><div>{invoice?.customerId || "-"}</div>
            <div className="font-bold">Address:</div><div>{invoice?.customerAddress || "-"}</div>
            <div className="font-bold">TPIN</div><div>{invoice?.customerPan || "-"}</div>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-y-2">
            <div className="font-bold">Subscriber&apos;s Name:</div><div>{invoice?.customer || "-"}</div>
            <div className="font-bold">Tel:</div><div>{invoice?.customerPhone || "-"}</div>
          </div>
        </div>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr>
              {["S.N", "HS Code", "Particulars", "Description", "Qty", "Rate", "Amount (Rs.)"].map((head) => (
                <th key={head} className="border border-black p-1 text-left">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, index: number) => {
              const price = Number(item.itemPrice || item.amount || subtotal / items.length || 0)
              return (
                <tr key={item.id || index}>
                  <td className="border-x border-black p-1 align-top">{index + 1}</td>
                  <td className="border-x border-black p-1 align-top"></td>
                  <td className="border-x border-black p-1 align-top">{item.itemName || invoice?.packageName || "Internet"}</td>
                  <td className="border-x border-black p-1 align-top">{item.description || invoice?.packageName || "Internet service package"}</td>
                  <td className="border-x border-black p-1 align-top">1</td>
                  <td className="border-x border-black p-1 text-right align-top">{price.toFixed(2)}</td>
                  <td className="border-x border-black p-1 text-right align-top">{price.toFixed(2)}</td>
                </tr>
              )
            })}
            <tr><td colSpan={7} className="h-10 border-x border-b border-black"></td></tr>
          </tbody>
        </table>

        <div className="grid grid-cols-[1fr_1.6fr]">
          <div className="border-x border-b border-black p-5">
            <div className="font-bold underline">Payment Mode#</div>
            <div className="mt-3 font-semibold">{invoice?.status === "paid" ? "Paid" : "Unpaid"}</div>
          </div>
          <table className="border-collapse text-sm">
            <tbody>
              {[
                ["Total", subtotal],
                ["Discount", 0],
                ["Taxable Amount", taxableAmount],
                ["Vat 13 %", vat],
                ["Total Amount", total],
              ].map(([label, value]) => (
                <tr key={String(label)}>
                  <td className="border-b border-r border-black p-1 text-right">{label}</td>
                  <td className="w-36 border-b border-r border-black p-1 text-right">{Number(value).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex items-end justify-between text-sm">
          <div>In Words : {numberToWords(total)}</div>
          <div className="w-72 text-center">
            <div className="border-b border-slate-400 pb-1">{invoice?.paymentMethod || "khalti"}</div>
            <div className="mt-1">For {isp?.companyName || isp?.name || "ISP"}</div>
          </div>
        </div>
        <div className="mt-8 text-sm">Note: This is a pdf copy of computer generated invoice.</div>
      </div>
    </div>
  )
}

export function InvoicesList() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null)
  const [paymentInvoiceNumber, setPaymentInvoiceNumber] = useState("")
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [isp, setIsp] = useState<any>(null)

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

  useEffect(() => {
    apiRequest<any>("/isp/active")
      .then((response) => setIsp(response?.data || response?.isp || response))
      .catch(() => setIsp(null))
  }, [])

  const openMarkPaid = (invoice: any) => {
    setPaymentInvoice(invoice)
    setPaymentInvoiceNumber(invoice.invoiceId?.startsWith("INV-") ? "" : invoice.invoiceId || "")
  }

  const handleMarkPaid = async () => {
    if (!paymentInvoice || !paymentInvoiceNumber.trim()) {
      toast.error("Invoice number is required")
      return
    }
    try {
      setPaymentSubmitting(true)
      toast.loading("Processing payment...", { id: "payment" })
      await apiRequest("/billing/pay", {
        method: "POST",
        body: JSON.stringify({
          orderId: paymentInvoice.id,
          invoiceId: paymentInvoiceNumber.trim(),
          amount: paymentInvoice.amount,
          paymentMethod: "CASH"
        })
      })
      toast.success("Payment recorded successfully", { id: "payment" })
      setPaymentInvoice(null)
      setPaymentInvoiceNumber("")
      fetchInvoices()
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment", { id: "payment" })
    } finally {
      setPaymentSubmitting(false)
    }
  }

  const formatNpr = (val: number) => {
    return new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(val)
  }

  const printInvoice = () => {
    window.print()
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
                        <DropdownMenuItem className="cursor-pointer" onClick={() => setSelectedInvoice(invoice)}>
                          View details
                        </DropdownMenuItem>
                        {invoice.status !== "paid" && (
                          <>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem className="text-green-600 focus:text-green-600 focus:bg-green-50 dark:focus:bg-green-950 cursor-pointer" onClick={() => openMarkPaid(invoice)}>
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

      <Dialog open={!!paymentInvoice} onOpenChange={(open) => { if (!open) setPaymentInvoice(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Record payment for {paymentInvoice?.customer || "customer"} totaling {formatNpr(Number(paymentInvoice?.amount || 0))}.
            </div>
            <Input
              value={paymentInvoiceNumber}
              onChange={(event) => setPaymentInvoiceNumber(event.target.value)}
              placeholder="Enter invoice number"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPaymentInvoice(null)} disabled={paymentSubmitting}>Cancel</Button>
              <Button onClick={handleMarkPaid} disabled={paymentSubmitting || !paymentInvoiceNumber.trim()}>
                {paymentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>Invoice {selectedInvoice?.invoiceId}</DialogTitle>
              <Button onClick={printInvoice} className="gap-2">
                <Printer className="h-4 w-4" />
                Print Invoice
              </Button>
            </div>
          </DialogHeader>
          {selectedInvoice && <PrintableInvoice invoice={selectedInvoice} isp={isp} />}
        </DialogContent>
      </Dialog>
    </CardContainer>
  )
}
