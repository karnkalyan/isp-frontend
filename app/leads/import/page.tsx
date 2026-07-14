"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useState } from "react"
import {
    Upload,
    Download,
    FileUp,
    AlertCircle,
    CheckCircle,
    XCircle
} from "lucide-react"

export default function ImportLeadsPage() {
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importProgress, setImportProgress] = useState(0)
    const [isImporting, setIsImporting] = useState(false)
    const [importResult, setImportResult] = useState<any>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                setImportFile(file)
                setImportResult(null)
            } else {
                toast.error("Please upload a CSV file")
            }
        }
    }

    const downloadCSVTemplate = async () => {
        try {
            const response = await apiRequest("/lead/template", {
                method: 'GET',
                responseType: 'blob'
            })

            if (response instanceof Blob) {
                const url = window.URL.createObjectURL(response)
                const a = document.createElement('a')
                a.href = url
                a.download = 'leads_import_template.csv'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)
            } else {
                const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'leads_import_template.csv'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)
            }
        } catch (error: any) {
            console.error("Download template error:", error)
            toast.error("Failed to download template")
        }
    }

    const handleBulkImport = async () => {
        if (!importFile) {
            toast.error("Please select a CSV file to import")
            return
        }

        try {
            setIsImporting(true)
            setImportProgress(0)
            setImportResult(null)

            const formData = new FormData()
            formData.append('file', importFile)

            // Simulate progress
            const interval = setInterval(() => {
                setImportProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval)
                        return prev
                    }
                    return prev + 10
                })
            }, 300)

            const response = await apiRequest("/lead/import", {
                method: 'POST',
                body: formData
            })

            clearInterval(interval)
            setImportProgress(100)
            setImportResult(response)

            toast.success(`Successfully imported ${response.importedCount || 0} leads`)

            setTimeout(() => {
                setImportProgress(0)
                setImportFile(null)
            }, 1000)
        } catch (error: any) {
            console.error("Import error:", error)
            toast.error(error.message || "Failed to import leads")
            setImportResult({ error: error.message })
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Bulk Import Leads"
                    description="Import multiple leads from a CSV file"
                    showBackButton
                />

                <CardContainer title="Import Leads" description="Upload a CSV file to import multiple leads at once">
                    <div className="space-y-6">
                        {/* File Upload Section */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />

                            {importFile ? (
                                <div className="space-y-4">
                                    <div>
                                        <FileUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
                                        <p className="font-medium text-green-600">{importFile.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {(importFile.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>

                                    {importProgress > 0 && (
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                                                style={{ width: `${importProgress}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <p className="text-gray-600 mb-4">
                                        Drag and drop your CSV file here, or click to browse
                                    </p>
                                    <input
                                        type="file"
                                        id="csv-upload"
                                        accept=".csv"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <div className="space-x-4">
                                        <Button
                                            variant="default"
                                            onClick={() => document.getElementById('csv-upload')?.click()}
                                        >
                                            Browse Files
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={downloadCSVTemplate}
                                            className="flex items-center gap-2 mx-auto mt-2"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download Template
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Import Results */}
                        {importResult && (
                            <div className={`p-4 rounded-lg ${importResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                                <div className="flex items-start gap-3">
                                    {importResult.error ? (
                                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                    ) : (
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                    )}
                                    <div>
                                        <h4 className="font-medium">
                                            {importResult.error ? 'Import Failed' : 'Import Successful'}
                                        </h4>
                                        <p className="text-sm mt-1">
                                            {importResult.error ? importResult.error : `Successfully imported ${importResult.importedCount || 0} leads`}
                                        </p>
                                        {importResult.errors && importResult.errors.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-sm font-medium">Errors:</p>
                                                <ul className="text-sm text-red-600 list-disc pl-5">
                                                    {importResult.errors.map((error: string, index: number) => (
                                                        <li key={index}>{error}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CSV Format Requirements */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-blue-800 mb-2">CSV Format Requirements:</h4>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                        <li>• File must be in CSV format with UTF-8 encoding</li>
                                        <li>• First row should contain column headers</li>
                                        <li>• Required columns: firstName, lastName, phoneNumber</li>
                                        <li>• Optional columns: email, source, address, district, etc.</li>
                                        <li>• Maximum file size: 10MB</li>
                                        <li>• Maximum 1000 records per import</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => window.history.back()}
                                disabled={isImporting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleBulkImport}
                                disabled={!importFile || isImporting}
                                className="flex items-center gap-2"
                            >
                                {isImporting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        Importing... {importProgress}%
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        Import Leads
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContainer>
            </div>
        </DashboardLayout>
    )
}