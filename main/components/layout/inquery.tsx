"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Phone, User, Calendar, Clock, PhoneOff,
  PhoneIncoming, PhoneOutgoing, X, Mail,
  MapPin, Wifi, UserCheck, RefreshCw,
  Copy, ExternalLink, Star, Users,
  Briefcase, Building, PhoneCall, CheckCircle,
  AlertCircle, Headphones, ArrowRight, Bell, PhoneForwarded, Circle
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

interface CallMember {
  inbound?: {
    from: string
    to: string
    trunkname: string
    channelid: string
    memberstatus: string
    callpath: string
  }
  ext?: {
    number: string
    channelid: string
    memberstatus: string
  }
}

interface NumberCall {
  callid: string
  members: CallMember[]
}

interface CallListItem {
  number: string
  numbercalls: NumberCall[]
}

interface InquiryResponse {
  success: boolean
  data: {
    status: string
    calllist: CallListItem[]
  }
}

interface Customer {
  id: number
  customerUniqueId: string
  panNo: string
  firstName: string
  middleName: string | null
  lastName: string
  email: string
  phoneNumber: string
  secondaryPhone: string | null
  gender: string
  street: string | null
  city: string
  district: string | null
  province: string | null
  zipCode: string
  status: string
  onboardStatus: string
  connectionType: string
  billingCycle: string
  ispId: number
  membershipId: number
  assignedPkg: number
  subscribedPkgId: number
  rechargeable: boolean
  createdAt: string
  updatedAt: string
}

interface Lead {
  id: string
  firstName: string
  lastName: string
  email?: string
  phoneNumber?: string
  status: string
  source?: string
  notes?: string
  createdAt?: string
  assignedTo?: string
  company?: string
  title?: string
}

interface Extension {
  number: string
  status: string
  type: string
  username: string
}

interface ExtensionListResponse {
  success: boolean
  data: {
    status: string
    extlist: Extension[]
  }
}

