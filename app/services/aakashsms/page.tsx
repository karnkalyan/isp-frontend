"use client"

import React, { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiRequest } from "@/lib/api"
import { 
  MessageSquare, 
  RefreshCw, 
  Send, 
  Coins,
  ShieldCheck,
  Eye,
  Loader2
} from "lucide-react"
import { toast } from "react-hot-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function AakashSmsServicePage() {
  const [creditLoading, setCreditLoading] = useState(false)
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [credit, setCredit] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  const [campaignLogs, setCampaignLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const fetchCredit = async () => {
    setCreditLoading(true)
    try {
      const res = await apiRequest<any>("/service/sms/credit?provider=AAKASHSMS")
      const creditData = res?.data || res
      setCredit(creditData)
    } catch (err: any) {
      console.error("Failed to fetch SMS credit:", err)
      toast.error(err.message || "Failed to load SMS credits")
    } finally {
      setCreditLoading(false)
    }
  }

  const fetchCampaigns = async () => {
    setCampaignsLoading(true)
    try {
      const res = await apiRequest<any>("/service/sms/campaigns?limit=20")
      setCampaigns(res?.data || res || [])
    } catch (err) {
      console.error("Failed to fetch SMS campaigns:", err)
    } finally {
      setCampaignsLoading(false)
    }
  }

  const fetchCampaignLogs = async (campaignId: number) => {
    setLogsLoading(true)
    try {
      const res = await apiRequest<any>(`/service/sms/campaigns/${campaignId}/logs?limit=100`)
      setCampaignLogs(res?.data || res || [])
    } catch (err) {
      console.error("Failed to fetch SMS campaign logs:", err)
      toast.error("Failed to load campaign logs")
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    fetchCredit()
    fetchCampaigns()
  }, [])

  const handleCampaignClick = (campaign: any) => {
    setSelectedCampaign(campaign)
    fetchCampaignLogs(campaign.id)
  }

  const totalSentMessages = campaigns.reduce((acc, c) => acc + (Number(c.sentCount) || 0), 0)
  const lastCampaign = campaigns.length > 0 ? campaigns[0] : null
  const lastSentDate = lastCampaign ? new Date(lastCampaign.createdAt).toLocaleDateString() : "No campaigns yet"

  const creditDisplay = typeof credit === 'object' 
    ? (credit?.credit !== undefined ? credit.credit : JSON.stringify(credit))
    : (credit !== null && credit !== undefined ? credit : "Not Configured")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Aakash SMS Setup"
          description="Configure Aakash SMS, check provider credit, and review SMS feature delivery logs"
          icon={MessageSquare}
          actions={[
            { label: "Configure Service", href: "/services", variant: "outline" },
          ]}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card shadow-depth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">Available Credit</CardTitle>
              <Coins className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mt-1">
                {creditLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <div className="text-3xl font-bold tracking-tight text-foreground">
                    {creditDisplay}
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={fetchCredit} 
                  disabled={creditLoading}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={`h-4 w-4 ${creditLoading ? "animate-spin" : ""}`} />
                  <span className="sr-only">Refresh credit</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">SMS credits remaining on provider</p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-depth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">Total Campaigns Sent</CardTitle>
              <Send className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground mt-1">
                {totalSentMessages}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Total messages delivered to date</p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-depth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">Service Status</CardTitle>
              <ShieldCheck className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20 px-2.5 py-0.5 text-sm font-medium">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Last campaign run: {lastSentDate}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card shadow-depth">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>SMS Campaign History</CardTitle>
              <CardDescription>Recent campaign delivery reports and message logs</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchCampaigns} disabled={campaignsLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${campaignsLoading ? "animate-spin" : ""}`} />
              Refresh list
            </Button>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic">
                No SMS campaigns found in transaction logs.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign ID</TableHead>
                      <TableHead>Message Body</TableHead>
                      <TableHead className="text-center">Sent</TableHead>
                      <TableHead className="text-center">Failed</TableHead>
                      <TableHead className="text-center">Queued</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id} className="hover:bg-muted/30">
                        <TableCell className="font-semibold text-foreground">#{campaign.id}</TableCell>
                        <TableCell className="max-w-xs truncate text-foreground/80">{campaign.message}</TableCell>
                        <TableCell className="text-center font-medium text-green-500">{campaign.sentCount || 0}</TableCell>
                        <TableCell className="text-center font-medium text-destructive">{campaign.failedCount || 0}</TableCell>
                        <TableCell className="text-center font-medium text-amber-500">{campaign.queuedCount || 0}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              campaign.status === "completed" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                              campaign.status === "processing" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              campaign.status === "failed" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                              "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }
                          >
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(campaign.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleCampaignClick(campaign)} className="h-8 w-8">
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            <span className="sr-only">View Logs</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Campaign #{selectedCampaign?.id} Log details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 my-2">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-semibold text-foreground mb-1">Message Template:</p>
                <p className="text-sm text-foreground/80 italic whitespace-pre-wrap">{selectedCampaign?.message}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground">Delivery Records</h4>
                {logsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : campaignLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4 bg-muted/20 rounded-lg">
                    No recipient records found for this campaign.
                  </p>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Phone Number</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Error Details</TableHead>
                          <TableHead className="text-right">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignLogs.map((log) => (
                          <TableRow key={log.id} className="hover:bg-muted/10">
                            <TableCell className="font-medium text-foreground text-sm">{log.recipientName || "Subscriber"}</TableCell>
                            <TableCell className="text-foreground/80 text-sm">{log.phoneNumber}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={
                                  log.status === "sent" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                  log.status === "failed" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                  "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                }
                              >
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                              {log.errorMessage || "-"}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-xs">
                              {new Date(log.updatedAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
