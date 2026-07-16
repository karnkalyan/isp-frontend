"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Activity, ArrowLeft, ChevronDown, ChevronRight, Clipboard, Command, Loader2, Menu, PanelRight, RefreshCw, Search, Server, ShieldAlert, Star, Terminal as TerminalIcon, Wrench } from "lucide-react"
import toast from "react-hot-toast"
import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/AuthContext"
import { useDeviceSession } from "@/contexts/DeviceSessionContext"
import { deviceApi, type ManagedDevice } from "@/lib/device-management"
import { resolveDeviceMenu, type DeviceMenuItem } from "@/lib/device-menu-registry"
import { DeviceDataWidget } from "./device-data-widget"
import { DeviceLiveCharts } from "./device-live-charts"
import { DeviceStatusBadge } from "./device-status-badge"

const capabilities: Record<string, string> = {
  "vlans-create-vlan": "cisco.createVlan",
  "vlans-rename-vlan": "cisco.renameVlan",
  "interfaces-access-ports": "cisco.configureAccessPort",
  "interfaces-trunk-ports": "cisco.configureTrunkPort",
  "port-channels-etherchannel": "cisco.createPortChannel",
  "switching-create-vlan": "juniper.createVlan",
  "switching-access-port": "juniper.configureAccessPort",
  "switching-trunk-ports": "juniper.configureTrunkPort",
  "interfaces-add-bridge": "mikrotik.createBridge",
  "interfaces-add-bridge-port": "mikrotik.addBridgePort",
  "interfaces-add-vlan": "mikrotik.createVlan",
  "ip-add-address": "mikrotik.addIpAddress",
  "ip-add-route": "mikrotik.addRoute",
  "operations-edit-ip-address": "mikrotik.updateIpAddress",
  "operations-remove-ip-address": "mikrotik.removeIpAddress",
  "operations-edit-route": "mikrotik.updateRoute",
  "operations-remove-route": "mikrotik.removeRoute",
  "operations-edit-vlan": "mikrotik.updateVlan",
  "operations-remove-vlan": "mikrotik.removeVlan",
  "operations-remove-bridge": "mikrotik.removeBridge",
  "operations-remove-bridge-port": "mikrotik.removeBridgePort",
  "operations-interface-state": "mikrotik.setInterfaceState",
}