interface InquiryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InquiryDialog({ open, onOpenChange }: InquiryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [callData, setCallData] = useState<InquiryResponse | null>(null)
  const [selectedFromNumber, setSelectedFromNumber] = useState<string | null>(null)
  const [customerInfo, setCustomerInfo] = useState<Customer | null>(null)
  const [leadInfo, setLeadInfo] = useState<Lead | null>(null)
  const [fetchingInfo, setFetchingInfo] = useState(false)
  const [acceptingCall, setAcceptingCall] = useState<string | null>(null)
  const [transferringCall, setTransferringCall] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"customer" | "lead">("customer")
  const [extensionList, setExtensionList] = useState<Extension[]>([])
  const [fetchingExtensions, setFetchingExtensions] = useState(false)
  const [selectedTransferExtension, setSelectedTransferExtension] = useState<string>("")
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [currentCallForTransfer, setCurrentCallForTransfer] = useState<{
    channelId: string
    callId: string
    fromNumber: string
  } | null>(null)
  const [transferredCalls, setTransferredCalls] = useState<Set<string>>(new Set())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"))

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"))
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (open) {
      fetchCallData()
      fetchExtensionList()
      
      if (autoRefresh) {
        const intervalId = setInterval(() => {
          if (!refreshing && !loading) {
            fetchCallData(true)
          }
        }, 3000)

        return () => clearInterval(intervalId)
      }
    } else {
      setCallData(null)
      setSelectedFromNumber(null)
      setCustomerInfo(null)
      setLeadInfo(null)
      setAcceptingCall(null)
      setTransferringCall(null)
      setTransferDialogOpen(false)
      setCurrentCallForTransfer(null)
      setSelectedTransferExtension("")
      setTransferredCalls(new Set())
    }
  }, [open, autoRefresh])

  const fetchCallData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const data = await apiRequest<InquiryResponse>("/yeaster/extensionQuery", {
        method: "GET",
      })
      
      if (data?.data?.calllist) {
        // Filter out transferred calls from the response
        const filteredCalllist = data.data.calllist.map(extension => ({
          ...extension,
          numbercalls: extension.numbercalls.filter(call => 
            !transferredCalls.has(call.callid)
          )
        })).filter(extension => extension.numbercalls.length > 0)
        
        const filteredData = {
          ...data,
          data: {
            ...data.data,
            calllist: filteredCalllist
          }
        }
        
        setCallData(filteredData)
        
        // Automatically select the first inbound number if available
        if (filteredData?.data?.calllist?.[0]?.numbercalls?.[0]?.members) {
          const members = filteredData.data.calllist[0].numbercalls[0].members
          const inboundMember = members.find(m => m.inbound)
          if (inboundMember?.inbound?.from) {
            setSelectedFromNumber(inboundMember.inbound.from)
            fetchContactInfo(inboundMember.inbound.from)
          }
        }
        
        // Clean up transferred calls that are no longer in the system
        if (data.data.calllist.length > 0) {
          const allCurrentCallIds = new Set(
            data.data.calllist.flatMap(ext => ext.numbercalls.map(call => call.callid))
          )
          setTransferredCalls(prev => {
            const newSet = new Set(prev)
            for (const callId of prev) {
              if (!allCurrentCallIds.has(callId)) {
                newSet.delete(callId)
              }
            }
            return newSet
          })
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch call data:", error)
      toast.error(error.message || "Failed to fetch call information")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchExtensionList = async () => {
    try {
      setFetchingExtensions(true)
      const data = await apiRequest<ExtensionListResponse>("/yeaster/extensionList", {
        method: "GET",
      })
      if (data.success && data.data.extlist) {
        setExtensionList(data.data.extlist)
      }
    } catch (error: any) {
      console.error("Failed to fetch extension list:", error)
    } finally {
      setFetchingExtensions(false)
    }
  }

  const fetchContactInfo = async (phoneNumber: string) => {
    try {
      setFetchingInfo(true)
      
      try {
        const customerResponse = await apiRequest<Customer>("/customer/by-phone", {
          method: "POST",
          body: JSON.stringify({ phoneNumber })
        })
        
        if (customerResponse) {
          setCustomerInfo(customerResponse)
          setActiveTab("customer")
        } else {
          setCustomerInfo(null)
        }
      } catch (customerError: any) {
        setCustomerInfo(null)
      }

      try {
        const leadsResponse = await apiRequest<{ data: Lead[] }>(`/lead?search=${phoneNumber}`)
        
        if (leadsResponse?.data && Array.isArray(leadsResponse.data) && leadsResponse.data.length > 0) {
          setLeadInfo(leadsResponse.data[0])
          if (!customerInfo) {
            setActiveTab("lead")
          }
        } else {
          setLeadInfo(null)
        }
      } catch (leadError: any) {
        setLeadInfo(null)
      }
    } catch (error: any) {
      console.error("Failed to fetch contact info:", error)
    } finally {
      setFetchingInfo(false)
    }
  }

  const handleNumberSelect = (phoneNumber: string) => {
    setSelectedFromNumber(phoneNumber)
    fetchContactInfo(phoneNumber)
  }

  const getStatusBadge = (status: string) => {
    const statusUpper = status?.toUpperCase()
    switch (statusUpper) {
      case "ANSWERED":
      case "ANSWER":
        return (
          <Badge className={`${isDarkMode ? 'bg-green-900 border-green-700 text-green-100' : 'bg-green-100 text-green-800 border-green-200'} border`}>
            Answered
          </Badge>
        )
      case "RING":
      case "RINGING":
        return (
          <Badge className={`${isDarkMode ? 'bg-blue-900 border-blue-700 text-blue-100 animate-pulse' : 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse'} border`}>
            Ringing
          </Badge>
        )
      case "NOANSWER":
        return (
          <Badge className={`${isDarkMode ? 'bg-yellow-900 border-yellow-700 text-yellow-100' : 'bg-yellow-100 text-yellow-800 border-yellow-200'} border`}>
            No Answer
          </Badge>
        )
      case "BUSY":
        return (
          <Badge className={`${isDarkMode ? 'bg-red-900 border-red-700 text-red-100' : 'bg-red-100 text-red-800 border-red-200'} border`}>
            Busy
          </Badge>
        )
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>
    }
  }

  const getExtensionStatusBadge = (status: string) => {
    const statusUpper = status?.toUpperCase()
    switch (statusUpper) {
      case "REGISTERED":
      case "IDLE":
        return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100">Available</Badge>
      case "UNAVAILABLE":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300">Unavailable</Badge>
      case "RINGING":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 animate-pulse">Ringing</Badge>
      case "BUSY":
        return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100">Busy</Badge>
      case "HOLD":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100">Hold</Badge>
      case "MALFUNCTION":
        return <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100">Malfunction</Badge>
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>
    }
  }

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith("98") && phone.length === 10) {
      return `+977 ${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`
    }
    return phone
  }

  const handleCallBack = async (phoneNumber: string) => {
    try {
      const callPayload = {
        destination: phoneNumber,
      }
      
      await apiRequest(`/yeaster/makCalls`, {
        method: 'POST',
        body: JSON.stringify(callPayload)
      })
      
      toast.success(`Calling ${formatPhoneNumber(phoneNumber)}`)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Call failed:", error)
      toast.error(error.message || "Failed to initiate call")
    }
  }

  const handleAcceptCall = async (channelId: string, callId: string) => {
    try {
      setAcceptingCall(callId)
      
      const acceptPayload = {
        channelid: channelId
      }
      
      const response = await apiRequest("/yeaster/acceptCall", {
        method: "POST",
        body: JSON.stringify(acceptPayload)
      })
      
      toast.success("Call accepted successfully!")
      
      // Update local state immediately
      if (callData) {
        const updatedCallList = callData.data.calllist.map(extension => ({
          ...extension,
          numbercalls: extension.numbercalls.map(call => {
            if (call.callid === callId) {
              return {
                ...call,
                members: call.members.map(member => {
                  if (member.ext) {
                    return {
                      ...member,
                      ext: {
                        ...member.ext,
                        memberstatus: "ANSWER"
                      }
                    }
                  }
                  return member
                })
              }
            }
            return call
          })
        }))
        
        setCallData({
          ...callData,
          data: {
            ...callData.data,
            calllist: updatedCallList
          }
        })
      }
      
      // Refresh after a delay
      setTimeout(() => {
        fetchCallData(true)
      }, 1000)
      
    } catch (error: any) {
      console.error("Failed to accept call:", error)
      toast.error(error.message || "Failed to accept call")
    } finally {
      setAcceptingCall(null)
    }
  }

  const handleOpenTransferDialog = (channelId: string, callId: string, fromNumber: string) => {
    setCurrentCallForTransfer({ channelId, callId, fromNumber })
    setTransferDialogOpen(true)
    fetchExtensionList()
  }

  const handleTransferCall = async () => {
    if (!currentCallForTransfer || !selectedTransferExtension) {
      toast.error("Please select an extension to transfer to")
      return
    }

    try {
      setTransferringCall(currentCallForTransfer.callId)
      setTransferredCalls(prev => new Set([...prev, currentCallForTransfer.callId]))
      
      const transferPayload = {
        channelid: currentCallForTransfer.channelId,
        number: selectedTransferExtension
      }
      
      await apiRequest("/yeaster/callTransfer", {
        method: "POST",
        body: JSON.stringify(transferPayload)
      })
      
      toast.success(`Call transferred to extension ${selectedTransferExtension}`)
      
      // Update local state immediately
      if (callData) {
        const newCallList = callData.data.calllist.map(extension => ({
          ...extension,
          numbercalls: extension.numbercalls.filter(
            call => call.callid !== currentCallForTransfer.callId
          )
        })).filter(extension => extension.numbercalls.length > 0)
        
        setCallData({
          ...callData,
          data: {
            ...callData.data,
            calllist: newCallList
          }
        })
      }
      
      setTransferDialogOpen(false)
      setCurrentCallForTransfer(null)
      setSelectedTransferExtension("")
      
      // Force refresh to get updated state
      setTimeout(() => {
        fetchCallData(true)
        fetchExtensionList()
      }, 500)
      
    } catch (error: any) {
      console.error("Failed to transfer call:", error)
      toast.error(error.message || "Failed to transfer call")
      // Remove from transferred calls on error
      setTransferredCalls(prev => {
        const newSet = new Set(prev)
        newSet.delete(currentCallForTransfer.callId)
        return newSet
      })
    } finally {
      setTransferringCall(null)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getStatusColor = (status: string, type: "customer" | "lead") => {
    const statusLower = status?.toLowerCase()
    
    if (type === "customer") {
      switch (statusLower) {
        case "active":
          return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100"
        case "inactive":
          return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
        case "pending":
          return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100"
        default:
          return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
      }
    } else {
      switch (statusLower) {
        case "new":
        case "contacted":
          return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100"
        case "qualified":
          return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100"
        case "converted":
          return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-100"
        case "lost":
          return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100"
        default:
          return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
      }
    }
  }

  const handleViewCustomer = (customerId: number) => {
    router.push(`/customers/${customerId}`)
    onOpenChange(false)
  }

  const handleViewLead = (leadId: string) => {
    router.push(`/leads/${leadId}`)
    onOpenChange(false)
  }

  const handleCreateNew = (type: "customer" | "lead", phoneNumber: string) => {
    if (type === "customer") {
      router.push(`/customers/new?phone=${phoneNumber}`)
    } else {
      router.push(`/leads/new?phone=${phoneNumber}`)
    }
    onOpenChange(false)
  }

  const isCallRinging = (call: NumberCall) => {
    return call.members.some(m => 
      m.ext?.memberstatus === "ANSWER" && 
      !call.members.some(m2 => m2.inbound?.memberstatus === "ANSWERED")
    )
  }

  const isCallAnswered = (call: NumberCall) => {
    return call.members.some(m => m.inbound?.memberstatus === "ANSWERED")
  }

  const getExtensionChannelId = (call: NumberCall): string | null => {
    const extMember = call.members.find(m => m.ext)
    return extMember?.ext?.channelid || null
  }

  const getInboundFromNumber = (call: NumberCall): string | null => {
    const inboundMember = call.members.find(m => m.inbound)
    return inboundMember?.inbound?.from || null
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <Card className={`${isDarkMode ? 'bg-[#0f172a]' : 'bg-white'} border-0 relative overflow-hidden`}>
            {/* Gradient Backgrounds INSIDE the Card */}
            <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20`}
              style={{
                background: `radial-gradient(circle, ${isDarkMode ? '#3b82f6' : '#3b82f6'} 0%, transparent 70%)`,
              }}
            />
            <div className={`absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20`}
              style={{
                background: `radial-gradient(circle, ${isDarkMode ? '#10B981' : '#10B981'} 0%, transparent 70%)`,
              }}
            />
            
            <div className="relative z-10">
              <DialogHeader className={`p-6 ${isDarkMode ? 'border-[#1e293b]' : 'border-gray-200'} border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-lg`}>
                      <PhoneIncoming className={`h-6 w-6 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <DialogTitle className={`text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Call Inquiry Dashboard
                      </DialogTitle>
                      <DialogDescription className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
                        Real-time call monitoring with customer and lead lookup
                      </DialogDescription>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative">
                    <div className={`h-16 w-16 rounded-full border-4 ${isDarkMode ? 'border-blue-800' : 'border-blue-100'}`}></div>
                    <div className={`absolute top-0 left-0 h-16 w-16 rounded-full border-4 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'} border-t-transparent animate-spin`}></div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Loading call data...</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Fetching active calls and extensions</p>
                  </div>
                </div>
              ) : callData ? (
                <div className="space-y-6 p-6">
                  {/* System Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${callData.data.status === "Success" ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>System Status:</span>
                      <Badge variant={callData.data.status === "Success" ? "default" : "destructive"}>
                        {callData.data.status}
                      </Badge>
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {callData.data.calllist.reduce((acc, item) => acc + item.numbercalls.length, 0)} active calls • 
                      {callData.data.calllist.length} extensions
                    </div>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Call List */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <Phone className="h-5 w-5" />
                          Active Calls
                        </h3>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`h-8 ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-[#1e293b]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                          >
                            {autoRefresh ? (
                              <>
                                <Circle className="h-3 w-3 mr-2 text-green-500 fill-green-500" />
                                Auto ON
                              </>
                            ) : (
                              <>
                                <Circle className="h-3 w-3 mr-2 text-red-500 fill-red-500" />
                                Auto OFF
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchCallData(true)}
                            disabled={refreshing}
                            className={`h-8 ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-[#1e293b]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                        </div>
                      </div>

                      {callData.data.calllist.length === 0 ? (
                        <Card className={`${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'} relative overflow-hidden`}>
                          {/* Gradients for empty state card */}
                          <div className={`absolute -top-16 -left-16 w-48 h-48 rounded-full opacity-20`}
                            style={{
                              background: `radial-gradient(circle, ${isDarkMode ? '#3b82f6' : '#3b82f6'} 0%, transparent 70%)`,
                            }}
                          />
                          <div className={`absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-20`}
                            style={{
                              background: `radial-gradient(circle, ${isDarkMode ? '#10B981' : '#10B981'} 0%, transparent 70%)`,
                            }}
                          />
                          <CardContent className="pt-6 relative z-10">
                            <div className="text-center py-8 space-y-4">
                              <div className={`mx-auto w-16 h-16 rounded-full ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-100'} flex items-center justify-center`}>
                                <PhoneOff className={`h-8 w-8 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                              </div>
                              <div>
                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No active calls</p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                                  All extensions are currently idle
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                          {callData.data.calllist.map((callItem, index) => (
                            <Card key={index} className={`hover:shadow-lg transition-all ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'} relative overflow-hidden`}>
                              {/* Gradients for call cards */}
                              <div className={`absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-20`}
                                style={{
                                  background: `radial-gradient(circle, ${isDarkMode ? '#3b82f6' : '#3b82f6'} 0%, transparent 70%)`,
                                }}
                              />
                              <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-20`}
                                style={{
                                  background: `radial-gradient(circle, ${isDarkMode ? '#10B981' : '#10B981'} 0%, transparent 70%)`,
                                }}
                              />
                              <div className="relative z-10">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-lg`}>
                                        <span className={`font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>{callItem.number}</span>
                                      </div>
                                      <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Extension</span>
                                    </div>
                                    <Badge variant="outline" className={`font-mono text-xs ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>
                                      {callItem.numbercalls.length} call(s)
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    {callItem.numbercalls.map((call, callIndex) => {
                                      const isRinging = isCallRinging(call)
                                      const isAnswered = isCallAnswered(call)
                                      const extChannelId = getExtensionChannelId(call)
                                      const inboundFrom = getInboundFromNumber(call)
                                      
                                      // Skip if call is being transferred
                                      if (transferredCalls.has(call.callid)) {
                                        return null
                                      }
                                      
                                      return (
                                        <div key={call.callid} className={`border rounded-xl p-4 ${isDarkMode ? 'bg-[#0f172a]/50 border-[#334155]' : 'bg-gray-50/50 border-gray-200'}`}>
                                          <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                              <Badge variant="secondary" className={`font-mono text-xs ${isDarkMode ? 'bg-[#0f172a] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                                ID: {call.callid}
                                              </Badge>
                                              {isAnswered ? (
                                                getStatusBadge("ANSWERED")
                                              ) : isRinging ? (
                                                getStatusBadge("RINGING")
                                              ) : (
                                                getStatusBadge(
                                                  call.members.find(m => m.ext)?.ext?.memberstatus ||
                                                  call.members.find(m => m.inbound)?.inbound?.memberstatus ||
                                                  ""
                                                )
                                              )}
                                            </div>
                                            <Clock className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                          </div>

                                          {/* Call Flow Visualization */}
                                          <div className="flex items-center justify-between py-4">
                                            {/* Inbound */}
                                            {call.members
                                              .filter(m => m.inbound)
                                              .map((member, idx) => (
                                                <div key={`inbound-${idx}`} className="text-center">
                                                  <div className="flex flex-col items-center gap-2">
                                                    <div className={`p-3 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-full`}>
                                                      <PhoneIncoming className={`h-5 w-5 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                                                    </div>
                                                    <div className="text-center">
                                                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Incoming</p>
                                                      <button
                                                        onClick={() => handleNumberSelect(member.inbound!.from)}
                                                        className={`mt-1 font-mono text-sm transition-all hover:scale-105 ${
                                                          selectedFromNumber === member.inbound!.from 
                                                            ? `${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-bold` 
                                                            : `${isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-700 hover:text-blue-500'}`
                                                        }`}
                                                      >
                                                        {formatPhoneNumber(member.inbound!.from)}
                                                      </button>
                                                      {selectedFromNumber === member.inbound!.from && (
                                                        <div className="mt-1">
                                                          <div className={`h-1 w-4 ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'} rounded-full mx-auto`}></div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}

                                            {/* Arrow */}
                                            <div className="flex-1 flex items-center justify-center">
                                              <div className={`h-0.5 w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} relative`}>
                                                <div className={`absolute inset-0 ${
                                                  isRinging 
                                                    ? 'bg-gradient-to-r from-blue-400 via-orange-400 to-green-400 animate-pulse' 
                                                    : 'bg-gradient-to-r from-blue-400 to-green-400'
                                                }`}></div>
                                              </div>
                                              <ArrowRight className={`h-6 w-6 ${
                                                isRinging ? 'text-orange-400 animate-bounce' : isDarkMode ? 'text-gray-600' : 'text-gray-400'
                                              } mx-2`} />
                                            </div>

                                            {/* Extension */}
                                            {call.members
                                              .filter(m => m.ext)
                                              .map((member, idx) => (
                                                <div key={`ext-${idx}`} className="text-center">
                                                  <div className="flex flex-col items-center gap-2">
                                                    <div className={`p-3 ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} rounded-full`}>
                                                      <PhoneOutgoing className={`h-5 w-5 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} />
                                                    </div>
                                                    <div>
                                                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Extension</p>
                                                      <p className={`mt-1 font-mono text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        {member.ext!.number}
                                                      </p>
                                                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                                                        Status: {member.ext!.memberstatus}
                                                      </p>
                                                    </div>
                                                    
                                                    {/* Show Accept Call button only when ringing and not answered */}
                                                    {isRinging && extChannelId && !isAnswered && (
                                                      <Button
                                                        size="sm"
                                                        onClick={() => handleAcceptCall(extChannelId, call.callid)}
                                                        disabled={acceptingCall === call.callid}
                                                        className={`mt-2 ${
                                                          acceptingCall === call.callid 
                                                            ? 'bg-green-600' 
                                                            : 'bg-green-500 hover:bg-green-600'
                                                        }`}
                                                      >
                                                        {acceptingCall === call.callid ? (
                                                          <>
                                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                            Accepting...
                                                          </>
                                                        ) : (
                                                          <>
                                                            <PhoneCall className="h-4 w-4 mr-2" />
                                                            Accept Call
                                                          </>
                                                        )}
                                                      </Button>
                                                    )}
                                                    
                                                    {/* Show Transfer Call button when call is answered */}
                                                    {isAnswered && extChannelId && inboundFrom && (
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenTransferDialog(extChannelId, call.callid, inboundFrom)}
                                                        className={`mt-2 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-[#1e293b]' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                                      >
                                                        <PhoneForwarded className="h-4 w-4 mr-2" />
                                                        Transfer Call
                                                      </Button>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </CardContent>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Contact Info */}
                    <div className="space-y-4">
                      <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Users className="h-5 w-5" />
                        Contact Information
                      </h3>

                      {selectedFromNumber ? (
                        <div className="space-y-4">
                          {/* Selected Number Card */}
                          <Card className={`${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'} relative overflow-hidden`}>
                            {/* Gradients for selected number card */}
                            <div className={`absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-20`}
                              style={{
                                background: `radial-gradient(circle, ${isDarkMode ? '#3b82f6' : '#3b82f6'} 0%, transparent 70%)`,
                              }}
                            />
                            <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-20`}
                              style={{
                                background: `radial-gradient(circle, ${isDarkMode ? '#10B981' : '#10B981'} 0%, transparent 70%)`,
                              }}
                            />
                            <CardContent className="pt-6 relative z-10">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Selected Number</p>
                                  <p className={`text-xl font-bold mt-1 font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {formatPhoneNumber(selectedFromNumber)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigator.clipboard.writeText(selectedFromNumber)}
                                    className={`h-8 w-8 ${isDarkMode ? 'text-gray-400 hover:bg-[#1e293b] hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCallBack(selectedFromNumber)}
                                    className={`h-8 w-8 ${isDarkMode ? 'text-gray-400 hover:bg-[#1e293b] hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Contact Details Tabs */}
                          <Card className={`${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'} relative overflow-hidden`}>
                            {/* Gradients for contact details card */}
                            <div className={`absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-20`}
                              style={{
                                background: `radial-gradient(circle, ${isDarkMode ? '#3b82f6' : '#3b82f6'} 0%, transparent 70%)`,
                              }}
                            />
                            <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-20`}
                              style={{
                                background: `radial-gradient(circle, ${isDarkMode ? '#10B981' : '#10B981'} 0%, transparent 70%)`,
                              }}
                            />
                            <CardContent className="p-0 relative z-10">
                              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "customer" | "lead")}>
                                <TabsList className={`grid grid-cols-2 w-full ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-100'}`}>
                                  <TabsTrigger value="customer" className={`flex items-center gap-2 ${isDarkMode ? 'data-[state=active]:bg-[#1e293b] text-gray-300' : 'data-[state=active]:bg-white text-gray-700'}`}>
                                    <Building className="h-4 w-4" />
                                    Customer
                                    {customerInfo && (
                                      <Badge variant="secondary" className={`h-5 w-5 p-0 flex items-center justify-center ${isDarkMode ? 'bg-[#0f172a] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                        ✓
                                      </Badge>
                                    )}
                                  </TabsTrigger>
                                  <TabsTrigger value="lead" className={`flex items-center gap-2 ${isDarkMode ? 'data-[state=active]:bg-[#1e293b] text-gray-300' : 'data-[state=active]:bg-white text-gray-700'}`}>
                                    <Briefcase className="h-4 w-4" />
                                    Lead
                                    {leadInfo && (
                                      <Badge variant="secondary" className={`h-5 w-5 p-0 flex items-center justify-center ${isDarkMode ? 'bg-[#0f172a] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                        ✓
                                      </Badge>
                                    )}
                                  </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="customer" className="p-6">
                                  {fetchingInfo ? (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                      <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
                                      <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Looking up customer...</p>
                                    </div>
                                  ) : customerInfo ? (
                                    <div className="space-y-4">
                                      {/* Customer Header */}
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold dark:bg-blue-900 dark:text-blue-300">
                                              {getInitials(customerInfo.firstName, customerInfo.lastName)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                              {customerInfo.firstName} {customerInfo.middleName} {customerInfo.lastName}
                                            </h4>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{customerInfo.customerUniqueId}</p>
                                          </div>
                                        </div>
                                        <Badge className={`${getStatusColor(customerInfo.status, "customer")}`}>
                                          {customerInfo.status}
                                        </Badge>
                                      </div>

                                      <Separator className={isDarkMode ? "bg-gray-700" : "bg-gray-200"} />

                                      {/* Customer Details */}
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Email</p>
                                            <div className="flex items-center gap-2">
                                              <Mail className={`h-3 w-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                              <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{customerInfo.email}</p>
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Location</p>
                                            <div className="flex items-center gap-2">
                                              <MapPin className={`h-3 w-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{customerInfo.city}</p>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Connection</p>
                                            <Badge variant="outline" className={`font-normal ${isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                                              {customerInfo.connectionType}
                                            </Badge>
                                          </div>
                                          <div className="space-y-1">
                                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Billing</p>
                                            <Badge variant="outline" className={`font-normal ${isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                                              {customerInfo.billingCycle}
                                            </Badge>
                                          </div>
                                        </div>

                                        <div className="space-y-1">
                                          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Member Since</p>
                                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {new Date(customerInfo.createdAt).toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </p>
                                        </div>
                                      </div>

                                      <Separator className={isDarkMode ? "bg-gray-700" : "bg-gray-200"} />

                                      {/* Action Buttons */}
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => handleViewCustomer(customerInfo.id)}
                                          className={`flex-1 ${isDarkMode ? 'bg-[#1e293b] text-gray-300 hover:bg-[#334155]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        >
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          View Customer
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() => handleCallBack(customerInfo.phoneNumber)}
                                          className={`flex-1 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-[#1e293b]' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                        >
                                          <Phone className="h-4 w-4 mr-2" />
                                          Call Now
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 space-y-4">
                                      <div className={`mx-auto w-16 h-16 rounded-full ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-100'} flex items-center justify-center`}>
                                        <Building className={`h-8 w-8 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                                      </div>
                                      <div>
                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No customer found</p>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                                          This number is not associated with any customer
                                        </p>
                                      </div>
                                      <Button 
                                        onClick={() => handleCreateNew("customer", selectedFromNumber)}
                                        className={`w-full ${isDarkMode ? 'bg-[#1e293b] text-gray-300 hover:bg-[#334155]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                      >
                                        Create New Customer
                                      </Button>
                                    </div>
                                  )}
                                </TabsContent>

                                <TabsContent value="lead" className="p-6">
                                  {fetchingInfo ? (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                      <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
                                      <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Looking up lead...</p>
                                    </div>
                                  ) : leadInfo ? (
                                    <div className="space-y-4">
                                      {/* Lead Header */}
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                            <AvatarFallback className="bg-purple-100 text-purple-600 font-semibold dark:bg-purple-900 dark:text-purple-300">
                                              {getInitials(leadInfo.firstName, leadInfo.lastName)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                              {leadInfo.firstName} {leadInfo.lastName}
                                            </h4>
                                            {leadInfo.company && (
                                              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{leadInfo.company}</p>
                                            )}
                                          </div>
                                        </div>
                                        <Badge className={`${getStatusColor(leadInfo.status, "lead")}`}>
                                          {leadInfo.status}
                                        </Badge>
                                      </div>

                                      <Separator className={isDarkMode ? "bg-gray-700" : "bg-gray-200"} />

                                      {/* Lead Details */}
                                      <div className="space-y-3">
                                        {leadInfo.email && (
                                          <div className="space-y-1">
                                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Email</p>
                                            <div className="flex items-center gap-2">
                                              <Mail className={`h-3 w-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{leadInfo.email}</p>
                                            </div>
                                          </div>
                                        )}

                                        {leadInfo.phoneNumber && (
                                          <div className="space-y-1">
                                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Phone</p>
                                            <p className={`text-sm font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatPhoneNumber(leadInfo.phoneNumber)}</p>
                                          </div>
                                        )}

                                        {leadInfo.source && (
                                          <div className="space-y-1">
                                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Source</p>
                                            <Badge variant="outline" className={`font-normal ${isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                                              {leadInfo.source}
                                            </Badge>
                                          </div>
                                        )}

                                        {leadInfo.assignedTo && (
                                          <div className="space-y-1">
                                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Assigned To</p>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{leadInfo.assignedTo}</p>
                                          </div>
                                        )}

                                        {leadInfo.createdAt && (
                                          <div className="space-y-1">
                                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Created</p>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                              {new Date(leadInfo.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                              })}
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      <Separator className={isDarkMode ? "bg-gray-700" : "bg-gray-200"} />

                                      {/* Action Buttons */}
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => handleViewLead(leadInfo.id)}
                                          className={`flex-1 ${isDarkMode ? 'bg-[#1e293b] text-gray-300 hover:bg-[#334155]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        >
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          View Lead
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() => handleCallBack(leadInfo.phoneNumber || selectedFromNumber)}
                                          className={`flex-1 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-[#1e293b]' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                        >
                                          <Phone className="h-4 w-4 mr-2" />
                                          Call Now
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 space-y-4">
                                      <div className={`mx-auto w-16 h-16 rounded-full ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-100'} flex items-center justify-center`}>
                                        <Briefcase className={`h-8 w-8 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                                      </div>
                                      <div>
                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No lead found</p>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                                          This number is not associated with any lead
                                        </p>
                                      </div>
                                      <Button 
                                        onClick={() => handleCreateNew("lead", selectedFromNumber)}
                                        className={`w-full ${isDarkMode ? 'bg-[#1e293b] text-gray-300 hover:bg-[#334155]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                      >
                                        Create New Lead
                                      </Button>
                                    </div>
                                  )}
                                </TabsContent>
                              </Tabs>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <Card className={`${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'} relative overflow-hidden`}>
                          {/* Gradients for empty contact card */}
                          <div className={`absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-20`}
                            style={{
                              background: `radial-gradient(circle, ${isDarkMode ? '#3b82f6' : '#3b82f6'} 0%, transparent 70%)`,
                            }}
                          />
                          <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-20`}
                            style={{
                              background: `radial-gradient(circle, ${isDarkMode ? '#10B981' : '#10B981'} 0%, transparent 70%)`,
                            }}
                          />
                          <CardContent className="pt-6 relative z-10">
                            <div className="text-center py-8 space-y-4">
                              <div className={`mx-auto w-16 h-16 rounded-full ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} flex items-center justify-center`}>
                                <Phone className={`h-8 w-8 ${isDarkMode ? 'text-blue-300' : 'text-blue-400'}`} />
                              </div>
                              <div>
                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Select a call</p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                                  Click on any incoming number to view contact details
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className={`mx-auto w-20 h-20 rounded-full ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-100'} flex items-center justify-center`}>
                    <PhoneOff className={`h-10 w-10 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  </div>
                  <div>
                    <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No active calls</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                      There are currently no active calls in the system
                    </p>
                  </div>
                  <Button 
                    onClick={fetchCallData} 
                    variant="outline" 
                    className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-[#1e293b]' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check Again
                  </Button>
                </div>
              )}

              <DialogFooter className={`flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t ${isDarkMode ? 'border-[#1e293b]' : 'border-gray-200'} p-6`}>
                <div className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  System connected • Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-[#1e293b]' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => fetchCallData(true)}
                    disabled={refreshing || loading}
                    className={`min-w-[100px] ${isDarkMode ? 'bg-[#1e293b] text-gray-300 hover:bg-[#334155]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {refreshing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Refreshing
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Transfer Call Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <Card className={`${isDarkMode ? 'bg-[#0f172a]' : 'bg-white'} border-0 relative overflow-hidden`}>
            {/* Gradient Backgrounds INSIDE the Transfer Dialog Card */}
            <div className={`absolute -top-16 -left-16 w-48 h-48 rounded-full opacity-20`}
              style={{
                background: `radial-gradient(circle, ${isDarkMode ? '#8b5cf6' : '#8b5cf6'} 0%, transparent 70%)`,
              }}
            />
            <div className={`absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-20`}
              style={{
                background: `radial-gradient(circle, ${isDarkMode ? '#10B981' : '#10B981'} 0%, transparent 70%)`,
              }}
            />
            
            <div className="relative z-10">
              <DialogHeader className={`p-6 ${isDarkMode ? 'border-[#1e293b]' : 'border-gray-200'} border-b`}>
                <DialogTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <PhoneForwarded className="h-5 w-5" />
                  Transfer Call
                </DialogTitle>
                <DialogDescription className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
                  Transfer call from {currentCallForTransfer?.fromNumber} to another extension
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 p-6">
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Select Extension</label>
                  <Select
                    value={selectedTransferExtension}
                    onValueChange={setSelectedTransferExtension}
                    disabled={fetchingExtensions || transferringCall !== null}
                  >
                    <SelectTrigger className={`${isDarkMode ? 'bg-[#1e293b] border-[#334155] text-gray-300' : 'bg-white border-gray-300 text-gray-900'}`}>
                      <SelectValue placeholder="Select extension to transfer to" />
                    </SelectTrigger>
                    <SelectContent className={`${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-300'}`}>
                      {fetchingExtensions ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : extensionList.length > 0 ? (
                        extensionList.map((extension) => (
                          <SelectItem 
                            key={extension.number} 
                            value={extension.number}
                            className={`${isDarkMode ? 'text-gray-300 hover:bg-[#0f172a] focus:bg-[#0f172a]' : 'text-gray-900 hover:bg-gray-100 focus:bg-gray-100'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{extension.username} ({extension.number})</span>
                              {getExtensionStatusBadge(extension.status)}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-extensions" disabled>
                          No extensions available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTransferExtension && (
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#1e293b]' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Selected Extension</p>
                        <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedTransferExtension}</p>
                      </div>
                      {getExtensionStatusBadge(
                        extensionList.find(ext => ext.number === selectedTransferExtension)?.status || "Unknown"
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className={`flex flex-col sm:flex-row gap-2 p-6 ${isDarkMode ? 'border-[#1e293b]' : 'border-gray-200'} border-t`}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTransferDialogOpen(false)
                    setSelectedTransferExtension("")
                    setCurrentCallForTransfer(null)
                  }}
                  className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-[#1e293b]' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransferCall}
                  disabled={!selectedTransferExtension || transferringCall !== null}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {transferringCall ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Transferring...
                    </>
                  ) : (
                    <>
                      <PhoneForwarded className="h-4 w-4 mr-2" />
                      Transfer Call
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  )
}