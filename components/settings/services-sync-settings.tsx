"use client"

import { useState } from "react"
import { Globe, Server, Building, Calendar, Cpu, Phone, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { apiRequest } from "@/lib/api"

type SyncService = {
  id: string
  name: string
  description: string
  icon: any
  endpoint: string
  method: "GET" | "POST"
  successMessage: string
}

const SYNC_SERVICES: SyncService[] = [
  {
    id: "radius-plans",
    name: "RADIUS Internet Plans",
    description: "Sync all package profiles and speed limits with the active RADIUS server databases.",
    icon: Globe,
    endpoint: "/pkgplan/resync",
    method: "POST",
    successMessage: "Plans synced successfully from DB & RADIUS server!"
  },
  {
    id: "radius-nas",
    name: "RADIUS NAS Servers",
    description: "Fetch and reload Network Access Servers (NAS) from the RADIUS authentication database.",
    icon: Server,
    endpoint: "/nas/resync",
    method: "GET",
    successMessage: "NAS servers synced successfully!"
  },
  {
    id: "account-packages",
    name: "Account Packages",
    description: "Sync and update package rate plans and items with the configured Accounting Account service.",
    icon: Building,
    endpoint: "/package-price/resync",
    method: "POST",
    successMessage: "Package prices synced successfully with Account!"
  },
  {
    id: "account-addons",
    name: "Account Addons",
    description: "Sync consumable charges, setup fees, and customized extra fees with Accounting Account service.",
    icon: Calendar,
    endpoint: "/extra-charges/sync",
    method: "POST",
    successMessage: "Extra addon charges synced successfully with Account!"
  },
  {
    id: "tr069-devices",
    name: "TR-069 ACS Devices",
    description: "Discover, fetch, and synchronize active CPE devices connected to the TR-069 ACS server.",
    icon: Cpu,
    endpoint: "/tr069-devices/sync",
    method: "POST",
    successMessage: "TR-069 ACS devices synced successfully!"
  },
  {
    id: "yeastar-voip",
    name: "Yeastar VoIP PBX",
    description: "Synchronize voice extensions, call details, and logs from the Yeastar PBX server.",
    icon: Phone,
    endpoint: "/yeaster/sync/all",
    method: "POST",
    successMessage: "Yeastar PBX data synced successfully!"
  }
]

export function ServicesSyncSettings() {
  const [syncingState, setSyncingState] = useState<Record<string, boolean>>({})

  const handleSync = async (service: SyncService) => {
    setSyncingState(prev => ({ ...prev, [service.id]: true }))
    const toastId = toast.loading(`Syncing ${service.name}...`)
    try {
      const res = await apiRequest<{ success?: boolean; message?: string }>(service.endpoint, {
        method: service.method
      })
      toast.success(res?.message || service.successMessage, { id: toastId })
    } catch (err: any) {
      console.error(`Sync failed for ${service.name}:`, err)
      toast.error(err?.message || `Failed to sync ${service.name}`, { id: toastId })
    } finally {
      setSyncingState(prev => ({ ...prev, [service.id]: false }))
    }
  }

  const handleSyncAll = async () => {
    const activeSyncs = Object.values(syncingState).some(state => state)
    if (activeSyncs) {
      toast.error("Please wait until current sync operations complete.")
      return
    }

    const toastId = toast.loading("Triggering sync for all services...")
    
    // We will fire all sync requests in parallel
    const promises = SYNC_SERVICES.map(async (service) => {
      setSyncingState(prev => ({ ...prev, [service.id]: true }))
      try {
        await apiRequest(service.endpoint, { method: service.method })
        return { name: service.name, success: true }
      } catch (err) {
        return { name: service.name, success: false }
      } finally {
        setSyncingState(prev => ({ ...prev, [service.id]: false }))
      }
    })

    const results = await Promise.all(promises)
    const failures = results.filter(r => !r.success)

    if (failures.length === 0) {
      toast.success("All integrated services synced successfully!", { id: toastId })
    } else if (failures.length === SYNC_SERVICES.length) {
      toast.error("Failed to sync all services. Check connection configurations.", { id: toastId })
    } else {
      toast.success(`Synced partially. Failed for: ${failures.map(f => f.name).join(", ")}`, {
        id: toastId,
        duration: 5000
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl border">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Global Sync Action</h4>
          <p className="text-xs text-muted-foreground">Trigger sequential synchronization across all configured integrations.</p>
        </div>
        <Button
          onClick={handleSyncAll}
          disabled={Object.values(syncingState).some(state => state)}
          className="bg-primary hover:bg-primary/95 text-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Sync All Services
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SYNC_SERVICES.map((service) => {
          const Icon = service.icon
          const isSyncing = syncingState[service.id] || false

          return (
            <div
              key={service.id}
              className="flex flex-col justify-between p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-sm text-foreground">{service.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{service.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t flex justify-end">
                <Button
                  onClick={() => handleSync(service)}
                  disabled={isSyncing}
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 border-slate-200 dark:border-slate-800"
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
