"use client"

import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { Wifi, WifiOff, Save, RefreshCw } from "lucide-react"

interface TR069DeviceWifiProps {
  deviceId: string
}

export function TR069DeviceWifi({ deviceId }: TR069DeviceWifiProps) {
  // In a real app, we would fetch device data based on the ID
  const [wifiSettings, setWifiSettings] = useState({
    enabled: true,
    ssid: "TP-Link_F81D",
    password: "********",
    security: "wpa2-psk",
    channel: "6",
    bandwidth: "20/40MHz",
    mode: "802.11b/g/n",
    txPower: "High",
    guestNetwork: false,
    guestSSID: "TP-Link_Guest",
    guestPassword: "********",
    guestIsolation: true,
    macFiltering: false,
  })

  const handleSave = () => {
    toast.success("WiFi settings saved successfully")
  }

  const handleRefresh = () => {
    toast.success("WiFi settings refreshed from device")
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CardContainer title="Main WiFi Network" gradientColor="#6366f1">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>WiFi Status</Label>
              <div className="text-sm text-muted-foreground">Enable or disable wireless network</div>
            </div>
            <div className="flex items-center gap-2">
              {wifiSettings.enabled ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <Switch
                checked={wifiSettings.enabled}
                onCheckedChange={(checked) => setWifiSettings({ ...wifiSettings, enabled: checked })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ssid">Network Name (SSID)</Label>
            <Input
              id="ssid"
              value={wifiSettings.ssid}
              onChange={(e) => setWifiSettings({ ...wifiSettings, ssid: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={wifiSettings.password}
              onChange={(e) => setWifiSettings({ ...wifiSettings, password: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="security">Security Mode</Label>
            <Select
              value={wifiSettings.security}
              onValueChange={(value) => setWifiSettings({ ...wifiSettings, security: value })}
            >
              <SelectTrigger id="security">
                <SelectValue placeholder="Select security mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Open)</SelectItem>
                <SelectItem value="wep">WEP</SelectItem>
                <SelectItem value="wpa-psk">WPA-PSK</SelectItem>
                <SelectItem value="wpa2-psk">WPA2-PSK</SelectItem>
                <SelectItem value="wpa3-psk">WPA3-PSK</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <Select
                value={wifiSettings.channel}
                onValueChange={(value) => setWifiSettings({ ...wifiSettings, channel: value })}
              >
                <SelectTrigger id="channel">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="11">11</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bandwidth">Bandwidth</Label>
              <Select
                value={wifiSettings.bandwidth}
                onValueChange={(value) => setWifiSettings({ ...wifiSettings, bandwidth: value })}
              >
                <SelectTrigger id="bandwidth">
                  <SelectValue placeholder="Select bandwidth" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20MHz">20MHz</SelectItem>
                  <SelectItem value="20/40MHz">20/40MHz</SelectItem>
                  <SelectItem value="80MHz">80MHz</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mode">Wireless Mode</Label>
              <Select
                value={wifiSettings.mode}
                onValueChange={(value) => setWifiSettings({ ...wifiSettings, mode: value })}
              >
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="802.11b">802.11b</SelectItem>
                  <SelectItem value="802.11g">802.11g</SelectItem>
                  <SelectItem value="802.11b/g">802.11b/g</SelectItem>
                  <SelectItem value="802.11b/g/n">802.11b/g/n</SelectItem>
                  <SelectItem value="802.11ac">802.11ac</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txPower">Transmit Power</Label>
              <Select
                value={wifiSettings.txPower}
                onValueChange={(value) => setWifiSettings({ ...wifiSettings, txPower: value })}
              >
                <SelectTrigger id="txPower">
                  <SelectValue placeholder="Select power" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContainer>

      <div className="space-y-6">
        <CardContainer title="Guest Network" gradientColor="#22c55e">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Guest Network</Label>
                <div className="text-sm text-muted-foreground">Enable or disable guest network</div>
              </div>
              <Switch
                checked={wifiSettings.guestNetwork}
                onCheckedChange={(checked) => setWifiSettings({ ...wifiSettings, guestNetwork: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestSSID">Guest SSID</Label>
              <Input
                id="guestSSID"
                value={wifiSettings.guestSSID}
                onChange={(e) => setWifiSettings({ ...wifiSettings, guestSSID: e.target.value })}
                disabled={!wifiSettings.guestNetwork}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestPassword">Guest Password</Label>
              <Input
                id="guestPassword"
                type="password"
                value={wifiSettings.guestPassword}
                onChange={(e) => setWifiSettings({ ...wifiSettings, guestPassword: e.target.value })}
                disabled={!wifiSettings.guestNetwork}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>AP Isolation</Label>
                <div className="text-sm text-muted-foreground">Prevent devices from communicating with each other</div>
              </div>
              <Switch
                checked={wifiSettings.guestIsolation}
                onCheckedChange={(checked) => setWifiSettings({ ...wifiSettings, guestIsolation: checked })}
                disabled={!wifiSettings.guestNetwork}
              />
            </div>
          </div>
        </CardContainer>

        <CardContainer title="Advanced Settings" gradientColor="#f43f5e">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>MAC Filtering</Label>
                <div className="text-sm text-muted-foreground">Control device access by MAC address</div>
              </div>
              <Switch
                checked={wifiSettings.macFiltering}
                onCheckedChange={(checked) => setWifiSettings({ ...wifiSettings, macFiltering: checked })}
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardContainer>
      </div>
    </div>
  )
}
