"use client"

import { CardContainer } from "@/components/ui/card-container"
import { StatusBadge } from "@/components/ui/status-badge"
import { MoreHorizontal, FileText } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

// Mock data
const invoices = [
  {
    id: "INV-001",
    customer: "Alex Johnson",
    customerId: "CUST-001",
    date: "2023-05-15",
    dueDate: "2023-06-15",
    amount: "$245.50",
    status: "paid",
  },
  {
    id: "INV-002",
    customer: "Sarah Williams",
    customerId: "CUST-002",
    date: "2023-05-20",
    dueDate: "2023-06-20",
    amount: "$189.99",
    status: "pending",
  },
  {
    id: "INV-003",
    customer: "Michael Brown",
    customerId: "CUST-003",
    date: "2023-04-10",
    dueDate: "2023-05-10",
    amount: "$120.75",
    status: "overdue",
  },
  {
    id: "INV-004",
    customer: "Emily Davis",
    customerId: "CUST-004",
    date: "2023-05-25",
    dueDate: "2023-06-25",
    amount: "$50.25",
    status: "paid",
  },
  {
    id: "INV-005",
    customer: "Robert Wilson",
    customerId: "CUST-005",
    date: "2023-05-30",
    dueDate: "2023-06-30",
    amount: "$350.00",
    status: "pending",
  },
]

export function InvoicesList() {
  return (
    <CardContainer title="Recent Invoices" description="Latest customer invoices and payments">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left p-4 text-sm font-medium text-slate-400">Invoice ID</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Customer</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Date</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Amount</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
              <th className="text-right p-4 text-sm font-medium text-slate-400"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-slate-800 hover:bg-slate-800/10">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-blue-500/20">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-white">{invoice.id}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-slate-300">{invoice.customer}</div>
                  <div className="text-xs text-slate-400">{invoice.customerId}</div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-slate-300">{new Date(invoice.date).toLocaleDateString()}</div>
                  <div className="text-xs text-slate-400">Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                </td>
                <td className="p-4 text-sm font-medium text-white">{invoice.amount}</td>
                <td className="p-4">
                  <StatusBadge status={invoice.status as any} />
                </td>
                <td className="p-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px] bg-slate-900 border-slate-800">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-800" />
                      <DropdownMenuItem className="text-slate-400 hover:text-white focus:text-white hover:bg-slate-800 focus:bg-slate-800">
                        View invoice
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-400 hover:text-white focus:text-white hover:bg-slate-800 focus:bg-slate-800">
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-400 hover:text-white focus:text-white hover:bg-slate-800 focus:bg-slate-800">
                        Send reminder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-800" />
                      <DropdownMenuItem className="text-slate-400 hover:text-white focus:text-white hover:bg-slate-800 focus:bg-slate-800">
                        Mark as paid
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex justify-center">
        <Button variant="outline" className="text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white">
          View All Invoices
        </Button>
      </div>
    </CardContainer>
  )
}
