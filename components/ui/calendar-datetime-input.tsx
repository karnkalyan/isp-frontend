"use client"

import type { ComponentProps } from "react"
import { Input } from "@/components/ui/input"
import { NepaliDatePicker } from "@/components/ui/nepali-date-picker"
import { useCalendarSystem } from "@/contexts/CalendarSystemContext"
import { adToBs, bsToAd } from "@/lib/calendar-system"

type Props = Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value?: string
  onChange?: (value: string) => void
}

export function CalendarDateTimeInput({ value = "", onChange, className, ...props }: Props) {
  const { system } = useCalendarSystem()
  if (system === "AD") return <Input {...props} className={className} type="datetime-local" value={value} onChange={event => onChange?.(event.target.value)} />
  const [date = "", time = ""] = value.split("T")
  const emit = (nextDate: string, nextTime: string) => onChange?.(nextDate ? `${nextDate}T${nextTime || "00:00"}` : "")
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_8.5rem] gap-2 ${className || ""}`}>
      <NepaliDatePicker value={adToBs(date)} onChange={bs => emit(bsToAd(bs), time)} placeholder="Select BS date" />
      <Input {...props} type="time" value={time} onChange={event => emit(date, event.target.value)} aria-label="Time" />
    </div>
  )
}
