"use client"
import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { Save, Loader2, Building } from "lucide-react"
import { apiRequest } from "@/lib/api"

type Branch = {
  id: number
  name: string
  code: string
}

export function BranchSettings() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>("")
  const [loadingBranches, setLoadingBranches] = useState(true)

  const [settings, setSettings] = useState({
    commissionLimitEnabled: false,
    commissionLimitType: "static", // 'static' or 'percentage'
    commissionValue: "0",
    discountThresholdEnabled: false,
    discountThresholdPeriod: "monthly", // 'monthly' or 'yearly'
    discountMaxAmount: "0",
    invoicePrefix: "",
    invoiceFormat: "standard"
  })

  const [saving, setSaving] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(false)

  // Load branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await apiRequest<Branch[]>("/branches")
        setBranches(Array.isArray(data) ? data : [])
        if (Array.isArray(data) && data.length > 0) {
          setSelectedBranchId(String(data[0].id))
        }
      } catch (err) {
        toast.error("Failed to load branches")
      } finally {
        setLoadingBranches(false)
      }
    }
    fetchBranches()
  }, [])

  // Load settings when a branch is selected
  useEffect(() => {
    if (!selectedBranchId) return
    const fetchSettings = async () => {
      setLoadingSettings(true)
      try {
        const data = await apiRequest<Record<string, string>>(`/branches/${selectedBranchId}/settings`)
        setSettings({
          commissionLimitEnabled: data.commissionLimitEnabled === 'true',
          commissionLimitType: data.commissionLimitType || 'static',
          commissionValue: data.commissionValue || '0',
          discountThresholdEnabled: data.discountThresholdEnabled === 'true',
          discountThresholdPeriod: data.discountThresholdPeriod || 'monthly',
          discountMaxAmount: data.discountMaxAmount || '0',
          invoicePrefix: data.invoicePrefix || '',
          invoiceFormat: data.invoiceFormat || 'standard'
        })
      } catch (err) {
        // Fallback to default
        setSettings({
          commissionLimitEnabled: false,
          commissionLimitType: "static",
          commissionValue: "0",
          discountThresholdEnabled: false,
          discountThresholdPeriod: "monthly",
          discountMaxAmount: "0",
          invoicePrefix: "",
          invoiceFormat: "standard"
        })
      } finally {
        setLoadingSettings(false)
      }
    }
    fetchSettings()
  }, [selectedBranchId])

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const saveSettings = async () => {
    if (!selectedBranchId) return
    setSaving(true)
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        description: `Branch setting: ${key}`,
      }))

      await apiRequest(`/branches/${selectedBranchId}/settings`, {
        method: "POST",
        body: JSON.stringify({ settings: settingsArray }),
      })
      toast.success("Branch settings saved successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to save branch settings")
    } finally {
      setSaving(false)
    }
  }

  if (loadingBranches) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Service & Branch Settings</h2>
          <p className="text-muted-foreground">Configure commission limits, thresholds, and invoice formats per branch</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-64">
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(b => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={saveSettings} disabled={saving || !selectedBranchId || loadingSettings} className="flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {loadingSettings ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-6">
          <CardContainer title="Commission Limits" description="Set up static or percentage commission limits for this branch">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
               <div className="flex items-center justify-between border p-4 rounded-md">
                 <div className="space-y-0.5">
                   <Label>Enable Commission Limit</Label>
                   <p className="text-sm text-muted-foreground">Restrict staff discounting capability.</p>
                 </div>
                 <Switch checked={settings.commissionLimitEnabled} onCheckedChange={c => updateSetting("commissionLimitEnabled", c)} />
               </div>

               {settings.commissionLimitEnabled && (
                 <div className="space-y-4 border p-4 rounded-md bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="space-y-2">
                      <Label>Calculation Type</Label>
                      <Select value={settings.commissionLimitType} onValueChange={v => updateSetting("commissionLimitType", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="static">Static Amount</SelectItem>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Limit Value</Label>
                      <Input type="number" min="0" value={settings.commissionValue} onChange={e => updateSetting("commissionValue", e.target.value)} />
                    </div>
                 </div>
               )}
            </div>
          </CardContainer>

          <CardContainer title="Discount Thresholds" description="Setup thresholds of max amount or percentage for period (monthly/yearly)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
               <div className="flex items-center justify-between border p-4 rounded-md">
                 <div className="space-y-0.5">
                   <Label>Enable Periodic Threshold</Label>
                   <p className="text-sm text-muted-foreground">Restrict total discount an entity can provide per period.</p>
                 </div>
                 <Switch checked={settings.discountThresholdEnabled} onCheckedChange={c => updateSetting("discountThresholdEnabled", c)} />
               </div>

               {settings.discountThresholdEnabled && (
                 <div className="space-y-4 border p-4 rounded-md bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="space-y-2">
                      <Label>Threshold Period</Label>
                      <Select value={settings.discountThresholdPeriod} onValueChange={v => updateSetting("discountThresholdPeriod", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Total Discount (Amount)</Label>
                      <Input type="number" min="0" value={settings.discountMaxAmount} onChange={e => updateSetting("discountMaxAmount", e.target.value)} />
                    </div>
                 </div>
               )}
            </div>
          </CardContainer>

          <CardContainer title="Invoice Configuration" description="Customize invoice formats and prefixes for this branch">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <Label>Invoice Prefix</Label>
                 <Input value={settings.invoicePrefix} onChange={e => updateSetting("invoicePrefix", e.target.value)} placeholder="e.g. KSN-BR1-" />
                 <p className="text-xs text-muted-foreground">Prefix prepended to generated invoice PDFs</p>
               </div>
               <div className="space-y-2">
                  <Label>Invoice Format</Label>
                  <Select value={settings.invoiceFormat} onValueChange={v => updateSetting("invoiceFormat", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard A4</SelectItem>
                      <SelectItem value="thermal">Thermal POS Receipt</SelectItem>
                      <SelectItem value="compact">Compact Format</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
            </div>
          </CardContainer>
        </div>
      )}
    </div>
  )
}
