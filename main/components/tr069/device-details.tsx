"use client";

import { useEffect, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Copy, ArrowUp, ArrowDown, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";
import { CircularProgress } from "@/components/ui/circular-progress";
import { apiRequest } from "@/lib/api";
import { DeviceInfo, WanConnection } from "@/types/tr069";

interface TR069DeviceDetailsProps {
  deviceId: string;
}

export function TR069DeviceDetails({ deviceId }: TR069DeviceDetailsProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [wanConnections, setWanConnections] = useState<WanConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullLogs, setShowFullLogs] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [infoRes, wanRes] = await Promise.all([
          apiRequest<{ success: boolean; data: any }>(
            `/services/genieacs/devices/${deviceId}/deviceinfo`
          ),
          apiRequest<{ success: boolean; data: any }>(
            `/services/genieacs/devices/${deviceId}/waninfo`
          ),
        ]);
        if (infoRes.success) {
          setDeviceInfo(infoRes.data.deviceInfo);
        }
        if (wanRes.success) {
          setWanConnections(wanRes.data.wanConnections || []);
        }
      } catch (error) {
        console.error("Failed to load device details:", error);
        toast.error("Failed to load device details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [deviceId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Helper to find connection by service type (INTERNET, TR069, etc.)
  const findConnectionByService = (service: string): WanConnection | undefined => {
    return wanConnections.find((conn) => {
      if (!conn.parameters) return false;
      // Search all parameter keys that contain "ServiceList" and match the value
      return Object.entries(conn.parameters).some(
        ([key, value]) => key.includes("ServiceList") && value === service
      );
    });
  };

  // Find internet connection (prioritize INTERNET service, fallback to any PPP)
  const internetConn =
    findConnectionByService("INTERNET") ||
    wanConnections.find((conn) => conn.type === "PPP");

  // Find TR069 connection (prioritize TR069 service, fallback to any IP with "TR069" in name)
  const tr069Conn =
    findConnectionByService("TR069") ||
    wanConnections.find(
      (conn) => conn.type === "IP" && conn.name?.includes("TR069")
    );

  const managementIP = tr069Conn?.externalIPAddress || "N/A";
  const ipAddress = internetConn?.externalIPAddress || tr069Conn?.externalIPAddress || "N/A";
  const macAddress = internetConn?.macAddress || tr069Conn?.macAddress || "N/A";
  const username = internetConn?.username || "N/A";

  // Memory calculations
  const memoryTotalKB = deviceInfo?.memoryTotal || 0;
  const memoryFreeKB = deviceInfo?.memoryFree || 0;
  const memoryUsedKB = memoryTotalKB - memoryFreeKB;
  const memoryUsagePercent = memoryTotalKB > 0 ? Math.round((memoryUsedKB / memoryTotalKB) * 100) : 0;

  // RX Power parsing
  const rxPowerRaw = deviceInfo?.rxPower || deviceInfo?.parameters?.RXPower;

  let rxPowerNumeric = null;

  if (rxPowerRaw && typeof rxPowerRaw === "string") {
    const cleaned = rxPowerRaw.replace(/[^0-9.-]/g, "");
    rxPowerNumeric = cleaned ? parseFloat(cleaned) : null;
  }


  // Format bytes to human readable
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get network stats dynamically from the active connection
  const getStats = () => {
    const conn = internetConn || tr069Conn;
    if (!conn || !conn.parameters) {
      return { bytesSent: 0, bytesReceived: 0, packetsSent: 0, packetsReceived: 0 };
    }

    const params = conn.parameters;
    let bytesSent = 0,
      bytesReceived = 0,
      packetsSent = 0,
      packetsReceived = 0;

    // Search for any keys ending with the desired stat names
    for (const [key, value] of Object.entries(params)) {
      if (key.endsWith("Stats.EthernetBytesSent")) bytesSent = Number(value) || 0;
      if (key.endsWith("Stats.EthernetBytesReceived")) bytesReceived = Number(value) || 0;
      if (key.endsWith("Stats.EthernetPacketsSent")) packetsSent = Number(value) || 0;
      if (key.endsWith("Stats.EthernetPacketsReceived")) packetsReceived = Number(value) || 0;
    }
    return { bytesSent, bytesReceived, packetsSent, packetsReceived };
  };

  const stats = getStats();

  const formatUptime = (seconds: number): string => {
    if (!seconds) return "N/A";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const lastContact = deviceInfo?.lastContact ? new Date(deviceInfo.lastContact).toLocaleString() : "N/A";
  const firstUseDate = deviceInfo?.firstUseDate ? new Date(deviceInfo.firstUseDate).toLocaleString() : "N/A";
  const cpuTemp = deviceInfo?.cpuTemp || "N/A";

  // Parse device logs
  const deviceLogs = deviceInfo?.deviceLog || "";
  const logEntries = deviceLogs.split("\n").filter((log) => log.trim() !== "");

  // Get WAN access configuration (using dynamic search as well)
  const getWanAccessValue = (suffix: string): string => {
    const conn = internetConn || tr069Conn;
    if (!conn?.parameters) return "N/A";
    for (const [key, value] of Object.entries(conn.parameters)) {
      if (key.includes("WanAccessCfg") && key.endsWith(suffix)) {
        return String(value);
      }
    }
    return "N/A";
  };

  const wanAccessConfig = {
    httpDisabled: getWanAccessValue("HttpDisabled"),
    httpsDisabled: getWanAccessValue("HttpsDisabled"),
    sshDisabled: getWanAccessValue("SshDisabled"),
    telnetDisabled: getWanAccessValue("TelnetDisabled"),
    tr69Disabled: getWanAccessValue("Tr69Disabled"),
  };

  // Get management configuration
  const managementConfig = {
    sshEnable: deviceInfo?.xAluComServiceManage?.sshEnable,
    sshPort: deviceInfo?.xAluComServiceManage?.sshPort,
    telnetEnable: deviceInfo?.xAluComServiceManage?.telnetEnable,
    telnetPort: deviceInfo?.xAluComServiceManage?.telnetPort,
    managementIdleTimeout: deviceInfo?.xAluComServiceManage?.managementIdleDisconnectTime,
    wanHttpsPort: deviceInfo?.xAluComServiceManage?.wanHttpsPort,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-2 text-muted-foreground">Loading device details...</p>
      </div>
    );
  }

  if (!deviceInfo) {
    return (
      <CardContainer title="Device Information" gradientColor="#6366f1">
        <div className="text-center py-8 text-muted-foreground">Device information not available</div>
      </CardContainer>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardContainer title="Device Information" gradientColor="#6366f1">
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="text-muted-foreground">Serial Number</div>
            <div className="flex items-center gap-1">
              {deviceInfo.serialNumber || "N/A"}
              <button
                onClick={() => copyToClipboard(deviceInfo.serialNumber || "", "Serial Number")}
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="text-muted-foreground">IP Address</div>
            <div className="flex items-center gap-1">
              {ipAddress}
              <button
                onClick={() => copyToClipboard(ipAddress, "IP Address")}
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="text-muted-foreground">Management IP Address</div>
            <div className="flex items-center gap-1">
              {managementIP === "N/A" ? (
                <span className="text-muted-foreground">N/A</span>
              ) : (
                <a
                  href={`https://${managementIP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline group"
                >
                  {managementIP}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}
              <button
                onClick={() => copyToClipboard(managementIP, "Management IP Address")}
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="text-muted-foreground">MAC Address</div>
            <div className="flex items-center gap-1">
              {macAddress}
              <button
                onClick={() => copyToClipboard(macAddress, "MAC Address")}
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="text-muted-foreground">Username</div>
            <div>{username}</div>

            <div className="text-muted-foreground">Manufacturer</div>
            <div>{deviceInfo.manufacturer || "N/A"}</div>

            <div className="text-muted-foreground">Model</div>
            <div>{deviceInfo.modelName || "N/A"}</div>

            <div className="text-muted-foreground">Software Version</div>
            <div>{deviceInfo.softwareVersion || "N/A"}</div>

            <div className="text-muted-foreground">Hardware Version</div>
            <div>{deviceInfo.hardwareVersion || "N/A"}</div>

            <div className="text-muted-foreground">Additional SW Version</div>
            <div>{deviceInfo.additionalSoftwareVersion || "N/A"}</div>

            <div className="text-muted-foreground">OUI</div>
            <div>{deviceInfo.manufacturerOUI || "N/A"}</div>

            <div className="text-muted-foreground">Product Class</div>
            <div>{deviceInfo.productClass || "N/A"}</div>

            <div className="text-muted-foreground">Spec Version</div>
            <div>{deviceInfo.specVersion || "N/A"}</div>

            <div className="text-muted-foreground">Features</div>
            <div>
              {deviceInfo.parameters?.Features ? (
                <ul className="list-disc list-inside text-sm">
                  {deviceInfo.parameters.Features.split(",").map((feature: string, index: number) => (
                    <li key={index}>{feature.trim()}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground">N/A</span>
              )}
            </div>
          </div>
        </CardContainer>

        <div className="space-y-6">
          <CardContainer title="System Resources" gradientColor="#22c55e">
            <div className="flex flex-wrap justify-center gap-8 py-4">
              <div className="flex flex-col items-center">
                <CircularProgress value={deviceInfo.cpuUsage || 0} label="CPU Usage" />
                <span className="text-xs text-muted-foreground mt-1">{deviceInfo.cpuUsage || 0}%</span>
              </div>
              <div className="flex flex-col items-center">
                <CircularProgress value={memoryUsagePercent} label="Memory Usage" color="#f59e0b" />
                <span className="text-xs text-muted-foreground mt-1">{memoryUsagePercent}%</span>
              </div>
              <div className="flex flex-col items-center">
                <CircularProgress value={rxPowerNumeric} label="RX Power" color="#ef4444" />
                <span className="text-xs text-muted-foreground mt-1">{rxPowerRaw}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-muted-foreground">Last Contact</div>
              <div>{lastContact}</div>

              <div className="text-muted-foreground">Uptime</div>
              <div>{formatUptime(deviceInfo.uptimeSeconds)}</div>

              <div className="text-muted-foreground">First Use</div>
              <div>{firstUseDate}</div>

              <div className="text-muted-foreground">CPU Temp</div>
              <div>{cpuTemp}°C</div>

              <div className="text-muted-foreground">Memory Free</div>
              <div>{formatBytes(memoryFreeKB * 1024)}</div>

              <div className="text-muted-foreground">Memory Used</div>
              <div>{formatBytes(memoryUsedKB * 1024)}</div>

              <div className="text-muted-foreground">Memory Total</div>
              <div>{formatBytes(memoryTotalKB * 1024)}</div>

              <div className="text-muted-foreground">Access Type</div>
              <div>{deviceInfo.accessType || "N/A"}</div>

              <div className="text-muted-foreground">Device Description</div>
              <div className="truncate" title={deviceInfo.description}>
                {deviceInfo.description || "N/A"}
              </div>
            </div>
          </CardContainer>

          <CardContainer title="Network Statistics" gradientColor="#3b82f6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                  <ArrowUp className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Bytes Sent</div>
                  <div className="font-medium">{formatBytes(stats.bytesSent)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                  <ArrowDown className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Bytes Received</div>
                  <div className="font-medium">{formatBytes(stats.bytesReceived)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                  <ArrowUp className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Packets Sent</div>
                  <div className="font-medium">{stats.packetsSent?.toLocaleString() || "0"}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                  <ArrowDown className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Packets Received</div>
                  <div className="font-medium">{stats.packetsReceived?.toLocaleString() || "0"}</div>
                </div>
              </div>
            </div>
          </CardContainer>
        </div>
      </div>

      {/* Management Configuration */}
      <CardContainer title="Management Configuration" gradientColor="#ec4899">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">SSH</div>
            <div className="font-medium">
              {managementConfig.sshEnable ? "Enabled" : "Disabled"}
              {managementConfig.sshPort && ` (Port ${managementConfig.sshPort})`}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Telnet</div>
            <div className="font-medium">
              {managementConfig.telnetEnable ? "Enabled" : "Disabled"}
              {managementConfig.telnetPort && ` (Port ${managementConfig.telnetPort})`}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">WAN HTTPS Port</div>
            <div className="font-medium">{managementConfig.wanHttpsPort || "N/A"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Idle Timeout</div>
            <div className="font-medium">{managementConfig.managementIdleTimeout || "N/A"}s</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">WAN Access</div>
            <div className="font-medium">
              HTTP: {wanAccessConfig.httpDisabled === "false" ? "✓" : "✗"}, HTTPS:{" "}
              {wanAccessConfig.httpsDisabled === "false" ? "✓" : "✗"}
            </div>
          </div>
        </div>
      </CardContainer>

      {/* Device Logs */}
      <CardContainer title="Device Logs" gradientColor="#ef4444" className="relative">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{logEntries.length} log entries</span>
            </div>
            {logEntries.length > 5 && (
              <button
                onClick={() => setShowFullLogs(!showFullLogs)}
                className="text-xs text-primary hover:underline"
              >
                {showFullLogs ? "Show Less" : "Show All"}
              </button>
            )}
          </div>

          <div className="bg-muted/30 rounded-lg p-3 max-h-96 overflow-y-auto font-mono text-xs">
            {logEntries.length > 0 ? (
              (showFullLogs ? logEntries : logEntries.slice(0, 10)).map((log, index) => (
                <div
                  key={index}
                  className="py-1 border-b border-border/50 last:border-0 text-muted-foreground"
                >
                  {log}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">No logs available</div>
            )}
          </div>

          {!showFullLogs && logEntries.length > 10 && (
            <div className="text-xs text-muted-foreground text-center">
              Showing 10 of {logEntries.length} entries
            </div>
          )}
        </div>
      </CardContainer>
    </div>
  );
}