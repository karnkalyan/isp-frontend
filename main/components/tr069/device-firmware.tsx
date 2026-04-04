"use client";

import { useEffect, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import { Play, RefreshCw, Download } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface TR069DeviceDiagnosticsProps {
  deviceId: string;
}

export function TR069DeviceDiagnostics({ deviceId }: TR069DeviceDiagnosticsProps) {
  const [pingTarget, setPingTarget] = useState("8.8.8.8");
  const [pingCount, setPingCount] = useState("4");
  const [tracerouteTarget, setTracerouteTarget] = useState("google.com");
  const [diagResults, setDiagResults] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFirmware, setCurrentFirmware] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  useEffect(() => {
    fetchDeviceLogs();
  }, [deviceId]);

  const fetchDeviceLogs = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<{ success: boolean; data: any }>(
        `/services/genieacs/devices/${deviceId}/deviceinfo`
      );
      if (data.success) {
        setDeviceInfo(data.data.deviceInfo);
      } else {
        toast.error("Failed to load device information");
      }
    } catch (error) {
      console.error("Error fetching device info:", error);
      toast.error("Error loading device information");
    } finally {
      setIsLoading(false);
    }
  };


  const runDiagnostic = (type: string) => {
    setIsRunning(true);
    setDiagResults("");

    // Simulate diagnostic - in real implementation, call API
    let results = "";
    if (type === "ping") {
      results = `PING ${pingTarget} (${pingTarget}): 56 data bytes\n64 bytes from ${pingTarget}: icmp_seq=0 ttl=116 time=11.632 ms\n...`;
    } else if (type === "traceroute") {
      results = `traceroute to ${tracerouteTarget} (142.250.185.78), 30 hops max\n...`;
    } else if (type === "dns") {
      results = `Server:\t\t8.8.8.8\nAddress:\t8.8.8.8#53\n\nNon-authoritative answer:\nName:\t${tracerouteTarget}\nAddress: 142.250.185.78`;
    }

    setTimeout(() => {
      setDiagResults(results);
      setIsRunning(false);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} diagnostic completed`);
    }, 2000);
  };

  const refreshLogs = async () => {
    await fetchDeviceLogs();
    toast.success("Logs refreshed");
  };

  const downloadLogs = () => {
    const element = document.createElement("a");
    const file = new Blob([logs], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `device-${deviceId}-logs.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Logs downloaded");
  };

  // Mock available firmware - in real implementation, fetch from API
  const [availableFirmware] = useState<{
    version: string;
    releaseDate: string;
    status: string;
    size: string;
    releaseNotes: string[];
  } | null>(null);

  const updateFirmware = () => {
    setIsUpdating(true);
    setUpdateProgress(0);

    // Simulate firmware update
    const interval = setInterval(() => {
      setUpdateProgress((prev) => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsUpdating(false);
          toast.success("Firmware updated successfully (simulated)");
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };

  const checkForUpdates = () => {
    toast.success("Checking for firmware updates... (simulated)");
    // In real implementation: API call to check updates
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <CardContainer title="Current Firmware" gradientColor="#6366f1">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">Version</div>
                <div className="text-xl font-medium">{currentFirmware.version}</div>
              </div>
              <Badge variant="outline" className="text-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Current
              </Badge>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Hardware Version</div>
              <div>{deviceInfo.hardwareVersion || "N/A"}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Additional Software</div>
              <div>{deviceInfo.additionalSoftwareVersion || "N/A"}</div>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="Firmware Update" gradientColor="#22c55e">
          {isUpdating ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Updating Firmware...</div>
                <div className="text-sm text-muted-foreground mb-4">Do not power off the device during the update</div>
              </div>

              <Progress value={updateProgress} className="h-2" />

              <div className="flex justify-between text-sm">
                <span>Downloading and verifying</span>
                <span>{updateProgress}%</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {availableFirmware ? (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-muted-foreground">New Version Available</div>
                      <div className="text-xl font-medium">{availableFirmware.version}</div>
                    </div>
                    <Badge variant="outline" className="text-blue-500 bg-blue-50 dark:bg-blue-900/20">
                      <Download className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Release Date</div>
                      <div>{availableFirmware.releaseDate}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Size</div>
                      <div>{availableFirmware.size}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Release Notes</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {availableFirmware.releaseNotes.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={updateFirmware}>
                      <Upload className="h-4 w-4 mr-2" />
                      Update Firmware
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="text-lg font-medium mb-2">No Updates Available</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your device is running the latest firmware version.
                  </p>
                  <Button variant="outline" onClick={checkForUpdates}>
                    <Download className="h-4 w-4 mr-2" />
                    Check for Updates
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContainer>
      </div>

      <CardContainer title="Firmware Information" gradientColor="#3b82f6">
        <div className="space-y-4">
          <div className="p-3 rounded-md border">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-1.5 dark:bg-blue-900/20">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="font-medium">Model</div>
                <div className="text-sm text-muted-foreground">{deviceInfo.modelName}</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-md border">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-1.5 dark:bg-purple-900/20">
                <CheckCircle className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <div className="font-medium">Description</div>
                <div className="text-sm text-muted-foreground">{deviceInfo.description}</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-md border">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-1.5 dark:bg-amber-900/20">
                <Download className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <div className="font-medium">First Use Date</div>
                <div className="text-sm text-muted-foreground">
                  {deviceInfo.firstUseDate ? new Date(deviceInfo.firstUseDate).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContainer>
    </div>
  );
}