export function NetworkAdminShell({ deviceId, sectionPath }: { deviceId: number; sectionPath: string[] }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const session = useDeviceSession()
  const [device, setDevice] = useState<ManagedDevice | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(true)
  const [payloadBusy, setPayloadBusy] = useState(false)
  const [payload, setPayload] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [sidebar, setSidebar] = useState(true)
  const [contextOpen, setContextOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const section = sectionPath.at(-1) || "overview"
  const permissions = useMemo(() => {
    const values = user?.role?.permissions?.map(permission => permission.name) || []
    return ["Administrator", "Global Manager"].includes(user?.role?.name || "") ? ["*", ...values] : values
  }, [user])
  const load = useCallback(async () => {
    try {
      setBusy(true)
      const response = await deviceApi.get(deviceId)
      setDevice(response.data)
      setError("")
    } catch (caught: any) {
      setError(caught.message || "Could not load device")
    } finally {
      setBusy(false)
    }
  }, [deviceId])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem(`device-favorites:${deviceId}`) || "[]"))
      setContextOpen(localStorage.getItem("network-admin:context-open") === "true")
    } catch { /* browser storage is optional */ }
  }, [deviceId])

  const menu = useMemo(() => device ? resolveDeviceMenu(device, permissions) : [], [device, permissions])
  const flat = useMemo(() => flatten(menu), [menu])
  const selected = flat.find(item => item.key === section) || flat[0]
  useEffect(() => {
    if (!device || !selected?.liveSupported || capabilities[selected.key] || ["overview", "terminal", "connection-diagnostics"].includes(selected.module || selected.key)) return
    let active = true
    let loading = false
    const module = selected.module || selected.key
    const refresh = async (initial = false) => {
      if (loading) return
      loading = true
      if (initial) setPayloadBusy(true)
      try {
        const response = await deviceApi.module(device.id, module)
        if (active) setPayload(response.data)
      } catch (caught: any) {
        if (active) {
          if (initial) setPayload(null)
          toast.error(caught.message)
        }
      } finally {
        loading = false
        if (active && initial) setPayloadBusy(false)
      }
    }
    refresh(true)
    const timer = module === "logs" ? window.setInterval(() => refresh(false), 5000) : null
    return () => { active = false; if (timer !== null) window.clearInterval(timer) }
  }, [device, selected?.key, selected?.liveSupported, selected?.module])

  const go = (item: DeviceMenuItem) => router.push(`/network-admin/devices/${deviceId}/${item.key}`)
  const toggleFavorite = (key: string) => setFavorites(current => {
    const next = current.includes(key) ? current.filter(value => value !== key) : [...current, key]
    localStorage.setItem(`device-favorites:${deviceId}`, JSON.stringify(next))
    return next
  })
  const toggleContext = () => setContextOpen(current => {
    localStorage.setItem("network-admin:context-open", String(!current))
    return !current
  })

  if (authLoading || busy) return <FullState icon={<Loader2 className="size-8 animate-spin" />} text="Opening secure device workspace…" />
  if (error || !device) return <FullState icon={<ShieldAlert className="size-9 text-destructive" />} text={error || "Device not found"} action={<Button onClick={load}>Retry</Button>} />

  return <div className="flex h-dvh overflow-hidden bg-background text-foreground">
    <aside className={`${sidebar ? "w-64" : "w-0"} shrink-0 overflow-hidden border-r bg-[color:var(--sidebar)] transition-all`}>
      <div className="flex h-14 items-center border-b px-4"><BrandLogo variant="wide" priority className="h-7 max-w-[180px]" /><span className="sr-only">Kashtrix Network</span></div>
      <div className="p-2"><div className="relative"><Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-8 pl-8 text-xs" placeholder="Search device menu" /></div></div>
      <ScrollArea className="h-[calc(100dvh-7rem)]"><nav className="space-y-0.5 p-2">{menu.map(item => <MenuNode key={item.key} item={item} selected={section} search={search} favorite={favorites.includes(item.key)} onSelect={go} onFavorite={toggleFavorite} />)}</nav></ScrollArea>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3">
        <Button size="icon" variant="ghost" onClick={() => setSidebar(current => !current)}><Menu className="size-4" /></Button>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h1 className="truncate text-sm font-semibold">{device.name}</h1><Badge variant="outline" className="text-[10px]">{device.vendor}</Badge><DeviceStatusBadge status={device.status} /></div><div className="truncate font-mono text-[11px] text-muted-foreground">{device.platform || device.deviceType} · {device.host}:{device.managementPort}</div></div>
        <Badge variant="outline" className="hidden text-[10px] md:inline-flex">{session.connectionState} · {device.preferredProtocol || device.communicationMethod} primary · {session.protocol || device.communicationMethod} active</Badge>
        <Badge variant="secondary" className="hidden text-[10px] lg:inline-flex">No pending changes</Badge>
        <Button size="icon" variant="ghost" onClick={() => { session.refresh(); toast.success("Live refresh requested") }}><RefreshCw className="size-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => router.push(`/network-admin/devices/${device.id}/terminal`)}><TerminalIcon className="size-4" /></Button>
        <ThemeToggle />
        <Button size="icon" variant="ghost" onClick={toggleContext}><PanelRight className="size-4" /></Button>
        <Button variant="outline" size="sm" className="hidden lg:inline-flex" asChild><Link href={`/device-management/${device.deviceType}`}><ArrowLeft className="mr-1 size-3" />Kashtrix</Link></Button>
      </header>
      <main className="min-w-0 flex-1 overflow-auto bg-muted/20 p-3"><div className="w-full"><div className="mb-3"><h2 className="text-lg font-semibold capitalize">{selected?.label || "Overview"}</h2><p className="text-xs text-muted-foreground">Live data and controlled operations for this device.</p></div><DeviceContent device={device} selected={selected} payload={payload} busy={payloadBusy} session={session} /></div></main>
    </div>
    {contextOpen && <aside className="hidden w-72 shrink-0 overflow-auto border-l bg-background p-3 xl:block"><h3 className="mb-2 text-sm font-semibold">Device context</h3><ContextRow label="Vendor" value={device.vendor} /><ContextRow label="Model" value={device.model || "Not detected"} /><ContextRow label="OS" value={[device.operatingSystem, device.operatingSystemVersion].filter(Boolean).join(" ") || "Not detected"} /><ContextRow label="Management" value={`${device.host}:${device.managementPort}`} /><ContextRow label="Credentials" value={device.credential?.configured ? "Encrypted and configured" : "Not configured"} />{(device.preferredProtocol === "SNMP" || device.fallbackProtocols?.includes("SNMP")) && <ContextRow label="SNMP" value={`${String(device.snmpVersion || "v2c").toUpperCase()} · UDP ${device.snmpPort || 161}`} />}<ContextRow label="SSH profile" value={device.sshProfile || "AUTO"} /><ContextRow label="Last success" value={device.lastSuccessfulConnectionAt ? new Date(device.lastSuccessfulConnectionAt).toLocaleString() : "Never"} /></aside>}
  </div>
}

