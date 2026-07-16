import { Badge } from "@/components/ui/badge"
import type { DeviceStatus } from "@/lib/device-management"
export function DeviceStatusBadge({status}:{status:DeviceStatus}){const classes={online:"bg-emerald-500/15 text-emerald-600 border-emerald-500/30",offline:"bg-slate-500/15 text-slate-500 border-slate-500/30",failure:"bg-red-500/15 text-red-600 border-red-500/30",maintenance:"bg-amber-500/15 text-amber-600 border-amber-500/30"};return <Badge variant="outline" className={classes[status]}><span className="mr-1.5 h-2 w-2 rounded-full bg-current"/>{status}</Badge>}
