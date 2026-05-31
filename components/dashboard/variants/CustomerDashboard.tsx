"use client"

import React, { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { CardContainer } from "@/components/ui/card-container"
import { useAuth } from "@/contexts/AuthContext"
import { apiRequest } from "@/lib/api"
import { 
    Ticket, CreditCard, Activity, Package, Wifi, 
    Settings, Info, History, AlertCircle, CheckCircle2,
    Clock, Smartphone, Laptop, Tv, Signal, Plus, Send,
    Download, Upload, Zap, Shield, HelpCircle, User,
    MapPin, Calendar, ArrowUpRight, ArrowDownRight,
    RefreshCcw, Power, Network, Globe, MousePointer2, Server
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

interface CustomerProfile {
    id: number;
    customerUniqueId: string;
    status: string;
    lead: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        address: string;
        email: string;
    };
    isp: {
        companyName: string;
    };
    subscribedPkg?: {
        price: number;
        packageDuration: string;
        packagePlanDetails: {
            planName: string;
            downSpeed: number;
            upSpeed?: number;
        };
    };
    connectionUsers: Array<{
        username: string;
        isActive: boolean;
    }>;
    tickets: Array<any>;
    tasks: Array<any>;
    branch?: {
        name: string;
        id: number;
    };
}

export function CustomerDashboard() {
    const { user } = useAuth()
    const [profile, setProfile] = useState<CustomerProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("overview")

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiRequest<{ success: boolean, data: CustomerProfile }>("/customer/profile")
                if (response.success) {
                    setProfile(response.data)
                }
            } catch (err) {
                console.error("Failed to fetch customer profile:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [])

    if (loading) {
        return (
            <div className="space-y-8 p-4">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-12 w-32 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Skeleton className="h-[400px] lg:col-span-2 rounded-2xl" />
                    <Skeleton className="h-[400px] rounded-2xl" />
                </div>
            </div>
        )
    }

    const isActive = profile?.status === "active"
    const currentPlan = profile?.subscribedPkg?.packagePlanDetails?.planName || "No active plan"
    const downSpeed = profile?.subscribedPkg?.packagePlanDetails?.downSpeed || 0
    const upSpeed = profile?.subscribedPkg?.packagePlanDetails?.upSpeed || Math.floor(downSpeed / 2)
    const nextBill = profile?.subscribedPkg?.price || 0

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-2 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                <User className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Namaste, {user?.name || profile?.lead?.firstName || 'Customer'}
                            </h1>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2 pl-1">
                            <span className="w-2 h-2 rounded-full bg-primary/40"></span>
                            Customer ID: <span className="font-mono font-medium text-foreground/80">{profile?.customerUniqueId || 'N/A'}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-2xl border border-white/5">
                            <div className={`w-3 h-3 rounded-full animate-pulse ${isActive ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
                            <span className="text-sm font-semibold uppercase tracking-wider">{profile?.status || 'UNKNOWN'}</span>
                        </div>
                        <Button variant="outline" className="rounded-2xl bg-background/30 border-white/10 hover:bg-primary/10 transition-all px-6 py-6" asChild>
                            <Link href="/settings">
                                <Settings className="w-5 h-5 mr-2" />
                                Account Settings
                            </Link>
                        </Button>
                        <Button className="rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-6 py-6 font-bold" asChild>
                            <Link href="/billing">
                                <CreditCard className="w-5 h-5 mr-2" />
                                Pay Bill
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Grid - High Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CardContainer title="Connection" className="relative overflow-hidden group border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Globe className="w-16 h-16 text-emerald-500" />
                    </div>
                    <div className="relative space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-xl">
                                <Activity className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Network</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-emerald-500">STABLE</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Zap className="w-3 h-3" /> 14ms Latency • Excellent
                            </p>
                        </div>
                    </div>
                </CardContainer>

                <CardContainer title="Internet Speed" className="relative overflow-hidden group border-blue-500/10 hover:border-blue-500/30 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-16 h-16 text-blue-500" />
                    </div>
                    <div className="relative space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Download className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Speed Plan</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black">{downSpeed} <span className="text-lg font-normal text-muted-foreground">Mbps</span></h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" /> {upSpeed} Mbps Upload
                            </p>
                        </div>
                    </div>
                </CardContainer>

                <CardContainer title="Account Balance" className="relative overflow-hidden group border-rose-500/10 hover:border-rose-500/30 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CreditCard className="w-16 h-16 text-rose-500" />
                    </div>
                    <div className="relative space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-500/10 rounded-xl">
                                <History className="w-5 h-5 text-rose-500" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Balance</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black">Rs. {nextBill.toLocaleString()}</h3>
                            <p className="text-xs text-rose-500 font-bold uppercase flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Overdue in 8 Days
                            </p>
                        </div>
                    </div>
                </CardContainer>

                <CardContainer title="Support Tickets" className="relative overflow-hidden group border-purple-500/10 hover:border-purple-500/30 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Ticket className="w-16 h-16 text-purple-500" />
                    </div>
                    <div className="relative space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <Shield className="w-5 h-5 text-purple-500" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Support</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black">{profile?.tickets?.filter(t => t.status !== 'CLOSED').length || 0} <span className="text-lg font-normal text-muted-foreground">Active</span></h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <HelpCircle className="w-3 h-3" /> Need help? Open a query
                            </p>
                        </div>
                    </div>
                </CardContainer>
            </div>

            {/* Navigation Tabs - Modern Styled */}
            <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-muted/20 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <TabsList className="bg-transparent border-none">
                        <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all px-8 py-3">Overview</TabsTrigger>
                        <TabsTrigger value="billing" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all px-8 py-3">Billing</TabsTrigger>
                        <TabsTrigger value="wifi" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all px-8 py-3">Router Settings</TabsTrigger>
                        <TabsTrigger value="support" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all px-8 py-3">Support</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex items-center gap-2 px-4 py-2 bg-background/40 rounded-xl border border-white/5">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>

                <TabsContent value="overview" className="mt-0 animate-in fade-in zoom-in-95 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <CardContainer title="Connection Intelligence" className="lg:col-span-2 p-0 overflow-hidden">
                            <div className="p-8 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <Network className="w-5 h-5 text-primary" />
                                            Active Service Node
                                        </h3>
                                        <p className="text-sm text-muted-foreground italic">Your primary fiber connection is active and stable.</p>
                                    </div>
                                    <Badge className="bg-emerald-500/20 text-emerald-500 border-none px-3 py-1 uppercase text-[10px] font-black">Online</Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4 p-6 bg-muted/30 rounded-2xl border border-white/5">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> PPPoE User</span>
                                            <span className="text-sm font-mono font-bold group-hover:text-primary transition-colors">{profile?.connectionUsers?.[0]?.username || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm text-muted-foreground flex items-center gap-2"><Globe className="w-4 h-4" /> IPv4 Address</span>
                                            <span className="text-sm font-mono font-bold group-hover:text-primary transition-colors">103.142.152.45</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm text-muted-foreground flex items-center gap-2"><Signal className="w-4 h-4" /> Media Type</span>
                                            <span className="text-sm font-bold uppercase group-hover:text-primary transition-colors">FTTH Fiber</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4 p-6 bg-muted/30 rounded-2xl border border-white/5">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm text-muted-foreground flex items-center gap-2"><MousePointer2 className="w-4 h-4" /> MAC Address</span>
                                            <span className="text-sm font-mono font-bold group-hover:text-primary transition-colors">F4:C7:14:8A:21:BB</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Branch Office</span>
                                            <span className="text-sm font-bold group-hover:text-primary transition-colors">{profile?.branch?.name || 'Main Hub'}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4" /> Link Uptime</span>
                                            <span className="text-sm font-bold text-emerald-500 group-hover:scale-105 transition-transform">99.9% Reliable</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative h-24 w-full bg-muted/20 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                                    <div className="flex gap-4">
                                        {[...Array(12)].map((_, i) => (
                                            <div key={i} className="w-2 h-8 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                                        ))}
                                    </div>
                                    <span className="absolute bottom-2 right-4 text-[10px] text-muted-foreground/50 font-mono tracking-widest uppercase">Fiber Traffic Monitor</span>
                                </div>
                            </div>
                        </CardContainer>

                        <CardContainer title="Network Nodes" className="p-0 overflow-hidden border-blue-500/5">
                            <div className="p-8 space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Smartphone className="w-5 h-5 text-blue-500" />
                                    Active Devices
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { icon: Smartphone, name: "iPhone 15 Pro Max", type: "5GHz WiFi", last: "Active now" },
                                        { icon: Laptop, name: "MacBook Pro M3", type: "Ethernet Gbit", last: "Active now" },
                                        { icon: Tv, name: "Samsung Smart TV", type: "2.4GHz WiFi", last: "Connected" }
                                    ].map((dev, i) => (
                                        <div key={i} className="group flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-blue-500/20 hover:bg-blue-500/5 transition-all cursor-default">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                                                    <dev.icon className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{dev.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{dev.type}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] px-1.5 py-0">LIVE</Badge>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="ghost" className="w-full text-xs text-blue-500 hover:bg-blue-500/10 rounded-xl py-6 border border-blue-500/5">
                                    Analyze All Nodes
                                </Button>
                            </div>
                        </CardContainer>
                    </div>
                </TabsContent>

                <TabsContent value="billing" className="mt-0 animate-in fade-in zoom-in-95 duration-500">
                    <CardContainer title="Financial Command Center">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                            <div className="lg:col-span-3 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-bold">Invoices & Statements</h3>
                                        <p className="text-sm text-muted-foreground">Detailed history of your subscriptions and payments</p>
                                    </div>
                                    <Button variant="outline" className="rounded-xl border-white/10">Download All PDF</Button>
                                </div>

                                <div className="rounded-2xl border border-white/5 overflow-hidden bg-card/20">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/50 border-b border-white/5">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Reference</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Period</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Total</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                                <th className="px-6 py-4 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {[
                                                { ref: "INV-2026-004", date: "May 2026", amt: 1200, status: "UNPAID", color: "amber" },
                                                { ref: "INV-2026-003", date: "Apr 2026", amt: 1200, status: "PAID", color: "emerald" },
                                                { ref: "INV-2026-002", date: "Mar 2026", amt: 1200, status: "PAID", color: "emerald" }
                                            ].map((inv, i) => (
                                                <tr key={i} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="px-6 py-5 font-mono text-sm font-bold">{inv.ref}</td>
                                                    <td className="px-6 py-5 text-sm">{inv.date}</td>
                                                    <td className="px-6 py-5 text-sm font-black">Rs. {inv.amt}</td>
                                                    <td className="px-6 py-5">
                                                        <Badge variant="outline" className={`bg-${inv.color}-500/10 text-${inv.color}-500 border-none text-[10px] px-2 py-0.5`}>{inv.status}</Badge>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <Button variant="ghost" size="sm" className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">View PDF</Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="p-6 bg-gradient-to-br from-primary/20 to-blue-600/10 rounded-2xl border border-primary/20">
                                    <h4 className="font-bold mb-4 flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-primary" />
                                        Fast Payment
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-background/40 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Total Outstanding</p>
                                            <p className="text-2xl font-black">Rs. {nextBill}</p>
                                        </div>
                                        <Button className="w-full py-6 rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">Pay via eSewa / Khalti</Button>
                                    </div>
                                </div>
                                <div className="p-6 bg-muted/20 rounded-2xl border border-white/5">
                                    <h4 className="text-sm font-bold mb-4">Payment Methods</h4>
                                    <div className="flex gap-2">
                                        <div className="flex-1 h-12 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center">VISA</div>
                                        <div className="flex-1 h-12 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center">E-BANK</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContainer>
                </TabsContent>

                <TabsContent value="wifi" className="mt-0 animate-in fade-in zoom-in-95 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <CardContainer title="SSID Intelligence">
                            <div className="p-4 space-y-8">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-4 bg-primary/10 rounded-2xl">
                                        <Wifi className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">WiFi Configuration</h3>
                                        <p className="text-sm text-muted-foreground">Manage your wireless local network settings</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 px-1">Network Name (SSID)</label>
                                        <div className="relative group">
                                            <Input 
                                                className="h-14 bg-background/40 border-white/10 rounded-xl pl-4 pr-12 focus:ring-primary focus:border-primary transition-all font-bold"
                                                defaultValue="Simul_Fiber_Highspeed"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <RefreshCcw className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 px-1">WPA3 Security Key</label>
                                        <div className="relative group">
                                            <Input 
                                                type="password"
                                                className="h-14 bg-background/40 border-white/10 rounded-xl pl-4 pr-12 focus:ring-primary focus:border-primary transition-all font-bold"
                                                defaultValue="********"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Shield className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <Button className="w-full h-14 bg-primary hover:bg-primary/90 rounded-xl font-black shadow-xl shadow-primary/20 tracking-wide uppercase">Push Update to Router</Button>
                                    </div>
                                </div>
                            </div>
                        </CardContainer>

                        <CardContainer title="Device Status">
                            <div className="p-4 space-y-8">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-muted/30 rounded-2xl">
                                            <Server className="w-8 h-8 text-foreground/70" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">Router Diagnostics</h3>
                                            <p className="text-sm text-muted-foreground">Nokia G-140W-C | Dual-Band ONT</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                                        ACTIVE
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-muted/20 rounded-2xl border border-white/5 text-center group hover:bg-muted/30 transition-all cursor-pointer">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-widest">System Load</p>
                                        <p className="text-2xl font-black group-hover:text-primary transition-colors">12%</p>
                                    </div>
                                    <div className="p-6 bg-muted/20 rounded-2xl border border-white/5 text-center group hover:bg-muted/30 transition-all cursor-pointer">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-widest">Uptime</p>
                                        <p className="text-2xl font-black group-hover:text-primary transition-colors">4.5d</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Button variant="outline" className="w-full h-14 rounded-xl border-rose-500/20 text-rose-500 hover:bg-rose-500/5 font-bold flex items-center justify-center gap-2">
                                        <Power className="w-4 h-4" />
                                        Restart Optical Terminal
                                    </Button>
                                    <Button variant="ghost" className="w-full h-14 rounded-xl text-muted-foreground text-xs">Run Latency Test</Button>
                                </div>
                            </div>
                        </CardContainer>
                    </div>
                </TabsContent>

                <TabsContent value="support" className="mt-0 animate-in fade-in zoom-in-95 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <CardContainer title="Quick Support Assistant" className="lg:col-span-1 p-0 overflow-hidden border-primary/20">
                            <div className="bg-gradient-to-br from-primary/10 to-transparent p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-4 bg-primary rounded-2xl shadow-lg shadow-primary/30">
                                        <Plus className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black">Need Help?</h3>
                                        <p className="text-sm text-muted-foreground">Expert support 24/7</p>
                                    </div>
                                </div>
                                
                                <form className="space-y-6" onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                                    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
                                    
                                    if (!title) {
                                        toast({ title: "Validation Error", description: "Subject is required", variant: "destructive" });
                                        return;
                                    }

                                    try {
                                        await apiRequest("/tickets", {
                                            method: "POST",
                                            body: JSON.stringify({ title, description, priority: 'MEDIUM' })
                                        });
                                        toast({ title: "Ticket Submitted", description: "Our tech team will respond within 30 minutes." });
                                        form.reset();
                                        setTimeout(() => window.location.reload(), 2000);
                                    } catch (err: any) {
                                        toast({ title: "API Error", description: err.message || "Failed to submit ticket", variant: "destructive" });
                                    }
                                }}>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 px-1">Problem Subject</label>
                                        <Input name="title" placeholder="e.g. Speed slow, WiFi intermittent" className="h-12 bg-background/50 border-white/5 rounded-xl font-bold" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 px-1">Context & Details</label>
                                        <Textarea name="description" placeholder="Briefly describe what's wrong..." rows={5} className="bg-background/50 border-white/5 rounded-xl resize-none font-medium" />
                                    </div>
                                    <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black py-6 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] tracking-widest">
                                        <Send className="w-5 h-5 mr-2" />
                                        SUBMIT TICKET
                                    </Button>
                                    <div className="p-4 bg-muted/20 rounded-xl border border-white/5 flex items-start gap-3">
                                        <Info className="w-4 h-4 text-primary mt-0.5" />
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                            Submission automatically geo-tags your fiber node and alerts the <span className="font-bold text-foreground">{profile?.branch?.name || 'local branch'}</span> technical squad.
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </CardContainer>

                        <CardContainer title="Assistance History" className="lg:col-span-2 p-0 overflow-hidden">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-xl font-black">Active Requests</h3>
                                        <p className="text-sm text-muted-foreground">Monitor and track your support history</p>
                                    </div>
                                    <Button variant="outline" className="rounded-xl border-white/10 hover:bg-muted/40">View Full Archive</Button>
                                </div>
                                
                                {profile?.tickets && profile.tickets.length > 0 ? (
                                    <div className="grid gap-4">
                                        {profile.tickets.map((ticket, idx) => (
                                            <div key={idx} className="group flex items-center justify-between p-6 bg-muted/20 rounded-2xl border border-white/5 hover:border-primary/20 hover:bg-primary/5 transition-all duration-300">
                                                <div className="flex items-center gap-6">
                                                    <div className="p-4 bg-background rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                                                        <Ticket className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <p className="font-black text-lg">{ticket.title}</p>
                                                            <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black tracking-widest">#{ticket.ticketNumber}</Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                            <Calendar className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString()}
                                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                                                            <History className="w-3 h-3" /> Last activity: 2h ago
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <StatusBadge status={ticket.status} />
                                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/20 hover:text-primary transition-colors" asChild>
                                                        <Link href={`/tickets?id=${ticket.id}`}><ArrowUpRight className="w-5 h-5" /></Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                                            <div className="relative p-8 bg-muted/20 rounded-full border border-white/10">
                                                <History className="h-16 w-16 text-muted-foreground/20" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-2xl font-black text-muted-foreground/40 italic">Zero Active Tickets</h4>
                                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Your network experience is currently flawless. No issues detected in your node history.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContainer>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
