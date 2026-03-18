"use client";

import { useEffect, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { WanConnection } from "@/types/tr069";
import {
    Globe, Activity, Tag, Network, Router, Download, Upload,
    Clock, Shield, RefreshCw, BarChart as BarChartIcon, Info,
    AlertTriangle, Zap, Eye, EyeOff, Settings, Fingerprint,
    Wifi, Radio, Terminal, Lock, Trash2, Plus
} from "lucide-react";
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts";
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";

interface TR069DeviceWanConnectionsProps {
    deviceId: string; // serial number
}

interface EthernetStats {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
    broadcastReceived: number;
    broadcastSent: number;
    multicastReceived: number;
    multicastSent: number;
    unicastReceived: number;
    unicastSent: number;
    errorsReceived: number;
    errorsSent: number;
    discardReceived: number;
    discardSent: number;
    crcErrors: number;
    overSizePackets: number;
    underSizePackets: number;
    fragmentsReceived: number;
    fragmentsSent: number;
    jabbersReceived: number;
    jabbersSent: number;
    downstreamBwUtilization: string;
    upstreamBwUtilization: string;
}

interface AccessControls {
    httpEnabled: boolean;
    httpTrusted: boolean;
    httpsEnabled: boolean;
    httpsTrusted: boolean;
    httpsDebugMode: boolean;
    httpsDebugTimer: number;
    sshEnabled: boolean;
    sshTrusted: boolean;
    telnetEnabled: boolean;
    telnetTrusted: boolean;
    ftpEnabled: boolean;
    sftpEnabled: boolean;
    icmpEnabled: boolean;
    icmpTrusted: boolean;
    tr69Enabled: boolean;
    tr69Trusted: boolean;
    trustedNetworkEnable: boolean;
}

interface ConnectionDetails {
    serviceType: string;
    vlanId: number | null;
    vlanPriority: number | null;
    addressingType: string;
    macAddress: string;
    mtuValue: string;
    dnsServers: string[];
    name: string;
    ipDetails: {
        externalIPAddress: string;
        defaultGateway: string;
        subnetMask: string;
        remoteIPAddress: string;
    };
    pppoeDetails?: {
        username: string;
        password: string;
        acName: string;
        remoteIP: string;
        sessionId: string;
        lcpEcho: number;
        lcpEchoRetry: number;
        authenticationProtocol: string;
        encryptionProtocol: string;
        compressionProtocol: string;
        serviceName: string;
        currentMRU: number;
        maxMRU: number;
    };
    accessControls: AccessControls;
    connectionStats: {
        uptime: number;
        lastConnectionError: string;
        connectionTrigger: string;
        natEnabled: boolean;
        dnsEnabled: boolean;
        dnsOverrideAllowed: boolean;
        macAddressOverride: boolean;
        rsipAvailable: boolean;
        wanFwMark: number;
        shapingRate: number;
        shapingBurstSize: number;
        routeProtocolRx: string;
        idleDisconnectTime: number;
        autoDisconnectTime: number;
        warnDisconnectDelay: number;
    };
    dhcpOptions?: {
        dhcpServer: string;
        leaseTime: number;
        renewTime: number;
        rebindTime: number;
        dhcpOption125Enabled: boolean;
        dhcpOption125EnterpriseNumber: number;
        dhcpKeepAliveInterval: number;
        dhcpcWaitTime: number;
    };
    ipv6Details?: {
        ipv6Address: string;
        ipv6AddressOrigin: string;
        ipv6Prefix: string;
        ipv6PrefixOrigin: string;
        ipv6PrefixDelegationEnabled: boolean;
        ipv6DNSServers: string[];
        ipv6DefaultGateway: string;
        ipv6ConnStatus: string;
        ipv6NAEnabled: boolean;
    };
    portTriggering?: {
        numberOfEntries: number;
    };
    dmzConfig?: {
        dmzEnabled: boolean;
        dmzHostDescription: string;
        internalClient: string;
        excludeIPAddress: string;
    };
    vendorSpecific?: {
        dscpMark: number;
        vlanID: number;
        multicastVlan: number;
        aftr: string;
        aftrMode: number;
        dsliteEnable: boolean;
        op50Enabled: boolean;
        op50ReqIp: string;
        isFixedWAN: boolean;
        lanInterface: string;
        connectionDelay: number;
        ssdpEnabled: boolean;
        keepAliveTime: number;
        keepAliveRetry: number;
        wanNameType: string;
        dhcpOption125Enable: boolean;
        enterpriseNumb: number;
        option125Value: string;
    };
}

// Form state for adding a WAN connection
interface WanFormData {
    type: "ppp" | "ip";
    vlanId: string;
    serviceType: "INTERNET" | "VOIP" | "TR069" | "OTHER";
    isNat: boolean;
    // PPP specific
    username: string;
    password: string;
    // IP specific
    addressingType: "DHCP" | "Static";
    externalIp: string;
    subnet: string;
    gateway: string;
    isDNS: boolean;
    dnsServers: string;
}

const defaultFormData: WanFormData = {
    type: "ip",
    vlanId: "",
    serviceType: "INTERNET",
    isNat: true,
    username: "",
    password: "",
    addressingType: "DHCP",
    externalIp: "",
    subnet: "",
    gateway: "",
    isDNS: true,
    dnsServers: "",
};

export function TR069DeviceWanConnections({ deviceId }: TR069DeviceWanConnectionsProps) {
    const [wanConnections, setWanConnections] = useState<WanConnection[]>([]);
    const [stats, setStats] = useState<Record<string, EthernetStats>>({});
    const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    // Add modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState<WanFormData>(defaultFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete confirmation
    const [deleteWanId, setDeleteWanId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchWanInfo();
    }, [deviceId]);

    const fetchWanInfo = async () => {
        try {
            setIsLoading(true);
            const data = await apiRequest<{ success: boolean; data: any }>(
                `/services/genieacs/devices/${deviceId}/waninfo`
            );
            if (data.success) {
                setWanConnections(data.data.wanConnections || []);
                processStats(data.data.wanConnections || []);
            } else {
                toast.error("Failed to load WAN connections");
            }
        } catch (error) {
            console.error("Error fetching WAN info:", error);
            toast.error("Error loading WAN connections");
        } finally {
            setIsLoading(false);
        }
    };

    const processStats = (connections: WanConnection[]) => {
        const newStats: Record<string, EthernetStats> = {};

        connections.forEach((conn) => {
            const params = conn.parameters || {};
            const key = `${conn.wanDeviceIndex}-${conn.wanConnectionDeviceIndex}`;
            const basePath = conn.type === "PPP"
                ? "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.2.WANPPPConnection.1"
                : "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1";

            const getInt = (path: string) => {
                const val = params[`${basePath}.${path}`];
                return val ? parseInt(val, 10) : 0;
            };

            const getString = (path: string) => params[`${basePath}.${path}`] || "";

            newStats[key] = {
                bytesReceived: getInt("Stats.EthernetBytesReceived"),
                bytesSent: getInt("Stats.EthernetBytesSent"),
                packetsReceived: getInt("Stats.EthernetPacketsReceived"),
                packetsSent: getInt("Stats.EthernetPacketsSent"),
                broadcastReceived: getInt("Stats.EthernetBroadcastPacketsReceived"),
                broadcastSent: getInt("Stats.EthernetBroadcastPacketsSent"),
                multicastReceived: getInt("Stats.EthernetMulticastPacketsReceived"),
                multicastSent: getInt("Stats.EthernetMulticastPacketsSent"),
                unicastReceived: getInt("Stats.EthernetUnicastPacketsReceived"),
                unicastSent: getInt("Stats.EthernetUnicastPacketsSent"),
                errorsReceived: getInt("Stats.EthernetErrorsReceived"),
                errorsSent: getInt("Stats.EthernetErrorsSent"),
                discardReceived: getInt("Stats.EthernetDiscardPacketsReceived"),
                discardSent: getInt("Stats.EthernetDiscardPacketsSent"),
                crcErrors: getInt("Stats.X_ALU-COM_CRCErrorReceived"),
                overSizePackets: getInt("Stats.X_ALU-COM_OverSizePacketsReceived"),
                underSizePackets: getInt("Stats.X_ALU-COM_UnderSizePacketsReceived"),
                fragmentsReceived: getInt("Stats.X_ALU-COM_DownStreamFragments"),
                fragmentsSent: getInt("Stats.X_ALU-COM_UpStreamFragments"),
                jabbersReceived: getInt("Stats.X_ALU-COM_DownStreamJabbers"),
                jabbersSent: getInt("Stats.X_ALU-COM_UpStreamJabbers"),
                downstreamBwUtilization: getString("Stats.X_ALU-COM_DownStreamBwUtilization"),
                upstreamBwUtilization: getString("Stats.X_ALU-COM_UpStreamBwUtilization"),
            };
        });

        setStats(newStats);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchWanInfo();
        setIsRefreshing(false);
    };

    const togglePasswordVisibility = (key: string) => {
        setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const getConnectionDetails = (conn: WanConnection): ConnectionDetails => {
        const params = conn.parameters || {};
        const basePath = conn.type === "PPP"
            ? "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.2.WANPPPConnection.1"
            : "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1";

        const getStr = (path: string) => params[`${basePath}.${path}`] || "";
        const getBool = (path: string) => {
            const val = params[`${basePath}.${path}`];
            return val === "true" || val === true;
        };
        const getInt = (path: string) => {
            const val = params[`${basePath}.${path}`];
            return val ? parseInt(val, 10) : 0;
        };

        const serviceType = getStr("X_D0542D_ServiceList") || (conn.type === "PPP" ? "INTERNET" : "TR069");
        const vidMatch = conn.name?.match(/VID[_\s]?(\d+)/i);
        const vlanId = vidMatch ? parseInt(vidMatch[1]) : null;
        const vlanPriority = getInt("X_CT-COM_802-1pMark") || null;
        const addressingType = conn.type === "PPP" ? "PPPoE" : getStr("AddressingType") || "DHCP";
        const macAddress = conn.macAddress && conn.macAddress !== "N/A"
            ? conn.macAddress
            : getStr("MACAddress") || "N/A";
        const mtuValue = conn.type === "PPP"
            ? getStr("CurrentMRUSize") || getStr("MaxMRUSize") || conn.mtu?.toString() || "N/A"
            : getStr("MaxMTUSize") || conn.mtu?.toString() || "N/A";
        const dnsServers = conn.dnsServers?.length
            ? conn.dnsServers
            : getStr("DNSServers").split(",").filter(s => s.trim());

        const ipDetails = {
            externalIPAddress: conn.externalIPAddress || getStr("ExternalIPAddress") || "N/A",
            defaultGateway: conn.gateway || getStr("DefaultGateway") || "N/A",
            subnetMask: conn.subnetMask || getStr("SubnetMask") || "N/A",
            remoteIPAddress: conn.remoteIPAddress || getStr("RemoteIPAddress") || "N/A",
        };

        let pppoeDetails = undefined;
        if (conn.type === "PPP") {
            pppoeDetails = {
                username: conn.username || getStr("Username") || "N/A",
                password: getStr("Password") || "",
                acName: getStr("PPPoEACName") || "Kisan-BNG",
                remoteIP: conn.remoteIPAddress || getStr("RemoteIPAddress") || "N/A",
                sessionId: getStr("PPPoESessionID") || "N/A",
                lcpEcho: getInt("PPPLCPEcho"),
                lcpEchoRetry: getInt("PPPLCPEchoRetry"),
                authenticationProtocol: getStr("PPPAuthenticationProtocol") || conn.authenticationProtocol || "N/A",
                encryptionProtocol: getStr("PPPEncryptionProtocol") || "None",
                compressionProtocol: getStr("PPPCompressionProtocol") || "None",
                serviceName: getStr("PPPoEServiceName") || "",
                currentMRU: getInt("CurrentMRUSize"),
                maxMRU: getInt("MaxMRUSize"),
            };
        }

        const accessControls: AccessControls = {
            httpEnabled: !getBool("X_ALU-COM_WanAccessCfg.HttpDisabled"),
            httpTrusted: getBool("X_ALU-COM_WanAccessCfg.HttpTrusted"),
            httpsEnabled: !getBool("X_ALU-COM_WanAccessCfg.HttpsDisabled"),
            httpsTrusted: getBool("X_ALU-COM_WanAccessCfg.HttpsTrusted"),
            httpsDebugMode: getBool("X_ALU-COM_WanAccessCfg.HttpsDebugMode"),
            httpsDebugTimer: getInt("X_ALU-COM_WanAccessCfg.HttpsDebugTimer"),
            sshEnabled: !getBool("X_ALU-COM_WanAccessCfg.SshDisabled"),
            sshTrusted: getBool("X_ALU-COM_WanAccessCfg.SshTrusted"),
            telnetEnabled: !getBool("X_ALU-COM_WanAccessCfg.TelnetDisabled"),
            telnetTrusted: getBool("X_ALU-COM_WanAccessCfg.TelnetTrusted"),
            ftpEnabled: !getBool("X_ALU-COM_WanAccessCfg.FtpDisabled"),
            sftpEnabled: !getBool("X_ALU-COM_WanAccessCfg.SftpDisabled"),
            icmpEnabled: !getBool("X_ALU-COM_WanAccessCfg.IcmpEchoReqDisabled"),
            icmpTrusted: getBool("X_ALU-COM_WanAccessCfg.IcmpEchoReqTrusted"),
            tr69Enabled: !getBool("X_ALU-COM_WanAccessCfg.Tr69Disabled"),
            tr69Trusted: getBool("X_ALU-COM_WanAccessCfg.Tr69Trusted"),
            trustedNetworkEnable: getBool("X_ALU-COM_WanAccessCfg.TrustedNetworkEnable"),
        };

        const connectionStats = {
            uptime: conn.uptime || getInt("Uptime"),
            lastConnectionError: getStr("LastConnectionError") || "ERROR_NONE",
            connectionTrigger: getStr("ConnectionTrigger") || "AlwaysOn",
            natEnabled: getBool("NATEnabled"),
            dnsEnabled: getBool("DNSEnabled"),
            dnsOverrideAllowed: getBool("DNSOverrideAllowed"),
            macAddressOverride: getBool("MACAddressOverride"),
            rsipAvailable: getBool("RSIPAvailable"),
            wanFwMark: getInt("WanFwMark"),
            shapingRate: getInt("ShapingRate"),
            shapingBurstSize: getInt("ShapingBurstSize"),
            routeProtocolRx: getStr("RouteProtocolRx") || "Off",
            idleDisconnectTime: getInt("IdleDisconnectTime"),
            autoDisconnectTime: getInt("AutoDisconnectTime"),
            warnDisconnectDelay: getInt("WarnDisconnectDelay"),
        };

        const dhcpOptions = {
            dhcpServer: getStr("DHCPServerIPAddress") || "N/A",
            leaseTime: getInt("DHCPLeaseTime"),
            renewTime: getInt("DHCPRenewTime"),
            rebindTime: getInt("DHCPRebindTime"),
            dhcpOption125Enabled: getBool("DHCPClient.X_ALU_DHCPOption125.Enable"),
            dhcpOption125EnterpriseNumber: getInt("DHCPClient.X_ALU_DHCPOption125.EnterpriseNumber"),
            dhcpKeepAliveInterval: getInt("X_ALU-COM_DHCPKeepAliveInterval"),
            dhcpcWaitTime: getInt("X_ALU-COM_DhcpcWaitTime"),
        };

        const ipv6Details = {
            ipv6Address: getStr("X_ALU-COM_IPv6IPAddress"),
            ipv6AddressOrigin: getStr("X_ALU-COM_IPv6IPAddressOrigin") || "AutoConfigured",
            ipv6Prefix: getStr("X_ALU-COM_IPv6Prefix"),
            ipv6PrefixOrigin: getStr("X_ALU-COM_IPv6PrefixOrigin") || "PrefixDelegation",
            ipv6PrefixDelegationEnabled: getBool("X_ALU-COM_IPv6PrefixDelegationEnabled"),
            ipv6DNSServers: getStr("X_ALU-COM_IPv6DNSServers").split(",").filter(s => s.trim()),
            ipv6DefaultGateway: getStr("X_ALU-COM_DefaultIPv6Gateway"),
            ipv6ConnStatus: getStr("X_ALU-COM_IPv6ConnStatus") || "Unconfigured",
            ipv6NAEnabled: getBool("X_ALU_COM_IPv6NAEnabled"),
        };

        const portTriggering = {
            numberOfEntries: getInt("X_ALU-COM_PortTriggeringNumberOfEntries"),
        };

        const dmzConfig = {
            dmzEnabled: getBool("X_ASB_COM_DmzIpHostCfg.DmzEnabled") || getBool("X_ASB_COM_DmzPppHostCfg.DmzEnabled"),
            dmzHostDescription: getStr("X_ASB_COM_DmzIpHostCfg.DmzHostDescription") || getStr("X_ASB_COM_DmzPppHostCfg.DmzHostDescription"),
            internalClient: getStr("X_ASB_COM_DmzIpHostCfg.InternalClient") || getStr("X_ASB_COM_DmzPppHostCfg.InternalClient"),
            excludeIPAddress: getStr("X_ASB_COM_DmzIpHostCfg.ExcludeIPAddress") || getStr("X_ASB_COM_DmzPppHostCfg.ExcludeIPAddress"),
        };

        const vendorSpecific = {
            dscpMark: getInt("X_ALU-COM_DSCPMark"),
            vlanID: getInt("X_ALU-COM_VlanID"),
            multicastVlan: getInt("X_ALU-COM_MulticastVlan"),
            aftr: getStr("X_ALU-COM_Aftr"),
            aftrMode: getInt("X_ALU-COM_AftrMode"),
            dsliteEnable: getBool("X_ALU-COM_Dslite_Enable"),
            op50Enabled: getBool("X_ALU-COM_Op50Enabled"),
            op50ReqIp: getStr("X_ALU-COM_Op50ReqIp") || "0.0.0.0",
            isFixedWAN: getBool("X_ALU-COM_isFixedWAN"),
            lanInterface: getStr("X_ALU-COM_LanInterface"),
            connectionDelay: getInt("X_ALU-COM_ConnectionDelay"),
            ssdpEnabled: getBool("X_ALU-COM_SSDP_Enabled"),
            keepAliveTime: getInt("X_ALU-COM_KeepAliveTime"),
            keepAliveRetry: getInt("X_ALU-COM_KeepAliveRetry"),
            wanNameType: getStr("X_ALU-COM_WanNameType") || "Auto",
            dhcpOption125Enable: getBool("X_ALU_Op125Enabled"),
            enterpriseNumb: getInt("X_ALU_EnterpriseNumb"),
            option125Value: getStr("X_ALU_Option125Value"),
        };

        return {
            serviceType,
            vlanId,
            vlanPriority,
            addressingType,
            macAddress,
            mtuValue,
            dnsServers,
            name: conn.name || "",
            ipDetails,
            pppoeDetails,
            accessControls,
            connectionStats,
            dhcpOptions,
            ipv6Details,
            portTriggering,
            dmzConfig,
            vendorSpecific,
        };
    };

    const formatUptime = (seconds: number): string => {
        if (!seconds) return "N/A";
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
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

    const getTrafficData = (stats: EthernetStats) => [
        { name: "Received", value: stats.bytesReceived, color: "#22c55e" },
        { name: "Sent", value: stats.bytesSent, color: "#3b82f6" },
    ];

    const getPacketData = (stats: EthernetStats) => [
        { name: "Received", value: stats.packetsReceived, color: "#22c55e" },
        { name: "Sent", value: stats.packetsSent, color: "#3b82f6" },
    ];

    const totalTraffic = Object.values(stats).reduce(
        (acc, curr) => ({
            bytesReceived: acc.bytesReceived + curr.bytesReceived,
            bytesSent: acc.bytesSent + curr.bytesSent,
            packetsReceived: acc.packetsReceived + curr.packetsReceived,
            packetsSent: acc.packetsSent + curr.packetsSent,
        }),
        { bytesReceived: 0, bytesSent: 0, packetsReceived: 0, packetsSent: 0 }
    );

    // Handle Add WAN
    const handleAddWan = async () => {
        setIsSubmitting(true);
        try {
            // Build payload according to the required structure
            const payload: any = {
                type: formData.type,
                vlanId: formData.vlanId,
                staticConfig: {
                    externalIp: formData.externalIp,
                    subnet: formData.subnet,
                    gateway: formData.gateway,
                    isDNS: formData.isDNS ? "true" : "false",
                    dnsServers: formData.dnsServers,
                    addressingType: formData.addressingType,
                    serviceType: formData.serviceType,
                    isNat: formData.isNat ? "true" : "false",
                },
            };

            // Include username/password only for PPP type
            if (formData.type === "ppp") {
                payload.staticConfig.username = formData.username;
                payload.staticConfig.password = formData.password;
            }

            const response = await apiRequest<{ success: boolean; message?: string }>(
                `/services/genieacs/devices/${deviceId}/create-wan-connection`,
                {
                    method: "POST",
                    body: JSON.stringify(payload),
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (response.success) {
                toast.success("WAN connection created successfully");
                setIsAddModalOpen(false);
                setFormData(defaultFormData);
                await fetchWanInfo(); // refresh list
            } else {
                toast.error(response.message || "Failed to create WAN connection");
            }
        } catch (error) {
            console.error("Error creating WAN connection:", error);
            toast.error("Error creating WAN connection");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Delete WAN
    const handleDeleteWan = async (wanId: string) => {
        setIsDeleting(true);
        try {

            const payload: any = {
                wanId: wanId,
            }

            const response = await apiRequest<{ success: boolean; message?: string }>(
                `/services/genieacs/devices/${deviceId}/delete-wan-connection`,
                {
                    method: "POST",
                    body: JSON.stringify(payload),
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (response.success) {
                toast.success("WAN connection deleted");
                setDeleteWanId(null);
                await fetchWanInfo(); // refresh list
            } else {
                toast.error(response.message || "Failed to delete WAN connection");
            }
        } catch (error) {
            console.error("Error deleting WAN connection:", error);
            toast.error("Error deleting WAN connection");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="ml-2 text-muted-foreground">Loading WAN connections...</p>
            </div>
        );
    }

    if (wanConnections.length === 0) {
        return (
            <CardContainer title="WAN Connections" gradientColor="#6366f1">
                <div className="text-center py-12 text-muted-foreground">
                    No WAN connections found.
                </div>
                <div className="flex justify-center mt-4">
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add WAN Connection
                    </Button>
                </div>
            </CardContainer>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Summary Stats and Add button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">WAN Connections</h2>
                    <p className="text-sm text-muted-foreground">
                        Total Traffic: {formatBytes(totalTraffic.bytesReceived + totalTraffic.bytesSent)} •
                        Packets: {formatNumber(totalTraffic.packetsReceived + totalTraffic.packetsSent)} •
                        Connections: {wanConnections.length}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh Stats
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add WAN
                    </Button>
                </div>
            </div>

            {/* Connection Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {wanConnections.map((conn) => {
                    const key = `${conn.wanDeviceIndex}-${conn.wanConnectionDeviceIndex}`;
                    const WanIndexkey = `${conn.wanConnectionDeviceIndex}`;
                    const details = getConnectionDetails(conn);
                    const ethernetStats = stats[key] || {
                        bytesReceived: 0, bytesSent: 0, packetsReceived: 0, packetsSent: 0,
                        broadcastReceived: 0, broadcastSent: 0, multicastReceived: 0, multicastSent: 0,
                        unicastReceived: 0, unicastSent: 0, errorsReceived: 0, errorsSent: 0,
                        discardReceived: 0, discardSent: 0, crcErrors: 0, overSizePackets: 0,
                        underSizePackets: 0, fragmentsReceived: 0, fragmentsSent: 0,
                        jabbersReceived: 0, jabbersSent: 0, downstreamBwUtilization: "0", upstreamBwUtilization: "0"
                    };

                    const isConnected = conn.connectionStatus?.toLowerCase() === "connected";
                    const hasTraffic = ethernetStats.bytesReceived > 0 || ethernetStats.bytesSent > 0;
                    const isSelected = selectedConnection === key;
                    const hasErrors = ethernetStats.errorsReceived > 0 || ethernetStats.crcErrors > 0 ||
                        ethernetStats.discardReceived > 0 || ethernetStats.fragmentsReceived > 0;

                    const showPassword = showPasswords[key];

                    return (
                        <CardContainer
                            key={key}
                            title=""
                            gradientColor={details.serviceType === "INTERNET" ? "#22c55e" : "#6366f1"}
                            className={`transition-all duration-300 ${isSelected ? 'ring-2 ring-primary' : ''} ${hasErrors ? 'ring-1 ring-red-500/50' : ''}`}
                        >
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className={`rounded-lg p-3 ${details.serviceType === "INTERNET"
                                            ? 'bg-green-500/20 text-green-600'
                                            : 'bg-blue-500/20 text-blue-600'
                                            }`}>
                                            {details.serviceType === "INTERNET" ? (
                                                <Globe className="h-6 w-6" />
                                            ) : (
                                                <Activity className="h-6 w-6" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-lg">{details.name || details.serviceType}</h3>
                                                {details.vlanId && (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <Tag className="h-3 w-3" />
                                                        VLAN {details.vlanId}
                                                        {details.vlanPriority && details.vlanPriority > 0 && (
                                                            <span className="ml-1 text-xs">(P{details.vlanPriority})</span>
                                                        )}
                                                    </Badge>
                                                )}
                                                <Badge variant={isConnected ? "success" : "destructive"} className="capitalize">
                                                    {conn.connectionStatus || "Unknown"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <span>{conn.type} • {conn.connectionType} • {details.addressingType}</span>
                                                {conn.transportType && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {conn.transportType}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedConnection(isSelected ? null : key)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Info className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteWanId(WanIndexkey)}
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Quick Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-muted/50 rounded-lg p-3">
                                        <div className="text-xs text-muted-foreground">External IP</div>
                                        <div className="font-mono text-sm font-medium truncate">{details.ipDetails.externalIPAddress}</div>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-3">
                                        <div className="text-xs text-muted-foreground">Gateway</div>
                                        <div className="font-mono text-sm font-medium truncate">{details.ipDetails.defaultGateway}</div>
                                    </div>
                                </div>

                                {/* Traffic Charts (unchanged) */}
                                {hasTraffic ? (
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        {/* Bytes Chart */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Traffic</span>
                                                <span className="font-medium">{formatBytes(ethernetStats.bytesReceived + ethernetStats.bytesSent)}</span>
                                            </div>
                                            <div className="h-24">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsPieChart>
                                                        <Pie
                                                            data={getTrafficData(ethernetStats)}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={20}
                                                            outerRadius={35}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            animationBegin={0}
                                                            animationDuration={1500}
                                                            isAnimationActive={true}
                                                        >
                                                            {getTrafficData(ethernetStats).map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(value: number) => formatBytes(value)}
                                                            contentStyle={{
                                                                backgroundColor: "hsl(var(--background))",
                                                                border: "1px solid hsl(var(--border))",
                                                                fontSize: "12px",
                                                                borderRadius: "6px",
                                                            }}
                                                        />
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-green-600 dark:text-green-400">RX: {formatBytes(ethernetStats.bytesReceived)}</span>
                                                <span className="text-blue-600 dark:text-blue-400">TX: {formatBytes(ethernetStats.bytesSent)}</span>
                                            </div>
                                        </div>

                                        {/* Packets Chart */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Packets</span>
                                                <span className="font-medium">{formatNumber(ethernetStats.packetsReceived + ethernetStats.packetsSent)}</span>
                                            </div>
                                            <div className="h-24">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsPieChart>
                                                        <Pie
                                                            data={getPacketData(ethernetStats)}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={20}
                                                            outerRadius={35}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            animationBegin={0}
                                                            animationDuration={1500}
                                                            isAnimationActive={true}
                                                        >
                                                            {getPacketData(ethernetStats).map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(value: number) => formatNumber(value)}
                                                            contentStyle={{
                                                                backgroundColor: "hsl(var(--background))",
                                                                border: "1px solid hsl(var(--border))",
                                                                fontSize: "12px",
                                                                borderRadius: "6px",
                                                            }}
                                                        />
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-green-600 dark:text-green-400">RX: {formatNumber(ethernetStats.packetsReceived)}</span>
                                                <span className="text-blue-600 dark:text-blue-400">TX: {formatNumber(ethernetStats.packetsSent)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-muted/30 rounded-lg p-4 text-center text-sm text-muted-foreground">
                                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        No traffic data available. Connection uptime: {formatUptime(conn.uptime || 0)}
                                    </div>
                                )}

                                {/* Error Indicator */}
                                {hasErrors && (
                                    <div className="bg-red-500/10 rounded-lg p-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">Errors detected - Click info for details</span>
                                    </div>
                                )}

                                {/* Expanded Details (unchanged) */}
                                {isSelected && (
                                    <div className="pt-4 space-y-4 border-t animate-in slide-in-from-top-2 duration-300">
                                        {/* ... (keep all the existing expanded sections) ... */}
                                        {/* IP Configuration */}
                                        <div>
                                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <Network className="h-4 w-4" />
                                                IP Configuration
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="bg-muted/30 p-2 rounded col-span-2">
                                                    <div className="text-xs text-muted-foreground">External IP</div>
                                                    <div className="font-mono">{details.ipDetails.externalIPAddress}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-xs text-muted-foreground">Default Gateway</div>
                                                    <div className="font-mono">{details.ipDetails.defaultGateway}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-xs text-muted-foreground">Remote IP</div>
                                                    <div className="font-mono">{details.ipDetails.remoteIPAddress}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-xs text-muted-foreground">Subnet Mask</div>
                                                    <div className="font-mono">{details.ipDetails.subnetMask}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-xs text-muted-foreground">MAC Address</div>
                                                    <div className="font-mono">{details.macAddress}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded col-span-2">
                                                    <div className="text-xs text-muted-foreground">DNS Servers</div>
                                                    <div className="font-mono text-xs break-all">
                                                        {details.dnsServers.length > 0 ? details.dnsServers.join(", ") : "N/A"}
                                                    </div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-xs text-muted-foreground">{conn.type === "PPP" ? "MRU" : "MTU"}</div>
                                                    <div className="font-mono">{details.mtuValue}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-xs text-muted-foreground">Addressing</div>
                                                    <div className="font-mono">{details.addressingType}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* PPPoE Details */}
                                        {details.pppoeDetails && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Router className="h-4 w-4" />
                                                    PPPoE / BRAS Details
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Username</div>
                                                        <div className="font-mono">{details.pppoeDetails.username}</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Password</div>
                                                        <div className="font-mono flex items-center gap-1">
                                                            <span>{showPassword ? details.pppoeDetails.password : '••••••••'}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={() => togglePasswordVisibility(key)}
                                                            >
                                                                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">BRAS Name (AC)</div>
                                                        <div className="font-mono text-green-600 dark:text-green-400">
                                                            {details.pppoeDetails.acName}
                                                        </div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Remote IP</div>
                                                        <div className="font-mono">{details.pppoeDetails.remoteIP}</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Session ID</div>
                                                        <div className="font-mono">{details.pppoeDetails.sessionId}</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Service Name</div>
                                                        <div className="font-mono">{details.pppoeDetails.serviceName || "N/A"}</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">LCP Echo</div>
                                                        <div className="font-mono">{details.pppoeDetails.lcpEcho}s / {details.pppoeDetails.lcpEchoRetry}</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Auth/Encrypt</div>
                                                        <div className="font-mono text-xs">{details.pppoeDetails.authenticationProtocol} / {details.pppoeDetails.encryptionProtocol}</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Compression</div>
                                                        <div className="font-mono">{details.pppoeDetails.compressionProtocol || "None"}</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">MRU (Current/Max)</div>
                                                        <div className="font-mono">{details.pppoeDetails.currentMRU} / {details.pppoeDetails.maxMRU}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* DHCP Options */}
                                        {conn.type === "IP" && details.dhcpOptions && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Settings className="h-4 w-4" />
                                                    DHCP Configuration
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">DHCP Server</div>
                                                        <div className="font-mono">{details.dhcpOptions.dhcpServer}</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Lease Time</div>
                                                        <div className="font-mono">{details.dhcpOptions.leaseTime}s</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Renew/Rebind</div>
                                                        <div className="font-mono">{details.dhcpOptions.renewTime}s / {details.dhcpOptions.rebindTime}s</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Keep Alive</div>
                                                        <div className="font-mono">{details.dhcpOptions.dhcpKeepAliveInterval}s</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Option125</div>
                                                        <div className="font-mono">{details.dhcpOptions.dhcpOption125Enabled ? 'Enabled' : 'Disabled'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* IPv6 Details */}
                                        {details.ipv6Details && details.ipv6Details.ipv6Address && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Radio className="h-4 w-4" />
                                                    IPv6 Configuration
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="bg-muted/30 p-2 rounded col-span-2">
                                                        <div className="text-xs text-muted-foreground">IPv6 Address</div>
                                                        <div className="font-mono text-xs">{details.ipv6Details.ipv6Address}</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Address Origin</div>
                                                        <div className="font-mono">{details.ipv6Details.ipv6AddressOrigin}</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Prefix</div>
                                                        <div className="font-mono">{details.ipv6Details.ipv6Prefix || "N/A"}</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Prefix Delegation</div>
                                                        <div className="font-mono">{details.ipv6Details.ipv6PrefixDelegationEnabled ? 'Enabled' : 'Disabled'}</div>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <div className="text-xs text-muted-foreground">Status</div>
                                                        <div className="font-mono">{details.ipv6Details.ipv6ConnStatus}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Access Control List */}
                                        <div>
                                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                Access Control List (ACL)
                                            </h4>

                                            <div className="space-y-4">
                                                {/* Web Access */}
                                                <div>
                                                    <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                                        <Globe className="h-3 w-3" />
                                                        Web Access
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {/* HTTP */}
                                                        <div className="bg-muted/30 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium">HTTP</span>
                                                                {details.accessControls.httpEnabled ? (
                                                                    <Badge variant="success" className="text-[10px]">Enabled</Badge>
                                                                ) : (
                                                                    <Badge variant="destructive" className="text-[10px]">Disabled</Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-muted-foreground">Trusted Mode:</span>
                                                                <span className={details.accessControls.httpTrusted ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                                                                    {details.accessControls.httpTrusted ? "Yes" : "No"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* HTTPS */}
                                                        <div className="bg-muted/30 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium">HTTPS</span>
                                                                {details.accessControls.httpsEnabled ? (
                                                                    <Badge variant="success" className="text-[10px]">Enabled</Badge>
                                                                ) : (
                                                                    <Badge variant="destructive" className="text-[10px]">Disabled</Badge>
                                                                )}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-muted-foreground">Trusted Mode:</span>
                                                                    <span className={details.accessControls.httpsTrusted ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                                                                        {details.accessControls.httpsTrusted ? "Yes" : "No"}
                                                                    </span>
                                                                </div>
                                                                {details.accessControls.httpsDebugMode && (
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <span className="text-muted-foreground">Debug Mode:</span>
                                                                        <span className="text-amber-600">{details.accessControls.httpsDebugTimer}s</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remote Access */}
                                                <div>
                                                    <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                                        <Router className="h-3 w-3" />
                                                        Remote Access
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {/* SSH */}
                                                        <div className="bg-muted/30 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium">SSH</span>
                                                                {details.accessControls.sshEnabled ? (
                                                                    <Badge variant="success" className="text-[10px]">Enabled</Badge>
                                                                ) : (
                                                                    <Badge variant="destructive" className="text-[10px]">Disabled</Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-muted-foreground">Trusted Mode:</span>
                                                                <span className={details.accessControls.sshTrusted ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                                                                    {details.accessControls.sshTrusted ? "Yes" : "No"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Telnet */}
                                                        <div className="bg-muted/30 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium">Telnet</span>
                                                                {details.accessControls.telnetEnabled ? (
                                                                    <Badge variant="success" className="text-[10px]">Enabled</Badge>
                                                                ) : (
                                                                    <Badge variant="destructive" className="text-[10px]">Disabled</Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-muted-foreground">Trusted Mode:</span>
                                                                <span className={details.accessControls.telnetTrusted ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                                                                    {details.accessControls.telnetTrusted ? "Yes" : "No"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* File Transfer */}
                                                <div>
                                                    <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                                        <Download className="h-3 w-3" />
                                                        File Transfer
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {/* FTP */}
                                                        <div className="bg-muted/30 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium">FTP</span>
                                                                {details.accessControls.ftpEnabled ? (
                                                                    <Badge variant="success" className="text-[10px]">Enabled</Badge>
                                                                ) : (
                                                                    <Badge variant="destructive" className="text-[10px]">Disabled</Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* SFTP */}
                                                        <div className="bg-muted/30 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium">SFTP</span>
                                                                {details.accessControls.sftpEnabled ? (
                                                                    <Badge variant="success" className="text-[10px]">Enabled</Badge>
                                                                ) : (
                                                                    <Badge variant="destructive" className="text-[10px]">Disabled</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Network Services */}
                                                <div>
                                                    <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                                        <Network className="h-3 w-3" />
                                                        Network Services
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {/* ICMP (Ping) */}
                                                        <div className="bg-muted/30 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium">ICMP (Ping)</span>
                                                                {details.accessControls.icmpEnabled ? (
                                                                    <Badge variant="success" className="text-[10px]">Enabled</Badge>
                                                                ) : (
                                                                    <Badge variant="destructive" className="text-[10px]">Disabled</Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-muted-foreground">Trusted Mode:</span>
                                                                <span className={details.accessControls.icmpTrusted ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                                                                    {details.accessControls.icmpTrusted ? "Yes" : "No"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* TR-069 (ACS) */}
                                                        <div className="bg-muted/30 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium">TR-069 (ACS)</span>
                                                                {details.accessControls.tr69Enabled ? (
                                                                    <Badge variant="success" className="text-[10px]">Enabled</Badge>
                                                                ) : (
                                                                    <Badge variant="destructive" className="text-[10px]">Disabled</Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-muted-foreground">Trusted Mode:</span>
                                                                <span className={details.accessControls.tr69Trusted ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                                                                    {details.accessControls.tr69Trusted ? "Yes" : "No"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Trusted Network Status */}
                                                {details.accessControls.trustedNetworkEnable && (
                                                    <div className="bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                                        <div className="flex items-center gap-2">
                                                            <Shield className="h-4 w-4 text-amber-600" />
                                                            <div>
                                                                <div className="text-sm font-medium text-amber-600 dark:text-amber-400">Trusted Network Mode</div>
                                                                <div className="text-xs text-muted-foreground">Access restricted to trusted networks only</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* ACL Summary */}
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {details.accessControls.httpEnabled && (
                                                <Badge variant={details.accessControls.httpTrusted ? "warning" : "outline"} className="text-[10px] gap-1">
                                                    <Globe className="h-3 w-3" />
                                                    HTTP {details.accessControls.httpTrusted ? '(Trusted)' : ''}
                                                </Badge>
                                            )}
                                            {details.accessControls.httpsEnabled && (
                                                <Badge variant={details.accessControls.httpsTrusted ? "warning" : "outline"} className="text-[10px] gap-1">
                                                    <Lock className="h-3 w-3" />
                                                    HTTPS {details.accessControls.httpsTrusted ? '(Trusted)' : ''}
                                                </Badge>
                                            )}
                                            {details.accessControls.sshEnabled && (
                                                <Badge variant={details.accessControls.sshTrusted ? "warning" : "outline"} className="text-[10px] gap-1">
                                                    <Terminal className="h-3 w-3" />
                                                    SSH {details.accessControls.sshTrusted ? '(Trusted)' : ''}
                                                </Badge>
                                            )}
                                            {details.accessControls.telnetEnabled && (
                                                <Badge variant={details.accessControls.telnetTrusted ? "warning" : "outline"} className="text-[10px] gap-1">
                                                    <Terminal className="h-3 w-3" />
                                                    Telnet {details.accessControls.telnetTrusted ? '(Trusted)' : ''}
                                                </Badge>
                                            )}
                                            {details.accessControls.ftpEnabled && (
                                                <Badge variant="outline" className="text-[10px] gap-1">
                                                    <Download className="h-3 w-3" />
                                                    FTP
                                                </Badge>
                                            )}
                                            {details.accessControls.sftpEnabled && (
                                                <Badge variant="outline" className="text-[10px] gap-1">
                                                    <Upload className="h-3 w-3" />
                                                    SFTP
                                                </Badge>
                                            )}
                                            {details.accessControls.icmpEnabled && (
                                                <Badge variant={details.accessControls.icmpTrusted ? "warning" : "outline"} className="text-[10px] gap-1">
                                                    <Activity className="h-3 w-3" />
                                                    Ping {details.accessControls.icmpTrusted ? '(Trusted)' : ''}
                                                </Badge>
                                            )}
                                            {details.accessControls.tr69Enabled && (
                                                <Badge variant={details.accessControls.tr69Trusted ? "warning" : "outline"} className="text-[10px] gap-1">
                                                    <Settings className="h-3 w-3" />
                                                    TR-069 {details.accessControls.tr69Trusted ? '(Trusted)' : ''}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Connection Stats */}
                                        <div>
                                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <Activity className="h-4 w-4" />
                                                Connection Statistics
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <span className="text-muted-foreground">NAT:</span>
                                                    <span className="ml-1 font-medium">{details.connectionStats.natEnabled ? 'Enabled' : 'Disabled'}</span>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <span className="text-muted-foreground">DNS:</span>
                                                    <span className="ml-1 font-medium">{details.connectionStats.dnsEnabled ? 'Enabled' : 'Disabled'}</span>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <span className="text-muted-foreground">DNS Override:</span>
                                                    <span className="ml-1 font-medium">{details.connectionStats.dnsOverrideAllowed ? 'Allowed' : 'Not Allowed'}</span>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <span className="text-muted-foreground">MAC Override:</span>
                                                    <span className="ml-1 font-medium">{details.connectionStats.macAddressOverride ? 'Yes' : 'No'}</span>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <span className="text-muted-foreground">WAN FW Mark:</span>
                                                    <span className="ml-1 font-medium">{details.connectionStats.wanFwMark}</span>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <span className="text-muted-foreground">Shaping Rate:</span>
                                                    <span className="ml-1 font-medium">{details.connectionStats.shapingRate} kbps</span>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded col-span-2">
                                                    <span className="text-muted-foreground">Last Error:</span>
                                                    <span className="ml-1 font-medium">{details.connectionStats.lastConnectionError}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* DMZ Configuration */}
                                        {details.dmzConfig && details.dmzConfig.dmzEnabled && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Zap className="h-4 w-4" />
                                                    DMZ Configuration
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <span className="text-muted-foreground">DMZ Host:</span>
                                                        <span className="ml-1 font-medium">{details.dmzConfig.internalClient || "N/A"}</span>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <span className="text-muted-foreground">Description:</span>
                                                        <span className="ml-1 font-medium">{details.dmzConfig.dmzHostDescription || "N/A"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Vendor Specific */}
                                        {details.vendorSpecific && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Fingerprint className="h-4 w-4" />
                                                    Vendor Specific
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <span className="text-muted-foreground">DSCP Mark:</span>
                                                        <span className="ml-1 font-medium">{details.vendorSpecific.dscpMark}</span>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <span className="text-muted-foreground">VLAN ID:</span>
                                                        <span className="ml-1 font-medium">{details.vendorSpecific.vlanID}</span>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <span className="text-muted-foreground">Multicast VLAN:</span>
                                                        <span className="ml-1 font-medium">{details.vendorSpecific.multicastVlan}</span>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <span className="text-muted-foreground">DS-Lite:</span>
                                                        <span className="ml-1 font-medium">{details.vendorSpecific.dsliteEnable ? 'Enabled' : 'Disabled'}</span>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <span className="text-muted-foreground">SSDP:</span>
                                                        <span className="ml-1 font-medium">{details.vendorSpecific.ssdpEnabled ? 'Enabled' : 'Disabled'}</span>
                                                    </div>
                                                    <div className="bg-muted/30 p-2 rounded">
                                                        <span className="text-muted-foreground">Keep Alive:</span>
                                                        <span className="ml-1 font-medium">{details.vendorSpecific.keepAliveTime}s / {details.vendorSpecific.keepAliveRetry}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Detailed Ethernet Statistics */}
                                        <div>
                                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <BarChartIcon className="h-4 w-4" />
                                                Detailed Ethernet Statistics
                                            </h4>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">Unicast RX</div>
                                                    <div className="font-medium">{formatNumber(ethernetStats.unicastReceived)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">Unicast TX</div>
                                                    <div className="font-medium">{formatNumber(ethernetStats.unicastSent)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">Broadcast RX</div>
                                                    <div className="font-medium">{formatNumber(ethernetStats.broadcastReceived)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">Broadcast TX</div>
                                                    <div className="font-medium">{formatNumber(ethernetStats.broadcastSent)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">Multicast RX</div>
                                                    <div className="font-medium">{formatNumber(ethernetStats.multicastReceived)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">Multicast TX</div>
                                                    <div className="font-medium">{formatNumber(ethernetStats.multicastSent)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">CRC Errors</div>
                                                    <div className="font-medium text-red-500">{formatNumber(ethernetStats.crcErrors)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">Discard RX</div>
                                                    <div className="font-medium text-amber-500">{formatNumber(ethernetStats.discardReceived)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">Discard TX</div>
                                                    <div className="font-medium text-amber-500">{formatNumber(ethernetStats.discardSent)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">Fragments RX</div>
                                                    <div className="font-medium">{formatNumber(ethernetStats.fragmentsReceived)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">Fragments TX</div>
                                                    <div className="font-medium">{formatNumber(ethernetStats.fragmentsSent)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">Jabbers RX</div>
                                                    <div className="font-medium">{formatNumber(ethernetStats.jabbersReceived)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">OverSize RX</div>
                                                    <div className="font-medium">{formatNumber(ethernetStats.overSizePackets)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">UnderSize RX</div>
                                                    <div className="font-medium">{formatNumber(ethernetStats.underSizePackets)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">Errors RX</div>
                                                    <div className="font-medium text-red-500">{formatNumber(ethernetStats.errorsReceived)}</div>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded">
                                                    <div className="text-muted-foreground">Errors TX</div>
                                                    <div className="font-medium text-red-500">{formatNumber(ethernetStats.errorsSent)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatUptime(details.connectionStats.uptime)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {details.connectionStats.natEnabled && (
                                            <Badge variant="outline" className="text-xs">NAT</Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                            {details.serviceType}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContainer>
                    );
                })}
            </div>

            {/* Add WAN Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add WAN Connection</DialogTitle>
                        <DialogDescription>
                            Configure a new WAN connection for device {deviceId}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Type */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                Type
                            </Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: "ppp" | "ip") => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ip">IP (DHCP/Static)</SelectItem>
                                    <SelectItem value="ppp">PPP (PPPoE)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* VLAN ID */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="vlanId" className="text-right">
                                VLAN ID
                            </Label>
                            <Input
                                id="vlanId"
                                value={formData.vlanId}
                                onChange={(e) => setFormData({ ...formData, vlanId: e.target.value })}
                                className="col-span-3"
                                placeholder="e.g., 528"
                            />
                        </div>

                        {/* Service Type */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="serviceType" className="text-right">
                                Service Type
                            </Label>
                            <Select
                                value={formData.serviceType}
                                onValueChange={(value: "INTERNET" | "VOIP" | "TR069" | "OTHER") =>
                                    setFormData({ ...formData, serviceType: value })
                                }
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INTERNET">Internet</SelectItem>
                                    <SelectItem value="VOIP">VoIP</SelectItem>
                                    <SelectItem value="TR069">TR069</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* NAT Enabled (only for Internet) */}
                        {formData.serviceType === "INTERNET" && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="isNat" className="text-right">
                                    NAT
                                </Label>
                                <div className="flex items-center space-x-2 col-span-3">
                                    <Checkbox
                                        id="isNat"
                                        checked={formData.isNat}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, isNat: checked as boolean })
                                        }
                                    />
                                    <Label htmlFor="isNat" className="text-sm font-normal">
                                        Enable NAT (default)
                                    </Label>
                                </div>
                            </div>
                        )}

                        {/* PPP specific fields */}
                        {formData.type === "ppp" && (
                            <>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="username" className="text-right">
                                        Username
                                    </Label>
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="col-span-3"
                                        placeholder="PPPoE username"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="password" className="text-right">
                                        Password
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="col-span-3"
                                        placeholder="PPPoE password"
                                    />
                                </div>
                            </>
                        )}

                        {/* IP specific fields */}
                        {formData.type === "ip" && (
                            <>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="addressingType" className="text-right">
                                        Addressing
                                    </Label>
                                    <Select
                                        value={formData.addressingType}
                                        onValueChange={(value: "DHCP" | "Static") =>
                                            setFormData({ ...formData, addressingType: value })
                                        }
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select addressing type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DHCP">DHCP</SelectItem>
                                            <SelectItem value="Static">Static</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.addressingType === "Static" && (
                                    <>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="externalIp" className="text-right">
                                                IP Address
                                            </Label>
                                            <Input
                                                id="externalIp"
                                                value={formData.externalIp}
                                                onChange={(e) => setFormData({ ...formData, externalIp: e.target.value })}
                                                className="col-span-3"
                                                placeholder="e.g., 10.7.29.1"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="subnet" className="text-right">
                                                Subnet Mask
                                            </Label>
                                            <Input
                                                id="subnet"
                                                value={formData.subnet}
                                                onChange={(e) => setFormData({ ...formData, subnet: e.target.value })}
                                                className="col-span-3"
                                                placeholder="e.g., 255.255.255.0"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="gateway" className="text-right">
                                                Gateway
                                            </Label>
                                            <Input
                                                id="gateway"
                                                value={formData.gateway}
                                                onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                                                className="col-span-3"
                                                placeholder="e.g., 10.7.29.1"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="isDNS" className="text-right">
                                                Use DNS
                                            </Label>
                                            <div className="flex items-center space-x-2 col-span-3">
                                                <Checkbox
                                                    id="isDNS"
                                                    checked={formData.isDNS}
                                                    onCheckedChange={(checked) =>
                                                        setFormData({ ...formData, isDNS: checked as boolean })
                                                    }
                                                />
                                                <Label htmlFor="isDNS" className="text-sm font-normal">
                                                    Enable custom DNS servers
                                                </Label>
                                            </div>
                                        </div>
                                        {formData.isDNS && (
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="dnsServers" className="text-right">
                                                    DNS Servers
                                                </Label>
                                                <Input
                                                    id="dnsServers"
                                                    value={formData.dnsServers}
                                                    onChange={(e) => setFormData({ ...formData, dnsServers: e.target.value })}
                                                    className="col-span-3"
                                                    placeholder="Comma separated, e.g., 9.9.9.9,1.1.1.1"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddWan} disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Connection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteWanId} onOpenChange={(open) => !open && setDeleteWanId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete WAN Connection</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this WAN connection? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteWanId(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteWanId && handleDeleteWan(deleteWanId)}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}