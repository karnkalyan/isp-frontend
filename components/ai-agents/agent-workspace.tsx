"use client"

import {useEffect,useMemo,useState} from "react"
import Link from "next/link"
import {useRouter} from "next/navigation"
import {Activity,ArrowRight,Bot,CheckCircle2,Clock3,Coins,Edit3,MessagesSquare,MoreHorizontal,Plus,Save,Search,Settings2,ShieldCheck} from "lucide-react"
import {DashboardLayout} from "@/components/layout/dashboard-layout"
import {PageHeader} from "@/components/ui/page-header"
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Label} from "@/components/ui/label"
import {Badge} from "@/components/ui/badge"
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from "@/components/ui/table"
import {OrchestrationConsole} from "@/components/ui/orchestration-console"
import {AgentAvatar} from "./agent-avatar"
import {AiAgentApprovalsAPI,AiAgentConversationsAPI,AiAgentsAPI} from "@/lib/api/ai-agent"
import toast from "react-hot-toast"

type Agent=any
const titles:any={dashboard:"AI Agents Dashboard",directory:"Agent Directory",tasks:"Agent Tasks",approvals:"Agent Approvals",activity:"Agent Activity",conversations:"Agent Conversations",tools:"Agent Tools",knowledge:"Agent Knowledge",permissions:"Agent Permissions",analytics:"Agent Analytics",usage:"Usage and Cost","audit-logs":"Agent Audit Logs",versions:"Agent Versions",settings:"Agent Settings"}
const modules=(a:Agent)=>(a.permissions||[]).filter((p:any)=>p.canRead||p.canExecute).map((p:any)=>p.module)
const enabledTools=(a:Agent)=>(a.tools||[]).filter((t:any)=>t.enabled).map((t:any)=>t.toolKey)

