"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building,
  Globe,
  Mail,
  Phone,
  User,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Network,
  Hash,
  Globe2,
  Server,
} from "lucide-react"
import { toast } from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardContainer } from "@/components/ui/card-container"
import { SectionContainer } from "@/components/ui/section-container"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { useSettings } from "@/contexts/settings-context"

export function ISPRegistrationFormWithSettings() {
  const router = useRouter()
  const { ispTypes, serviceAreas } = useSettings()

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("company")
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // Company Information
    companyName: "",
    businessType: "",
    website: "",
    contactPerson: "",
    phoneNumber: "",
    masterEmail: "",
    description: "",

    // Address Information
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    serviceArea: "",

    // Technical Information
    asnNumber: "",
    ipv4Blocks: "",
    ipv6Blocks: "",
    upstreamProviders: "",

    // Security Information
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })

  // Convert ISP types to options for the searchable select
  const ispTypeOptions: Option[] = ispTypes.map((type) => ({
    value: type.code,
    label: type.name,
  }))

  // Convert service areas to options for the searchable select
  const serviceAreaOptions: Option[] = serviceAreas.map((area) => ({
    value: area.id,
    label: area.name,
  }))

  // Country options
  const countryOptions: Option[] = [
    { value: "us", label: "United States" },
    { value: "ca", label: "Canada" },
    { value: "uk", label: "United Kingdom" },
    { value: "au", label: "Australia" },
    { value: "de", label: "Germany" },
    { value: "fr", label: "France" },
    { value: "jp", label: "Japan" },
    { value: "in", label: "India" },
    { value: "br", label: "Brazil" },
    { value: "other", label: "Other" },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!formData.companyName || !formData.masterEmail || !formData.password) {
      toast.error("Please fill in all required fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!formData.agreeToTerms) {
      toast.error("You must agree to the terms and conditions")
      return
    }

    setIsLoading(true)

    try {
      // Create form data for file upload
      const submitData = new FormData()

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value.toString())
      })

      // Add logo if exists
      if (logoFile) {
        submitData.append("logo", logoFile)
      }

      // Call your registration API
      const response = await fetch("/api/auth/register-isp", {
        method: "POST",
        body: submitData,
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("ISP registration successful!")
        setRegistrationComplete(true)

        // Redirect after a delay
        setTimeout(() => {
          router.push("/dashboard/overview")
        }, 3000)
      } else {
        toast.error(data.message || "Registration failed")
      }
    } catch (error) {
      toast.error("An error occurred during registration")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const nextTab = () => {
    if (activeTab === "company") setActiveTab("address")
    else if (activeTab === "address") setActiveTab("technical")
    else if (activeTab === "technical") setActiveTab("security")
  }

  const prevTab = () => {
    if (activeTab === "security") setActiveTab("technical")
    else if (activeTab === "technical") setActiveTab("address")
    else if (activeTab === "address") setActiveTab("company")
  }

  if (registrationComplete) {
    return (
      <CardContainer title="Registration Complete" gradientColor="#10b981" className="w-full">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
          </div>
          <h2 className="text-2xl font-bold">Registration Successful!</h2>
          <p className="text-muted-foreground max-w-md">
            Your ISP has been successfully registered in our system. You will be redirected to the dashboard shortly.
          </p>
          <Button
            onClick={() => router.push("/dashboard/overview")}
            className="mt-4 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      </CardContainer>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <SectionContainer>
        <form onSubmit={handleSubmit}>
          <CardContainer
            title="Register New ISP"
            description="Complete the form below to register a new Internet Service Provider in the system"
            gradientColor="#10b981"
            className="w-full"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="company">Company</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="company" className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="companyName" className="text-sm font-medium">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="companyName"
                      name="companyName"
                      placeholder="Your ISP Company Name"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="businessType" className="text-sm font-medium">
                    Business Type
                  </Label>
                  <SearchableSelect
                    options={ispTypeOptions}
                    value={formData.businessType}
                    onValueChange={(value) => handleSelectChange("businessType", value)}
                    placeholder="Select business type"
                    emptyMessage="No ISP types found"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="website" className="text-sm font-medium">
                    Website
                  </Label>
                  <div className="relative">
                    <Input
                      id="website"
                      name="website"
                      placeholder="https://your-isp.com"
                      value={formData.website}
                      onChange={handleChange}
                      className="pl-10"
                    />
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="contactPerson" className="text-sm font-medium">
                      Contact Person
                    </Label>
                    <div className="relative">
                      <Input
                        id="contactPerson"
                        name="contactPerson"
                        placeholder="Full Name"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        className="pl-10"
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="pl-10"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="masterEmail" className="text-sm font-medium">
                    Master Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="masterEmail"
                      name="masterEmail"
                      type="email"
                      placeholder="admin@your-isp.com"
                      value={formData.masterEmail}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This email will be used for administrative access and notifications
                  </p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Company Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Brief description of your ISP services and coverage area"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="logo" className="text-sm font-medium">
                    Company Logo
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="border border-border rounded-md p-2 flex-1">
                      <div className="relative border-2 border-dashed border-border rounded-md p-4 flex flex-col items-center justify-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Drag & drop or <span className="text-primary">browse</span>
                        </p>
                        <input
                          id="logo"
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleLogoChange}
                        />
                      </div>
                    </div>

                    {logoPreview && (
                      <div className="h-20 w-20 rounded-md overflow-hidden border border-border">
                        <img
                          src={logoPreview || "/placeholder.svg"}
                          alt="Logo preview"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Recommended size: 512x512px. Max file size: 2MB</p>
                </div>

                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={nextTab}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
                  >
                    Next: Address Information
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Street Address
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="address"
                      name="address"
                      placeholder="123 Main St, Suite 100"
                      value={formData.address}
                      onChange={handleChange}
                      className="pl-10 pt-2 min-h-[80px]"
                    />
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-sm font-medium">
                      City
                    </Label>
                    <Input id="city" name="city" placeholder="City" value={formData.city} onChange={handleChange} />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="state" className="text-sm font-medium">
                      State/Province
                    </Label>
                    <Input id="state" name="state" placeholder="State" value={formData.state} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="zipCode" className="text-sm font-medium">
                      ZIP/Postal Code
                    </Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      placeholder="ZIP Code"
                      value={formData.zipCode}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="country" className="text-sm font-medium">
                      Country
                    </Label>
                    <SearchableSelect
                      options={countryOptions}
                      value={formData.country}
                      onValueChange={(value) => handleSelectChange("country", value)}
                      placeholder="Select country"
                      clearable
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="serviceArea" className="text-sm font-medium">
                    Service Area
                  </Label>
                  <SearchableSelect
                    options={serviceAreaOptions}
                    value={formData.serviceArea}
                    onValueChange={(value) => handleSelectChange("serviceArea", value)}
                    placeholder="Select service area"
                    emptyMessage="No service areas found"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Select the primary service area for this ISP</p>
                </div>

                <div className="flex justify-between space-x-4 pt-4">
                  <Button type="button" onClick={prevTab} variant="outline" className="w-1/2">
                    Back: Company Information
                  </Button>
                  <Button
                    type="button"
                    onClick={nextTab}
                    className="w-1/2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
                  >
                    Next: Technical Information
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="technical" className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="asnNumber" className="text-sm font-medium">
                    ASN Number (if applicable)
                  </Label>
                  <div className="relative">
                    <Input
                      id="asnNumber"
                      name="asnNumber"
                      placeholder="AS12345"
                      value={formData.asnNumber}
                      onChange={handleChange}
                      className="pl-10"
                    />
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Your Autonomous System Number if you have one</p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ipv4Blocks" className="text-sm font-medium">
                    IPv4 Address Blocks
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="ipv4Blocks"
                      name="ipv4Blocks"
                      placeholder="192.168.1.0/24, 10.0.0.0/16"
                      value={formData.ipv4Blocks}
                      onChange={handleChange}
                      rows={2}
                      className="pl-10 pt-2"
                    />
                    <Network className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">List your IPv4 CIDR blocks, separated by commas</p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ipv6Blocks" className="text-sm font-medium">
                    IPv6 Address Blocks
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="ipv6Blocks"
                      name="ipv6Blocks"
                      placeholder="2001:db8::/32, 2001:db8:1::/48"
                      value={formData.ipv6Blocks}
                      onChange={handleChange}
                      rows={2}
                      className="pl-10 pt-2"
                    />
                    <Globe2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">List your IPv6 CIDR blocks, separated by commas</p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="upstreamProviders" className="text-sm font-medium">
                    Upstream Providers
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="upstreamProviders"
                      name="upstreamProviders"
                      placeholder="List your transit providers and peering partners"
                      value={formData.upstreamProviders}
                      onChange={handleChange}
                      rows={2}
                      className="pl-10 pt-2"
                    />
                    <Server className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex justify-between space-x-4 pt-4">
                  <Button type="button" onClick={prevTab} variant="outline" className="w-1/2">
                    Back: Address Information
                  </Button>
                  <Button
                    type="button"
                    onClick={nextTab}
                    className="w-1/2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
                  >
                    Next: Security Information
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Password must be at least 8 characters and include uppercase, lowercase, number, and special
                    character
                  </p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/30 rounded-md p-4 flex gap-3 mt-4">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-400">Important Security Notice</p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      This master account will have full administrative access to your ISP configuration. Make sure to
                      use a strong, unique password and keep it secure.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleCheckboxChange("agreeToTerms", checked === true)}
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm">
                    I agree to the{" "}
                    <a href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                  </Label>
                </div>

                <div className="flex justify-between space-x-4 pt-4">
                  <Button type="button" onClick={prevTab} variant="outline" className="w-1/2">
                    Back: Technical Information
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !formData.agreeToTerms}
                    className="w-1/2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContainer>
        </form>
      </SectionContainer>
    </div>
  )
}
