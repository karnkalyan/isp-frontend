"use client"

import React, { useState } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    Calendar, 
    Plus, 
    Trash2, 
    Clock, 
    Pause, 
    Play, 
    History,
    AlertCircle,
    CheckCircle2,
    CalendarDays
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface BillingProps {
    customer: any
    refreshCustomer: () => void | Promise<void>
    controlsOnly?: boolean
}

export function CustomerBillingManagement({ customer, refreshCustomer, controlsOnly = false }: BillingProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [showExtendDialog, setShowExtendDialog] = useState(false)
    const [extendDays, setExtendDays] = useState("3")
    const [extendToDate, setExtendToDate] = useState("")
    const [extendType, setExtendType] = useState<"grace" | "compensation" | "admin_extension">("grace")
    const [configuredGraceDays, setConfiguredGraceDays] = useState(3)

    const latestSub = customer.customerSubscriptions?.[0]

    const isGlobalAdmin = React.useMemo(() => {
        if (!user) return false
        const roleStr = typeof user.role === 'string' ? user.role : (user.role?.name || '')
        const roleName = roleStr.toLowerCase()
        return ['administrator', 'admin', 'isp_admin', 'super_admin', 'super admin', 'global admin', 'global_admin'].includes(roleName)
    }, [user])

    React.useEffect(() => {
        if (latestSub?.isTrial) {
            setExtendType("compensation")
        } else {
            setExtendType("grace")
        }
    }, [latestSub])

    React.useEffect(() => {
        apiRequest<Record<string, string>>("/settings")
            .then(settings => setConfiguredGraceDays(Math.max(1, Number(settings?.maxStaffGraceDays || 3))))
            .catch(() => setConfiguredGraceDays(3))
    }, [])

    const openExtendDialog = (type: "grace" | "compensation" | "admin_extension") => {
        setExtendType(type)
        setExtendDays(type === "grace" ? String(configuredGraceDays) : "3")
        setExtendToDate("")
        setShowExtendDialog(true)
    }

    const handleExtend = async () => {
        setLoading(true)
        try {
            await apiRequest("/billing/extend", {
                method: "POST",
                body: JSON.stringify({
                    customerId: customer.id,
                    days: extendType === "grace" ? configuredGraceDays : extendDays,
                    extendToDate: extendType === "grace" ? undefined : (extendToDate || undefined),
                    type: extendType
                })
            })
            toast({ title: "Success", description: "Subscription extended successfully" })
            setShowExtendDialog(false)
            await refreshCustomer()
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handlePauseToggle = async () => {
        setLoading(true)
        try {
            const action = latestSub?.isPaused ? 'play' : 'pause'
            await apiRequest("/billing/pause-play", {
                method: "POST",
                body: JSON.stringify({
                    customerId: customer.id,
                    action
                })
            })
            toast({ title: "Success", description: `Subscription ${action === 'play' ? 'resumed' : 'paused'} successfully` })
            await refreshCustomer()
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    if (!latestSub) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900">
                <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium">No Active Subscription</h3>
                <p className="text-muted-foreground">This customer doesn't have an active subscription yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className={`grid grid-cols-1 ${controlsOnly ? '' : 'md:grid-cols-3'} gap-6`}>
                {/* Current Status Card */}
                <CardContainer title="Subscription Controls" className="md:col-span-2">
                    <div className="flex items-center justify-between p-4 mb-6 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${latestSub.isPaused ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {latestSub.isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Current State</div>
                                <div className="text-xl font-bold flex items-center gap-2">
                                    {latestSub.isPaused ? "Paused" : "Active"}
                                    <Badge variant={latestSub.isPaused ? "warning" : "success"}>
                                        {latestSub.isTrial ? "TRIAL" : "PREPAID"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <Button 
                            variant={latestSub.isPaused ? "default" : "outline"}
                            size="lg"
                            className="gap-2 font-semibold shadow-sm"
                            onClick={handlePauseToggle}
                            disabled={loading}
                        >
                            {latestSub.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                            {latestSub.isPaused ? "Resume Service" : "Pause Service"}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 h-full">
                        <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Extend Subscription</DialogTitle>
                                    <DialogDescription>
                                        Manually extend the customer's plan end date.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Extension Type</Label>
                                        <Select value={extendType} onValueChange={(value) => setExtendType(value as typeof extendType)} disabled={extendType === "grace" || !isGlobalAdmin}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {extendType === "grace" ? <SelectItem value="grace">Grace Period (Fixed)</SelectItem> : <><SelectItem value="compensation">Compensation (Non-deductible)</SelectItem>{isGlobalAdmin && <SelectItem value="admin_extension">Admin Extension (Deductible)</SelectItem>}</>}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            {latestSub?.isTrial
                                                ? "Days will be added to the trial package duration."
                                                : extendType === 'grace' 
                                                    ? "Days will be deducted automatically from the next renewal payment."
                                                    : extendType === 'admin_extension'
                                                        ? "Admin extension is deducted from the next renewal."
                                                        : "Compensation is added to the current expiry without any future deduction."}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Days to Add</Label>
                                            <Input 
                                                type="number" 
                                                value={extendDays} 
                                                onChange={(e) => setExtendDays(e.target.value)}
                                                placeholder="e.g. 3"
                                                readOnly={extendType === "grace"}
                                            />
                                            {extendType === "grace" && <p className="text-xs text-muted-foreground">Fixed by System Setup.</p>}
                                        </div>
                                        {extendType !== "grace" && <div className="space-y-2">
                                            <Label>Or Pick Specific Date</Label>
                                            <Input 
                                                type="date" 
                                                value={extendToDate} 
                                                onChange={(e) => setExtendToDate(e.target.value)}
                                            />
                                        </div>}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowExtendDialog(false)}>Cancel</Button>
                                    <Button onClick={handleExtend} disabled={loading}>Confirm Extension</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        {new Date(latestSub.planEnd) <= new Date() && Number(latestSub.graceDaysBalance || 0) === 0 && <Button variant="outline" className="h-20 flex-col gap-2 border-dashed" onClick={() => openExtendDialog("grace")}><Clock className="h-5 w-5 text-amber-500" />Grace Period</Button>}
                        <Button variant="outline" className="h-20 flex-col gap-2 border-dashed" onClick={() => openExtendDialog("compensation")}><CalendarDays className="h-5 w-5 text-emerald-500" />Extend Subscription</Button>
                    </div>
                </CardContainer>

                {/* Quick Stats Card */}
                {!controlsOnly && <div className="space-y-6">
                    <CardContainer title="Plan Details">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Start Date</span>
                                <span className="text-sm font-medium">{new Date(latestSub.planStart).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Expiry Date</span>
                                <span className="text-sm font-bold text-rose-500">{new Date(latestSub.planEnd).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between border-t pt-4">
                                <span className="text-sm text-muted-foreground">Extensions</span>
                                <Badge variant="secondary">{latestSub.extensionCount || 0} times</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Compensation</span>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">{latestSub.compensationDays || 0} Days</Badge>
                            </div>
                        </div>
                    </CardContainer>
                </div>}
            </div>

            {/* Invoices & Adjustments Section */}
            {!controlsOnly && <CardContainer title="Order Adjustments & History">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">Manage custom charges and discounts for recent orders.</p>
                </div>

                <div className="space-y-4">
                    {customer.orders?.slice(0, 3).map((order: any) => (
                        <div key={order.id} className="p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">Invoice #{order.invoiceId || order.id}</span>
                                        <Badge variant={order.isPaid ? "success" : "warning"}>
                                            {order.isPaid ? "Paid" : "Pending"}
                                        </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{new Date(order.orderDate).toLocaleDateString()}</span>
                                </div>
                                <div className="text-xl font-black">
                                    Total: {new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(order.totalAmount)}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                                    <div className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                        <History className="h-3 w-3" /> Itemized List
                                    </div>
                                    <div className="space-y-1">
                                        {order.items?.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between text-sm group">
                                                <span>{item.itemName}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{new Intl.NumberFormat('en-NP').format(item.itemPrice)}</span>
                                                    {(item.itemName.includes("Adjustment") || item.itemName.includes("Manual")) && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-6 w-6 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={async () => {
                                                                if(confirm("Delete this adjustment?")) {
                                                                    try {
                                                                        await apiRequest("/billing/adjustments/remove", { method: "POST", body: JSON.stringify({ detailId: item.id }) })
                                                                        refreshCustomer()
                                                                    } catch(e:any) { toast({title: "Error", description: e.message, variant: "destructive"}) }
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center gap-3">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <Plus className="h-4 w-4" /> Add Adjustment
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add Manual Adjustment</DialogTitle>
                                                <DialogDescription>Apply a custom charge or discount to this order.</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Item Description</Label>
                                                    <Input id="adjItemName" placeholder="e.g. Technical Visit Charge" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Amount (NPR)</Label>
                                                    <Input id="adjItemPrice" type="number" placeholder="e.g. 500" />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={async () => {
                                                    const name = (document.getElementById('adjItemName') as HTMLInputElement).value
                                                    const price = (document.getElementById('adjItemPrice') as HTMLInputElement).value
                                                    if(!name || !price) return
                                                    try {
                                                        await apiRequest("/billing/adjustments/add", {
                                                            method: "POST",
                                                            body: JSON.stringify({
                                                                orderId: order.id,
                                                                itemName: name,
                                                                itemPrice: price
                                                            })
                                                        })
                                                        toast({ title: "Success", description: "Adjustment added" })
                                                        refreshCustomer()
                                                    } catch(e:any) { toast({title: "Error", description: e.message, variant: "destructive"})}
                                                }}>Add to Order</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContainer>}
        </div>
    )
}
