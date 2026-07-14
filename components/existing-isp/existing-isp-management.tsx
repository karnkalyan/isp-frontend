"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { 
  Save, Building, Globe, Phone, Mail, MapPin, Star, Users, Wifi, 
  TrendingUp, Shield, Trash2, Edit, Loader2, RefreshCw
} from "lucide-react"
import { apiRequest } from "@/lib/api"

interface ExistingISP {
  id: number
  name: string
  code?: string
  type?: "fiber" | "cable" | "wireless" | "satellite" | "dsl"
  website?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  coverage: string[]
  services: string[]
  rating: number
  customerCount: number
  establishedYear?: number
  status?: "active" | "inactive" | "merged"
  notes?: string
  isActive: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export function ExistingISPManagement() {
  const [activeTab, setActiveTab] = useState("directory")
  const [isps, setISPs] = useState<ExistingISP[]>([])
  const [loading, setLoading] = useState(false)
  const [isp, setISP] = useState<Partial<ExistingISP>>({
    name: "",
    code: "",
    type: "fiber",
    website: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    coverage: [],
    services: [],
    rating: 0,
    customerCount: 0,
    establishedYear: new Date().getFullYear(),
    status: "active",
    notes: "",
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 0,
    totalCustomers: 0,
    byType: [] as { type: string, count: number }[],
    byStatus: [] as { status: string, count: number }[],
  })

  // Fetch ISPs data
  const fetchISPs = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/existingisp')
      if (response && response.success) {
        setISPs(response.data || [])
      } else {
        throw new Error(response?.error || "Failed to fetch ISPs")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch ISPs",
        variant: "destructive",
      })
      setISPs([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await apiRequest('/existingisp/stats')
      if (response && response.success) {
        setStats(response.data || {
          total: 0,
          averageRating: 0,
          totalCustomers: 0,
          byType: [],
          byStatus: []
        })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchISPs()
    fetchStats()
  }, [])

  const updateISPField = (field: keyof ExistingISP, value: any) => {
    setISP((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle adding/editing ISP
  const saveISP = async () => {
    if (!isp.name?.trim()) {
      toast({
        title: "Error",
        description: "ISP name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      // Prepare payload
      const payload = {
        name: isp.name?.trim() || "",
        code: isp.code?.trim() || "",
        type: isp.type || "fiber",
        website: isp.website || "",
        email: isp.email || "",
        phone: isp.phone || "",
        address: isp.address || "",
        city: isp.city || "",
        state: isp.state || "",
        coverage: isp.coverage || [],
        services: isp.services || [],
        rating: isp.rating || 0,
        customerCount: isp.customerCount || 0,
        establishedYear: isp.establishedYear || new Date().getFullYear(),
        status: isp.status || "active",
        notes: isp.notes || "",
      }

      console.log("Sending payload:", payload)
      
      if (editingId) {
        // Update existing ISP
        const response = await apiRequest(`/existingisp/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        
        if (response && response.success) {
          toast({
            title: "Success",
            description: response.message || "ISP updated successfully",
          })
        } else {
          throw new Error(response?.error || "Failed to update ISP")
        }
      } else {
        // Create new ISP
        const response = await apiRequest('/existingisp', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        
        if (response && response.success) {
          toast({
            title: "Success",
            description: response.message || "ISP added successfully",
          })
        } else {
          throw new Error(response?.error || "Failed to add ISP")
        }
      }
      
      // Reset form
      setISP({
        name: "",
        code: "",
        type: "fiber",
        website: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        coverage: [],
        services: [],
        rating: 0,
        customerCount: 0,
        establishedYear: new Date().getFullYear(),
        status: "active",
        notes: "",
      })
      setEditingId(null)
      
      // Refresh data
      await fetchISPs()
      await fetchStats()
      
      // Switch to directory tab
      setActiveTab("directory")
    } catch (error: any) {
      console.error("Error saving ISP:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save ISP",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle editing ISP
  const handleEdit = (ispItem: ExistingISP) => {
    setISP({
      ...ispItem,
      name: ispItem.name || "",
      code: ispItem.code || "",
      type: ispItem.type || "fiber",
      website: ispItem.website || "",
      email: ispItem.email || "",
      phone: ispItem.phone || "",
      address: ispItem.address || "",
      city: ispItem.city || "",
      state: ispItem.state || "",
      coverage: ispItem.coverage || [],
      services: ispItem.services || [],
      rating: ispItem.rating || 0,
      customerCount: ispItem.customerCount || 0,
      establishedYear: ispItem.establishedYear || new Date().getFullYear(),
      status: ispItem.status || "active",
      notes: ispItem.notes || "",
    })
    setEditingId(ispItem.id)
    setActiveTab("add")
  }

  // Handle deleting ISP
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this ISP? This action cannot be undone.")) {
      return
    }

    try {
      setLoading(true)
      const response = await apiRequest(`/existingisp/${id}`, {
        method: 'DELETE'
      })
      
      if (response && response.success) {
        toast({
          title: "Success",
          description: response.message || "ISP deleted successfully",
        })
      } else {
        throw new Error(response?.error || "Failed to delete ISP")
      }
      
      // Refresh data
      await fetchISPs()
      await fetchStats()
    } catch (error: any) {
      console.error("Error deleting ISP:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete ISP",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle coverage input
  const handleCoverageChange = (value: string) => {
    const coverageArray = value.split(',').map(item => item.trim()).filter(item => item)
    updateISPField("coverage", coverageArray)
  }

  // Handle services input
  const handleServicesChange = (value: string) => {
    const servicesArray = value.split(',').map(item => item.trim()).filter(item => item)
    updateISPField("services", servicesArray)
  }

  const getTypeBadge = (type: string = "") => {
    const typeConfig = {
      fiber: { color: "bg-green-500/10 text-green-500 border-green-500/20", icon: Wifi },
      cable: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Wifi },
      wireless: { color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Wifi },
      satellite: { color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: Globe },
      dsl: { color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: Wifi },
    }

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.fiber
    const Icon = config.icon

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {type.toUpperCase() || "UNKNOWN"}
      </Badge>
    )
  }

  const getStatusBadge = (status: string = "active") => {
    const statusColors = {
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      inactive: "bg-red-500/10 text-red-500 border-red-500/20",
      merged: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    }

    return (
      <Badge variant="outline" className={statusColors[status as keyof typeof statusColors] || statusColors.active}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
      />
    ))
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="directory">
          ISP Directory ({stats.total})
        </TabsTrigger>
        <TabsTrigger value="add">
          {editingId ? "Edit ISP" : "Add New ISP"}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="directory" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardContainer className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total ISPs</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContainer>

          <CardContainer className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Avg. Rating</div>
                <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</div>
              </div>
              <Star className="h-8 w-8 text-green-500" />
            </div>
          </CardContainer>

          <CardContainer className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Customers</div>
                <div className="text-2xl font-bold">{stats.totalCustomers.toLocaleString()}</div>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContainer>

          <CardContainer className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Active ISPs</div>
                <div className="text-2xl font-bold">
                  {stats.byStatus.find(s => s.status === 'active')?.count || 0}
                </div>
              </div>
              <Shield className="h-8 w-8 text-amber-500" />
            </div>
          </CardContainer>
        </div>

        <CardContainer 
          title="ISP Provider Directory" 
          description="Browse existing ISP providers"
          action={
            <Button 
              size="sm" 
              variant="outline"
              onClick={fetchISPs}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          }
        >
          {loading && isps.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading ISP data...</p>
              </div>
            </div>
          ) : isps.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No ISP Providers Found</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first ISP provider</p>
              <Button onClick={() => setActiveTab("add")}>Add New ISP</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {isps.map((ispItem) => (
                <div key={ispItem.id} className="p-6 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{ispItem.name}</h3>
                        {ispItem.code && (
                          <span className="text-sm text-muted-foreground">({ispItem.code})</span>
                        )}
                        {getTypeBadge(ispItem.type)}
                        {getStatusBadge(ispItem.status)}
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStars(ispItem.rating)}
                        <span className="text-sm text-muted-foreground">({ispItem.rating.toFixed(1)}/5)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          {ispItem.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={ispItem.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {ispItem.website}
                              </a>
                            </div>
                          )}
                          {ispItem.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{ispItem.email}</span>
                            </div>
                          )}
                          {ispItem.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{ispItem.phone}</span>
                            </div>
                          )}
                          {(ispItem.address || ispItem.city) && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {ispItem.address && `${ispItem.address}, `}
                                {ispItem.city}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{ispItem.customerCount.toLocaleString()} customers</span>
                          </div>
                          {ispItem.establishedYear && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span>Est. {ispItem.establishedYear}</span>
                            </div>
                          )}
                          {ispItem.services && ispItem.services.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <span>Services: {ispItem.services.join(", ")}</span>
                            </div>
                          )}
                          {ispItem.coverage && ispItem.coverage.length > 0 && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>Coverage: {ispItem.coverage.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {ispItem.notes && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">{ispItem.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(ispItem)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(ispItem.id)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContainer>
      </TabsContent>

      <TabsContent value="add" className="space-y-6">
        <CardContainer 
          title={editingId ? "Edit ISP Provider" : "Add New ISP Provider"} 
          description={editingId ? "Update the ISP provider details" : "Register a new ISP provider in the directory"}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  ISP Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. WorldLink Communications"
                  value={isp.name || ""}
                  onChange={(e) => updateISPField("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">
                  ISP Code
                </Label>
                <Input
                  id="code"
                  placeholder="e.g. WORLDLINK"
                  value={isp.code || ""}
                  onChange={(e) => updateISPField("code", e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">ISP Type</Label>
                <Select value={isp.type} onValueChange={(value: any) => updateISPField("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ISP type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fiber">Fiber</SelectItem>
                    <SelectItem value="cable">Cable</SelectItem>
                    <SelectItem value="wireless">Wireless</SelectItem>
                    <SelectItem value="satellite">Satellite</SelectItem>
                    <SelectItem value="dsl">DSL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://example.com"
                  value={isp.website || ""}
                  onChange={(e) => updateISPField("website", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@example.com"
                  value={isp.email || ""}
                  onChange={(e) => updateISPField("email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+977-1-XXXXXXX"
                  value={isp.phone || ""}
                  onChange={(e) => updateISPField("phone", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter full address"
                value={isp.address || ""}
                onChange={(e) => updateISPField("address", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Enter city"
                  value={isp.city || ""}
                  onChange={(e) => updateISPField("city", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="Enter state"
                  value={isp.state || ""}
                  onChange={(e) => updateISPField("state", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coverage">Coverage Areas</Label>
                <Input
                  id="coverage"
                  placeholder="Kathmandu, Lalitpur, Bhaktapur (comma separated)"
                  value={(isp.coverage || []).join(", ")}
                  onChange={(e) => handleCoverageChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="services">Services Offered</Label>
                <Input
                  id="services"
                  placeholder="Internet, IPTV, Voice (comma separated)"
                  value={(isp.services || []).join(", ")}
                  onChange={(e) => handleServicesChange(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerCount">Customer Count</Label>
                <Input
                  id="customerCount"
                  type="number"
                  placeholder="0"
                  value={isp.customerCount || 0}
                  onChange={(e) => updateISPField("customerCount", Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="establishedYear">Established Year</Label>
                <Input
                  id="establishedYear"
                  type="number"
                  placeholder="2000"
                  value={isp.establishedYear || new Date().getFullYear()}
                  onChange={(e) => updateISPField("establishedYear", Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  placeholder="4.0"
                  value={isp.rating || 0}
                  onChange={(e) => updateISPField("rating", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={isp.status} onValueChange={(value: any) => updateISPField("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="merged">Merged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional notes about this ISP..."
                value={isp.notes || ""}
                onChange={(e) => updateISPField("notes", e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setISP({
                    name: "",
                    code: "",
                    type: "fiber",
                    website: "",
                    email: "",
                    phone: "",
                    address: "",
                    city: "",
                    state: "",
                    coverage: [],
                    services: [],
                    rating: 0,
                    customerCount: 0,
                    establishedYear: new Date().getFullYear(),
                    status: "active",
                    notes: "",
                  })
                  setEditingId(null)
                  setActiveTab("directory")
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={saveISP} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingId ? "Update ISP" : "Add ISP Provider"}
              </Button>
            </div>
          </div>
        </CardContainer>
      </TabsContent>
    </Tabs>
  )
}