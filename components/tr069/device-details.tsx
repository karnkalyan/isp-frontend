"use client";

import { useEffect, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import {
  Copy,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { CircularProgress } from "@/components/ui/circular-progress";
import { apiRequest } from "@/lib/api";
import { DeviceInfo, WanConnection } from "@/types/tr069";

interface TR069DeviceDetailsProps {
  deviceId: string;
}

export function TR069DeviceDetails({ deviceId }: TR069DeviceDetailsProps) {
  const safeDeviceId = String(deviceId ?? "");

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [wanConnections, setWanConnections] = useState<WanConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullLogs, setShowFullLogs] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!safeDeviceId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [infoRes, wanRes] = await Promise.all([
          apiRequest<{ success: boolean; data: any }>(
            `/services/genieacs/devices/${safeDeviceId}/deviceinfo`
          ),
          apiRequest<{ success: boolean; data: any }>(
            `/services/genieacs/devices/${safeDeviceId}/waninfo`
          ),
        ]);

        if (infoRes?.success) {
          setDeviceInfo(infoRes.data?.deviceInfo ?? null);
        } else {
          setDeviceInfo(null);
        }

        if (wanRes?.success) {
          setWanConnections(Array.isArray(wanRes.data?.wanConnections) ? wanRes.data.wanConnections : []);
        } else {
          setWanConnections([]);
        }
      } catch (error) {
        console.error("Failed to load device details:", error);
        toast.error("Failed to load device details");
        setDeviceInfo(null);
        setWanConnections([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [safeDeviceId]);

  const toDisplayString = (value: unknown, fallback = "N/A"): string => {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    return fallback;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text || "");
    toast.success(`${label} copied to clipboard`);
  };

  const findConnectionByService = (service: string): WanConnection | undefined => {
    return wanConnections.find((conn) => {
      if (!conn?.parameters || typeof conn.parameters !== "object") return false;

      return Object.entries(conn.parameters).some(
        ([key, value]) => key.includes("ServiceList") && String(value) === service
      );
    });
  };

  const getConnectionValue = (conn: WanConnection | undefined, suffixes: string[]): string => {
    if (!conn?.parameters || typeof conn.parameters !== "object") return "N/A";

    for (const suffix of suffixes) {
      for (const [key, value] of Object.entries(conn.parameters)) {
        if (key.endsWith(suffix) && value !== null && value !== undefined && value !== "") {
          return String(value);
        }
      }
    }

    return "N/A";
  };

  const internetConn =
    findConnectionByService("INTERNET") ||
    wanConnections.find((conn) => conn?.type === "PPP");

  const tr069Conn =
    findConnectionByService("TR069") ||
    wanConnections.find(
      (conn) => conn?.type === "IP" && typeof conn?.name === "string" && conn.name.includes("TR069")
    );

  const managementIP = toDisplayString(tr069Conn?.externalIPAddress);
  const ipAddress = toDisplayString(internetConn?.externalIPAddress || tr069Conn?.externalIPAddress);
  const ipv6Address = toDisplayString(internetConn?.ipv6Address || tr069Conn?.ipv6Address);
  const ipv6Gateway = toDisplayString(internetConn?.ipv6Gateway || tr069Conn?.ipv6Gateway);
  const ipv6Prefix = toDisplayString(internetConn?.ipv6Prefix || tr069Conn?.ipv6Prefix);
  const macAddress = toDisplayString(internetConn?.macAddress || tr069Conn?.macAddress);
  const username = toDisplayString(
    internetConn?.username || getConnectionValue(internetConn, ["Username"])
  );
  const password = getConnectionValue(internetConn, ["X_CMS_Password", "Password"]);
  const maskedPassword =
    password !== "N/A" ? "•".repeat(Math.max(password.length, 6)) : "N/A";

  const memoryTotalKB = Number(deviceInfo?.memoryTotal ?? 0);
  const memoryFreeKB = Number(deviceInfo?.memoryFree ?? 0);
  const memoryUsedKB = Math.max(memoryTotalKB - memoryFreeKB, 0);
  const memoryUsagePercent =
    memoryTotalKB > 0 ? Math.round((memoryUsedKB / memoryTotalKB) * 100) : 0;

  const rxPowerRaw =
    typeof deviceInfo?.rxPower === "string" || typeof deviceInfo?.rxPower === "number"
      ? String(deviceInfo.rxPower)
      : typeof deviceInfo?.parameters?.RXPower === "string" || typeof deviceInfo?.parameters?.RXPower === "number"
        ? String(deviceInfo.parameters.RXPower)
        : "N/A";

  let rxPowerNumeric = 0;
  if (typeof rxPowerRaw === "string" && rxPowerRaw !== "N/A") {
    const cleaned = rxPowerRaw.replace(/[^0-9.-]/g, "");
    rxPowerNumeric = cleaned ? parseFloat(cleaned) : 0;
    if (Number.isNaN(rxPowerNumeric)) rxPowerNumeric = 0;
  }

  const formatBytes = (bytes: number) => {
    const safeBytes = Number(bytes) || 0;
    if (safeBytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(safeBytes) / Math.log(k));
    return parseFloat((safeBytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStats = () => {
    const conn = internetConn || tr069Conn;
    if (!conn?.parameters || typeof conn.parameters !== "object") {
      return { bytesSent: 0, bytesReceived: 0, packetsSent: 0, packetsReceived: 0 };
    }

    const params = conn.parameters;
    let bytesSent = 0;
    let bytesReceived = 0;
    let packetsSent = 0;
    let packetsReceived = 0;

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
    const safeSeconds = Number(seconds) || 0;
    if (!safeSeconds) return "N/A";
    const days = Math.floor(safeSeconds / 86400);
    const hours = Math.floor((safeSeconds % 86400) / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const lastContact =
    deviceInfo?.lastContact && !isNaN(new Date(deviceInfo.lastContact).getTime())
      ? new Date(deviceInfo.lastContact).toLocaleString()
      : "N/A";

  const firstUseDate =
    deviceInfo?.firstUseDate && !isNaN(new Date(deviceInfo.firstUseDate).getTime())
      ? new Date(deviceInfo.firstUseDate).toLocaleString()
      : "N/A";

  const cpuTemp =
    typeof deviceInfo?.cpuTemp === "string" || typeof deviceInfo?.cpuTemp === "number"
      ? deviceInfo.cpuTemp
      : "N/A";

  const deviceLogs =
    typeof deviceInfo?.deviceLog === "string"
      ? deviceInfo.deviceLog
      : Array.isArray(deviceInfo?.deviceLog)
        ? deviceInfo.deviceLog.map((x) => String(x)).join("\n")
        : deviceInfo?.deviceLog && typeof deviceInfo.deviceLog === "object"
          ? JSON.stringify(deviceInfo.deviceLog, null, 2)
          : "";

  const logEntries = deviceLogs.split("\n").filter((log) => log.trim() !== "");

  const getWanAccessValue = (suffix: string): string => {
    const conn = internetConn || tr069Conn;
    if (!conn?.parameters || typeof conn.parameters !== "object") return "N/A";

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

  const managementConfig = {
    sshEnable: Boolean(deviceInfo?.xAluComServiceManage?.sshEnable),
    sshPort: toDisplayString(deviceInfo?.xAluComServiceManage?.sshPort),
    telnetEnable: Boolean(deviceInfo?.xAluComServiceManage?.telnetEnable),
    telnetPort: toDisplayString(deviceInfo?.xAluComServiceManage?.telnetPort),
    managementIdleTimeout: toDisplayString(
      deviceInfo?.xAluComServiceManage?.managementIdleDisconnectTime
    ),
    wanHttpsPort: toDisplayString(deviceInfo?.xAluComServiceManage?.wanHttpsPort),
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
        <div className="text-center py-8 text-muted-foreground">
          Device information not available
        </div>
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
              {toDisplayString(deviceInfo.serialNumber)}
              <button
                onClick={() =>
                  copyToClipboard(toDisplayString(deviceInfo.serialNumber, ""), "Serial Number")
                }
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

            {ipv6Address !== "N/A" && (
              <>
                <div className="text-muted-foreground">IPv6 Address</div>
                <div className="flex items-center gap-1">
                  {ipv6Address}
                  <button
                    onClick={() => copyToClipboard(ipv6Address, "IPv6 Address")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}

            {ipv6Gateway !== "N/A" && (
              <>
                <div className="text-muted-foreground">IPv6 Gateway</div>
                <div className="flex items-center gap-1">
                  {ipv6Gateway}
                  <button
                    onClick={() => copyToClipboard(ipv6Gateway, "IPv6 Gateway")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}

            {ipv6Prefix !== "N/A" && (
              <>
                <div className="text-muted-foreground">IPv6 Prefix</div>
                <div className="flex items-center gap-1">
                  {ipv6Prefix}
                  <button
                    onClick={() => copyToClipboard(ipv6Prefix, "IPv6 Prefix")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}

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

            <div className="text-muted-foreground">Password</div>
            <div className="flex items-center gap-2">
              <span>{showPassword ? password : maskedPassword}</span>

              {password !== "N/A" && (
                <>
                  <button
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-muted-foreground hover:text-foreground"
                    title={showPassword ? "Hide Password" : "Show Password"}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => copyToClipboard(password, "Password")}
                    className="text-muted-foreground hover:text-foreground"
                    title="Copy Password"
                    type="button"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>

            <div className="text-muted-foreground">Manufacturer</div>
            <div>{toDisplayString(deviceInfo.manufacturer)}</div>

            <div className="text-muted-foreground">Model</div>
            <div>{toDisplayString(deviceInfo.modelName)}</div>

            <div className="text-muted-foreground">Software Version</div>
            <div>{toDisplayString(deviceInfo.softwareVersion)}</div>

            <div className="text-muted-foreground">Hardware Version</div>
            <div>{toDisplayString(deviceInfo.hardwareVersion)}</div>

            <div className="text-muted-foreground">Additional SW Version</div>
            <div>{toDisplayString(deviceInfo.additionalSoftwareVersion)}</div>

            <div className="text-muted-foreground">OUI</div>
            <div>{toDisplayString(deviceInfo.manufacturerOUI)}</div>

            <div className="text-muted-foreground">Product Class</div>
            <div>{toDisplayString(deviceInfo.productClass)}</div>

            <div className="text-muted-foreground">Spec Version</div>
            <div>{toDisplayString(deviceInfo.specVersion)}</div>

            <div className="text-muted-foreground">Features</div>
            <div>
              {deviceInfo?.parameters?.Features ? (
                <ul className="list-disc list-inside text-sm">
                  {String(deviceInfo.parameters.Features)
                    .split(",")
                    .map((feature: string, index: number) => (
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
                <CircularProgress value={Number(deviceInfo.cpuUsage) || 0} label="CPU Usage" />
                <span className="text-xs text-muted-foreground mt-1">
                  {Number(deviceInfo.cpuUsage) || 0}%
                </span>
              </div>

              <div className="flex flex-col items-center">
                <CircularProgress
                  value={memoryUsagePercent}
                  label="Memory Usage"
                  color="#f59e0b"
                />
                <span className="text-xs text-muted-foreground mt-1">
                  {memoryUsagePercent}%
                </span>
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
              <div>{formatUptime(Number(deviceInfo.uptimeSeconds) || 0)}</div>

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
              <div>{toDisplayString(deviceInfo.accessType)}</div>

              <div className="text-muted-foreground">Device Description</div>
              <div
                className="truncate"
                title={typeof deviceInfo.description === "string" ? deviceInfo.description : "N/A"}
              >
                {typeof deviceInfo.description === "string" ? deviceInfo.description : "N/A"}
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
                  <div className="font-medium">
                    {(Number(stats.packetsSent) || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                  <ArrowDown className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Packets Received</div>
                  <div className="font-medium">
                    {(Number(stats.packetsReceived) || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContainer>
        </div>
      </div>

      <CardContainer title="Management Configuration" gradientColor="#ec4899">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">SSH</div>
            <div className="font-medium">
              {managementConfig.sshEnable ? "Enabled" : "Disabled"}
              {managementConfig.sshPort !== "N/A" && ` (Port ${managementConfig.sshPort})`}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground text-xs">Telnet</div>
            <div className="font-medium">
              {managementConfig.telnetEnable ? "Enabled" : "Disabled"}
              {managementConfig.telnetPort !== "N/A" && ` (Port ${managementConfig.telnetPort})`}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground text-xs">WAN HTTPS Port</div>
            <div className="font-medium">{managementConfig.wanHttpsPort}</div>
          </div>

          <div>
            <div className="text-muted-foreground text-xs">Idle Timeout</div>
            <div className="font-medium">{managementConfig.managementIdleTimeout}s</div>
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

      <CardContainer title="Device Logs" gradientColor="#ef4444" className="relative">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {logEntries.length} log entries
              </span>
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
                  className="py-1 border-b border-border/50 last:border-0 text-muted-foreground whitespace-pre-wrap break-words"
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