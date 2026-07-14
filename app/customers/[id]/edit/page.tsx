"use client"

import { type FormEvent, useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { useAuth } from "@/contexts/AuthContext"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type OptionRecord = { id: number; name?: string; packageName?: string; email?: string; packageDuration?: string }

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = String(params.id)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [customer, setCustomer] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [customerTypes, setCustomerTypes] = useState<OptionRecord[]>([])
  const [memberships, setMemberships] = useState<OptionRecord[]>([])
  const [users, setUsers] = useState<OptionRecord[]>([])
  const [packages, setPackages] = useState<OptionRecord[]>([])
  const [existingISPs, setExistingISPs] = useState<OptionRecord[]>([])
  const [olts, setOlts] = useState<any[]>([])
  const [splitters, setSplitters] = useState<any[]>([])
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [typedSecretKey, setTypedSecretKey] = useState("")
  const [systemSecretKey, setSystemSecretKey] = useState("admin123")
  const [freeCustomerUnlocked, setFreeCustomerUnlocked] = useState(false)
  const [freeCustomerSecretKey, setFreeCustomerSecretKey] = useState("")

  const roleStr = typeof user?.role === "string" ? user.role : (user?.role?.name || "")
  const normalizedRole = roleStr.toLowerCase()
  const isAdmin = normalizedRole === "admin" || normalizedRole === "isp_admin" || normalizedRole === "administrator" || normalizedRole.startsWith("global ")

  const setField = (field: string, value: any) => setForm((prev: any) => ({ ...prev, [field]: value }))

  const handleVerifySecretKey = useCallback(() => {
    if (typedSecretKey === systemSecretKey) {
      setFreeCustomerSecretKey(typedSecretKey)
      setFreeCustomerUnlocked(true)
      setField("isFree", true)
      setShowSecretModal(false)
      toast.success("Free Customer feature unlocked!")
    } else {
      toast.error("Invalid verification key.")
    }
  }, [typedSecretKey, systemSecretKey])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && (e.key === "z" || e.key === "Z")) ||
        (e.ctrlKey && e.altKey && (e.key === "f" || e.key === "F"))) {
        e.preventDefault()
        if (isAdmin) setShowSecretModal(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    apiRequest<Record<string, string>>("/settings")
      .then((data) => {
        if (data?.freeCustomerSecretKey) setSystemSecretKey(data.freeCustomerSecretKey)
      })
      .catch((err) => console.warn("Failed to load settings secret key:", err))
  }, [isAdmin])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [customerData, typeData, membershipData, userData, packageData, ispData, oltData, splitterData] = await Promise.all([
          apiRequest(`/customer/${id}`),
          apiRequest("/customer-types").catch(() => []),
          apiRequest("/membership").catch(() => []),
          apiRequest("/users").catch(() => []),
          apiRequest("/package-price").catch(() => []),
          apiRequest("/existingisp").catch(() => []),
          apiRequest("/olt?limit=1000").catch(() => []),
          apiRequest("/splitters?limit=1000").catch(() => []),
        ])
        setCustomer(customerData)

        const mainOnt = customerData.devices?.find((d: any) => d.deviceType === 'ONT')
        const mainService = customerData.serviceDetails?.[0]
        const mainUser = customerData.connectionUsers?.[0]

        setForm({
          firstName: customerData.firstName || customerData.lead?.firstName || "",
          middleName: customerData.middleName || customerData.lead?.middleName || "",
          lastName: customerData.lastName || customerData.lead?.lastName || "",
          email: customerData.email || customerData.lead?.email || "",
          phoneNumber: customerData.phoneNumber || customerData.lead?.phoneNumber || "",
          secondaryPhone: customerData.secondaryPhone || customerData.lead?.secondaryContactNumber || "",
          gender: customerData.gender || customerData.lead?.gender || "",
          streetAddress: customerData.street || customerData.lead?.street || "",
          city: customerData.city || customerData.lead?.city || "",
          district: customerData.district || customerData.lead?.district || "",
          state: customerData.state || customerData.lead?.province || "",
          zipCode: customerData.zipCode || customerData.lead?.zipCode || "",
          idNumber: customerData.idNumber || "",
          panNumber: customerData.panNo || "",
          customerTypeId: customerData.customerTypeId ? String(customerData.customerTypeId) : "",
          membershipId: customerData.membershipId ? String(customerData.membershipId) : "",
          installedById: customerData.installedById ? String(customerData.installedById) : "",
          subscribedPkgId: customerData.subscribedPkgId ? String(customerData.subscribedPkgId) : "",
          existingISPId: customerData.existingISPId ? String(customerData.existingISPId) : "",
          isFree: Boolean(customerData.isFree),

          // Connection Details
          connectionType: mainService?.connectionType || "fiber",
          useSplitter: mainService?.splitterId ? true : false,
          splitterId: mainService?.splitterId ? String(mainService.splitterId) : "",
          splitterPort: mainService?.splitterPort || "",
          oltId: mainService?.oltId ? String(mainService.oltId) : "",
          oltPort: mainService?.oltPort || "",
          vlanId: mainService?.vlanId || "",

          // Credentials
          connectionUsername: mainUser?.username || "",
          connectionPassword: mainUser?.password || "",

          // ONT Device
          deviceBrand: mainOnt?.brand || "",
          deviceName: mainOnt?.model || "",
          deviceSerial: mainOnt?.serialNumber || "",
          deviceMac: mainOnt?.macAddress || "",
          devicePonSerial: mainOnt?.ponSerial || "",
        })
        setFreeCustomerUnlocked(Boolean(customerData.isFree))
        setCustomerTypes(Array.isArray(typeData) ? typeData : typeData?.data || [])
        setMemberships(Array.isArray(membershipData) ? membershipData : membershipData?.data || [])
        setUsers(Array.isArray(userData) ? userData : userData?.data || [])
        setPackages((Array.isArray(packageData) ? packageData : packageData?.data || []).filter((pkg: any) => !pkg.isTrial))
        setExistingISPs(Array.isArray(ispData) ? ispData : ispData?.data || [])
        setOlts(Array.isArray(oltData) ? oltData : oltData?.data || [])
        setSplitters(Array.isArray(splitterData) ? splitterData : splitterData?.data || [])
      } catch (error: any) {
        toast.error(error.message || "Failed to load customer")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.customerTypeId) {
      toast.error("Customer type is required")
      return
    }
    setSaving(true)
    try {
      const response = await apiRequest(`/customer/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          ...(form.isFree ? { freeCustomerSecretKey } : {})
        }),
      })
      setCustomer(response.customer)
      toast.success("Customer updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to update customer")
    } finally {
      setSaving(false)
    }
  }

  const completeProvisioning = async () => {
    setProvisioning(true)
    try {
      await apiRequest(`/customer/${id}/provision`, {
        method: "POST",
        body: JSON.stringify({ services: [] }),
        headers: { "Content-Type": "application/json" },
      })
      toast.success("Draft customer marked as provisioned")
      router.push(`/customers/${id}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to complete provisioning")
    } finally {
      setProvisioning(false)
    }
  }

  const uploadDocument = async (file: File | null, fieldName = "otherDocuments") => {
    if (!file) return
    const data = new FormData()
    data.append(fieldName, file)
    setUploadingDocument(true)
    try {
      await apiRequest(`/customer/${id}/documents`, {
        method: "POST",
        body: data,
      })
      const refreshed = await apiRequest(`/customer/${id}`)
      setCustomer(refreshed)
      toast.success("Document uploaded")
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document")
    } finally {
      setUploadingDocument(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Dialog open={showSecretModal} onOpenChange={setShowSecretModal}>
          <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Unlock Free Customer Option</DialogTitle>
              <DialogDescription>
                Enter the secret verification key to enable the "Free Customer" pricing override feature.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editSecretKeyInput">Secret Verification Key *</Label>
                <Input
                  id="editSecretKeyInput"
                  type="password"
                  placeholder="Enter secret key"
                  value={typedSecretKey}
                  onChange={(e) => setTypedSecretKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerifySecretKey()
                  }}
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setShowSecretModal(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleVerifySecretKey} className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-650 hover:to-indigo-700 text-white">
                Verify & Unlock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PageHeader
          title="Edit Customer"
          description="Update profile, package, and onboarding details"
          actions={[{ label: "Back to Profile", href: `/customers/${id}` }]}
        />

        {customer?.status === "draft" && (
          <Alert>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>This customer is saved as draft. Complete missing details here, then process provisioning when ready.</span>
              <Button type="button" onClick={completeProvisioning} disabled={provisioning}>
                {provisioning ? "Processing..." : "Process Draft"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">Loading customer...</CardContent>
          </Card>
        ) : (
          <form onSubmit={save} className="space-y-6">
            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="service">Service</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="hardware">Hardware</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile & References</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      {["firstName", "middleName", "lastName", "email", "phoneNumber", "secondaryPhone", "streetAddress", "city", "district", "state", "zipCode", "idNumber", "panNumber"].map((field) => (
                        <div className="space-y-2" key={field}>
                          <Label htmlFor={field}>{field.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())}</Label>
                          <Input id={field} value={form[field] || ""} onChange={(e) => setField(field, e.target.value)} />
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Customer Type *</Label>
                        <SearchableSelect
                          value={form.customerTypeId || ""}
                          onValueChange={(value) => setField("customerTypeId", Array.isArray(value) ? value[0] : value)}
                          options={customerTypes.map((item) => ({ value: String(item.id), label: item.name || `Type ${item.id}` }))}
                          placeholder="Select customer type"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subscribed Package</Label>
                        <SearchableSelect
                          value={form.subscribedPkgId || ""}
                          onValueChange={(value) => setField("subscribedPkgId", Array.isArray(value) ? value[0] : value)}
                          options={packages.map((item) => ({ value: String(item.id), label: item.packageName || `Package ${item.id}`, description: item.packageDuration }))}
                          placeholder="Select subscribed package"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Membership</Label>
                        <SearchableSelect
                          value={form.membershipId || ""}
                          onValueChange={(value) => setField("membershipId", Array.isArray(value) ? value[0] : value)}
                          options={memberships.map((item) => ({ value: String(item.id), label: item.name || `Membership ${item.id}` }))}
                          placeholder="Select membership"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Installed By</Label>
                        <SearchableSelect
                          value={form.installedById || ""}
                          onValueChange={(value) => setField("installedById", Array.isArray(value) ? value[0] : value)}
                          options={users.map((item) => ({ value: String(item.id), label: item.name || `User ${item.id}`, description: item.email }))}
                          placeholder="Select technician"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Previous ISP</Label>
                        <SearchableSelect
                          value={form.existingISPId || ""}
                          onValueChange={(value) => setField("existingISPId", Array.isArray(value) ? value[0] : value)}
                          options={existingISPs.map((item) => ({ value: String(item.id), label: item.name || `ISP ${item.id}` }))}
                          placeholder="Select previous ISP"
                        />
                      </div>
                    </div>

                    {isAdmin && freeCustomerUnlocked && (
                      <div className="space-y-4 rounded-lg border border-purple-100 bg-purple-50/50 p-4 dark:border-purple-900/30 dark:bg-purple-900/10">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <Label className="font-medium text-purple-800 dark:text-purple-400">Free Customer</Label>
                            <p className="text-xs text-muted-foreground">Enable this to override package and recharge amounts to 0.</p>
                          </div>
                          <Switch
                            checked={Boolean(form.isFree)}
                            onCheckedChange={(checked) => setField("isFree", checked)}
                          />
                        </div>
                        {form.isFree && (
                          <div className="space-y-2">
                            <Label htmlFor="editFreeCustomerSecretKey">Secret Verification Key *</Label>
                            <Input
                              id="editFreeCustomerSecretKey"
                              type="password"
                              placeholder="Enter secret verification key"
                              value={freeCustomerSecretKey}
                              onChange={(e) => setFreeCustomerSecretKey(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="service">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Configuration & Credentials</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Connection Type */}
                    <div className="space-y-2">
                      <Label htmlFor="connectionType">Connection Type *</Label>
                      <SearchableSelect
                        value={form.connectionType || ""}
                        onValueChange={(value) => setField("connectionType", Array.isArray(value) ? value[0] : value)}
                        options={[
                          { value: "fiber", label: "Fiber" },
                          { value: "infra_share", label: "Infra Share" },
                          { value: "wireless", label: "Wireless" }
                        ]}
                        placeholder="Select connection type"
                      />
                    </div>

                    {form.connectionType === "fiber" && (
                      <>
                        {/* Connection Method */}
                        <div className="space-y-2">
                          <Label>Connection Method</Label>
                          <RadioGroup
                            value={form.useSplitter ? "splitter" : "direct"}
                            onValueChange={(value: string) => setField("useSplitter", value === "splitter")}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1"
                          >
                            <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                              <RadioGroupItem value="splitter" id="edit-splitter-method" />
                              <Label htmlFor="edit-splitter-method" className="flex items-center cursor-pointer font-normal">
                                Via Splitter
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                              <RadioGroupItem value="direct" id="edit-direct-method" />
                              <Label htmlFor="edit-direct-method" className="flex items-center cursor-pointer font-normal">
                                Direct OLT Port
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Splitter Selection */}
                        {form.useSplitter && (
                          <div className="space-y-2">
                            <Label htmlFor="editSplitterId">Splitter</Label>
                            <SearchableSelect
                              options={splitters.map((s) => ({
                                value: String(s.id),
                                label: `${s.name} (${s.splitterId})`,
                                description: `Ratio: ${s.splitRatio} | Ports: ${s.portCount} | Available: ${s.availablePorts ?? 0}`
                              }))}
                              value={form.splitterId || ""}
                              onValueChange={(value) => {
                                const val = Array.isArray(value) ? value[0] : value
                                setField("splitterId", val)
                                const selectedSplitter = splitters.find(s => String(s.id) === val)
                                if (selectedSplitter && selectedSplitter.oltId) {
                                  setField("oltId", String(selectedSplitter.oltId))
                                }
                              }}
                              placeholder="Select splitter"
                            />
                          </div>
                        )}

                        {/* Splitter Port */}
                        {form.useSplitter && (
                          <div className="space-y-2">
                            <Label htmlFor="editSplitterPort">Splitter Output Port</Label>
                            <Input
                              id="editSplitterPort"
                              value={form.splitterPort || ""}
                              onChange={(e) => setField("splitterPort", e.target.value)}
                              placeholder="e.g., 1-32"
                            />
                          </div>
                        )}

                        {/* OLT Selection */}
                        {!form.useSplitter && (
                          <div className="space-y-2">
                            <Label htmlFor="editOltId">OLT</Label>
                            <SearchableSelect
                              options={olts.map((o) => ({
                                value: String(o.id),
                                label: o.name,
                                description: o.model
                              }))}
                              value={form.oltId || ""}
                              onValueChange={(value) => setField("oltId", Array.isArray(value) ? value[0] : value)}
                              placeholder="Select OLT"
                            />
                          </div>
                        )}

                        {/* OLT Port */}
                        {!form.useSplitter && (
                          <div className="space-y-2">
                            <Label htmlFor="editOltPort">OLT Port</Label>
                            <Input
                              id="editOltPort"
                              value={form.oltPort || ""}
                              onChange={(e) => setField("oltPort", e.target.value)}
                              placeholder="e.g., 1/1/1"
                            />
                          </div>
                        )}

                        {/* VLAN ID */}
                        <div className="space-y-2">
                          <Label htmlFor="editVlanId">VLAN ID</Label>
                          <Input
                            id="editVlanId"
                            value={form.vlanId || ""}
                            onChange={(e) => setField("vlanId", e.target.value)}
                            placeholder="e.g., 100"
                          />
                        </div>
                      </>
                    )}

                    {/* PPPoE / Wi-Fi Credentials */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-sm font-medium">User Credentials (PPPoE / Wi-Fi)</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="editConnectionUsername">Username</Label>
                          <Input
                            id="editConnectionUsername"
                            value={form.connectionUsername || ""}
                            onChange={(e) => setField("connectionUsername", e.target.value)}
                            placeholder="PPPoE Username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editConnectionPassword">Password</Label>
                          <Input
                            id="editConnectionPassword"
                            type="password"
                            value={form.connectionPassword || ""}
                            onChange={(e) => setField("connectionPassword", e.target.value)}
                            placeholder="PPPoE Password"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {(customer?.documents || []).length > 0 ? customer.documents.map((doc: any) => (
                        <div key={doc.id} className="rounded-md border p-3 text-sm">
                          <div className="font-medium">{doc.documentType || "Document"}</div>
                          <div className="text-xs text-muted-foreground">{doc.fileName}</div>
                        </div>
                      )) : <div className="text-sm text-muted-foreground">No documents uploaded yet.</div>}
                    </div>
                    <div className="rounded-md border p-4">
                      <Label htmlFor="editDocumentUpload">Upload Document</Label>
                      <Input
                        id="editDocumentUpload"
                        type="file"
                        className="mt-2"
                        disabled={uploadingDocument}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(event) => uploadDocument(event.target.files?.[0] || null)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hardware">
                <Card>
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle>ONT Device Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="editDeviceBrand">ONT Brand</Label>
                        <Input
                          id="editDeviceBrand"
                          value={form.deviceBrand || ""}
                          onChange={(e) => setField("deviceBrand", e.target.value)}
                          placeholder="e.g., Huawei, Nokia"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDeviceName">ONT Model</Label>
                        <Input
                          id="editDeviceName"
                          value={form.deviceName || ""}
                          onChange={(e) => setField("deviceName", e.target.value)}
                          placeholder="e.g., HG8245H"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDeviceSerial">Serial Number</Label>
                        <Input
                          id="editDeviceSerial"
                          value={form.deviceSerial || ""}
                          onChange={(e) => setField("deviceSerial", e.target.value)}
                          placeholder="Device Serial Number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDeviceMac">MAC Address</Label>
                        <Input
                          id="editDeviceMac"
                          value={form.deviceMac || ""}
                          onChange={(e) => setField("deviceMac", e.target.value)}
                          placeholder="00:11:22:33:44:55"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="editDevicePonSerial">PON Serial</Label>
                        <Input
                          id="editDevicePonSerial"
                          value={form.devicePonSerial || ""}
                          onChange={(e) => setField("devicePonSerial", e.target.value)}
                          placeholder="PON Serial (for dynamic discovery)"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-medium">Inventory Assignment</h4>
                          <p className="text-xs text-muted-foreground">Manage and assign specific warehouse stock items to this customer.</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => router.push(`/inventory?customerId=${id}`)}>
                          Go to Inventory
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => router.push(`/customers/${id}`)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
