"use client"

import React, { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NepaliFunctions } from "@/lib/nepaliFunctions"

export function NepaliCalendarWidget() {
  // Current viewed month/year in the calendar
  const [viewYear, setViewYear] = useState<number>(2083)
  const [viewMonth, setViewMonth] = useState<number>(3) // 1-indexed (1-12)
  const [todayDate, setTodayDate] = useState<{ year: number; month: number; day: number } | null>(null)

  // Initialize view and current date
  useEffect(() => {
    try {
      const cur = NepaliFunctions.GetCurrentBsDate()
      setTodayDate(cur)
      setViewYear(cur.year)
      setViewMonth(cur.month)
    } catch (e) {
      setViewYear(2083)
      setViewMonth(3)
    }
  }, [])

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
    <CardContainer
      title="Nepali Calendar (BS)"
      className="relative min-w-0 overflow-hidden [&>div:first-child]:!p-3"
      contentClassName="min-w-0 !p-3 !pt-3"
    >
      <div className="min-w-0">
        {/* Calendar Header Controls */}
        <div className="mb-2 grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-1 border-b pb-2 sm:gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_4.75rem] items-center gap-1 sm:gap-2">
            {/* Month Dropdown */}
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
              className="h-8 min-w-0 w-full cursor-pointer truncate rounded-[6px] border border-border bg-background px-2 text-[11px] font-medium outline-none focus:ring-2 focus:ring-primary"
            >
              {nepaliMonthNames.map((name, i) => (
                <option key={i} value={i + 1}>
                  {name} ({monthNames[i]})
                </option>
              ))}
            </select>

            {/* Year Dropdown */}
            <select
              value={viewYear}
              onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
              className="h-8 cursor-pointer rounded-[6px] border border-border bg-background px-2 text-[11px] font-medium outline-none focus:ring-2 focus:ring-primary"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
          {weekDaysShort.map((day, idx) => (
            <div key={idx} className="flex h-7 items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        {/* Grid of days */}
        <div className="grid flex-grow grid-cols-7 gap-1 text-center text-[12px]">
          {blanksArray.map((_, idx) => (
            <div key={`blank-${idx}`} className="flex h-7 items-center justify-center text-muted-foreground/30">
              -
            </div>
          ))}
          {daysArray.map((day) => {
            const isToday =
              todayDate?.year === viewYear &&
              todayDate?.month === viewMonth &&
              todayDate?.day === day
            
            return (
              <div
                key={day}
                className={cn(
                  "flex h-7 select-none items-center justify-center rounded-[5px] font-medium transition-colors",
                  isToday 
                    ? "bg-primary text-primary-foreground font-bold"
                    : "hover:bg-accent/40 text-foreground"
                )}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>
    </CardContainer>
  )
}
