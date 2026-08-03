"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CardContainer } from "@/components/ui/card-container"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { Copy, Loader2, ShieldCheck, Trash2 } from "lucide-react"

type LicenseStatus = {
  active: boolean
  configured?: boolean
  hwid: string
  company?: string
  contact?: string | null
  licenseId?: string
  expiresAt?: string | null
  issuedAt?: string | null
  message?: string
  error?: string
  isp?: { companyName?: string } | null
  publicIsp?: { companyName?: string } | null
}

export type GeneratedLicense = {
  id: number
  licenseId: string
  company: string
  contact?: string | null
  hwid: string
  status: string
  expiresAt: string
  issuedAt?: string
  installedAt?: string | null
  installedIspId?: number | null
  createdByEmail?: string | null
  revokedAt?: string | null
  revokedByEmail?: string | null
  revokeReason?: string | null
  createdAt?: string
  updatedAt?: string
}

export function LicenseSettings() {
  const [status, setStatus] = useState<LicenseStatus | null>(null)
  const [token, setToken] = useState("")
  const [tr069SecretKey, setTr069SecretKey] = useState("CMSADMIN2026")
  const [loading, setLoading] = useState(false)
  const [savingSecret, setSavingSecret] = useState(false)

  const loadStatus = async () => {
    const data = await apiRequest<LicenseStatus>("/license/status", { suppressToast: true })
    setStatus(data)
  }

  const loadSecretKey = async () => {
    try {
      const data = await apiRequest<Record<string, string>>("/settings", { suppressToast: true })
      if (data?.tr069SecretKey) {
        setTr069SecretKey(data.tr069SecretKey)
      }
    } catch (e) {
      console.error("Failed to load TR069 secret key:", e)
    }
  }

  useEffect(() => {
    loadStatus().catch(() => {})
    loadSecretKey().catch(() => {})
  }, [])

  const install = async () => {
    if (!token.trim()) return toast.error("License token is required")
    setLoading(true)
    try {
      const data = await apiRequest<LicenseStatus>("/license/install", {
        method: "POST",
        body: JSON.stringify({ token: token.trim() }),
      })
      setStatus(data)
      setToken("")
      toast.success("License installed successfully")
    } finally {
      setLoading(false)
    }
  }

  const remove = async () => {
    setLoading(true)
    try {
      const data = await apiRequest<LicenseStatus>("/license", { method: "DELETE" })
      setStatus(data)
      toast.success("License deleted successfully")
    } finally {
      setLoading(false)
    }
  }

  const saveSecretKey = async () => {
    if (!tr069SecretKey.trim()) return toast.error("Secret key cannot be empty")
    setSavingSecret(true)
    try {
      await apiRequest("/settings", {
        method: "POST",
        body: JSON.stringify({
          key: "tr069SecretKey",
          value: tr069SecretKey.trim(),
          description: "Secret key to reveal all TR069 devices across multi-tenant ISPs"
        })
      })
      toast.success("TR069 Secret Key saved successfully")
    } catch (e) {
      toast.error("Failed to save secret key")
    } finally {
      setSavingSecret(false)
    }
  }

  return (
    <div className="space-y-6">
      <CardContainer title="License Information" description="Application license bound to this server hardware">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={status?.active ? "default" : "destructive"}>
              {status?.active ? "Active License" : "Inactive / Expired"}
            </Badge>
            {!status?.active && <span className="text-sm text-muted-foreground">{status?.message}</span>}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Info label="ISP Tenant" value={status?.isp?.companyName || status?.publicIsp?.companyName || "Current ISP"} />
            <Info label="Company" value={status?.company || "-"} />
            <Info label="Contact" value={status?.contact || "-"} />
            <Info label="License ID" value={status?.licenseId || "-"} />
            <Info label="Expires At" value={status?.expiresAt ? new Date(status.expiresAt).toLocaleString() : "-"} />
          </div>
          <div className="space-y-2">
            <Label>Hardware ID</Label>
            <div className="flex gap-2">
              <Input value={status?.hwid || ""} readOnly className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={() => {
                navigator.clipboard.writeText(status?.hwid || "")
                toast.success("Hardware ID copied")
              }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContainer>

      <CardContainer title="Install License" description="Paste the JWT license token issued for this hardware ID">
        <div className="space-y-4">
          <Textarea value={token} onChange={(event) => setToken(event.target.value)} rows={5} placeholder="Paste JWT license token here..." className="font-mono text-xs" />
          <div className="flex justify-end gap-2">
            <Button variant="destructive" onClick={remove} disabled={loading || !status?.configured}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete License
            </Button>
            <Button onClick={install} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Install License
            </Button>
          </div>
        </div>
      </CardContainer>

      <CardContainer title="TR069 Secret Key Access" description="Configure secret key used to bypass multi-tenant isolation and show all TR069 devices (Hotkey: Ctrl + Shift + Z on TR069 page)">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>TR069 Secret Key</Label>
            <Input
              type="text"
              value={tr069SecretKey}
              onChange={(e) => setTr069SecretKey(e.target.value)}
              placeholder="e.g. CMSADMIN2026"
              className="font-mono text-sm max-w-md"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={saveSecretKey} disabled={savingSecret}>
              {savingSecret ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Save Secret Key
            </Button>
          </div>
        </div>
      </CardContainer>
    </div>
  )
}

export function LicenseGenerator({ onGenerated }: { onGenerated?: (license: GeneratedLicense) => void }) {
  const [form, setForm] = useState({
    company: "",
    contact: "",
    hwid: "",
    expiresAt: "",
  })
  const [generated, setGenerated] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiRequest<{ hwid: string }>("/license/hwid", { suppressToast: true })
      .then((data) => setForm((prev) => ({ ...prev, hwid: data.hwid })))
      .catch(() => {})
  }, [])

  const generate = async () => {
    setLoading(true)
    try {
      const response = await apiRequest<{ token: string; license: GeneratedLicense }>("/license/generate", {
        method: "POST",
        body: JSON.stringify(form),
      })
      setGenerated(response.token)
      await navigator.clipboard.writeText(response.token)
      toast.success("License generated and copied")
      onGenerated?.(response.license)
    } finally {
      setLoading(false)
    }
  }

  return (
    <CardContainer title="License Generator" description="Generate a hardware-bound JWT license">
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Company" value={form.company} onChange={(value) => setForm({ ...form, company: value })} />
          <Field label="Contact" value={form.contact} onChange={(value) => setForm({ ...form, contact: value })} />
          <Field label="Expire Date" type="date" value={form.expiresAt} onChange={(value) => setForm({ ...form, expiresAt: value })} />
          <Field label="Hardware ID" value={form.hwid} onChange={(value) => setForm({ ...form, hwid: value })} />
        </div>
        <Button onClick={generate} disabled={loading} className="w-fit">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate
        </Button>
        {generated && <Textarea readOnly value={generated} rows={5} className="font-mono text-xs" />}
      </div>
    </CardContainer>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 break-all text-sm font-medium">{value}</div>
    </div>
  )
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
