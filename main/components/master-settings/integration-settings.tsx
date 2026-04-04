"use client"

import { useState } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { Save, TestTube, Eye, EyeOff } from "lucide-react"

export function IntegrationSettings() {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [integrations, setIntegrations] = useState({
    iptv: {
      enabled: true,
      serverUrl: "http://192.168.1.100:8080",
      username: "iptv_admin",
      password: "iptv_password",
      apiKey: "iptv_api_key_here",
    },
    radius: {
      enabled: true,
      serverUrl: "192.168.1.100",
      port: "1812",
      sharedSecret: "radius_shared_secret",
      nasIdentifier: "kisannet_nas",
    },
    tshul: {
      enabled: true,
      apiUrl: "https://api.tshul.com/v1",
      apiKey: "tshul_api_key",
      secretKey: "tshul_secret_key",
      webhookUrl: "https://yourdomain.com/webhook/tshul",
    },
    sms: {
      enabled: false,
      provider: "sparrow",
      apiUrl: "https://sms.sparrowsms.com/v2/send",
      token: "sms_api_token",
      from: "KisanNET",
    },
    email: {
      enabled: true,
      smtpHost: "smtp.gmail.com",
      smtpPort: "587",
      username: "noreply@kisannet.com",
      password: "email_password",
      encryption: "tls",
    },
  })

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const updateIntegration = (service: string, field: string, value: any) => {
    setIntegrations((prev) => ({
      ...prev,
      [service]: {
        ...prev[service as keyof typeof prev],
        [field]: value,
      },
    }))
  }

  const testIntegration = async (serviceName: string) => {
    toast.loading(`Testing ${serviceName} integration...`)

    setTimeout(() => {
      toast.dismiss()
      toast.success(`${serviceName} integration test successful!`)
    }, 2000)
  }

  const saveSettings = () => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(true)
        }, 1000)
      }),
      {
        loading: "Saving integration settings...",
        success: "Integration settings saved successfully!",
        error: "Failed to save integration settings",
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Settings</h2>
          <p className="text-muted-foreground">Configure external service integrations</p>
        </div>
        <Button onClick={saveSettings} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save All Settings
        </Button>
      </div>

      <div className="grid gap-6">
        <CardContainer title="IPTV Integration" description="Configure IPTV service integration">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable IPTV Integration</Label>
                <div className="text-sm text-muted-foreground">Connect with IPTV service provider</div>
              </div>
              <Switch
                checked={integrations.iptv.enabled}
                onCheckedChange={(checked) => updateIntegration("iptv", "enabled", checked)}
              />
            </div>

            {integrations.iptv.enabled && (
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Server URL</Label>
                  <Input
                    value={integrations.iptv.serverUrl}
                    onChange={(e) => updateIntegration("iptv", "serverUrl", e.target.value)}
                    placeholder="http://iptv-server.com:8080"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={integrations.iptv.username}
                      onChange={(e) => updateIntegration("iptv", "username", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.iptv_password ? "text" : "password"}
                        value={integrations.iptv.password}
                        onChange={(e) => updateIntegration("iptv", "password", e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => togglePasswordVisibility("iptv_password")}
                      >
                        {showPasswords.iptv_password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => testIntegration("IPTV")} className="flex items-center gap-2">
                    <TestTube className="h-4 w-4" />
                    Test Connection
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContainer>

        <CardContainer title="RADIUS Integration" description="Configure RADIUS authentication server">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable RADIUS Integration</Label>
                <div className="text-sm text-muted-foreground">Connect with RADIUS authentication server</div>
              </div>
              <Switch
                checked={integrations.radius.enabled}
                onCheckedChange={(checked) => updateIntegration("radius", "enabled", checked)}
              />
            </div>

            {integrations.radius.enabled && (
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Server URL</Label>
                    <Input
                      value={integrations.radius.serverUrl}
                      onChange={(e) => updateIntegration("radius", "serverUrl", e.target.value)}
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input
                      value={integrations.radius.port}
                      onChange={(e) => updateIntegration("radius", "port", e.target.value)}
                      placeholder="1812"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shared Secret</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.radius_secret ? "text" : "password"}
                        value={integrations.radius.sharedSecret}
                        onChange={(e) => updateIntegration("radius", "sharedSecret", e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => togglePasswordVisibility("radius_secret")}
                      >
                        {showPasswords.radius_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>NAS Identifier</Label>
                    <Input
                      value={integrations.radius.nasIdentifier}
                      onChange={(e) => updateIntegration("radius", "nasIdentifier", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => testIntegration("RADIUS")}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    Test Connection
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContainer>

        <CardContainer title="TSHUL Integration" description="Configure TSHUL ISP management system">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable TSHUL Integration</Label>
                <div className="text-sm text-muted-foreground">Connect with TSHUL management system</div>
              </div>
              <Switch
                checked={integrations.tshul.enabled}
                onCheckedChange={(checked) => updateIntegration("tshul", "enabled", checked)}
              />
            </div>

            {integrations.tshul.enabled && (
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>API URL</Label>
                  <Input
                    value={integrations.tshul.apiUrl}
                    onChange={(e) => updateIntegration("tshul", "apiUrl", e.target.value)}
                    placeholder="https://api.tshul.com/v1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.tshul_api ? "text" : "password"}
                        value={integrations.tshul.apiKey}
                        onChange={(e) => updateIntegration("tshul", "apiKey", e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => togglePasswordVisibility("tshul_api")}
                      >
                        {showPasswords.tshul_api ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.tshul_secret ? "text" : "password"}
                        value={integrations.tshul.secretKey}
                        onChange={(e) => updateIntegration("tshul", "secretKey", e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => togglePasswordVisibility("tshul_secret")}
                      >
                        {showPasswords.tshul_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input
                    value={integrations.tshul.webhookUrl}
                    onChange={(e) => updateIntegration("tshul", "webhookUrl", e.target.value)}
                    placeholder="https://yourdomain.com/webhook/tshul"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => testIntegration("TSHUL")}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    Test Connection
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContainer>

        <CardContainer title="Email Integration" description="Configure SMTP email settings">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Email Integration</Label>
                <div className="text-sm text-muted-foreground">Configure SMTP for sending emails</div>
              </div>
              <Switch
                checked={integrations.email.enabled}
                onCheckedChange={(checked) => updateIntegration("email", "enabled", checked)}
              />
            </div>

            {integrations.email.enabled && (
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input
                      value={integrations.email.smtpHost}
                      onChange={(e) => updateIntegration("email", "smtpHost", e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Port</Label>
                    <Input
                      value={integrations.email.smtpPort}
                      onChange={(e) => updateIntegration("email", "smtpPort", e.target.value)}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={integrations.email.username}
                      onChange={(e) => updateIntegration("email", "username", e.target.value)}
                      placeholder="noreply@kisannet.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.email_password ? "text" : "password"}
                        value={integrations.email.password}
                        onChange={(e) => updateIntegration("email", "password", e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => togglePasswordVisibility("email_password")}
                      >
                        {showPasswords.email_password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Encryption</Label>
                  <Select
                    value={integrations.email.encryption}
                    onValueChange={(value) => updateIntegration("email", "encryption", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => testIntegration("Email")}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    Test Connection
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContainer>
      </div>
    </div>
  )
}
