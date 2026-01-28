"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CustomerDeviceStatus } from "@/components/customers/customer-device-status"
import { CustomerUsageChart } from "@/components/customers/customer-usage-chart"
import { CustomerInvoices } from "@/components/customers/customer-invoices"
import { CustomerTickets } from "@/components/customers/customer-tickets"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Wifi,
  FileText,
  LifeBuoy,
  Activity,
  Clock,
  Network,
  Cable,
  Router,
  Settings,
  AlertCircle,
  Trash2,
  Loader2,
  Package,
  RefreshCw,
  Shield,
  Award,
  Users,
  FileCheck,
  Link,
  Globe,
  HardDrive,
} from "lucide-react"
import { apiRequest } from "@/lib/api"

// Add these dialog components for modals
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Customer {
  id: number
  firstName: string
  middleName: string | null
  lastName: string
  email: string
  phoneNumber: string
  idNumber: string
  status: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
  lat: number
  lon: number
  deviceName: string
  deviceMac: string
  connectionType: string
  billingCycle: string
  paymentMethod: string | null
  vlanId: string | null
  vlanPriority: string
  rechargeable: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  assignedPkg: number
  subscribedPkgId: number
  ispId: number
  membershipId: number | null
  installedById: number | null
  isReferenced: boolean
  referencedById: number | null
  existingISPId: number | null
  leadId: number | null
  customerUniqueId: string | null
  packagePrice: {
    id: number
    planId: number
    price: number
    packageDuration: string
    referenceId: string
    packageName: string
    isTrial: boolean
    isActive: boolean
    isDeleted: boolean
    packagePlanDetails: {
      id: number
      planName: string
      planCode: string
      connectionType: number
      dataLimit: number
      downSpeed: number
      upSpeed: number
      deviceLimit: number
      isPopular: boolean
      description: string
      isActive: boolean
      isDeleted: boolean
    }
  }
  subscribedPkg: {
    id: number
    planId: number
    price: number
    packageDuration: string
    referenceId: string
    packageName: string
    isTrial: boolean
    isActive: boolean
    isDeleted: boolean
    packagePlanDetails: {
      id: number
      planName: string
      planCode: string
      connectionType: number
      dataLimit: number
      downSpeed: number
      upSpeed: number
      deviceLimit: number
      isPopular: boolean
      description: string
      isActive: boolean
      isDeleted: boolean
    }
  }
  membership: {
    id: number
    name: string
    code: string
    description: string
    address: string
    details: string
    newMemberEnabled: boolean
    newMemberIsPercent: boolean
    newMemberValue: number
    renewalEnabled: boolean
    renewalIsPercent: boolean
    renewalValue: number
    isActive: boolean
    isDeleted: boolean
  } | null
  installedBy: {
    name: string
    email: string
  } | null
  referencedBy: {
    firstName: string
    lastName: string
    email: string
  } | null
  existingISP: {
    id: number
    name: string
  } | null
  documents: Array<{
    id: number
    documentType: string
    fileName: string
    filePath: string
    mimeType: string
    size: number
    uploadedAt: string
    isDeleted: boolean
  }>
  connectionUsers: Array<{
    id: number
    username: string
    password: string
    isActive: boolean
    isDeleted: boolean
    createdAt: string
  }>
  customerSubscriptions: Array<{
    id: number
    package: number
    isTrial: boolean
    planStart: string
    planEnd: string
    isActive: boolean
    isInvoicing: boolean
    packagePrice: {
      id: number
      planId: number
      price: number
      packageDuration: string
      referenceId: string
      packageName: string
      isTrial: boolean
      packagePlanDetails: {
        id: number
        planName: string
        planCode: string
        downSpeed: number
        upSpeed: number
        deviceLimit: number
      }
    }
  }>
  orders: Array<{
    id: number
    totalAmount: number
    orderDate: string
    packageStart: string
    packageEnd: string
    isPaid: boolean
    isActive: boolean
    items: Array<{
      id: number
      itemName: string
      referenceId: string
      itemPrice: number
      createdAt: string
    }>
    packagePrice: {
      id: number
      planId: number
      price: number
      packageDuration: string
      referenceId: string
      packageName: string
      isTrial: boolean
      packagePlanDetails: {
        id: number
        planName: string
        planCode: string
        downSpeed: number
        upSpeed: number
        deviceLimit: number
      }
    }
  }>
  isp: {
    companyName: string
    phoneNumber: string
    masterEmail: string
  }
}

