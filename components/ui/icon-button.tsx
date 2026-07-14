"use client"

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface IconButtonProps extends Omit<ButtonProps, "children" | "aria-label"> { label: string; children: React.ReactNode; tooltipSide?: "top" | "right" | "bottom" | "left" }

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({ label, children, tooltipSide = "bottom", size = "icon", ...props }, ref) => (
  <TooltipProvider delayDuration={250}><Tooltip><TooltipTrigger asChild><Button ref={ref} size={size} aria-label={label} {...props}>{children}</Button></TooltipTrigger><TooltipContent side={tooltipSide}>{label}</TooltipContent></Tooltip></TooltipProvider>
))
IconButton.displayName = "IconButton"
