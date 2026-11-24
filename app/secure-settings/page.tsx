"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Clock, Database, Download, Loader2, Mail, Save, ShieldAlert, Trash2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { TruncateDatabaseModal } from "@/components/master-settings/truncate-database-modal"
import { apiRequest, getDynamicBaseUrl } from "@/lib/api"
import { toast } from "react-hot-toast"

export default function SecureSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [truncateOpen, setTruncateOpen] = useState(false)

  const [schedule, setSchedule] = useState({
    enabled: false,
    cronExpression: "0 2 * * *",
    email: "",
  })

  useEffect(() => {
    apiRequest<typeof schedule>("/secure-settings/backup/schedule")
      .then((res) => {
        if (res) setSchedule(res)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSaveSchedule = async () => {
    setSaving(true)
    try {
      await apiRequest("/secure-settings/backup/schedule", {
        method: "PUT",
        body: JSON.stringify(schedule),
      })
      toast.success("Database backup schedule saved")
    } catch (err: any) {
      toast.error(err?.message || "Failed to save schedule")
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadBackup = async () => {
    setDownloading(true)
    try {
      const base = getDynamicBaseUrl().replace(/\/+$/, "")
      const res = await fetch(`${base}/secure-settings/backup/download`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to download backup")
      const blob = await res.blob()
      const disposition = res.headers.get("content-disposition") || ""
      const match = disposition.match(/filename="([^"]+)"/)
      const filename = match?.[1] || `isp-backup-${new Date().toISOString().slice(0, 10)}.sql`
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Database backup downloaded")
    } catch (err: any) {
      toast.error(err?.message || "Backup download failed")
    } finally {
      setDownloading(false)
    }
  }

  const handleSendNow = async () => {
    if (!schedule.email.trim()) {
      toast.error("Enter a recipient email address first")
      return
    }
    setSending(true)
    try {
      const res = await apiRequest<any>("/secure-settings/backup/send-now", {
        method: "POST",
        body: JSON.stringify({ email: schedule.email.trim() }),
      })
      toast.success(res?.message || "Backup emailed successfully")
    } catch (err: any) {
      toast.error(err?.message || "Failed to send backup email")
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold">Secure Maintenance Settings</h1>
            <p className="text-sm text-muted-foreground">Database backup automation, manual export, and controlled data reset.</p>
          </div>
        </div>

        <CardContainer
          title="Database Backup & Daily Email Cron"
          description="Download a full database backup anytime or configure a cron schedule to email daily backups automatically."
        >
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={handleDownloadBackup} disabled={downloading} className="gap-2">
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {downloading ? "Generating Backup..." : "Download DB Backup"}
                </Button>
                <Button type="button" variant="outline" onClick={handleSendNow} disabled={sending} className="gap-2">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {sending ? "Sending..." : "Email Backup Now"}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-sm font-semibold">Enable Automatic Backup Cron</Label>
                  <p className="text-xs text-muted-foreground">Automatically generate and email DB backups on the configured schedule</p>
                </div>
                <Switch
                  checked={schedule.enabled}
                  onCheckedChange={(enabled) => setSchedule(prev => ({ ...prev, enabled }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Cron Schedule Expression
                  </Label>
                  <Input
                    value={schedule.cronExpression}
                    onChange={(e) => setSchedule(prev => ({ ...prev, cronExpression: e.target.value }))}
                    placeholder="0 2 * * *"
                    className="font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">Default: <code>0 2 * * *</code> (daily at 2:00 AM)</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Backup Recipient Email
                  </Label>
                  <Input
                    type="email"
                    value={schedule.email}
                    onChange={(e) => setSchedule(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@yourdomain.com"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={handleSaveSchedule} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Backup Schedule
                </Button>
              </div>
            </div>
          )}
        </CardContainer>

        <CardContainer
          title="Database Truncate (Danger Zone)"
          description="Selectively wipe transactional, subscriber, package, and FreeRADIUS subscriber data while keeping services, users, settings, and NAS intact."
        >
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-destructive">
                <Database className="h-4 w-4" />
                Truncate Operational Data
                <Badge variant="destructive" className="text-[10px] uppercase">Caution</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Requires master confirmation password. Preserves users, services, system settings, and NAS.
              </p>
            </div>
            <Button type="button" variant="destructive" onClick={() => setTruncateOpen(true)} className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Truncate Database
            </Button>
          </div>
        </CardContainer>

        <TruncateDatabaseModal open={truncateOpen} onOpenChange={setTruncateOpen} />
      </div>
    </DashboardLayout>
  )
}
