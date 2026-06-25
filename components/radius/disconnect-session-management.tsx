"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  WifiOff, 
  Users, 
  Search, 
  Filter, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Network, 
  GitBranch, 
  MapPin, 
  ScanLine, 
  Clock, 
  XCircle, 
  X, 
  FileSpreadsheet, 
  Upload, 
  Plus, 
  Phone, 
  Download,
  Info
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { useConfirmToast } from "@/hooks/use-confirm-toast"

type BranchItem = {
  id: number
  name: string
  code?: string
  parentId?: number | null
  parent?: { id: number; name: string } | null
}

type RadiusPool = {
  name: string
  value: string
  description?: string
  isActive?: boolean
}

type PackagePlanItem = {
  id: number
  planName?: string
  planCode?: string
  framedPoolValue?: string
}

const cleanAndValidatePhone = (phone: any): string | null => {
  if (!phone) return null
  let cleaned = String(phone).replace(/\D/g, "").trim()
  if (cleaned.length === 13 && cleaned.startsWith("977")) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.length === 10 && cleaned.startsWith("9")) {
    return cleaned
  }
  return null
}

export function DisconnectSessionManagement() {
  const [filters, setFilters] = useState({
    oltId: "all",
    oltPort: "",
    splitterId: "all",
    area: "",
    status: "all"
  })

  const [selectedHeadOffices, setSelectedHeadOffices] = useState<number[]>([])
  const [selectedBranches, setSelectedBranches] = useState<number[]>([])
  const [selectedSubBranches, setSelectedSubBranches] = useState<number[]>([])
  const [allBranchData, setAllBranchData] = useState<BranchItem[]>([])
  
  const [olts, setOlts] = useState<any[]>([])
  const [splitters, setSplitters] = useState<any[]>([])
  const [pools, setPools] = useState<RadiusPool[]>([])
  const [plans, setPlans] = useState<PackagePlanItem[]>([])
  
  const [loading, setLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [rawRecipients, setRawRecipients] = useState<any[]>([])
  
  const [selectedRecipients, setSelectedRecipients] = useState<any[]>([])
  const [targetingScope, setTargetingScope] = useState<"all" | "select">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  
  const [duplicateCount, setDuplicateCount] = useState(0)
  
  // Advanced Filter states
  const [selectedAddresses, setSelectedAddresses] = useState<string[]>([])
  const [selectedStreets, setSelectedStreets] = useState<string[]>([])
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])
  const [selectedGenders, setSelectedGenders] = useState<string[]>([])
  const [selectedPackages, setSelectedPackages] = useState<string[]>([])
  const [selectedMemberships, setSelectedMemberships] = useState<string[]>([])
  const [selectedPools, setSelectedPools] = useState<string[]>([])
  
  const [fullAddressKeywords, setFullAddressKeywords] = useState<string[]>([])
  const [debouncedFullAddressKeywords, setDebouncedFullAddressKeywords] = useState<string[]>([])
  const [fullAddressInput, setFullAddressInput] = useState("")
  
  // CSV Filter states
  const [useCsvFilter, setUseCsvFilter] = useState(false)
  const [csvRows, setCsvRows] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [selectedCsvColumns, setSelectedCsvColumns] = useState<string[]>([])
  const [csvFileName, setCsvFileName] = useState("")
  const [csvMatchType, setCsvMatchType] = useState<"and" | "or">("or")

  // Disconnection Results state
  const [disconnectLogs, setDisconnectLogs] = useState<any[]>([])
  const { confirm, ConfirmDialog } = useConfirmToast()

  // Debounce the fullAddressKeywords array
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFullAddressKeywords(fullAddressKeywords)
    }, 500)
    return () => clearTimeout(handler)
  }, [fullAddressKeywords])

  // Trigger loading state immediately when any filter changes
  useEffect(() => {
    setLoading(true)
  }, [
    filters,
    selectedHeadOffices,
    selectedBranches,
    selectedSubBranches,
    fullAddressKeywords,
    selectedAddresses,
    selectedStreets,
    selectedDistricts,
    selectedGenders,
    selectedPackages,
    selectedMemberships,
    selectedPools,
    useCsvFilter,
    selectedCsvColumns,
    csvMatchType
  ])

  const addFullAddressKeyword = (keyword: string) => {
    const clean = keyword.trim()
    if (!clean) return
    if (!fullAddressKeywords.includes(clean)) {
      setFullAddressKeywords([...fullAddressKeywords, clean])
    }
    setFullAddressInput("")
  }

  const removeFullAddressKeyword = (keyword: string) => {
    setFullAddressKeywords(fullAddressKeywords.filter(k => k !== keyword))
  }

  const handleFullAddressInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addFullAddressKeyword(fullAddressInput)
    } else if (e.key === "Backspace" && !fullAddressInput && fullAddressKeywords.length > 0) {
      removeFullAddressKeyword(fullAddressKeywords[fullAddressKeywords.length - 1])
    }
  }

  const handleFullAddressInputBlur = () => {
    addFullAddressKeyword(fullAddressInput)
  }

  // Lowercased sets for optimized filtering
  const lowerAddresses = useMemo(() => new Set(selectedAddresses.map(v => v.toLowerCase().trim())), [selectedAddresses])
  const lowerStreets = useMemo(() => new Set(selectedStreets.map(v => v.toLowerCase().trim())), [selectedStreets])
  const lowerDistricts = useMemo(() => new Set(selectedDistricts.map(v => v.toLowerCase().trim())), [selectedDistricts])
  const lowerGenders = useMemo(() => new Set(selectedGenders.map(v => v.toLowerCase().trim())), [selectedGenders])
  const lowerMemberships = useMemo(() => new Set(selectedMemberships.map(v => v.toLowerCase().trim())), [selectedMemberships])

  const mapCsvHeaderToRecipientKey = (header: string): string => {
    const h = header.toLowerCase().trim().replace(/[^a-z0-9]/g, "")
    if (h === "firstname" || h === "first") return "firstName"
    if (h === "middlename" || h === "middle") return "middleName"
    if (h === "lastname" || h === "last") return "lastName"
    if (h === "phonenumber" || h === "phone" || h === "contact" || h === "mobile") return "phone"
    if (h === "secondarycontactnumber" || h === "secondaryphone" || h === "secondarycontact") return "secondaryContactNumber"
    if (h === "email" || h === "emailaddress") return "email"
    if (h === "source") return "source"
    if (h === "status") return "status"
    if (h === "address") return "address"
    if (h === "street") return "street"
    if (h === "district") return "district"
    if (h === "province" || h === "state") return "province"
    if (h === "gender") return "gender"
    if (h === "notes") return "notes"
    if (h === "age") return "age"
    if (h === "fulladdress") return "fullAddress"
    return header
  }

  const isCsvMatch = useCallback((r: any) => {
    if (!useCsvFilter || csvRows.length === 0 || selectedCsvColumns.length === 0) return true
    
    const cleanPhone = (phone: string): string => {
      const digits = phone.replace(/\D/g, "")
      return digits.length >= 10 ? digits.slice(-10) : digits
    }

    return csvRows.some(csvRow => {
      if (csvMatchType === "and") {
        return selectedCsvColumns.every(colName => {
          const recipientKey = mapCsvHeaderToRecipientKey(colName)
          const isPhoneField = recipientKey === "phone" || recipientKey === "secondaryContactNumber"
          
          const rawRecipientValue = String(r[recipientKey] || "")
          const rawCsvValue = String(csvRow[colName] || "")
          
          if (!rawRecipientValue || !rawCsvValue) return false
          
          const recipientValue = isPhoneField ? cleanPhone(rawRecipientValue) : rawRecipientValue.toLowerCase().trim()
          const csvValue = isPhoneField ? cleanPhone(rawCsvValue) : rawCsvValue.toLowerCase().trim()
          
          return recipientValue !== "" && recipientValue === csvValue
        })
      } else {
        return selectedCsvColumns.some(colName => {
          const recipientKey = mapCsvHeaderToRecipientKey(colName)
          const isPhoneField = recipientKey === "phone" || recipientKey === "secondaryContactNumber"
          
          const rawRecipientValue = String(r[recipientKey] || "")
          const rawCsvValue = String(csvRow[colName] || "")
          
          if (!rawRecipientValue || !rawCsvValue) return false
          
          const recipientValue = isPhoneField ? cleanPhone(rawRecipientValue) : rawRecipientValue.toLowerCase().trim()
          const csvValue = isPhoneField ? cleanPhone(rawCsvValue) : rawCsvValue.toLowerCase().trim()
          
          return recipientValue !== "" && recipientValue === csvValue
        })
      }
    })
  }, [useCsvFilter, csvRows, selectedCsvColumns, csvMatchType])

  const parseCSV = (text: string) => {
    const lines: string[][] = []
    let row: string[] = []
    let inQuotes = false
    let currentValue = ""
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const nextChar = text[i + 1]
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue.trim())
        currentValue = ""
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++
        }
        row.push(currentValue.trim())
        if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
          lines.push(row)
        }
        row = []
        currentValue = ""
      } else {
        currentValue += char
      }
    }
    if (currentValue !== "" || row.length > 0) {
      row.push(currentValue.trim())
      lines.push(row)
    }
    return lines
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      try {
        const rows = parseCSV(text)
        if (rows.length === 0) {
          toast.error("The CSV file is empty.")
          return
        }

        const headers = rows[0]
        const dataRows = rows.slice(1).map(row => {
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ""
          })
          return obj
        })

        setCsvHeaders(headers)
        setCsvRows(dataRows)
        setUseCsvFilter(true)
        
        const commonHeaders = headers.filter(h => {
          const mapped = mapCsvHeaderToRecipientKey(h)
          return ["phone", "firstName", "lastName"].includes(mapped)
        })
        setSelectedCsvColumns(commonHeaders.length > 0 ? commonHeaders : [headers[0]])
        toast.success(`Loaded ${dataRows.length} rows from CSV.`)
      } catch (err) {
        console.error(err)
        toast.error("Failed to parse CSV file.")
      }
    }
    reader.readAsText(file)
  }

  // Dynamic filter lists
  const addressOptions = useMemo(() => {
    const values = new Set<string>()
    rawRecipients.forEach(r => {
      if (lowerStreets.size > 0 && (!r.street || !lowerStreets.has(r.street.trim().toLowerCase()))) return
      if (lowerDistricts.size > 0 && (!r.district || !lowerDistricts.has(r.district.trim().toLowerCase()))) return
      if (lowerGenders.size > 0 && (!r.gender || !lowerGenders.has(r.gender.trim().toLowerCase()))) return
      if (selectedPackages.length > 0 && (!r.subscribedPkg?.planId || !selectedPackages.includes(String(r.subscribedPkg.planId)))) return
      if (selectedPools.length > 0) {
        const customerPool = (r.subscribedPkg?.packagePlanDetails?.framedPoolValue || r.customerSubscriptions?.[0]?.packagePrice?.packagePlanDetails?.framedPoolValue || "").toLowerCase().trim()
        if (!customerPool || !selectedPools.map(p => p.toLowerCase().trim()).includes(customerPool)) return
      }
      if (debouncedFullAddressKeywords.length > 0) {
        const hasMatch = debouncedFullAddressKeywords.some(kw => r.fullAddress && r.fullAddress.toLowerCase().includes(kw.toLowerCase().trim()))
        if (!hasMatch) return
      }
      if (!isCsvMatch(r)) return
      if (r.address) values.add(r.address.trim())
    })
    return Array.from(values).sort().map(val => ({ value: val, label: val }))
  }, [rawRecipients, lowerStreets, lowerDistricts, lowerGenders, selectedPackages, selectedPools, debouncedFullAddressKeywords, isCsvMatch])

  const streetOptions = useMemo(() => {
    const values = new Set<string>()
    rawRecipients.forEach(r => {
      if (lowerAddresses.size > 0 && (!r.address || !lowerAddresses.has(r.address.trim().toLowerCase()))) return
      if (lowerDistricts.size > 0 && (!r.district || !lowerDistricts.has(r.district.trim().toLowerCase()))) return
      if (lowerGenders.size > 0 && (!r.gender || !lowerGenders.has(r.gender.trim().toLowerCase()))) return
      if (selectedPackages.length > 0 && (!r.subscribedPkg?.planId || !selectedPackages.includes(String(r.subscribedPkg.planId)))) return
      if (selectedPools.length > 0) {
        const customerPool = (r.subscribedPkg?.packagePlanDetails?.framedPoolValue || r.customerSubscriptions?.[0]?.packagePrice?.packagePlanDetails?.framedPoolValue || "").toLowerCase().trim()
        if (!customerPool || !selectedPools.map(p => p.toLowerCase().trim()).includes(customerPool)) return
      }
      if (debouncedFullAddressKeywords.length > 0) {
        const hasMatch = debouncedFullAddressKeywords.some(kw => r.fullAddress && r.fullAddress.toLowerCase().includes(kw.toLowerCase().trim()))
        if (!hasMatch) return
      }
      if (!isCsvMatch(r)) return
      if (r.street) values.add(r.street.trim())
    })
    return Array.from(values).sort().map(val => ({ value: val, label: val }))
  }, [rawRecipients, lowerAddresses, lowerDistricts, lowerGenders, selectedPackages, selectedPools, debouncedFullAddressKeywords, isCsvMatch])

  const districtOptions = useMemo(() => {
    const values = new Set<string>()
    rawRecipients.forEach(r => {
      if (lowerAddresses.size > 0 && (!r.address || !lowerAddresses.has(r.address.trim().toLowerCase()))) return
      if (lowerStreets.size > 0 && (!r.street || !lowerStreets.has(r.street.trim().toLowerCase()))) return
      if (lowerGenders.size > 0 && (!r.gender || !lowerGenders.has(r.gender.trim().toLowerCase()))) return
      if (selectedPackages.length > 0 && (!r.subscribedPkg?.planId || !selectedPackages.includes(String(r.subscribedPkg.planId)))) return
      if (selectedPools.length > 0) {
        const customerPool = (r.subscribedPkg?.packagePlanDetails?.framedPoolValue || r.customerSubscriptions?.[0]?.packagePrice?.packagePlanDetails?.framedPoolValue || "").toLowerCase().trim()
        if (!customerPool || !selectedPools.map(p => p.toLowerCase().trim()).includes(customerPool)) return
      }
      if (debouncedFullAddressKeywords.length > 0) {
        const hasMatch = debouncedFullAddressKeywords.some(kw => r.fullAddress && r.fullAddress.toLowerCase().includes(kw.toLowerCase().trim()))
        if (!hasMatch) return
      }
      if (!isCsvMatch(r)) return
      if (r.district) values.add(r.district.trim())
    })
    return Array.from(values).sort().map(val => ({ value: val, label: val }))
  }, [rawRecipients, lowerAddresses, lowerStreets, lowerGenders, selectedPackages, selectedPools, debouncedFullAddressKeywords, isCsvMatch])

  const genderOptions = useMemo(() => {
    const values = new Set<string>()
    rawRecipients.forEach(r => {
      if (lowerAddresses.size > 0 && (!r.address || !lowerAddresses.has(r.address.trim().toLowerCase()))) return
      if (lowerStreets.size > 0 && (!r.street || !lowerStreets.has(r.street.trim().toLowerCase()))) return
      if (lowerDistricts.size > 0 && (!r.district || !lowerDistricts.has(r.district.trim().toLowerCase()))) return
      if (selectedPackages.length > 0 && (!r.subscribedPkg?.planId || !selectedPackages.includes(String(r.subscribedPkg.planId)))) return
      if (selectedPools.length > 0) {
        const customerPool = (r.subscribedPkg?.packagePlanDetails?.framedPoolValue || r.customerSubscriptions?.[0]?.packagePrice?.packagePlanDetails?.framedPoolValue || "").toLowerCase().trim()
        if (!customerPool || !selectedPools.map(p => p.toLowerCase().trim()).includes(customerPool)) return
      }
      if (debouncedFullAddressKeywords.length > 0) {
        const hasMatch = debouncedFullAddressKeywords.some(kw => r.fullAddress && r.fullAddress.toLowerCase().includes(kw.toLowerCase().trim()))
        if (!hasMatch) return
      }
      if (!isCsvMatch(r)) return
      if (r.gender) values.add(r.gender.trim())
    })
    return Array.from(values).sort().map(val => ({ value: val, label: val }))
  }, [rawRecipients, lowerAddresses, lowerStreets, lowerDistricts, selectedPackages, selectedPools, debouncedFullAddressKeywords, isCsvMatch])

  const membershipOptions = useMemo(() => {
    const values = new Set<string>()
    rawRecipients.forEach(r => {
      if (lowerAddresses.size > 0 && (!r.address || !lowerAddresses.has(r.address.trim().toLowerCase()))) return
      if (lowerStreets.size > 0 && (!r.street || !lowerStreets.has(r.street.trim().toLowerCase()))) return
      if (lowerDistricts.size > 0 && (!r.district || !lowerDistricts.has(r.district.trim().toLowerCase()))) return
      if (lowerGenders.size > 0 && (!r.gender || !lowerGenders.has(r.gender.trim().toLowerCase()))) return
      if (selectedPackages.length > 0 && (!r.subscribedPkg?.planId || !selectedPackages.includes(String(r.subscribedPkg.planId)))) return
      if (selectedPools.length > 0) {
        const customerPool = (r.subscribedPkg?.packagePlanDetails?.framedPoolValue || r.customerSubscriptions?.[0]?.packagePrice?.packagePlanDetails?.framedPoolValue || "").toLowerCase().trim()
        if (!customerPool || !selectedPools.map(p => p.toLowerCase().trim()).includes(customerPool)) return
      }
      if (debouncedFullAddressKeywords.length > 0) {
        const hasMatch = debouncedFullAddressKeywords.some(kw => r.fullAddress && r.fullAddress.toLowerCase().includes(kw.toLowerCase().trim()))
        if (!hasMatch) return
      }
      if (!isCsvMatch(r)) return
      if (r.membershipName) values.add(r.membershipName.trim())
    })
    return Array.from(values).sort().map(val => ({ value: val, label: val }))
  }, [rawRecipients, lowerAddresses, lowerStreets, lowerDistricts, lowerGenders, selectedPackages, selectedPools, debouncedFullAddressKeywords, isCsvMatch])

  const packageOptions = useMemo(() => {
    return plans.map(p => ({
      value: String(p.id),
      label: p.planName || `Plan ${p.id}`,
      description: p.planCode || ""
    }))
  }, [plans])

  const poolOptions = useMemo(() => {
    const values = new Set<string>()
    pools.forEach(p => values.add(p.value.trim()))
    
    // Also parse from current recipients dynamically
    rawRecipients.forEach(r => {
      const pool = r.subscribedPkg?.packagePlanDetails?.framedPoolValue || r.customerSubscriptions?.[0]?.packagePrice?.packagePlanDetails?.framedPoolValue || ""
      if (pool) values.add(pool.trim())
    })
    
    return Array.from(values).sort().map(val => {
      const dbPool = pools.find(p => p.value === val)
      return {
        value: val,
        label: dbPool ? `${dbPool.name || val} (${val})` : val,
        description: dbPool?.description || "Dynamic pool from customer plan"
      }
    })
  }, [pools, rawRecipients])

  // Filtered Recipients
  const filteredRecipients = useMemo(() => {
    return rawRecipients.filter(r => {
      if (lowerAddresses.size > 0 && (!r.address || !lowerAddresses.has(r.address.trim().toLowerCase()))) return false
      if (lowerStreets.size > 0 && (!r.street || !lowerStreets.has(r.street.trim().toLowerCase()))) return false
      if (lowerDistricts.size > 0 && (!r.district || !lowerDistricts.has(r.district.trim().toLowerCase()))) return false
      if (lowerGenders.size > 0 && (!r.gender || !lowerGenders.has(r.gender.trim().toLowerCase()))) return false
      if (lowerMemberships.size > 0 && (!r.membershipName || !lowerMemberships.has(r.membershipName.trim().toLowerCase()))) return false
      
      // Plan Filter
      if (selectedPackages.length > 0) {
        const customerPlanId = String(r.subscribedPkg?.planId || r.customerSubscriptions?.[0]?.packagePrice?.planId || "")
        if (!customerPlanId || !selectedPackages.includes(customerPlanId)) return false
      }

      // Pool Filter
      if (selectedPools.length > 0) {
        const customerPool = (r.subscribedPkg?.packagePlanDetails?.framedPoolValue || r.customerSubscriptions?.[0]?.packagePrice?.packagePlanDetails?.framedPoolValue || "").toLowerCase().trim()
        if (!customerPool || !selectedPools.map(p => p.toLowerCase().trim()).includes(customerPool)) return false
      }

      // Keywords Filter
      if (debouncedFullAddressKeywords.length > 0) {
        const hasMatch = debouncedFullAddressKeywords.some(kw => r.fullAddress && r.fullAddress.toLowerCase().includes(kw.toLowerCase().trim()))
        if (!hasMatch) return false
      }

      if (!isCsvMatch(r)) return false
      return true
    })
  }, [rawRecipients, lowerAddresses, lowerStreets, lowerDistricts, lowerGenders, lowerMemberships, selectedPackages, selectedPools, debouncedFullAddressKeywords, isCsvMatch])

  // Map Filtered customers to connection user accounts
  const connectionUserList = useMemo(() => {
    const list: any[] = []
    filteredRecipients.forEach(customer => {
      const connUsers = customer.connectionUsers || []
      connUsers.forEach((cu: any) => {
        list.push({
          id: cu.id,
          username: cu.username,
          customerId: customer.recipientId,
          customerUniqueId: customer.customerUniqueId,
          customerName: customer.name,
          phone: customer.phone,
          packageName: customer.packageName,
          pool: customer.subscribedPkg?.packagePlanDetails?.framedPoolValue || customer.customerSubscriptions?.[0]?.packagePrice?.packagePlanDetails?.framedPoolValue || "N/A",
          status: customer.status
        })
      })
    })
    return list
  }, [filteredRecipients])

  // Hierarchy derivation: Head Office (parentId null) -> Branches -> Sub-Branches
  const headOffices = useMemo(() => allBranchData.filter(b => b.parentId === null || !b.parent?.id), [allBranchData])
  const headOfficeIds = useMemo(() => headOffices.map(b => b.id), [headOffices])
  const branches = useMemo(
    () => allBranchData.filter(b => b.parentId !== null && headOfficeIds.includes(b.parentId || 0)),
    [allBranchData, headOfficeIds]
  )
  const branchIds = useMemo(() => branches.map(b => b.id), [branches])

  const branchChildrenByParent = useMemo(() => {
    const map = new Map<number, BranchItem[]>()
    allBranchData.forEach(branch => {
      if (branch.parentId === null || branch.parentId === undefined) return
      const parentId = Number(branch.parentId)
      map.set(parentId, [...(map.get(parentId) || []), branch])
    })
    return map
  }, [allBranchData])

  const getDescendantBranchIds = useCallback((parentIds: number[]) => {
    const descendants = new Set<number>()
    const stack = [...parentIds]

    while (stack.length > 0) {
      const parentId = stack.pop()
      if (parentId === undefined) continue

      for (const child of branchChildrenByParent.get(Number(parentId)) || []) {
        const childId = Number(child.id)
        if (!descendants.has(childId)) {
          descendants.add(childId)
          stack.push(childId)
        }
      }
    }

    return Array.from(descendants)
  }, [branchChildrenByParent])

  const getBranchPath = useCallback((branch: BranchItem) => {
    const byId = new Map<number, BranchItem>(allBranchData.map(item => [Number(item.id), item]))
    const names = [branch.name]
    let parent = branch.parentId ? byId.get(Number(branch.parentId)) : null

    while (parent) {
      names.unshift(parent.name)
      parent = parent.parentId ? byId.get(Number(parent.parentId)) : null
    }

    return names.join(" / ")
  }, [allBranchData])

  const branchOptions = useMemo(() => {
    if (selectedHeadOffices.length === 0) return branches
    return branches.filter(branch => selectedHeadOffices.includes(Number(branch.parentId)))
  }, [branches, selectedHeadOffices])

  const subBranchOptions = useMemo(() => {
    const directBranchIds = branchOptions.map(branch => Number(branch.id))
    const seedIds = selectedBranches.length > 0 ? selectedBranches : directBranchIds.length > 0 ? directBranchIds : branchIds
    const descendantIds = new Set(getDescendantBranchIds(seedIds))
    return allBranchData.filter(branch => descendantIds.has(Number(branch.id)))
  }, [allBranchData, branchIds, branchOptions, getDescendantBranchIds, selectedBranches])

  const getSelectedBranchScope = useCallback(() => {
    const selectedIds = new Set<number>([
      ...selectedHeadOffices,
      ...selectedBranches,
      ...selectedSubBranches,
    ])

    getDescendantBranchIds(Array.from(selectedIds)).forEach(id => selectedIds.add(id))
    return selectedIds
  }, [getDescendantBranchIds, selectedBranches, selectedHeadOffices, selectedSubBranches])

  // Initial data loading
  useEffect(() => {
    async function loadData() {
      try {
        const [branchData, poolData, planData] = await Promise.all([
          apiRequest<BranchItem[] | { data?: BranchItem[] }>("/branch").catch(() => []),
          apiRequest<{ success: boolean; data: RadiusPool[] }>("/settings/radius-pools").catch(() => ({ success: false, data: [] })),
          apiRequest<PackagePlanItem[] | { data?: PackagePlanItem[] }>("/pkgplan").catch(() => []),
          apiRequest<any>("/olt").catch(() => []),
          apiRequest<any>("/splitters").catch(() => [])
        ])

        setAllBranchData(Array.isArray(branchData) ? branchData : (branchData as any)?.data || [])
        setPools(Array.isArray(poolData?.data) ? poolData.data.filter(pool => pool.isActive !== false) : [])
        setPlans(Array.isArray(planData) ? planData : (planData as any)?.data || [])
      } catch (e) {
        console.error("Failed to load filter metadata dependencies", e)
      }
    }
    loadData()

    // Fetch OLTs & Splitters separately to fill state
    apiRequest<any>("/olt").then(res => setOlts(Array.isArray(res) ? res : res?.data || [])).catch(() => {})
    apiRequest<any>("/splitters").then(res => setSplitters(Array.isArray(res) ? res : res?.data || res?.splitters || [])).catch(() => {})
  }, [])

  // Fetch recipients count when filters, or debounced keywords change
  const fetchRecipients = useCallback(async () => {
    setLoading(true)
    setSelectedRecipients([])
    try {
      const endpoint = "/customer"
      const params = new URLSearchParams({ limit: "all" })
      if (filters.status !== "all") params.append("status", filters.status)
      if (filters.oltId !== "all") params.append("oltId", filters.oltId)
      if (filters.oltPort) params.append("oltPort", filters.oltPort)
      if (filters.splitterId !== "all") params.append("splitterId", filters.splitterId)
      if (debouncedFullAddressKeywords.length > 0) {
        params.append("area", debouncedFullAddressKeywords.join(","))
      }

      const res = await apiRequest<any>(`${endpoint}?${params.toString()}`)
      const raw = Array.isArray(res) ? res : (res?.data || [])

      // Filter locally so Head Office selection includes every nested branch below it.
      let filteredRaw = raw
      const scopedBranchIds = getSelectedBranchScope()

      if (scopedBranchIds.size > 0) {
        filteredRaw = filteredRaw.filter((item: any) => {
          const itemBranchId = Number(item.branchId || item.branch?.id || 0)
          const itemSubBranchId = Number(item.subBranchId || item.subBranch?.id || 0)
          return scopedBranchIds.has(itemBranchId) || scopedBranchIds.has(itemSubBranchId)
        })
      }

      // Map data structure
      const data = filteredRaw.map((c: any) => ({
        recipientId: c.id,
        name: c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : "",
        phone: cleanAndValidatePhone(c.phoneNumber) || cleanAndValidatePhone(c.secondaryContactNumber) || "",
        firstName: c.firstName || "",
        middleName: c.middleName || "",
        lastName: c.lastName || "",
        email: c.email || "",
        secondaryContactNumber: c.secondaryContactNumber || "",
        source: c.source || "",
        status: c.status || "",
        address: c.address || "",
        street: c.street || "",
        district: c.district || "",
        province: c.province || c.state || "",
        gender: c.gender || "",
        notes: c.notes || "",
        fullAddress: c.fullAddress || c.address || "",
        packageName: c.subscribedPkg?.packageName || c.packagePrice?.packageName || "",
        membershipName: c.membership?.name || "",
        connectionUsers: c.connectionUsers || [],
        subscribedPkg: c.subscribedPkg,
        customerSubscriptions: c.customerSubscriptions
      }))

      // Filter for customers that actually have connection users (RADIUS accounts)
      const validRecipients = data.filter((r: any) => r.connectionUsers && r.connectionUsers.length > 0)
      
      // Deduplicate by phone / recipient ID to be safe
      const seenIds = new Set<number>()
      const uniqueRecipients: any[] = []
      let dupes = 0
      validRecipients.forEach((r: any) => {
        if (seenIds.has(r.recipientId)) {
          dupes++
          return
        }
        seenIds.add(r.recipientId)
        uniqueRecipients.push(r)
      })

      setDuplicateCount(dupes)
      setRawRecipients(uniqueRecipients)
    } catch (err) {
      console.error("Failed to fetch recipients", err)
      toast.error("Failed to load connection users data.")
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.oltId, filters.oltPort, filters.splitterId, getSelectedBranchScope, debouncedFullAddressKeywords])

  // Debounced trigger for reloading recipient list when dependencies change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRecipients()
    }, 500)
    return () => clearTimeout(handler)
  }, [fetchRecipients])

  // Debounced search for connection users manually
  useEffect(() => {
    if (!searchQuery.trim() || targetingScope !== "select") {
      setSearchResults([])
      return
    }

    const delayDebounceFn = setTimeout(() => {
      setSearching(true)
      try {
        const query = searchQuery.toLowerCase().trim()
        const allConnUsers: any[] = []
        rawRecipients.forEach(customer => {
          const connUsers = customer.connectionUsers || []
          connUsers.forEach((cu: any) => {
            allConnUsers.push({
              id: cu.id,
              username: cu.username,
              customerId: customer.recipientId,
              customerUniqueId: customer.customerUniqueId,
              customerName: customer.name,
              phone: customer.phone,
              packageName: customer.packageName,
              pool: customer.subscribedPkg?.packagePlanDetails?.framedPoolValue || customer.customerSubscriptions?.[0]?.packagePrice?.packagePlanDetails?.framedPoolValue || "N/A",
              status: customer.status
            })
          })
        })

        const matched = allConnUsers.filter(item => {
          return (
            item.username.toLowerCase().includes(query) ||
            item.customerName.toLowerCase().includes(query) ||
            (item.customerUniqueId && item.customerUniqueId.toLowerCase().includes(query))
          )
        })

        setSearchResults(matched.slice(0, 20))
      } catch (err) {
        console.error("Failed to search connection users", err)
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, targetingScope, rawRecipients])

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({ oltId: "all", oltPort: "", splitterId: "all", area: "", status: "all" })
    setSelectedHeadOffices([])
    setSelectedBranches([])
    setSelectedSubBranches([])
    setSelectedAddresses([])
    setSelectedStreets([])
    setSelectedDistricts([])
    setSelectedGenders([])
    setSelectedPackages([])
    setSelectedMemberships([])
    setSelectedPools([])
    setFullAddressKeywords([])
    setFullAddressInput("")
    setUseCsvFilter(false)
    setCsvFileName("")
    setCsvRows([])
    setCsvHeaders([])
    setSelectedCsvColumns([])
  }

  const handleDisconnect = async () => {
    const listToDisconnect = targetingScope === "all" ? connectionUserList : selectedRecipients
    if (listToDisconnect.length === 0) {
      toast.error("No active users selected to disconnect.")
      return
    }

    const ok = await confirm({
      title: "Disconnect Sessions",
      message: `Are you sure you want to disconnect active RADIUS sessions for ${listToDisconnect.length} users?`,
      type: "danger",
      confirmText: "Disconnect",
      cancelText: "Cancel",
    })
    if (!ok) return

    setDisconnecting(true)
    try {
      const endpoint = "/customer/disconnect/filter/customers"
      const response = await apiRequest<any>(endpoint, {
        method: "POST",
        body: JSON.stringify({
          usernames: listToDisconnect.map(u => u.username)
        })
      })

      // Parse disconnection logs
      const logs: any[] = []
      if (response?.disconnected) {
        response.disconnected.forEach((item: any) => {
          const matchingUser = listToDisconnect.find(u => u.username === item.username)
          logs.push({
            id: `${item.username}-${Date.now()}`,
            username: item.username,
            customerName: matchingUser?.customerName || "Unknown Customer",
            status: "success",
            message: "RADIUS session disconnect command sent successfully."
          })
        })
      }
      if (response?.failed) {
        response.failed.forEach((item: any) => {
          const matchingUser = listToDisconnect.find(u => u.username === item.username)
          logs.push({
            id: `${item.username}-${Date.now()}`,
            username: item.username,
            customerName: matchingUser?.customerName || "Unknown Customer",
            status: "failed",
            message: item.error || "Disconnect command failed."
          })
        })
      }

      setDisconnectLogs(logs)

      const successCount = response?.disconnected?.length || 0
      const failCount = response?.failed?.length || 0
      
      if (failCount > 0) {
        toast.error(`Disconnected ${successCount} sessions. ${failCount} failed. Check details in logs.`)
      } else {
        toast.success(`Successfully sent disconnect commands to all ${successCount} users.`)
      }
      
      if (targetingScope === "select") {
        setSelectedRecipients([])
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to disconnect sessions.")
    } finally {
      setDisconnecting(false)
    }
  }

  const activeFilterCount = [
    selectedHeadOffices.length > 0,
    selectedBranches.length > 0,
    selectedSubBranches.length > 0,
    filters.oltId !== "all",
    filters.oltPort !== "",
    filters.splitterId !== "all",
    selectedAddresses.length > 0 ||
      selectedStreets.length > 0 ||
      selectedDistricts.length > 0 ||
      selectedGenders.length > 0 ||
      selectedPackages.length > 0 ||
      selectedMemberships.length > 0 ||
      selectedPools.length > 0 ||
      fullAddressKeywords.length > 0 ||
      (useCsvFilter && csvRows.length > 0),
    filters.status !== "all"
  ].filter(Boolean).length

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <ConfirmDialog />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Disconnect RADIUS Sessions</h1>
          <p className="text-muted-foreground">Terminate active sessions of users matching OLT, pool, branch, status or package plan filters.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Panel (1/3 Width) */}
        <Card className="bg-card border-border shadow-sm relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-xs text-muted-foreground mt-2 font-medium">Updating filters...</span>
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2 text-base">
                <Filter className="h-5 w-5 text-blue-500" />
                Target Users
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{activeFilterCount} active</Badge>
                )}
              </CardTitle>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground" onClick={resetFilters}>
                  Clear all
                </Button>
              )}
            </div>
            <CardDescription>Filter who you want to disconnect</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Head Office Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="h-3 w-3" /> Head Office
              </Label>
              <SearchableSelect
                options={headOffices.map((office: any) => ({
                  value: String(office.id),
                  label: office.name,
                  description: office.code || "Root office"
                }))}
                value={selectedHeadOffices.map(String)}
                onValueChange={(val) => {
                  const newHeadOfficeIds = (val as string[]).map(Number)
                  const allowedBranchIds = new Set(
                    branches
                      .filter((branch: any) => newHeadOfficeIds.length === 0 || newHeadOfficeIds.includes(Number(branch.parentId)))
                      .map((branch: any) => Number(branch.id))
                  )

                  setSelectedHeadOffices(newHeadOfficeIds)
                  setSelectedBranches((prev) => prev.filter((id) => allowedBranchIds.has(id)))
                  setSelectedSubBranches((prev) => {
                    const allowedDescendants = new Set(getDescendantBranchIds(Array.from(allowedBranchIds)))
                    return prev.filter((id) => allowedDescendants.has(id))
                  })
                }}
                placeholder="Select head office"
                multiple
                clearable
              />
            </div>

            {/* Branch Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="h-3 w-3" /> Branches
              </Label>
              <SearchableSelect
                options={branchOptions.map((b: any) => ({
                  value: String(b.id),
                  label: b.name,
                  description: getBranchPath(b)
                }))}
                value={selectedBranches.map(String)}
                onValueChange={(val) => {
                  const newBranchIds = (val as string[]).map(Number)
                  setSelectedBranches(newBranchIds)
                  const allowedSubBranchIds = new Set(getDescendantBranchIds(newBranchIds.length > 0 ? newBranchIds : branchOptions.map((branch: any) => Number(branch.id))))
                  setSelectedSubBranches((prev) =>
                    prev.filter((id) => allowedSubBranchIds.has(id))
                  )
                }}
                placeholder="Select branches"
                multiple
                clearable
                disabled={branchOptions.length === 0}
              />
            </div>

            {/* Sub-Branch Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="h-3 w-3 rotate-90" /> Sub-Branches
              </Label>
              <SearchableSelect
                options={subBranchOptions.map((sb: any) => ({
                  value: String(sb.id),
                  label: sb.name,
                  description: getBranchPath(sb)
                }))}
                value={selectedSubBranches.map(String)}
                onValueChange={(val) => setSelectedSubBranches((val as string[]).map(Number))}
                placeholder="Select sub-branches"
                multiple
                clearable
                disabled={subBranchOptions.length === 0}
              />
            </div>

            <Separator />

            {/* OLT Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <Network className="h-3 w-3" /> OLT
              </Label>
              <Select value={filters.oltId} onValueChange={(val) => updateFilter("oltId", val)}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="All OLTs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All OLTs</SelectItem>
                  {olts.map((o: any) => (
                    <SelectItem key={o.id} value={o.id.toString()}>{o.name || o.host || `OLT-${o.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* OLT Port */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <Network className="h-3 w-3" /> OLT Port
              </Label>
              <Input
                value={filters.oltPort}
                onChange={(event) => updateFilter("oltPort", event.target.value)}
                placeholder="e.g. 0/1/1"
                className="bg-background border-input text-foreground"
              />
            </div>

            {/* Splitter Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <ScanLine className="h-3 w-3" /> Splitter
              </Label>
              <Select value={filters.splitterId} onValueChange={(val) => updateFilter("splitterId", val)}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="All Splitters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Splitters</SelectItem>
                  {splitters.map((s: any) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.splitterId || s.name || `SPL-${s.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Address Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-blue-500" /> Target Address
              </Label>
              <SearchableSelect
                options={addressOptions}
                value={selectedAddresses}
                onValueChange={(val) => setSelectedAddresses(val as string[])}
                placeholder="Search addresses..."
                multiple
                clearable
                disabled={loading || rawRecipients.length === 0}
              />
            </div>

            {/* Street Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-emerald-500" /> Target Street
              </Label>
              <SearchableSelect
                options={streetOptions}
                value={selectedStreets}
                onValueChange={(val) => setSelectedStreets(val as string[])}
                placeholder="Search streets..."
                multiple
                clearable
                disabled={loading || rawRecipients.length === 0}
              />
            </div>

            {/* District Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-purple-500" /> Target District
              </Label>
              <SearchableSelect
                options={districtOptions}
                value={selectedDistricts}
                onValueChange={(val) => setSelectedDistricts(val as string[])}
                placeholder="Search districts..."
                multiple
                clearable
                disabled={loading || rawRecipients.length === 0}
              />
            </div>

            {/* Full Address Keywords tag filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-red-500" /> Target Full Address (Keywords)
              </Label>
              <div className="flex flex-wrap gap-1.5 p-1.5 border border-input rounded-md bg-background focus-within:ring-1 focus-within:ring-ring focus-within:border-input min-h-[38px] items-center">
                {fullAddressKeywords.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 pr-1 pl-2 py-0.5 text-xs bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeFullAddressKeyword(tag)}
                      className="rounded-full hover:bg-indigo-500/25 p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  value={fullAddressInput}
                  onChange={(e) => setFullAddressInput(e.target.value)}
                  onKeyDown={handleFullAddressInputKeyDown}
                  onBlur={handleFullAddressInputBlur}
                  placeholder={fullAddressKeywords.length === 0 ? "Type keyword and press Enter..." : "Add..."}
                  className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm h-6 min-w-[120px] text-foreground placeholder:text-muted-foreground"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Gender Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-pink-500" /> Target Gender
              </Label>
              <SearchableSelect
                options={genderOptions}
                value={selectedGenders}
                onValueChange={(val) => setSelectedGenders(val as string[])}
                placeholder="Search genders..."
                multiple
                clearable
                disabled={loading || rawRecipients.length === 0}
              />
            </div>

            {/* Package (Plan) Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-indigo-500" /> Target Plan (Package)
              </Label>
              <SearchableSelect
                options={packageOptions}
                value={selectedPackages}
                onValueChange={(val) => setSelectedPackages(val as string[])}
                placeholder="Search plan..."
                multiple
                clearable
                disabled={loading || packageOptions.length === 0}
              />
            </div>

            {/* Pool Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <Network className="h-3 w-3 text-emerald-500" /> Target RADIUS Pool
              </Label>
              <SearchableSelect
                options={poolOptions}
                value={selectedPools}
                onValueChange={(val) => setSelectedPools(val as string[])}
                placeholder="Search pool..."
                multiple
                clearable
                disabled={loading || poolOptions.length === 0}
              />
            </div>

            {/* Membership Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-amber-500" /> Target Membership
              </Label>
              <SearchableSelect
                options={membershipOptions}
                value={selectedMemberships}
                onValueChange={(val) => setSelectedMemberships(val as string[])}
                placeholder="Search memberships..."
                multiple
                clearable
                disabled={loading || rawRecipients.length === 0}
              />
            </div>

            {/* CSV Filter Section */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-green-500" /> Filter by CSV
                </Label>
                {csvRows.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-medium">Enable</span>
                    <Checkbox
                      checked={useCsvFilter}
                      onCheckedChange={(checked) => setUseCsvFilter(!!checked)}
                      id="enable-csv-filter"
                    />
                  </div>
                )}
              </div>

              {!csvFileName ? (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8 border-dashed flex items-center gap-2 hover:bg-green-500/5 hover:border-green-500/30 hover:text-green-600 transition-colors"
                    onClick={() => document.getElementById("csv-filter-upload")?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload filter CSV
                  </Button>
                  <input
                    id="csv-filter-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvUpload}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Upload a CSV file to match connection users against specific columns.
                  </p>
                </div>
              ) : (
                <div className="bg-accent/40 rounded-lg p-2.5 border border-border space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileSpreadsheet className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-xs font-medium truncate text-foreground/90">
                        {csvFileName}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-full"
                      onClick={() => {
                        setCsvFileName("")
                        setCsvRows([])
                        setCsvHeaders([])
                        setSelectedCsvColumns([])
                        setUseCsvFilter(false)
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="text-[10px] text-muted-foreground flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span>Rows in CSV: {csvRows.length}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/30">
                    <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">
                      Match Type:
                    </span>
                    <Select
                      value={csvMatchType}
                      onValueChange={(val: "and" | "or") => setCsvMatchType(val)}
                    >
                      <SelectTrigger className="h-6 text-[10px] px-2 w-[90px] bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="and">AND (All)</SelectItem>
                        <SelectItem value="or">OR (Any)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 border-t border-border/30 pt-1">
                    <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider block">
                      Match columns:
                    </span>
                    <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
                      {csvHeaders.map((header) => (
                        <label
                          key={header}
                          className="flex items-center gap-1.5 text-xs text-foreground/80 cursor-pointer hover:text-foreground transition-colors truncate"
                          title={header}
                        >
                          <Checkbox
                            checked={selectedCsvColumns.includes(header)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCsvColumns((prev) => [...prev, header])
                              } else {
                                setSelectedCsvColumns((prev) => prev.filter((h) => h !== header))
                              }
                            }}
                          />
                          <span className="truncate">{header}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Status</Label>
              <Select value={filters.status} onValueChange={(val) => updateFilter("status", val)}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Targeting Scope */}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                Targeting Scope
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={targetingScope === "all" ? "default" : "outline"}
                  className="text-xs h-8 px-3"
                  onClick={() => {
                    setTargetingScope("all")
                    setSelectedRecipients([])
                  }}
                >
                  All Matching
                </Button>
                <Button
                  type="button"
                  variant={targetingScope === "select" ? "default" : "outline"}
                  className="text-xs h-8 px-3"
                  onClick={() => {
                    setTargetingScope("select")
                    setSearchQuery("")
                    setSearchResults([])
                  }}
                >
                  Specific Select
                </Button>
              </div>
            </div>

            {targetingScope === "all" ? (
              /* All Matching Summary */
              <div className="p-4 rounded-lg bg-blue-600/5 border border-blue-600/20 mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground font-medium">Matching Accounts</span>
                  <Badge variant="outline" className="bg-blue-600/10 text-blue-600 border-blue-600/20 font-bold">
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      `${connectionUserList.length} Accounts`
                    )}
                  </Badge>
                </div>
                {duplicateCount > 0 && (
                  <p className="text-[10px] text-amber-600 font-medium mt-1">
                    {duplicateCount} duplicate customer records filtered
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground italic">
                  Targets all connection accounts matching current criteria.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 h-7 text-xs gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={fetchRecipients}
                  disabled={loading}
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh Count
                </Button>
              </div>
            ) : (
              /* Specific Selector */
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                    Search & Add RADIUS Users
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search username or customer name..."
                      className="pl-8 h-8 text-xs bg-background border-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searching && (
                      <Loader2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="border border-border rounded-md max-h-[180px] overflow-y-auto divide-y divide-border/50 bg-popover text-popover-foreground shadow-md">
                    {searchResults.map((rec) => {
                      const isAlreadySelected = selectedRecipients.some(r => r.username === rec.username)
                      return (
                        <button
                          key={rec.username}
                          type="button"
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                          onClick={() => {
                            if (!isAlreadySelected) {
                              setSelectedRecipients(prev => [...prev, rec])
                            }
                            setSearchQuery("")
                            setSearchResults([])
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">{rec.username} ({rec.customerName})</span>
                            <span className="text-[10px] text-muted-foreground">{rec.packageName} • {rec.pool}</span>
                          </div>
                          {isAlreadySelected ? (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Added</Badge>
                          ) : (
                            <span className="text-[10px] text-primary font-medium">+ Add</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                      Selected Users
                    </Label>
                    <Badge variant="outline" className="text-[10px] bg-slate-500/10">
                      {selectedRecipients.length} selected
                    </Badge>
                  </div>

                  <div className="border border-border rounded-md max-h-[180px] overflow-y-auto divide-y divide-border/50 bg-background/50">
                    {selectedRecipients.length === 0 ? (
                      <div className="p-4 text-xs text-center text-muted-foreground italic">
                        Use search bar above to select connection users.
                      </div>
                    ) : (
                      selectedRecipients.map((rec) => (
                        <div key={rec.username} className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/40 transition-colors">
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-medium text-foreground">{rec.username}</span>
                            <span className="text-[10px] text-muted-foreground">{rec.customerName}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setSelectedRecipients(prev => prev.filter(r => r.username !== rec.username))}
                          >
                            <span className="text-xs font-bold">×</span>
                          </Button>
                        </div>
                      ))
                    )}
                  </div>

                  {selectedRecipients.length > 0 && (
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-6 px-2 text-muted-foreground hover:bg-muted"
                        onClick={() => setSelectedRecipients([])}
                      >
                        Clear List
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Main Action and Connection Users List (2/3 Width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <WifiOff className="h-5 w-5 text-red-500" />
                Active Sessions Disconnect Actions
              </CardTitle>
              <CardDescription>
                Trigger RADIUS session disconnections for selected users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-4 flex gap-3 text-yellow-600">
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Important Notes:</p>
                  <p>Terminating active sessions forces connection user accounts to disconnect from the NAS. If the user router is online, it will immediately re-authenticate and establish a new session (useful for applying bandwidth changes or profile updates).</p>
                </div>
              </div>

              {/* Matching list summary */}
              <div className="border rounded-md max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[150px]">RADIUS Account</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Plan (Package)</TableHead>
                      <TableHead>Pool</TableHead>
                      <TableHead className="w-[80px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                          <span className="text-xs mt-1 block">Loading connection users...</span>
                        </TableCell>
                      </TableRow>
                    ) : connectionUserList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                          No matching connection users found. Change the filter criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      connectionUserList.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-xs font-semibold text-foreground">{user.username}</TableCell>
                          <TableCell className="text-xs">{user.customerName}</TableCell>
                          <TableCell className="text-xs">{user.packageName}</TableCell>
                          <TableCell className="text-xs font-mono">{user.pool}</TableCell>
                          <TableCell>
                            <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                              {user.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 text-red-600 bg-red-500/5 px-3 py-1.5 rounded-full border border-red-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Users to Disconnect: {targetingScope === "all" ? connectionUserList.length : selectedRecipients.length}
                  </span>
                </div>
                
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white font-bold h-11 px-6 shadow-lg shadow-red-600/20 transition-all active:scale-[0.98]"
                  onClick={handleDisconnect}
                  disabled={disconnecting || loading || (targetingScope === "all" ? connectionUserList.length === 0 : selectedRecipients.length === 0)}
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disconnecting Sessions...
                    </>
                  ) : (
                    <>
                      <WifiOff className="mr-2 h-4 w-4" />
                      Disconnect Sessions ({(targetingScope === "all" ? connectionUserList.length : selectedRecipients.length)} users)
                    </>
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Disconnection Result Logs (Similar to Campaign logs) */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2 text-base">
                    <Clock className="h-5 w-5 text-indigo-500" />
                    RADIUS Disconnect Outcome Logs
                  </CardTitle>
                  <CardDescription>Results of the latest session disconnect triggers.</CardDescription>
                </div>
                {disconnectLogs.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setDisconnectLogs([])}>
                    Clear Logs
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Username</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead>Server Response</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disconnectLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-20 text-center text-muted-foreground italic text-xs">
                          No session disconnect commands run in this session yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      disconnectLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs font-semibold">{log.username}</TableCell>
                          <TableCell className="text-xs">{log.customerName}</TableCell>
                          <TableCell>
                            <Badge variant={log.status === "success" ? "default" : "destructive"} className="gap-1 text-[10px] px-1.5 py-0">
                              {log.status === "success" ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{log.message}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
