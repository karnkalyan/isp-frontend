"use client"

import React, { useState } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "react-hot-toast"
import { Eye, EyeOff, Save, TestTube } from "lucide-react"

type Service = {
  id: string
  name: string
  enabled: boolean
  description?: string
  fields: Record<string, string>
}

export function ServiceIntegrationSettings() {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  const [services, setServices] = useState<Service[]>([
    {
      id: "esewa",
      name: "eSewa",
      enabled: true,
      description: "Digital wallet gateway",
      fields: {
        url: "https://uat.esewa.com.np/epay/main",
        publicKey: "JB0BBQ4aD0UqIThFJwAKBgAXEUkEGQUBBAwdOgABHD4DChwUBxgOBQwODxMdFxEZDxYAHgkVAA==",
        secretKey: "BhwIWQQADhIYSxILExMcAgFXFhcOBwAKBgAXEQ==",
      },
    },
    {
      id: "khalti",
      name: "Khalti",
      enabled: true,
      description: "Payment gateway",
      fields: {
        url: "https://a.khalti.com/api/v2/epayment/initiate/",
        publicKey: "test_public_key_dc74e0fd57cb46cd93832aee0a390234",
        secretKey: "test_secret_key_f59e8b7d18b4499ca40f68195a846e9b",
      },
    },
    {
      id: "imepay",
      name: "IME Pay",
      enabled: false,
      description: "Mobile payment service",
      fields: {
        url: "https://stg.imepay.com.np:7979/WebCheckout/Checkout",
        apiKey: "",
        secretKey: "",
      },
    },
    {
      id: "tshul",
      name: "TSHUL",
      enabled: true,
      description: "ISP management integration",
      fields: {
        apiUrl: "https://api.tshul.com/v1",
        apiKey: "tshul_api_key_here",
        secretKey: "tshul_secret_key_here",
        webhook: "https://yourdomain.com/webhook/tshul",
      },
    },
    {
      id: "radius",
      name: "RADIUS",
      enabled: true,
      description: "Network authentication server",
      fields: {
        host: "192.168.1.100",
        port: "1812",
        sharedSecret: "radius_shared_secret",
      },
    },
    {
      id: "iptv",
      name: "IPTV",
      enabled: true,
      description: "IPTV middleware / panel",
      fields: {
        serverUrl: "http://192.168.1.100:8080",
        username: "iptv_admin",
        password: "iptv_password",
      },
    },
    {
      id: "email",
      name: "SMTP Email",
      enabled: true,
      description: "SMTP server for system emails",
      fields: {
        host: "smtp.gmail.com",
        port: "587",
        username: "noreply@kisannet.com",
        password: "email_password",
        encryption: "tls",
      },
    },
  ])

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((s) => ({ ...s, [key]: !s[key] }))
  }

  const updateField = (serviceId: string, fieldKey: string, value: string) => {
    setServices((prev) => prev.map((svc) => (svc.id === serviceId ? { ...svc, fields: { ...svc.fields, [fieldKey]: value } } : svc)))
  }

  const toggleEnabled = (serviceId: string, value: boolean) => {
    setServices((prev) => prev.map((svc) => (svc.id === serviceId ? { ...svc, enabled: value } : svc)))
  }

  const testConnection = (svc: Service) => {
    toast.loading(`Testing ${svc.name}...`, { id: svc.id })
    // Replace with real test call to backend which performs safe connection checks
    setTimeout(() => {
      toast.dismiss(svc.id)
      if (svc.enabled && Object.values(svc.fields).some((v) => v && v.length > 0)) {
        toast.success(`${svc.name} connection OK`)
      } else {
        toast.error(`${svc.name} connection failed — check config`)
      }
    }, 900)
  }

  const saveAll = () => {
    // Prepare payload
    const payload = services.reduce((acc: Record<string, any>, s) => {
      acc[s.id] = { enabled: s.enabled, fields: s.fields }
      return acc
    }, {})

    toast.promise(
      new Promise((resolve) => setTimeout(() => resolve(payload), 900)),
      {
        loading: "Saving integrations...",
        success: "Integrations saved",
        error: "Failed to save integrations",
      },
    )

    // TODO: actually POST payload to /api/settings/integrations
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Integrations & Services</h2>
          <p className="text-sm text-muted-foreground">Centralized configuration for external services (payments, RADIUS, IPTV, SMTP, webhooks).</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => toast("Preview saved to local state")}>Preview</Button>
          <Button onClick={saveAll} className="flex items-center gap-2">
            <Save className="h-4 w-4" /> Save All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((svc) => (
          <CardContainer key={svc.id} title={svc.name} description={svc.description}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">{svc.name}</Label>
                  <div className="text-sm text-muted-foreground">{svc.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={svc.enabled} onCheckedChange={(v) => toggleEnabled(svc.id, Boolean(v))} />
                </div>
              </div>

              {svc.enabled && (
                <>
                  <Separator className="my-2" />

                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(svc.fields).map(([key, val]) => {
                      const isSecret = /key|secret|password|token/i.test(key)
                      const showKey = showPasswords[`${svc.id}_${key}`]

                      return (
                        <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div className="space-y-1">
                            <Label className="capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                            <Input
                              type={isSecret && !showKey ? "password" : "text"}
                              value={val}
                              onChange={(e) => updateField(svc.id, key, e.target.value)}
                              placeholder={isSecret ? "hidden / secure" : "Enter value"}
                            />
                          </div>

                          {isSecret ? (
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePasswordVisibility(`${svc.id}_${key}`)}
                              >
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <div className="text-sm text-muted-foreground">{showKey ? "Visible" : "Hidden"}</div>
                            </div>
                          ) : (
                            <div />
                          )}
                        </div>
                      )
                    })}

                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => testConnection(svc)} className="flex items-center gap-2">
                        <TestTube className="h-4 w-4" /> Test Connection
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContainer>
        ))}
      </div>
    </div>
  )
}
