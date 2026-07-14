import { cn } from "@/lib/utils"

export function FormSection({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return <section className={cn("space-y-3 border-b pb-5 last:border-0 last:pb-0", className)}><div><h2 className="font-heading text-sm font-semibold">{title}</h2>{description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}</div><div className="grid gap-3 sm:grid-cols-2">{children}</div></section>
}
