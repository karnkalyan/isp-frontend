"use client"

import type { ComponentProps } from "react"
import { Input } from "@/components/ui/input"
import { NepaliDatePicker } from "@/components/ui/nepali-date-picker"
import { useCalendarSystem } from "@/contexts/CalendarSystemContext"
import { adToBs, bsToAd } from "@/lib/calendar-system"

type Props = Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange"> & { value?: string; onChange?: (adDate: string, bsDate: string) => void }

export function CalendarDateInput({ value = "", onChange, className, ...props }: Props) {
  const { system } = useCalendarSystem()
  if (system === "BS") return <NepaliDatePicker value={adToBs(value)} className={className} onChange={bs => onChange?.(bsToAd(bs), bs)} placeholder="Select BS date" />
  return <Input {...props} className={className} type="date" value={value} onChange={event => onChange?.(event.target.value, adToBs(event.target.value))} />
}
