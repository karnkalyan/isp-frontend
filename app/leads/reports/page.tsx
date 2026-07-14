"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import {
    Download,
    Filter,
    RefreshCw,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    CheckCircle,
    XCircle,
    Calendar,
    User,
    AlertCircle,
    Phone,
    Mail
} from "lucide-react"

export default function LeadReportsPage() {
    const [reportData, setReportData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [dateRange, setDateRange] = useState({
        start: "",
        end: ""
    })
    const [userFilter, setUserFilter] = useState("all")

    const fetchReport = async () => {
        try {
            setLoading(true)

            const params = new URLSearchParams()
            if (dateRange.start) params.append('startDate', dateRange.start)
            if (dateRange.end) params.append('endDate', dateRange.end)
            if (userFilter !== 'all') params.append('userId', userFilter)

            const response = await apiRequest(`/lead/reports/data?${params.toString()}`)

            if (response.success) {
                setReportData(response.data)
            } else {
                toast.error(response.message || "Failed to load report")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load report")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Load default report (last 30 days)
        const endDate = new Date().toISOString().split('T')[0]
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        const startDateStr = startDate.toISOString().split('T')[0]

        setDateRange({
            start: startDateStr,
            end: endDate
        })
    }, [])

    useEffect(() => {
        if (dateRange.start) {
            fetchReport()
        }
    }, [dateRange.start, dateRange.end, userFilter])

    const handleExport = async () => {
        try {
            setLoading(true); // Re-use loading state
            const params = new URLSearchParams();
            if (dateRange.start) params.append('startDate', dateRange.start);
            if (dateRange.end) params.append('endDate', dateRange.end);
            if (userFilter !== 'all') params.append('userId', userFilter);

            const response = await apiRequest(`/lead/reports/export?${params.toString()}`, {
                responseType: 'blob'
            })

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lead_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Report exported successfully");
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to export report");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatPercentage = (value: number) => {
        return `${value}%`
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Lead Reports"
                    description="Analyze lead performance and conversion metrics"
                    showBackButton
                />

                <CardContainer title="Report Filters" description="Filter lead data by date range and assignee">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Assigned To</Label>
                            <Select value={userFilter} onValueChange={setUserFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Users" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    <SelectItem value="specific">Specific User</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={fetchReport} disabled={loading} className="flex items-center gap-2">
                            {loading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Filter className="h-4 w-4" />
                            )}
                            {loading ? "Generating..." : "Refresh Report"}
                        </Button>

                        <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </CardContainer>

                {loading ? (
                    <div className="text-center py-8">Loading report...</div>
                ) : reportData ? (
                    <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Leads</p>
                                        <p className="text-2xl font-bold">{reportData.totalLeads?.toLocaleString() || 0}</p>
                                    </div>
                                    <Users className="h-8 w-8 text-blue-500" />
                                </div>
                            </div>

                            <div className="bg-white border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Qualified Leads</p>
                                        <p className="text-2xl font-bold">{reportData.qualifiedLeads?.toLocaleString() || 0}</p>
                                        <p className="text-sm text-green-600">
                                            {formatPercentage(reportData.qualifiedPercentage || 0)}
                                        </p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-green-500" />
                                </div>
                            </div>

                            <div className="bg-white border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Unqualified Leads</p>
                                        <p className="text-2xl font-bold">{reportData.unqualifiedLeads?.toLocaleString() || 0}</p>
                                        <p className="text-sm text-red-600">
                                            {formatPercentage(reportData.unqualifiedPercentage || 0)}
                                        </p>
                                    </div>
                                    <TrendingDown className="h-8 w-8 text-red-500" />
                                </div>
                            </div>

                            <div className="bg-white border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Conversion Rate</p>
                                        <p className="text-2xl font-bold">{reportData.conversionRate || 0}%</p>
                                    </div>
                                    <BarChart3 className="h-8 w-8 text-purple-500" />
                                </div>
                            </div>
                        </div>

                        {/* Detailed Report */}
                        <CardContainer title="Detailed Analysis" description="Breakdown of lead statistics">
                            <div className="space-y-6">
                                {/* Status Distribution */}
                                <div>
                                    <h4 className="font-medium mb-3">Lead Status Distribution</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">New</span>
                                                <span className="text-lg font-bold">{reportData.statusCounts?.new || 0}</span>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Contacted</span>
                                                <span className="text-lg font-bold">{reportData.statusCounts?.contacted || 0}</span>
                                            </div>
                                        </div>

                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Qualified</span>
                                                <span className="text-lg font-bold">{reportData.statusCounts?.qualified || 0}</span>
                                            </div>
                                        </div>

                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Unqualified</span>
                                                <span className="text-lg font-bold">{reportData.statusCounts?.unqualified || 0}</span>
                                            </div>
                                        </div>

                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Converted</span>
                                                <span className="text-lg font-bold">{reportData.statusCounts?.converted || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Source Distribution */}
                                {reportData.sourceDistribution && Object.keys(reportData.sourceDistribution).length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-3">Lead Source Distribution</h4>
                                        <div className="space-y-2">
                                            {Object.entries(reportData.sourceDistribution).map(([source, count]) => (
                                                <div key={source} className="flex items-center justify-between">
                                                    <span className="text-sm capitalize">{source.replace('_', ' ')}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{
                                                                    width: `${(Number(count) / reportData.totalLeads) * 100}%`
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium">{count}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Leads */}
                                {reportData.leads && reportData.leads.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-3">Recent Leads ({reportData.leads.length})</h4>
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                                                        <th className="px-4 py-2 text-left text-sm font-medium">Contact</th>
                                                        <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                                                        <th className="px-4 py-2 text-left text-sm font-medium">Created</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {reportData.leads.map((lead: any) => (
                                                        <tr key={lead.id}>
                                                            <td className="px-4 py-2 text-sm">
                                                                {lead.firstName} {lead.lastName}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm space-y-1">
                                                                {lead.email && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Mail className="h-3 w-3" />
                                                                        <span>{lead.email}</span>
                                                                    </div>
                                                                )}
                                                                {lead.phoneNumber && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Phone className="h-3 w-3" />
                                                                        <span>{lead.phoneNumber}</span>
                                                                    </div>
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-2">
                                                                <span className={`px-2 py-1 rounded text-xs ${lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                                                                    lead.status === 'unqualified' ? 'bg-red-100 text-red-800' :
                                                                        lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                                                            'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                    {lead.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-sm">
                                                                {formatDate(lead.createdAt)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Timeline */}
                                <div>
                                    <h4 className="font-medium mb-3">Report Period</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm">Date Range</span>
                                            </div>
                                            <span className="text-sm">
                                                {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
                                            </span>
                                        </div>

                                        {reportData.dailyActivity && (
                                            <div className="text-sm text-gray-600">
                                                Average leads per day: {reportData.averageLeadsPerDay || 0}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContainer>
                    </>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No report data available. Try adjusting your filters.
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}