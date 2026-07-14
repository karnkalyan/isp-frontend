"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Copy, Mail, MessageCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const DEFAULT_MESSAGE = "Your license has expired. Please contact Simulcast Technologies Pvt Ltd to renew or update your license."
const SUPPORT_COMPANY = "Simulcast Technologies Pvt Ltd"
const SUPPORT_EMAIL = "info@simulcast.com.np"
const SUPPORT_WHATSAPP = "+9779851188274"

type IspInfo = {
  companyName?: string | null
  contactPerson?: string | null
  phoneNumber?: string | null
  masterEmail?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  website?: string | null
}

function formatIspAddress(isp?: IspInfo | null) {
  if (!isp) return ""
  return [isp.address, isp.city, isp.state, isp.country].filter(Boolean).join(", ")
}

function buildWhatsappUrl(hwid: string, isp?: IspInfo | null) {
  const ispAddress = formatIspAddress(isp)
  const message = [
    "Hello Simulcast Technologies Pvt Ltd,",
    "Our license has expired. Please help renew or update the license.",
    "",
    "ISP Information:",
    isp?.companyName ? `ISP Name: ${isp.companyName}` : "",
    ispAddress ? `Address: ${ispAddress}` : "",
    isp?.contactPerson ? `Contact Person: ${isp.contactPerson}` : "",
    isp?.phoneNumber ? `Contact Number: ${isp.phoneNumber}` : "",
    isp?.masterEmail ? `Email: ${isp.masterEmail}` : "",
    isp?.website ? `Website: ${isp.website}` : "",
    "",
    hwid ? `Hardware ID: ${hwid}` : "",
  ].filter(Boolean).join("\n")

  return `https://wa.me/9779851188274?text=${encodeURIComponent(message)}`
}

type LicenseExpiredDetail = {
  message?: string
  hwid?: string | null
}

type LicenseStatus = {
  active: boolean
  message?: string
  hwid?: string
  isp?: IspInfo | null
}

export function LicenseExpiredModal() {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [hwid, setHwid] = useState("")
  const [ispInfo, setIspInfo] = useState<IspInfo | null>(null)
  const dismissedRef = useRef(false)

  const showModal = (detail?: LicenseExpiredDetail) => {
    if (dismissedRef.current) return
    setMessage(detail?.message || DEFAULT_MESSAGE)
    setHwid(detail?.hwid || "")
    setOpen(true)
  }

  useEffect(() => {
    const handleLicenseExpired = (event: Event) => {
      showModal((event as CustomEvent<LicenseExpiredDetail>).detail)
    }

    window.addEventListener("license-expired", handleLicenseExpired)
    return () => window.removeEventListener("license-expired", handleLicenseExpired)
  }, [])

  useEffect(() => {
    if (loading || !user) return

    let cancelled = false
    apiRequest<LicenseStatus>("/license/status", { suppressToast: true })
      .then((status) => {
        if (cancelled || status.active) return
        setIspInfo(status.isp || null)
        showModal({ message: status.message, hwid: status.hwid })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [loading, user])

  const close = () => {
    dismissedRef.current = true
    setOpen(false)
  }

  const whatsappUrl = buildWhatsappUrl(hwid, ispInfo)

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : close())}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>Your license has been expired</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
          <div className="text-sm font-semibold text-foreground">Contact Information</div>
          <div className="mt-3 grid gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Company: </span>
              <strong>{SUPPORT_COMPANY}</strong>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <a className="font-bold text-primary underline-offset-4 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">WhatsApp:</span>
              <a className="font-bold text-primary underline-offset-4 hover:underline" href={whatsappUrl} target="_blank" rel="noreferrer">
                {SUPPORT_WHATSAPP}
              </a>
            </div>
          </div>
        </div>
        {hwid && (
          <div className="rounded-md border bg-muted/40 p-4">
            <div className="text-sm font-semibold">Server Hardware ID</div>
            <div className="mt-1 text-xs text-muted-foreground">Share this HWID with support to generate a hardware-bound license.</div>
            <div className="mt-1 break-all font-mono text-xs">{hwid}</div>
          </div>
        )}
        {ispInfo?.companyName && (
          <div className="rounded-md border bg-muted/30 p-4">
            <div className="text-sm font-semibold">ISP Information Sent With WhatsApp</div>
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
              <div><span className="font-medium text-foreground">Name:</span> {ispInfo.companyName}</div>
              {formatIspAddress(ispInfo) && <div><span className="font-medium text-foreground">Address:</span> {formatIspAddress(ispInfo)}</div>}
              {ispInfo.contactPerson && <div><span className="font-medium text-foreground">Contact:</span> {ispInfo.contactPerson}</div>}
              {ispInfo.phoneNumber && <div><span className="font-medium text-foreground">Phone:</span> {ispInfo.phoneNumber}</div>}
              {ispInfo.masterEmail && <div><span className="font-medium text-foreground">Email:</span> {ispInfo.masterEmail}</div>}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" asChild>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </a>
          </Button>
          {hwid && (
            <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(hwid)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy HWID
            </Button>
          )}
          <Button type="button" onClick={close}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
