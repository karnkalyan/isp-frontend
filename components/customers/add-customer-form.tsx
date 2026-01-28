"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { CheckCircle2, Upload, MapPin, FileText, Plus, Trash2, UserPlus, UserCheck, Building2, Target, Crosshair, Zap, ShieldCheck, AlertCircle, Cpu, Split, Server, Router, Cable } from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

interface Package {
  id: number
  packageName: string
  price: number
  packageDuration: string
  isTrial: boolean
  referenceId: string
  packagePlanDetails?: {
    planName: string
    deviceLimit: number
  }
}

interface User {
  id: number
  name: string
  email: string
}

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  status?: string
  onboardStatus?: string
}

interface Membership {
  id: number
  name: string
}

interface ExistingISP {
  id: number
  name: string
  code?: string
  type?: string
}

interface Lead {
  id: number
  name: string
  email?: string
  phoneNumber?: string
}

interface OLT {
  id: number
  name: string
  ipAddress: string
  model: string
  ports: number
}

interface Splitter {
  id: number
  name: string
  splitterId: string
  splitRatio: string
  portCount: number
  oltId?: number
}

interface ConnectionUser {
  username: string
  password: string
}

interface DocumentFile {
  file: File | null
  type: 'idProof' | 'addressProof' | 'photo' | 'other'
  name: string
}

interface ProvisionResult {
  success: boolean
  message: string
  customer?: {
    id: number
    customerUniqueId: string
    name: string
    status: string
    onboardStatus: string
  }
  subscription?: any
  order?: any
  provisioning?: {
    radius: any[]
    tshul: any
    connectionUsers: number
    ont?: any
  }
}

