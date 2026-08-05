"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: (inputValue: string, checkboxValue: boolean) => void
  showInput?: boolean
  inputLabel?: string
  inputPlaceholder?: string
  initialInputValue?: string
  showCheckbox?: boolean
  checkboxLabel?: string
  initialCheckboxValue?: boolean
  variant?: "default" | "destructive"
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  showInput = false,
  inputLabel,
  inputPlaceholder = "",
  initialInputValue = "",
  showCheckbox = false,
  checkboxLabel,
  initialCheckboxValue = false,
  variant = "default"
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState(initialInputValue)
  const [checkboxValue, setCheckboxValue] = useState(initialCheckboxValue)

  useEffect(() => {
    if (open) {
      setInputValue(initialInputValue)
      setCheckboxValue(initialCheckboxValue)
    }
  }, [open, initialInputValue, initialCheckboxValue])

  const handleConfirm = () => {
    onConfirm(inputValue, checkboxValue)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[425px] rounded-2xl p-4 sm:p-6 border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          {description && <DialogDescription className="text-xs sm:text-sm">{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {showInput && (
            <div className="space-y-2">
              {inputLabel && <Label htmlFor="dialog-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{inputLabel}</Label>}
              <Input
                id="dialog-input"
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full h-10 text-xs sm:text-sm rounded-xl font-normal"
              />
            </div>
          )}

          {showCheckbox && (
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="dialog-checkbox"
                checked={checkboxValue}
                onCheckedChange={(checked) => setCheckboxValue(!!checked)}
              />
              {checkboxLabel && (
                <Label
                  htmlFor="dialog-checkbox"
                  className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-75 cursor-pointer"
                >
                  {checkboxLabel}
                </Label>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-10 text-xs rounded-xl"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            className="w-full sm:w-auto h-10 text-xs rounded-xl"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
