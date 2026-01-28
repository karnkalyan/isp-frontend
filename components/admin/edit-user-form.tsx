"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { toast } from "react-hot-toast" // Re-added toast import
import { Upload } from "lucide-react"
// import bcrypt from "bcryptjs" // REMOVED: Hashing should happen on backend
import type { User } from "@/components/admin/user-management"
import { useRouter } from "next/navigation"
import { apiRequest } from "@/lib/api" // Adjusted import path for apiRequest

interface Option {
  label: string
  value: string
}

interface EditUserFormProps {
  user: User
  roles: Option[]
  departments: Option[]
  onComplete: () => void
  onCancel: () => () => void; // Fixed type: onCancel should be a function that returns nothing, not another function
  buildAvatarUrl: (avatarPath?: string | null) => string
}

export function EditUserForm({ user, roles, departments, onComplete, onCancel, buildAvatarUrl }: EditUserFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    password: "", // This will be sent as plain text if provided, then hashed on backend
    role: String(user.role), // Keep as 'role' for frontend state
    status: user.status,
    department: user.department ? String(user.department) : "",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(
    user.avatar ? buildAvatarUrl(user.avatar) : null
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(user.avatar ? buildAvatarUrl(user.avatar) : null)
    }
  }, [user.avatar, buildAvatarUrl, logoFile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }))
  }

  const handleSelectChange = (name: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as string]) setErrors(prev => ({ ...prev, [name as string]: "" }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setLogoFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = ev => ev.target?.result && setLogoPreview(ev.target.result as string)
      reader.readAsDataURL(file)
    } else {
      setLogoPreview(user.avatar ? buildAvatarUrl(user.avatar) : null)
    }
  }

  const validateForm = () => {
    const newErr: Record<string, string> = {}
    if (!formData.name.trim()) newErr.name = "Name is required"
    if (!formData.email.trim()) newErr.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErr.email = "Email is invalid"
    // Password validation still applies, even if not hashed on frontend
    if (formData.password && formData.password.length < 6) newErr.password = "Minimum 6 characters"
    if (!formData.role) newErr.role = "Role is required"
    setErrors(newErr)
    return Object.keys(newErr).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
  
    const data = new FormData()
    data.append("name", formData.name || "")
    data.append("email", formData.email || "")
    if (formData.password) data.append("password", formData.password)
    data.append("roleId", formData.role)
    data.append("status", formData.status || "")
    data.append("departmentId", formData.department || "")
    if (logoFile) data.append("profilePicture", logoFile)
  
    try {
      await apiRequest(`/users/${user.id}`, {
        method: 'PUT',
        body: data,
      })
      toast.success(`${formData.name} has been updated successfully.`)
      onComplete()
    } catch (err: any) {
      // console.error("Update failed:", err)
      toast.error(`${err.message || "Something went wrong"}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} />
          {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
          {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Leave blank to keep current"
          />
          {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleSelectChange("role", value)}
          >
            <SelectTrigger>
              <SelectValue>
                {roles.find(r => r.value === formData.role)?.label || "Select role"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && <p className="text-destructive text-sm">{errors.role}</p>}
        </div>

        {/* Department */}
        <div className="space-y-2">
          <Label>Department</Label>
          <Select
            value={formData.department}
            onValueChange={(value) => handleSelectChange("department", value)}
          >
            <SelectTrigger>
              <SelectValue>
                {departments.find(d => d.value === formData.department)?.label || "Select department"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleSelectChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Profile Picture */}
      <div className="space-y-1">
        <Label htmlFor="logo">Profile Picture</Label>
        <div className="flex items-center gap-4">
          <div className="border border-border rounded-md p-2 flex-1">
            <div className="relative border-2 border-dashed border-border rounded-md p-4 flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Drag & drop or <span className="text-primary">browse</span></p>
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
              <img src={logoPreview} alt="Preview" className="h-full w-full object-contain" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Recommended size: 512×512px. Max file size: 2MB</p>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update User</Button>
      </div>
    </form>
  )
}