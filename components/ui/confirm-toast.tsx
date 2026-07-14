// src/components/ui/confirm-toast.tsx
"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ConfirmToastType = "warning" | "success" | "info" | "danger"

export interface ConfirmToastProps {
  title?: string
  message: string
  type?: ConfirmToastType
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isOpen: boolean
}

const ConfirmToast: React.FC<ConfirmToastProps> = ({
  title,
  message,
  type = "warning",
  confirmText = "Yes",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isOpen,
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || !isOpen) return null

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

  const config = typeConfig[type]
  const Icon = config.icon

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={cn("w-full max-w-md rounded-lg border p-4 shadow-lg animate-in fade-in zoom-in-95", config.bgColor)}>
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 rounded-full p-1", config.iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-3">
            {title && (
              <h3 className={cn("font-semibold text-lg", config.textColor)}>
                {title}
              </h3>
            )}
            <p className={cn("text-sm", config.textColor)}>
              {message}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onCancel}
                className="border-gray-300 hover:bg-gray-100"
              >
                {cancelText}
              </Button>
              <Button
                onClick={onConfirm}
                className={config.confirmButtonClass}
              >
                {confirmText}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmToast