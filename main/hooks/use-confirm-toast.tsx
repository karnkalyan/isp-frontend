// src/hooks/use-confirm-toast.tsx
"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ConfirmToastType = "warning" | "success" | "info" | "danger"

export interface ConfirmToastOptions {
  title?: string
  message: string
  type?: ConfirmToastType
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

interface ConfirmToastState extends ConfirmToastOptions {
  isOpen: boolean
  resolve?: (value: boolean) => void
}

export const useConfirmToast = () => {
  const [state, setState] = useState<ConfirmToastState>({
    isOpen: false,
    message: "",
    type: "warning",
  })

  const confirm = useCallback((options: Omit<ConfirmToastOptions, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        message: options.message,
        title: options.title,
        type: options.type || "warning",
        confirmText: options.confirmText || "Yes",
        cancelText: options.cancelText || "Cancel",
        resolve,
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (state.resolve) {
      state.resolve(true)
    }
    setState(prev => ({ ...prev, isOpen: false }))
  }, [state.resolve])

  const handleCancel = useCallback(() => {
    if (state.resolve) {
      state.resolve(false)
    }
    setState(prev => ({ ...prev, isOpen: false }))
  }, [state.resolve])

  const ConfirmDialog = () => {
    if (!state.isOpen) return null

    const typeConfig = {
      warning: {
        icon: AlertTriangle,
        bgColor: "bg-yellow-50 border-yellow-200",
        iconColor: "text-yellow-600",
        textColor: "text-yellow-800",
        confirmButtonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
      },
      success: {
        icon: CheckCircle,
        bgColor: "bg-green-50 border-green-200",
        iconColor: "text-green-600",
        textColor: "text-green-800",
        confirmButtonClass: "bg-green-600 hover:bg-green-700 text-white",
      },
      info: {
        icon: Info,
        bgColor: "bg-blue-50 border-blue-200",
        iconColor: "text-blue-600",
        textColor: "text-blue-800",
        confirmButtonClass: "bg-blue-600 hover:bg-blue-700 text-white",
      },
      danger: {
        icon: AlertCircle,
        bgColor: "bg-red-50 border-red-200",
        iconColor: "text-red-600",
        textColor: "text-red-800",
        confirmButtonClass: "bg-red-600 hover:bg-red-700 text-white",
      },
    }

    const config = typeConfig[state.type || "warning"]
    const Icon = config.icon

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
        <div className={cn("w-full max-w-md rounded-lg border p-4 shadow-lg animate-in fade-in zoom-in-95", config.bgColor)}>
          <div className="flex items-start gap-3">
            <div className={cn("mt-0.5 rounded-full p-1", config.iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-3">
              {state.title && (
                <h3 className={cn("font-semibold text-lg", config.textColor)}>
                  {state.title}
                </h3>
              )}
              <p className={cn("text-sm", config.textColor)}>
                {state.message}
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  {state.cancelText || "Cancel"}
                </Button>
                <Button
                  onClick={handleConfirm}
                  className={config.confirmButtonClass}
                >
                  {state.confirmText || "Yes"}
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return { confirm, ConfirmDialog }
}