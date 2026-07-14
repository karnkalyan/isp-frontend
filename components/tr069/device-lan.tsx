"use client";

import { useEffect, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import {
    Network,
    Server,
    Clock,
    Copy,
    Activity,
    ArrowDown,
    ArrowUp,
    Wifi,
    EthernetPort,
    Info,
    AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LanInterfaceStats {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
    errorsReceived: number;
    errorsSent: number;
    discardPacketsReceived: number;
    discardPacketsSent: number;
    multicastPacketsReceived: number;
    multicastPacketsSent: number;
    broadcastPacketsReceived: number;
    broadcastPacketsSent: number;
    unicastPacketsReceived: number;
    unicastPacketsSent: number;
    unknownProtoPacketsReceived: number;
}

interface LanInterface {
    index: number;
    name: string;
    enable: boolean;
    macAddress: string;
    maxBitRate: string;
    duplexMode: string;
    status: string;
    loopStatus: string | null;
    detectionStatus: string | null;
    stats: LanInterfaceStats;
    parameters: Record<string, any>;
}

interface TR069DeviceLanInfoProps {
    deviceId: string;
}

interface DeviceDetails {
    id: string;
    serialNumber: string;
    productClass: string;
    manufacturer: string;
    oui: string;
    status: string;
    lastContact: string;
    uptime: string;
    lanInterfaces: LanInterface[];
}

// Helper function to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Helper function to get status color
const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'up':
            return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        case 'down':
        case 'nolink':
            return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        case 'disabled':
            return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        default:
            return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
};

export function TR069DeviceLanInfo({ deviceId }: TR069DeviceLanInfoProps) {
    const [deviceDetails, setDeviceDetails] = useState<DeviceDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPort, setSelectedPort] = useState<number>(0);

    useEffect(() => {
        const fetchDeviceDetails = async () => {
            try {
                setIsLoading(true);
                const response = await apiRequest<{ success: boolean; data: DeviceDetails }>(
                    `/services/genieacs/devices/${deviceId}/laninfo`
                );
                if (response.success && response.data) {
                    setDeviceDetails(response.data);
                } else {
                    setError("Failed to load device information");
                }
            } catch (err) {
                console.error("Error fetching device details:", err);
                setError("Error loading device information");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDeviceDetails();
    }, [deviceId]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const calculatePortUtilization = (stats: LanInterfaceStats) => {
        const totalBytes = stats.bytesReceived + stats.bytesSent;
        const totalPackets = stats.packetsReceived + stats.packetsSent;
        return {
            totalBytes: formatBytes(totalBytes),
            totalPackets: totalPackets?.toLocaleString(),
            errorRate: stats.errorsReceived + stats.errorsSent > 0
                ? ((stats.errorsReceived + stats.errorsSent) / totalPackets * 100).toFixed(2)
                : '0'
        };
    };

    if (isLoading) {
        return (
            <CardContainer title="LAN Port Information" gradientColor="#8b5cf6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="ml-2 text-muted-foreground">Loading LAN port details...</p>
                </div>
            </CardContainer>
        );
    }

    if (error || !deviceDetails) {
        return (
            <CardContainer title="LAN Port Information" gradientColor="#8b5cf6">
                <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{error || "LAN port information not available"}</p>
                </div>
            </CardContainer>
        );
    }

    const activePorts = deviceDetails.lanInterfaces.filter(port => port.status === 'Up');
    const inactivePorts = deviceDetails.lanInterfaces.filter(port => port.status !== 'Up');

    return (
        <div className="space-y-6">
            {/* Device Summary */}
            <CardContainer title="Device Summary" gradientColor="#3b82f6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Serial Number</div>
                        <div className="font-mono text-sm flex items-center gap-2">
                            {deviceDetails.serialNumber}
                            <button
                                onClick={() => copyToClipboard(deviceDetails.serialNumber, "Serial Number")}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Product Class</div>
                        <div className="font-medium">{deviceDetails.productClass}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Manufacturer</div>
                        <div className="font-medium">{deviceDetails.manufacturer}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Status</div>
                        <Badge variant={deviceDetails.status === 'Online' ? 'success' : 'secondary'}>
                            {deviceDetails.status}
                        </Badge>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <div className="text-sm text-muted-foreground">Uptime</div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{deviceDetails.uptime}</span>
                        </div>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <div className="text-sm text-muted-foreground">Last Contact</div>
                        <div>{new Date(deviceDetails.lastContact).toLocaleString()}</div>
                    </div>
                </div>
            </CardContainer>

            {/* Port Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <CardContainer title="Total Ports" gradientColor="#8b5cf6" className="text-center">
                    <div className="text-3xl font-bold">{deviceDetails.lanInterfaces.length}</div>
                    <div className="text-sm text-muted-foreground mt-1">LAN Interfaces</div>
                </CardContainer>

                <CardContainer title="Active Ports" gradientColor="#10b981" className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{activePorts.length}</div>
                    <div className="text-sm text-muted-foreground mt-1">Connected</div>
                </CardContainer>

                <CardContainer title="Inactive Ports" gradientColor="#ef4444" className="text-center">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">{inactivePorts.length}</div>
                    <div className="text-sm text-muted-foreground mt-1">Disconnected</div>
                </CardContainer>

                <CardContainer title="Total Traffic" gradientColor="#f59e0b" className="text-center">
                    <div className="text-2xl font-bold">
                        {formatBytes(deviceDetails.lanInterfaces.reduce((acc, port) =>
                            acc + port.stats.bytesReceived + port.stats.bytesSent, 0
                        ))}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Combined</div>
                </CardContainer>
            </div>

            {/* LAN Ports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {deviceDetails.lanInterfaces.map((port) => {
                    const utilization = calculatePortUtilization(port.stats);
                    const currentSpeed = port.parameters[`InternetGatewayDevice.LANDevice.1.LANEthernetInterfaceConfig.${port.index}.X_ALU_COM_CurMaxBitRate`] || 'N/A';
                    const currentDuplex = port.parameters[`InternetGatewayDevice.LANDevice.1.LANEthernetInterfaceConfig.${port.index}.X_ALU_COM_CurDuplexMode`] || 'N/A';

                    return (
                        <CardContainer
                            key={port.index}
                            title={`Port ${port.index} - ${port.name}`}
                            gradientColor={port.status === 'Up' ? '#10b981' : '#ef4444'}
                            className="transition-all hover:shadow-lg"
                        >
                            <div className="space-y-4">
                                {/* Port Header Status */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <EthernetPort className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-mono text-sm">{port.macAddress}</span>
                                    </div>
                                    <Badge className={getStatusColor(port.status)}>
                                        {port.status}
                                    </Badge>
                                </div>

                                {/* Port Configuration */}
                                <div className="grid grid-cols-2 gap-4 text-sm p-3 bg-muted/50 rounded-lg">
                                    <div>
                                        <div className="text-muted-foreground">Current Speed</div>
                                        <div className="font-medium">{currentSpeed} Mbps</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Duplex Mode</div>
                                        <div className="font-medium">{currentDuplex}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Max Bit Rate</div>
                                        <div className="font-medium">{port.maxBitRate}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Configured Duplex</div>
                                        <div className="font-medium">{port.duplexMode}</div>
                                    </div>
                                </div>

                                {/* Traffic Statistics */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        Traffic Statistics
                                    </h4>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <ArrowDown className="h-3 w-3" /> Received
                                            </span>
                                            <span className="font-mono">{formatBytes(port.stats.bytesReceived)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <ArrowUp className="h-3 w-3" /> Sent
                                            </span>
                                            <span className="font-mono">{formatBytes(port.stats.bytesSent)}</span>
                                        </div>
                                    </div>

                                    {/* Packet Statistics */}
                                    <details className="text-sm">
                                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                            Advanced Statistics
                                        </summary>
                                        <div className="mt-3 space-y-2 pl-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="text-muted-foreground">Packets Received</div>
                                                <div className="font-mono text-right">{port.stats.packetsReceived?.toLocaleString()}</div>

                                                <div className="text-muted-foreground">Packets Sent</div>
                                                <div className="font-mono text-right">{port.stats.packetsSent?.toLocaleString()}</div>

                                                <div className="text-muted-foreground">Errors</div>
                                                <div className="font-mono text-right text-red-600">
                                                    {port.stats.errorsReceived + port.stats.errorsSent}
                                                </div>

                                                <div className="text-muted-foreground">Discards</div>
                                                <div className="font-mono text-right">
                                                    {port.stats.discardPacketsReceived + port.stats.discardPacketsSent}
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t">
                                                <div className="text-xs text-muted-foreground mb-1">Error Rate</div>
                                                <Progress value={parseFloat(utilization.errorRate)} max={1} className="h-1" />
                                                <div className="text-right text-xs mt-1">{utilization.errorRate}%</div>
                                            </div>
                                        </div>
                                    </details>
                                </div>

                                {/* Port Status Indicators */}
                                {port.status === 'Up' && (
                                    <div className="flex gap-2 text-xs">
                                        <Badge variant="outline" className="bg-green-50">
                                            Link Active
                                        </Badge>
                                        {port.stats.errorsReceived === 0 && port.stats.errorsSent === 0 && (
                                            <Badge variant="outline" className="bg-green-50">
                                                No Errors
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContainer>
                    );
                })}
            </div>

            {/* Additional LAN Information */}
            {activePorts.length > 0 && (
                <CardContainer title="Network Summary" gradientColor="#8b5cf6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Total Upload</div>
                                <div className="text-2xl font-bold">
                                    {formatBytes(deviceDetails.lanInterfaces.reduce((acc, port) => acc + port.stats.bytesSent, 0))}
                                </div>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Total Download</div>
                                <div className="text-2xl font-bold">
                                    {formatBytes(deviceDetails.lanInterfaces.reduce((acc, port) => acc + port.stats.bytesReceived, 0))}
                                </div>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Total Packets</div>
                                <div className="text-2xl font-bold">
                                    {(deviceDetails.lanInterfaces.reduce((acc, port) => acc + port.stats.packetsReceived + port.stats.packetsSent, 0)).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            <Info className="inline h-4 w-4 mr-1" />
                            All ports share the same MAC address as they are part of a bridge interface
                        </div>
                    </div>
                </CardContainer>
            )}
        </div>
    );
}