export function AgentWorkspace({view="dashboard",agentId}:{view?:string;agentId?:string}){
  const router=useRouter()
  const [agents,setAgents]=useState<Agent[]>([])
  const [data,setData]=useState<any>(null)
  const [query,setQuery]=useState("")
  const [loading,setLoading]=useState(true)
  const load=async()=>{
    setLoading(true)
    try{
      const ar=await AiAgentsAPI.list()
      setAgents(ar.data||[])
      if(view==="dashboard"||view==="analytics")setData((await AiAgentsAPI.analytics()).data)
      else if(view==="tasks")setData((await AiAgentsAPI.tasks()).data)
      else if(view==="approvals")setData((await AiAgentsAPI.approvals()).data)
      else if(view==="activity"||view==="audit-logs")setData((await AiAgentsAPI.activity()).data)
      else if(view==="usage")setData((await AiAgentsAPI.usage()).data)
      else if(view==="conversations")setData((await AiAgentConversationsAPI.list()).data)
    }catch(error:any){toast.error(error.message||"Failed to load AI data")}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[view])
  useEffect(()=>{
    if(view!=="tasks")return
    const timer=window.setInterval(()=>AiAgentsAPI.tasks().then(result=>setData(result.data||[])).catch(()=>{}),3000)
    return()=>window.clearInterval(timer)
  },[view])
  const selected=agentId?agents.find(a=>String(a.id)===agentId||a.slug===agentId):undefined
  const filtered=useMemo(()=>agents.filter(a=>(a.name+" "+a.role+" "+a.department).toLowerCase().includes(query.toLowerCase())),[agents,query])

  if(loading)return <DashboardLayout><div className="page-container"><Card><CardContent className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">Loading persisted AI workforce data…</CardContent></Card></div></DashboardLayout>
  if(view==="create"||view==="edit")return <AgentForm agentId={view==="edit"?agentId:undefined} onSaved={id=>router.push("/ai-agents/"+id)} onCancel={()=>router.back()}/>
  if(selected)return <AgentDetail agent={selected} reload={load}/>

  return <DashboardLayout><div className="page-container space-y-6">
    <PageHeader title={titles[view]||"AI Agents"} description="Live tenant-scoped agents, tasks, conversations, permissions, approvals, and usage." icon={Bot} actions={view==="directory"?[{label:"Create agent",href:"/ai-agents/create",icon:<Plus/>}]:[{label:"Open AI Chat",href:"/ai-agents/chat",icon:<MessagesSquare/>}]}/>
    {view==="dashboard"?<RealDashboard agents={agents} analytics={data}/>:view==="directory"?<>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-10" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search persisted agents"/></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(a=><Link href={"/ai-agents/"+a.id} key={a.id}><Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/25"><CardContent className="p-5"><div className="flex gap-3"><AgentAvatar icon={a.avatar} active={a.status==="ACTIVE"}/><div className="min-w-0 flex-1"><div className="flex justify-between"><h3 className="font-semibold">{a.name}</h3><MoreHorizontal className="size-4 text-muted-foreground"/></div><p className="text-sm text-muted-foreground">{a.role}</p></div></div><p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{a.description||"No description"}</p><div className="mt-4 flex justify-between border-t pt-3 text-xs"><span>{enabledTools(a).length} enabled tools</span><span className="flex items-center gap-1 text-primary">View <ArrowRight className="size-3"/></span></div></CardContent></Card></Link>)}</div>
    </>:<RealOperational view={view} data={data||[]} agents={agents} reload={load}/>}
  </div></DashboardLayout>
}

function AgentDetail({agent,reload}:{agent:Agent;reload:()=>void}){
  return <DashboardLayout><div className="page-container space-y-6">
    <PageHeader title={agent.name} description={agent.role} icon={Bot} badge={{text:agent.status}} actions={[
      {label:"Edit agent",href:"/ai-agents/"+agent.id+"/edit",icon:<Edit3/>,variant:"outline"},
      {label:"Chat with agent",href:"/ai-agents/chat/"+agent.id},
      {label:agent.status==="ACTIVE"?"Pause":"Activate",onClick:async()=>{await AiAgentsAPI.setState(agent.id,agent.status==="ACTIVE"?"pause":"activate");reload()},variant:"outline"}
    ]}/>
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card><CardHeader><CardTitle>Instructions and access</CardTitle></CardHeader><CardContent className="space-y-5"><p className="text-sm leading-6 text-muted-foreground">{agent.description||"No description configured."}</p><div><p className="mb-2 text-sm font-semibold">System instructions</p><pre className="whitespace-pre-wrap rounded-xl border bg-secondary/30 p-4 text-xs">{agent.systemPrompt||agent.instructions||"No instructions configured."}</pre></div><div><p className="mb-2 text-sm font-semibold">Database permissions</p><div className="flex flex-wrap gap-2">{modules(agent).length?modules(agent).map((x:string)=><Badge key={x} variant="secondary">{x}</Badge>):<span className="text-sm text-muted-foreground">No permissions assigned</span>}</div></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Agent functions</CardTitle></CardHeader><CardContent className="space-y-2">{(agent.tools||[]).length?(agent.tools||[]).map((x:any)=><div key={x.id} className="rounded-xl border p-3"><div className="flex items-center gap-2"><p className="text-sm font-semibold">{x.toolName}</p><Button className="ml-auto h-7 text-[11px]" size="sm" variant={x.enabled?"secondary":"outline"} onClick={async()=>{await AiAgentsAPI.updateTools(agent.id,[{toolKey:x.toolKey,enabled:!x.enabled,custom:String(x.toolKey).startsWith("custom_"),toolName:x.toolName,description:x.description,riskLevel:x.riskLevel,requiresApproval:x.requiresApproval}]);await reload()}}>{x.enabled?"Enabled":"Disabled"}</Button></div><p className="mt-1 text-xs text-muted-foreground">{x.description||x.toolKey}</p>{x.requiresApproval&&<p className="mt-2 text-xs text-amber-600">Approval required · {x.riskLevel} risk</p>}</div>):<p className="text-sm text-muted-foreground">No functions assigned.</p>}</CardContent></Card>
    </div>
  </div></DashboardLayout>
}

function RealDashboard({agents,analytics}:{agents:Agent[];analytics:any}){
  const metrics=[["Total agents",analytics?.total??agents.length,Bot],["Active agents",analytics?.active??agents.filter(a=>a.status==="ACTIVE").length,CheckCircle2],["Conversations",analytics?.conversations??0,MessagesSquare],["Pending approvals",analytics?.approvals??0,ShieldCheck],["Total tokens",analytics?.totalTokens??0,Clock3],["Estimated cost","$"+Number(analytics?.estimatedCost||0).toFixed(4),Coins]]
  return <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{metrics.map(([label,value,Icon]:any)=><Card key={label}><CardContent className="p-4"><Icon className="size-4 text-primary"/><p className="mt-4 text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}</div><Card><CardHeader><CardTitle>AI workforce</CardTitle></CardHeader><CardContent className="divide-y">{agents.map(a=><Link href={"/ai-agents/"+a.id} key={a.id} className="flex items-center gap-3 py-3"><AgentAvatar icon={a.avatar} active={a.status==="ACTIVE"}/><div className="flex-1"><p className="text-sm font-semibold">{a.name}</p><p className="text-xs text-muted-foreground">{a.department} · {enabledTools(a).length} tools · {a._count?.conversations||0} conversations</p></div><Badge variant="outline">{a.status}</Badge></Link>)}</CardContent></Card></>
}

const taskSteps=["Detect","Analyze","Correlate","Recommend","Approve","Execute","Verify","Report"]
function progressFor(task:any){
  const stage=String(task.output?.stage||task.logs?.at?.(-1)?.metadata?.stage||"").toUpperCase()
  const stageProgress:any={DETECT:1,ANALYZE:2,CORRELATE:3,RECOMMEND:4,APPROVE:5,EXECUTE:6,VERIFY:7,REPORT:8}
  if(stageProgress[stage])return stageProgress[stage]
  if(task.status==="COMPLETED")return 8
  if(task.status==="FAILED"||task.status==="CANCELLED")return 7
  if(task.status==="BLOCKED")return task.approval?.status==="APPROVED"?5:4
  if(task.status==="WAITING_APPROVAL")return 4
  if(task.status==="IN_PROGRESS")return 6
  return 2
}
function TaskList({tasks,reload}:{tasks:any[];reload:()=>void}){
  const [expanded,setExpanded]=useState<number|null>(null)
  return <div className="space-y-4">{tasks.map(task=>{const progress=progressFor(task);const missingStoredSecret=/shared secret was not available|secure ai task storage/i.test(String(task.error||task.output?.summary||""));return <Card key={task.id}><CardContent className="p-5"><div className="flex flex-wrap items-start gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"><Bot className="size-5"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{task.title}</h3><Badge variant={task.status==="COMPLETED"?"default":"outline"}>{task.status.replace(/_/g," ")}</Badge><Badge variant="secondary">{task.priority}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{task.agent?.name||"Assigned AI agent"} · {task.taskType.replace(/_/g," ")}</p></div><Button variant="outline" size="sm" onClick={()=>setExpanded(expanded===task.id?null:task.id)}>{expanded===task.id?"Hide details":"View process"}</Button></div>
    <div className="mt-5 grid grid-cols-4 gap-2 lg:grid-cols-8">{taskSteps.map((step,index)=><div key={step} className={"rounded-lg border px-2 py-2 text-center text-[10px] font-medium "+(index<progress?"border-primary/25 bg-primary/10 text-primary":"bg-muted/35 text-muted-foreground")}><span className="mx-auto mb-1 flex size-5 items-center justify-center rounded-full border">{index<progress?<CheckCircle2 className="size-3"/>:index+1}</span>{step}</div>)}</div>
    {expanded===task.id&&<div className="mt-4 grid gap-4 rounded-xl border bg-muted/25 p-4 lg:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requested work</p><p className="mt-2 whitespace-pre-wrap text-sm">{task.description||"No description provided."}</p><dl className="mt-4 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-muted-foreground">Created</dt><dd>{new Date(task.createdAt).toLocaleString()}</dd></div><div><dt className="text-muted-foreground">Started</dt><dd>{task.startedAt?new Date(task.startedAt).toLocaleString():task.status==="WAITING_APPROVAL"?"Waiting for approval":"Worker will start shortly"}</dd></div><div><dt className="text-muted-foreground">Approval</dt><dd>{task.approval?.status||"Not required"}</dd></div><div><dt className="text-muted-foreground">Executor</dt><dd>{task.action?.actionType||task.output?.provider||"Agent runtime"}</dd></div></dl>{task.logs?.length>0&&<div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Process log</p><div className="mt-2 space-y-2">{task.logs.map((log:any)=><div key={log.id} className="flex gap-2 rounded-lg border bg-card p-2.5 text-xs"><span className="mt-1 size-2 shrink-0 rounded-full bg-primary"/><div><p className="font-medium">{String(log.metadata?.stage||log.eventType).replace(/^TASK_STAGE_/,"").replace(/_/g," ")}</p><p className="mt-0.5 text-muted-foreground">{log.description}</p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p></div></div>)}</div></div>}</div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outcome and next step</p><p className="mt-2 whitespace-pre-wrap text-sm">{task.error||task.output?.summary||(task.status==="PENDING"?"The task is queued and the worker checks for approved work every five seconds.":task.status==="WAITING_APPROVAL"?"Please approve this network change. It will start automatically after approval.":"The assigned specialist is working on this now.")}</p>{task.status==="BLOCKED"&&<p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">{missingStoredSecret?"This task cannot be retried because the original secret was never stored. Start a new AI chat request and provide the secret again; it will now be encrypted.":"The task stopped safely and the reason is shown above. Correct that item, then choose Retry / start."}</p>}<div className="mt-4 flex flex-wrap gap-2">{missingStoredSecret&&<Button asChild size="sm"><Link href="/ai-agents/chat">Start a new request</Link></Button>}{!missingStoredSecret&&["BLOCKED","FAILED"].includes(task.status)&&<Button size="sm" variant="outline" onClick={async()=>{try{await AiAgentsAPI.updateTask(task.id,{status:"IN_PROGRESS"});toast.success("Thanks — the task is queued to start again.");reload()}catch(error:any){toast.error(error.message||"I couldn't restart the task yet.")}}}>Retry / start</Button>}</div></div></div>}
  </CardContent></Card>})}</div>
}

function AgentAnalytics({analytics,agents}:{analytics:any;agents:Agent[]}){
  const taskGroups=Array.isArray(analytics?.tasks)?analytics.tasks:[]
  const taskCount=(row:any)=>Number(typeof row?._count==="number"?row._count:row?._count?._all||0)
  const totalTasks=taskGroups.reduce((sum:number,row:any)=>sum+taskCount(row),0)
  const metrics=[
    ["Total agents",analytics?.total??agents.length,Bot],
    ["Active agents",analytics?.active??0,CheckCircle2],
    ["Conversations",analytics?.conversations??0,MessagesSquare],
    ["Pending approvals",analytics?.approvals??0,ShieldCheck],
    ["Total tokens",Number(analytics?.totalTokens||0).toLocaleString(),Clock3],
    ["Average response",`${Number(analytics?.averageResponseMs||0).toLocaleString()} ms`,Activity],
  ]
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label,value,Icon]:any)=><Card key={label}><CardContent className="p-5"><Icon className="size-4 text-primary"/><p className="mt-4 text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}</div><div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Task status</CardTitle></CardHeader><CardContent className="space-y-4">{taskGroups.length?taskGroups.map((row:any)=>{const count=taskCount(row);const width=totalTasks?Math.max(4,Math.round(count/totalTasks*100)):0;return <div key={row.status}><div className="mb-1.5 flex justify-between text-sm"><span>{String(row.status).replace(/_/g," ")}</span><span className="font-semibold">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${width}%`}}/></div></div>}):<p className="text-sm text-muted-foreground">No agent tasks have been recorded yet.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Usage and cost</CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Estimated model cost</p><p className="mt-2 text-2xl font-semibold">${Number(analytics?.estimatedCost||0).toFixed(4)}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Paused agents</p><p className="mt-2 text-2xl font-semibold">{analytics?.paused??0}</p></div><Button asChild variant="outline"><Link href="/ai-agents/usage">View detailed usage</Link></Button></CardContent></Card></div></div>
}

