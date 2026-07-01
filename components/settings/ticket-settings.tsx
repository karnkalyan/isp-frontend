"use client"
import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"

export function TicketSettings() {
  const [types, setTypes] = useState<any[]>([])
  const [slas, setSlas] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [type, setType] = useState({ name: "", code: "", description: "", departmentId: "" })
  const [selectedSlaTypeId, setSelectedSlaTypeId] = useState<string>("global")

  const load = async () => {
    const [t, d] = await Promise.all([
      apiRequest("/tickets/types"),
      apiRequest<any>("/department")
    ])
    setTypes(Array.isArray(t) ? t : [])
    setDepartments(Array.isArray(d) ? d : (d?.data || []))
  }

  const loadSlasForType = async (typeId: string) => {
    try {
      const qParam = typeId === "global" ? "null" : typeId
      const s = await apiRequest(`/tickets/sla-policies?ticketTypeId=${qParam}`)
      const loadedSlas = Array.isArray(s) ? s : []
      const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
      const completeSlas = priorities.map(p => {
        const existing = loadedSlas.find((x: any) => x.priority === p)
        if (existing) return existing
        return { 
          priority: p, 
          responseHours: 24, 
          resolutionHours: 48, 
          closeHours: 72, 
          ticketTypeId: typeId === "global" ? null : Number(typeId) 
        }
      })
      setSlas(completeSlas)
    } catch (e) {
      toast.error("Failed to load SLA policies")
    }
  }

  useEffect(() => {
    load().catch(() => toast.error("Failed to load ticket settings"))
  }, [])

  useEffect(() => {
    loadSlasForType(selectedSlaTypeId)
  }, [selectedSlaTypeId])

  const saveType = async () => {
    await apiRequest("/tickets/types", {
      method: "POST",
      body: JSON.stringify({ ...type, departmentId: type.departmentId ? Number(type.departmentId) : null })
    })
    setType({ name: "", code: "", description: "", departmentId: "" })
    await load()
  }

  const saveSla = async (sla: any) => {
    const payload = {
      ...sla,
      ticketTypeId: selectedSlaTypeId === "global" ? null : Number(selectedSlaTypeId)
    }
    await apiRequest("/tickets/sla-policies", {
      method: "POST",
      body: JSON.stringify(payload)
    })
    toast.success(`${sla.priority} SLA saved`)
    await loadSlasForType(selectedSlaTypeId)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Ticket Types</h3>
          <p className="text-sm text-muted-foreground">Create Internet, TV, billing, or other support queues.</p>
        </div>
        <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-card">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={type.name} onChange={e => setType({ ...type, name: e.target.value })} />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={type.code} onChange={e => setType({ ...type, code: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input value={type.description} onChange={e => setType({ ...type, description: e.target.value })} />
          </div>
          <div>
            <Label>Default Department</Label>
            <select
              className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-background text-foreground p-2 text-sm"
              value={type.departmentId}
              onChange={e => setType({ ...type, departmentId: e.target.value })}
            >
              <option value="">None</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={() => saveType().catch((e: any) => toast.error(e.message))}>
            Add Ticket Type
          </Button>
        </div>
        <div className="space-y-2">
          {types.map(t => (
            <div key={t.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-muted/40 flex justify-between items-center">
              <div>
                <span className="font-semibold">{t.name}</span>
                <span className="ml-2 text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{t.code}</span>
              </div>
              <span className="text-xs text-muted-foreground">{t.description}</span>
            </div>
          ))}
        </div>
      </section>
      
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Priority SLA Configuration</h3>
            <p className="text-sm text-muted-foreground">Response, resolution, and close deadlines.</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-bold text-muted-foreground">Type Scope:</Label>
            <select
              className="rounded-md border border-slate-200 dark:border-slate-800 bg-background text-foreground p-1 text-xs font-semibold"
              value={selectedSlaTypeId}
              onChange={e => setSelectedSlaTypeId(e.target.value)}
            >
              <option value="global">Global (Fallback SLA)</option>
              {types.map(t => (
                <option key={t.id} value={String(t.id)}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-4">
          {slas.map(s => (
            <SlaRow key={`${selectedSlaTypeId}-${s.priority}`} value={s} onSave={saveSla} />
          ))}
        </div>
      </section>
    </div>
  )
}

function SlaRow({ value, onSave }: { value: any; onSave: (v: any) => void }) {
  const [v, setV] = useState(value)

  useEffect(() => {
    setV(value)
  }, [value])

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-card shadow-sm">
      <h4 className="font-bold text-sm tracking-wider text-primary">{v.priority}</h4>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Response (Hours)</Label>
          <Input type="number" min={0} value={v.responseHours} onChange={e => setV({ ...v, responseHours: Number(e.target.value) })} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Resolve (Hours)</Label>
          <Input type="number" min={0} value={v.resolutionHours} onChange={e => setV({ ...v, resolutionHours: Number(e.target.value) })} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Close (Hours)</Label>
          <Input type="number" min={0} value={v.closeHours} onChange={e => setV({ ...v, closeHours: Number(e.target.value) })} />
        </div>
      </div>
      <div className="flex justify-end pt-1">
        <Button size="sm" onClick={() => onSave(v)}>
          Save SLA Policy
        </Button>
      </div>
    </div>
  )
}
