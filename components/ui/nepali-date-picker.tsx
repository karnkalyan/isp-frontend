"use client"

import React, { useState, useEffect } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NepaliFunctions } from "@/lib/nepaliFunctions"

interface NepaliDatePickerProps {
  value?: string // YYYY-MM-DD
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
}

export function NepaliDatePicker({
  value = "",
  onChange,
  placeholder = "Select Nepali Date",
  className,
}: NepaliDatePickerProps) {
  const [open, setOpen] = useState(false)
  
  // Current viewed month/year in the calendar
  const [viewYear, setViewYear] = useState<number>(2083)
  const [viewMonth, setViewMonth] = useState<number>(3) // 1-indexed (1-12)
  
  // Selected date parsed
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null)

  // Initialize from value
  useEffect(() => {
    if (value) {
      const parts = value.split("-")
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10)
        const d = parseInt(parts[2], 10)
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          setSelectedDate({ year: y, month: m, day: d })
          setViewYear(y)
          setViewMonth(m)
          return
        }
      }
    }
    // Default to current BS date
    try {
      const cur = NepaliFunctions.GetCurrentBsDate()
      setViewYear(cur.year)
      setViewMonth(cur.month)
    } catch (e) {
      setViewYear(2083)
      setViewMonth(3)
    }
  }, [value])

  const handlePrevMonth = () => {
    setViewMonth((prev) => {
      if (prev === 1) {
        setViewYear((y) => y - 1)
        return 12
      }
      return prev - 1
    })
  }

  const handleNextMonth = () => {
    setViewMonth((prev) => {
      if (prev === 12) {
        setViewYear((y) => y + 1)
        return 1
      }
      return prev + 1
    })
  }

  const handleDaySelect = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelectedDate({ year: viewYear, month: viewMonth, day })
    setOpen(false)
    if (onChange) {
      onChange(dateStr)
    }
  }

  const daysInMonth = NepaliFunctions.GetDaysInBsMonth(viewYear, viewMonth) || 30
  
  // Find starting day index (0 = Sun, 1 = Mon, etc.)
  let startDayIndex = 0
  try {
    const adDate = NepaliFunctions.BS2AD({ year: viewYear, month: viewMonth, day: 1 })
    startDayIndex = new Date(adDate.year, adDate.month - 1, adDate.day).getDay()
  } catch (e) {
    startDayIndex = 0
  }

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanksArray = Array.from({ length: startDayIndex }, (_, i) => i)

  const monthNames = NepaliFunctions.GetBsMonths() // English names: Baisakh, Jestha...
  const nepaliMonthNames = NepaliFunctions.GetBsMonthsInUnicode() // Nepali names

  const weekDaysShort = ["S", "M", "T", "W", "T", "F", "S"]

  // Year choices from 2000 to 2099 BS
  const years = Array.from({ length: 100 }, (_, i) => 2000 + i)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? value : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 pointer-events-auto" align="start">
        <div className="p-3 bg-card border rounded-md shadow-md w-72">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {/* Month Selector */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="text-sm font-semibold bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
              >
                {nepaliMonthNames.map((name, i) => (
                  <option key={i} value={i + 1} className="bg-background">
                    {name} ({monthNames[i]})
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="text-sm font-semibold bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-background">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-1">
            {weekDaysShort.map((day, idx) => (
              <div key={idx} className="h-8 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {blanksArray.map((_, idx) => (
              <div key={`blank-${idx}`} className="h-8 w-8" />
            ))}
            {daysArray.map((day) => {
              const isSelected =
                selectedDate?.year === viewYear &&
                selectedDate?.month === viewMonth &&
                selectedDate?.day === day
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  className={cn(
                    "h-8 w-8 rounded-md flex items-center justify-center transition-colors hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-semibold"
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
