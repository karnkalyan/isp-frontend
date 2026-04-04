"use client"

import { PlusCircle, Send, UserPlus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

export function QuickActions() {
  return (
    <div className="flex items-center gap-2 mt-4 md:mt-0">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" className="rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20">
              <UserPlus className="h-5 w-5" />
              <span className="sr-only">Add User</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add User</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" className="rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20">
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">Generate Invoice</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate Invoice</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" className="rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20">
              <Send className="h-5 w-5" />
              <span className="sr-only">Send Alert</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send Alert</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
