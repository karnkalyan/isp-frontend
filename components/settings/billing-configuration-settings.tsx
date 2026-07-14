"use client"

import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import toast from "react-hot-toast"

export function BillingConfigurationSettings() {
  const [years, setYears] = useState<any[]>([])
  const [methods, setMethods] = useState<any[]>([])
  const [year, setYear] = useState({ name: "", startDate: "", endDate: "" })
  const [method, setMethod] = useState({ name: "", code: "", description: "", isDefault: false })

  const load = async () => {
    const [fy, pm] = await Promise.all([apiRequest("/billing/fiscal-years"), apiRequest("/billing/payment-methods")])
    setYears(Array.isArray(fy) ? fy : [])
    setMethods(Array.isArray(pm) ? pm : [])
  }
  useEffect(() => { load().catch(() => toast.error("Failed to load billing configuration")) }, [])

  const addYear = async () => {
    await apiRequest("/billing/fiscal-years", { method: "POST", body: JSON.stringify(year) })
    setYear({ name: "", startDate: "", endDate: "" }); await load(); toast.success("Fiscal year created")
  }
  const addMethod = async () => {
    await apiRequest("/billing/payment-methods", { method: "POST", body: JSON.stringify(method) })
    setMethod({ name: "", code: "", description: "", isDefault: false }); await load(); toast.success("Payment method created")
  }

  return <div className="grid gap-8 lg:grid-cols-2">
    <section className="space-y-4">
      <div><h3 className="font-semibold">Fiscal Years</h3><p className="text-sm text-muted-foreground">The current fiscal year activates automatically between its dates.</p></div>
      <div className="grid gap-3 rounded-lg border p-4">
        <div><Label>Name</Label><Input value={year.name} onChange={e => setYear({ ...year, name: e.target.value })} placeholder="2026/27" /></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Start date</Label><Input type="date" value={year.startDate} onChange={e => setYear({ ...year, startDate: e.target.value })} /></div><div><Label>End date</Label><Input type="date" value={year.endDate} onChange={e => setYear({ ...year, endDate: e.target.value })} /></div></div>
        <Button onClick={() => addYear().catch((e:any) => toast.error(e.message))}>Add Fiscal Year</Button>
      </div>
      <div className="space-y-2">{years.map(y => <div key={y.id} className="flex justify-between rounded border p-3"><span>{y.name}</span><span className={y.isActive ? "text-emerald-500" : "text-muted-foreground"}>{y.isActive ? "Current" : y.isEnabled ? "Scheduled" : "Disabled"}</span></div>)}</div>
    </section>
    <section className="space-y-4">
      <div><h3 className="font-semibold">Payment Methods</h3><p className="text-sm text-muted-foreground">Methods available during recharge and renewal.</p></div>
      <div className="grid gap-3 rounded-lg border p-4">
        <div className="grid grid-cols-2 gap-3"><div><Label>Name</Label><Input value={method.name} onChange={e => setMethod({ ...method, name: e.target.value })} placeholder="Cash" /></div><div><Label>Code</Label><Input value={method.code} onChange={e => setMethod({ ...method, code: e.target.value })} placeholder="CASH" /></div></div>
        <div><Label>Description</Label><Input value={method.description} onChange={e => setMethod({ ...method, description: e.target.value })} /></div>
        <div className="flex items-center justify-between"><Label>Default method</Label><Switch checked={method.isDefault} onCheckedChange={v => setMethod({ ...method, isDefault: v })} /></div>
        <Button onClick={() => addMethod().catch((e:any) => toast.error(e.message))}>Add Payment Method</Button>
      </div>
      <div className="space-y-2">{methods.map(m => <div key={m.id} className="flex justify-between rounded border p-3"><span>{m.name} <small className="text-muted-foreground">({m.code})</small></span><span>{m.isDefault ? "Default" : m.isEnabled ? "Enabled" : "Disabled"}</span></div>)}</div>
    </section>
  </div>
}
