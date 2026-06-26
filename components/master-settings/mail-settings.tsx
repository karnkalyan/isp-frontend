"use client"
import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-hot-toast"
import { Save, Loader2, Mail } from "lucide-react"
import { apiRequest } from "@/lib/api"

export function MailSettings() {
  const [settings, setSettings] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
    smtpFrom: "",
    smtpSecure: false,
    enableEmailService: true,
    enableMailNotifications: true,
    enableSmsService: true,
    imapHost: "",
    imapPort: "993",
    imapUser: "",
    imapPass: "",
    imapSecure: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await apiRequest<Record<string, string>>("/settings")
        if (data && typeof data === 'object') {
          setSettings(prev => ({
            ...prev,
            smtpHost: data.smtpHost || prev.smtpHost,
            smtpPort: data.smtpPort || prev.smtpPort,
            smtpUser: data.smtpUser || prev.smtpUser,
            smtpPass: data.smtpPass || prev.smtpPass,
            smtpFrom: data.smtpFrom || prev.smtpFrom,
            smtpSecure: data.smtpSecure === 'true',
            enableEmailService: data.enableEmailService !== 'false',
            enableMailNotifications: data.enableMailNotifications !== 'false' && data.emailNotifications !== 'false',
            enableSmsService: data.enableSmsService !== 'false' && data.smsNotifications !== 'false',
            imapHost: data.imapHost || prev.imapHost,
            imapPort: data.imapPort || prev.imapPort,
            imapUser: data.imapUser || prev.imapUser,
            imapPass: data.imapPass || prev.imapPass,
            imapSecure: data.imapSecure !== 'false',
          }))
        }
      } catch (e) {
        // Fallback
      }
    }
    loadSettings()
  }, [])

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const settingsArray = Object.entries(settings)
        .filter(([key, value]) => !["smtpPass", "imapPass"].includes(key) || String(value || "").trim().length > 0)
        .map(([key, value]) => ({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          description: `Mail setting: ${key}`,
        }))

      await apiRequest("/settings/batch", {
        method: "POST",
        body: JSON.stringify({ settings: settingsArray }),
      })
      toast.success("Mail settings saved successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to save mail settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mail Setup</h2>
          <p className="text-muted-foreground">Configure SMTP server for company emails</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="flex items-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <CardContainer title="Communication Services" description="Enable or disable outgoing communication services">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-0.5">
              <Label>Email Service</Label>
              <div className="text-sm text-muted-foreground">Master SMTP on/off switch</div>
            </div>
            <Switch checked={settings.enableEmailService} onCheckedChange={checked => updateSetting("enableEmailService", checked)} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <div className="text-sm text-muted-foreground">Allow optional notification emails</div>
            </div>
            <Switch checked={settings.enableMailNotifications} onCheckedChange={checked => updateSetting("enableMailNotifications", checked)} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-0.5">
              <Label>SMS Service</Label>
              <div className="text-sm text-muted-foreground">Master SMS gateway on/off switch</div>
            </div>
            <Switch checked={settings.enableSmsService} onCheckedChange={checked => updateSetting("enableSmsService", checked)} />
          </div>
        </div>
      </CardContainer>

      <CardContainer title="SMTP Configuration" description="Provide your email server credentials">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>SMTP Host</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" value={settings.smtpHost} onChange={e => updateSetting("smtpHost", e.target.value)} placeholder="smtp.gmail.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>SMTP Port</Label>
            <Input value={settings.smtpPort} onChange={e => updateSetting("smtpPort", e.target.value)} placeholder="587" />
          </div>
          <div className="space-y-2">
            <Label>SMTP User</Label>
            <Input value={settings.smtpUser} onChange={e => updateSetting("smtpUser", e.target.value)} placeholder="user@company.com" />
          </div>
          <div className="space-y-2">
            <Label>SMTP Password</Label>
            <Input type="password" value={settings.smtpPass} onChange={e => updateSetting("smtpPass", e.target.value)} placeholder="********" />
          </div>
          <div className="space-y-2">
            <Label>From Address</Label>
            <Input value={settings.smtpFrom} onChange={e => updateSetting("smtpFrom", e.target.value)} placeholder="noreply@company.com" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-6 max-w-sm">
          <div className="space-y-0.5">
            <Label>Use SSL/TLS Security</Label>
            <div className="text-sm text-muted-foreground">Enable secure connection</div>
          </div>
          <Switch checked={settings.smtpSecure} onCheckedChange={checked => updateSetting("smtpSecure", checked)} />
        </div>
      </CardContainer>

      <CardContainer title="IMAP Inbox Configuration" description="Provide your mailbox credentials for incoming mail">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>IMAP Host</Label>
            <Input value={settings.imapHost} onChange={e => updateSetting("imapHost", e.target.value)} placeholder="imap.gmail.com" />
          </div>
          <div className="space-y-2">
            <Label>IMAP Port</Label>
            <Input value={settings.imapPort} onChange={e => updateSetting("imapPort", e.target.value)} placeholder="993" />
          </div>
          <div className="space-y-2">
            <Label>IMAP User</Label>
            <Input value={settings.imapUser} onChange={e => updateSetting("imapUser", e.target.value)} placeholder="user@company.com" />
          </div>
          <div className="space-y-2">
            <Label>IMAP Password</Label>
            <Input type="password" value={settings.imapPass} onChange={e => updateSetting("imapPass", e.target.value)} placeholder="********" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-6 max-w-sm">
          <div className="space-y-0.5">
            <Label>Use IMAP SSL/TLS</Label>
            <div className="text-sm text-muted-foreground">Most inboxes use SSL on port 993</div>
          </div>
          <Switch checked={settings.imapSecure} onCheckedChange={checked => updateSetting("imapSecure", checked)} />
        </div>
      </CardContainer>
    </div>
  )
}
