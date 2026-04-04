// components/fiber/splitter-form.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Save, Plus, Minus } from "lucide-react"
import { splitterApi } from "@/lib/olt-splitter.api"
import { toast } from "react-hot-toast"
import type { Splitter, CreateSplitterDTO, OLT } from "@/types"

interface SplitterFormProps {
  splitter?: Splitter | null
  onSubmit: (data: CreateSplitterDTO) => Promise<void>
  onCancel: () => void
}

export function SplitterForm({ splitter, onSubmit, onCancel }: SplitterFormProps) {
  const [loading, setLoading] = useState(false)
  const [availableOlts, setAvailableOlts] = useState<OLT[]>([])
  const [outputPorts, setOutputPorts] = useState<string[]>([''])
  const [formData, setFormData] = useState<CreateSplitterDTO>({
    name: "",
    type: "1x4",
    location: "",
    inputPort: "",
    outputPorts: [],
    connectedOltId: "",
    notes: "",
  })

  useEffect(() => {
    fetchAvailableOlts()
  }, [])

  useEffect(() => {
    if (splitter) {
      setFormData({
        name: splitter.name,
        type: splitter.type,
        location: splitter.location,
        inputPort: splitter.inputPort,
        outputPorts: splitter.outputPorts,
        connectedOltId: splitter.connectedOltId,
        notes: splitter.notes || "",
      })
      setOutputPorts(splitter.outputPorts.length > 0 ? splitter.outputPorts : [''])
    }
  }, [splitter])

  const fetchAvailableOlts = async () => {
    try {
      const data = await splitterApi.getAvailableOlts()
      setAvailableOlts(data)
    } catch (error) {
      console.error("Failed to fetch OLTs:", error)
      toast.error("Failed to load available OLTs")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const data = {
      ...formData,
      outputPorts: outputPorts.filter(port => port.trim() !== '')
    }

    if (data.outputPorts.length === 0) {
      toast.error("At least one output port is required")
      return
    }

    setLoading(true)
    await onSubmit(data)
    setLoading(false)
  }

  const handleChange = (field: keyof CreateSplitterDTO, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addOutputPort = () => {
    setOutputPorts([...outputPorts, ''])
  }

  const removeOutputPort = (index: number) => {
    const newPorts = [...outputPorts]
    newPorts.splice(index, 1)
    setOutputPorts(newPorts)
  }

  const updateOutputPort = (index: number, value: string) => {
    const newPorts = [...outputPorts]
    newPorts[index] = value
    setOutputPorts(newPorts)
  }

  const splitterTypes = [
    { value: '1x4', label: '1:4 Splitter (4 outputs)' },
    { value: '1x8', label: '1:8 Splitter (8 outputs)' },
    { value: '1x16', label: '1:16 Splitter (16 outputs)' },
    { value: '1x32', label: '1:32 Splitter (32 outputs)' },
    { value: '1x64', label: '1:64 Splitter (64 outputs)' },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{splitter ? "Edit Splitter" : "Add New Splitter"}</CardTitle>
            <CardDescription>
              {splitter ? "Update splitter configuration" : "Configure a new optical splitter"}
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
                Splitter Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Building A Splitter"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                Splitter Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => handleChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {splitterTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
                placeholder="e.g., Building A, Floor 2, Room 205"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="connectedOltId">
                Connected OLT <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.connectedOltId}
                onValueChange={(value) => handleChange("connectedOltId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select OLT" />
                </SelectTrigger>
                <SelectContent>
                  {availableOlts.map((olt) => (
                    <SelectItem key={olt.id} value={olt.id}>
                      {olt.name} ({olt.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inputPort">
                Input Port <span className="text-red-500">*</span>
              </Label>
              <Input
                id="inputPort"
                placeholder="e.g., PON-1/0/1"
                value={formData.inputPort}
                onChange={(e) => handleChange("inputPort", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>
                  Output Ports <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOutputPort}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Port
                </Button>
              </div>
              
              <div className="space-y-2">
                {outputPorts.map((port, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Output port ${index + 1}`}
                      value={port}
                      onChange={(e) => updateOutputPort(index, e.target.value)}
                      required
                    />
                    {outputPorts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOutputPort(index)}
                        className="h-10 w-10"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional information about this splitter..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
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
              {loading ? "Saving..." : splitter ? "Update Splitter" : "Create Splitter"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}