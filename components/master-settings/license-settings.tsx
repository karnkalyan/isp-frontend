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
}

export function LicenseSettings() {
  const [status, setStatus] = useState<LicenseStatus | null>(null)
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)

  const loadStatus = async () => {
    const data = await apiRequest<LicenseStatus>("/license/status", { suppressToast: true })
    setStatus(data)
  }

  useEffect(() => {
    loadStatus().catch(() => {})
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
      toast.success("License installed")
    } finally {
      setLoading(false)
    }
  }

  const remove = async () => {
    setLoading(true)
    try {
      const data = await apiRequest<LicenseStatus>("/license", { method: "DELETE" })
      setStatus(data)
      toast.success("License deleted")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <CardContainer title="License Information" description="Application license bound to this server hardware">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={status?.active ? "default" : "destructive"}>
              {status?.active ? "Active" : "Inactive"}
            </Badge>
            {!status?.active && <span className="text-sm text-muted-foreground">{status?.message}</span>}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Company" value={status?.company || "-"} />
            <Info label="Contact" value={status?.contact || "-"} />
            <Info label="License ID" value={status?.licenseId || "-"} />
            <Info label="Expires At" value={status?.expiresAt ? new Date(status.expiresAt).toLocaleString() : "-"} />
          </div>
          <div className="space-y-2">
            <Label>Hardware ID</Label>
            <div className="flex gap-2">
              <Input value={status?.hwid || ""} readOnly className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(status?.hwid || "")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContainer>

      <CardContainer title="Install License" description="Paste the JWT license token issued for this hardware ID">
        <div className="space-y-4">
          <Textarea value={token} onChange={(event) => setToken(event.target.value)} rows={5} className="font-mono text-xs" />
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
    </div>
  )
}

export function LicenseGenerator({ onGenerated }: { onGenerated: () => void }) {
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
      const response = await apiRequest<{ token: string }>("/license/generate", {
        method: "POST",
        body: JSON.stringify(form),
      })
      setGenerated(response.token)
      await navigator.clipboard.writeText(response.token)
      toast.success("License generated and copied")
      onGenerated()
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