function MenuNode({ item, selected, search, favorite, onSelect, onFavorite }: { item: DeviceMenuItem; selected: string; search: string; favorite: boolean; onSelect: (item: DeviceMenuItem) => void; onFavorite: (key: string) => void }) {
  const [open, setOpen] = useState(true)
  const children = item.children?.filter(child => !search || child.label.toLowerCase().includes(search.toLowerCase()))
  if (search && !item.label.toLowerCase().includes(search.toLowerCase()) && !children?.length) return null
  return <div><div className={`group flex items-center rounded-md ${selected === item.key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}><button className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-xs" onClick={() => item.children?.length ? setOpen(current => !current) : onSelect(item)}>{item.children?.length ? (open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />) : <Server className="size-3.5" />}<span className="truncate">{item.label}</span></button><button className="px-2 opacity-0 group-hover:opacity-100" onClick={() => onFavorite(item.key)}><Star className={`size-3 ${favorite ? "fill-current" : ""}`} /></button></div>{open && children?.length ? <div className="ml-4 border-l pl-1">{children.map(child => <button key={child.key} onClick={() => onSelect(child)} className={`block w-full rounded px-2 py-1 text-left text-[11px] ${selected === child.key ? "bg-primary/15 text-primary" : child.liveSupported ? "hover:bg-muted" : "opacity-45"}`}>{child.label}</button>)}</div> : null}</div>
}

function DeviceContent({ device, selected, payload, busy, session }: { device: ManagedDevice; selected?: DeviceMenuItem; payload: any; busy: boolean; session: ReturnType<typeof useDeviceSession> }) {
  if (!selected) return null
  const streamedPayload = ["interfaces-live-traffic", "traffic"].includes(selected.module || "") ? (session.snapshot as any)?.telemetry : null
  const activePayload = streamedPayload?.view ? streamedPayload : payload
  if (capabilities[selected.key]) return <CapabilityPreview device={device} capabilityKey={capabilities[selected.key]} />
  if (!selected.liveSupported) return <Empty icon={<ShieldAlert className="size-9" />} text={selected.disabledReason || "This capability is not verified for this device."} />
  if (selected.key === "overview") return <Overview device={device} session={session} />
  if (selected.module === "connection-diagnostics") return <Diagnostics device={device} />
  if (selected.module === "terminal") return <SecureTerminal device={device} />
  if (busy) return <Empty icon={<Loader2 className="size-8 animate-spin" />} text="Loading verified device data…" />
  return activePayload?.view ? <DeviceDataWidget payload={activePayload} title={`${selected.label}${streamedPayload?.view ? " (live)" : ""}`} /> : <Empty icon={<Activity className="size-9" />} text="No normalized data is available for this capability." />
}

function Overview({ device, session }: { device: ManagedDevice; session: ReturnType<typeof useDeviceSession> }) {
  const snapshot: any = session.snapshot || {}
  const widgets = [["Connection", session.connectionState], ["Configured primary", device.preferredProtocol || device.communicationMethod], ["Live protocols", snapshot.connection?.protocols?.join(" + ") || session.protocol || device.communicationMethod], ["Last update", session.lastUpdateAt ? new Date(session.lastUpdateAt).toLocaleTimeString() : "Collecting live counters…"]]
  const systemFields = { ...(snapshot.system?.view?.items?.[0] || {}), ...(snapshot.system?.view?.fields || {}) }
  const healthFields = { ...(snapshot.health?.view?.items?.[0] || {}), ...(snapshot.health?.view?.fields || {}) }
  const interfaceSummary = snapshot.interfaces?.view?.summary || snapshot.interfaces?.summary || {}
  const facts = [["Model", systemFields.Product || device.model || "Not detected"], ["Software", systemFields["Software Version"] || device.operatingSystemVersion || device.firmwareVersion || "Not detected"], ["Uptime", typeof systemFields.Uptime === "object" ? systemFields.Uptime.display : systemFields.Uptime || "Collecting"], ["Interfaces", interfaceSummary.total ?? snapshot.interfaces?.view?.items?.length ?? "Collecting"], ["Interfaces up", interfaceSummary.up ?? "Collecting"], ["Temperature", healthFields["Maximum Temperature"] == null ? "Not exposed" : `${healthFields["Maximum Temperature"]} °C`]]
  const live = [["System information", snapshot.system], ["Health and environment", snapshot.health], ["Interfaces and traffic", snapshot.interfaces], ["Routing", snapshot.routing]] as const
  return <div className="space-y-3"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{widgets.map(([label, value]) => <Card key={label} className="border-primary/10 bg-gradient-to-br from-card to-primary/[0.035] p-3"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 truncate font-mono text-sm font-semibold">{value}</div></Card>)}</div><Card className="p-3"><div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Server className="size-3.5 text-primary"/>Live OLT summary</div><div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">{facts.map(([label,value])=><div key={label} className="rounded-md border bg-muted/20 p-2"><div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 truncate font-mono text-xs font-semibold">{String(value)}</div></div>)}</div></Card><DeviceLiveCharts snapshot={snapshot} lastUpdateAt={session.lastUpdateAt}/>{live.map(([title,item]) => item?.view ? <DeviceDataWidget key={title} payload={item} title={title} /> : item?.partialFailure ? <Card key={title} className="border-amber-500/30 p-3 text-xs"><div className="font-semibold">{title} temporarily unavailable</div><div className="mt-1 text-muted-foreground">{item.message || item.errorCode}</div></Card> : null)}{session.errorMessage && <Card className="border-destructive/40 p-3 text-xs text-destructive">{session.errorMessage}</Card>}</div>
}

function Diagnostics({ device }: { device: ManagedDevice }) {
  const [data, setData] = useState<any>()
  useEffect(() => { deviceApi.diagnostics(device.id).then(response => setData(response.data)).catch((caught: any) => toast.error(caught.message)) }, [device.id])
  if (!data) return <Empty icon={<Loader2 className="size-8 animate-spin" />} text="Loading connection diagnostics…" />
  const last = data.last || {}
  return <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{Object.entries(last).filter(([, value]) => typeof value !== "object").map(([key, value]) => <Card key={key} className="p-3"><div className="text-[10px] text-muted-foreground">{key}</div><div className="mt-1 break-all font-mono text-xs">{String(value ?? "Unknown")}</div></Card>)}</div>
}

const suggestions: Record<string, string[]> = { mikrotik: ["/system resource print", "/interface print", "/ip route print"], cisco: ["show version", "show interfaces status", "show vlan"], "huawei-olt": ["display board 0", "display ont info summary 0/0", "display alarm active"], "juniper-switch": ["show interfaces terse", "show vlans", "show ethernet-switching table"], "nokia-bng": ["show system information", "show port", "show service active-subscribers"], "linux-server": ["uptime", "free -m", "ip address"] }
function SecureTerminal({ device }: { device: ManagedDevice }) {
  const [command, setCommand] = useState("")
  const [lines, setLines] = useState<string[]>(["Read-only audited terminal. Configuration commands are blocked."])
  const [busy, setBusy] = useState(false)
  const run = async (value = command.trim()) => { if (!value || busy) return; setCommand(""); setLines(current => [...current, `${device.name}> ${value}`]); setBusy(true); try { const response = await deviceApi.command(device.id, value); setLines(current => [...current, String(response.data.output || "(no output)")]) } catch (caught: any) { setLines(current => [...current, `ERROR: ${caught.message}`]) } finally { setBusy(false) } }
  return <Card className="overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2 text-[11px]"><span>{device.name} · audited read only</span><Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(lines.join("\n"))}><Clipboard className="mr-1 size-3" />Copy</Button></div><div className="flex flex-wrap gap-1 border-b border-zinc-800 p-2">{(suggestions[device.deviceType] || []).map(item => <button key={item} onClick={() => run(item)} className="rounded bg-zinc-800 px-2 py-1 font-mono text-[10px] hover:bg-zinc-700">{item}</button>)}</div><pre className="h-[55dvh] overflow-auto p-3 font-mono text-xs whitespace-pre-wrap text-emerald-400">{lines.join("\n")}</pre><div className="flex items-center border-t border-zinc-800 px-3"><span className="font-mono text-emerald-400">$</span><Input value={command} onChange={event => setCommand(event.target.value)} onKeyDown={event => { if (event.key === "Enter") run() }} className="border-0 bg-transparent font-mono text-zinc-100 focus-visible:ring-0" placeholder="Enter an allowlisted read command" /><Button size="sm" onClick={() => run()} disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : "Run"}</Button></div></Card>
}

function CapabilityPreview({ device, capabilityKey }: { device: ManagedDevice; capabilityKey: string }) {
  const [input, setInput] = useState<Record<string, string>>({})
  const [task, setTask] = useState<any>()
  const [busy, setBusy] = useState(false)
  const mikrotikFields:Record<string,string[]>={"mikrotik.createVlan":["name","vlanId","interface"],"mikrotik.createBridge":["name"],"mikrotik.addBridgePort":["bridge","interface"],"mikrotik.addIpAddress":["address","interface"],"mikrotik.addRoute":["dstAddress","gateway"],"mikrotik.updateIpAddress":["id","address","interface"],"mikrotik.removeIpAddress":["id"],"mikrotik.updateRoute":["id","dstAddress","gateway"],"mikrotik.removeRoute":["id"],"mikrotik.updateVlan":["id","name","vlanId","interface"],"mikrotik.removeVlan":["id"],"mikrotik.removeBridge":["id"],"mikrotik.removeBridgePort":["id"],"mikrotik.setInterfaceState":["id","state"]}
  const fields = mikrotikFields[capabilityKey] || (capabilityKey.endsWith("createVlan") ? ["vlanId", "name"] : capabilityKey.endsWith("renameVlan") ? ["vlanId", "name"] : capabilityKey.endsWith("createPortChannel") ? ["channelId", "members", "mode"] : capabilityKey === "cisco.configureTrunkPort" ? ["interfaces", "nativeVlan", "allowedVlans"] : capabilityKey === "juniper.configureTrunkPort" ? ["interface", "vlanNames"] : capabilityKey === "juniper.configureAccessPort" ? ["interface", "vlanName"] : ["interface", "vlanId", "description"])
  const preview = async () => { setBusy(true); try { const prepared = { ...input, ...(input.members ? { members: input.members.split(",").map(value => value.trim()) } : {}) }; const response = await deviceApi.previewTask(device.id, { capabilityKey, input: prepared }); setTask(response.data); toast.success("Audited preview created") } catch (caught: any) { toast.error(caught.message) } finally { setBusy(false) } }
  const approveAndRun = async () => { if (!task || !window.confirm(`Apply this ${task.riskLevel || "high"}-risk change to ${device.name}? A backup and audit record will be created first.`)) return; setBusy(true); try { const approved = await deviceApi.approveTask(device.id, task.id); setTask(approved.data); const executed = await deviceApi.executeTask(device.id, task.id); setTask(executed.data); toast.success("Change executed and verified"); setTimeout(()=>window.location.reload(),600) } catch (caught: any) { toast.error(caught.message) } finally { setBusy(false) } }
  return <div className="grid gap-3 lg:grid-cols-2"><Card className="space-y-3 p-4"><h3 className="text-sm font-semibold">Configuration input</h3>{fields.map(field => <label key={field} className="block space-y-1"><span className="text-[11px] capitalize text-muted-foreground">{field}</span><Input className="h-8 text-xs" value={input[field] || ""} onChange={event => setInput(current => ({ ...current, [field]: event.target.value }))} /></label>)}<Button size="sm" onClick={preview} disabled={busy}><Wrench className="mr-1 size-3" />Build preview</Button></Card><Card className="p-4"><h3 className="text-sm font-semibold">Proposed change</h3>{task ? <div className="mt-3 space-y-3"><Badge>{task.status}</Badge><pre className="max-h-72 overflow-auto rounded bg-muted p-3 font-mono text-[11px]">{(task.proposedCommands || []).join("\n")}</pre>{task.status === "WAITING_FOR_APPROVAL" && <Button size="sm" variant="destructive" onClick={approveAndRun} disabled={busy}>Approve, back up and execute</Button>}<p className="text-[11px] text-muted-foreground">Execution is server-gated, backed up, audited, and verified.</p></div> : <Empty icon={<Command className="size-7" />} text="Enter values to build a validated command preview." />}</Card></div>
}

function ContextRow({ label, value }: { label: string; value: string }) { return <div className="border-b py-2 last:border-0"><div className="text-[10px] text-muted-foreground">{label}</div><div className="break-words text-xs font-medium">{value}</div></div> }
function Empty({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="grid min-h-48 place-items-center text-center text-xs text-muted-foreground"><div className="space-y-2">{icon}<p>{text}</p></div></div> }
function FullState({ icon, text, action }: { icon: React.ReactNode; text: string; action?: React.ReactNode }) { return <div className="grid h-dvh place-items-center bg-background text-foreground"><div className="space-y-3 text-center">{icon}<p>{text}</p>{action}</div></div> }
function flatten(items: DeviceMenuItem[]): DeviceMenuItem[] { return items.flatMap(item => [item, ...flatten(item.children || [])]) }
