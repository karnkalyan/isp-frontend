"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-hot-toast"
import { Upload } from "lucide-react"
import { apiRequest } from "@/lib/api"

interface Option {
  label: string
  value: string // Value will be the string representation of the ID
}

interface AddUserFormProps {
  onSubmit: () => void
  onCancel: () => void
  roles: Array<Option>
  departments: Array<Option> // departments now provides value as stringified IDs
  branches: Array<Option>
}

export function AddUserForm({ onSubmit, onCancel, roles, departments, branches }: AddUserFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "", // CHANGED: Renamed from 'role' to 'roleId' to match backend
    status: "pending" as "active" | "inactive" | "pending",
    departmentId: "", // CHANGED: Renamed from 'department' to 'departmentId'
    branchId: "",
    yeastarExt: "",
  })
  const [branchIds, setBranchIds] = useState<string[]>([])

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setProfilePictureFile(file)

    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfilePicturePreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    } else {
      setProfilePicturePreview(null)
    }
  }

  // CHANGED: The keyof typeof formData now correctly includes 'roleId' and 'departmentId'
  const handleSelectChange = (name: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "branchId") {
      setBranchIds((prev) => prev.filter((id) => id !== value))
    }
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const toggleAdditionalBranch = (branchId: string, checked: boolean) => {
    setBranchIds((prev) => {
      if (checked) return Array.from(new Set([...prev, branchId]))
      return prev.filter((id) => id !== branchId)
    })
  }

  // Frontend validation (still good to have for immediate feedback)
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }
    if (!formData.password) newErrors.password = "Password is required"
    else if (formData.password.length < 8) newErrors.password = "Minimum 8 characters"

    if (!formData.roleId) newErrors.roleId = "Role is required" // CHANGED: Validate roleId
    if (formData.yeastarExt.trim() && !/^\d{1,7}$/.test(formData.yeastarExt.trim())) {
      newErrors.yeastarExt = "VoIP extension must be 1 to 7 digits"
    }
    // DepartmentId is optional based on schema, so no validation needed here unless it's strictly required by your business logic
    // if (!formData.departmentId) newErrors.departmentId = "Department is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setIsSubmitting(true);
  
    try {
      const data = new FormData();
      data.append("name", formData.name || "");
      data.append("email", formData.email || "");
      data.append("password", formData.password);
      data.append("roleId", formData.roleId);
      data.append("status", formData.status || "pending");
      if (formData.departmentId) {
        data.append("departmentId", formData.departmentId);
      }
      if (formData.branchId) {
        data.append("branchId", formData.branchId);
      }
      if (formData.yeastarExt.trim()) {
        data.append("yeastarExt", formData.yeastarExt.trim());
      }
      data.append("branchIds", JSON.stringify(branchIds.filter((id) => id !== formData.branchId)));
      if (profilePictureFile) {
        data.append("profilePicture", profilePictureFile);
      }
  
      await apiRequest(`/users`, {
        method: 'POST',
        body: data,
      });
  
      onSubmit();
      setFormData({
        name: "",
        email: "",
        password: "",
        roleId: "",
        status: "pending",
        departmentId: "",
        branchId: "",
        yeastarExt: "",
      });
      setBranchIds([]);
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
      setErrors({});
      toast.success("User added successfully!");
  
    } catch (err: any) {
      console.error("Add user failed:", err);
  
      let errorMessage = "An unexpected error occurred during user creation.";
      let backendErrors: Record<string, string> = {};
  
      if (err.message) {
        try {
          const parsedErr = JSON.parse(err.message);
          if (parsedErr.errors && Array.isArray(parsedErr.errors) && parsedErr.errors.length > 0) {
            parsedErr.errors.forEach((e: any) => {
              if (e.path && e.msg) {
                backendErrors[e.path] = e.msg;
              }
            });
            setErrors(backendErrors);
            errorMessage = parsedErr.errors[0].msg || parsedErr.message || errorMessage;
          } else if (parsedErr.message) {
            errorMessage = parsedErr.message;
          } else if (parsedErr.error) {
            errorMessage = parsedErr.error;
          } else {
            errorMessage = err.message;
          }
        } catch (jsonParseError) {
          errorMessage = err.message;
        }
      }
  
      toast.error(errorMessage);
      if (Object.keys(backendErrors).length > 0) {
        setErrors(backendErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="add-name">Full Name</Label>
          <Input
            id="add-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-email">Email Address</Label>
          <Input
            id="add-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john.doe@example.com"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-password">Password</Label>
          <Input
            id="add-password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-role">Role</Label>
          <Select value={formData.roleId} onValueChange={(val) => handleSelectChange("roleId", val)}> {/* CHANGED: Control roleId */}
            <SelectTrigger id="add-role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.roleId && <p className="text-sm text-destructive">{errors.roleId}</p>} {/* CHANGED: Display roleId error */}
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-department">Department</Label>
          <Select value={formData.departmentId} onValueChange={(val) => handleSelectChange("departmentId", val)}> {/* CHANGED: Control departmentId */}
            <SelectTrigger id="add-department">
              <SelectValue placeholder="Select a department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.departmentId && <p className="text-sm text-destructive">{errors.departmentId}</p>} {/* CHANGED: Display departmentId error */}
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-status">Status</Label>
          <Select value={formData.status} onValueChange={(val) => handleSelectChange("status", val as "active" | "inactive" | "pending")}>
            <SelectTrigger id="add-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-primary-branch">Primary Branch</Label>
          <Select value={formData.branchId} onValueChange={(val) => handleSelectChange("branchId", val)}>
            <SelectTrigger id="add-primary-branch">
              <SelectValue placeholder="Select primary branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.value} value={branch.value}>
                  {branch.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-yeastar-ext">VoIP Extension</Label>
          <Input
            id="add-yeastar-ext"
            name="yeastarExt"
            value={formData.yeastarExt}
            onChange={handleChange}
            inputMode="numeric"
            placeholder="888"
          />
          {errors.yeastarExt && <p className="text-sm text-destructive">{errors.yeastarExt}</p>}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Additional Branch Access</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-md border p-4">
          {branches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No branches available</p>
          ) : (
            branches.map((branch) => (
              <label key={branch.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={branchIds.includes(branch.value)}
                  disabled={branch.value === formData.branchId}
                  onCheckedChange={(checked) => toggleAdditionalBranch(branch.value, checked === true)}
                />
                <span>{branch.label}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="add-profile-picture" className="text-sm font-medium">Profile Picture</Label>
        <div className="flex items-center gap-4">
          <div className="border border-border rounded-md p-2 flex-1">
            <div className="relative border-2 border-dashed border-border rounded-md p-4 flex flex-col items-center justify-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop or <span className="text-primary">browse</span>
              </p>
              <input
                id="add-profile-picture"
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleProfilePictureChange}
              />
            </div>
          </div>
          {profilePicturePreview && (
            <div className="h-20 w-20 rounded-md overflow-hidden border border-border">
              <img
                src={profilePicturePreview}
                alt="Profile preview"
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Recommended size: 512x512px. Max file size: 2MB
        </p>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding User..." : "Create User"}
        </Button>
      </div>
    </form>
  )
}
