"use client";

import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Play, ArrowUp, ArrowDown, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TR069DeviceSpeedTestProps {
  deviceId: string;
}

export function TR069DeviceSpeedTest({ deviceId }: TR069DeviceSpeedTestProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    download: number | null;
    upload: number | null;
    latency: number | null;
    jitter: number | null;
    timestamp: string | null;
  }>({
    download: null,
    upload: null,
    latency: null,
    jitter: null,
    timestamp: null,
  });

  // Check if device supports speed test (placeholder - actual check would be API)
  const [supportsSpeedTest] = useState(true);

  const runSpeedTest = async () => {
    setIsRunning(true);
    setProgress(0);

    // Simulate speed test - in real implementation, call API endpoint
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsRunning(false);

          // Simulate results - would come from API
          setResults({
            download: Math.round(Math.random() * 50 + 50), // 50-100 Mbps
            upload: Math.round(Math.random() * 10 + 15),   // 15-25 Mbps
            latency: Math.round(Math.random() * 10 + 15),  // 15-25 ms
            jitter: Math.round(Math.random() * 5 + 2),     // 2-7 ms
            timestamp: new Date().toLocaleString(),
          });

          return 100;
        }
        return newProgress;
      });
    }, 200);
  };

  useEffect(() => {
    if (progress === 100 && results.timestamp) {
      toast.success("Speed test completed successfully");
    }
  }, [progress, results.timestamp]);

  const getTestIcon = () => {
    if (progress < 40) {
      return <ArrowDown className="h-5 w-5 text-blue-500" />;
    } else if (progress < 80) {
      return <ArrowUp className="h-5 w-5 text-green-500" />;
    } else {
      return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  if (!supportsSpeedTest) {
    return (
      <CardContainer title="Speed Test" gradientColor="#6366f1">
        <div className="text-center py-8 text-muted-foreground">
          This device does not support speed testing.
        </div>
      </CardContainer>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CardContainer title="Run Speed Test" gradientColor="#6366f1">
        <div className="space-y-6">
          <div className="text-center py-6">
            {isRunning ? (
              <div className="space-y-4">
                <div className="text-lg font-medium mb-4">Running Speed Test...</div>

                <div className="relative flex justify-center items-center">
                  <div className="absolute">
                    <Loader2 className="h-20 w-20 text-muted-foreground animate-spin" />
                  </div>
                  <div className="z-10 flex items-center justify-center h-16 w-16 rounded-full bg-background border-2 border-muted">
                    {getTestIcon()}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-medium">{progress}%</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {progress < 40
                      ? "Testing download speed..."
                      : progress < 80
                        ? "Testing upload speed..."
                        : "Measuring latency..."}
                  </div>
                </div>

                <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-4">
                  <div
                    className={cn(
                      "h-full transition-all duration-200 ease-out rounded-full",
                      progress < 40 ? "bg-blue-500" : progress < 80 ? "bg-green-500" : "bg-amber-500"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-lg font-medium">Test Connection Speed</div>
                <p className="text-sm text-muted-foreground">
                  Run a speed test to measure the download and upload speeds between this device and the internet.
                </p>
                <Button onClick={runSpeedTest} disabled={isRunning} className="mx-auto">
                  <Play className="h-4 w-4 mr-2" />
                  Start Speed Test
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContainer>

      <CardContainer title="Test Results" gradientColor="#22c55e">
        <div className="space-y-6">
          {results.timestamp ? (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col items-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <ArrowDown className="h-6 w-6 text-blue-500 mb-2" />
                  <div className="text-sm text-muted-foreground">Download</div>
                  <div className="text-2xl font-bold">
                    {results.download} <span className="text-sm font-normal">Mbps</span>
                  </div>
                </div>

                <div className="flex flex-col items-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <ArrowUp className="h-6 w-6 text-green-500 mb-2" />
                  <div className="text-sm text-muted-foreground">Upload</div>
                  <div className="text-2xl font-bold">
                    {results.upload} <span className="text-sm font-normal">Mbps</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col items-center p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <Clock className="h-6 w-6 text-amber-500 mb-2" />
                  <div className="text-sm text-muted-foreground">Latency</div>
                  <div className="text-2xl font-bold">
                    {results.latency} <span className="text-sm font-normal">ms</span>
                  </div>
                </div>

                <div className="flex flex-col items-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <Clock className="h-6 w-6 text-purple-500 mb-2" />
                  <div className="text-sm text-muted-foreground">Jitter</div>
                  <div className="text-2xl font-bold">
                    {results.jitter} <span className="text-sm font-normal">ms</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">Last test: {results.timestamp}</div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No test results available. Run a speed test to see results here.
            </div>
          )}
        </div>
      </CardContainer>
    </div>
  );
}