"use client"

import { CardContainer } from "@/components/ui/card-container"
import { StatusBadge } from "@/components/ui/status-badge"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

const orders = [
  {
    id: "ORD-001",
    customer: "John Smith",
    product: "Fiber Internet 100Mbps",
    date: "2025-05-01",
    amount: "$89.99",
    status: "completed",
  },
  {
    id: "ORD-002",
    customer: "Sarah Johnson",
    product: "IPTV Premium Package",
    date: "2025-05-01",
    amount: "$120.00",
    status: "processing",
  },
  {
    id: "ORD-003",
    customer: "Michael Brown",
    product: "VoIP Business Line",
    date: "2025-04-30",
    amount: "$45.50",
    status: "completed",
  },
  {
    id: "ORD-004",
    customer: "Emily Davis",
    product: "Fiber Internet 500Mbps",
    date: "2025-04-30",
    amount: "$129.99",
    status: "failed",
  },
  {
    id: "ORD-005",
    customer: "Robert Wilson",
    product: "Mobile Data Plan",
    date: "2025-04-29",
    amount: "$35.00",
    status: "processing",
  },
]

export function RecentOrders() {
  return (
    <CardContainer title="Recent Orders" description="Latest customer orders and their status">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left p-4 text-sm font-medium text-slate-400">Order ID</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Customer</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Product</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Date</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Amount</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
              <th className="text-right p-4 text-sm font-medium text-slate-400"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-slate-800 hover:bg-slate-800/10">
                <td className="p-4 text-sm text-slate-300">{order.id}</td>
                <td className="p-4 text-sm text-slate-300">{order.customer}</td>
                <td className="p-4 text-sm text-slate-300">{order.product}</td>
                <td className="p-4 text-sm text-slate-300">{new Date(order.date).toLocaleDateString()}</td>
                <td className="p-4 text-sm font-medium text-white">{order.amount}</td>
                <td className="p-4">
                  <StatusBadge status={order.status as any} />
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex justify-center border-t border-slate-800">
        <Button variant="outline" className="text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white">
          View All Orders
        </Button>
      </div>
    </CardContainer>
  )
}
