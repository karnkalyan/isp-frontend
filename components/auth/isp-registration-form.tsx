"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { toast } from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardContainer } from "@/components/ui/card-container"
import { SectionContainer } from "@/components/ui/section-container"
import bcrypt from "bcryptjs"
import { apiRequest } from "@/lib/api"

// Validation interface
interface ValidationErrors {
  [key: string]: string
}

// Password strength interface
interface PasswordStrength {
  score: number
  feedback: string
  color: string
}

export function ISPRegistrationForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("company")
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: "",
    color: "bg-gray-200"
  })
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

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

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate phone number (basic international format)
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)\.]/g, ''))
  }

  // Validate website URL
  const validateWebsite = (url: string): boolean => {
    if (!url) return true // Optional field
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
      return true
    } catch {
      return false
    }
  }

  // Validate IPv4 CIDR blocks
  const validateIPv4Blocks = (blocks: string): boolean => {
    if (!blocks) return true // Optional field
    const cidrRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(3[0-2]|[12]?[0-9])$/
    return blocks.split(',').every(block => cidrRegex.test(block.trim()))
  }

  // Validate IPv6 CIDR blocks
// Simplified version that accepts most common IPv6 formats
const validateIPv6Blocks = (blocks: string): boolean => {
  if (!blocks) return true // Optional field
  
  const blockList = blocks.split(',').map(block => block.trim()).filter(block => block.length > 0)
  
  if (blockList.length === 0) return true
  
  return blockList.every(block => {
    // Check CIDR format
    if (!block.includes('/')) return false
    
    const [address, cidr] = block.split('/')
    
    // Validate CIDR prefix (0-128)
    const cidrNum = parseInt(cidr, 10)
    if (isNaN(cidrNum) || cidrNum < 0 || cidrNum > 128) return false
    
    // Accept common IPv6 patterns
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}(:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})?$/
    const hasDoubleColon = address.includes('::')
    
    // Count colons
    const colonCount = (address.match(/:/g) || []).length
    
    if (hasDoubleColon) {
      // With double colon, should have 2-7 colons total
      return colonCount >= 2 && colonCount <= 7 && ipv6Pattern.test(address)
    } else {
      // Without double colon, should have exactly 7 colons for full address
      // or less for compressed forms at start/end
      return (colonCount >= 1 && colonCount <= 7) && ipv6Pattern.test(address)
    }
  })
}

  // Calculate password strength
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) {
      return { score: 0, feedback: "", color: "bg-gray-200" }
    }

    let score = 0
    const feedback = []

    // Length check
    if (password.length >= 8) score += 1
    else feedback.push("At least 8 characters")

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1
    else feedback.push("One lowercase letter")

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1
    else feedback.push("One uppercase letter")

    // Number check
    if (/[0-9]/.test(password)) score += 1
    else feedback.push("One number")

    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    else feedback.push("One special character")

    // Determine color based on score
    let color = "bg-red-500"
    if (score >= 4) color = "bg-green-500"
    else if (score >= 3) color = "bg-yellow-500"
    else if (score >= 2) color = "bg-orange-500"

    return {
      score,
      feedback: feedback.length > 0 ? `Missing: ${feedback.join(", ")}` : "Strong password",
      color
    }
  }

  // Validate individual field
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'companyName':
        if (!value.trim()) return "Company name is required"
        if (value.length < 2) return "Company name must be at least 2 characters"
        return ""

      case 'masterEmail':
        if (!value.trim()) return "Email is required"
        if (!validateEmail(value)) return "Please enter a valid email address"
        return ""

      case 'password':
        if (!value) return "Password is required"
        if (value.length < 8) return "Password must be at least 8 characters"
        if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter"
        if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter"
        if (!/[0-9]/.test(value)) return "Password must contain at least one number"
        if (!/[^A-Za-z0-9]/.test(value)) return "Password must contain at least one special character"
        return ""

      case 'confirmPassword':
        if (!value) return "Please confirm your password"
        if (value !== formData.password) return "Passwords do not match"
        return ""

      case 'phoneNumber':
        if (value && !validatePhone(value)) return "Please enter a valid phone number"
        return ""

      case 'website':
        if (value && !validateWebsite(value)) return "Please enter a valid website URL"
        return ""

      case 'ipv4Blocks':
        if (value && !validateIPv4Blocks(value)) return "Please enter valid IPv4 CIDR blocks (e.g., 192.168.1.0/24)"
        return ""

      case 'ipv6Blocks':
        if (value && !validateIPv6Blocks(value)) return "Please enter valid IPv6 CIDR blocks"
        return ""

      case 'agreeToTerms':
        if (!value) return "You must agree to the terms and conditions"
        return ""

      default:
        return ""
    }
  }

  // Validate current tab
  const validateCurrentTab = (): boolean => {
    const errors: ValidationErrors = {}
    const fieldsToValidate = getFieldsForTab(activeTab)
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData])
      if (error) {
        errors[field] = error
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Get fields for each tab
  const getFieldsForTab = (tab: string): string[] => {
    switch (tab) {
      case 'company':
        return ['companyName', 'businessType', 'website', 'contactPerson', 'phoneNumber', 'masterEmail']
      case 'address':
        return ['address', 'city', 'state', 'zipCode', 'country']
      case 'technical':
        return ['asnNumber', 'ipv4Blocks', 'ipv6Blocks']
      case 'security':
        return ['password', 'confirmPassword', 'agreeToTerms']
      default:
        return []
    }
  }

  // Handle field blur (touch)
  const handleBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set([...prev, fieldName]))
    
    const error = validateField(fieldName, formData[fieldName as keyof typeof formData])
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: error
    }))
  }

  // Update password strength on password change
  useEffect(() => {
    const strength = calculatePasswordStrength(formData.password)
    setPasswordStrength(strength)
  }, [formData.password])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
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

    if (name === 'agreeToTerms' && validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB")
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file")
        return
      }

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
    
    // Validate all tabs before submission
    const allFields = [
      'companyName', 'businessType', 'website', 'contactPerson', 'phoneNumber', 
      'masterEmail', 'password', 'confirmPassword', 'agreeToTerms'
    ]
    
    const errors: ValidationErrors = {}
    allFields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData])
      if (error) {
        errors[field] = error
      }
    })

    // Mark all fields as touched
    const allTouched = new Set([...touchedFields, ...allFields])
    setTouchedFields(allTouched)

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      
      // Switch to first tab with errors
      const errorTabs = new Set<string>()
      Object.keys(errors).forEach(errorField => {
        if (getFieldsForTab('company').includes(errorField)) errorTabs.add('company')
        else if (getFieldsForTab('address').includes(errorField)) errorTabs.add('address')
        else if (getFieldsForTab('technical').includes(errorField)) errorTabs.add('technical')
        else if (getFieldsForTab('security').includes(errorField)) errorTabs.add('security')
      })
      
      if (errorTabs.size > 0) {
        const firstErrorTab = Array.from(errorTabs)[0]
        setActiveTab(firstErrorTab)
      }
      
      toast.error("Please fix the validation errors before submitting")
      return
    }
  
    setIsLoading(true)
  
    try {
      const hashedPassword = await bcrypt.hash(formData.password, 10)
  
      const submitData = new FormData()
      submitData.append("companyName", formData.companyName)
      submitData.append("masterEmail", formData.masterEmail)
      submitData.append("passwordHash", hashedPassword)
      submitData.append("businessType", formData.businessType)
      submitData.append("website", formData.website)
      submitData.append("contactPerson", formData.contactPerson)
      submitData.append("phoneNumber", formData.phoneNumber)
      submitData.append("description", formData.description)
      submitData.append("address", formData.address)
      submitData.append("city", formData.city)
      submitData.append("state", formData.state)
      submitData.append("zipCode", formData.zipCode)
      submitData.append("country", formData.country)
      submitData.append("asnNumber", formData.asnNumber)
      submitData.append("ipv4Blocks", formData.ipv4Blocks)
      submitData.append("ipv6Blocks", formData.ipv6Blocks)
      submitData.append("upstreamProviders", formData.upstreamProviders)
  
      if (logoFile) submitData.append("logo", logoFile)
  
      // Use apiRequest instead of fetch
      const data = await apiRequest("/isp", {
        method: "POST",
        body: submitData,
      })
  
      console.log("ispData", data)


      const ispId = data.data?.id; 

if (ispId) {
    const userData = new FormData();
    userData.append("ispId", ispId);
    console.log("Appended ispId:", ispId);
} else {
    console.error("Could not find ID in response:", data);
}

      // Create user for this ISP
      const userData = new FormData()
      // userData.append("ispId", data.id)
      // console.log("ispId", data.id)
      userData.append("name", formData.contactPerson)
      userData.append("email", formData.masterEmail)
      userData.append("password", formData.password)
      userData.append("roleId", "1") // Admin role
      userData.append("status", "active")
      userData.append("departmentId", "3") // Assuming 3 is for ISP admin

      // Create user using apiRequest
      const userResponse = await apiRequest("/users", {
        method: "POST",
        body: userData,
      })
      
      console.log(userResponse)
      
      toast.success("ISP registration successful!")
      toast.success("User registration successful!")
      
      setRegistrationComplete(true)
      
    } catch (err) {
      console.error(err)
      // apiRequest already shows toast error
    } finally {
      setIsLoading(false)
    }
  }
  
  const nextTab = () => {
    if (!validateCurrentTab()) {
      toast.error("Please fix the validation errors before proceeding")
      return
    }
    
    if (activeTab === "company") setActiveTab("address")
    else if (activeTab === "address") setActiveTab("technical")
    else if (activeTab === "technical") setActiveTab("security")
  }

  const prevTab = () => {
    if (activeTab === "security") setActiveTab("technical")
    else if (activeTab === "technical") setActiveTab("address")
    else if (activeTab === "address") setActiveTab("company")
  }

  // Helper function to render validation error
  const renderError = (fieldName: string) => {
    if (!validationErrors[fieldName] || !touchedFields.has(fieldName)) return null
    
    return (
      <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
        <AlertTriangle className="h-3 w-3" />
        <span>{validationErrors[fieldName]}</span>
      </div>
    )
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
                <TabsTrigger value="company" className="relative">
                  Company
                  {getFieldsForTab('company').some(f => validationErrors[f]) && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="address" className="relative">
                  Address
                  {getFieldsForTab('address').some(f => validationErrors[f]) && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="technical" className="relative">
                  Technical
                  {getFieldsForTab('technical').some(f => validationErrors[f]) && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="security" className="relative">
                  Security
                  {getFieldsForTab('security').some(f => validationErrors[f]) && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </TabsTrigger>
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
                      onBlur={() => handleBlur("companyName")}
                      className={`pl-10 ${validationErrors.companyName && touchedFields.has('companyName') ? 'border-red-500' : ''}`}
                      required
                    />
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {renderError("companyName")}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="businessType" className="text-sm font-medium">
                    Business Type
                  </Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => handleSelectChange("businessType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="isp">Internet Service Provider</SelectItem>
                      <SelectItem value="wisp">Wireless ISP</SelectItem>
                      <SelectItem value="fiber">Fiber Provider</SelectItem>
                      <SelectItem value="cable">Cable Provider</SelectItem>
                      <SelectItem value="telco">Telecommunications</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                      onBlur={() => handleBlur("website")}
                      className={`pl-10 ${validationErrors.website && touchedFields.has('website') ? 'border-red-500' : ''}`}
                    />
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {renderError("website")}
                  <p className="text-xs text-muted-foreground mt-1">Include https:// or http://</p>
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
                        onBlur={() => handleBlur("phoneNumber")}
                        className={`pl-10 ${validationErrors.phoneNumber && touchedFields.has('phoneNumber') ? 'border-red-500' : ''}`}
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {renderError("phoneNumber")}
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
                      onBlur={() => handleBlur("masterEmail")}
                      className={`pl-10 ${validationErrors.masterEmail && touchedFields.has('masterEmail') ? 'border-red-500' : ''}`}
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {renderError("masterEmail")}
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
                    <Input 
                      id="city" 
                      name="city" 
                      placeholder="City" 
                      value={formData.city} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="state" className="text-sm font-medium">
                      State/Province
                    </Label>
                    <Input 
                      id="state" 
                      name="state" 
                      placeholder="State" 
                      value={formData.state} 
                      onChange={handleChange} 
                    />
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
                    <Select value={formData.country} onValueChange={(value) => handleSelectChange("country", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="au">Australia</SelectItem>
                        <SelectItem value="de">Germany</SelectItem>
                        <SelectItem value="fr">France</SelectItem>
                        <SelectItem value="jp">Japan</SelectItem>
                        <SelectItem value="in">India</SelectItem>
                        <SelectItem value="np">Nepal</SelectItem>
                        <SelectItem value="br">Brazil</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                      onBlur={() => handleBlur("ipv4Blocks")}
                      rows={2}
                      className={`pl-10 pt-2 ${validationErrors.ipv4Blocks && touchedFields.has('ipv4Blocks') ? 'border-red-500' : ''}`}
                    />
                    <Network className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                  {renderError("ipv4Blocks")}
                  <p className="text-xs text-muted-foreground mt-1">List your IPv4 CIDR blocks, separated by commas (e.g., 192.168.1.0/24)</p>
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
                      onBlur={() => handleBlur("ipv6Blocks")}
                      rows={2}
                      className={`pl-10 pt-2 ${validationErrors.ipv6Blocks && touchedFields.has('ipv6Blocks') ? 'border-red-500' : ''}`}
                    />
                    <Globe2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                  {renderError("ipv6Blocks")}
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
                      onBlur={() => handleBlur("password")}
                      className={`pl-10 ${validationErrors.password && touchedFields.has('password') ? 'border-red-500' : ''}`}
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
                  {renderError("password")}
                  
                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Password strength</span>
                        <span className="text-xs font-medium">
                          {passwordStrength.score >= 4 ? "Strong" : 
                           passwordStrength.score >= 3 ? "Medium" : 
                           passwordStrength.score >= 2 ? "Weak" : "Very Weak"}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      {passwordStrength.feedback && (
                        <p className="text-xs mt-1 text-muted-foreground">{passwordStrength.feedback}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1">
                      {formData.password.length >= 8 ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="text-xs">8+ characters</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/[a-z]/.test(formData.password) ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="text-xs">Lowercase</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/[A-Z]/.test(formData.password) ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="text-xs">Uppercase</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/[0-9]/.test(formData.password) ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="text-xs">Number</span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                      {/[^A-Za-z0-9]/.test(formData.password) ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="text-xs">Special character</span>
                    </div>
                  </div>
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
                      onBlur={() => handleBlur("confirmPassword")}
                      className={`pl-10 ${validationErrors.confirmPassword && touchedFields.has('confirmPassword') ? 'border-red-500' : ''}`}
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
                  {renderError("confirmPassword")}
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
                    className={`${validationErrors.agreeToTerms && touchedFields.has('agreeToTerms') ? 'border-red-500' : ''}`}
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
                {renderError("agreeToTerms")}

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