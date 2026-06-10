"use client"

import { type FormEvent, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"

type OptionRecord = { id: number; name?: string; packageName?: string; email?: string; packageDuration?: string }

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
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

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [customerData, typeData, membershipData, userData, packageData, ispData] = await Promise.all([
          apiRequest(`/customer/${id}`),
          apiRequest("/customer-types").catch(() => []),
          apiRequest("/membership").catch(() => []),
          apiRequest("/users").catch(() => []),
          apiRequest("/package-price").catch(() => []),
          apiRequest("/existingisp").catch(() => []),
        ])
        setCustomer(customerData)
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
        })
        setCustomerTypes(Array.isArray(typeData) ? typeData : typeData?.data || [])
        setMemberships(Array.isArray(membershipData) ? membershipData : membershipData?.data || [])
        setUsers(Array.isArray(userData) ? userData : userData?.data || [])
        setPackages((Array.isArray(packageData) ? packageData : packageData?.data || []).filter((pkg: any) => !pkg.isTrial))
        setExistingISPs(Array.isArray(ispData) ? ispData : ispData?.data || [])
      } catch (error: any) {
        toast.error(error.message || "Failed to load customer")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const setField = (field: string, value: string) => setForm((prev: any) => ({ ...prev, [field]: value }))

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
        body: JSON.stringify(form),
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading customer...</div>
            ) : (
              <form onSubmit={save} className="space-y-6">
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

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => router.push(`/customers/${id}`)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
