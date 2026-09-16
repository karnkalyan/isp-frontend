"use client"

import { useEffect, useState } from "react"
import { Copy, KeyRound, Loader2, Save } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type EsewaConfig = {
  tokenEnabled: boolean
  epayEnabled: boolean
  username: string
  passwordConfigured: boolean
  clientSecretConfigured: boolean
  serviceEnabled: boolean
}

export function PaymentGatewaySettings() {
  const [credentials, setCredentials] = useState({ password: "", clientSecret: "" })
  const [encoded, setEncoded] = useState({ passwordBase64: "", clientSecretBase64: "" })
  const [config, setConfig] = useState<EsewaConfig>({ tokenEnabled: false, epayEnabled: true, username: "esewa-client", passwordConfigured: false, clientSecretConfigured: false, serviceEnabled: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [encoding, setEncoding] = useState(false)

  useEffect(() => {
    apiRequest<EsewaConfig>("/settings/esewa/config")
      .then(setConfig)
      .catch((error: any) => toast.error(error.message || "Failed to load eSewa configuration"))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await apiRequest("/settings/esewa/config", {
        method: "PUT",
        body: JSON.stringify({ ...config, password: credentials.password || undefined, clientSecret: credentials.clientSecret || undefined }),
      })
      setConfig(prev => ({ ...prev, passwordConfigured: prev.passwordConfigured || Boolean(credentials.password), clientSecretConfigured: prev.clientSecretConfigured || Boolean(credentials.clientSecret) }))
      setCredentials({ password: "", clientSecret: "" })
      toast.success("eSewa configuration saved")
    } catch (error: any) {
      toast.error(error.message || "Failed to save eSewa configuration")
    } finally { setSaving(false) }
  }

  const generate = async () => {
    if (!credentials.password || !credentials.clientSecret) return toast.error("Enter the eSewa password and client secret")
    setEncoding(true)
    try {
      const result = await apiRequest<typeof encoded>("/settings/esewa/base64", { method: "POST", body: JSON.stringify(credentials) })
      setEncoded(result)
      toast.success("eSewa Base64 values generated")
    } catch (error: any) {
      toast.error(error.message || "Failed to generate Base64 values")
    } finally { setEncoding(false) }
  }

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied`)
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      {/* External Payment Gateway (Our Provided Inbound API) */}
      <ExternalPaymentSettingsCard />

      {/* eSewa Payment Configuration */}
      <CardContainer title="eSewa Payment Configuration" description="Configure token payment and ePay v2 independently, then generate the Base64 credentials supplied to eSewa.">
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div><Label>Token Payment</Label><p className="text-xs text-muted-foreground">Inbound access-token, inquiry, payment and status APIs</p></div>
              <Switch checked={config.tokenEnabled} onCheckedChange={tokenEnabled => setConfig(prev => ({ ...prev, tokenEnabled }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div><Label>ePay v2</Label><p className="text-xs text-muted-foreground">Customer-dashboard redirect renewal</p></div>
              <Switch checked={config.epayEnabled} onCheckedChange={epayEnabled => setConfig(prev => ({ ...prev, epayEnabled }))} />
            </div>
          </div>

          <div className="space-y-2"><Label>Token API Username</Label><Input value={config.username} onChange={event => setConfig(prev => ({ ...prev, username: event.target.value }))} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>eSewa Password</Label><Input type="password" autoComplete="new-password" value={credentials.password} onChange={event => setCredentials(prev => ({ ...prev, password: event.target.value }))} placeholder={config.passwordConfigured ? "Configured - leave blank to keep" : "Minimum 8 characters"} /></div>
            <div className="space-y-2"><Label>eSewa Client Secret</Label><Input type="password" autoComplete="new-password" value={credentials.clientSecret} onChange={event => setCredentials(prev => ({ ...prev, clientSecret: event.target.value }))} placeholder={config.clientSecretConfigured ? "Configured - leave blank to keep" : "32-64 characters"} /></div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving || !config.serviceEnabled} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save eSewa Configuration</Button>
            <Button variant="outline" onClick={generate} disabled={encoding} className="gap-2">{encoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}Generate Base64 Values</Button>
          </div>
          {!config.serviceEnabled && <p className="text-sm text-amber-600">Enable eSewa in the Service Catalog before saving.</p>}

          {(encoded.passwordBase64 || encoded.clientSecretBase64) && (
            <div className="grid gap-4 md:grid-cols-2">
              {[["REPLACE_WITH_BASE64_PASSWORD", encoded.passwordBase64], ["REPLACE_WITH_BASE64_CLIENT_SECRET", encoded.clientSecretBase64]].map(([label, value]) => (
                <div key={label} className="space-y-2"><Label>{label}</Label><div className="flex gap-2"><Input value={value} readOnly className="font-mono text-xs" /><Button variant="outline" size="icon" onClick={() => copy(value, label)}><Copy className="h-4 w-4" /></Button></div></div>
              ))}
            </div>
          )}
        </div>
      </CardContainer>
    </div>
  )
}

function ExternalPaymentSettingsCard() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<any>({
    enabled: true,
    username: "",
    passwordConfigured: false,
    defaultPaymentMode: "EXTERNAL"
  })
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    apiRequest<any>("/settings/externalpayment/config")
      .then(res => {
        setConfig(res)
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load External Payment configuration")
      })
      .finally(() => setLoading(false))
  }, [])

  const handleGenerateCredentials = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    let rndUser = "ext_"
    for (let i = 0; i < 6; i++) rndUser += chars.charAt(Math.floor(Math.random() * chars.length))
    let rndPass = "Ext#"
    for (let i = 0; i < 10; i++) rndPass += chars.charAt(Math.floor(Math.random() * chars.length))
    rndPass += "!2026"

    setConfig((prev: any) => ({ ...prev, username: rndUser }))
    setNewPassword(rndPass)
    toast.success("New credentials generated! Click Save to apply.")
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: any = {
        enabled: config.enabled,
        username: config.username,
        defaultPaymentMode: config.defaultPaymentMode || "EXTERNAL"
      }
      if (newPassword.trim()) {
        payload.password = newPassword.trim()
      }

      await apiRequest("/settings/externalpayment/config", {
        method: "PUT",
        body: JSON.stringify(payload)
      })

      setConfig((prev: any) => ({
        ...prev,
        passwordConfigured: prev.passwordConfigured || Boolean(newPassword.trim())
      }))
      setNewPassword("")
      toast.success("External Payment configuration saved successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to save External Payment configuration")
    } finally {
      setSaving(false)
    }
  }

  const copy = async (value: string, label: string) => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied`)
  }

  if (loading) {
    return (
      <CardContainer title="External Payment Gateway API" description="Loading...">
        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </CardContainer>
    )
  }

  return (
    <CardContainer
      title="External Payment Gateway API"
      description="Configure credentials for third-party billing gateways, mobile wallets, and partner applications to recharge customers via our ISP API."
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label className="text-sm font-semibold">External Payment Inbound API</Label>
            <p className="text-xs text-muted-foreground">
              Allows external payment gateways to query customer accounts and push instant renewals.
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig((prev: any) => ({ ...prev, enabled }))}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Gateway API Username</Label>
            <div className="flex gap-2">
              <Input
                value={config.username || ""}
                onChange={(e) => setConfig((prev: any) => ({ ...prev, username: e.target.value }))}
                placeholder="e.g. external_isp_1"
              />
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => copy(config.username, "Username")}
                disabled={!config.username}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default Payment Mode</Label>
            <Input
              value={config.defaultPaymentMode || "EXTERNAL"}
              onChange={(e) => setConfig((prev: any) => ({ ...prev, defaultPaymentMode: e.target.value.toUpperCase() }))}
              placeholder="EXTERNAL, CASH, ONLINE, etc."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Gateway Password</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={config.passwordConfigured ? "Configured — enter new password to change or click Generate" : "Minimum 8 characters"}
            />
            {newPassword && (
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => copy(newPassword, "Password")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {config.passwordConfigured ? "Status: Password already active in database. Enter a new value to reset." : "Status: No password set yet."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving || !config.enabled}
            className="gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save External Payment Configuration
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateCredentials}
            className="gap-2"
          >
            <KeyRound className="h-4 w-4" />
            Generate New Username & Password
          </Button>
        </div>

        {config.username && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border p-4 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Integration Reference cURL:</div>
            <pre className="p-3 bg-zinc-950 text-zinc-100 rounded-md text-xs font-mono overflow-x-auto">
{`curl -X POST "https://cms.kisan.net.np/api/externalpayment/payment" \\
  -u "${config.username}:${newPassword || '<password>'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "karnkalyan",
    "payment_mode": "${config.defaultPaymentMode || "EXTERNAL"}"
  }'`}
            </pre>
            <p className="text-[11px] text-muted-foreground">
              External callers can simply pass <code>username</code> and <code>payment_mode</code>. The user&apos;s active subscribed package (e.g. 75Mbps - 12 Months) will be automatically renewed upon payment!
            </p>
          </div>
        )}
      </div>
    </CardContainer>
  )
}
