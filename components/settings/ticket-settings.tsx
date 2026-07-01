"use client"
import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"

export function TicketSettings() {
  const [types, setTypes] = useState<any[]>([]); const [slas, setSlas] = useState<any[]>([]); const [departments, setDepartments] = useState<any[]>([])
  const [type, setType] = useState({ name: "", code: "", description: "", departmentId: "" })
  const load = async () => { const [t,s,d] = await Promise.all([apiRequest("/tickets/types"),apiRequest("/tickets/sla-policies"),apiRequest<any>("/department")]); setTypes(Array.isArray(t)?t:[]); setSlas(Array.isArray(s)?s:[]); setDepartments(Array.isArray(d)?d:(d?.data||[])) }
  useEffect(() => { load().catch(() => toast.error("Failed to load ticket settings")) }, [])
  const saveType = async () => { await apiRequest("/tickets/types", { method:"POST", body:JSON.stringify({...type,departmentId:type.departmentId?Number(type.departmentId):null}) }); setType({name:"",code:"",description:"",departmentId:""}); await load() }
  const saveSla = async (sla:any) => { await apiRequest("/tickets/sla-policies", { method:"POST", body:JSON.stringify(sla) }); toast.success(`${sla.priority} SLA saved`); await load() }
  return <div className="grid gap-8 lg:grid-cols-2">
    <section className="space-y-4"><div><h3 className="font-semibold">Ticket Types</h3><p className="text-sm text-muted-foreground">Create Internet, TV, billing, or other support queues.</p></div>
      <div className="space-y-3 rounded border p-4"><div className="grid grid-cols-2 gap-3"><div><Label>Name</Label><Input value={type.name} onChange={e=>setType({...type,name:e.target.value})}/></div><div><Label>Code</Label><Input value={type.code} onChange={e=>setType({...type,code:e.target.value})}/></div></div><div><Label>Description</Label><Input value={type.description} onChange={e=>setType({...type,description:e.target.value})}/></div><div><Label>Default Department</Label><select className="w-full rounded border bg-background p-2" value={type.departmentId} onChange={e=>setType({...type,departmentId:e.target.value})}><option value="">None</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div><Button onClick={()=>saveType().catch((e:any)=>toast.error(e.message))}>Add Ticket Type</Button></div>
      {types.map(t=><div key={t.id} className="rounded border p-3">{t.name} <span className="text-xs text-muted-foreground">{t.code}</span></div>)}
    </section>
    <section className="space-y-4"><div><h3 className="font-semibold">Priority SLA</h3><p className="text-sm text-muted-foreground">Response, resolution, and resolved-to-close deadlines in hours.</p></div>{slas.map(s=><SlaRow key={s.id} value={s} onSave={saveSla}/>)}</section>
  </div>
}
function SlaRow({value,onSave}:{value:any,onSave:(v:any)=>void}) { const [v,setV]=useState(value); return <div className="rounded border p-3 space-y-3"><h4 className="font-medium">{v.priority}</h4><div className="grid grid-cols-3 gap-2"><div><Label>Response</Label><Input type="number" value={v.responseHours} onChange={e=>setV({...v,responseHours:Number(e.target.value)})}/></div><div><Label>Resolve</Label><Input type="number" value={v.resolutionHours} onChange={e=>setV({...v,resolutionHours:Number(e.target.value)})}/></div><div><Label>Close</Label><Input type="number" value={v.closeHours} onChange={e=>setV({...v,closeHours:Number(e.target.value)})}/></div></div><Button size="sm" onClick={()=>onSave(v)}>Save SLA</Button></div> }
