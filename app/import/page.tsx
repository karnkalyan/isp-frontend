"use client"

import React, { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Upload,
    CheckCircle2,
    AlertCircle,
    Building2,
    Package,
    FileSpreadsheet,
    FileCode,
    FileText,
    Download,
    Loader2,
    Sparkles,
    Copy,
    RefreshCw,
    Search,
    Wifi,
    Radio,
    Terminal,
    ArrowRight,
    Layers,
    Server
} from "lucide-react"
import { apiRequest, getApiUrl } from "@/lib/api"
import { toast } from "react-hot-toast"
import * as XLSX from "xlsx"

type LogItem = {
    rowNumber: number
    name: string
    status: "success" | "skipped" | "failed" | "warning"
    message: string
}

function ImportHubContent() {
    const searchParams = useSearchParams()
    const initialType = searchParams.get("type") === "packages" ? "packages" : "branches"

    const [activeTab, setActiveTab] = useState<"branches" | "packages">(initialType as any)
    const [inputMode, setInputMode] = useState<"file" | "paste">("file")
    const [fileName, setFileName] = useState("")
    const [rawText, setRawText] = useState("")
    const [parsedRows, setParsedRows] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState<LogItem[]>([])
    const [logFilter, setLogFilter] = useState<"all" | "success" | "skipped" | "failed">("all")
    const [logSearch, setLogSearch] = useState("")

    // Import Options
    const [skipExisting, setSkipExisting] = useState(false)
    const [syncRadius, setSyncRadius] = useState(true)

    useEffect(() => {
        const typeParam = searchParams.get("type")
        if (typeParam === "packages" || typeParam === "branches") {
            setActiveTab(typeParam)
            resetState()
        }
    }, [searchParams])

    const resetState = () => {
        setFileName("")
        setRawText("")
        setParsedRows([])
        setLogs([])
    }

    // Process and parse file (XLSX, XLS, CSV, JSON)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        const isJson = file.name.endsWith(".json")

        if (isJson) {
            const reader = new FileReader()
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target?.result as string)
                    const arrayData = Array.isArray(parsed) ? parsed : [parsed]
                    setParsedRows(arrayData)
                    toast.success(`Loaded ${arrayData.length} records from JSON file`)
                } catch (err: any) {
                    toast.error(`JSON parse error: ${err.message}`)
                }
            }
            reader.readAsText(file)
        } else {
            // Excel or CSV
            const reader = new FileReader()
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer)
                    const workbook = XLSX.read(data, { type: "array" })
                    const firstSheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[firstSheetName]
                    const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
                    setParsedRows(jsonRows)
                    toast.success(`Loaded ${jsonRows.length} rows from ${file.name}`)
                } catch (err: any) {
                    toast.error(`Failed to parse spreadsheet: ${err.message}`)
                }
            }
            reader.readAsArrayBuffer(file)
        }
    }

    // Process raw text paste (CSV / JSON)
    const handleParseRawText = () => {
        if (!rawText.trim()) {
            toast.error("Please paste CSV or JSON data first")
            return
        }

        try {
            if (rawText.trim().startsWith("[") || rawText.trim().startsWith("{")) {
                const parsed = JSON.parse(rawText.trim())
                const arrayData = Array.isArray(parsed) ? parsed : [parsed]
                setParsedRows(arrayData)
                toast.success(`Parsed ${arrayData.length} JSON records`)
            } else {
                // Parse CSV text via XLSX utility
                const workbook = XLSX.read(rawText.trim(), { type: "string" })
                const firstSheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[firstSheetName]
                const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
                setParsedRows(jsonRows)
                toast.success(`Parsed ${jsonRows.length} CSV rows`)
            }
        } catch (err: any) {
            toast.error(`Parse failed: ${err.message}`)
        }
    }

    // Download template from backend or generate locally
    const handleDownloadTemplate = async (format: "xlsx" | "csv" | "json") => {
        try {
            const url = `${getApiUrl()}/import/template/${activeTab}?format=${format}`
            window.open(url, "_blank")
        } catch (err: any) {
            toast.error("Failed to download template")
        }
    }

    // Execute Import API
    const handleExecuteImport = async () => {
        if (!parsedRows || parsedRows.length === 0) {
            toast.error("No data rows available to import. Please upload a file or paste data.")
            return
        }

        setLoading(true)
        setLogs([])

        try {
            const endpoint = activeTab === "branches" ? "/import/branches" : "/import/packages"
            const payload = {
                items: parsedRows,
                skipExisting,
                syncRadius
            }

            const response = await apiRequest<any>(endpoint, {
                method: "POST",
                body: JSON.stringify(payload)
            })

            if (response?.logs) {
                setLogs(response.logs)
            }

            const success = response?.successCount || 0
            const failed = response?.failedCount || 0
            const skipped = response?.skippedCount || 0

            if (failed === 0) {
                toast.success(`Import complete! ${success} imported successfully.`)
            } else {
                toast.error(`Import completed with warnings: ${success} succeeded, ${failed} failed.`)
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to process import")
        } finally {
            setLoading(false)
        }
    }

    // Filtered logs
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            if (logFilter !== "all" && log.status !== logFilter) return false
            if (logSearch.trim()) {
                const q = logSearch.toLowerCase()
                return (
                    log.name.toLowerCase().includes(q) ||
                    log.message.toLowerCase().includes(q) ||
                    String(log.rowNumber).includes(q)
                )
            }
            return true
        })
    }, [logs, logFilter, logSearch])

    const counts = useMemo(() => {
        return {
            total: logs.length,
            success: logs.filter((l) => l.status === "success").length,
            skipped: logs.filter((l) => l.status === "skipped").length,
            failed: logs.filter((l) => l.status === "failed").length
        }
    }, [logs])

    const copyLogsToClipboard = () => {
        const text = logs
            .map((l) => `[Row ${l.rowNumber}] [${l.status.toUpperCase()}] ${l.name}: ${l.message}`)
            .join("\n")
        navigator.clipboard.writeText(text)
        toast.success("Logs copied to clipboard")
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                <PageHeader
                    title="Data Import Hub"
                    description="Easily import Branches, Sub-Branches, Packages & Internet Plans with FreeRADIUS sync and live row-by-row logs"
                    icon={Upload}
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Import Hub", href: "/import" },
                    ]}
                />

                {/* Primary Section Tabs */}
                <Tabs value={activeTab} onValueChange={(val: any) => { setActiveTab(val); resetState(); }} className="w-full">
                    <TabsList className="grid grid-cols-2 max-w-md h-11 bg-muted/60 p-1">
                        <TabsTrigger value="branches" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
                            <Building2 className="h-4 w-4" />
                            Branches & Sub-Branches
                        </TabsTrigger>
                        <TabsTrigger value="packages" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
                            <Package className="h-4 w-4" />
                            Packages & Internet Plans
                        </TabsTrigger>
                    </TabsList>

                    {/* BRANCHES TAB CONTENT */}
                    <TabsContent value="branches" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Col: Upload & Config */}
                            <div className="lg:col-span-2 space-y-6">
                                <CardContainer
                                    title="Upload Branches & Sub-Branches"
                                    description="Supports parent branch hierarchy (e.g. Charikot > Bhimeshwor, ARROWNET Pvt. Ltd. > Arrownet Akar Complex)"
                                >
                                    <div className="space-y-5">
                                        {/* Input Mode Selector */}
                                        <div className="flex gap-2 border-b border-border pb-3">
                                            <Button
                                                type="button"
                                                variant={inputMode === "file" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("file")}
                                                className="gap-1.5"
                                            >
                                                <Upload className="h-4 w-4" />
                                                File Upload (.xlsx, .csv, .json)
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={inputMode === "paste" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("paste")}
                                                className="gap-1.5"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Paste Raw CSV / JSON
                                            </Button>
                                        </div>

                                        {inputMode === "file" ? (
                                            <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-8 text-center bg-muted/20">
                                                <input
                                                    type="file"
                                                    id="branch-file-input"
                                                    className="hidden"
                                                    accept=".xlsx,.xls,.csv,.json"
                                                    onChange={handleFileUpload}
                                                />
                                                <label htmlFor="branch-file-input" className="cursor-pointer flex flex-col items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <FileSpreadsheet className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground text-sm">
                                                            {fileName ? fileName : "Click to select or drag & drop Excel, CSV, or JSON file"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Supported formats: .xlsx, .xls, .csv, .json
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Paste CSV Lines or JSON Array</Label>
                                                <Textarea
                                                    placeholder="Branch Name,Sub-Branch Name,Phone Number,Email,Address&#10;Charikot,Bhimeshwor,9801191323,pashupati@arrownet.com.np,Charikot&#10;Charikot,Melung Arrownet,9801191323,melung@arrownet.com.np,Melung"
                                                    rows={6}
                                                    value={rawText}
                                                    onChange={(e) => setRawText(e.target.value)}
                                                    className="font-mono text-xs"
                                                />
                                                <Button size="sm" variant="outline" onClick={handleParseRawText}>
                                                    Parse Pasted Data
                                                </Button>
                                            </div>
                                        )}

                                        {/* Options */}
                                        <div className="bg-muted/40 p-4 rounded-lg flex items-center justify-between border border-border">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Skip Already Existing Branches</p>
                                                <p className="text-xs text-muted-foreground">If enabled, existing branches & sub-branches will not be updated</p>
                                            </div>
                                            <Switch checked={skipExisting} onCheckedChange={setSkipExisting} />
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex items-center justify-between pt-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {parsedRows.length > 0 ? `✅ ${parsedRows.length} rows ready for import` : "No rows loaded yet"}
                                            </p>
                                            <Button
                                                onClick={handleExecuteImport}
                                                disabled={loading || parsedRows.length === 0}
                                                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                                Start Branch Import
                                            </Button>
                                        </div>
                                    </div>
                                </CardContainer>
                            </div>

                            {/* Right Col: Sample Templates */}
                            <div className="space-y-6">
                                <CardContainer title="Download Sample Templates" description="Pre-filled with real hierarchical branch data">
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-emerald-500/30 hover:bg-emerald-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("xlsx")}
                                        >
                                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Excel Template (.xlsx)</div>
                                                <div className="text-[10px] text-muted-foreground">Formatted with sample branches</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-blue-500/30 hover:bg-blue-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("csv")}
                                        >
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">CSV Template (.csv)</div>
                                                <div className="text-[10px] text-muted-foreground">Standard comma-separated format</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-purple-500/30 hover:bg-purple-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("json")}
                                        >
                                            <FileCode className="h-5 w-5 text-purple-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">JSON Template (.json)</div>
                                                <div className="text-[10px] text-muted-foreground">Programmatic JSON payload</div>
                                            </div>
                                        </Button>
                                    </div>

                                    <div className="mt-5 p-3.5 bg-muted/40 rounded-lg border border-border text-xs space-y-2">
                                        <p className="font-semibold text-foreground">Hierarchy Tips:</p>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1 text-[11px]">
                                            <li>Leave <span className="font-mono text-foreground">Sub-Branch Name</span> blank to create an Organization / Head Branch.</li>
                                            <li>To group sub-branches under a parent, specify the same <span className="font-mono text-foreground">Branch Name</span> across rows.</li>
                                        </ul>
                                    </div>
                                </CardContainer>
                            </div>
                        </div>
                    </TabsContent>

                    {/* PACKAGES TAB CONTENT */}
                    <TabsContent value="packages" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Col: Upload & Config */}
                            <div className="lg:col-span-2 space-y-6">
                                <CardContainer
                                    title="Upload Packages & Tariff Rate Sheet"
                                    description="Auto-parses bandwidth (e.g. 100Mbps -> 100M/100M), duration prices (1M, 3M, 6M, 12M), and syncs to FreeRADIUS"
                                >
                                    <div className="space-y-5">
                                        {/* Input Mode Selector */}
                                        <div className="flex gap-2 border-b border-border pb-3">
                                            <Button
                                                type="button"
                                                variant={inputMode === "file" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("file")}
                                                className="gap-1.5"
                                            >
                                                <Upload className="h-4 w-4" />
                                                File Upload (.xlsx, .csv, .json)
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={inputMode === "paste" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("paste")}
                                                className="gap-1.5"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Paste Raw CSV / JSON
                                            </Button>
                                        </div>

                                        {inputMode === "file" ? (
                                            <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-8 text-center bg-muted/20">
                                                <input
                                                    type="file"
                                                    id="package-file-input"
                                                    className="hidden"
                                                    accept=".xlsx,.xls,.csv,.json"
                                                    onChange={handleFileUpload}
                                                />
                                                <label htmlFor="package-file-input" className="cursor-pointer flex flex-col items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                                                        <Package className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground text-sm">
                                                            {fileName ? fileName : "Click to select or drag & drop Tariff Rate Sheet"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Supports Rate Matrix with 1M, 3M, 6M, 12M columns or Flat Price rows
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Paste Tariff CSV or JSON Array</Label>
                                                <Textarea
                                                    placeholder="Package Name,Speed (Mbps),1M Internet,1M Support,1M Total,3M Internet,3M Support,3M Total,6M Internet,6M Support,6M Total,12M Internet,12M Support,12M Total&#10;100 Mbps,100,500,500,1186.50,1400,1400,3322.20,2700,2700,6407.10,5200,5200,12339.60&#10;50 Mbps,50,420,420,996.66,1200,1200,2847.60,2300,2300,5457.90,4400,4400,10441.20"
                                                    rows={6}
                                                    value={rawText}
                                                    onChange={(e) => setRawText(e.target.value)}
                                                    className="font-mono text-xs"
                                                />
                                                <Button size="sm" variant="outline" onClick={handleParseRawText}>
                                                    Parse Pasted Data
                                                </Button>
                                            </div>
                                        )}

                                        {/* RADIUS Sync Option */}
                                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">Sync to FreeRADIUS Database</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Creates group check (Auth-Type := Accept) & group reply (Mikrotik-Rate-Limit: 100M/100M)
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch checked={syncRadius} onCheckedChange={setSyncRadius} />
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex items-center justify-between pt-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {parsedRows.length > 0 ? `✅ ${parsedRows.length} plans ready for import` : "No plans loaded yet"}
                                            </p>
                                            <Button
                                                onClick={handleExecuteImport}
                                                disabled={loading || parsedRows.length === 0}
                                                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6"
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                                                Start Package & Radius Import
                                            </Button>
                                        </div>
                                    </div>
                                </CardContainer>
                            </div>

                            {/* Right Col: Sample Templates */}
                            <div className="space-y-6">
                                <CardContainer title="Download Tariff Templates" description="Pre-filled with rate sheet data (100Mbps, 50Mbps, 25Mbps, 15Mbps)">
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-emerald-500/30 hover:bg-emerald-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("xlsx")}
                                        >
                                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Tariff Excel Template (.xlsx)</div>
                                                <div className="text-[10px] text-muted-foreground">With 1M, 3M, 6M, 12M rate matrix</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-blue-500/30 hover:bg-blue-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("csv")}
                                        >
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Tariff CSV Template (.csv)</div>
                                                <div className="text-[10px] text-muted-foreground">Standard rate breakdown</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-purple-500/30 hover:bg-purple-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("json")}
                                        >
                                            <FileCode className="h-5 w-5 text-purple-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Tariff JSON Template (.json)</div>
                                                <div className="text-[10px] text-muted-foreground">Programmatic JSON payload</div>
                                            </div>
                                        </Button>
                                    </div>

                                    <div className="mt-5 p-3.5 bg-muted/40 rounded-lg border border-border text-xs space-y-2">
                                        <p className="font-semibold text-foreground">Speed & Radius Auto-Detection:</p>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1 text-[11px]">
                                            <li>If <span className="font-mono text-foreground">Speed</span> column is omitted, the speed is automatically parsed from <span className="font-mono text-foreground">Package Name</span> (e.g. `100 Mbps-A` → `100 Mbps`).</li>
                                            <li>FreeRADIUS <span className="font-mono text-foreground">Mikrotik-Rate-Limit</span> is automatically generated as `100M/100M`.</li>
                                            <li>Duration prices for 1M, 3M, 6M, 12M are automatically registered with accurate TSC (10%) and VAT (13%).</li>
                                        </ul>
                                    </div>
                                </CardContainer>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* DATA PREVIEW TABLE */}
                {parsedRows.length > 0 && (
                    <CardContainer
                        title={`Data Preview (${parsedRows.length} Rows)`}
                        description="Review loaded data before running the import"
                    >
                        <div className="overflow-x-auto max-h-64 overflow-y-auto border border-border rounded-lg">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-muted/80 sticky top-0 border-b border-border font-semibold text-foreground">
                                    <tr>
                                        <th className="p-2.5 w-12 text-center">#</th>
                                        {Object.keys(parsedRows[0] || {}).map((header) => (
                                            <th key={header} className="p-2.5 whitespace-nowrap">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {parsedRows.slice(0, 50).map((row, idx) => (
                                        <tr key={idx} className="hover:bg-muted/30">
                                            <td className="p-2 text-center text-muted-foreground font-mono">{idx + 1}</td>
                                            {Object.keys(parsedRows[0] || {}).map((header) => (
                                                <td key={header} className="p-2 truncate max-w-[200px] text-foreground">
                                                    {String(row[header] ?? "")}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {parsedRows.length > 50 && (
                            <p className="text-xs text-muted-foreground mt-2 text-right italic">
                                Showing preview of first 50 rows out of {parsedRows.length} total.
                            </p>
                        )}
                    </CardContainer>
                )}

                {/* ROW-BY-ROW LOGS TERMINAL CONSOLE */}
                {logs.length > 0 && (
                    <CardContainer
                        title="Import Execution Logs"
                        description="Detailed row-by-row confirmation of CMS and FreeRADIUS database insertions"
                    >
                        {/* Summary Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            <div className="bg-muted/40 p-3 rounded-lg border border-border text-center">
                                <span className="text-xs text-muted-foreground font-medium">Total Processed</span>
                                <p className="text-xl font-bold text-foreground">{counts.total}</p>
                            </div>
                            <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-center">
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Success</span>
                                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{counts.success}</p>
                            </div>
                            <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-center">
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Skipped / Exists</span>
                                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{counts.skipped}</p>
                            </div>
                            <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20 text-center">
                                <span className="text-xs text-destructive font-medium">Failed</span>
                                <p className="text-xl font-bold text-destructive">{counts.failed}</p>
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-3">
                            <div className="flex gap-1.5 bg-muted/60 p-1 rounded-lg">
                                <Button
                                    variant={logFilter === "all" ? "default" : "ghost"}
                                    size="sm"
                                    className="h-7 text-xs px-2.5"
                                    onClick={() => setLogFilter("all")}
                                >
                                    All ({counts.total})
                                </Button>
                                <Button
                                    variant={logFilter === "success" ? "default" : "ghost"}
                                    size="sm"
                                    className="h-7 text-xs px-2.5 text-emerald-600"
                                    onClick={() => setLogFilter("success")}
                                >
                                    Success ({counts.success})
                                </Button>
                                <Button
                                    variant={logFilter === "skipped" ? "default" : "ghost"}
                                    size="sm"
                                    className="h-7 text-xs px-2.5 text-amber-600"
                                    onClick={() => setLogFilter("skipped")}
                                >
                                    Skipped ({counts.skipped})
                                </Button>
                                <Button
                                    variant={logFilter === "failed" ? "default" : "ghost"}
                                    size="sm"
                                    className="h-7 text-xs px-2.5 text-destructive"
                                    onClick={() => setLogFilter("failed")}
                                >
                                    Errors ({counts.failed})
                                </Button>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Filter logs..."
                                        value={logSearch}
                                        onChange={(e) => setLogSearch(e.target.value)}
                                        className="h-8 pl-8 text-xs bg-background"
                                    />
                                </div>
                                <Button variant="outline" size="sm" onClick={copyLogsToClipboard} className="h-8 gap-1.5 text-xs">
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy
                                </Button>
                            </div>
                        </div>

                        {/* Logs Console Box */}
                        <div className="bg-slate-950 text-slate-100 font-mono rounded-lg p-4 max-h-96 overflow-y-auto divide-y divide-slate-800 text-xs border border-slate-800 shadow-inner">
                            {filteredLogs.length === 0 ? (
                                <p className="text-slate-500 italic py-4 text-center">No logs match the current filter.</p>
                            ) : (
                                filteredLogs.map((log) => {
                                    const isSuccess = log.status === "success"
                                    const isSkipped = log.status === "skipped"
                                    const isFailed = log.status === "failed"

                                    return (
                                        <div key={log.rowNumber} className="py-2.5 flex items-start gap-3">
                                            <span className="text-slate-500 shrink-0 font-bold">#{log.rowNumber}</span>
                                            <span
                                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                                                    isSuccess
                                                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                                        : isSkipped
                                                        ? "bg-amber-950 text-amber-400 border border-amber-800"
                                                        : "bg-rose-950 text-rose-400 border border-rose-800"
                                                }`}
                                            >
                                                {log.status}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-semibold text-slate-200 mr-2">{log.name}:</span>
                                                <span className="text-slate-400">{log.message}</span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContainer>
                )}
            </div>
        </DashboardLayout>
    )
}

export default function ImportHubPage() {
    return (
        <Suspense fallback={
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading Import Hub...</p>
                </div>
            </DashboardLayout>
        }>
            <ImportHubContent />
        </Suspense>
    )
}
