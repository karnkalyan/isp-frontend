"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar as CalendarIcon, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Loader2 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardContainer } from "@/components/ui/card-container";
import { apiRequest } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomerInvoicesProps {
  customer: any;
  onRefresh: () => void;
}

export function CustomerInvoices({ customer, onRefresh }: CustomerInvoicesProps) {
  const [payOrderOpen, setPayOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [invoiceId, setInvoiceId] = useState("");
  const [loading, setLoading] = useState(false);

  // Manual Invoice Modal
  const [manualInvoiceOpen, setManualInvoiceOpen] = useState(false);
  const [manualItemName, setManualItemName] = useState("Custom Hardware/Service");
  const [manualItemPrice, setManualItemPrice] = useState(0);

  // Adjustment Modal
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjName, setAdjName] = useState("Installation Adjustment");
  const [adjAmount, setAdjAmount] = useState(2000);

  // Billing states
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");

  useEffect(() => {
    const loadBillingConfig = async () => {
      try {
        const [fy, pm] = await Promise.all([
          apiRequest<any[]>("/billing/fiscal-years"),
          apiRequest<any[]>("/billing/payment-methods")
        ]);
        const years = Array.isArray(fy) ? fy : [];
        const methods = Array.isArray(pm) ? pm : [];
        setFiscalYears(years);
        setPaymentMethods(methods);
        setSelectedFiscalYearId(String(years.find((y: any) => y.isActive)?.id || ""));
        setSelectedPaymentMethodId(String(methods.find((m: any) => m.isDefault)?.id || ""));
      } catch (err) {
        console.error("Failed to load billing config data:", err);
      }
    };
    loadBillingConfig();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NPR', minimumFractionDigits: 0 }).format(price);
  };

  const handlePay = async () => {
    if (!invoiceId) {
      toast({ title: "Error", description: "Invoice ID is required for payment", variant: "destructive" });
      return;
    }
    const receiptRequired = customer?.subBranch?.receiptRequired === true || customer?.branch?.receiptRequired === true;
    if (receiptRequired && !invoiceId.trim()) {
      toast({ title: "Error", description: "Invoice ID is required for this branch", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      await apiRequest('/billing/pay', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedOrder.id,
          invoiceId,
          paymentMethodId: Number(selectedPaymentMethodId),
          fiscalYearId: Number(selectedFiscalYearId),
          amount: selectedOrder.totalAmount
        })
      });
      toast({ title: "Success", description: "Payment recorded successfully" });
      setPayOrderOpen(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateManualInvoice = async () => {
    try {
      setLoading(true);
      await apiRequest('/billing/generate-manual', {
        method: 'POST',
        body: JSON.stringify({ 
            customerId: customer.id,
            items: [{ itemName: manualItemName, itemPrice: manualItemPrice }]
        })
      });
      toast({ title: "Success", description: "Manual invoice generated" });
      setManualInvoiceOpen(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAdjustment = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/billing/adjustments/add', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedOrder.id,
          itemName: adjName,
          itemPrice: adjAmount
        })
      });
      toast({ title: "Success", description: "Adjustment applied" });
      setAdjustmentOpen(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const orders = customer?.orders || [];

  return (
    <CardContainer
      title="Billing & Invoices"
      description="View orders, apply adjustments, and record payments."
      className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
    >
      <div className="flex justify-end mb-4">
        <Button onClick={() => setManualInvoiceOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Generate Manual Invoice
        </Button>
      </div>

      {/* Manual Invoice Dialog */}
      <Dialog open={manualInvoiceOpen} onOpenChange={setManualInvoiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Manual Invoice</DialogTitle>
            <DialogDescription>Create a custom bill for external services or hardware.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input value={manualItemName} onChange={(e) => setManualItemName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" min="0" value={manualItemPrice} onChange={(e) => setManualItemPrice(parseFloat(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualInvoiceOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateManualInvoice} disabled={loading || manualItemPrice <= 0}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={payOrderOpen} onOpenChange={setPayOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Select fiscal year, payment method, and enter invoice number.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium">Amount to Pay:</span>
              <span className="text-lg font-bold text-primary">{formatPrice(selectedOrder?.totalAmount || 0)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fiscal Year</Label>
                <Select value={selectedFiscalYearId} onValueChange={setSelectedFiscalYearId}>
                  <SelectTrigger className="bg-background border-input text-foreground text-sm">
                    <SelectValue placeholder="Choose fiscal year" />
                  </SelectTrigger>
                  <SelectContent>
                    {fiscalYears.map(y => (
                      <SelectItem key={y.id} value={String(y.id)} disabled={!y.isActive}>
                        {y.name}{y.isActive ? " (Current)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={selectedPaymentMethodId} onValueChange={setSelectedPaymentMethodId}>
                  <SelectTrigger className="bg-background border-input text-foreground text-sm">
                    <SelectValue placeholder="Choose method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(m => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Invoice ID (Manual Number)</Label>
              <Input 
                value={invoiceId} 
                onChange={(e) => setInvoiceId(e.target.value)} 
                placeholder="e.g. 101"
              />
              <p className="text-xs text-muted-foreground italic">
                Note: Invoice ID must be within your branch's assigned range for the selected fiscal year.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOrderOpen(false)}>Cancel</Button>
            <Button onClick={handlePay} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjustment Dialog */}
      <Dialog open={adjustmentOpen} onOpenChange={setAdjustmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Adjustment</DialogTitle>
            <DialogDescription>Add or deduct amount from this order.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={adjName} onChange={(e) => setAdjName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Amount (Negative to deduct)</Label>
              <Input type="number" value={adjAmount} onChange={(e) => setAdjAmount(parseFloat(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustmentOpen(false)}>Cancel</Button>
            <Button onClick={handleApplyAdjustment} disabled={loading}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="h-10 px-4 text-left font-medium">Order / Invoice</th>
              <th className="h-10 px-4 text-left font-medium">Date</th>
              <th className="h-10 px-4 text-left font-medium">Amount</th>
              <th className="h-10 px-4 text-left font-medium">Status</th>
              <th className="h-10 px-4 text-left font-medium">Payment Mode</th>
              <th className="h-10 px-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order: any) => (
                <tr key={order.id} className="border-b hover:bg-muted/20">
                  <td className="p-4">
                    <div className="font-medium">#{order.id}</div>
                    <div className="text-xs text-muted-foreground">{order.invoiceId || "No Invoice ID"}</div>
                  </td>
                  <td className="p-4 font-medium">{order.isPaid ? String(order.paymentMethodName || order.paymentId || "Payment").replaceAll("_", " ") : "—"}</td>
                  <td className="p-4">{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td className="p-4 font-bold">{formatPrice(order.totalAmount)}</td>
                  <td className="p-4">
                    <Badge variant={order.isPaid ? "default" : "destructive"}>
                      {order.isPaid ? "PAID" : "PENDING"}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!order.isPaid && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedOrder(order); setAdjustmentOpen(true); }}>
                            <Plus className="h-4 w-4 mr-1" /> Adj
                          </Button>
                          <Button size="sm" onClick={() => { setSelectedOrder(order); setPayOrderOpen(true); }}>
                            Pay Cash
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost"><Download className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground italic">No billing history found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </CardContainer>
  );
}
