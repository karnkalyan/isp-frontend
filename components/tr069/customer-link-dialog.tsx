"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, User, Phone, Hash, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { Badge } from "@/components/ui/badge"

interface Lead {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  status: string
}

interface CustomerLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serialNumber: string
  deviceName: string
  onLinked: () => void
}

export function CustomerLinkDialog({
  open,
  onOpenChange,
  serialNumber,
  deviceName,
  onLinked
}: CustomerLinkDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [isLinking, setIsLinking] = useState(false)

  // Search converted leads as user types
  useEffect(() => {
    if (searchQuery.length < 2) {
      setLeads([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true)
        // Search leads using the correct singular endpoint '/lead'
        const response = await apiRequest<{ data: Lead[] }>(`/lead?search=${searchQuery}&status=converted&limit=10`)
        if (response && response.data) {
          setLeads(response.data)
        }
      } catch (err) {
        console.error("Failed to search leads:", err)
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleLink = async () => {
    if (!selectedLeadId) return

    try {
      setIsLinking(true)
      const response = await apiRequest<{ success: boolean; message: string }>(
        `/tr069-devices/${serialNumber}/link-lead`,
        {
          method: 'POST',
          body: JSON.stringify({ leadId: selectedLeadId })
        }
      )

      if (response.success) {
        toast.success("Lead linked to device successfully")
        onLinked()
        onOpenChange(false)
      } else {
        toast.error(response.message || "Failed to link lead")
      }
    } catch (err: any) {
      console.error("Link error:", err)
      toast.error(err?.message || "Failed to link lead")
    } finally {
      setIsLinking(false)
    }
  }

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setLeads([])
      setSelectedLeadId(null)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-indigo-600" />
            Link Lead to Device
          </DialogTitle>
          <DialogDescription className="text-slate-500 mt-2">
            Search for a converted lead to associate with device <span className="font-semibold text-slate-700">{deviceName}</span> (SN: {serialNumber}).
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, phone or email..."
              className="pl-9 h-11 border-slate-200 focus-visible:ring-indigo-500 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar min-h-[150px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                <p className="text-sm">Searching leads...</p>
              </div>
            ) : leads.length > 0 ? (
              <div className="space-y-2">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      selectedLeadId === lead.id
                        ? "border-indigo-600 bg-indigo-50/50"
                        : "border-slate-100 bg-slate-50/30 hover:border-indigo-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        selectedLeadId === lead.id ? "bg-indigo-600 text-white" : "bg-white text-slate-400 border border-slate-200 shadow-sm"
                      }`}>
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-semibold text-sm ${selectedLeadId === lead.id ? "text-indigo-900" : "text-slate-700"}`}>
                          {lead.firstName} {lead.lastName}
                        </span>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                            <Phone className="h-2.5 w-2.5" /> {lead.phoneNumber || "No phone"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedLeadId === lead.id && (
                      <Badge className="bg-indigo-600 text-white border-none px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold">
                        Selected
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Search className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-sm">No converted leads found.</p>
                <p className="text-[10px] text-slate-400 px-10 text-center">Make sure the lead is already converted to a customer.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <p className="text-xs italic">Start typing to search converted leads...</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100">
          <div className="flex gap-2 w-full justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={handleLink}
              disabled={!selectedLeadId || isLinking}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6"
            >
              {isLinking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                "Link to Device"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
