"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Plus, 
  Edit, 
  Trash, 
  Users, 
  Shield,
  MoreVertical,
  UserCog,
  Loader2
} from "lucide-react"
import { motion } from "framer-motion"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Role = {
  id: number
  name: string
  description: string
  totalUsers: number
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

interface RolesListProps {
  selectedRoleId: number | null
  onRoleSelect: (roleId: number | null) => void
}

export function RolesList({ selectedRoleId, onRoleSelect }: RolesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(true)
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  
  // Form states
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleDescription, setNewRoleDescription] = useState("")
  const [editRoleName, setEditRoleName] = useState("")
  const [editRoleDescription, setEditRoleDescription] = useState("")

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await apiRequest("/roles")
      // Handle both response formats
      const data = response.data || response
      setRoles(data)
    } catch (err: any) {
      console.error("Failed to fetch roles:", err)
      toast.error(err.message || "Failed to load roles")
      setRoles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"))
    const obs = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"))
    })
    obs.observe(document.documentElement, { attributes: true })
    return () => obs.disconnect()
  }, [])

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required")
      return
    }

    try {
      setFormLoading(true)
      const response = await apiRequest("/roles", {
        method: 'POST',
        body: JSON.stringify({
          name: newRoleName        }),
      })
      
      toast.success(response.message || "Role created successfully")
      setIsCreateDialogOpen(false)
      setNewRoleName("")
      setNewRoleDescription("")
      fetchRoles()
    } catch (err: any) {
      toast.error(err.message || "Failed to create role")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setEditRoleName(role.name)
    setEditRoleDescription(role.description)
    setIsEditDialogOpen(true)
  }

  const handleUpdateRole = async () => {
    if (!selectedRole) return
    
    if (!editRoleName.trim()) {
      toast.error("Role name is required")
      return
    }

    try {
      setFormLoading(true)
      const response = await apiRequest(`/roles/${selectedRole.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editRoleName        }),
      })
      
      toast.success(response.message || "Role updated successfully")
      setIsEditDialogOpen(false)
      fetchRoles()
    } catch (err: any) {
      toast.error(err.message || "Failed to update role")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await apiRequest(`/roles/${roleId}`, {
        method: "DELETE"
      })
      
      toast.success("Role deleted successfully")
      fetchRoles()
      
      // If the deleted role was selected, clear selection
      if (selectedRoleId === roleId) {
        onRoleSelect(null)
      }
    } catch (err: any) {
      console.error("Failed to delete role:", err)
      toast.error(err.message || "Failed to delete role")
    }
  }

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'Administrator':
        return Shield
      case 'Manager':
        return UserCog
      default:
        return Users
    }
  }

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'Administrator':
        return "#3B82F6"
      case 'Manager':
        return "#10B981"
      case 'Support Agent':
        return "#F59E0B"
      case 'Billing Clerk':
        return "#8B5CF6"
      case 'Customer':
        return "#6B7280"
      default:
        return "#6B7280"
    }
  }

  return (
    <>
      <Card
        className={`h-full ${
          isDarkMode ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-gray-200"
        } rounded-xl overflow-hidden relative`}
      >
        {/* Top-left corner gradient */}
        <div
          className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, #10B981 0%, transparent 70%)`,
          }}
        />

        {/* Bottom-right corner gradient */}
        <div
          className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, #10B981 0%, transparent 70%)`,
          }}
        />

        <CardHeader className={`relative z-10 ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} border-b flex justify-between`}>
          <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>Roles</CardTitle>
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Role
          </Button>
        </CardHeader>
        <CardContent className="relative z-10 p-4">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search roles..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-12">
              <div className={`mb-3 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                No roles found
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRoles.map((role, i) => {
                const Icon = getRoleIcon(role.name)
                const color = getRoleColor(role.name)
                
                return (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  >
                    <div
                      onClick={() => onRoleSelect(role.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors
                        ${
                          isDarkMode
                            ? "bg-[#1e293b] hover:bg-[#2d3748]"
                            : "bg-gray-50 hover:bg-gray-100"
                        }
                        ${
                          selectedRoleId === role.id
                            ? "border-2 border-primary bg-primary/5"
                            : "border border-transparent"
                        }`}
                    >
                      {/* header row */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-full"
                            style={{
                              background: selectedRoleId === role.id
                                ? `${color}20`
                                : isDarkMode
                                ? "#374151"
                                : "#f3f4f6",
                              boxShadow: selectedRoleId === role.id
                                ? `0 0 10px ${color}40`
                                : "none",
                            }}
                          >
                            <Icon
                              className="h-4 w-4"
                              style={{
                                color: selectedRoleId === role.id
                                  ? color
                                  : isDarkMode
                                  ? "#94a3b8"
                                  : "#6b7280",
                              }}
                            />
                          </div>
                          <div>
                            <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {role.name}
                            </div>
                            <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                              {role.description}
                            </div>
                          </div>
                        </div>
                        {role.isSystem && (
                          <Badge
                            variant="outline"
                            className={isDarkMode ? "border-slate-500 text-slate-300" : "border-gray-300 text-gray-700"}
                          >
                            System
                          </Badge>
                        )}
                      </div>
                      {/* footer row */}
                      <div
                        className={`flex justify-between items-center mt-2 pt-2 border-t ${
                          isDarkMode ? "border-slate-600" : "border-gray-200"
                        } text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}
                      >
                        <div>{role.totalUsers} users assigned</div>
                        <div className="flex gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditRole(role)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {!role.isSystem && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteRole(role.id, role.name)}
                                  className="text-red-600"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role and assign permissions to it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name *</Label>
              <Input
                id="role-name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role-name">Role Name *</Label>
              <Input
                id="edit-role-name"
                value={editRoleName}
                onChange={(e) => setEditRoleName(e.target.value)}
                placeholder="Enter role name"
                disabled={selectedRole?.isSystem}
              />
              {selectedRole?.isSystem && (
                <p className="text-xs text-muted-foreground mt-1">
                  System role names cannot be changed
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role-description">Description</Label>
              <Textarea
                id="edit-role-description"
                value={editRoleDescription}
                onChange={(e) => setEditRoleDescription(e.target.value)}
                placeholder="Enter role description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}