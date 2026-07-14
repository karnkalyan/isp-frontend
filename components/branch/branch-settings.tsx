"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ShieldCheck, 
  Settings, 
  FileText, 
  Save, 
  Loader2,
  Percent,
  CircleDollarSign,
  AlertCircle
} from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import { getDynamicBaseUrl } from "@/lib/api"

interface BranchSettingsProps {
  branchId: number
  onSuccess?: () => void
}

export function BranchSettings({ branchId, onSuccess }: BranchSettingsProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [branch, setBranch] = useState<any>(null)
  const [formData, setFormData] = useState({
    commissionLimitEnabled: false,
    commissionType: "PERCENTAGE",
    commissionValue: 0,
    discountThresholdEnabled: false,
    discountThresholdValue: 0,
    invoicePrefix: ""
  })

  useEffect(() => {
    fetchBranch()
  }, [branchId])

  const fetchBranch = async () => {
    setLoading(true)
    try {
      const BASE_URL = getDynamicBaseUrl()
      const res = await axios.get(`${BASE_URL}/branch/${branchId}`)
      const data = res.data
      setBranch(data)
      setFormData({
        commissionLimitEnabled: data.commissionLimitEnabled || false,
        commissionType: data.commissionType || "PERCENTAGE",
        commissionValue: data.commissionValue || 0,
        discountThresholdEnabled: data.discountThresholdEnabled || false,
        discountThresholdValue: data.discountThresholdValue || 0,
        invoicePrefix: data.invoicePrefix || ""
      })
    } catch (err) {
      toast.error("Failed to fetch branch settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const BASE_URL = getDynamicBaseUrl()
      await axios.patch(`${BASE_URL}/branch/${branchId}`, formData)
      toast.success("Branch settings updated successfully")
      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error("Failed to update branch settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Service & Branch Settings</h2>
          <p className="text-muted-foreground">Configure commission limits, thresholds, and invoice formats for {branch?.name}</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-primary hover:bg-primary/90"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commission Limits */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              Commission Limits
            </CardTitle>
            <CardDescription>Set up static or percentage commission limits for this branch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Enable Commission Limit</label>
                <p className="text-xs text-muted-foreground">Restrict staff discounting capability.</p>
              </div>
              <Switch 
                checked={formData.commissionLimitEnabled} 
                onCheckedChange={(val) => setFormData({...formData, commissionLimitEnabled: val})} 
              />
            </div>

            {formData.commissionLimitEnabled && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Calculation Type</label>
                  <Select 
                    value={formData.commissionType} 
                    onValueChange={(val) => setFormData({...formData, commissionType: val})}
                  >
                    <SelectTrigger className="bg-background border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Percentage (%)
                        </div>
                      </SelectItem>
                      <SelectItem value="STATIC">
                        <div className="flex items-center gap-2">
                          <CircleDollarSign className="h-4 w-4" />
                          Static Amount
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Limit Value</label>
                  <Input 
                    type="number" 
                    value={formData.commissionValue} 
                    onChange={(e) => setFormData({...formData, commissionValue: Number(e.target.value)})}
                    className="bg-background border-input"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    {formData.commissionType === "PERCENTAGE" ? "Maximum percentage a staff can discount." : "Maximum static amount a staff can discount."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discount Thresholds */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-500" />
              Discount Thresholds
            </CardTitle>
            <CardDescription>Setup thresholds of max amount or percentage for period (monthly/yearly)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Enable Periodic Threshold</label>
                <p className="text-xs text-muted-foreground">Restrict total discount an entity can provide per period.</p>
              </div>
              <Switch 
                checked={formData.discountThresholdEnabled} 
                onCheckedChange={(val) => setFormData({...formData, discountThresholdEnabled: val})} 
              />
            </div>

            {formData.discountThresholdEnabled && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Periodic Limit Amount</label>
                  <Input 
                    type="number" 
                    value={formData.discountThresholdValue} 
                    onChange={(e) => setFormData({...formData, discountThresholdValue: Number(e.target.value)})}
                    className="bg-background border-input"
                  />
                </div>
                
                <div className="p-3 rounded bg-amber-500/5 border border-amber-500/10 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-[11px] text-amber-600 font-medium">
                    Once this threshold is reached, staff members will require administrator approval for any further discounts until the next period.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Configuration */}
        <Card className="bg-card border-border shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              Invoice Configuration
            </CardTitle>
            <CardDescription>Customize invoice formats and prefixes for this branch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice Prefix</label>
                <Input 
                  placeholder="e.g. KSN-BR1-" 
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({...formData, invoicePrefix: e.target.value})}
                  className="bg-background border-input font-mono"
                />
                <p className="text-xs text-muted-foreground">Prefix prepended to generated invoice PDFs and unique IDs.</p>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/20 border border-dashed border-border flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Preview</p>
                  <p className="text-lg font-mono text-foreground font-bold">
                    {formData.invoicePrefix || "KSN-"}2026-0001
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
