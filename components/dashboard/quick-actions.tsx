"use client"

import Link from "next/link"
import { FileText, MessageSquare, PlusCircle, Send, Ticket, UserPlus, Wifi } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function QuickActions() {
  const buttonVariants = {
    hover: {
      scale: 1.1,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.95,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      transition: { duration: 0.1 },
    },
  }

  return (
    <div className="flex items-center gap-2 mt-4 md:mt-0">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
              <Link href="/customers/new">
              <Button
                size="icon"
                className="rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
                aria-label="Add User"
              >
                <UserPlus className="h-5 w-5" />
                <span className="sr-only">Add User</span>
              </Button>
              </Link>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add User</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
              <Link href="/finance/invoices">
              <Button
                size="icon"
                className="rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                aria-label="Generate Invoice"
              >
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Generate Invoice</span>
              </Button>
              </Link>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate Invoice</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
              <Link href="/notices">
              <Button
                size="icon"
                className="rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                aria-label="Send Alert"
              >
                <Send className="h-5 w-5" />
                <span className="sr-only">Send Alert</span>
              </Button>
              </Link>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send Alert</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {[
        { label: "Create Ticket", href: "/tickets/create", icon: Ticket, className: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" },
        { label: "Lead", href: "/leads/create", icon: PlusCircle, className: "bg-teal-500 hover:bg-teal-600 shadow-teal-500/20" },
        { label: "Reports", href: "/reports", icon: FileText, className: "bg-violet-500 hover:bg-violet-600 shadow-violet-500/20" },
        { label: "Real-Time", href: "/dashboard/real-time", icon: Wifi, className: "bg-cyan-500 hover:bg-cyan-600 shadow-cyan-500/20" },
        { label: "Messages", href: "/messages", icon: MessageSquare, className: "bg-slate-500 hover:bg-slate-600 shadow-slate-500/20" },
      ].map((item) => (
        <TooltipProvider key={item.label}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                <Link href={item.href}>
                  <Button size="icon" className={`rounded-full shadow-lg ${item.className}`} aria-label={item.label}>
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Button>
                </Link>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}
