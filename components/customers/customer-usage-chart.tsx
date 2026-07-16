"use client"

import { useMemo, useState } from "react"
import { useTheme } from "next-themes"
import { Activity, Loader2 } from "lucide-react"
import { CardContainer } from "@/components/ui/card-container"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export type CustomerUsagePoint = { date: string; upload: number; download: number; total?: number; duration?: number; count?: number }
type Period = "daily" | "weekly" | "monthly"
interface CustomerUsageChartProps { className?: string; data: CustomerUsagePoint[]; loading?: boolean }

const startOfWeek=(value:Date)=>{const date=new Date(value);const day=date.getUTCDay()||7;date.setUTCDate(date.getUTCDate()-day+1);return date.toISOString().slice(0,10)}
const aggregate=(rows:CustomerUsagePoint[],period:Period)=>{
  const groups=new Map<string,{upload:number;download:number}>()
  for(const row of rows){const date=new Date(row.date);if(Number.isNaN(date.getTime()))continue;const key=period==="daily"?date.toISOString().slice(0,10):period==="weekly"?startOfWeek(date):date.toISOString().slice(0,7);const current=groups.get(key)||{upload:0,download:0};current.upload+=Number(row.upload||0);current.download+=Number(row.download||0);groups.set(key,current)}
  const limit=period==="daily"?31:period==="weekly"?16:12
  return [...groups.entries()].sort(([a],[b])=>a.localeCompare(b)).slice(-limit).map(([date,value])=>({date,upload:value.upload/1073741824,download:value.download/1073741824}))
}

export function CustomerUsageChart({className,data,loading=false}:CustomerUsageChartProps){
  const {resolvedTheme}=useTheme(),dark=resolvedTheme==="dark"
  const [period,setPeriod]=useState<Period>("daily")
  const periods=useMemo(()=>({daily:aggregate(data,"daily"),weekly:aggregate(data,"weekly"),monthly:aggregate(data,"monthly")}),[data])
  if(loading)return <CardContainer title="Traffic graphs" className={className}><div className="grid h-72 place-items-center text-sm text-muted-foreground"><Loader2 className="size-6 animate-spin"/></div></CardContainer>
  return <CardContainer title="Traffic graphs" className={className}><Tabs value={period} onValueChange={value=>setPeriod(value as Period)} className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><TabsList><TabsTrigger value="daily">Daily</TabsTrigger><TabsTrigger value="weekly">Weekly</TabsTrigger><TabsTrigger value="monthly">Monthly</TabsTrigger></TabsList><div className="flex gap-3 text-xs text-muted-foreground"><span><i className="mr-1 inline-block size-2.5 rounded-full bg-blue-500"/>Download</span><span><i className="mr-1 inline-block size-2.5 rounded-full bg-emerald-500"/>Upload</span></div></div><UsageGraph rows={periods[period]} dark={dark}/></Tabs></CardContainer>
}

function UsageGraph({rows,dark}:{rows:Array<{date:string;upload:number;download:number}>;dark:boolean}){
  if(!rows.length)return <div className="grid h-72 place-items-center text-center text-sm text-muted-foreground"><div><Activity className="mx-auto mb-2 size-7"/>No RADIUS usage records are available for this period.</div></div>
  return <div className="h-72 min-h-72 min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{width:640,height:288}}><LineChart data={rows} margin={{top:10,right:18,left:6,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke={dark?"#334155":"#e2e8f0"}/><XAxis dataKey="date" tick={{fill:dark?"#94a3b8":"#64748b",fontSize:10}}/><YAxis tick={{fill:dark?"#94a3b8":"#64748b",fontSize:10}} unit=" GB" width={68}/><Tooltip formatter={(value:number,name:string)=>[`${Number(value).toFixed(3)} GB`,name==="download"?"Download":"Upload"]} contentStyle={{backgroundColor:dark?"#0f172a":"#fff",borderColor:dark?"#334155":"#e2e8f0"}}/><Line type="monotone" dataKey="download" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{r:4}}/><Line type="monotone" dataKey="upload" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{r:4}}/></LineChart></ResponsiveContainer></div>
}
