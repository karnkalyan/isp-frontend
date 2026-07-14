"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
    Upload, 
    CheckCircle2, 
    AlertCircle, 
    ChevronLeft, 
    Package,
    Loader2,
    FileDown,
    FileSpreadsheet
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function InventoryImportPage() {
    const router = useRouter()
    const [data, setData] = useState("")
    const [fileName, setFileName] = useState("")
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<any>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setData(content);
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const template = "serialNumber,name,type,model,macAddress\nSN-X1002,Arrow ONT v2,ONT,GP-123,AA:BB:CC:DD:EE:FF\nSN-X1003,Arrow ONT v2,ONT,GP-123,11:22:33:44:55:66";
        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory_import_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleImport = async () => {
        if (!data.trim()) {
            toast({ title: "Error", description: "Please provide data to import", variant: "destructive" })
            return
        }

        setLoading(true)
        try {
            // Attempt to parse JSON or split CSV lines
            let items = []
            if (data.trim().startsWith('[')) {
                items = JSON.parse(data)
            } else {
                // Basic CSV parsing
                const lines = data.trim().split('\n')
                const headers = lines[0].toLowerCase().split(',').map(s => s.trim())
                // Skip header line if it looks like headers
                const startIdx = (headers.includes('serialnumber') || headers.includes('serial number') || headers.includes('serial')) ? 1 : 0;
                
                items = lines.slice(startIdx).map(line => {
                    const parts = line.split(',').map(s => s?.trim())
                    return { 
                        serialNumber: parts[0], 
                        name: parts[1] || 'Imported Device', 
                        type: parts[2] || 'ONT',
                        model: parts[3] || '',
                        macAddress: parts[4] || ''
                    }
                }).filter(item => item.serialNumber)
            }

            const response = await apiRequest("/inventory/bulk-import", {
                method: "POST",
                body: JSON.stringify({ items }),
            })
            setResults(response)
            toast({ 
                title: "Import Complete", 
                description: `Successfully imported ${response.successCount} items. ${response.failedCount} failures.` 
            })
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to parse or import data: " + error.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader 
                    title="Bulk Inventory Import" 
                    description="Upload or paste multiple devices to add them to stock."
                    actions={[
                        { label: "Back to Inventory", href: "/inventory", variant: "outline" }
                    ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CardContainer title="Import Data">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Upload File (CSV, TXT)</Label>
                                <div className="text-[10px] text-muted-foreground bg-slate-50 dark:bg-slate-800 p-2 rounded border border-dashed mb-2 flex justify-between items-center">
                                    <span>
                                        Format: serialNumber, itemName, itemType, model, macAddress <br/>
                                        Example: SN-X1002, Arrow ONT v2, ONT, GP-123, AA:BB:CC:DD:EE:FF
                                    </span>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={downloadTemplate}>
                                        <FileDown className="h-3 w-3" /> Template
                                    </Button>
                                </div>
                                <div className="border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer relative">
                                    <input 
                                        type="file" 
                                        accept=".csv,.txt" 
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <FileSpreadsheet className="h-10 w-10 text-slate-400 mb-3" />
                                    <p className="font-medium">Click or drag file to upload</p>
                                    <p className="text-xs text-muted-foreground mt-1">Supports .csv and .txt files</p>
                                    {fileName && (
                                        <div className="mt-4 p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-semibold w-full">
                                            Loaded: {fileName}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button className="w-full gap-2" onClick={handleImport} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                Process Import
                            </Button>
                        </div>
                    </CardContainer>

                    {results && (
                        <CardContainer title="Import Results">
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                                        <div className="text-sm font-bold uppercase mb-1">Success</div>
                                        <div className="text-3xl font-black">{results.successCount}</div>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400">
                                        <div className="text-sm font-bold uppercase mb-1">Failed</div>
                                        <div className="text-3xl font-black">{results.failedCount}</div>
                                    </div>
                                </div>

                                {results.errors?.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-rose-500 uppercase flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" /> Error Details
                                        </h4>
                                        <div className="max-h-[200px] overflow-y-auto rounded-lg border bg-slate-50 dark:bg-slate-900 p-2 space-y-1">
                                            {results.errors.map((err: any, idx: number) => (
                                                <div key={idx} className="text-[10px] border-b pb-1 last:border-0">
                                                    <span className="font-bold text-slate-500">{err.serialNumber || 'Unknown'}:</span> {err.error}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Button variant="outline" className="w-full" onClick={() => router.push("/inventory")}>
                                    Finish & View Stock
                                </Button>
                            </div>
                        </CardContainer>
                    )}

                    {!results && (
                        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900">
                            <Package className="h-16 w-16 text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium">Ready for Import</h3>
                            <p className="text-sm text-muted-foreground">The results will appear here after you click "Process Import"</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
