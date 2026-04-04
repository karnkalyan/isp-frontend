"use client"

import { PlusCircle, Send, UserPlus } from "lucide-react"
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
              <Button
                size="icon"
                className="rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
                aria-label="Add User"
              >
                <UserPlus className="h-5 w-5" />
                <span className="sr-only">Add User</span>
              </Button>
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
              <Button
                size="icon"
                className="rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                aria-label="Generate Invoice"
              >
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Generate Invoice</span>
              </Button>
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
              <Button
                size="icon"
                className="rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                aria-label="Send Alert"
              >
                <Send className="h-5 w-5" />
                <span className="sr-only">Send Alert</span>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send Alert</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
