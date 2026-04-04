"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { FileText, Download, Eye, Calendar, CreditCard, CheckCircle2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CardContainer } from "@/components/ui/card-container"

// Mock data for invoices
const invoices = [
  {
    id: "INV-2023-04",
    date: "2023-04-15",
    amount: "$89.99",
    status: "pending",
    dueDate: "2023-04-30",
  },
  {
    id: "INV-2023-03",
    date: "2023-03-15",
    amount: "$89.99",
    status: "paid",
    dueDate: "2023-03-30",
    paidDate: "2023-03-20",
  },
  {
    id: "INV-2023-02",
    date: "2023-02-15",
    amount: "$89.99",
    status: "paid",
    dueDate: "2023-02-28",
    paidDate: "2023-02-18",
  },
  {
    id: "INV-2023-01",
    date: "2023-01-15",
    amount: "$89.99",
    status: "paid",
    dueDate: "2023-01-30",
    paidDate: "2023-01-22",
  },
]

export function CustomerInvoices() {
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)

  return (
    <CardContainer
      title="Billing History"
      description="Recent invoices and payment history"
      className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
    >
      <div className="rounded-md border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium">Invoice</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Amount</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {Array.isArray(invoices) && invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50 data-[state=selected]:bg-muted"
                    onClick={() => setSelectedInvoice(invoice.id === selectedInvoice ? null : invoice.id)}
                  >
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <FileText
                          className={`h-4 w-4 ${invoice.status === "paid" ? "text-green-500" : "text-amber-500"}`}
                        />
                        <span className="font-medium">{invoice.id}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(invoice.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{invoice.amount}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {invoice.status === "paid" ? (
                        <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-700 dark:text-green-400 border-0 flex w-fit items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Paid</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 text-amber-700 dark:text-amber-400 border-0 flex w-fit items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>Pending</span>
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center">
                    <p className="text-muted-foreground">No invoices found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <Button
          variant="outline"
          className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
        >
          View All Invoices
        </Button>
      </div>
    </CardContainer>
  )
}
