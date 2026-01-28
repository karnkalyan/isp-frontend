"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Save, Loader2, Shield, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Permission {
  id: number
  name: string
  description?: string
  menuName?: string
}

interface PermissionCategory {
  category: string
  permissions: Permission[]
}

interface RolePermissionsMatrixProps {
  selectedRoleId: number | null
}

export function RolePermissionsMatrix({ selectedRoleId }: RolePermissionsMatrixProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [permissions, setPermissions] = useState<PermissionCategory[]>([])
  const [rolePermissions, setRolePermissions] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [roleName, setRoleName] = useState<string>("")
  const [hasChanges, setHasChanges] = useState(false)
  const [originalPermissions, setOriginalPermissions] = useState<number[]>([])

  // Fetch all permissions
  const fetchPermissions = async () => {
    try {
      const response = await apiRequest("/roles/permissions")
      // Handle both response formats
      const data = response.data || response
      setPermissions(data)
    } catch (err: any) {
      console.error("Failed to fetch permissions:", err)
      toast.error("Failed to load permissions")
      setPermissions([])
    }
  }

  // Fetch role permissions when role is selected
  const fetchRolePermissions = async () => {
    if (!selectedRoleId) {
      setRolePermissions([])
      setOriginalPermissions([])
      setRoleName("")
      setHasChanges(false)
      return
    }

    try {
      setLoading(true)
      const response = await apiRequest(`/roles/${selectedRoleId}/permissions`)
      // Handle both response formats
      const data = response.data || response
      
      setRoleName(data.roleName || "")
      setRolePermissions(data.permissionIds || [])
      setOriginalPermissions(data.permissionIds || [])
      setHasChanges(false)
    } catch (err: any) {
      console.error("Failed to fetch role permissions:", err)
      toast.error("Failed to load role permissions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [])

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions()
    } else {
      setRolePermissions([])
      setOriginalPermissions([])
      setRoleName("")
      setHasChanges(false)
    }
  }, [selectedRoleId])

  // Check for dark mode
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

  const handlePermissionToggle = (permissionId: number) => {
    setRolePermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId)
      } else {
        return [...prev, permissionId]
      }
    })
    setHasChanges(true)
  }

  const handleSelectAll = (category: string) => {
    if (category === "all") {
      const allPermissionIds = permissions.flatMap(cat => cat.permissions.map(p => p.id))
      const hasAll = allPermissionIds.every(id => rolePermissions.includes(id))
      
      if (hasAll) {
        setRolePermissions([])
      } else {
        setRolePermissions(allPermissionIds)
      }
    } else {
      const categoryPermissions = permissions.find(p => p.category === category)
      if (!categoryPermissions) return

      const allCategoryPermissionIds = categoryPermissions.permissions.map(p => p.id)
      const hasAll = allCategoryPermissionIds.every(id => rolePermissions.includes(id))

      if (hasAll) {
        setRolePermissions(prev => prev.filter(id => !allCategoryPermissionIds.includes(id)))
      } else {
        setRolePermissions(prev => [...new Set([...prev, ...allCategoryPermissionIds])])
      }
    }
    setHasChanges(true)
  }

  const handleSavePermissions = async () => {
    if (!selectedRoleId) {
      toast.error("Please select a role first")
      return
    }

    try {
      setSaving(true)
      await apiRequest(`/roles/${selectedRoleId}/permissions`, {
        method: 'POST',
        body: JSON.stringify({
          permissionIds: rolePermissions
        }),
      })
      
      toast.success("Permissions updated successfully")
      setOriginalPermissions(rolePermissions)
      setHasChanges(false)
    } catch (err: any) {
      console.error("Failed to save permissions:", err)
      toast.error(err.message || "Failed to save permissions")
    } finally {
      setSaving(false)
    }
  }

  const filteredCategories = permissions.filter(
    (category) => selectedTab === "all" || category.category.toLowerCase() === selectedTab.toLowerCase(),
  )

  const filteredPermissions = filteredCategories.flatMap((category) =>
    category.permissions
      .filter((permission) => 
        permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (permission.description && permission.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map((permission) => ({ category: category.category, permission })),
  )

  const allCategories = ["all", ...permissions.map(p => p.category)]

  return (
    <Card
      className={`h-full ${isDarkMode ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-gray-200"} rounded-xl overflow-hidden relative`}
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

      <CardHeader
        className={`flex flex-row items-center justify-between relative z-10 ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} border-b`}
      >
        <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
          {roleName ? `${roleName} Permissions` : "Role Permissions"}
        </CardTitle>
        <Button onClick={handleSavePermissions} disabled={saving || !selectedRoleId || !hasChanges}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </CardHeader>
      <CardContent className="relative z-10 p-4">
        {hasChanges && (
          <Alert className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Don't forget to save your changes.
            </AlertDescription>
          </Alert>
        )}

        {!selectedRoleId ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 mb-4 text-muted-foreground" />
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Select a Role
            </h3>
            <p className={`text-center max-w-sm ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
              Please select a role from the list to view and manage its permissions.
            </p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search permissions..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
          <ScrollArea className="w-full mb-4">
  <TabsList
    className={`w-max inline-flex whitespace-nowrap gap-1 ${
      isDarkMode ? "bg-[#1e293b]" : "bg-gray-100"
    }`}
  >
    {allCategories.map((category) => (
      <TabsTrigger
        key={category}
        value={category}
        className={
          isDarkMode
            ? "data-[state=active]:bg-[#2d3748] text-slate-300 data-[state=active]:text-white"
            : "data-[state=active]:bg-white text-gray-500 data-[state=active]:text-gray-900"
        }
      >
        {category === "all" ? "All" : category}
      </TabsTrigger>
    ))}
  </TabsList>
</ScrollArea>

              <TabsContent value={selectedTab} className="mt-0">
                <ScrollArea className="h-[800px] pr-4">
                  {searchQuery ? (
                    <div className="space-y-4">
                      {filteredPermissions.length > 0 ? (
                        filteredPermissions.map(({ category, permission }, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <div
                              className={`flex items-center justify-between p-2 ${isDarkMode ? "border-slate-700" : "border-gray-200"} border-b`}
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id={`permission-${index}`} 
                                  checked={rolePermissions.includes(permission.id)}
                                  onCheckedChange={() => handlePermissionToggle(permission.id)}
                                />
                                <label
                                  htmlFor={`permission-${index}`}
                                  className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                                >
                                  {permission.description || permission.name}
                                </label>
                              </div>
                              <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>{category}</div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className={`text-center py-8 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                          No permissions found matching "{searchQuery}"
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredCategories.map((category, categoryIndex) => (
                      <motion.div
                        key={category.category}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
                        className="mb-6"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {category.category}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectAll(category.category)}
                            className="text-xs h-6 px-2"
                          >
                            {category.permissions.every(p => rolePermissions.includes(p.id))
                              ? "Deselect All"
                              : "Select All"}
                          </Button>
                        </div>
                        <div className="space-y-2 ml-2">
                          {category.permissions.map((permission, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Checkbox 
                                id={`${category.category}-${index}`} 
                                checked={rolePermissions.includes(permission.id)}
                                onCheckedChange={() => handlePermissionToggle(permission.id)}
                              />
                              <label
                                htmlFor={`${category.category}-${index}`}
                                className={`text-sm ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}
                              >
                                {permission.description || permission.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  )
}