import Image from "next/image"
import { cn } from "@/lib/utils"

const assets = {
  icon: "/kashtrix-logo/icons-logo.png",
  text: "/kashtrix-logo/text-logo.png",
  complete: "/kashtrix-logo/logo.png",
  wide: "/kashtrix-logo/wide-logo.png",
} as const

const sizes = {
  icon: { width: 72, height: 40 },
  text: { width: 218, height: 24 },
  complete: { width: 174, height: 80 },
  wide: { width: 220, height: 30 },
} as const

type BrandLogoProps = {
  variant?: keyof typeof assets
  className?: string
  priority?: boolean
}

export function BrandLogo({ variant = "wide", className, priority = false }: BrandLogoProps) {
  const size = sizes[variant]

  return (
    <Image
      src={assets[variant]}
      alt="Kashtrix"
      width={size.width}
      height={size.height}
      priority={priority}
      className={cn("block h-auto w-auto object-contain", className)}
    />
  )
}
