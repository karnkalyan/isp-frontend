import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type Option = {
  value: string
  label?: string
  icon?: React.ReactNode
  description?: string
}


interface SearchableSelectProps {
  options: Option[]
  /** for single select: string, for multi: string[] */
  value?: string | string[]
  onValueChange: (value: string | string[]) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  clearable?: boolean
  error?: boolean
  showSelectedIcon?: boolean
  multiple?: boolean
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  emptyMessage = "No results found.",
  className,
  disabled = false,
  clearable = false,
  error = false,
  showSelectedIcon = true,
  multiple = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Normalize selected values
  const selectedValues = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : []
    }
    return typeof value === 'string' && value ? [value] : []
  }, [value, multiple])

  const selectedOptions = React.useMemo(() => {
    return options.filter(opt => selectedValues.includes(opt.value))
  }, [options, selectedValues])

  // Remove a single tag without closing popover
  const handleTagRemove = (val: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newValues = selectedValues.filter(v => v !== val)
    onValueChange(newValues)
    setOpen(true) // keep popover open to reflect changes
  }

  // Clear all selections
  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onValueChange(multiple ? [] : "")
    setSearchQuery("")
    setOpen(true)
  }

  const toggleOption = (opt: Option) => {
    if (multiple) {
      const exists = selectedValues.includes(opt.value)
      const newValues = exists
        ? selectedValues.filter(v => v !== opt.value)
        : [...selectedValues, opt.value]
      onValueChange(newValues)
      setOpen(true)
    } else {
      onValueChange(opt.value === value ? "" : opt.value)
      setOpen(false)
    }
    setSearchQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full flex items-start justify-start flex-wrap gap-1 p-2 !h-auto",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          disabled={disabled}
        >
          {/* Render single label or multiple tags */}
          {multiple ? (
            selectedOptions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedOptions.map(opt => (
                  <span
                    key={opt.value}
                    className="inline-flex items-center rounded bg-accent px-2 py-0.5 text-xs"
                  >
                    {opt.label}
                    {clearable && (
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={(e) => handleTagRemove(opt.value, e)}
                      />
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <span className="truncate text-muted-foreground">{placeholder}</span>
            )
          ) : (
            <span className="truncate">{selectedOptions[0]?.label || placeholder}</span>
          )}

          <div className="flex items-center ml-auto">
            {clearable && selectedOptions.length > 0 && (
              <X
                className="mr-1 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClearAll}
                aria-label="Clear selection"
              />
            )}
            <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            className="h-9"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {options
                    .filter(option =>
                  (option.label && option.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (option.value && option.value.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (option.description && option.description.toLowerCase().includes(searchQuery.toLowerCase()))
                )

                .map(option => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => toggleOption(option)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      {showSelectedIcon && (
                        <Check className={cn(
                          "mr-2 h-4 w-4",
                          selectedValues.includes(option.value) ? "opacity-100" : "opacity-0"
                        )} />
                      )}
                      {option.icon && <span className="mr-2">{option.icon}</span>}
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        {option.description && <span className="text-xs text-muted-foreground">{option.description}</span>}
                      </div>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
