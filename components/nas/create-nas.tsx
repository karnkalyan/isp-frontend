"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContainer } from "@/components/ui/card-container"
import { Switch } from "@/components/ui/switch"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { useConfirmToast } from "@/hooks/use-confirm-toast"

export function CreateNasForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const { confirm, ConfirmDialog } = useConfirmToast()
  
  const [formData, setFormData] = useState({
    nasname: "",
    shortname: "",
    type: "other",
    ports: 1812,
    secret: "",
    server: "radius",
    community: "public",
    description: "",
    isActive: true,
    isDefault: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple validation
    if (!formData.nasname || !formData.shortname || !formData.secret) {
      toast.error("Please fill in all required fields (NAS Name, Shortnname, Secret)")
      return
    }

    const confirmed = await confirm({
      title: "Create NAS",
      message: `Are you sure you want to create NAS "${formData.shortname}" (${formData.nasname})?`,
      type: "info",
      confirmText: "Create",
      cancelText: "Cancel",
    })

    if (!confirmed) return

    setLoading(true)

    try {
      await apiRequest('/nas', { method: 'POST', body: JSON.stringify(formData) })
      
      toast.success("NAS Configuration created successfully")
      router.push("/nas")
    } catch (error: any) {
      toast.error(error.message || "Failed to create NAS")
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <>
    <ConfirmDialog />
    <form onSubmit={handleSubmit} className="space-y-6">
      <CardContainer title="Radius Settings" description="Basic NAS settings for Radius server">
        <div className="grid gap-6 md:grid-cols-2">
          {/* First column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nasname">NAS Name (IP Address) *</Label>
              <Input 
                id="nasname"
                placeholder="e.g. 192.168.1.1" 
                value={formData.nasname}
                onChange={(e) => setFormData({...formData, nasname: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secret">Radius Secret *</Label>
              <div className="relative">
                <Input 
                  id="secret"
                  type={showSecret ? "text" : "password"}
                  placeholder="Shared secret" 
                  value={formData.secret}
                  onChange={(e) => setFormData({...formData, secret: e.target.value})}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">NAS Type</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="mikrotik">Mikrotik</option>
                <option value="cisco">Cisco</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description"
                placeholder="Optional description" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          {/* Second column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shortname">Shortname *</Label>
              <Input 
                id="shortname"
                placeholder="Identifier name" 
                value={formData.shortname}
                onChange={(e) => setFormData({...formData, shortname: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ports">CoA Port (Disconnect feature)</Label>
              <Input 
                id="ports"
                type="number"
                placeholder="1812" 
                value={formData.ports}
                onChange={(e) => setFormData({...formData, ports: Number(e.target.value)})}
              />
              <p className="text-xs text-muted-foreground">Default is 1812, CoA uses 3799</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="server">Virtual Server</Label>
              <Input 
                id="server"
                placeholder="radius" 
                value={formData.server}
                onChange={(e) => setFormData({...formData, server: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="community">Community string</Label>
              <Input 
                id="community"
                placeholder="public" 
                value={formData.community}
                onChange={(e) => setFormData({...formData, community: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-wrap gap-8">
            <div className="flex items-center space-x-2">
              <Switch 
                id="isActive" 
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label htmlFor="isActive" className="font-semibold cursor-pointer">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="isDefault" 
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({...formData, isDefault: checked})}
              />
              <Label htmlFor="isDefault" className="font-semibold cursor-pointer">Set as Default Radius</Label>
            </div>
        </div>
      </CardContainer>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" type="button" onClick={handleBack} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save NAS Configuration
            </>
          )}
        </Button>
      </div>
    </form>
    </>
  )
}
