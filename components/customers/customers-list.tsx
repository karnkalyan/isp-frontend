"use client"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, ChevronDown, Check, User, FileText, Wifi, AlertTriangle, Ban, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CardContainer } from "@/components/ui/card-container"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"

// Updated interface to match actual API response
interface Customer {
  id: number
  customerUniqueId: string
  panNo?: string
  idNumber?: string
  leadId?: number
  membershipId?: number | null
  branchId?: number | null
  ispId: number
  isRechargeable: boolean
  installedById?: number | null
  oltId?: number | null
  splitterId?: number | null
  existingISPId?: number | null
  assignedPkg: number
  subscribedPkgId: number
  status: string
  isDeleted: boolean
  onboardStatus: string
  createdAt: string
  updatedAt: string
  packagePrice: {
    id: number
    packageName: string
    price: number
    packageDuration: string
    isTrial: boolean
    packagePlanDetails: {
      planName: string
      planCode: string
      downSpeed: number
      upSpeed: number
      deviceLimit: number
    }
  }
  subscribedPkg: {
    id: number
    packageName: string
    price: number
    packageDuration: string
    isTrial: boolean
    packagePlanDetails: {
      planName: string
      planCode: string
      downSpeed: number
      upSpeed: number
      deviceLimit: number
    }
  }
  membership: {
    id: number
    name: string
    code: string
  } | null
  devices: Array<{
    id: number
    deviceType: string
    brand: string
    model: string
    serialNumber: string
    macAddress: string
    ponSerial: string
    provisioningStatus: string
    notes: string | null
    createdAt: string
    updatedAt: string
  }>
  serviceDetails: Array<{
    id: number
    oltId: number
    splitterId: number
    oltPort: string
    splitterPort: string
    vlanId: string
    vlanPriority: string
    connectionType: string
    status: string
    provisioningNotes: string | null
    createdAt: string
    updatedAt: string
    olt?: any
    splitter?: any
    vlanDetails?: Array<{
      id: number
      oltId: number
      vlanId: number
      name: string
      description: string
      gemIndex: number
      vlanType: string
      priority: number
      status: string
      createdAt: string
      updatedAt: string
    }>
  }>
  documents: any[]
  connectionUsers: Array<{
    id: number
    username: string
    password: string
    isActive: boolean
    createdAt: string
  }>
  customerSubscriptions: Array<{
    id: number
    package: number
    isTrial: boolean
    planStart: string
    planEnd: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }>
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  secondaryPhone?: string
  gender?: string
  street?: string
  district?: string
  state?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface CustomersResponse {
  data: Customer[]
  pagination: PaginationInfo
}

export function CustomersList() {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  })
  const router = useRouter()

  const fetchCustomers = async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      setError(null)

      const data = await apiRequest<CustomersResponse>(`/customer?page=${page}&limit=${limit}`)

      if (data && Array.isArray(data.data)) {
        setCustomers(data.data)
        if (data.pagination) {
          setPagination(data.pagination)
        }
      } else {
        setCustomers([])
        toast.error("Invalid customer data format received")
      }
    } catch (error: any) {
      console.error("Error fetching customers:", error)
      setError(error.message || "Failed to fetch customers")
      toast.error("Failed to load customers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers(pagination.page, pagination.limit)
  }, [pagination.page])

  const toggleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(customers.map((customer) => customer.id.toString()))
    }
  }

  const toggleSelectCustomer = (id: string) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter((customerId) => customerId !== id))
    } else {
      setSelectedCustomers([...selectedCustomers, id])
    }
  }

  const handleViewProfile = (customerId: string) => {
    router.push(`/customers/${customerId}`)
  }

  const handleViewInvoices = (customerId: string) => {
    router.push(`/customers/${customerId}/invoices`)
  }

  const handleCheckConnection = (customerId: string) => {
    toast.loading("Checking connection status...", { duration: 2000 })
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) {
      return
    }

    try {
      await apiRequest(`/customer/${customerId}`, {
        method: 'DELETE',
      })

      toast.success("Customer deleted successfully")
      fetchCustomers(pagination.page, pagination.limit)
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId))
    } catch (error: any) {
      console.error("Error deleting customer:", error)
      toast.error(error.message || "Failed to delete customer")
    }
  }

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase()
    switch (statusLower) {
      case "active": return <Check className="mr-2 h-4 w-4 text-green-500" />
      case "suspended": return <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
      case "inactive": return <Ban className="mr-2 h-4 w-4 text-red-500" />
      default: return null
    }
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    const variants: Record<string, string> = {
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      suspended: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      inactive: "bg-red-500/10 text-red-500 border-red-500/20",
    }
    return (
      <Badge variant="outline" className={variants[statusLower] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
        {statusLower}
      </Badge>
    )
  }

  const getConnectionTypeBadge = (connectionType?: string) => {
    const typeLower = connectionType?.toLowerCase() ?? "unknown"
    const variants: Record<string, string> = {
      fiber: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      pppoe: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      hotspot: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    }
    return (
      <Badge variant="outline" className={variants[typeLower] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
        {typeLower}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'NPR', minimumFractionDigits: 0
    }).format(price)
  }

  const getCustomerFullName = (customer: Customer) => {
    return `${customer.firstName} ${customer.lastName}`.trim()
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
    fetchCustomers(1, newLimit)
  }

  if (loading) {
    return (
      <CardContainer title="Customers" description="All registered customers">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CardContainer>
    )
  }

  if (error) {
    return (
      <CardContainer title="Customers" description="All registered customers">
        <div className="flex flex-col items-center py-12 gap-2">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchCustomers(pagination.page, pagination.limit)}>
            Retry
          </Button>
        </div>
      </CardContainer>
    )
  }

  return (
    <CardContainer title="Customers" description="All registered customers">
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No customers found</p>
              <Button variant="outline" size="sm" onClick={() => router.push('/customers/new')} className="mt-2">
                Add New Customer
              </Button>
            </div>
          ) : (
            <>
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedCustomers.length === customers.length}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                        <span>Customer ID</span>
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Customer</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Plan</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Connection</th>
                    <th className="h-12 px-4 text-left align-middle font-medium"></th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {customers.map((customer) => {
                    const customerId = customer.id.toString()
                    const fullName = getCustomerFullName(customer)
                    const serviceDetail = customer.serviceDetails?.[0]
                    const connectionType = serviceDetail?.connectionType
                    const deviceModel = customer.devices?.[0]?.model
                    const plan = customer.subscribedPkg
                    const isTrial = customer.customerSubscriptions?.[0]?.isTrial

                    return (
                      <tr
                        key={customerId}
                        className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleViewProfile(customerId)}
                      >
                        <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={selectedCustomers.includes(customerId)}
                              onCheckedChange={() => toggleSelectCustomer(customerId)}
                              aria-label={`Select ${fullName}`}
                            />
                            <span className="font-mono text-xs">CUST-{customer.id.toString().padStart(3, '0')}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={`/placeholder.svg?text=${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`} alt={fullName} />
                              <AvatarFallback>{customer.firstName.charAt(0)}{customer.lastName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{fullName}</div>
                              <div className="text-xs text-muted-foreground">{customer.email}</div>
                              <div className="text-xs text-muted-foreground">{customer.phoneNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div>
                            <div className="font-medium">{plan?.packagePlanDetails?.planName ?? 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">
                              {plan?.packageDuration ?? ''} • {plan?.price ? formatPrice(plan.price) : 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {plan?.packagePlanDetails?.downSpeed ?? 0} Mbps
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(customer.status)}
                            {isTrial && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                                Trial Active
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {getConnectionTypeBadge(connectionType)}
                            </div>
                            {deviceModel && (
                              <div className="text-xs text-muted-foreground">
                                Device: {deviceModel}
                              </div>
                            )}
                            {/* VLAN details: show actual VLAN IDs with names if available */}
                            {serviceDetail?.vlanDetails && serviceDetail.vlanDetails.length > 0 ? (
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                {serviceDetail.vlanDetails.map(vlan => (
                                  <div key={vlan.id}>
                                    VLAN {vlan.vlanId}: {vlan.name}
                                  </div>
                                ))}
                              </div>
                            ) : serviceDetail?.vlanId ? (
                              <div className="text-xs text-muted-foreground">
                                VLAN: {serviceDetail.vlanId}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewProfile(customerId)}>
                                <User className="mr-2 h-4 w-4" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewInvoices(customerId)}>
                                <FileText className="mr-2 h-4 w-4" /> View Invoices
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCheckConnection(customerId)}>
                                <Wifi className="mr-2 h-4 w-4" /> Check Connection
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCustomer(customerId)}>
                                Delete Customer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={pagination.limit}
                      onChange={(e) => handleLimitChange(Number(e.target.value))}
                    >
                      {[5, 10, 25, 50, 100].map(limit => (
                        <option key={limit} value={limit}>{limit}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}>
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(page => Math.abs(page - pagination.page) <= 2 || page === 1 || page === pagination.totalPages)
                        .map((page, idx, arr) => (
                          <React.Fragment key={page}>
                            {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-2">…</span>}
                            <Button
                              variant={pagination.page === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCustomers.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg border p-4">
          <span className="text-sm text-muted-foreground">
            <span className="font-medium">{selectedCustomers.length}</span> customers selected
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">Bulk Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.loading(`Exporting ${selectedCustomers.length} customers...`)}>
                Export Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.loading(`Sending emails...`)}>
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  if (confirm(`Delete ${selectedCustomers.length} customers?`)) {
                    toast.loading(`Deleting...`)
                  }
                }}
              >
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </CardContainer>
  )
}