"use client";

import { useEffect, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { Wifi, WifiOff, Save, RefreshCw, Signal, Shield, Lock, Download, Upload, Activity } from "lucide-react";
import { SSID } from "@/types/tr069";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { apiRequest } from "@/lib/api";

interface TR069DeviceWifiProps {
  deviceId: string;
}

export function TR069DeviceWifi({ deviceId }: TR069DeviceWifiProps) {
  const [ssidList, setSsidList] = useState<SSID[]>([]);
  const [selectedSSID, setSelectedSSID] = useState<SSID | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    ssid: "",
    password: "",
    security: "",
    channel: "",
    bandwidth: "",
    mode: "",
    txPower: "",
  });

  const [stats, setStats] = useState({
    bytesReceived: 0,
    bytesSent: 0,
    packetsReceived: 0,
    packetsSent: 0,
    broadcastReceived: 0,
    broadcastSent: 0,
    multicastReceived: 0,
    multicastSent: 0,
    unicastReceived: 0,
    unicastSent: 0,
    errorsReceived: 0,
    errorsSent: 0,
    discardReceived: 0,
    discardSent: 0,
  });

  useEffect(() => {
    fetchWlanInfo();
  }, [deviceId]);

  const fetchWlanInfo = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest<{ success: boolean; data: any }>(
        `/services/genieacs/devices/${deviceId}/wlaninfo`
      );
      if (response.success) {
        // The data structure has ssidList array
        const ssids = response.data.ssidList || [];
        setSsidList(ssids);
        // Select the first SSID by default (or first enabled one)
        if (ssids.length > 0) {
          const firstEnabled = ssids.find((ssid: SSID) => ssid.enable === true);
          setSelectedSSID(firstEnabled || ssids[0]);
        }
      } else {
        toast.error("Failed to load WiFi information");
      }
    } catch (error) {
      console.error("Error fetching WLAN info:", error);
      toast.error("Error loading WiFi information");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSSID) {
      const params = selectedSSID.parameters || {};

      let password = selectedSSID.keyPassphrase || "";
      if (!password) {
        password = params["X_CMS_KeyPassphrase"] ||
          params["X_CT-COM_KeyPassphrase"] ||
          params["PreSharedKey"] ||
          "********";
      }

      const security = mapSecurity(selectedSSID.beaconType, params);

      setSettings({
        enabled: selectedSSID.enable === true,
        ssid: selectedSSID.ssid || "",
        password: password,
        security: security,
        channel: selectedSSID.channel?.toString() || "auto",
        bandwidth: params["X_ALU_COM_ChannelBandWidthExtend"] ||
          params["X_CT-COM_ChannelWidth"]?.toString() ||
          "Auto",
        mode: params.Standard || "802.11b/g/n",
        txPower: params["TransmitPower"] ? mapTxPower(params["TransmitPower"]) : "High",
      });

      setStats({
        bytesReceived: parseInt(params["TotalBytesReceived"] || params["Stats.BytesReceived"] || "0"),
        bytesSent: parseInt(params["TotalBytesSent"] || params["Stats.BytesSent"] || "0"),
        packetsReceived: parseInt(params["TotalPacketsReceived"] || params["Stats.PacketsReceived"] || "0"),
        packetsSent: parseInt(params["TotalPacketsSent"] || params["Stats.PacketsSent"] || "0"),
        broadcastReceived: parseInt(params["BroadcastPacketsReceived"] || params["Stats.BroadcastPacketsReceived"] || "0"),
        broadcastSent: parseInt(params["BroadcastPacketsSent"] || params["Stats.BroadcastPacketsSent"] || "0"),
        multicastReceived: parseInt(params["MulticastPacketsReceived"] || params["Stats.MulticastPacketsReceived"] || "0"),
        multicastSent: parseInt(params["MulticastPacketsSent"] || params["Stats.MulticastPacketsSent"] || "0"),
        unicastReceived: parseInt(params["UnicastPacketsReceived"] || params["Stats.UnicastPacketsReceived"] || "0"),
        unicastSent: parseInt(params["UnicastPacketsSent"] || params["Stats.UnicastPacketsSent"] || "0"),
        errorsReceived: parseInt(params["ErrorsReceived"] || params["Stats.ErrorsReceived"] || "0"),
        errorsSent: parseInt(params["ErrorsSent"] || params["Stats.ErrorsSent"] || "0"),
        discardReceived: parseInt(params["DiscardPacketsReceived"] || params["Stats.DiscardPacketsReceived"] || "0"),
        discardSent: parseInt(params["DiscardPacketsSent"] || params["Stats.DiscardPacketsSent"] || "0"),
      });
    }
  }, [selectedSSID]);

  const mapSecurity = (beaconType: string, params: any): string => {
    if (!beaconType) return "none";
    const type = beaconType.toLowerCase();
    if (type.includes("wpa3")) return "wpa3-psk";
    if (type.includes("wpa2") && type.includes("wpa3")) return "wpa2-psk";
    if (type.includes("wpa2")) return "wpa2-psk";
    if (type.includes("wpa")) return "wpa-psk";
    if (type.includes("wep")) return "wep";
    if (type.includes("11i")) return "wpa2-psk"; // Map 11i to WPA2
    return "none";
  };

  const mapTxPower = (value: number | string): string => {
    const num = typeof value === "string" ? parseInt(value) : value;
    if (num >= 70) return "High";
    if (num >= 35) return "Medium";
    return "Low";
  };

  const getFrequencyBand = (ssid: SSID): string => {
    const band = ssid.parameters?.SupportedFrequencyBands || "";
    if (band.includes("5GHz")) return "5GHz";
    if (band.includes("2.4GHz")) return "2.4GHz";
    return "Unknown";
  };

  const getClientCount = (ssid: SSID): number => {
    const params = ssid.parameters || {};
    if (params.AssociatedDeviceMACAddress) return 1;
    if (typeof ssid.associatedDeviceCount === "string" && ssid.associatedDeviceCount !== "N/A") {
      return parseInt(ssid.associatedDeviceCount) || 0;
    }
    return 0;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const handleToggleEnable = async () => {
    if (!selectedSSID) return;

    try {
      setIsSaving(true);

      // Toggle the enabled state
      const newEnabledState = !settings.enabled;

      // Extract instance number from instance string (e.g., "LANDevice.1.WLANConfiguration.1" -> "1")
      const instanceMatch = selectedSSID.instance.match(/WLANConfiguration\.(\d+)/);
      if (!instanceMatch) {
        toast.error("Invalid SSID instance");
        return;
      }

      const instanceNumber = instanceMatch[1];

      toast.success(`Please wait operation is in progress of ${newEnabledState ? 'enabling' : 'disabling'} WiFi network`);

      // Prepare the request to enable/disable the SSID
      const response = await apiRequest<{ success: boolean; message?: string }>(
        `/services/genieacs/devices/${deviceId}/ssid-operations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ssidIndex: instanceNumber,
            operation: newEnabledState
          })
        }
      );


      if (response.success) {
        toast.success(`WiFi network ${newEnabledState ? 'enabled' : 'disabled'} successfully`);

        // Update local state
        setSettings(prev => ({ ...prev, enabled: newEnabledState }));

        // Update the ssidList with the new enabled state
        setSsidList(prev => prev.map(ssid =>
          ssid.instance === selectedSSID.instance
            ? { ...ssid, enable: newEnabledState, status: newEnabledState ? 'Up' : 'Disabled' }
            : ssid
        ));

        // Update selected SSID
        setSelectedSSID(prev => prev ? { ...prev, enable: newEnabledState, status: newEnabledState ? 'Up' : 'Disabled' } : null);
      } else {
        toast.error(response.message || `Failed to ${newEnabledState ? 'enable' : 'disable'} WiFi network`);
      }
    } catch (error) {
      console.error("Error toggling WiFi:", error);
      toast.error("Error updating WiFi settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedSSID) return;

    try {
      setIsSaving(true);

      // Extract the SSID index from the instance string (e.g., "WLANConfiguration.1" -> "1")
      const instanceMatch = selectedSSID.instance.match(/WLANConfiguration\.(\d+)/);
      if (!instanceMatch) {
        toast.error("Invalid SSID instance");
        return;
      }
      const ssidIndex = parseInt(instanceMatch[1], 10);

      // Prepare the payload for the dedicated endpoint
      const payload = {
        ssidIndex,
        ssidName: settings.ssid,
        // Only send password if it's changed and not masked
        password: settings.password && settings.password !== "********"
          ? settings.password
          : undefined
      };

      const response = await apiRequest<{ success: boolean; message?: string }>(
        `/services/genieacs/devices/${deviceId}/update-wifi`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.success) {
        toast.success("WiFi settings saved successfully");
        fetchWlanInfo(); // Refresh data
      } else {
        toast.error(response.message || "Failed to save WiFi settings");
      }
    } catch (error) {
      console.error("Error saving WiFi settings:", error);
      toast.error("Error saving WiFi settings");
    } finally {
      setIsSaving(false);
    }
  };

  const getTrafficData = () => {
    return [
      { name: "Received", value: stats.bytesReceived, color: "#22c55e" },
      { name: "Sent", value: stats.bytesSent, color: "#3b82f6" },
    ];
  };

  const getPacketData = () => {
    return [
      { name: "Received", value: stats.packetsReceived, color: "#22c55e" },
      { name: "Sent", value: stats.packetsSent, color: "#3b82f6" },
    ];
  };

  const handleRefresh = () => {
    fetchWlanInfo();
  };

  if (isLoading) {
    return (
      <CardContainer title="WiFi Networks" gradientColor="#6366f1">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-2 text-muted-foreground">Loading WiFi information...</p>
        </div>
      </CardContainer>
    );
  }

  if (ssidList.length === 0) {
    return (
      <CardContainer title="WiFi Networks" gradientColor="#6366f1">
        <div className="text-center py-12 text-muted-foreground">
          No WiFi networks found on this device.
        </div>
      </CardContainer>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* SSID List Panel - Shows ALL SSIDs */}
      <CardContainer title="WiFi Networks" gradientColor="#6366f1" className="lg:col-span-1">
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {ssidList.map((ssid) => (
            <button
              key={ssid.instance}
              onClick={() => setSelectedSSID(ssid)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedSSID?.instance === ssid.instance
                ? "bg-primary/10 border-primary"
                : "bg-card hover:bg-accent"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {ssid.enable ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <div className="font-medium">{ssid.ssid || "Unnamed Network"}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="px-1 py-0.5 bg-muted rounded-sm">
                        {getFrequencyBand(ssid)}
                      </span>
                      {ssid.channel && <span>• Ch {ssid.channel}</span>}
                    </div>
                  </div>
                </div>
                <Badge variant={ssid.status === "Up" ? "success" : "secondary"}>
                  {ssid.status || (ssid.enable ? "Enabled" : "Disabled")}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  <span>{ssid.beaconType || "Open"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Signal className="h-3 w-3 text-muted-foreground" />
                  <span>{getClientCount(ssid)} clients</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContainer>

      {/* Settings and Stats Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Network Settings */}
        <CardContainer title="Network Settings" gradientColor="#22c55e">
          {selectedSSID && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <div>
                  <h3 className="font-medium">{selectedSSID.ssid || "Unnamed Network"}</h3>
                  <p className="text-xs text-muted-foreground">BSSID: {selectedSSID.bssid || "N/A"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {settings.enabled ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={handleToggleEnable}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Network Name (SSID)</Label>
                  <Input
                    value={settings.ssid}
                    onChange={(e) => setSettings({ ...settings, ssid: e.target.value })}
                    disabled={isSaving}
                    className={!settings.enabled ? "bg-muted" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={settings.password}
                    onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                    disabled={isSaving}
                    className={!settings.enabled ? "bg-muted" : ""}
                    placeholder={settings.enabled ? "Enter new password to change" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Security Mode</Label>
                  <Input value={settings.security.toUpperCase()} readOnly className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Input value={settings.channel} readOnly className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label>Bandwidth</Label>
                  <Input value={settings.bandwidth} readOnly className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label>Wireless Mode</Label>
                  <Input value={settings.mode} readOnly className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label>Transmit Power</Label>
                  <Input value={settings.txPower} readOnly className="bg-muted" />
                </div>
              </div>

              {selectedSSID.parameters?.["X_CMS_KeyPassphrase"] && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    <Lock className="inline h-3 w-3 mr-1" />
                    Password is stored securely on the device.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleRefresh} disabled={isSaving}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </CardContainer>

        {/* Traffic Statistics */}
        {selectedSSID && selectedSSID.enable && (
          <CardContainer title="Traffic Statistics" gradientColor="#a855f7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bytes Chart */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Download className="h-4 w-4 text-green-500" />
                    <Upload className="h-4 w-4 text-blue-500" />
                    Bytes Transfer
                  </h4>
                  <div className="text-xs text-muted-foreground">
                    Total: {formatBytes(stats.bytesReceived + stats.bytesSent)}
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getTrafficData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getTrafficData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatBytes(value)}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-green-500/10 rounded-md">
                    <div className="font-medium text-green-600 dark:text-green-400">Received</div>
                    <div className="text-sm font-bold">{formatBytes(stats.bytesReceived)}</div>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-md">
                    <div className="font-medium text-blue-600 dark:text-blue-400">Sent</div>
                    <div className="text-sm font-bold">{formatBytes(stats.bytesSent)}</div>
                  </div>
                </div>
              </div>

              {/* Packets Chart */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Packets Transfer
                  </h4>
                  <div className="text-xs text-muted-foreground">
                    Total: {formatNumber(stats.packetsReceived + stats.packetsSent)}
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPacketData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getPacketData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatNumber(value)}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-green-500/10 rounded-md">
                    <div className="font-medium text-green-600 dark:text-green-400">Received</div>
                    <div className="text-sm font-bold">{formatNumber(stats.packetsReceived)}</div>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-md">
                    <div className="font-medium text-blue-600 dark:text-blue-400">Sent</div>
                    <div className="text-sm font-bold">{formatNumber(stats.packetsSent)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Statistics */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Detailed Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-2 bg-muted rounded-md">
                  <div className="text-muted-foreground">Unicast RX</div>
                  <div className="font-medium">{formatNumber(stats.unicastReceived)}</div>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <div className="text-muted-foreground">Unicast TX</div>
                  <div className="font-medium">{formatNumber(stats.unicastSent)}</div>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <div className="text-muted-foreground">Multicast RX</div>
                  <div className="font-medium">{formatNumber(stats.multicastReceived)}</div>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <div className="text-muted-foreground">Multicast TX</div>
                  <div className="font-medium">{formatNumber(stats.multicastSent)}</div>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <div className="text-muted-foreground">Broadcast RX</div>
                  <div className="font-medium">{formatNumber(stats.broadcastReceived)}</div>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <div className="text-muted-foreground">Broadcast TX</div>
                  <div className="font-medium">{formatNumber(stats.broadcastSent)}</div>
                </div>
                <div className="p-2 bg-red-500/10 rounded-md">
                  <div className="text-red-600 dark:text-red-400">Errors RX</div>
                  <div className="font-medium">{formatNumber(stats.errorsReceived)}</div>
                </div>
                <div className="p-2 bg-red-500/10 rounded-md">
                  <div className="text-red-600 dark:text-red-400">Errors TX</div>
                  <div className="font-medium">{formatNumber(stats.errorsSent)}</div>
                </div>
              </div>
            </div>
          </CardContainer>
        )}

        {/* No data message for disabled SSIDs */}
        {selectedSSID && !selectedSSID.enable && (
          <CardContainer title="Traffic Statistics" gradientColor="#a855f7">
            <div className="text-center py-12 text-muted-foreground">
              <WifiOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>This WiFi network is currently disabled.</p>
              <p className="text-sm">Use the switch above to enable it.</p>
            </div>
          </CardContainer>
        )}
      </div>
    </div>
  );
}