function AgentSettings({agents}:{agents:Agent[]}){
  const enabled=agents.flatMap(a=>a.tools||[]).filter((tool:any)=>tool.enabled)
  const approvalTools=enabled.filter((tool:any)=>tool.requiresApproval)
  return <div className="space-y-6"><div className="grid gap-4 md:grid-cols-3"><Card><CardContent className="p-5"><Settings2 className="size-4 text-primary"/><p className="mt-4 text-2xl font-semibold">{agents.filter(a=>a.status==="ACTIVE").length}/{agents.length}</p><p className="text-xs text-muted-foreground">Active agents</p></CardContent></Card><Card><CardContent className="p-5"><Activity className="size-4 text-primary"/><p className="mt-4 text-2xl font-semibold">{enabled.length}</p><p className="text-xs text-muted-foreground">Enabled functions</p></CardContent></Card><Card><CardContent className="p-5"><ShieldCheck className="size-4 text-primary"/><p className="mt-4 text-2xl font-semibold">{approvalTools.length}</p><p className="text-xs text-muted-foreground">Approval-gated functions</p></CardContent></Card></div><Card><CardHeader><CardTitle>Agent runtime settings</CardTitle></CardHeader><CardContent className="divide-y">{agents.map(agent=><div key={agent.id} className="flex flex-wrap items-center gap-3 py-4"><AgentAvatar icon={agent.avatar} active={agent.status==="ACTIVE"}/><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{agent.name}</p><p className="text-xs text-muted-foreground">Provider: {agent.modelProvider||"Tenant default"} · Model: {agent.modelName||"Default"} · Max tokens: {agent.maxTokens||4096}</p></div><Badge variant="outline">{agent.status}</Badge><Button asChild size="sm" variant="outline"><Link href={`/ai-agents/${agent.id}/edit`}>Configure</Link></Button></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Safety and access</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link href="/ai-agents/tools">Manage functions</Link></Button><Button asChild variant="outline"><Link href="/ai-agents/permissions">Review permissions</Link></Button><Button asChild variant="outline"><Link href="/ai-agents/approvals">Open approvals</Link></Button></CardContent></Card></div>
}

function RealOperational({view,data,agents,reload}:{view:string;data:any;agents:Agent[];reload:()=>void}){
  if(view==="analytics")return <AgentAnalytics analytics={data||{}} agents={agents}/>
  if(view==="settings")return <AgentSettings agents={agents}/>
  if(view==="tasks")return data.length?<TaskList tasks={data} reload={reload}/>:<Card><CardContent className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">No persisted agent tasks.</CardContent></Card>
  if(view==="tools"||view==="permissions"){const rows=agents.flatMap(a=>(view==="tools"?a.tools:a.permissions||[]).map((x:any)=>({agent:a,...x})));return <Table><TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>{view==="tools"?"Tool":"Module"}</TableHead><TableHead>Access</TableHead><TableHead>Approval</TableHead></TableRow></TableHeader><TableBody>{rows.map((x:any)=><TableRow key={x.agent.id+"-"+x.id}><TableCell>{x.agent.name}</TableCell><TableCell>{x.toolName||x.module}</TableCell><TableCell><Badge variant="secondary">{view==="tools"?(x.enabled?"Enabled":"Disabled"):[x.canRead&&"Read",x.canCreate&&"Create",x.canUpdate&&"Update",x.canExecute&&"Execute"].filter(Boolean).join(" · ")||"None"}</Badge></TableCell><TableCell>{x.requiresApproval?"Required":"No"}</TableCell></TableRow>)}</TableBody></Table>}
  if(!data.length)return <Card><CardContent className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">No persisted {view.replace("-"," ")} records.</CardContent></Card>
  if(view==="activity"||view==="audit-logs")return <OrchestrationConsole title="AI Agent Orchestration Output Console" logs={data.map((x:any)=>({...x,action:x.eventType,details:x.metadata,timestamp:x.createdAt}))}/>
  return <Card><CardContent className="divide-y pt-2">{data.map((x:any)=><div key={x.id} className="flex items-center gap-4 py-4"><div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">{view==="approvals"?<ShieldCheck className="size-4"/>:<Activity className="size-4"/>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{x.title||x.description||x.eventType||"Record #"+x.id}</p><p className="text-xs text-muted-foreground">{x.status||x.modelName||"Recorded"} · {x.createdAt?new Date(x.createdAt).toLocaleString():""}</p></div>{view==="approvals"&&x.status==="PENDING"&&<div className="flex gap-2"><Button size="sm" onClick={async()=>{await AiAgentApprovalsAPI.decide(x.id,"approve");reload()}}>Approve</Button><Button size="sm" variant="outline" onClick={async()=>{await AiAgentApprovalsAPI.decide(x.id,"reject");reload()}}>Reject</Button></div>}</div>)}</CardContent></Card>
}

function AgentForm({agentId,onSaved,onCancel}:{agentId?:string;onSaved:(id:number)=>void;onCancel:()=>void}){
  const empty={name:"",role:"",department:"",description:"",instructions:"",systemPrompt:""}
  const [form,setForm]=useState(empty)
  const [saving,setSaving]=useState(false)
  const [loading,setLoading]=useState(Boolean(agentId))
  const [catalog,setCatalog]=useState<any[]>([])
  const [selectedTools,setSelectedTools]=useState<string[]>([])
  const [selectedModules,setSelectedModules]=useState<string[]>([])
  const [customFunctions,setCustomFunctions]=useState<any[]>([])
  const availableModules=["customer","tickets","tasks","nas","radius","olt","splitter","services","inventory","billing","reports","users","settings"]
  useEffect(()=>{
    Promise.all([AiAgentsAPI.toolCatalog(),agentId?AiAgentsAPI.get(agentId):Promise.resolve(null)]).then(([catalogResult,agentResult]:any)=>{
      setCatalog(catalogResult.data||[])
      if(agentResult?.data){const agent=agentResult.data;setForm({name:agent.name||"",role:agent.role||"",department:agent.department||"",description:agent.description||"",instructions:agent.instructions||"",systemPrompt:agent.systemPrompt||""});setSelectedTools((agent.tools||[]).filter((x:any)=>x.enabled&&!String(x.toolKey).startsWith("custom_")).map((x:any)=>x.toolKey));setSelectedModules((agent.permissions||[]).filter((x:any)=>x.canRead||x.canExecute).map((x:any)=>x.module));setCustomFunctions((agent.tools||[]).filter((x:any)=>String(x.toolKey).startsWith("custom_")).map((x:any)=>({name:x.toolName,description:x.description,riskLevel:x.riskLevel,toolKey:x.toolKey})))}
    }).catch((error:any)=>toast.error(error.message||"Unable to load agent configuration")).finally(()=>setLoading(false))
  },[agentId])
  const enhancePrompt=()=>setForm(current=>({...current,systemPrompt:["You are "+(current.name||"a virtual staff member")+", working as "+(current.role||"the assigned specialist")+" in "+(current.department||"operations")+".","Understand requests written in natural language and keep the active ticket context.",current.instructions||"Complete assigned work accurately and report a concise result.","Use only enabled functions and granted modules: "+(selectedModules.join(", ")||"none selected")+".","Never invent records or expose credentials. Require approval before live, destructive, financial, network, or credential-backed changes.","Update the linked task and support ticket as work progresses. Send completion notification only when the ticket explicitly requests it."].join("\n")}))
  const save=async(stay=false)=>{
    if(!form.name.trim()||!form.role.trim()||!form.department.trim())return toast.error("Name, system role, and department are required")
    setSaving(true)
    try{
      const custom=customFunctions.filter(item=>item.name.trim()).map(item=>({custom:true,toolKey:item.toolKey||"custom_"+item.name.toLowerCase().replace(/[^a-z0-9]+/g,"_"),toolName:item.name,description:item.description,purpose:item.description,riskLevel:item.riskLevel||"HIGH",requiresApproval:true,enabled:true}))
      if(agentId){
        await AiAgentsAPI.update(agentId,form as any)
        await Promise.all([AiAgentsAPI.updatePermissions(agentId,selectedModules),AiAgentsAPI.updateTools(agentId,[...catalog.map(item=>({toolKey:item.toolKey,enabled:selectedTools.includes(item.toolKey)})),...custom])])
        toast.success(form.name+" updated")
        onSaved(Number(agentId))
      }else{
        const result=await AiAgentsAPI.create({...form,tools:[...selectedTools,...custom],permissions:selectedModules} as any)
        toast.success(form.name+" created")
        if(stay){setForm(empty);setSelectedTools([]);setSelectedModules([]);setCustomFunctions([])}else onSaved(result.data.id)
      }
    }catch(error:any){toast.error(error.message||"Unable to save agent")}
    finally{setSaving(false)}
  }
  if(loading)return <DashboardLayout><div className="page-container"><Card><CardContent className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">Loading agent configuration…</CardContent></Card></div></DashboardLayout>
  return <DashboardLayout><div className="page-container max-w-5xl space-y-6"><PageHeader title={agentId?"Edit AI Agent":"Create AI Agent"} description="Define the virtual staff role, behavior, permissions, and callable functions in one place." icon={Bot}/>
    <Card><CardHeader><CardTitle>Identity and system role</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      {["name","role","department"].map(key=><div key={key} className="space-y-2"><Label htmlFor={"agent-"+key}>{key==="role"?"System role":key[0].toUpperCase()+key.slice(1)}</Label><Input id={"agent-"+key} className="h-10" value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></div>)}
      <div className="space-y-2 sm:col-span-2"><Label htmlFor="agent-description">Description</Label><Textarea id="agent-description" className="min-h-24" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
      <div className="space-y-2 sm:col-span-2"><Label htmlFor="agent-instructions">Operating instructions</Label><Textarea id="agent-instructions" className="min-h-28" value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})}/></div>
      <div className="space-y-2 sm:col-span-2"><span className="flex items-center justify-between"><Label htmlFor="agent-prompt">Enhanced system prompt</Label><Button type="button" size="sm" variant="outline" onClick={enhancePrompt}>Generate prompt</Button></span><Textarea id="agent-prompt" className="min-h-40 font-mono text-xs" value={form.systemPrompt} onChange={e=>setForm({...form,systemPrompt:e.target.value})} placeholder="Define behavior, boundaries, workflow, and response style."/></div>
    </CardContent></Card>
    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Module permissions</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2">{availableModules.map(module=><label key={module} className="flex items-center gap-2 rounded-xl border p-3 text-sm"><input type="checkbox" checked={selectedModules.includes(module)} onChange={()=>setSelectedModules(current=>current.includes(module)?current.filter(item=>item!==module):[...current,module])}/><span className="capitalize">{module}</span></label>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Predefined functions</CardTitle></CardHeader><CardContent className="max-h-96 space-y-2 overflow-y-auto">{catalog.map(item=><label key={item.toolKey} className="flex gap-3 rounded-xl border p-3"><input type="checkbox" checked={selectedTools.includes(item.toolKey)} onChange={()=>setSelectedTools(current=>current.includes(item.toolKey)?current.filter(key=>key!==item.toolKey):[...current,item.toolKey])}/><span className="min-w-0"><span className="block text-sm font-semibold">{item.name}</span><span className="block text-xs text-muted-foreground">{item.description}</span>{item.requiresApproval&&<span className="text-[10px] text-amber-600">Approval required · {item.riskLevel}</span>}</span></label>)}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>Custom declarative functions</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-xs text-muted-foreground">Custom functions require approval and an allowlisted backend executor before they can change external systems.</p>{customFunctions.map((item,index)=><div key={index} className="grid gap-3 rounded-xl bg-muted/60 p-3 md:grid-cols-[220px_1fr_120px]"><Input value={item.name} onChange={e=>setCustomFunctions(rows=>rows.map((row,i)=>i===index?{...row,name:e.target.value}:row))} placeholder="Function name"/><Input value={item.description} onChange={e=>setCustomFunctions(rows=>rows.map((row,i)=>i===index?{...row,description:e.target.value}:row))} placeholder="What the function performs"/><select className="h-9 rounded-md border bg-background px-3 text-sm" value={item.riskLevel||"HIGH"} onChange={e=>setCustomFunctions(rows=>rows.map((row,i)=>i===index?{...row,riskLevel:e.target.value}:row))}><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></div>)}<Button type="button" variant="outline" onClick={()=>setCustomFunctions(rows=>[...rows,{name:"",description:"",riskLevel:"HIGH"}])}><Plus/>Add function</Button></CardContent></Card>
    <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={onCancel}>Cancel</Button>{!agentId&&<Button variant="outline" loading={saving} onClick={()=>save(true)}><Plus/>Create and add another</Button>}<Button loading={saving} onClick={()=>save(false)}><Save/>{agentId?"Save changes":"Create agent"}</Button></div>
  </div></DashboardLayout>
}
