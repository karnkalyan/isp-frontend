// components/fiber/olt-form.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Save } from "lucide-react"
import type { OLT, CreateOLTDTO } from "@/types"

interface OLTFormProps {
  olt?: OLT | null
  onSubmit: (data: CreateOLTDTO) => Promise<void>
  onCancel: () => void
}

export function OLTForm({ olt, onSubmit, onCancel }: OLTFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateOLTDTO>({
    name: "",
    model: "",
    location: "",
    ipAddress: "",
    totalPorts: 16,
    description: "",
  })

  useEffect(() => {
    if (olt) {
      setFormData({
        name: olt.name,
        model: olt.model,
        location: olt.location,
        ipAddress: olt.ipAddress,
        totalPorts: olt.totalPorts,
        description: "",
      })
    }
  }, [olt])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(formData)
    setLoading(false)
  }

  const handleChange = (field: keyof CreateOLTDTO, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const oltModels = [
    "Huawei MA5800-X7",
    "ZTE C320",
    "Nokia 7360 ISAM FX",
    "Calix E7-2",
    "Huawei MA5800-X17",
    "ZTE C650",
    "Fiberhome AN5516",
    "MikroTik CCR1036",
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{olt ? "Edit OLT" : "Add New OLT"}</CardTitle>
            <CardDescription>
              {olt ? "Update OLT details" : "Configure a new Optical Line Terminal"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                OLT Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Central Office OLT"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">
                Model <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.model}
                onValueChange={(value) => handleChange("model", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {oltModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location"
                placeholder="e.g., Central Office, Building A"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipAddress">
                IP Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ipAddress"
                placeholder="e.g., 192.168.1.10"
                value={formData.ipAddress}
                onChange={(e) => handleChange("ipAddress", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPorts">
                Total Ports <span className="text-red-500">*</span>
              </Label>
              <Input
                id="totalPorts"
                type="number"
                min="1"
                max="128"
                placeholder="e.g., 16"
                value={formData.totalPorts}
                onChange={(e) => handleChange("totalPorts", parseInt(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about this OLT..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : olt ? "Update OLT" : "Create OLT"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}