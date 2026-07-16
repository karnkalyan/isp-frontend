import { NepaliFunctions } from "@/lib/nepaliFunctions"

export type CalendarSystem = "AD" | "BS"

export function adToBs(value?: string | Date | null): string {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  try {
    const result = NepaliFunctions.AD2BS({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() })
    return `${result.year}-${String(result.month).padStart(2, "0")}-${String(result.day).padStart(2, "0")}`
  } catch { return "" }
}

export function bsToAd(value?: string | null): string {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return ""
  try {
    const result = NepaliFunctions.BS2AD({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) })
    return `${result.year}-${String(result.month).padStart(2, "0")}-${String(result.day).padStart(2, "0")}`
  } catch { return "" }
}

export function formatSystemDate(value: string | Date | null | undefined, system: CalendarSystem) {
  if (!value) return "—"
  if (system === "BS") return adToBs(value) || "—"
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString()
}
