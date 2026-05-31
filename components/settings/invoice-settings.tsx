"use client"

import { useState, useEffect } from "react"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useBranch } from "@/contexts/BranchContext"
import { Loader2, Hash } from "lucide-react"

export function InvoiceSettings() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { selectedBranchId } = useBranch()
  
  const [prefix, setPrefix] = useState("INV-")
  const [startRange, setStartRange] = useState("1000")
  const [endRange, setEndRange] = useState("9999")
  const [currentNumber, setCurrentNumber] = useState("1000")

  useEffect(() => {
    const loadRanges = async () => {
      if (!selectedBranchId) return
      setLoading(true)
      try {
        const ranges = await apiRequest<any[]>(`/branches/${selectedBranchId}/invoice-ranges`)
        const active = ranges?.find(range => range.isActive) || ranges?.[0]
        if (active) {
          setStartRange(String(active.rangeStart))
          setEndRange(String(active.rangeEnd))
          setCurrentNumber(String(active.current))
        }
      } catch (error) {
        console.error("Failed to load invoice ranges:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRanges()
  }, [selectedBranchId])
  
  const handleSave = async () => {
    setSaving(true)
    try {
      if (!selectedBranchId) throw new Error("No branch selected.")
      
      await apiRequest(`/branches/${selectedBranchId}/invoice-ranges`, {
        method: "POST",
        body: JSON.stringify({
          prefix,
          rangeStart: parseInt(startRange),
          rangeEnd: parseInt(endRange),
          current: parseInt(currentNumber),
          makeActive: true
        })
      })
      toast({ title: "Success", description: "Invoice settings updated successfully." })
      
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (!selectedBranchId) {
    return <div className="text-center p-6 text-muted-foreground border border-dashed rounded-lg">Please select a branch from the header to configure its invoice settings.</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Invoice Sequence Configuration</h3>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          
          <div className="space-y-2">
            <Label>Invoice Prefix</Label>
            <Input 
              value={prefix} 
              onChange={e => setPrefix(e.target.value)} 
              placeholder="e.g. INV-" 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Start Range</Label>
            <Input 
              type="number"
              value={startRange} 
              onChange={e => setStartRange(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground">The first invoice number</p>
          </div>
          
          <div className="space-y-2">
            <Label>End Range</Label>
            <Input 
              type="number"
              value={endRange} 
              onChange={e => setEndRange(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground">The maximum invoice number for this branch</p>
          </div>
          
          <div className="space-y-2">
            <Label>Current Number</Label>
            <Input 
              type="number"
              value={currentNumber} 
              onChange={e => setCurrentNumber(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground">The next invoice to be generated will use this number</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Invoice Settings
        </Button>
      </div>
    </div>
  )
}
