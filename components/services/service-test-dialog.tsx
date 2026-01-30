// components/services/service-test-dialog.tsx
"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ISPService, ServiceTestResult } from "@/types/service.types";
import { CheckCircle, XCircle, Clock, Info } from "lucide-react";

interface ServiceTestDialogProps {
    service: ISPService;
    result: ServiceTestResult;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ServiceTestDialog({
    service,
    result,
    open,
    onOpenChange,
}: ServiceTestDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Connection Test - {service.service.name}</DialogTitle>
                    <DialogDescription>
                        Results of the service connection test
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {result.connected ? (
                                <>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="font-medium text-green-700">Connection Successful</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-5 w-5 text-red-500" />
                                    <span className="font-medium text-red-700">Connection Failed</span>
                                </>
                            )}
                        </div>
                        <Badge variant={result.connected ? "default" : "destructive"}>
                            {result.connected ? "Connected" : "Failed"}
                        </Badge>
                    </div>

                    <Alert variant={result.connected ? "default" : "destructive"}>
                        {result.connected ? (
                            <CheckCircle className="h-4 w-4" />
                        ) : (
                            <XCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>{result.connected ? "Success" : "Error"}</AlertTitle>
                        <AlertDescription>{result.message}</AlertDescription>
                    </Alert>

                    <div className="text-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Timestamp:</span>
                            <span>{new Date(result.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Service:</span>
                            <span>{service.service.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">API URL:</span>
                            <span className="font-mono text-xs truncate max-w-[200px]" title={service.baseUrl || ""}>
                                {service.baseUrl || "Not configured"}
                            </span>
                        </div>
                    </div>

                    {result.data && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                <span className="text-sm font-medium">Response Details</span>
                            </div>
                            <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-40">
                                {JSON.stringify(result.data, null, 2)}
                            </pre>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={() => onOpenChange(false)}>Close</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}