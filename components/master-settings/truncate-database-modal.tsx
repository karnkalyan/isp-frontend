"use client"

import { useState } from "react"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"

export function TruncateDatabaseModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [options, setOptions] = useState({
    customers: true,
    leads: true,
    packages: true,
    billing: true,
    ticketsTasks: true,
    messages: true,
    radius: true,
  })

  const toggle = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleTruncate = async () => {
    if (!password.trim()) {
      toast.error("Confirmation password is required")
      return
    }
    setBusy(true)
    try {
      const res = await apiRequest<any>("/secure-settings/truncate", {
        method: "POST",
        body: JSON.stringify({ password, options })
      })
      toast.success(res?.message || "Selected data truncated successfully")
      setPassword("")
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || "Truncate failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Truncate Database Data
            </DialogTitle>
            <Badge variant="destructive" className="uppercase text-[10px]">Caution</Badge>
          </div>
          <DialogDescription>
            Select the modules to truncate. Services, users, roles, system settings, and FreeRADIUS NAS entries are always preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {[
              { key: "customers" as const, label: "Customers & Subscriptions", desc: "Customers, subscriptions, PPPoE connections" },
              { key: "leads" as const, label: "Leads", desc: "All leads and follow-up records" },
              { key: "packages" as const, label: "Plans & Packages", desc: "Internet plans, package prices, package_plan_branches" },
              { key: "billing" as const, label: "Invoices, Recharges & Ranges", desc: "Orders, invoices, eSewa & ExternalPayment, invoice ranges" },
              { key: "ticketsTasks" as const, label: "Tickets & Tasks", desc: "Support tickets and staff tasks" },
              { key: "messages" as const, label: "Messages & Chats", desc: "All subscriber & staff chat messages" },
              { key: "radius" as const, label: "FreeRADIUS Subscribers & Groups", desc: "Clears radcheck/radreply/radusergroup/groups (keeps NAS)" },
            ].map(item => (
              <label
                key={item.key}
                className="flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer hover:bg-muted/30"
              >
                <input
                  type="checkbox"
                  checked={options[item.key]}
                  onChange={() => toggle(item.key)}
                  className="mt-0.5 rounded border-slate-400"
                />
                <div>
                  <div className="font-semibold text-sm">{item.label}</div>
                  <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="space-y-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <Label htmlFor="truncate-secret" className="text-xs font-semibold text-destructive">
              Master Confirmation Password (Required)
            </Label>
            <Input
              id="truncate-secret"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter master confirmation password"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy || !password.trim()}
            onClick={handleTruncate}
            className="gap-2"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {busy ? "Truncating..." : "Confirm Truncate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
