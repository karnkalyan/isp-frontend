"use client"

import React, { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Search, User, Zap, Calendar, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default function RechargePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [customers, setCustomers] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  
  const [packages, setPackages] = useState<any[]>([])
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [showAllPlans, setShowAllPlans] = useState(false)
  const [invoiceType, setInvoiceType] = useState<"cash" | "credit">("cash")
  const [invoiceId, setInvoiceId] = useState("")
  const [fiscalYears, setFiscalYears] = useState<any[]>([])
  const [fiscalYearId, setFiscalYearId] = useState("")
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [paymentMethodId, setPaymentMethodId] = useState("")
  const [processing, setProcessing] = useState(false)

  // Fetch package catalog
  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await apiRequest("/package-prices")
        // Check if data is array
        if (Array.isArray(res)) {
          setPackages(res)
        } else if (res && Array.isArray(res.data)) {
          setPackages(res.data)
        }
      } catch (err) {
        console.error("Failed to load packages", err)
      }
    }
    fetchPackages()
  }, [])

  useEffect(() => {
    Promise.all([
      apiRequest("/billing/fiscal-years"),
      apiRequest("/billing/payment-methods?enabled=true")
    ]).then(([years, methods]) => {
      const yearList = Array.isArray(years) ? years : []
      const methodList = Array.isArray(methods) ? methods : []
      setFiscalYears(yearList)
      setPaymentMethods(methodList)
      const active = yearList.find((year: any) => year.isActive)
      if (active) setFiscalYearId(String(active.id))
      const preferred = methodList.find((method: any) => method.isDefault) || methodList[0]
      if (preferred) setPaymentMethodId(String(preferred.id))
    }).catch(() => toast.error("Failed to load billing configuration"))
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setSelectedCustomer(null)
    setSelectedPackage(null)
    try {
      const res = await apiRequest(`/customer?search=${encodeURIComponent(searchQuery)}`)
      const list = Array.isArray(res) ? res : (res?.data || [])
      setCustomers(list)
      if (list.length === 0) {
        toast.error("No customers found")
      }
    } catch (err) {
      toast.error("Failed to search customers")
    } finally {
      setSearching(false)
    }
  }

  const handleSelectCustomer = async (cust: any) => {
    setSelectedCustomer(cust)
    setCustomers([])
    
    // Find customer's active package if any and pre-select it (or upgraded plan package if plan upgrade is configured)
    setShowAllPlans(false)
    if (cust.subscribedPkgId) {
      const currentPkg = packages.find(p => p.id === cust.subscribedPkgId)
      if (currentPkg) {
        const upgradePlanIds: number[] = Array.isArray(currentPkg.packagePlanDetails?.upgradePlanIds)
          ? currentPkg.packagePlanDetails.upgradePlanIds.map(Number).filter((id: number) => id > 0 && id !== currentPkg.planId)
          : []
        const upgradedCandidates = cust.isRechargeable && upgradePlanIds.length > 0
          ? packages.filter(p => !p.isTrial && upgradePlanIds.includes(Number(p.planId)))
          : []
        if (upgradedCandidates.length > 0) {
          const durNorm = String(currentPkg.packageDuration || "").trim().toLowerCase()
          const matched = upgradedCandidates.find(p => String(p.packageDuration || "").trim().toLowerCase() === durNorm)
          setSelectedPackage(matched || upgradedCandidates[0])
        } else {
          setSelectedPackage(currentPkg)
        }
      }
    }
  }

  const getRechargeAmount = (pkg: any, customer = selectedCustomer) => {
    if (!pkg) return 0
    if (customer?.isFree) return 0
    if (customer?.isRechargeable) {
      return pkg.renewAmountWithTax ?? pkg.price ?? 0
    }
    return pkg.initialTotalWithTax ?? pkg.price ?? 0
  }

  const getPackageOptionLabel = (pkg: any) => {
    const planName = pkg.packagePlanDetails?.planName || "Package"
    const duration = pkg.packageDuration ? ` (${pkg.packageDuration})` : ""
    if (selectedCustomer?.isFree) return `${planName} - Free / 0 NPR${duration}`
    return `${planName} - ${getRechargeAmount(pkg)} NPR${duration}`
  }

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) {
      toast.error("Please select a customer first")
      return
    }
    if (!selectedPackage) {
      toast.error("Please select a package plan")
      return
    }
    const receiptRequired = invoiceType === "cash" && (selectedCustomer?.subBranch?.receiptRequired === true || selectedCustomer?.branch?.receiptRequired === true)
    if (receiptRequired && !invoiceId.trim()) {
      toast.error("Invoice number is required")
      return
    }
    if (!fiscalYearId) return toast.error("No active fiscal year is available")
    if (invoiceType === "cash" && !paymentMethodId) return toast.error("Please select a payment method")

    setProcessing(true)
    try {
      const res = await apiRequest("/billing/renew", {
        method: "POST",
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          packageId: selectedPackage.id,
          invoiceType,
          invoiceId: invoiceType === "cash" ? invoiceId : undefined,
          fiscalYearId: Number(fiscalYearId),
          paymentMethodId: invoiceType === "cash" ? Number(paymentMethodId) : undefined,
          amount: getRechargeAmount(selectedPackage)
        })
      })

      if (res.success) {
        toast.success("Customer account recharged successfully!")
        router.push("/finance/invoices")
      } else {
        toast.error(res.error || "Recharge failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process recharge")
    } finally {
      setProcessing(false)
    }
  }

  const customerName = (cust: any) => {
    const name = [
      cust?.firstName || cust?.lead?.firstName,
      cust?.middleName || cust?.lead?.middleName,
      cust?.lastName || cust?.lead?.lastName,
    ].filter(Boolean).join(" ").trim()

    return name || cust?.name || cust?.customerUniqueId || `Customer ${cust?.id || ""}`.trim()
  }

  const customerEmail = (cust: any) => cust?.email || cust?.lead?.email || ""
  const customerPhone = (cust: any) => cust?.phoneNumber || cust?.lead?.phoneNumber || cust?.secondaryPhone || cust?.lead?.secondaryContactNumber || ""
  const customerCode = (cust: any) => cust?.customerUniqueId || `CUST-${cust?.id}`

  const customerMetaLine = (cust: any) => {
    return [customerCode(cust), customerPhone(cust), customerEmail(cust)].filter(Boolean).join(" | ")
  }
  const isAdvancePayment = Boolean(selectedCustomer?.customerSubscriptions?.[0]?.planEnd && new Date(selectedCustomer.customerSubscriptions[0].planEnd) > new Date())

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="Customer Recharge"
          description="Renew pre-paid internet subscription and process invoice payments"
          icon={CreditCard}
        />

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            {/* Step 1: Find Customer */}
            <CardContainer title="1. Select Customer" description="Search customer by name, email, or unique ID">
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Input
                    placeholder="Enter customer name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-900 border-slate-800 text-white rounded-lg"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <Button type="submit" disabled={searching} className="bg-primary text-primary-foreground">
                  {searching ? "Searching..." : "Search"}
                </Button>
              </form>

              {/* Search Results */}
              {customers.length > 0 && (
                <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800 max-h-60 overflow-y-auto bg-slate-950">
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-3 hover:bg-slate-800/40 cursor-pointer flex justify-between items-center transition-colors"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">{customerName(c)}</div>
                        <div className="text-xs text-slate-400">{customerMetaLine(c)}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500" />
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Customer Panel */}
              {selectedCustomer && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{customerName(selectedCustomer)}</h4>
                      <p className="text-xs text-slate-400">{customerMetaLine(selectedCustomer)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)} className="text-xs text-slate-400 hover:text-white">
                    Change
                  </Button>
                </div>
              )}
            </CardContainer>

            {/* Step 2: Select Package & Input Details */}
            {selectedCustomer && (
              <CardContainer title="2. Payment & Plan Details" description="Select the renewal package and input invoice number">
                <form onSubmit={handleRecharge} className="space-y-5">
                  {isAdvancePayment && <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3"><Badge className="bg-blue-600 text-white">PAY IN ADVANCE</Badge><span className="text-sm text-blue-200">The new duration starts after the current expiry date.</span></div>}
                  {(() => {
                    const currentPkg = packages.find(p => p.id === selectedCustomer?.subscribedPkgId)
                    const upgradePlanIds: number[] = Array.isArray(currentPkg?.packagePlanDetails?.upgradePlanIds)
                      ? currentPkg.packagePlanDetails.upgradePlanIds.map(Number).filter((id: number) => id > 0 && id !== currentPkg?.planId)
                      : []
                    const upgradedPackages = selectedCustomer?.isRechargeable && upgradePlanIds.length > 0
                      ? packages.filter(p => !p.isTrial && upgradePlanIds.includes(Number(p.planId)))
                      : []
                    const upgradedPlanNames = Array.from(new Set(upgradedPackages.map(p => p.packagePlanDetails?.planName).filter(Boolean)))
                    const visiblePackages = (!showAllPlans && upgradedPackages.length > 0)
                      ? upgradedPackages
                      : packages.filter((pkg) => !pkg.isTrial)

                    return (
                      <>
                        {upgradedPackages.length > 0 && (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-indigo-600 text-white">PLAN UPGRADE ON RECHARGE</Badge>
                              <span className="text-sm text-indigo-200">
                                {currentPkg?.packagePlanDetails?.planName} → {upgradedPlanNames.join(", ")}
                              </span>
                            </div>
                            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={showAllPlans}
                                onChange={(e) => setShowAllPlans(e.target.checked)}
                                className="rounded border-slate-600"
                              />
                              Show all plans
                            </label>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="package" className="text-slate-300">Package Plan</Label>
                          <Select
                            value={selectedPackage ? String(selectedPackage.id) : ""}
                            onValueChange={(val) => setSelectedPackage(packages.find(p => String(p.id) === val))}
                          >
                            <SelectTrigger className="bg-slate-900 border-slate-800 text-white">
                              <SelectValue placeholder="Choose a package plan..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                              {visiblePackages.map((pkg) => (
                                <SelectItem key={pkg.id} value={String(pkg.id)}>
                                  {getPackageOptionLabel(pkg)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )
                  })()}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-slate-300">Invoice Type</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={invoiceType === "cash" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setInvoiceType("cash")}
                        >
                          Cash
                        </Button>
                        <Button
                          type="button"
                          variant={invoiceType === "credit" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setInvoiceType("credit")}
                        >
                          Credit
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Fiscal Year</Label>
                      <Select value={fiscalYearId} onValueChange={setFiscalYearId}>
                        <SelectTrigger className="bg-slate-900 border-slate-800 text-white"><SelectValue placeholder="Select fiscal year" /></SelectTrigger>
                        <SelectContent>{fiscalYears.map(year => <SelectItem key={year.id} value={String(year.id)} disabled={!year.isActive}>{year.name}{year.isActive ? " (Current)" : ""}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {invoiceType === "cash" && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-slate-300">Payment Method</Label>
                          <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                            <SelectTrigger className="bg-slate-900 border-slate-800 text-white"><SelectValue placeholder="Select payment method" /></SelectTrigger>
                            <SelectContent>{paymentMethods.map(method => <SelectItem key={method.id} value={String(method.id)}>{method.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invoiceId" className="text-slate-300">Invoice Number {(selectedCustomer?.subBranch?.receiptRequired || selectedCustomer?.branch?.receiptRequired) ? "*" : "(Optional)"}</Label>
                          <Input
                            id="invoiceId"
                            placeholder="e.g. 1004"
                            value={invoiceId}
                            onChange={(e) => setInvoiceId(e.target.value)}
                            className="bg-slate-900 border-slate-800 text-white"
                            required={selectedCustomer?.subBranch?.receiptRequired === true || selectedCustomer?.branch?.receiptRequired === true}
                          />
                          <p className="text-[10px] text-slate-500">Must belong to active allocated range for customer's branch.</p>
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label className="text-slate-300">Recharge Amount (NPR)</Label>
                      <Input
                        value={selectedPackage ? getRechargeAmount(selectedPackage) : ""}
                        disabled
                        className="bg-slate-950 border-slate-800 text-slate-400 font-semibold"
                      />
                      <p className="text-[10px] text-slate-500">
                        {selectedCustomer?.isFree
                          ? "Free customer recharge. Package amount is waived and recorded as 0 NPR."
                          : selectedCustomer?.isRechargeable
                            ? "Renewal amount for this package."
                            : "New package amount for first payment."}
                      </p>
                    </div>
                  </div>

                  <Button type="submit" disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-lg">
                    {processing ? "Processing Recharge..." : `Confirm & Process Recharge of ${selectedPackage ? getRechargeAmount(selectedPackage) : 0} NPR`}
                  </Button>
                </form>
              </CardContainer>
            )}
          </div>

          {/* Customer Summary Sidebar */}
          <div className="space-y-6">
            <CardContainer title="Status & Details" className="h-full">
              {selectedCustomer ? (
                <div className="space-y-5">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Active Subscription</span>
                    {selectedCustomer.customerSubscriptions?.[0] ? (
                      <div className="mt-2 p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="flex items-center gap-2 text-white font-semibold text-sm">
                          <Zap className="h-4 w-4 text-emerald-400" />
                          {selectedCustomer.customerSubscriptions[0].packagePrice?.packagePlanDetails?.planName || "Active Plan"}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          Expires: {new Date(selectedCustomer.customerSubscriptions[0].planEnd).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-amber-500 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> No Active Subscription
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-800 pt-4 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Branch:</span>
                      <span className="font-semibold text-white">{selectedCustomer.branch?.name || "Main Branch"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">PPP Username:</span>
                      <span className="font-semibold text-white">{selectedCustomer.connectionUsers?.[0]?.username || "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-semibold text-emerald-400 uppercase">{selectedCustomer.isRechargeable ? "Prepaid Active" : "Active"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                  <User className="h-10 w-10 text-slate-700 mb-3" />
                  <p className="text-xs">Select a customer to view their active subscription details.</p>
                </div>
              )}
            </CardContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
