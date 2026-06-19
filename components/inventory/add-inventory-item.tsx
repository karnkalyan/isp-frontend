"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiRequest } from "@/lib/api"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Package, Tag, Hash, Command } from "lucide-react"

const formatEponMacAddress = (value: string) => {
  const hex = value.replace(/[^a-fA-F0-9]/g, "").slice(0, 12).toLowerCase()
  return hex.match(/.{1,4}/g)?.join(".") || ""
}

export function AddInventoryItem() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [branches, setBranches] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [loadingBranches, setLoadingBranches] = useState(true)
  
  const [formData, setFormData] = useState({
    type: "ONT",
    name: "",
    model: "",
    serialNumber: "",
    ponSerialNumber: "",
    macAddress: "",
    branchId: "none",
    vendorId: "none",
    qty: "1",
  })

  useEffect(() => {
    async function fetchBranches() {
      try {
        const data = await apiRequest("/branches/my-access") // Hierarchical branches
        setBranches(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [])
      } catch (err: any) {
        console.error("Failed to load branches:", err)
        // Fallback to all branches if my-access fails or not implemented
        try {
          const fallbackData = await apiRequest("/branch")
          const list = Array.isArray(fallbackData) ? fallbackData : Array.isArray(fallbackData?.data) ? fallbackData.data : []
          setBranches(list)
        } catch(e) {}
      } finally {
        setLoadingBranches(false)
      }
    }
    fetchBranches()
    apiRequest("/vendors").then(data => {
      setVendors(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [])
    }).catch(() => setVendors([]))
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: field === "macAddress" ? formatEponMacAddress(value) : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const isSerialized = formData.type === "ONT" || formData.type === "OLT" || formData.type === "ROUTE" || formData.type === "SWITCH"
      const payload = {
        ...formData,
        qty: isSerialized ? 1 : parseInt(formData.qty) || 1,
        branchId: formData.branchId === "none" ? null : formData.branchId,
        vendorId: formData.vendorId === "none" ? null : formData.vendorId,
      }

      await apiRequest("/inventory", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      
      toast({
        title: "Success",
        description: "Inventory item added successfully.",
      })
      
      router.push("/inventory")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add inventory item",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CardContainer title="Device Details" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <Label>Item Type</Label>
            <div className="relative">
              <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
              <Select value={formData.type} onValueChange={(v) => handleChange("type", v)}>
                <SelectTrigger className="pl-9 bg-white dark:bg-slate-950">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONT">ONT (Customer Device)</SelectItem>
                  <SelectItem value="OLT">OLT</SelectItem>
                  <SelectItem value="DROPWIRE">Drop Wire / Cable</SelectItem>
                  <SelectItem value="ROUTE">Router</SelectItem>
                  <SelectItem value="SWITCH">Switch</SelectItem>
                  <SelectItem value="OTHER">Other Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Item Name</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={formData.type === "DROPWIRE" ? "e.g., 2-Core Drop Wire 100m" : "e.g., Nokia G-140W-C ONT"}
                className="pl-9 bg-white dark:bg-slate-950"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Model {formData.type === "OLT" || formData.type === "ONT" || formData.type === "ROUTE" ? "(Required)" : "(Optional)"}</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g., G-140W-C"
                className="pl-9 bg-white dark:bg-slate-950"
                value={formData.model || ""}
                onChange={(e) => handleChange("model", e.target.value)}
                required={formData.type === "OLT" || formData.type === "ONT" || formData.type === "ROUTE"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Serial Number {formData.type === "OLT" || formData.type === "ONT" || formData.type === "ROUTE" || formData.type === "SWITCH" ? "(Required)" : "(Optional)"}</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Unique Serial Number"
                className="pl-9 bg-white dark:bg-slate-950"
                value={formData.serialNumber}
                onChange={(e) => handleChange("serialNumber", e.target.value)}
                required={formData.type === "OLT" || formData.type === "ONT" || formData.type === "ROUTE" || formData.type === "SWITCH"}
              />
            </div>
          </div>


          {(formData.type === "ONT" || formData.type === "OLT") && (
             <div className="space-y-2">
               <Label>PON Serial Number (Optional)</Label>
               <div className="relative">
                 <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                 <Input
                   placeholder="e.g., ALCLF1234567"
                   className="pl-9 bg-white dark:bg-slate-950"
                   value={formData.ponSerialNumber}
                   onChange={(e) => handleChange("ponSerialNumber", e.target.value)}
                 />
               </div>
             </div>
          )}

          {formData.type !== "DROPWIRE" && (
            <div className="space-y-2">
              <Label>MAC Address (Optional)</Label>
              <div className="relative">
                <Command className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="d05f.af07.c908"
                  className="pl-9 bg-white dark:bg-slate-950 lowercase font-mono"
                  value={formData.macAddress}
                  onChange={(e) => handleChange("macAddress", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Quantity</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground text-slate-500" />
              <Input
                type="number"
                min="1"
                placeholder="1"
                className="pl-9 bg-white dark:bg-slate-950"
                value={formData.type === "ONT" || formData.type === "OLT" || formData.type === "ROUTE" || formData.type === "SWITCH" ? "1" : formData.qty}
                onChange={(e) => handleChange("qty", e.target.value)}
                disabled={formData.type === "ONT" || formData.type === "OLT" || formData.type === "ROUTE" || formData.type === "SWITCH"}
              />
            </div>
            {(formData.type === "ONT" || formData.type === "OLT" || formData.type === "ROUTE" || formData.type === "SWITCH") && (
              <p className="text-[10px] text-muted-foreground mt-1">Serialized items are added with quantity 1.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Vendor</Label>
            <Select value={formData.vendorId} onValueChange={(v) => handleChange("vendorId", v)}>
              <SelectTrigger className="bg-white dark:bg-slate-950">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Vendor</SelectItem>
                {vendors.map(vendor => (
                  <SelectItem key={vendor.id} value={vendor.id.toString()}>
                    {vendor.name}{vendor.companyName ? ` - ${vendor.companyName}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
      </CardContainer>

      <CardContainer title="Assignment & Tracking" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Initial Branch Assignment</Label>
            <Select 
               value={formData.branchId} 
               onValueChange={(v) => handleChange("branchId", v)}
               disabled={loadingBranches}
            >
              <SelectTrigger className="bg-white dark:bg-slate-950">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Head Office (Unassigned)</SelectItem>
                {branches.map(b => (
                   <SelectItem key={b.id} value={b.id.toString()}>
                    {b.parentId ? "Sub-branch: " : "Branch: "}{b.name}
                   </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Assigning to a branch makes it available for customer installation by technicians in that branch.</p>
          </div>
        </div>
      </CardContainer>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
             <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : "Add Inventory Item"}
        </Button>
      </div>
    </form>
  )
}
