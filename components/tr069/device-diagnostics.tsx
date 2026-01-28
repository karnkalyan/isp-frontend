"use client"

import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { Play, RefreshCw, Download } from "lucide-react"

interface TR069DeviceDiagnosticsProps {
  deviceId: string
}

export function TR069DeviceDiagnostics({ deviceId }: TR069DeviceDiagnosticsProps) {
  const [pingTarget, setPingTarget] = useState("8.8.8.8")
  const [pingCount, setPingCount] = useState("4")
  const [tracerouteTarget, setTracerouteTarget] = useState("google.com")
  const [diagResults, setDiagResults] = useState("")
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostic = (type: string) => {
    setIsRunning(true)
    setDiagResults("")

    // Simulate diagnostic running
    let results = ""

    if (type === "ping") {
      results =
        `PING ${pingTarget} (${pingTarget}): 56 data bytes\n` +
        `64 bytes from ${pingTarget}: icmp_seq=0 ttl=116 time=11.632 ms\n` +
        `64 bytes from ${pingTarget}: icmp_seq=1 ttl=116 time=12.032 ms\n` +
        `64 bytes from ${pingTarget}: icmp_seq=2 ttl=116 time=10.823 ms\n` +
        `64 bytes from ${pingTarget}: icmp_seq=3 ttl=116 time=10.654 ms\n\n` +
        `--- ${pingTarget} ping statistics ---\n` +
        `4 packets transmitted, 4 packets received, 0.0% packet loss\n` +
        `round-trip min/avg/max/stddev = 10.654/11.285/12.032/0.587 ms`
    } else if (type === "traceroute") {
      results =
        `traceroute to ${tracerouteTarget} (142.250.185.78), 30 hops max, 60 byte packets\n` +
        ` 1  192.168.1.1  1.285 ms  1.106 ms  0.992 ms\n` +
        ` 2  10.0.0.1  10.225 ms  10.015 ms  9.852 ms\n` +
        ` 3  172.16.10.1  15.632 ms  15.421 ms  15.301 ms\n` +
        ` 4  172.25.32.1  18.521 ms  18.325 ms  18.102 ms\n` +
        ` 5  142.250.185.78  20.321 ms  20.125 ms  20.012 ms`
    } else if (type === "dns") {
      results =
        `Server:\t\t8.8.8.8\n` +
        `Address:\t8.8.8.8#53\n\n` +
        `Non-authoritative answer:\n` +
        `Name:\t${tracerouteTarget}\n` +
        `Address: 142.250.185.78\n` +
        `Name:\t${tracerouteTarget}\n` +
        `Address: 2a00:1450:4001:830::200e`
    }

    // Simulate delay
    setTimeout(() => {
      setDiagResults(results)
      setIsRunning(false)
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} diagnostic completed`)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ping" className="w-full">
        <TabsList>
          <TabsTrigger value="ping">Ping</TabsTrigger>
          <TabsTrigger value="traceroute">Traceroute</TabsTrigger>
          <TabsTrigger value="dns">DNS Lookup</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="ping" className="space-y-4 pt-4">
          <CardContainer title="Ping Diagnostic" gradientColor="#6366f1">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pingTarget">Target Host</Label>
                  <Input
                    id="pingTarget"
                    value={pingTarget}
                    onChange={(e) => setPingTarget(e.target.value)}
                    placeholder="IP address or hostname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pingCount">Ping Count</Label>
                  <Input
                    id="pingCount"
                    value={pingCount}
                    onChange={(e) => setPingCount(e.target.value)}
                    type="number"
                    min="1"
                    max="20"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => runDiagnostic("ping")} disabled={isRunning}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Ping
                </Button>
              </div>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="traceroute" className="space-y-4 pt-4">
          <CardContainer title="Traceroute Diagnostic" gradientColor="#22c55e">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tracerouteTarget">Target Host</Label>
                <Input
                  id="tracerouteTarget"
                  value={tracerouteTarget}
                  onChange={(e) => setTracerouteTarget(e.target.value)}
                  placeholder="IP address or hostname"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => runDiagnostic("traceroute")} disabled={isRunning}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Traceroute
                </Button>
              </div>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="dns" className="space-y-4 pt-4">
          <CardContainer title="DNS Lookup" gradientColor="#3b82f6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dnsTarget">Domain Name</Label>
                <Input
                  id="dnsTarget"
                  value={tracerouteTarget}
                  onChange={(e) => setTracerouteTarget(e.target.value)}
                  placeholder="Domain name to lookup"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => runDiagnostic("dns")} disabled={isRunning}>
                  <Play className="h-4 w-4 mr-2" />
                  Run DNS Lookup
                </Button>
              </div>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 pt-4">
          <CardContainer title="System Logs" gradientColor="#f43f5e">
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Logs
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Logs
                </Button>
              </div>

              <div className="h-64 overflow-auto p-4 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-xs">
                <pre>
                  {`2023-04-10 08:32:45 [INFO] Device boot completed
2023-04-10 08:32:46 [INFO] WAN interface up
2023-04-10 08:32:47 [INFO] DHCP server started
2023-04-10 08:32:48 [INFO] WiFi AP started
2023-04-10 08:33:01 [INFO] Client F4:8C:50:12:34:56 connected
2023-04-10 08:35:22 [INFO] Client 18:65:90:AB:CD:EF connected
2023-04-10 09:15:33 [WARN] High CPU usage detected: 85%
2023-04-10 09:15:45 [INFO] CPU usage returned to normal: 45%
2023-04-10 10:22:15 [INFO] Firmware update check completed
2023-04-10 10:22:16 [INFO] No new firmware available`}
                </pre>
              </div>
            </div>
          </CardContainer>
        </TabsContent>
      </Tabs>

      {diagResults && (
        <CardContainer title="Diagnostic Results" gradientColor="#6366f1">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-xs overflow-auto">
            <pre>{diagResults}</pre>
          </div>
        </CardContainer>
      )}
    </div>
  )
}
