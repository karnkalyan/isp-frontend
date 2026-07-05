"use client"

import { useEffect, useState, useCallback } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { StatusBadge } from "@/components/ui/status-badge"
import { MoreHorizontal, FileText, Loader2, Printer, Search, Trash, Plus } from "lucide-react"
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

function PrintableInvoice({
  invoice,
  isp,
  addonCharges = [],
  tscPercentage = 10
}: {
  invoice: any
  isp: any
  addonCharges?: any[]
  tscPercentage?: number
}) {
  const tscPct = Number(tscPercentage || 10)
  const items = invoice?.items?.length 
    ? invoice.items 
    : [{ itemName: invoice?.packageName || "Internet Package", referenceId: null, itemPrice: Number(invoice?.amount || 0) }]
  
  const itemsSum = items.reduce((sum: number, item: any) => sum + Number(item.itemPrice || 0), 0)
  const invoiceTotalAmount = Number(invoice?.amount || 0)

  let subtotal = 0
  let totalTsc = 0
  let taxableAmount = 0
  let vat = 0
  let total = 0
  let displayItems: any[] = []

  const findAddonConfig = (refId: string) => {
    if (!refId) return null
    let found = addonCharges.find(a => a.referenceId === refId)
    if (found) return found
    const cleanCode = refId.startsWith('INT-') ? refId.substring(4) : refId
    found = addonCharges.find(a => a.forPackageCreation && cleanCode.startsWith(a.code))
    return found || null
  }

  const isEsewaOrRecharge = invoice?.paymentMethod && 
    ["ESEWA", "ESEWA EPAY", "ESEWA_EPAY", "KHALTI", "CONNECT_IPS", "FONEPAY", "ONLINE", "RECHARGE", "ESEWA EPAY RENEW"].includes(String(invoice.paymentMethod).toUpperCase())
    || String(invoice?.packageName || "").toLowerCase().includes("recharge");

  const isLegacy = Math.abs(itemsSum - invoiceTotalAmount) < 1

  if (isEsewaOrRecharge) {
    total = invoiceTotalAmount
    const tscFactor = invoice?.isTscApplicable ? (tscPct / 100) : 0
    const baseAmount = total / ((1 + tscFactor) * 1.13)
    totalTsc = Math.round(baseAmount * tscFactor * 100) / 100
    taxableAmount = Math.round(baseAmount * (1 + tscFactor) * 100) / 100
    vat = Math.round(taxableAmount * 0.13 * 100) / 100
    subtotal = Math.round((total - totalTsc - vat) * 100) / 100

    displayItems = [{
      itemName: invoice.packageName || "Internet Package",
      preTaxPrice: subtotal,
      isTaxable: true,
      isTscApplicable: invoice.isTscApplicable,
      itemTsc: totalTsc
    }];
  } else if (isLegacy) {
    total = invoiceTotalAmount
    const tscFactor = invoice?.isTscApplicable ? (tscPct / 100) : 0
    const baseAmount = total / ((1 + tscFactor) * 1.13)
    totalTsc = Math.round(baseAmount * tscFactor * 100) / 100
    taxableAmount = Math.round(baseAmount * (1 + tscFactor) * 100) / 100
    vat = Math.round(taxableAmount * 0.13 * 100) / 100
    subtotal = Math.round((total - totalTsc - vat) * 100) / 100

    displayItems = items.map((item: any) => {
      const itemPrice = Number(item.itemPrice || 0)
      const itemTscFactor = (item.referenceId ? findAddonConfig(item.referenceId)?.isTscApplicable : invoice?.isTscApplicable) ? (tscPct / 100) : 0
      const itemPreTax = itemPrice / ((1 + itemTscFactor) * 1.13)
      return {
        ...item,
        preTaxPrice: itemPreTax
      }
    })
  } else {
    displayItems = items.map((item: any) => {
      const price = Number(item.itemPrice || 0)
      let isTaxable = true
      let isTscApplicable = false

      if (item.referenceId) {
        const addon = findAddonConfig(item.referenceId)
        if (addon) {
          isTaxable = addon.isTaxable
          isTscApplicable = addon.isTscApplicable
        } else {
          isTaxable = true
          isTscApplicable = invoice?.isTscApplicable || false
        }
      } else {
        isTaxable = true
        isTscApplicable = false
      }

      const itemTsc = isTscApplicable ? (price * tscPct) / 100 : 0

      return {
        ...item,
        preTaxPrice: price,
        isTaxable,
        isTscApplicable,
        itemTsc
      }
    })

    subtotal = displayItems.reduce((sum: number, item: any) => sum + item.preTaxPrice, 0)
    totalTsc = displayItems.reduce((sum: number, item: any) => sum + item.itemTsc, 0)
    taxableAmount = displayItems.reduce((sum: number, item: any) => {
      if (item.isTaxable) {
        return sum + item.preTaxPrice + item.itemTsc
      }
      return sum
    }, 0)
    vat = Math.round(taxableAmount * 0.13 * 100) / 100
    total = Math.round((subtotal + totalTsc + vat) * 100) / 100
  }

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
            {displayItems.map((item: any, index: number) => {
              const price = item.preTaxPrice
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
            <div className="mt-3 font-semibold">{invoice?.status === "paid" ? String(invoice?.paymentMethod || "Payment").replaceAll("_", " ") : "Unpaid"}</div>
          </div>
          <table className="border-collapse text-sm">
            <tbody>
              {[
                ["Total", subtotal],
                ["Discount", 0],
                ["TSC", totalTsc],
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
            <div className="border-b border-slate-400 pb-1">{invoice?.paymentMethod ? String(invoice.paymentMethod).replaceAll("_", " ") : "Payment"}</div>
            <div className="mt-1">For {isp?.companyName || isp?.name || "ISP"}</div>
          </div>
        </div>
        <div className="mt-8 text-sm">Note: This is a pdf copy of computer generated invoice.</div>
      </div>
    </div>
  )
}

function PrintableReceipt({
  invoice,
  isp,
  addonCharges = [],
  tscPercentage = 10
}: {
  invoice: any
  isp: any
  addonCharges?: any[]
  tscPercentage?: number
}) {
  const tscPct = Number(tscPercentage || 10)
  const items = invoice?.items?.length 
    ? invoice.items 
    : [{ itemName: invoice?.packageName || "Internet Package", referenceId: null, itemPrice: Number(invoice?.amount || 0) }]
  
  const itemsSum = items.reduce((sum: number, item: any) => sum + Number(item.itemPrice || 0), 0)
  const invoiceTotalAmount = Number(invoice?.amount || 0)

  let subtotal = 0
  let totalTsc = 0
  let taxableAmount = 0
  let vat = 0
  let total = 0
  let displayItems: any[] = []

  const findAddonConfig = (refId: string) => {
    if (!refId) return null
    let found = addonCharges.find(a => a.referenceId === refId)
    if (found) return found
    const cleanCode = refId.startsWith('INT-') ? refId.substring(4) : refId
    found = addonCharges.find(a => a.forPackageCreation && cleanCode.startsWith(a.code))
    return found || null
  }

  const isEsewaOrRecharge = invoice?.paymentMethod && 
    ["ESEWA", "ESEWA EPAY", "ESEWA_EPAY", "KHALTI", "CONNECT_IPS", "FONEPAY", "ONLINE", "RECHARGE", "ESEWA EPAY RENEW"].includes(String(invoice.paymentMethod).toUpperCase())
    || String(invoice?.packageName || "").toLowerCase().includes("recharge");

  const isLegacy = Math.abs(itemsSum - invoiceTotalAmount) < 1

  if (isEsewaOrRecharge) {
    total = invoiceTotalAmount
    const tscFactor = invoice?.isTscApplicable ? (tscPct / 100) : 0
    const baseAmount = total / ((1 + tscFactor) * 1.13)
    totalTsc = Math.round(baseAmount * tscFactor * 100) / 100
    taxableAmount = Math.round(baseAmount * (1 + tscFactor) * 100) / 100
    vat = Math.round(taxableAmount * 0.13 * 100) / 100
    subtotal = Math.round((total - totalTsc - vat) * 100) / 100

    displayItems = [{
      itemName: invoice.packageName || "Internet Package",
      preTaxPrice: subtotal,
      isTaxable: true,
      isTscApplicable: invoice.isTscApplicable,
      itemTsc: totalTsc
    }];
  } else if (isLegacy) {
    total = invoiceTotalAmount
    const tscFactor = invoice?.isTscApplicable ? (tscPct / 100) : 0
    const baseAmount = total / ((1 + tscFactor) * 1.13)
    totalTsc = Math.round(baseAmount * tscFactor * 100) / 100
    taxableAmount = Math.round(baseAmount * (1 + tscFactor) * 100) / 100
    vat = Math.round(taxableAmount * 0.13 * 100) / 100
    subtotal = Math.round((total - totalTsc - vat) * 100) / 100

    displayItems = items.map((item: any) => {
      const itemPrice = Number(item.itemPrice || 0)
      const itemTscFactor = (item.referenceId ? findAddonConfig(item.referenceId)?.isTscApplicable : invoice?.isTscApplicable) ? (tscPct / 100) : 0
      const itemPreTax = itemPrice / ((1 + itemTscFactor) * 1.13)
      return {
        ...item,
        preTaxPrice: itemPreTax
      }
    })
  } else {
    displayItems = items.map((item: any) => {
      const price = Number(item.itemPrice || 0)
      let isTaxable = true
      let isTscApplicable = false

      if (item.referenceId) {
        const addon = findAddonConfig(item.referenceId)
        if (addon) {
          isTaxable = addon.isTaxable
          isTscApplicable = addon.isTscApplicable
        } else {
          isTaxable = true
          isTscApplicable = invoice?.isTscApplicable || false
        }
      } else {
        isTaxable = true
        isTscApplicable = false
      }

      const itemTsc = isTscApplicable ? (price * tscPct) / 100 : 0

      return {
        ...item,
        preTaxPrice: price,
        isTaxable,
        isTscApplicable,
        itemTsc
      }
    })

    subtotal = displayItems.reduce((sum: number, item: any) => sum + item.preTaxPrice, 0)
    totalTsc = displayItems.reduce((sum: number, item: any) => sum + item.itemTsc, 0)
    taxableAmount = displayItems.reduce((sum: number, item: any) => {
      if (item.isTaxable) {
        return sum + item.preTaxPrice + item.itemTsc
      }
      return sum
    }, 0)
    vat = Math.round(taxableAmount * 0.13 * 100) / 100
    total = Math.round((subtotal + totalTsc + vat) * 100) / 100
  }

  return (
    <div id="printable-receipt" className="printable-receipt relative mx-auto bg-white p-5 text-black">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="-rotate-45 text-5xl font-bold tracking-widest text-slate-300/30">CASH RECEIPT</div>
      </div>
      <div className="relative border border-black p-4">
        <div className="text-center border-b border-black pb-3">
          <div className="text-xl font-bold">{isp?.companyName || isp?.name || "Kisan Net Pvt Ltd"}</div>
          <div className="text-xs font-semibold">{isp?.address || "Address"}</div>
          <div className="text-xs font-semibold">
            Tel: {isp?.phoneNumber || "-"} | Email: {isp?.masterEmail || "-"}
          </div>
          <div className="text-xs font-bold mt-1">TPIN/PAN: {isp?.panNo || "000000000"}</div>
          <div className="text-lg font-bold mt-2 uppercase tracking-wide">Cash Receipt</div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-b border-black pb-3">
          <div>
            <div><span className="font-bold">Receipt No:</span> REC-{invoice?.invoiceId || invoice?.id}</div>
            <div><span className="font-bold">Date:</span> {new Date(invoice?.date || Date.now()).toLocaleString()}</div>
            <div><span className="font-bold">Payment Mode:</span> <span className="font-semibold uppercase">{invoice?.paymentMethod ? String(invoice.paymentMethod).replaceAll("_", " ") : "CASH"}</span></div>
          </div>
          <div className="text-right">
            <div><span className="font-bold">Subscriber Name:</span> {invoice?.customer || "-"}</div>
            <div><span className="font-bold">Subscriber ID:</span> {invoice?.customerId || "-"}</div>
            <div><span className="font-bold">Phone:</span> {invoice?.customerPhone || "-"}</div>
          </div>
        </div>

        <div className="mt-3 text-xs border-b border-black pb-3">
          <div className="font-bold mb-1 text-sm underline">Subscription Package Information</div>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="font-semibold">Package Name:</span> {invoice?.packageName || "-"}</div>
            <div><span className="font-semibold">Duration:</span> {invoice?.packageDuration || "-"}</div>
            
            <div>
              <span className="font-semibold">Speed:</span> {invoice?.downSpeed ? `${invoice.downSpeed} Mbps Down / ${invoice.upSpeed || invoice.downSpeed} Mbps Up` : "Standard Speed"}
            </div>
            <div><span className="font-semibold">Plan Start:</span> {invoice?.date ? new Date(invoice.date).toLocaleDateString() : "-"}</div>
            <div><span className="font-semibold">Plan End:</span> {invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}</div>
          </div>
        </div>

        <table className="mt-3 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-black">
              <th className="p-1 text-left">S.N.</th>
              <th className="p-1 text-left">Particulars</th>
              <th className="p-1 text-right">Rate</th>
              <th className="p-1 text-right">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item: any, index: number) => (
              <tr key={item.id || index} className="border-b border-dotted border-slate-300">
                <td className="p-1">{index + 1}</td>
                <td className="p-1">{item.itemName || invoice?.packageName || "Internet"}</td>
                <td className="p-1 text-right">{item.preTaxPrice.toFixed(2)}</td>
                <td className="p-1 text-right">{item.preTaxPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 grid grid-cols-[1fr_auto] text-xs">
          <div>
            <div className="mt-1 font-semibold italic">In Words: {numberToWords(total)}</div>
          </div>
          <div className="w-48">
            <div className="flex justify-between py-0.5">
              <span>Subtotal:</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            {totalTsc > 0 && (
              <div className="flex justify-between py-0.5">
                <span>TSC ({tscPct}%):</span>
                <span>Rs. {totalTsc.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-0.5">
              <span>Taxable Amt:</span>
              <span>Rs. {taxableAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>VAT (13%):</span>
              <span>Rs. {vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-black py-1 font-bold">
              <span>Total Received:</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-end text-xs text-center">
          <div className="w-28 border-t border-black pt-1">
            Customer Signature
          </div>
          <div className="w-28 border-t border-black pt-1">
            Authorized Signature
          </div>
        </div>
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
  const [adjustingInvoice, setAdjustingInvoice] = useState<any>(null)
  const [newItemName, setNewItemName] = useState("")
  const [newItemPrice, setNewItemPrice] = useState("")
  const [adjustmentSubmitting, setAdjustmentSubmitting] = useState(false)
  const [addonCharges, setAddonCharges] = useState<any[]>([])
  const [tscPercentage, setTscPercentage] = useState(10)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [newPaymentMethodId, setNewPaymentMethodId] = useState("")
  const [changeModeInvoice, setChangeModeInvoice] = useState<any>(null)
  const [dialogView, setDialogView] = useState<"invoice" | "receipt">("invoice")

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

    apiRequest<any[]>("/extra-charges")
      .then((data) => setAddonCharges(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load extra charges:", err))

    apiRequest<Record<string, string>>("/settings")
      .then((data) => {
        if (data && data.tscPercentage) {
          setTscPercentage(Number(data.tscPercentage))
        }
      })
      .catch((err) => console.error("Failed to load settings:", err))

    apiRequest<any[]>("/billing/payment-methods?enabled=true")
      .then((data) => setPaymentMethods(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load payment methods:", err))
  }, [])

  const openMarkPaid = (invoice: any) => {
    setPaymentInvoice(invoice)
    setPaymentInvoiceNumber(invoice.invoiceId?.startsWith("INV-") ? "" : invoice.invoiceId || "")
    const defaultPm = paymentMethods.find(p => p.isDefault)
    setNewPaymentMethodId(defaultPm ? String(defaultPm.id) : (paymentMethods[0] ? String(paymentMethods[0].id) : "CASH"))
  }

  const openInvoiceDetails = (invoice: any) => {
    setSelectedInvoice(invoice)
    setDialogView("invoice")
  }

  const handleMarkPaid = async () => {
    if (!paymentInvoice || !paymentInvoiceNumber.trim()) {
      toast.error("Invoice number is required")
      return
    }
    try {
      setPaymentSubmitting(true)
      toast.loading("Processing payment...", { id: "payment" })
      
      const body: any = {
        orderId: paymentInvoice.id,
        invoiceId: paymentInvoiceNumber.trim(),
        amount: paymentInvoice.amount
      }
      const numericId = Number(newPaymentMethodId)
      if (!isNaN(numericId)) {
        body.paymentMethodId = numericId
        const pm = paymentMethods.find(p => p.id === numericId)
        body.paymentMethod = pm ? pm.code : "CASH"
      } else {
        body.paymentMethod = newPaymentMethodId || "CASH"
      }

      await apiRequest("/billing/pay", {
        method: "POST",
        body: JSON.stringify(body)
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

  const handleChangePaymentMode = async () => {
    if (!changeModeInvoice) return
    try {
      setPaymentSubmitting(true)
      const body: any = {
        orderId: changeModeInvoice.id
      }
      const numericId = Number(newPaymentMethodId)
      if (!isNaN(numericId)) {
        body.paymentMethodId = numericId
        const pm = paymentMethods.find(p => p.id === numericId)
        body.paymentMethod = pm ? pm.code : "CASH"
      } else {
        body.paymentMethod = newPaymentMethodId || "CASH"
      }

      await apiRequest("/billing/update-payment-mode", {
        method: "POST",
        body: JSON.stringify(body)
      })
      toast.success("Payment method updated successfully")
      setChangeModeInvoice(null)
      fetchInvoices()
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment method")
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

  const handleAddAdjustment = async () => {
    if (!adjustingInvoice || !newItemName.trim() || !newItemPrice.trim()) {
      toast.error("Item name and price are required")
      return
    }
    const priceNum = parseFloat(newItemPrice)
    if (isNaN(priceNum)) {
      toast.error("Price must be a number")
      return
    }
    try {
      setAdjustmentSubmitting(true)
      const res = await apiRequest("/billing/adjustments/add", {
        method: "POST",
        body: JSON.stringify({
          orderId: adjustingInvoice.id,
          itemName: newItemName.trim(),
          itemPrice: priceNum
        })
      })
      toast.success("Adjustment added successfully")
      
      // Update adjustingInvoice details
      setAdjustingInvoice((prev: any) => ({
        ...prev,
        amount: res.totalAmount,
        items: res.items
      }))
      setNewItemName("")
      setNewItemPrice("")
      fetchInvoices()
    } catch (err: any) {
      toast.error(err.message || "Failed to add adjustment")
    } finally {
      setAdjustmentSubmitting(false)
    }
  }

  const handleRemoveAdjustment = async (detailId: number) => {
    try {
      setAdjustmentSubmitting(true)
      const res = await apiRequest("/billing/adjustments/remove", {
        method: "POST",
        body: JSON.stringify({
          detailId
        })
      })
      toast.success("Adjustment removed successfully")
      
      // Update adjustingInvoice details
      setAdjustingInvoice((prev: any) => ({
        ...prev,
        amount: res.totalAmount,
        items: res.items
      }))
      fetchInvoices()
    } catch (err: any) {
      toast.error(err.message || "Failed to remove adjustment")
    } finally {
      setAdjustmentSubmitting(false)
    }
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
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Payment Mode</th>
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
                  <td className="p-4 text-sm font-medium text-foreground">{invoice.paymentMethod ? String(invoice.paymentMethod).replaceAll("_", " ") : "—"}</td>
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
                        <DropdownMenuItem className="cursor-pointer" onClick={() => openInvoiceDetails(invoice)}>
                          View details
                        </DropdownMenuItem>
                        {invoice.status === "paid" && (
                          <>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => { setSelectedInvoice(invoice); setDialogView("receipt"); }}>
                              Print Cash Receipt
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem className="text-blue-600 focus:text-blue-600 dark:focus:bg-blue-950 cursor-pointer" onClick={() => { setChangeModeInvoice(invoice); setNewPaymentMethodId(invoice.paymentMethodId ? String(invoice.paymentMethodId) : "CASH"); }}>
                              Change Payment Mode
                            </DropdownMenuItem>
                          </>
                        )}
                        {invoice.status !== "paid" && (
                          <>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem className="text-blue-600 focus:text-blue-600 dark:focus:bg-blue-950 cursor-pointer" onClick={() => setAdjustingInvoice(invoice)}>
                              Adjust
                            </DropdownMenuItem>
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
          <div className="space-y-4 my-2">
            <div className="text-sm text-muted-foreground">
              Record payment for {paymentInvoice?.customer || "customer"} totaling {formatNpr(Number(paymentInvoice?.amount || 0))}.
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Invoice Number</label>
              <Input
                value={paymentInvoiceNumber}
                onChange={(event) => setPaymentInvoiceNumber(event.target.value)}
                placeholder="Enter invoice number"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
              <Select value={newPaymentMethodId} onValueChange={setNewPaymentMethodId}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  {paymentMethods.map((pm) => (
                    <SelectItem key={pm.id} value={String(pm.id)}>
                      {pm.name}
                    </SelectItem>
                  ))}
                  {paymentMethods.length === 0 && (
                    <>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="ESEWA">eSewa</SelectItem>
                      <SelectItem value="KHALTI">Khalti</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPaymentInvoice(null)} disabled={paymentSubmitting}>Cancel</Button>
              <Button onClick={handleMarkPaid} disabled={paymentSubmitting || !paymentInvoiceNumber.trim()}>
                {paymentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adjustingInvoice} onOpenChange={(open) => { if (!open) { setAdjustingInvoice(null); setNewItemName(""); setNewItemPrice(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjust Invoice: {adjustingInvoice?.invoiceId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <h4 className="text-sm font-semibold mb-2 text-foreground">Current Items</h4>
              {adjustingInvoice?.items && adjustingInvoice.items.length > 0 ? (
                <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-background max-h-48 overflow-y-auto">
                  {adjustingInvoice.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 text-sm">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-medium text-foreground truncate">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">Price: {formatNpr(item.itemPrice)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={adjustmentSubmitting}
                        onClick={() => handleRemoveAdjustment(item.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic bg-muted/40 p-4 rounded-lg text-center">No items on this invoice.</p>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-3 text-foreground">Add Custom Adjustment</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Item Name</label>
                  <Input
                    placeholder="e.g. Discount, Router Charge"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    disabled={adjustmentSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Amount (NPR)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 150 or -200"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    disabled={adjustmentSubmitting}
                  />
                </div>
              </div>
              <Button
                onClick={handleAddAdjustment}
                disabled={adjustmentSubmitting || !newItemName.trim() || !newItemPrice.trim()}
                className="w-full gap-2"
              >
                {adjustmentSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add Item
              </Button>
            </div>

            <div className="border-t border-border pt-4 flex justify-between items-center text-sm font-semibold">
              <span className="text-foreground">Updated Total (Excl. VAT):</span>
              <span className="text-primary text-base">
                {adjustingInvoice && formatNpr(Number(adjustingInvoice.amount))}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setAdjustingInvoice(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!changeModeInvoice} onOpenChange={(open) => { if (!open) setChangeModeInvoice(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Payment Mode</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div className="text-sm text-muted-foreground">
              Update the payment method for invoice <span className="font-semibold">{changeModeInvoice?.invoiceId}</span> (Amount: {formatNpr(Number(changeModeInvoice?.amount || 0))}).
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Select Payment Method</label>
              <Select value={newPaymentMethodId} onValueChange={setNewPaymentMethodId}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  {paymentMethods.map((pm) => (
                    <SelectItem key={pm.id} value={String(pm.id)}>
                      {pm.name}
                    </SelectItem>
                  ))}
                  {paymentMethods.length === 0 && (
                    <>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="ESEWA">eSewa</SelectItem>
                      <SelectItem value="KHALTI">Khalti</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setChangeModeInvoice(null)} disabled={paymentSubmitting}>Cancel</Button>
              <Button onClick={handleChangePaymentMode} disabled={paymentSubmitting}>
                {paymentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Payment Mode
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between gap-3 mr-6">
              <DialogTitle>
                {dialogView === "invoice" ? "Invoice" : "Cash Receipt"} - {selectedInvoice?.invoiceId}
              </DialogTitle>
              <div className="flex gap-2">
                <div className="flex border border-input rounded-md overflow-hidden mr-2">
                  <Button
                    variant={dialogView === "invoice" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none h-8"
                    onClick={() => setDialogView("invoice")}
                  >
                    Invoice
                  </Button>
                  {selectedInvoice?.status === "paid" && (
                    <Button
                      variant={dialogView === "receipt" ? "default" : "ghost"}
                      size="sm"
                      className="rounded-none h-8"
                      onClick={() => setDialogView("receipt")}
                    >
                      Cash Receipt
                    </Button>
                  )}
                </div>
                <Button onClick={printInvoice} className="gap-2 h-8">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </DialogHeader>
          {selectedInvoice && dialogView === "invoice" && (
            <PrintableInvoice 
              invoice={selectedInvoice} 
              isp={isp} 
              addonCharges={addonCharges} 
              tscPercentage={tscPercentage} 
            />
          )}
          {selectedInvoice && dialogView === "receipt" && (
            <PrintableReceipt 
              invoice={selectedInvoice} 
              isp={isp} 
              addonCharges={addonCharges} 
              tscPercentage={tscPercentage} 
            />
          )}
        </DialogContent>
      </Dialog>
    </CardContainer>
  )
}
