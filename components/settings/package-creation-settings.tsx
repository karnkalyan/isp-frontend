"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Pencil, Trash2, Save, X, RefreshCw, Layers, CheckSquare, Square, Percent, Info } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pagination } from "@/components/ui/table"
import { apiRequest } from "@/lib/api"

// Duration Options as requested
const DURATION_OPTIONS: Option[] = [
  { value: "1 Month", label: "1 Month" },
  { value: "3 Months", label: "3 Months" },
  { value: "6 Months", label: "6 Months" },
  { value: "12 Months", label: "12 Months" },
]

export type AddonCharge = {
  id: number
  name: string
  code: string
  amount: number
  isTaxable: boolean
  forPackageCreation: boolean
  description: string | null
}

export type PackagePrice = {
  id: number
  planId: number
  packageDuration: string | null
  price: number
  packageName: string
  referenceId: string
  isActive: boolean
  isTrial: boolean
  packagePlanDetails: {
    planName: string
    downSpeed: number
    upSpeed: number
  }
  oneTimeCharges: AddonCharge[]
}

export function PackageCreationSettings() {
  const [packages, setPackages] = useState<PackagePrice[]>([])
  const [planOptions, setPlanOptions] = useState<Option[]>([])
  const [addonCharges, setAddonCharges] = useState<AddonCharge[]>([])
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Form State
  const [packageName, setPackageName] = useState("")
  const [planId, setPlanId] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Side-by-side 4 column states
  const [durationPrices, setDurationPrices] = useState<Record<string, number>>({
    "1 Month": 0,
    "3 Months": 0,
    "6 Months": 0,
    "12 Months": 0
  })

  const [initialTotalWithTax, setInitialTotalWithTax] = useState<Record<string, number>>({
    "1 Month": 0,
    "3 Months": 0,
    "6 Months": 0,
    "12 Months": 0
  })

  const [renewAmountWithTax, setRenewAmountWithTax] = useState<Record<string, number>>({
    "1 Month": 0,
    "3 Months": 0,
    "6 Months": 0,
    "12 Months": 0
  })

  const [customAddonPrices, setCustomAddonPrices] = useState<Record<string, Record<number, number>>>({
    "1 Month": {},
    "3 Months": {},
    "6 Months": {},
    "12 Months": {}
  })

  const [durationAddons, setDurationAddons] = useState<Record<string, number[]>>({
    "1 Month": [],
    "3 Months": [],
    "6 Months": [],
    "12 Months": []
  })

  // Load packages
  const fetchPackages = async () => {
    try {
      const data = await apiRequest<PackagePrice[]>("/package-price")
      setPackages(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load packages:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load plan options and addon charges
  useEffect(() => {
    fetchPackages()

    apiRequest<{ id: number; planName: string }[]>("/pkgplan")
      .then((raw) => {
        setPlanOptions(
          Array.isArray(raw)
            ? raw.map((p) => ({ value: String(p.id), label: p.planName }))
            : []
        )
      })
      .catch((err) => console.error("Load plans failed:", err))

    apiRequest<AddonCharge[]>("/extra-charges")
      .then((raw) => {
        setAddonCharges(Array.isArray(raw) ? raw : [])
      })
      .catch((err) => console.error("Load addon charges failed:", err))
  }, [])

  const toggleDurationAddon = (dur: string, addonId: number) => {
    setDurationAddons(prev => {
      const current = prev[dur] || []
      const updated = current.includes(addonId)
        ? current.filter(id => id !== addonId)
        : [...current, addonId]
      return { ...prev, [dur]: updated }
    })
  }

  const getDurationTotal = (dur: string) => {
    const price = durationPrices[dur] || 0
    const selected = durationAddons[dur] || []
    const activeAddons = addonCharges.filter(charge => selected.includes(charge.id))
    const addonsSum = activeAddons.reduce((sum, item) => {
      const customVal = customAddonPrices[dur]?.[item.id]
      const val = customVal !== undefined ? customVal : (item.amount || 0)
      return sum + val
    }, 0)
    
    // Tax calculation (13% default)
    const taxableBase = price + activeAddons.filter(a => a.isTaxable).reduce((sum, item) => {
      const customVal = customAddonPrices[dur]?.[item.id]
      const val = customVal !== undefined ? customVal : (item.amount || 0)
      return sum + val
    }, 0)
    const taxAmount = (taxableBase * 13) / 100
    const grandTotal = price + addonsSum + taxAmount

    return Math.round(grandTotal * 100) / 100
  }

  const resetForm = () => {
    setPackageName("")
    setPlanId("")
    setDurationPrices({
      "1 Month": 0,
      "3 Months": 0,
      "6 Months": 0,
      "12 Months": 0
    })
    setInitialTotalWithTax({
      "1 Month": 0,
      "3 Months": 0,
      "6 Months": 0,
      "12 Months": 0
    })
    setRenewAmountWithTax({
      "1 Month": 0,
      "3 Months": 0,
      "6 Months": 0,
      "12 Months": 0
    })
    setCustomAddonPrices({
      "1 Month": {},
      "3 Months": {},
      "6 Months": {},
      "12 Months": {}
    })
    setDurationAddons({
      "1 Month": [],
      "3 Months": [],
      "6 Months": [],
      "12 Months": []
    })
    setDescription("")
    setIsActive(true)
    setEditingId(null)
  }

  const handleEditClick = (pkg: PackagePrice) => {
    setEditingId(pkg.id)
    setPackageName(pkg.packagePlanDetails?.planName || "")
    setPlanId(String(pkg.planId))

    // Find all sibling prices with the same planId
    const siblingPrices = packages.filter(p => p.planId === pkg.planId)
    
    const pricesMap: Record<string, number> = {
      "1 Month": 0,
      "3 Months": 0,
      "6 Months": 0,
      "12 Months": 0
    }
    const initialTaxMap: Record<string, number> = {
      "1 Month": 0,
      "3 Months": 0,
      "6 Months": 0,
      "12 Months": 0
    }
    const renewTaxMap: Record<string, number> = {
      "1 Month": 0,
      "3 Months": 0,
      "6 Months": 0,
      "12 Months": 0
    }
    const customAddonsMap: Record<string, Record<number, number>> = {
      "1 Month": {},
      "3 Months": {},
      "6 Months": {},
      "12 Months": {}
    }
    const addonsMap: Record<string, number[]> = {
      "1 Month": [],
      "3 Months": [],
      "6 Months": [],
      "12 Months": []
    }

    siblingPrices.forEach(sp => {
      const dur = sp.packageDuration || "1 Month"
      let standardDur = dur
      if (dur === "1 Month" || dur === "3 Months" || dur === "6 Months" || dur === "12 Months") {
        standardDur = dur
      } else if (dur === "3 Month") {
        standardDur = "3 Months"
      } else if (dur === "6 Month") {
        standardDur = "6 Months"
      } else if (dur === "12 Month") {
        standardDur = "12 Months"
      }

      pricesMap[standardDur] = sp.price
      initialTaxMap[standardDur] = (sp as any).initialTotalWithTax || 0
      renewTaxMap[standardDur] = (sp as any).renewAmountWithTax || 0
      addonsMap[standardDur] = (sp.oneTimeCharges || []).map(c => c.id)
      
      if (sp.oneTimeCharges) {
        sp.oneTimeCharges.forEach(c => {
          customAddonsMap[standardDur][c.id] = c.amount || 0
        })
      }
    })

    setDurationPrices(pricesMap)
    setInitialTotalWithTax(initialTaxMap)
    setRenewAmountWithTax(renewTaxMap)
    setDurationAddons(addonsMap)
    setCustomAddonPrices(customAddonsMap)
    setIsAdding(false)
  }

  const handleSubmit = async () => {
    if (!packageName || !planId) {
      toast.error("Package Name and Speed Plan are required.")
      return
    }

    // Build prices payload
    const pricesPayload: any[] = []
    Object.entries(durationPrices).forEach(([dur, price]) => {
      if (price > 0) {
        const selectedAddonIds = durationAddons[dur] || []
        const mappedOneTimeCharges = selectedAddonIds.map(addonId => {
          const customVal = customAddonPrices[dur]?.[addonId]
          const charge = addonCharges.find(c => c.id === addonId)
          return {
            id: addonId,
            amount: customVal !== undefined ? customVal : (charge?.amount || 0)
          }
        })

        pricesPayload.push({
          duration: dur,
          price: price,
          initialTotalWithTax: initialTotalWithTax[dur] || null,
          renewAmountWithTax: renewAmountWithTax[dur] || null,
          oneTimeCharges: mappedOneTimeCharges
        })
      }
    })

    if (pricesPayload.length === 0) {
      toast.error("Please enter a base price for at least one duration.")
      return
    }

    const payload = {
      planId: Number(planId),
      prices: pricesPayload
    }

    try {
      await apiRequest("/package-price/bulk", {
        method: "POST",
        body: JSON.stringify(payload)
      })
      toast.success("Package saved successfully")
      resetForm()
      setIsAdding(false)
      fetchPackages()
    } catch (err: any) {
      console.error("Save package failed:", err)
      toast.error(err.message || "Failed to save package")
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this package price?")) return
    try {
      await apiRequest(`/package-price/${id}`, { method: "DELETE" })
      toast.success("Package deleted successfully")
      fetchPackages()
    } catch (err) {
      console.error("Delete package failed:", err)
    }
  }

  const startIdx = (currentPage - 1) * itemsPerPage
  const paginatedPackages = packages.slice(startIdx, startIdx + itemsPerPage)

  return (
    <div className="space-y-6">
      {(isAdding || editingId !== null) && (
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {isAdding ? "Create Pricing Packages" : `Edit Pricing for Plan: ${packageName}`}
            </h3>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Package Reference Name</label>
              <Input
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="e.g. Premium Fiber Pack"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Internet Speed Plan</label>
              <SearchableSelect
                options={planOptions}
                value={planId}
                onValueChange={(v) => setPlanId(v as string)}
                placeholder="Select Speed Plan"
              />
            </div>
          </div>

          {/* 4 Columns for Durations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {["1 Month", "3 Months", "6 Months", "12 Months"].map((dur) => {
              const packageCreationAddons = addonCharges.filter(c => c.forPackageCreation)
              return (
                <div key={dur} className="bg-slate-50 dark:bg-slate-900 border rounded-xl p-4 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="text-center font-bold text-sm text-slate-700 dark:text-slate-300 border-b pb-2 mb-3 uppercase tracking-wider">
                      {dur}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Base Price (Rs.)</label>
                      <Input
                        type="number"
                        min={0}
                        value={durationPrices[dur] || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          setDurationPrices(prev => ({ ...prev, [dur]: val }))
                        }}
                        placeholder="e.g. 1000"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Initial Total with Tax (Rs.)</label>
                      <Input
                        type="number"
                        min={0}
                        value={initialTotalWithTax[dur] || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          setInitialTotalWithTax(prev => ({ ...prev, [dur]: val }))
                        }}
                        placeholder="e.g. 1130"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Renew Amount with Tax (Rs.)</label>
                      <Input
                        type="number"
                        min={0}
                        value={renewAmountWithTax[dur] || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          setRenewAmountWithTax(prev => ({ ...prev, [dur]: val }))
                        }}
                        placeholder="e.g. 1130"
                      />
                    </div>

                    <div className="mt-4 space-y-2">
                      <label className="text-xs font-medium block text-slate-500">Enable Add-ons</label>
                      <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-1.5 bg-white dark:bg-black/20">
                        {packageCreationAddons.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground p-1">No package-creation addons configured</p>
                        ) : (
                          packageCreationAddons.map(charge => {
                            const isSelected = (durationAddons[dur] || []).includes(charge.id)
                            const customPrice = customAddonPrices[dur]?.[charge.id] !== undefined ? customAddonPrices[dur][charge.id] : "";
                            return (
                              <div
                                key={charge.id}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[10px] transition space-y-1 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                              >
                                <div 
                                  onClick={() => toggleDurationAddon(dur, charge.id)}
                                  className="flex items-center gap-1.5 cursor-pointer"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="h-3.5 w-3.5 text-primary" />
                                  ) : (
                                    <Square className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <span className="font-medium truncate max-w-[120px]">{charge.name}</span>
                                </div>
                                {isSelected && (
                                  <div className="pl-5 pt-0.5">
                                    <Input
                                      type="number"
                                      placeholder="Custom Amount"
                                      className="h-7 text-[10px] px-2 py-1 w-full"
                                      value={customPrice}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0
                                        setCustomAddonPrices(prev => ({
                                          ...prev,
                                          [dur]: {
                                            ...(prev[dur] || {}),
                                            [charge.id]: val
                                          }
                                        }))
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-950 border rounded-lg p-2.5 text-xs space-y-1 mt-4 shadow-sm">
                    <div className="flex justify-between font-semibold border-b pb-1 mb-1">
                      <span>Summary</span>
                      <span className="text-primary font-bold">{dur}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>Rs. {durationPrices[dur] || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Addons:</span>
                      <span>Rs. {addonCharges.filter(c => (durationAddons[dur] || []).includes(c.id)).reduce((s, a) => {
                        const customVal = customAddonPrices[dur]?.[a.id]
                        return s + (customVal !== undefined ? customVal : (a.amount || 0))
                      }, 0)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t font-bold text-slate-800 dark:text-slate-200">
                      <span>Est. Total (Tax 13%):</span>
                      <span>Rs. {getDurationTotal(dur)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={resetForm}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium"
            >
              <Save className="mr-2 h-4 w-4" /> Save Package Prices
            </Button>
          </div>
        </div>
      )}

      {!isAdding && editingId === null && (
        <div className="flex justify-between items-center">
          <Button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary/95 text-white">
            <Plus className="mr-2 h-4 w-4" /> Config Package Prices
          </Button>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Addons</TableHead>
                <TableHead>Total Est.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <span className="text-sm text-muted-foreground animate-pulse">Loading Packages...</span>
                  </TableCell>
                </TableRow>
              ) : packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No packages created yet.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPackages.map((pkg) => {
                  const addonSum = (pkg.oneTimeCharges || []).reduce((s, a) => s + a.amount, 0)
                  const withTax = Math.round((pkg.price + addonSum) * 1.13 * 100) / 100
                  return (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                        {pkg.packageName || `${pkg.packagePlanDetails?.planName} - ${pkg.packageDuration}`}
                      </TableCell>
                      <TableCell>{pkg.packageDuration || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold">Rs. {pkg.price}</span>
                          {(pkg as any).initialTotalWithTax !== null && (pkg as any).initialTotalWithTax !== undefined && (
                            <span className="text-[10px] text-muted-foreground">Initial W/ Tax: Rs. {(pkg as any).initialTotalWithTax}</span>
                          )}
                          {(pkg as any).renewAmountWithTax !== null && (pkg as any).renewAmountWithTax !== undefined && (
                            <span className="text-[10px] text-muted-foreground">Renew W/ Tax: Rs. {(pkg as any).renewAmountWithTax}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {pkg.oneTimeCharges && pkg.oneTimeCharges.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {pkg.oneTimeCharges.map(addon => (
                              <span key={addon.id} className="inline-block text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                {addon.name} (Rs. {addon.amount})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                        Rs. {withTax}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${pkg.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                          {pkg.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(pkg)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(pkg.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={packages.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
