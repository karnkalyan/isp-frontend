"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, ArrowUpDown, ChevronDown, Check, User, FileText, Wifi, AlertTriangle, Ban, Loader2, Calendar, CreditCard } from "lucide-react"
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

interface Customer {
  id: number
  firstName: string
  middleName: string | null
  lastName: string
  email: string
  phoneNumber: string
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
  }>
  connectionUsers: Array<{
    id: number
    username: string
    password: string
  }>
  customerSubscriptions: Array<{
    id: number
    package: number
    isTrial: boolean
    planStart: string
    planEnd: string
    isActive: boolean
  }>
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

  // Fetch customers from API with pagination
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
      // Refresh the customer list
      fetchCustomers(pagination.page, pagination.limit)
      // Remove from selected
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId))
    } catch (error: any) {
      console.error("Error deleting customer:", error)
      toast.error(error.message || "Failed to delete customer")
    }
  }

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase()
    
    switch (statusLower) {
      case "active":
        return <Check className="mr-2 h-4 w-4 text-green-500" />
      case "suspended":
        return <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
      case "inactive":
        return <Ban className="mr-2 h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    
    switch (statusLower) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            active
          </Badge>
        )
      case "suspended":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            suspended
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            inactive
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            {statusLower}
          </Badge>
        )
    }
  }

  const getConnectionTypeBadge = (connectionType: string) => {
    const typeLower = connectionType.toLowerCase()
    
    switch (typeLower) {
      case "fiber":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Fiber
          </Badge>
        )
      case "pppoe":
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
            PPPoE
          </Badge>
        )
      case "hotspot":
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
            Hotspot
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            {connectionType}
          </Badge>
        )
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NRS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  // Get customer's full name
  const getCustomerFullName = (customer: Customer) => {
    return `${customer.firstName} ${customer.middleName ? customer.middleName + ' ' : ''}${customer.lastName}`
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  // Handle limit change
  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
    fetchCustomers(1, newLimit)
  }

  if (loading) {
    return (
      <CardContainer title="Customers" description="All registered customers">
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      </CardContainer>
    )
  }

  if (error) {
    return (
      <CardContainer title="Customers" description="All registered customers">
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchCustomers(pagination.page, pagination.limit)}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/customers/new')}
                className="mt-2"
              >
                Add New Customer
              </Button>
            </div>
          ) : (
            <>
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
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
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <div className="flex items-center space-x-2">
                        <span>Customer</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <div className="flex items-center space-x-2">
                        <span>Plan</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <div className="flex items-center space-x-2">
                        <span>Status</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <div className="flex items-center space-x-2">
                        <span>Connection</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium"></th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {customers.map((customer) => {
                    const customerId = customer.id.toString()
                    const fullName = getCustomerFullName(customer)
                    
                    return (
                      <tr
                        key={customerId}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
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
                              <AvatarImage 
                                src={`/placeholder.svg?text=${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`} 
                                alt={fullName} 
                              />
                              <AvatarFallback>
                                {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                              </AvatarFallback>
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
                            <div className="font-medium">{customer.subscribedPkg.packagePlanDetails.planName}</div>
                            <div className="text-xs text-muted-foreground">
                              {customer.subscribedPkg.packageDuration} • {formatPrice(customer.subscribedPkg.price)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {customer.subscribedPkg.packagePlanDetails.downSpeed} Mbps
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(customer.status)}
                            {customer.customerSubscriptions.length > 0 && customer.customerSubscriptions[0].isTrial && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                                Trial Active
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {getConnectionTypeBadge(customer.connectionType)}
                              {/* <Badge variant="outline" className="text-xs">
                                {customer.billingCycle}
                              </Badge> */}
                            </div>
                            {customer.deviceName && (
                              <div className="text-xs text-muted-foreground">
                                Device: {customer.deviceName}
                              </div>
                            )}
                            {customer.vlanId && (
                              <div className="text-xs text-muted-foreground">
                                VLAN: {customer.vlanId}
                              </div>
                            )}
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
                                <User className="mr-2 h-4 w-4" />
                                <span>View Profile</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewInvoices(customerId)}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>View Invoices</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCheckConnection(customerId)}>
                                <Wifi className="mr-2 h-4 w-4" />
                                <span>Check Connection</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteCustomer(customerId)}
                              >
                                <span>Delete Customer</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span> customers
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={pagination.limit}
                      onChange={(e) => handleLimitChange(Number(e.target.value))}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const pages = []
                        const maxVisiblePages = 5
                        let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2))
                        let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1)
                        
                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1)
                        }
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={pagination.page === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(i)}
                            >
                              {i}
                            </Button>
                          )
                        }
                        
                        return pages
                      })()}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
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
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{selectedCustomers.length}</span> customers selected
          </div>
          <div className="space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    toast.loading(`Exporting ${selectedCustomers.length} customers...`, { duration: 2000 })
                  }}
                >
                  Export Selected
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    toast.loading(`Sending emails to ${selectedCustomers.length} customers...`, { duration: 2000 })
                  }}
                >
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedCustomers.length} customers?`)) {
                      toast.loading(`Deleting ${selectedCustomers.length} customers...`, { duration: 2000 })
                    }
                  }}
                >
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </CardContainer>
  )
}