"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Eye, KeyRound, Lock, Loader2, RefreshCw, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { GeneratedLicense, LicenseGenerator } from "@/components/master-settings/license-settings"
import { apiRequest } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "react-hot-toast"

export default function LicenseGeneratorPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [secret, setSecret] = useState("")
  const [unlocked, setUnlocked] = useState(false)
  const [accessLoading, setAccessLoading] = useState(false)
  const [licenses, setLicenses] = useState<GeneratedLicense[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [keyModalOpen, setKeyModalOpen] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<GeneratedLicense | null>(null)
  const [selectedToken, setSelectedToken] = useState("")
  const [tokenLoadingId, setTokenLoadingId] = useState<number | null>(null)

  const isAdmin = useMemo(() => {
    if (!user) return false
    const roleStr = typeof user.role === "string" ? user.role : user.role?.name || ""
    const roleName = roleStr.toLowerCase()
    return roleName === "administrator" || roleName === "admin"
  }, [user])

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/")
    }
  }, [isAdmin, loading, router])

  const unlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!secret.trim()) {
      toast.error("Access secret is required")
      return
    }
    setAccessLoading(true)
    try {
      await apiRequest("/license/generator-access", {
        method: "POST",
        body: JSON.stringify({ accessSecret: secret.trim() }),
      })
      setSecret("")
      setUnlocked(true)
    } finally {
      setAccessLoading(false)
    }
  }

  const loadLicenses = async () => {
    setListLoading(true)
    try {
      const response = await apiRequest<{ licenses: GeneratedLicense[] }>("/license/generated")
      setLicenses(response.licenses || [])
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    if (unlocked) {
      loadLicenses().catch((error) => toast.error(error.message || "Failed to load generated licenses"))
    }
  }, [unlocked])

  const updateStatus = async (license: GeneratedLicense, status: "ACTIVE" | "DEACTIVATED" | "STOLEN") => {
    const reason = status === "ACTIVE" ? "" : status === "STOLEN" ? "Marked as stolen by administrator" : "Deactivated by administrator"
    setUpdatingId(license.id)
    try {
      const response = await apiRequest<{ license: GeneratedLicense }>(`/license/generated/${license.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason }),
      })
      setLicenses((items) => items.map((item) => (item.id === license.id ? response.license : item)))
      toast.success(`License marked ${status.toLowerCase()}`)
    } finally {
      setUpdatingId(null)
    }
  }

  const openLicenseKey = async (license: GeneratedLicense) => {
    setTokenLoadingId(license.id)
    try {
      const response = await apiRequest<{ token: string; license: GeneratedLicense }>(`/license/generated/${license.id}/token`)
      setSelectedLicense(response.license)
      setSelectedToken(response.token)
      setKeyModalOpen(true)
    } finally {
      setTokenLoadingId(null)
    }
  }

  if (loading || !isAdmin) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6 space-y-6">
        <PageHeader
          title="License Generator"
          description="Generate hardware-bound license keys for approved installations"
        />
        {unlocked && (
          <>
            <LicenseGenerator
              onGenerated={(license) => {
                setLicenses((items) => [license, ...items])
              }}
            />
            <div className="rounded-md border bg-background">
              <div className="flex items-center justify-between gap-3 border-b p-4">
                <div>
                  <h2 className="text-base font-semibold">Generated Licenses</h2>
                  <p className="text-sm text-muted-foreground">Stored license records. Token values are only shown at generation time.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={loadLicenses} disabled={listLoading}>
                  {listLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Refresh
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>HWID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Installed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((license) => {
                    const isBusy = updatingId === license.id
                    const isActive = license.status === "ACTIVE"
                    return (
                      <TableRow key={license.id}>
                        <TableCell>
                          <div className="font-medium">{license.company}</div>
                          <div className="text-xs text-muted-foreground">{license.licenseId}</div>
                        </TableCell>
                        <TableCell className="max-w-[260px] break-all font-mono text-xs">{license.hwid}</TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "default" : "destructive"}>{license.status}</Badge>
                          {license.revokeReason && <div className="mt-1 text-xs text-muted-foreground">{license.revokeReason}</div>}
                        </TableCell>
                        <TableCell>{new Date(license.expiresAt).toLocaleDateString()}</TableCell>
                        <TableCell>{license.installedAt ? new Date(license.installedAt).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button type="button" size="sm" variant="outline" disabled={tokenLoadingId === license.id} onClick={() => openLicenseKey(license)}>
                              {tokenLoadingId === license.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                              Open Key
                            </Button>
                            {!isActive && (
                              <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => updateStatus(license, "ACTIVE")}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Activate
                              </Button>
                            )}
                            <Button type="button" size="sm" variant="outline" disabled={isBusy || license.status === "DEACTIVATED"} onClick={() => updateStatus(license, "DEACTIVATED")}>
                              <ShieldX className="mr-2 h-4 w-4" />
                              Deactivate
                            </Button>
                            <Button type="button" size="sm" variant="destructive" disabled={isBusy || license.status === "STOLEN"} onClick={() => updateStatus(license, "STOLEN")}>
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              Stolen
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {!licenses.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        {listLoading ? "Loading generated licenses..." : "No generated licenses found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <Dialog open={!unlocked} onOpenChange={(nextOpen) => !nextOpen && router.replace("/")}>
        <DialogContent>
          <form onSubmit={unlock} className="space-y-4">
            <DialogHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <DialogTitle>License Generator Access</DialogTitle>
              <DialogDescription>Enter the access secret before generating a license key.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="license-generator-secret">Access secret</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="license-generator-secret"
                  type="password"
                  className="pl-9"
                  value={secret}
                  onChange={(event) => setSecret(event.target.value)}
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => router.replace("/")}>
                Cancel
              </Button>
              <Button type="submit" disabled={accessLoading}>
                {accessLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Access
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={keyModalOpen} onOpenChange={setKeyModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generated License Key</DialogTitle>
            <DialogDescription>
              {selectedLicense ? `${selectedLicense.company} - ${selectedLicense.licenseId}` : "Copy the stored license key."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea readOnly value={selectedToken} rows={8} className="font-mono text-xs" />
            {selectedLicense?.hwid && (
              <div className="rounded-md border bg-muted/40 p-3">
                <div className="text-xs font-medium text-muted-foreground">Hardware ID</div>
                <div className="mt-1 break-all font-mono text-xs">{selectedLicense.hwid}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(selectedToken)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Key
            </Button>
            <Button type="button" onClick={() => setKeyModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