export function AddCustomerForm() {
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showProvisionSection, setShowProvisionSection] = useState(false)
  const [createdCustomer, setCreatedCustomer] = useState<any>(null)
  const [provisionResult, setProvisionResult] = useState<ProvisionResult | null>(null)
  const [activeTab, setActiveTab] = useState("personal")

  // State for all data
  const [packages, setPackages] = useState<Package[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [existingISPs, setExistingISPs] = useState<ExistingISP[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [olts, setOlts] = useState<OLT[]>([])
  const [splitters, setSplitters] = useState<Splitter[]>([])

  const [loading, setLoading] = useState({
    packages: true,
    users: true,
    customers: true,
    memberships: true,
    existingISPs: true,
    leads: true,
    olts: true,
    splitters: true
  })

  // Form state initialization with all optional fields
  const [formValues, setFormValues] = useState({
    // Personal info - all optional
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    idNumber: "",
    panNumber: "",
    secondaryPhone: "",
    gender: "male",

    // Address
    streetAddress: "",
    city: "",
    district: "",
    state: "",
    zipCode: "",
  })

  const [coordinates, setCoordinates] = useState({
    lat: "",
    lon: ""
  })

  const [serviceDetails, setServiceDetails] = useState({
    connectionType: "fiber",
    deviceName: "",
    deviceSerialNumber: "",
    deviceMac: "",
    deviceModel: "",
    vlanId: "",
    vlanPriority: "0",
    assignedPkg: "",
    subscribedPkgId: "",
    billingCycle: "monthly",
    paymentMethod: ""
  })

  const [provisionDetails, setProvisionDetails] = useState({
    oltId: "",
    splitterId: "",
    splitterInputPort: "",
    oltPort: "",
    splitterOutputPort: "",
    ontSerialNumber: "",
    ontModel: "",
    provisioningNotes: "",
    useSplitter: true,
    useDirectOLT: false
  })

  const [referenceDetails, setReferenceDetails] = useState({
    membershipId: "",
    installedById: "",
    isReferenced: false,
    referencedById: "",
    existingISPId: "",
    leadId: ""
  })

  const [connectionUsers, setConnectionUsers] = useState<ConnectionUser[]>([
    { username: "", password: "" }
  ])

  const [documents, setDocuments] = useState<DocumentFile[]>([
    { file: null, type: 'idProof', name: 'ID Proof' },
    { file: null, type: 'addressProof', name: 'Address Proof' },
    { file: null, type: 'photo', name: 'Photo' },
    { file: null, type: 'other', name: 'Other Documents' }
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Map state
  const [markerPosition, setMarkerPosition] = useState({ x: 50, y: 50 })
  const [mapUrl, setMapUrl] = useState<string | null>(null)
  const [mapKey, setMapKey] = useState(Date.now())

  // Update map URL when coordinates change
  useEffect(() => {
    if (activeTab === "location" && coordinates.lat && coordinates.lon) {
      try {
        const lat = coordinates.lat || "27.7172"
        const lon = coordinates.lon || "85.3240"
        const timestamp = Date.now()
        const url = `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lon) - 0.01},${parseFloat(lat) - 0.01},${parseFloat(lon) + 0.01},${parseFloat(lat) + 0.01}&layer=mapnik&t=${timestamp}`
        setMapUrl(url)
        setMarkerPosition({ x: 50, y: 50 })
      } catch (error) {
        console.error("Error generating map URL:", error)
        setMapUrl(null)
      }
    } else {
      setMapUrl(null)
    }
  }, [coordinates, activeTab])

  // Force map refresh when tab changes to location
  useEffect(() => {
    if (activeTab === "location") {
      setMapKey(Date.now())
    }
  }, [activeTab])

  // Fetch all required data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading({
          packages: true,
          users: true,
          customers: true,
          memberships: true,
          existingISPs: true,
          leads: true,
          olts: true,
          splitters: true
        })

        const fetchExistingISPs = async () => {
          try {
            const response = await apiRequest("/existingisp")
            if (response && response.success) {
              return response.data || []
            } else {
              console.error("Failed to fetch existing ISPs:", response?.error)
              return []
            }
          } catch (error) {
            console.error("Error fetching existing ISPs:", error)
            return []
          }
        }

        const [
          packagesData,
          usersData,
          customersData,
          membershipsData,
          existingISPsData,
          leadsData,
          oltsData,
          splittersData
        ] = await Promise.all([
          apiRequest("/package-price").catch(() => []),
          apiRequest("/users").catch(() => []),
          apiRequest("/customer?limit=100").catch(() => ({ data: [] })),
          apiRequest("/membership").catch(() => []),
          fetchExistingISPs(),
          apiRequest("/lead").catch(() => []),
          apiRequest("/olt").catch(() => []),
          apiRequest("/splitters").catch(() => [])
        ])

        setPackages(Array.isArray(packagesData) ? packagesData : [])
        setUsers(Array.isArray(usersData) ? usersData : [])
        setCustomers(Array.isArray(customersData?.data) ? customersData.data : [])
        setMemberships(Array.isArray(membershipsData) ? membershipsData : [])
        setExistingISPs(Array.isArray(existingISPsData) ? existingISPsData : [])
        setOlts(Array.isArray(oltsData) ? oltsData : [])
        setSplitters(Array.isArray(splittersData) ? splittersData : [])

        let leadsArray: Lead[] = []
        if (Array.isArray(leadsData)) {
          leadsArray = leadsData.map((lead: any) => ({
            id: lead.id,
            name: lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown Lead',
            email: lead.email || '',
            phoneNumber: lead.phoneNumber || ''
          }))
        }
        setLeads(leadsArray)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading({
          packages: false,
          users: false,
          customers: false,
          memberships: false,
          existingISPs: false,
          leads: false,
          olts: false,
          splitters: false
        })
      }
    }

    fetchAllData()
  }, [])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormValues(prev => ({ ...prev, [id]: value }))
    setTouched(prev => ({ ...prev, [id]: true }))
  }

  const handleServiceChange = (field: string, value: string) => {
    setServiceDetails(prev => ({ ...prev, [field]: value }))
  }

  const handleProvisionChange = (field: string, value: string | boolean) => {
    setProvisionDetails(prev => ({ ...prev, [field]: value }))

    // Auto-populate OLT port when splitter is selected
    if (field === 'splitterId' && value) {
      const selectedSplitter = splitters.find(s => s.id.toString() === value)
      if (selectedSplitter && selectedSplitter.oltPort) {
        setProvisionDetails(prev => ({
          ...prev,
          oltPort: selectedSplitter.oltPort,
          oltId: selectedSplitter.oltId?.toString() || ""
        }))
      }
    }
  }

  const handleReferenceChange = (field: string, value: string | boolean) => {
    setReferenceDetails(prev => ({ ...prev, [field]: value }))
  }

  const handleCoordinateChange = (field: 'lat' | 'lon', value: string) => {
    setCoordinates(prev => ({ ...prev, [field]: value }))
  }

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          setCoordinates({
            lat: lat.toFixed(6),
            lon: lon.toFixed(6)
          })
          toast.success("Location detected successfully")
        },
        (error) => {
          toast.error(`Location error: ${error.message}`)
        },
      )
    } else {
      toast.error("Geolocation is not supported by this browser")
    }
  }

  // Handle map click
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    try {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      setMarkerPosition({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      })

      updateCoordinatesFromPosition(x, y)
    } catch (error) {
      console.error("Error handling map click:", error)
    }
  }

  // Calculate coordinates from percentage position
  const updateCoordinatesFromPosition = (x: number, y: number) => {
    try {
      const centerLat = parseFloat(coordinates.lat || "27.7172")
      const centerLon = parseFloat(coordinates.lon || "85.3240")

      const xPercent = (x - 50) / 100
      const yPercent = (50 - y) / 100

      const latOffset = yPercent * 0.02
      const lonOffset = xPercent * 0.02

      const newLat = (centerLat + latOffset).toFixed(6)
      const newLon = (centerLon + lonOffset).toFixed(6)

      setCoordinates({
        lat: newLat,
        lon: newLon,
      })
    } catch (error) {
      console.error("Error updating coordinates:", error)
    }
  }

  // Connection Users handlers
  const addConnectionUser = () => {
    setConnectionUsers([...connectionUsers, { username: "", password: "" }])
  }

  const removeConnectionUser = (index: number) => {
    if (connectionUsers.length > 1) {
      const updated = [...connectionUsers]
      updated.splice(index, 1)
      setConnectionUsers(updated)
    }
  }

  const updateConnectionUser = (index: number, field: keyof ConnectionUser, value: string) => {
    const updated = [...connectionUsers]
    updated[index][field] = value
    setConnectionUsers(updated)

    if (errors[`connectionUser_${index}_${field}`]) {
      const newErrors = { ...errors }
      delete newErrors[`connectionUser_${index}_${field}`]
      setErrors(newErrors)
    }
  }

  // Document handlers
  const handleDocumentUpload = (index: number, file: File | null) => {
    const updated = [...documents]
    updated[index].file = file
    setDocuments(updated)
  }

  // Validation - Minimal validation for draft creation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    // Only basic validation for draft creation
    if (!formValues.firstName.trim() && !formValues.lastName.trim()) {
      newErrors.name = "At least first name or last name is required"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Handle tab change
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
  }

  // Create customer (draft)
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix errors before submitting")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()

      // Personal Info - all optional
      if (formValues.firstName) formData.append('firstName', formValues.firstName)
      if (formValues.middleName) formData.append('middleName', formValues.middleName)
      if (formValues.lastName) formData.append('lastName', formValues.lastName)
      if (formValues.email) formData.append('email', formValues.email)
      if (formValues.phoneNumber) formData.append('phoneNumber', formValues.phoneNumber)
      if (formValues.idNumber) formData.append('idNumber', formValues.idNumber)
      if (formValues.panNumber) formData.append('panNumber', formValues.panNumber)
      if (formValues.secondaryPhone) formData.append('secondaryPhone', formValues.secondaryPhone)
      if (formValues.gender) formData.append('gender', formValues.gender)

      // Address
      if (formValues.streetAddress) formData.append('streetAddress', formValues.streetAddress)
      if (formValues.city) formData.append('city', formValues.city)
      if (formValues.district) formData.append('district', formValues.district)
      if (formValues.state) formData.append('state', formValues.state)
      if (formValues.zipCode) formData.append('zipCode', formValues.zipCode)

      // Coordinates
      if (coordinates.lat) formData.append('lat', coordinates.lat)
      if (coordinates.lon) formData.append('lon', coordinates.lon)

      // Service Details
      formData.append('connectionType', serviceDetails.connectionType)
      if (serviceDetails.deviceName) formData.append('deviceName', serviceDetails.deviceName)
      if (serviceDetails.deviceSerialNumber) formData.append('deviceSerialNumber', serviceDetails.deviceSerialNumber)
      if (serviceDetails.deviceMac) formData.append('deviceMac', serviceDetails.deviceMac)
      if (serviceDetails.deviceModel) formData.append('deviceModel', serviceDetails.deviceModel)
      if (serviceDetails.vlanId) formData.append('vlanId', serviceDetails.vlanId)
      formData.append('vlanPriority', serviceDetails.vlanPriority)
      if (serviceDetails.assignedPkg) formData.append('assignedPkg', serviceDetails.assignedPkg)
      if (serviceDetails.subscribedPkgId) formData.append('subscribedPkgId', serviceDetails.subscribedPkgId)
      formData.append('billingCycle', serviceDetails.billingCycle)
      if (serviceDetails.paymentMethod) formData.append('paymentMethod', serviceDetails.paymentMethod)

      // Provision Details (for fiber connections)
      if (serviceDetails.connectionType === 'fiber') {
        if (provisionDetails.oltId) formData.append('oltId', provisionDetails.oltId)
        if (provisionDetails.splitterId) formData.append('splitterId', provisionDetails.splitterId)
        if (provisionDetails.splitterInputPort) formData.append('splitterInputPort', provisionDetails.splitterInputPort)
        if (provisionDetails.oltPort) formData.append('oltPort', provisionDetails.oltPort)
        if (provisionDetails.splitterOutputPort) formData.append('splitterOutputPort', provisionDetails.splitterOutputPort)
        if (provisionDetails.ontSerialNumber) formData.append('ontSerialNumber', provisionDetails.ontSerialNumber)
        if (provisionDetails.ontModel) formData.append('ontModel', provisionDetails.ontModel)
        if (provisionDetails.provisioningNotes) formData.append('provisioningNotes', provisionDetails.provisioningNotes)
        formData.append('useSplitter', provisionDetails.useSplitter.toString())
        formData.append('useDirectOLT', provisionDetails.useDirectOLT.toString())
      }

      // Reference Details
      if (referenceDetails.membershipId) formData.append('membershipId', referenceDetails.membershipId)
      if (referenceDetails.installedById) formData.append('installedById', referenceDetails.installedById)
      formData.append('isReferenced', referenceDetails.isReferenced.toString())
      if (referenceDetails.referencedById) formData.append('referencedById', referenceDetails.referencedById)
      if (referenceDetails.existingISPId) formData.append('existingISPId', referenceDetails.existingISPId)
      if (referenceDetails.leadId) formData.append('leadId', referenceDetails.leadId)

      // Connection Users
      if (connectionUsers.length > 0 && connectionUsers.some(u => u.username)) {
        formData.append('connectionUsers', JSON.stringify(connectionUsers.filter(u => u.username)))
      }

      // Documents
      documents.forEach((doc) => {
        if (doc.file) {
          if (doc.type === 'other') {
            formData.append('otherDocuments', doc.file)
          } else {
            formData.append(doc.type, doc.file)
          }
        }
      })

      const response = await apiRequest("/customer", {
        method: 'POST',
        body: formData,
      })

      if (response.success) {
        setCreatedCustomer(response.customer)
        setShowProvisionSection(true)
        toast.success("Customer created successfully in draft status!")
      } else {
        throw new Error(response.error || "Failed to create customer")
      }

    } catch (error: any) {
      console.error("Submit error details:", error)
      toast.error(error.message || "Failed to create customer")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Provision customer (activate services)
  const handleProvisionCustomer = async () => {
    if (!createdCustomer) return

    setIsProvisioning(true)

    try {
      const response = await apiRequest(`/customer/${createdCustomer.id}/provision`, {
        method: 'POST',
      })

      setProvisionResult(response)

      if (response.success) {
        toast.success("Customer provisioned successfully!")
        // Update customer status
        setCreatedCustomer(prev => ({
          ...prev,
          status: 'active',
          onboardStatus: 'fully_onboarded'
        }))
      } else {
        toast.error(response.message || "Provisioning failed")
      }

    } catch (error: any) {
      console.error("Provision error details:", error)
      toast.error(error.message || "Failed to provision customer")
    } finally {
      setIsProvisioning(false)
    }
  }

  // Reset form for new customer
  const handleAddAnotherCustomer = () => {
    setFormValues({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      idNumber: "",
      panNumber: "",
      secondaryPhone: "",
      gender: "male",
      streetAddress: "",
      city: "",
      district: "",
      state: "",
      zipCode: "",
    })
    setCoordinates({ lat: "", lon: "" })
    setServiceDetails({
      connectionType: "fiber",
      deviceName: "",
      deviceSerialNumber: "",
      deviceMac: "",
      deviceModel: "",
      vlanId: "",
      vlanPriority: "0",
      assignedPkg: "",
      subscribedPkgId: "",
      billingCycle: "monthly",
      paymentMethod: ""
    })
    setProvisionDetails({
      oltId: "",
      splitterId: "",
      splitterInputPort: "",
      oltPort: "",
      splitterOutputPort: "",
      ontSerialNumber: "",
      ontModel: "",
      provisioningNotes: "",
      useSplitter: true,
      useDirectOLT: false
    })
    setReferenceDetails({
      membershipId: "",
      installedById: "",
      isReferenced: false,
      referencedById: "",
      existingISPId: "",
      leadId: ""
    })
    setConnectionUsers([{ username: "", password: "" }])
    setDocuments(documents.map(doc => ({ ...doc, file: null })))
    setCreatedCustomer(null)
    setProvisionResult(null)
    setShowProvisionSection(false)
    setIsSuccess(false)
    setActiveTab("personal")
  }

  // Success view
  if (isSuccess && createdCustomer) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Customer Process Complete</h3>
              <p className="mt-2 text-center text-muted-foreground">
                {createdCustomer.status === 'active'
                  ? "Customer has been created and fully provisioned."
                  : "Customer has been created in draft status and can be provisioned later."}
              </p>

              <div className="mt-6 p-4 border rounded-lg bg-muted/50 w-full max-w-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Customer ID</p>
                    <p className="text-sm">{createdCustomer.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Unique ID</p>
                    <p className="text-sm">{createdCustomer.customerUniqueId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className={`text-sm ${createdCustomer.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                      {createdCustomer.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Onboard Status</p>
                    <p className="text-sm">{createdCustomer.onboardStatus}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button asChild>
                  <a href={`/customers/${createdCustomer.id}`}>View Customer</a>
                </Button>
                <Button asChild>
                  <a href="/customers/all">View All Customers</a>
                </Button>
                <Button variant="outline" onClick={handleAddAnotherCustomer}>
                  Add Another Customer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {provisionResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Provisioning Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {provisionResult.provisioning && (
                <>
                  <div className="space-y-2">
                    <Label>RADIUS Provisioning</Label>
                    <div className="text-sm space-y-1">
                      {provisionResult.provisioning.radius.map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {r.status === 'provisioned' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>{r.username}: {r.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>ONT/OLT Provisioning</Label>
                    <div className="text-sm">
                      {provisionResult.provisioning.ont ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>ONT provisioned successfully</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>ONT provisioning skipped or failed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tshul Integration</Label>
                    <div className="text-sm">
                      {provisionResult.provisioning.tshul?.success ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{provisionResult.provisioning.tshul.message}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>{provisionResult.provisioning.tshul?.message || 'Not provisioned'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Provision Section */}
      {showProvisionSection && createdCustomer && (
        <Card className="border-2 border-blue-500">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Ready to Activate Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Alert>
              <AlertDescription>
                Customer <strong>{createdCustomer.name}</strong> has been created in draft status.
                {createdCustomer.status === 'draft' ? ' You can now provision services to activate the customer.' : ' Customer is already active.'}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Customer ID</p>
                <p className="text-sm">{createdCustomer.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Unique ID</p>
                <p className="text-sm font-mono">{createdCustomer.customerUniqueId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Status</p>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${createdCustomer.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span className="text-sm capitalize">{createdCustomer.status}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Onboard Status</p>
                <p className="text-sm capitalize">{createdCustomer.onboardStatus}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleProvisionCustomer}
                disabled={isProvisioning || createdCustomer.status === 'active'}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {isProvisioning ? "Provisioning..." : "Provision Services Now"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSuccess(true)
                  toast.success("Customer saved. You can provision services later from the customer details page.")
                }}
              >
                Skip for Now
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowProvisionSection(false)}
              >
                Back to Form
              </Button>
            </div>

            {provisionResult && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Provisioning Results:</h4>
                <pre className="text-xs bg-black text-white p-2 rounded overflow-auto">
                  {JSON.stringify(provisionResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      {(!showProvisionSection || !createdCustomer) && (
        <form onSubmit={handleCreateCustomer}>
          <Tabs defaultValue="personal" value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="service">Service Details</TabsTrigger>
              <TabsTrigger value="provisioning">Fiber Provisioning</TabsTrigger>
              <TabsTrigger value="references">References</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertDescription>
                      All fields are optional. Fill minimum details now and complete later.
                      Customer will be created in "draft" status.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formValues.firstName}
                        onChange={handleInputChange}
                        placeholder="John"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        value={formValues.middleName}
                        onChange={handleInputChange}
                        placeholder="M."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formValues.lastName}
                        onChange={handleInputChange}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {errors.name && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.name}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formValues.email}
                        onChange={handleInputChange}
                        placeholder="john.doe@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={formValues.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="9812345678"
                      />
                      <p className="text-xs text-muted-foreground">10-15 digits</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                      <Input
                        id="secondaryPhone"
                        value={formValues.secondaryPhone}
                        onChange={handleInputChange}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <SearchableSelect
                        options={[
                          { value: "male", label: "Male" },
                          { value: "female", label: "Female" },
                          { value: "other", label: "Other" }
                        ]}
                        value={formValues.gender}
                        onValueChange={(value) => setFormValues(prev => ({ ...prev, gender: value }))}
                        placeholder="Select gender"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="idNumber">ID Number / Passport</Label>
                      <Input
                        id="idNumber"
                        value={formValues.idNumber}
                        onChange={handleInputChange}
                        placeholder="Enter ID number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="panNumber">PAN Number (For Tshul)</Label>
                      <Input
                        id="panNumber"
                        value={formValues.panNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                          setFormValues(prev => ({ ...prev, panNumber: value }));
                        }}
                        placeholder="Optional - 9 digits"
                        maxLength={9}
                        type="text"
                        inputMode="numeric"
                      />
                      <p className="text-xs text-muted-foreground">
                        9-digit PAN for Tshul (auto-generated if not provided)
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={() => handleTabChange("location")}>
                      Next: Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="streetAddress">Street Address</Label>
                    <Input
                      id="streetAddress"
                      value={formValues.streetAddress}
                      onChange={handleInputChange}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formValues.city}
                        onChange={handleInputChange}
                        placeholder="Kathmandu"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="district">District</Label>
                      <Input
                        id="district"
                        value={formValues.district}
                        onChange={handleInputChange}
                        placeholder="Kathmandu"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={formValues.state}
                        onChange={handleInputChange}
                        placeholder="Bagmati"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={formValues.zipCode}
                        onChange={handleInputChange}
                        placeholder="44600"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Coordinates</Label>
                        <p className="text-sm text-muted-foreground">Set customer's geographic location</p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation}>
                          <Crosshair className="h-4 w-4 mr-2" />
                          Current Location
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          setCoordinates({ lat: "27.7172", lon: "85.3240" })
                          toast.success("Reset to default coordinates")
                        }}>
                          <MapPin className="h-4 w-4 mr-2" />
                          Default
                        </Button>
                      </div>
                    </div>

                    {/* Interactive Map - FIXED: Only render iframe when mapUrl exists */}
                    {coordinates.lat && coordinates.lon ? (
                      <div className="space-y-2">
                        <Label>Interactive Map</Label>
                        <div className="h-64 w-full rounded-lg overflow-hidden border relative">
                          {mapUrl && (
                            <iframe
                              key={mapKey}
                              src={mapUrl}
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              scrolling="no"
                              title="Customer location map"
                              className="absolute inset-0 z-10"
                              style={{ border: "none" }}
                            />
                          )}
                          <div className="absolute inset-0 z-20 cursor-crosshair" onClick={handleMapClick}>
                            <div
                              className="absolute w-8 h-8 -ml-4 -mt-8 cursor-grab active:cursor-grabbing z-30"
                              style={{
                                left: `${markerPosition.x}%`,
                                top: `${markerPosition.y}%`,
                                transition: "left 0.1s ease, top 0.1s ease",
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                <path
                                  d="M12 22C12 22 20 16 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 16 12 22 12 22Z"
                                  fill="#ef4444"
                                  stroke="#000000"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <circle cx="12" cy="10" r="3" fill="white" stroke="#000000" strokeWidth="2" />
                              </svg>
                            </div>
                          </div>
                          <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm text-xs p-2 rounded z-40">
                            <p>Click on map to set the exact customer location</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Alert>
                        <AlertDescription>
                          Enter coordinates or use "Current Location" to enable the interactive map.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          value={coordinates.lat}
                          onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                          placeholder="27.7172"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          value={coordinates.lon}
                          onChange={(e) => handleCoordinateChange('lon', e.target.value)}
                          placeholder="85.3240"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("personal")}>
                      Previous
                    </Button>
                    <Button type="button" onClick={() => handleTabChange("service")}>
                      Next: Service Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Service Details Tab */}
            <TabsContent value="service">
              <Card>
                <CardHeader>
                  <CardTitle>Service Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertDescription>
                      Fill service details now or later. These are required for provisioning.
                    </AlertDescription>
                  </Alert>

                  {/* Connection Type */}
                  <div className="space-y-4">
                    <Label>Connection Type</Label>
                    <RadioGroup
                      value={serviceDetails.connectionType}
                      onValueChange={(value) => handleServiceChange('connectionType', value)}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="fiber" id="fiber" />
                        <Label htmlFor="fiber" className="flex items-center cursor-pointer">
                          <Cable className="mr-2 h-5 w-5" />
                          Fiber
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="pppoe" id="pppoe" />
                        <Label htmlFor="pppoe" className="flex items-center cursor-pointer">
                          <Router className="mr-2 h-5 w-5" />
                          PPPoE
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="hotspot" id="hotspot" />
                        <Label htmlFor="hotspot" className="flex items-center cursor-pointer">
                          <Server className="mr-2 h-5 w-5" />
                          Hotspot
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Packages */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="assignedPkg">Assigned Package (Trial)</Label>
                      <SearchableSelect
                        options={packages
                          .filter(pkg => pkg.isTrial)
                          .map(pkg => ({
                            value: pkg.id.toString(),
                            label: pkg.packageName,
                            description: `${pkg.packageDuration} - Rs. ${pkg.price}`
                          }))}
                        value={serviceDetails.assignedPkg}
                        onValueChange={(value) => handleServiceChange('assignedPkg', value)}
                        placeholder={loading.packages ? "Loading packages..." : "Select assigned package"}
                        disabled={loading.packages}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subscribedPkgId">Subscribed Package</Label>
                      <SearchableSelect
                        options={packages
                          .filter(pkg => !pkg.isTrial)
                          .map(pkg => ({
                            value: pkg.id.toString(),
                            label: pkg.packageName,
                            description: `${pkg.packageDuration} - Rs. ${pkg.price}`
                          }))}
                        value={serviceDetails.subscribedPkgId}
                        onValueChange={(value) => handleServiceChange('subscribedPkgId', value)}
                        placeholder={loading.packages ? "Loading packages..." : "Select subscribed package"}
                        disabled={loading.packages}
                      />
                    </div>
                  </div>

                  {/* Device Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="deviceName">Device Name</Label>
                      <Input
                        id="deviceName"
                        value={serviceDetails.deviceName}
                        onChange={(e) => handleServiceChange('deviceName', e.target.value)}
                        placeholder="TP-Link Archer C7"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deviceSerialNumber">Device Serial Number</Label>
                      <Input
                        id="deviceSerialNumber"
                        value={serviceDetails.deviceSerialNumber}
                        onChange={(e) => handleServiceChange('deviceSerialNumber', e.target.value)}
                        placeholder="SN123456789"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="deviceMac">MAC Address</Label>
                      <Input
                        id="deviceMac"
                        value={serviceDetails.deviceMac}
                        onChange={(e) => handleServiceChange('deviceMac', e.target.value)}
                        placeholder="00:1A:2B:3C:4D:5E"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deviceModel">Device Model</Label>
                      <Input
                        id="deviceModel"
                        value={serviceDetails.deviceModel}
                        onChange={(e) => handleServiceChange('deviceModel', e.target.value)}
                        placeholder="Archer C7 v5"
                      />
                    </div>
                  </div>

                  {/* Billing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="billingCycle">Billing Cycle</Label>
                      <SearchableSelect
                        options={[
                          { value: "monthly", label: "Monthly" },
                          { value: "quarterly", label: "Quarterly" },
                          { value: "half-yearly", label: "Half Yearly" },
                          { value: "yearly", label: "Yearly" },
                          { value: "custom", label: "Custom" }
                        ]}
                        value={serviceDetails.billingCycle}
                        onValueChange={(value) => handleServiceChange('billingCycle', value)}
                        placeholder="Select billing cycle"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <SearchableSelect
                        options={[
                          { value: "cash", label: "Cash" },
                          { value: "credit_card", label: "Credit Card" },
                          { value: "bank_transfer", label: "Bank Transfer" },
                          { value: "esewa", label: "eSewa" },
                          { value: "khalti", label: "Khalti" }
                        ]}
                        value={serviceDetails.paymentMethod}
                        onValueChange={(value) => handleServiceChange('paymentMethod', value)}
                        placeholder="Select payment method"
                      />
                    </div>
                  </div>

                  {/* Connection Users */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Connection Users</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addConnectionUser}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </div>

                    {connectionUsers.map((user, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input
                            value={user.username}
                            onChange={(e) => updateConnectionUser(index, 'username', e.target.value)}
                            placeholder={`user${index + 1}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input
                            type="password"
                            value={user.password}
                            onChange={(e) => updateConnectionUser(index, 'password', e.target.value)}
                            placeholder="Password"
                          />
                        </div>

                        <div className="flex gap-2">
                          {connectionUsers.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => removeConnectionUser(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("location")}>
                      Previous
                    </Button>
                    {serviceDetails.connectionType === 'fiber' ? (
                      <Button type="button" onClick={() => handleTabChange("provisioning")}>
                        Next: Fiber Provisioning
                      </Button>
                    ) : (
                      <Button type="button" onClick={() => handleTabChange("references")}>
                        Next: References
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fiber Provisioning Tab */}
            {serviceDetails.connectionType === 'fiber' && (
              <TabsContent value="provisioning">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="h-5 w-5" />
                      Fiber Network Provisioning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert>
                      <AlertDescription>
                        Configure OLT, splitter, and ONT details for fiber network provisioning.
                        These details are required for activating fiber services.
                      </AlertDescription>
                    </Alert>

                    {/* Connection Method */}
                    <div className="space-y-4">
                      <Label>Connection Method</Label>
                      <RadioGroup
                        value={provisionDetails.useSplitter ? "splitter" : "direct"}
                        onValueChange={(value) => {
                          if (value === "splitter") {
                            setProvisionDetails(prev => ({ ...prev, useSplitter: true, useDirectOLT: false }))
                          } else {
                            setProvisionDetails(prev => ({ ...prev, useSplitter: false, useDirectOLT: true }))
                          }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                          <RadioGroupItem value="splitter" id="splitter" />
                          <Label htmlFor="splitter" className="flex items-center cursor-pointer">
                            <Split className="mr-2 h-5 w-5" />
                            Via Splitter
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                          <RadioGroupItem value="direct" id="direct" />
                          <Label htmlFor="direct" className="flex items-center cursor-pointer">
                            <Server className="mr-2 h-5 w-5" />
                            Direct OLT Port
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* OLT Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="oltId" className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        OLT
                      </Label>
                      <SearchableSelect
                        options={olts.map(olt => ({
                          value: olt.id.toString(),
                          label: olt.name,
                          description: `${olt.model} | ${olt.ipAddress} | Ports: ${olt.ports}`
                        }))}
                        value={provisionDetails.oltId}
                        onValueChange={(value) => handleProvisionChange('oltId', value)}
                        placeholder={loading.olts ? "Loading OLTs..." : "Select OLT"}
                        disabled={loading.olts}
                      />
                    </div>

                    {/* Splitter Configuration */}
                    {provisionDetails.useSplitter && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Split className="h-5 w-5" />
                          <h4 className="font-medium">Splitter Configuration</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="splitterId">Splitter</Label>
                            <SearchableSelect
                              options={splitters.map(splitter => ({
                                value: splitter.id.toString(),
                                label: splitter.name || splitter.splitterId,
                                description: `Ratio: ${splitter.splitRatio} | Ports: ${splitter.portCount}`
                              }))}
                              value={provisionDetails.splitterId}
                              onValueChange={(value) => handleProvisionChange('splitterId', value)}
                              placeholder={loading.splitters ? "Loading splitters..." : "Select splitter"}
                              disabled={loading.splitters}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="splitterInputPort">Splitter Input Port</Label>
                            <Input
                              id="splitterInputPort"
                              value={provisionDetails.splitterInputPort}
                              onChange={(e) => handleProvisionChange('splitterInputPort', e.target.value)}
                              placeholder="1-4"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="oltPort">OLT Port (to Splitter)</Label>
                            <Input
                              id="oltPort"
                              value={provisionDetails.oltPort}
                              onChange={(e) => handleProvisionChange('oltPort', e.target.value)}
                              placeholder="1-16"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="splitterOutputPort">Splitter Output Port</Label>
                            <Input
                              id="splitterOutputPort"
                              value={provisionDetails.splitterOutputPort}
                              onChange={(e) => handleProvisionChange('splitterOutputPort', e.target.value)}
                              placeholder="1-32"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Direct OLT Port */}
                    {provisionDetails.useDirectOLT && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Server className="h-5 w-5" />
                          <h4 className="font-medium">Direct OLT Port Configuration</h4>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="oltPort">OLT Service Board Port</Label>
                          <Input
                            id="oltPort"
                            value={provisionDetails.oltPort}
                            onChange={(e) => handleProvisionChange('oltPort', e.target.value)}
                            placeholder="Service board port (e.g., 0/1/1)"
                          />
                        </div>
                      </div>
                    )}

                    {/* ONT Details */}
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Router className="h-5 w-5" />
                        <h4 className="font-medium">ONT (Optical Network Terminal) Details</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="ontSerialNumber">ONT Serial Number</Label>
                          <Input
                            id="ontSerialNumber"
                            value={provisionDetails.ontSerialNumber}
                            onChange={(e) => handleProvisionChange('ontSerialNumber', e.target.value)}
                            placeholder="ONT serial number"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ontModel">ONT Model</Label>
                          <Input
                            id="ontModel"
                            value={provisionDetails.ontModel}
                            onChange={(e) => handleProvisionChange('ontModel', e.target.value)}
                            placeholder="e.g., HG8245H, HG8010H"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="provisioningNotes">Provisioning Notes</Label>
                        <Textarea
                          id="provisioningNotes"
                          value={provisionDetails.provisioningNotes}
                          onChange={(e) => handleProvisionChange('provisioningNotes', e.target.value)}
                          placeholder="Any special instructions for provisioning..."
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("service")}>
                        Previous
                      </Button>
                      <Button type="button" onClick={() => handleTabChange("references")}>
                        Next: References
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* References Tab */}
            <TabsContent value="references">
              <Card>
                <CardHeader>
                  <CardTitle>Customer References</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Membership */}
                  <div className="space-y-2">
                    <Label htmlFor="membershipId">Membership</Label>
                    <SearchableSelect
                      options={memberships.map(membership => ({
                        value: membership.id.toString(),
                        label: membership.name
                      }))}
                      value={referenceDetails.membershipId}
                      onValueChange={(value) => handleReferenceChange('membershipId', value)}
                      placeholder={loading.memberships ? "Loading memberships..." : "Select membership"}
                      disabled={loading.memberships}
                    />
                  </div>

                  {/* Installed By */}
                  <div className="space-y-2">
                    <Label htmlFor="installedById">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Installed By (Technician)
                      </div>
                    </Label>
                    <SearchableSelect
                      options={users.map(user => ({
                        value: user.id.toString(),
                        label: user.name,
                        description: user.email
                      }))}
                      value={referenceDetails.installedById}
                      onValueChange={(value) => handleReferenceChange('installedById', value)}
                      placeholder={loading.users ? "Loading users..." : "Select technician"}
                      disabled={loading.users}
                    />
                  </div>

                  {/* Referred By */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isReferenced">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Referred by Existing Customer?
                        </div>
                      </Label>
                      <Switch
                        checked={referenceDetails.isReferenced}
                        onCheckedChange={(checked) => handleReferenceChange('isReferenced', checked)}
                      />
                    </div>

                    {referenceDetails.isReferenced && (
                      <div className="space-y-2">
                        <Label htmlFor="referencedById">Referenced By Customer</Label>
                        <SearchableSelect
                          options={customers.map(customer => ({
                            value: customer.id.toString(),
                            label: `${customer.firstName} ${customer.lastName}`,
                            description: `${customer.email} | ${customer.phoneNumber}`
                          }))}
                          value={referenceDetails.referencedById}
                          onValueChange={(value) => handleReferenceChange('referencedById', value)}
                          placeholder={loading.customers ? "Loading customers..." : "Select customer"}
                          disabled={loading.customers}
                        />
                      </div>
                    )}
                  </div>

                  {/* Previous ISP */}
                  <div className="space-y-2">
                    <Label htmlFor="existingISPId">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Previous ISP
                      </div>
                    </Label>
                    <SearchableSelect
                      options={existingISPs.map(isp => ({
                        value: isp.id.toString(),
                        label: `${isp.name}${isp.code ? ` (${isp.code})` : ''}`,
                        description: isp.type ? `Type: ${isp.type.charAt(0).toUpperCase() + isp.type.slice(1)}` : undefined
                      }))}
                      value={referenceDetails.existingISPId}
                      onValueChange={(value) => handleReferenceChange('existingISPId', value)}
                      placeholder={loading.existingISPs ? "Loading ISPs..." : "Select previous ISP"}
                      disabled={loading.existingISPs}
                    />
                  </div>

                  {/* Lead Source */}
                  <div className="space-y-2">
                    <Label htmlFor="leadId">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Lead Source
                      </div>
                    </Label>
                    <SearchableSelect
                      options={leads.map(lead => ({
                        value: lead.id.toString(),
                        label: lead.name,
                        description: lead.email || lead.phoneNumber
                          ? `${lead.email || ''} ${lead.email && lead.phoneNumber ? '|' : ''} ${lead.phoneNumber || ''}`
                          : undefined
                      }))}
                      value={referenceDetails.leadId}
                      onValueChange={(value) => handleReferenceChange('leadId', value)}
                      placeholder={loading.leads ? "Loading leads..." : "Select lead source"}
                      disabled={loading.leads}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() =>
                      serviceDetails.connectionType === 'fiber' ? setActiveTab("provisioning") : setActiveTab("service")
                    }>
                      Previous
                    </Button>
                    <Button type="button" onClick={() => handleTabChange("documents")}>
                      Next: Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Document Upload</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Document Upload</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload customer identification and verification documents (Optional, Max 10MB each)
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {documents.map((doc, index) => (
                        <div key={doc.type} className="space-y-2">
                          <Label htmlFor={`document-${doc.type}`}>{doc.name}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`document-${doc.type}`}
                              type="file"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(index, e.target.files?.[0] || null)}
                              accept={doc.type === 'photo' ? 'image/*' : '.pdf,.jpg,.jpeg,.png,.doc,.docx'}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => document.getElementById(`document-${doc.type}`)?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              {doc.file ? doc.file.name : `Upload ${doc.name}`}
                            </Button>
                          </div>
                          {doc.file && (
                            <p className="text-xs text-muted-foreground">
                              {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("references")}>
                      Previous
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating Customer..." : "Create Customer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      )}
    </div>
  )
}