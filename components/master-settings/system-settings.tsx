"use client"

import { useState } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"
import { Save } from "lucide-react"

type DiscountEntry = {
  enabled: boolean
  isPercent: boolean
  value: number // if isPercent -> 0-100, else NPR flat amount
}

export function SystemSettings() {
  const [settings, setSettings] = useState({
    companyName: "KisanNET",
    companyEmail: "admin@kisannet.com",
    companyPhone: "+977-1-4444444",
    companyAddress: "Kathmandu, Nepal",
    timezone: "Asia/Kathmandu",
    currency: "NPR",
    language: "en",
    maintenanceMode: false,
    autoBackup: true,
    emailNotifications: true,
    smsNotifications: false,
    backupRetentionDays: "30",
    sessionTimeout: "60",
    maxLoginAttempts: "5",
    passwordMinLength: "8",
    termsAndConditions: "By using our services, you agree to our terms and conditions...",
    privacyPolicy: "We respect your privacy and are committed to protecting your personal data...",
    // NEW: global discount settings for members
    newMemberDiscount: {
      enabled: true,
      isPercent: true,
      value: 13,
    } as DiscountEntry,
    renewalDiscount: {
      enabled: true,
      isPercent: true,
      value: 10.5,
    } as DiscountEntry,
  })

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updateDiscount = (which: "newMemberDiscount" | "renewalDiscount", patch: Partial<DiscountEntry>) => {
    setSettings((prev) => ({
      ...prev,
      [which]: {
        ...(prev as any)[which],
        ...patch,
      },
    }))
  }

  const validate = () => {
    const n = settings.newMemberDiscount
    const r = settings.renewalDiscount
    if (!settings.companyName?.trim()) {
      toast.error("Company name is required")
      return false
    }
    if (n.enabled && n.isPercent && (n.value < 0 || n.value > 100)) {
      toast.error("New member discount percent must be between 0 and 100")
      return false
    }
    if (r.enabled && r.isPercent && (r.value < 0 || r.value > 100)) {
      toast.error("Renewal discount percent must be between 0 and 100")
      return false
    }
    if (n.enabled && !n.isPercent && n.value < 0) {
      toast.error("New member flat discount must be >= 0")
      return false
    }
    if (r.enabled && !r.isPercent && r.value < 0) {
      toast.error("Renewal flat discount must be >= 0")
      return false
    }
    return true
  }

  const saveSettings = () => {
    if (!validate()) return

    // Replace this with real API call
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => resolve(true), 900)
      }),
      {
        loading: "Saving system settings...",
        success: "System settings saved successfully!",
        error: "Failed to save system settings",
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Configuration</h2>
          <p className="text-muted-foreground">Configure general system settings</p>
        </div>
        <Button onClick={saveSettings} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>

      <div className="grid gap-6">
        <CardContainer title="Company Information" description="Basic company details">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => updateSetting("companyName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Company Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => updateSetting("companyEmail", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Company Phone</Label>
                <Input
                  id="companyPhone"
                  value={settings.companyPhone}
                  onChange={(e) => updateSetting("companyPhone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Input
                  id="companyAddress"
                  value={settings.companyAddress}
                  onChange={(e) => updateSetting("companyAddress", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="Regional Settings" description="Timezone, currency and language settings">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.timezone} onValueChange={(value) => updateSetting("timezone", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kathmandu">Asia/Kathmandu</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => updateSetting("currency", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NPR">NPR - Nepalese Rupee</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={settings.language} onValueChange={(value) => updateSetting("language", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ne">Nepali</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="Global Membership Discounts" description="Set default discounts applied to members (first install + renewals)">
          <div className="space-y-4">
            {/* New Member Discount */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">New Member Discount</h4>
                  <div className="text-sm text-muted-foreground">Applied to first/installation invoice for members</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">Enable</span>
                  <Switch
                    checked={settings.newMemberDiscount.enabled}
                    onCheckedChange={(v) =>
                      updateDiscount("newMemberDiscount", { enabled: Boolean(v) })
                    }
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Percent</span>
                  <Switch
                    checked={settings.newMemberDiscount.isPercent}
                    onCheckedChange={(v) =>
                      updateDiscount("newMemberDiscount", { isPercent: Boolean(v) })
                    }
                  />
                  <span className="text-sm">{settings.newMemberDiscount.isPercent ? "%" : "Flat"}</span>
                </div>

                <div>
                  <Label>Value</Label>
                  <Input
                    type="number"
                    placeholder={settings.newMemberDiscount.isPercent ? "e.g. 13" : "e.g. 1500"}
                    value={String(settings.newMemberDiscount.value)}
                    onChange={(e) =>
                      updateDiscount("newMemberDiscount", { value: Number(e.target.value) })
                    }
                    min={0}
                    max={settings.newMemberDiscount.isPercent ? 100 : undefined}
                  />
                </div>

                <div className="flex items-center">
                  <div className="text-sm text-muted-foreground">Preview: </div>
                  <div className="ml-2 font-medium">
                    {settings.newMemberDiscount.enabled
                      ? settings.newMemberDiscount.isPercent
                        ? `${settings.newMemberDiscount.value}% off`
                        : `Flat ${settings.newMemberDiscount.value} NPR off`
                      : "Disabled"}
                  </div>
                </div>
              </div>
            </div>

            {/* Renewal Discount */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Renewal Discount</h4>
                  <div className="text-sm text-muted-foreground">Applied to recurring/recharge invoices</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">Enable</span>
                  <Switch
                    checked={settings.renewalDiscount.enabled}
                    onCheckedChange={(v) =>
                      updateDiscount("renewalDiscount", { enabled: Boolean(v) })
                    }
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Percent</span>
                  <Switch
                    checked={settings.renewalDiscount.isPercent}
                    onCheckedChange={(v) =>
                      updateDiscount("renewalDiscount", { isPercent: Boolean(v) })
                    }
                  />
                  <span className="text-sm">{settings.renewalDiscount.isPercent ? "%" : "Flat"}</span>
                </div>

                <div>
                  <Label>Value</Label>
                  <Input
                    type="number"
                    placeholder={settings.renewalDiscount.isPercent ? "e.g. 10.5" : "e.g. 850"}
                    value={String(settings.renewalDiscount.value)}
                    onChange={(e) =>
                      updateDiscount("renewalDiscount", { value: Number(e.target.value) })
                    }
                    min={0}
                    max={settings.renewalDiscount.isPercent ? 100 : undefined}
                  />
                </div>

                <div className="flex items-center">
                  <div className="text-sm text-muted-foreground">Preview: </div>
                  <div className="ml-2 font-medium">
                    {settings.renewalDiscount.enabled
                      ? settings.renewalDiscount.isPercent
                        ? `${settings.renewalDiscount.value}% off`
                        : `Flat ${settings.renewalDiscount.value} NPR off`
                      : "Disabled"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="System Preferences" description="General system behavior settings">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <div className="text-sm text-muted-foreground">Enable maintenance mode to restrict access</div>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Backup</Label>
                  <div className="text-sm text-muted-foreground">Automatically backup system data</div>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => updateSetting("autoBackup", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">Send email notifications for important events</div>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <div className="text-sm text-muted-foreground">Send SMS notifications for critical alerts</div>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => updateSetting("smsNotifications", checked)}
                />
              </div>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="Security Settings" description="Authentication and security preferences">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting("sessionTimeout", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => updateSetting("maxLoginAttempts", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => updateSetting("passwordMinLength", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backupRetentionDays">Backup Retention (days)</Label>
              <Input
                id="backupRetentionDays"
                type="number"
                value={settings.backupRetentionDays}
                onChange={(e) => updateSetting("backupRetentionDays", e.target.value)}
              />
            </div>
          </div>
        </CardContainer>

        <CardContainer title="Legal Documents" description="Terms and conditions, privacy policy">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
              <Textarea
                id="termsAndConditions"
                rows={4}
                value={settings.termsAndConditions}
                onChange={(e) => updateSetting("termsAndConditions", e.target.value)}
                placeholder="Enter terms and conditions..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacyPolicy">Privacy Policy</Label>
              <Textarea
                id="privacyPolicy"
                rows={4}
                value={settings.privacyPolicy}
                onChange={(e) => updateSetting("privacyPolicy", e.target.value)}
                placeholder="Enter privacy policy..."
              />
            </div>
          </div>
        </CardContainer>
      </div>
    </div>
  )
}
