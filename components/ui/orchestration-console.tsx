"use client"

import { CheckCircle2, Terminal } from "lucide-react"

type ConsoleLog = {
  id?: number | string
  action?: string
  description?: string
  details?: unknown
  timestamp?: string
  createdAt?: string
  ip?: string | null
  browser?: string | null
  user?: { name?: string | null; email?: string | null } | null
}

function parseDetails(details: unknown) {
  if (!details) return null
  if (typeof details !== "string") return details
  try {
    return JSON.parse(details)
  } catch {
    return { message: details }
  }
}

function timeOf(log: ConsoleLog) {
  const value = log.timestamp || log.createdAt
  if (!value) return "--:--"
  return new Date(value).toLocaleString()
}

function lineFor(log: ConsoleLog, index: number) {
  const action = String(log.action || "EVENT").replace(/_/g, " ")
  const actor = log.user?.name || log.user?.email || "System"
  const details = parseDetails(log.details)
  const focusedDetails = details && Array.isArray((details as any).changes)
    ? { entity: (details as any).entity, id: (details as any).entityId ?? (details as any).id, changes: (details as any).changes }
    : details
  const detailText = focusedDetails ? JSON.stringify(focusedDetails, null, 2) : log.description || "No metadata"
  return {
    action,
    actor,
    detailText,
    time: timeOf(log),
    offset: `00:0${Math.floor(index / 6)}.${String((index + 1) * 12).padStart(2, "0").slice(-2)}`
  }
}

export function OrchestrationConsole({ title = "Real-Time Orchestration Output Console", status = "EXECUTION COMPLETED", logs, empty = "No execution logs found." }: { title?: string; status?: string; logs: ConsoleLog[]; empty?: string }) {
  const visibleLogs = logs || []

  return (
    <section className="overflow-hidden rounded-[24px] border border-border/70 bg-card text-card-foreground shadow-[0_18px_55px_rgba(76,29,149,.08)] dark:border-fuchsia-500/20 dark:bg-[#170a22] dark:text-[#f7efff] dark:shadow-[0_24px_70px_rgba(31,0,51,.22)]">
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/35 px-5 py-4 dark:border-white/10 dark:bg-transparent sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <Terminal className="size-5 shrink-0 text-fuchsia-500" />
          <h3 className="truncate text-sm font-semibold text-foreground dark:text-violet-200 sm:text-base">{title}</h3>
        </div>
        <span className="shrink-0 text-[11px] font-bold tracking-[.18em] text-fuchsia-500">{status}</span>
      </div>

      <div className="max-h-[430px] space-y-4 overflow-y-auto px-5 py-5 font-mono text-[13px] leading-6 sm:px-7">
        {visibleLogs.length === 0 ? (
          <p className="text-muted-foreground dark:text-violet-200/70">{empty}</p>
        ) : (
          visibleLogs.map((log, index) => {
            const line = lineFor(log, index)
            const highlight = index === visibleLogs.length - 1
            return (
              <article key={log.id || index} className={highlight ? "rounded-xl border border-primary/20 bg-primary/[.045] p-4 shadow-sm dark:border-fuchsia-500/30 dark:bg-fuchsia-950/35" : "rounded-xl border border-transparent px-1 py-2"}>
                <p className={highlight ? "font-semibold text-primary dark:text-fuchsia-400" : "text-foreground dark:text-violet-200"}>
                  <span className="text-foreground dark:text-white">[{line.offset}]</span> {line.action} by {line.actor}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground dark:text-violet-200/75">{log.description || line.detailText}</p>
                {line.detailText && log.description && (
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/60 p-3 text-[11px] text-foreground/80 dark:border-white/10 dark:bg-black/20 dark:text-violet-100/80">{line.detailText}</pre>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground dark:text-violet-300/70">
                  <span>{line.time}</span>
                  {log.ip && <span>IP {log.ip}</span>}
                  {log.browser && <span className="truncate">Browser {log.browser}</span>}
                </div>
              </article>
            )
          })
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/70 bg-muted/25 px-5 py-4 text-xs dark:border-white/10 dark:bg-transparent sm:px-7">
        <span className="text-muted-foreground dark:text-violet-300">State Rollback Safeguard: Armed & Ready</span>
        <span className="flex items-center gap-2 font-semibold text-foreground dark:text-white"><CheckCircle2 className="size-4 text-emerald-500 dark:text-fuchsia-500" />Audit record logged</span>
      </div>
    </section>
  )
}