interface PackageOption {
  id: number
  packageName: string
  price: number
  packageDuration: string
  packagePlanDetails: {
    planName: string
    downSpeed: number
    upSpeed: number
  }
}

export function CustomerProfile() {
  const [activeTab, setActiveTab] = useState("overview")
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [packages, setPackages] = useState<PackageOption[]>([])
  
  // Modal states
  const [changeUsernameOpen, setChangeUsernameOpen] = useState(false)
  const [changePackageOpen, setChangePackageOpen] = useState(false)
  const [resetMacOpen, setResetMacOpen] = useState(false)
  const [renewPackageOpen, setRenewPackageOpen] = useState(false) // New state
  
  // Form states
  const [newUsername, setNewUsername] = useState("")
  const [selectedConnectionUser, setSelectedConnectionUser] = useState("")
  const [selectedPackage, setSelectedPackage] = useState("")
  const [newMacAddress, setNewMacAddress] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [renewLoading, setRenewLoading] = useState(false) // New loading state
  
  const params = useParams()
  const router = useRouter()

  const customerId = params.id as string

  // Add state for network settings
  const [networkSettings, setNetworkSettings] = useState({
    dnd: false,
    autoRenew: true,
    dontSuspend: false,
    excludeMACBind: false,
    bindMAC: true,
    bindIP: true,
    bindNASPORT: false,
  })

  // Fetch customer data from API
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const data = await apiRequest<Customer>(`/customer/${customerId}`)
        
        if (data) {
          setCustomer(data)
          // Set initial values for forms
          if (data.connectionUsers.length > 0) {
            setSelectedConnectionUser(data.connectionUsers[0].id.toString())
          }
          setNewMacAddress(data.deviceMac || "")
        } else {
          setError("Customer not found")
          toast({
            title: "Error",
            description: "Customer not found",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error("Error fetching customer:", error)
        setError(error.message || "Failed to fetch customer data")
        toast({
          title: "Error",
          description: "Failed to load customer data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchCustomer()
    }
  }, [customerId])

  // Fetch available packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await apiRequest<PackageOption[]>('/package-price')
        if (data) {
          setPackages(data)
          if (data.length > 0 && customer) {
            setSelectedPackage(customer.subscribedPkgId.toString())
          }
        }
      } catch (error) {
        console.error("Error fetching packages:", error)
      }
    }
    
    if (customer) {
      fetchPackages()
    }
  }, [customer])

  // Function to toggle network settings
  const toggleSetting = (setting: keyof typeof networkSettings) => {
    setNetworkSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }))
    toast({
      title: "Setting updated",
      description: `${setting} has been ${!networkSettings[setting] ? "enabled" : "disabled"}.`,
    })
  }

  // Function to change username
  const handleChangeUsername = async () => {
    if (!newUsername.trim() || !selectedConnectionUser) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setActionLoading(true)
      const response = await apiRequest(`/customer/${customerId}/username`, {
        method: 'PUT',
        data: {
          connectionUserId: parseInt(selectedConnectionUser),
          newUsername: newUsername.trim()
        }
      })
      
      toast({
        title: "Success",
        description: response.message || "Username changed successfully",
      })
      
      // Refresh customer data
      const updatedCustomer = await apiRequest<Customer>(`/customer/${customerId}`)
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
      }
      
      setChangeUsernameOpen(false)
      setNewUsername("")
    } catch (error: any) {
      console.error("Error changing username:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to change username",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Function to change package
  const handleChangePackage = async () => {
    if (!selectedPackage) {
      toast({
        title: "Error",
        description: "Please select a package",
        variant: "destructive",
      })
      return
    }

    try {
      setActionLoading(true)
      const response = await apiRequest(`/customer/${customerId}/package`, {
        method: 'PUT',
        data: {
          newPackageId: parseInt(selectedPackage)
        }
      })
      
      toast({
        title: "Success",
        description: response.message || "Package changed successfully",
      })
      
      // Refresh customer data
      const updatedCustomer = await apiRequest<Customer>(`/customer/${customerId}`)
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
      }
      
      setChangePackageOpen(false)
    } catch (error: any) {
      console.error("Error changing package:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to change package",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Function to reset MAC address
  const handleResetMac = async () => {
    if (!newMacAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a MAC address",
        variant: "destructive",
      })
      return
    }

    // Validate MAC format
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(newMacAddress.trim())) {
      toast({
        title: "Error",
        description: "Invalid MAC address format. Use format like: 00:1A:2B:3C:4D:5E",
        variant: "destructive",
      })
      return
    }

    try {
      setActionLoading(true)
      const response = await apiRequest(`/customer/${customerId}/mac`, {
        method: 'PUT',
        data: {
          newMacAddress: newMacAddress.trim()
        }
      })
      
      toast({
        title: "Success",
        description: response.message || "MAC address reset successfully",
      })
      
      // Refresh customer data
      const updatedCustomer = await apiRequest<Customer>(`/customer/${customerId}`)
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
        setNewMacAddress(updatedCustomer.deviceMac || "")
      }
      
      setResetMacOpen(false)
    } catch (error: any) {
      console.error("Error resetting MAC:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to reset MAC address",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Function to renew package
  const handleRenewPackage = async () => {
    try {
      setRenewLoading(true)
      
      const response = 
            await apiRequest("/customer/subscribe", {
              method: 'POST',
              body: JSON.stringify({ customerId: parseInt(customerId),   "createOrder": true }),
              headers: {
                'Content-Type': 'application/json',
              }
            })
      
      
      toast({
        title: "Success",
        description: "Package renewed successfully",
      })
      
      // Refresh customer data
      const updatedCustomer = await apiRequest<Customer>(`/customer/${customerId}`)
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
      }
      
      setRenewPackageOpen(false)
    } catch (error: any) {
      console.error("Error renewing package:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to renew package",
        variant: "destructive",
      })
    } finally {
      setRenewLoading(false)
    }
  }

  // Function to delete customer
  const handleDeleteCustomer = async () => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      return
    }

    try {
      setActionLoading(true)
      await apiRequest(`/customer/${customerId}`, {
        method: 'DELETE',
      })
      
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      })
      
      router.push('/customers')
    } catch (error: any) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Helper functions to format data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NRS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCustomerFullName = () => {
    if (!customer) return ""
    return `${customer.firstName} ${customer.middleName ? customer.middleName + ' ' : ''}${customer.lastName}`
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    
    switch (statusLower) {
      case "active":
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">ACTIVE</Badge>
        )
      case "suspended":
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">SUSPENDED</Badge>
        )
      case "inactive":
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0">INACTIVE</Badge>
        )
      default:
        return (
          <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0">{status.toUpperCase()}</Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading customer data...</p>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error || "Customer not found"}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/customers')}
            className="mt-2"
          >
            Back to Customers
          </Button>
        </div>
      </div>
    )
  }

  // Calculate financial data from orders
  const invoiceAmount = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalPaid = customer.orders.filter(order => order.isPaid).reduce((sum, order) => sum + order.totalAmount, 0)
  const dueAmount = invoiceAmount - totalPaid
  const latestOrder = customer.orders.length > 0 ? customer.orders[customer.orders.length - 1] : null

  // Get latest subscription
  const latestSubscription = customer.customerSubscriptions.length > 0 
    ? customer.customerSubscriptions[0]
    : null

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!latestSubscription) return 0
    const expiryDate = new Date(latestSubscription.planEnd)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const daysUntilExpiry = getDaysUntilExpiry()

  // Format connection type
  const formatConnectionType = (type: string) => {
    return type.toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Change Username Dialog */}
      <Dialog open={changeUsernameOpen} onOpenChange={setChangeUsernameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
            <DialogDescription>
              Update the username for this customer's connection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="connection-user">Connection User</Label>
              <Select value={selectedConnectionUser} onValueChange={setSelectedConnectionUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select connection user" />
                </SelectTrigger>
                <SelectContent>
                  {customer.connectionUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-username">New Username</Label>
              <Input
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeUsernameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeUsername} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Username
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Package Dialog */}
      <Dialog open={changePackageOpen} onOpenChange={setChangePackageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Package</DialogTitle>
            <DialogDescription>
              Select a new package for this customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="package">Select Package</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id.toString()}>
                      {pkg.packageName} - {formatPrice(pkg.price)}/{pkg.packageDuration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPackage && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  The customer will be switched to the selected package immediately.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePackageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePackage} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset MAC Dialog */}
      <Dialog open={resetMacOpen} onOpenChange={setResetMacOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset MAC Address</DialogTitle>
            <DialogDescription>
              Update the MAC address for this customer's device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-mac">Current MAC Address</Label>
              <Input
                id="current-mac"
                value={customer.deviceMac || "Not set"}
                readOnly
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-mac">New MAC Address</Label>
              <Input
                id="new-mac"
                value={newMacAddress}
                onChange={(e) => setNewMacAddress(e.target.value)}
                placeholder="00:1A:2B:3C:4D:5E"
              />
              <p className="text-xs text-muted-foreground">
                Format: 00:1A:2B:3C:4D:5E or 00-1A-2B-3C-4D-5E
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetMacOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetMac} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset MAC Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew Package Dialog */}
      <Dialog open={renewPackageOpen} onOpenChange={setRenewPackageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Package</DialogTitle>
            <DialogDescription>
              Renew the current package for this customer. This will create a new order and extend the subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">Current Package</div>
                  <div className="text-sm text-muted-foreground">
                    {customer?.subscribedPkg?.packageName} - {formatPrice(customer?.subscribedPkg?.price || 0)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div className="text-sm">
                  A new order will be created and the subscription will be extended based on the package duration.
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewPackageOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRenewPackage} 
              disabled={renewLoading}
              className="bg-gradient-to-r from-green-500 to-emerald-600"
            >
              {renewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Renew Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CardContainer className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2">
              <AvatarImage src={`/placeholder.svg?text=${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`} alt={getCustomerFullName()} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white">
                {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{getCustomerFullName()}</h2>
                <div className="flex items-center gap-2">
                  {getStatusBadge(customer.status)}
                  {latestSubscription?.isTrial && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">TRIAL</Badge>
                  )}
                  {customer.rechargeable && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">RECHARGEABLE</Badge>
                  )}
                  {/* FIX: Only show REFERRED if customer is referenced AND has a referrer */}
                  {customer.isReferenced && customer.referencedById && (
                    <Badge className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white border-0">REFERRED</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center">
                  <Shield className="mr-1 h-4 w-4" />
                  ID Number: {customer.idNumber || "N/A"}
                </div>
                <div className="flex items-center">
                  <Phone className="mr-1 h-4 w-4" />
                  Mobile: {customer.phoneNumber}
                </div>
                <div className="flex items-center">
                  <Mail className="mr-1 h-4 w-4" />
                  Email: {customer.email}
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  Member Since: {formatDate(customer.createdAt)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Customer ID: CUST-{customer.id.toString().padStart(3, '0')} | ISP: {customer.isp.companyName} | Lead ID: {customer.leadId || "N/A"}
              </div>
            </div>
          </div>
        </div>
      </CardContainer>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 p-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg shadow-sm">
        <Button
          size="sm"
          className="h-9 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm hover:shadow-md transition-all"
          onClick={() => setRenewPackageOpen(true)}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Renew Package
        </Button>
        
        <Button
          size="sm"
          className="h-9 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm hover:shadow-md transition-all"
          onClick={() => setChangeUsernameOpen(true)}
        >
          <User className="mr-2 h-4 w-4" />
          Change Username
        </Button>
        
        <Button
          size="sm"
          className="h-9 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-sm hover:shadow-md transition-all"
          onClick={() => setChangePackageOpen(true)}
        >
          <Package className="mr-2 h-4 w-4" />
          Change Packages
        </Button>
        
        <Button
          size="sm"
          className="h-9 bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-sm hover:shadow-md transition-all"
          onClick={() => setResetMacOpen(true)}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          MAC RESET
        </Button>
        
        <Button
          size="sm"
          className="h-9 bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-sm hover:shadow-md transition-all"
          onClick={handleDeleteCustomer}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete Customer
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 p-1 rounded-lg">
          <TabsTrigger
            value="overview"
            className="flex-1 flex items-center justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/80 data-[state=active]:to-primary data-[state=active]:text-white"
          >
            <User className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="flex-1 flex items-center justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/80 data-[state=active]:to-primary data-[state=active]:text-white"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger
            value="devices"
            className="flex-1 flex items-center justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/80 data-[state=active]:to-primary data-[state=active]:text-white"
          >
            <Wifi className="mr-2 h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="flex-1 flex items-center justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/80 data-[state=active]:to-primary data-[state=active]:text-white"
          >
            <FileText className="mr-2 h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="support"
            className="flex-1 flex items-center justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/80 data-[state=active]:to-primary data-[state=active]:text-white"
          >
            <LifeBuoy className="mr-2 h-4 w-4" />
            Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Account Details */}
            <CardContainer
              title="Account Details"
              className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Customer ID:</span>
                    <span className="font-medium">CUST-{customer.id.toString().padStart(3, '0')}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <span className="text-muted-foreground">Customer Unique ID:</span>
                  <span className="font-medium font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {customer.customerUniqueId || `CUST-${customer.id.toString().padStart(3, '0')}`}
                  </span>
                </div>

                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Primary Username:</span>
                    <span className="font-medium">
                      {customer.connectionUsers.length > 0 ? customer.connectionUsers[0].username : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">ID Number:</span>
                    <span className="font-medium">{customer.idNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Full Name:</span>
                    <span className="font-medium">{getCustomerFullName()}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Email Address:</span>
                    <span className="font-medium text-blue-500">{customer.email}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Phone Number:</span>
                    <span className="font-medium">{customer.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Account Status:</span>
                    <span className="font-medium">{getStatusBadge(customer.status)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Registration Date:</span>
                    <span className="font-medium">{formatDate(customer.createdAt)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">{formatDate(customer.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </CardContainer>

            {/* Service Information */}
            <CardContainer
              title="Service Information"
              className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">ISP Provider:</span>
                    <span className="font-medium">{customer.isp.companyName}</span>
                  </div>
                  {customer.membership && (
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Membership:</span>
                      <div className="text-right">
                        <div className="font-medium">{customer.membership.name}</div>
                        <div className="text-xs text-muted-foreground">Code: {customer.membership.code}</div>
                      </div>
                    </div>
                  )}
                  {customer.installedBy && (
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Installed By:</span>
                      <div className="text-right">
                        <div className="font-medium">{customer.installedBy.name}</div>
                        <div className="text-xs text-muted-foreground">{customer.installedBy.email}</div>
                      </div>
                    </div>
                  )}
                  {customer.referencedBy && (
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Referred By:</span>
                      <div className="text-right">
                        <div className="font-medium">{customer.referencedBy.firstName} {customer.referencedBy.lastName}</div>
                        <div className="text-xs text-muted-foreground">{customer.referencedBy.email}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Lead ID:</span>
                    <span className="font-medium">{customer.leadId || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Reference Status:</span>
                    <span className="font-medium">{customer.isReferenced && customer.referencedById ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            </CardContainer>

            {/* Subscription & Billing */}
            <CardContainer
              title="Subscription & Billing"
              className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Current Package:</span>
                    <span className="font-medium">{customer.subscribedPkg.packageName}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Package Price:</span>
                    <span className="font-medium">{formatPrice(customer.subscribedPkg.price)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Billing Cycle:</span>
                    <span className="font-medium capitalize">{customer.billingCycle || "Monthly"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Subscription Type:</span>
                    <span className="font-medium">{customer.rechargeable ? "Rechargeable" : "Standard"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-medium">{customer.paymentMethod || "Not set"}</span>
                  </div>
                  {latestSubscription && (
                    <>
                      <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-muted-foreground">Current Status:</span>
                        <span className="font-medium">{latestSubscription.isTrial ? "Trial Period" : "Active Subscription"}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-muted-foreground">Plan Start:</span>
                        <span className="font-medium">{formatDate(latestSubscription.planStart)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-muted-foreground">Plan End:</span>
                        <span className="font-medium">{formatDate(latestSubscription.planEnd)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-muted-foreground">Days Remaining:</span>
                        <span className={`font-medium ${daysUntilExpiry < 7 ? "text-red-500" : daysUntilExpiry < 30 ? "text-amber-500" : "text-green-500"}`}>
                          {daysUntilExpiry} days
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Connection Information */}
            <CardContainer
              title="Connection Information"
              className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Connectivity Type:</span>
                    <span className="font-medium">{formatConnectionType(customer.connectionType)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Connection Type:</span>
                    <span className="font-medium">{customer.connectionType}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Device Name:</span>
                    <span className="font-medium">{customer.deviceName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">MAC Address:</span>
                    <span className="font-medium">{customer.deviceMac || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">VLAN ID:</span>
                    <span className="font-medium">{customer.vlanId || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">VLAN Priority:</span>
                    <span className="font-medium">{customer.vlanPriority}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Assigned Package ID:</span>
                    <span className="font-medium">{customer.packagePrice.packageName}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Subscribed Package ID:</span>
                    <span className="font-medium">{customer.subscribedPkg.packageName}</span>
                  </div>
                </div>
              </div>
            </CardContainer>

            {/* Package Details */}
            <CardContainer
              title="Package Details"
              className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Plan Name:</span>
                    <span className="font-medium">{customer.subscribedPkg.packagePlanDetails.planName}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Plan Code:</span>
                    <span className="font-medium">{customer.subscribedPkg.packagePlanDetails.planCode}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Download Speed:</span>
                    <span className="font-medium">{customer.subscribedPkg.packagePlanDetails.downSpeed} Mbps</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Upload Speed:</span>
                    <span className="font-medium">{customer.subscribedPkg.packagePlanDetails.upSpeed} Mbps</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Data Limit:</span>
                    <span className="font-medium">
                      {customer.subscribedPkg.packagePlanDetails.dataLimit === 0 ? "Unlimited" : `${customer.subscribedPkg.packagePlanDetails.dataLimit} GB`}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Device Limit:</span>
                    <span className="font-medium">{customer.subscribedPkg.packagePlanDetails.deviceLimit} devices</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Package Duration:</span>
                    <span className="font-medium">{customer.subscribedPkg.packageDuration}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Reference ID:</span>
                    <span className="font-medium">{customer.subscribedPkg.referenceId}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Package Status:</span>
                    <span className="font-medium">
                      <Badge className={customer.subscribedPkg.isActive ? "bg-green-500" : "bg-red-500"}>
                        {customer.subscribedPkg.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </span>
                  </div>
                </div>
              </div>
            </CardContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location Information */}
            <CardContainer
              title="Location Information"
              className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Street Address:</span>
                    <span className="font-medium">{customer.streetAddress}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">City:</span>
                    <span className="font-medium">{customer.city}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">State/Province:</span>
                    <span className="font-medium">{customer.state}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">ZIP/Postal Code:</span>
                    <span className="font-medium">{customer.zipCode}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Latitude:</span>
                    <span className="font-medium">{customer.lat}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Longitude:</span>
                    <span className="font-medium">{customer.lon}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-medium">{customer.lat}, {customer.lon}</span>
                  </div>
                </div>
              </div>
            </CardContainer>

            {/* Connection Users */}
            <CardContainer
              title="Connection Users"
              className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
            >
              <div className="space-y-3">
                {customer.connectionUsers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {customer.connectionUsers.map((user) => (
                      <div key={user.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{user.username}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              User ID: {user.id} | Created: {formatDate(user.createdAt)}
                            </div>
                          </div>
                          <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-green-500" : "bg-gray-500"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                            <div className="text-xs text-muted-foreground">Password</div>
                            <div className="font-mono text-sm truncate">{user.password}</div>
                          </div>
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                            <div className="text-xs text-muted-foreground">Status</div>
                            <div className="text-sm">{user.isDeleted ? "Deleted" : "Active"}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    No connection users found
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  {customer.connectionUsers.length} of {customer.subscribedPkg.packagePlanDetails.deviceLimit} devices used
                </div>
              </div>
            </CardContainer>
          </div>

          {/* Keep existing usage chart component */}
          <CustomerUsageChart />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardContainer
              title="Billing Summary"
              className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div className="w-full">
                      <div className="flex justify-between">
                        <div className="font-medium">Invoice Amount:</div>
                        <div className="font-bold">{formatPrice(invoiceAmount)}</div>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <div>Total Paid:</div>
                        <div>{formatPrice(totalPaid)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                    <div className="w-full">
                      <div className="flex justify-between">
                        <div className="font-medium text-red-500">Due Amount:</div>
                        <div className="font-bold text-red-500">{formatPrice(dueAmount)}</div>
                      </div>
                      {latestOrder && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Due Date: {formatDate(latestOrder.packageEnd)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div className="w-full">
                      <div className="flex justify-between">
                        <div className="font-medium">Expiry Date:</div>
                        <div>{latestSubscription ? formatDate(latestSubscription.planEnd) : "N/A"}</div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Last Renewal: {formatDate(customer.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <CreditCard className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div className="w-full">
                      <div className="flex justify-between">
                        <div className="font-medium">Payment Method:</div>
                        <div>{customer.paymentMethod || "Not set"}</div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Auto Renew: {networkSettings.autoRenew ? "Enabled" : "Disabled"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer
              title="Subscription Details"
              className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Wifi className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{customer.subscribedPkg.packagePlanDetails.planName}</div>
                      <div className="text-sm text-muted-foreground">Package: {customer.subscribedPkg.packageName}</div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Billing Cycle: {customer.billingCycle || "Monthly"}</div>
                      <div className="text-sm text-muted-foreground">
                        Type: {customer.rechargeable ? "Rechargeable" : "Standard"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg.slate-800 transition-colors">
                    <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Price: {formatPrice(customer.subscribedPkg.price)}</div>
                      <div className="text-sm text-muted-foreground">
                        Duration: {customer.subscribedPkg.packageDuration}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg.slate-800 transition-colors">
                    <Award className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Reference ID: {customer.subscribedPkg.referenceId}</div>
                      <div className="text-sm text-muted-foreground">
                        Package Status: {customer.subscribedPkg.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContainer>
          </div>

          {/* Orders Section */}
          <CardContainer
            title="Order History"
            className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
          >
            <div className="space-y-4">
              {customer.orders.length > 0 ? (
                <div className="space-y-3">
                  {customer.orders.map((order) => (
                    <div key={order.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Order #{order.id}</span>
                            <Badge variant={order.isPaid ? "default" : "secondary"} className={order.isPaid ? "bg-green-500" : "bg-amber-500"}>
                              {order.isPaid ? "Paid" : "Pending"}
                            </Badge>
                            <Badge variant="outline" className={order.isActive ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}>
                              {order.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Order Date: {formatDate(order.orderDate)} | Package: {order.packageStart} to {order.packageEnd}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{formatPrice(order.totalAmount)}</div>
                          <div className="text-sm text-muted-foreground">{order.items.length} items</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-sm font-medium mb-2">Order Items:</div>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm p-2 rounded bg-slate-100 dark:bg-slate-800">
                              <div>
                                <div>{item.itemName}</div>
                                {item.referenceId && (
                                  <div className="text-xs text-muted-foreground">Ref: {item.referenceId}</div>
                                )}
                              </div>
                              <div className="font-medium">{formatPrice(item.itemPrice)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No order history found
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Total Orders: {customer.orders.length} | Total Amount: {formatPrice(invoiceAmount)}
              </div>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <CustomerDeviceStatus />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <CardContainer
            title="Customer Documents"
            className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md"
          >
            <div className="space-y-4">
              {customer.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customer.documents.map((doc) => (
                    <div key={doc.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          <FileCheck className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium truncate">{doc.fileName}</div>
                              <div className="text-sm text-muted-foreground capitalize">{doc.documentType}</div>
                            </div>
                            <Badge variant="outline" className={doc.isDeleted ? "border-red-500 text-red-500" : "border-green-500 text-green-500"}>
                              {doc.isDeleted ? "Deleted" : "Active"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            Uploaded: {formatDate(doc.uploadedAt)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Size: {formatFileSize(doc.size)} | Type: {doc.mimeType}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                const filePath = doc.filePath.replace(/\\/g, '/');
                                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3200';
                                const url = `${baseUrl}/${filePath}`;

                                // Create a temporary link element to trigger download
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = doc.fileName || 'file';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);

                                toast({
                                  title: "Download started",
                                  description: `Downloading ${doc.fileName}`,
                                });
                              }}
                            >
                              Download
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                // Direct access via backend URL
                                const filePath = doc.filePath.replace(/\\/g, '/');
                                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3200';
                                window.open(`${baseUrl}/${filePath}`, '_blank');
                              }}
                            >
                              Preview
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No documents uploaded for this customer
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Total Documents: {customer.documents.length} | 
                ID Proof: {customer.documents.filter(d => d.documentType === 'idProof').length} | 
                Address Proof: {customer.documents.filter(d => d.documentType === 'addressProof').length} | 
                Photos: {customer.documents.filter(d => d.documentType === 'photo').length}
              </div>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <CustomerTickets />
        </TabsContent>
      </Tabs>
    </div>
  )
}