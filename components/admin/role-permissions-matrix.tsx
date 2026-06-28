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
import { Label } from "@/components/ui/label"

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

interface ModuleConfig {
  permissions: string[];
  subModules?: Record<string, string[]>;
}

const modulePermissionMap: Record<string, ModuleConfig> = {
  "Dashboard": {
    permissions: [],
    subModules: {
      "Overview": ["dashboard_overview"],
      "Real-Time Monitoring": ["dashboard_realtime"],
      "Settings": ["dashboard_settings"]
    }
  },
  "Customer Management": {
    permissions: [],
    subModules: {
      "All Customers": ["customers_list"],
      "Add New Customer": ["customers_create"],
      "Customer Portal": ["customer_read"],
      "Customer Dashboard": ["customer_read"]
    }
  },
  "Lead Management (CRM)": {
    permissions: [],
    subModules: {
      "Create Lead": ["lead_create"],
      "Lead Management": ["leads_manage"],
      "Assigned Leads": ["lead_read"],
      "Qualified Leads": ["lead_read"],
      "Unqualified Leads": ["lead_read"],
      "Converted Leads": ["lead_read"],
      "Follow-ups": ["lead_read", "lead_update"],
      "Import Leads": ["lead_create"],
      "Lead Reports": ["lead_read"],
      "Edit Lead": ["lead_update"],
      "View Lead": ["lead_read"]
    }
  },
  "Service Management": {
    permissions: [],
    subModules: {
      "Add Service": ["services_manage"],
      "Service Settings": ["services_manage"],
      "Service Details": ["services_read"]
    }
  },
  "Tariff Management": {
    permissions: [],
    subModules: {
      "Tariff Catalog": ["package_plans_read", "package_plans_create", "package_plans_update", "package_plans_delete"]
    }
  },
  "Package Management": {
    permissions: [],
    subModules: {
      "Package Plans": ["package_plans_read", "package_plans_create", "package_plans_update", "package_plans_delete"],
      "Package Prices": ["package_price_read", "package_price_create", "package_price_update", "package_price_delete"],
      "One-Time Charges": ["one_time_charges_read", "one_time_charges_create", "one_time_charges_update", "one_time_charges_delete"]
    }
  },
  "Customer Type Settings": {
    permissions: [],
    subModules: {
      "View Customer Types": ["customer_types_read"],
      "Create Customer Types": ["customer_types_create"],
      "Update Customer Types": ["customer_types_update"],
      "Delete Customer Types": ["customer_types_delete"]
    }
  },
  "Finance & Billing": {
    permissions: [],
    subModules: {
      "Invoices": ["billing_read", "billing_read_self"],
      "Invoice Ranges": ["billing_read"],
      "Payments": ["billing_create", "billing_update"],
      "Recharge": ["billing_create"],
      "Renewal": ["billing_create"]
    }
  },
  "Network Infrastructure": {
    permissions: [],
    subModules: {
      "Fiber Network": ["olt_read"],
      "Fiber Map": ["olt_read"],
      "Fiber Networks": ["olt_read"],
      "OLT Management": ["olt_read", "olt_create"],
      "OLT Details": ["olt_read", "olt_update", "olt_delete"],
      "Splitter Management": ["olt_read", "olt_create"],
      "Splitter Details": ["splitter_read", "splitter_create", "splitter_update", "splitter_delete"],
      "Networking": ["olt_read"],
      "Network Topology": ["olt_read"],
      "NAS Management": ["nas_read", "nas_create"],
      "Add NAS": ["nas_create"],
      "NAS Details": ["nas_read"],
      "TR-069 Management": ["services_read", "services_manage"],
      "Device Management": ["services_read", "services_manage"],
      "Virtual Hosts": ["services_read", "services_manage"]
    }
  },
  "Inventory Management": {
    permissions: [],
    subModules: {
      "My Assigned Items": ["inventory_assigned"],
      "Add Inventory": ["inventory_manage"],
      "Bulk Inventory": ["bulk_inventory_read", "bulk_inventory_create", "bulk_inventory_update", "bulk_inventory_delete"],
      "Bulk Assignments": ["inventory_manage"],
      "Import Inventory": ["inventory_manage"],
      "Lifecycle Management": ["inventory_read", "inventory_manage"]
    }
  },
  "Drum Management": {
    permissions: [],
    subModules: {
      "Drum Assignments": ["drums_read", "drums_create", "drums_update", "drums_delete"]
    }
  },
  "Branch Management": {
    permissions: [],
    subModules: {
      "Branch Details": ["branches_read"],
      "Branch Settings": ["branches_read", "branches_create", "branches_update", "branches_delete"]
    }
  },
  "Administrative Management": {
    permissions: [],
    subModules: {
      "User Administration": ["users_read", "users_create", "users_update", "users_delete"],
      "Users": ["users_read", "users_create", "users_update", "users_delete"],
      "Roles": ["roles_read", "roles_create", "roles_update", "roles_delete"],
      "Audit Logs": ["audit_log_read"],
      "Department Management": ["departments_read", "departments_create", "departments_update", "departments_delete"]
    }
  },
  "Ticketing & Support": {
    permissions: [],
    subModules: {
      "Support Tickets": ["tickets_manage"],
      "Create Ticket": ["tickets_create"]
    }
  },
  "Task Management": {
    permissions: [],
    subModules: {
      "Tasks": ["tasks_manage"]
    }
  },
  "Communication Center": {
    permissions: [],
    subModules: {
      "Messaging": ["lead_read", "customer_read", "services_manage"],
      "Notifications": ["lead_read", "customer_read", "services_manage"],
      "SMS Campaigns": ["lead_read", "customer_read", "services_manage"],
      "Notices": ["lead_read", "customer_read", "services_manage"]
    }
  },
  "Membership Management": {
    permissions: [],
    subModules: {
      "Membership": ["membership_read", "membership_create"]
    }
  },
  "Reports & Analytics": {
    permissions: [],
    subModules: {
      "Reports": ["reports_read", "reports_generate"]
    }
  },
  "Master Configuration": {
    permissions: [],
    subModules: {
      "Master Settings": ["settings_read", "settings_update"]
    }
  },
  "Existing ISP Migration": {
    permissions: [],
    subModules: {
      "Existing ISP Data": ["existingisp_read", "existingisp_create", "existingisp_update"]
    }
  },
  "ISP Registration & Onboarding": {
    permissions: [],
    subModules: {
      "Register ISP": ["isp_create"],
      "ISP Details": ["isp_read", "isp_update", "isp_delete"]
    }
  },
  "VoIP Integration": {
    permissions: [],
    subModules: {
      "Show Yeastar in Sidebar": ["nav_yeastar"],
      "Yeastar PBX": ["yeaster_read", "yeaster_manage"],
      "Asterisk PBX": ["asterisk_read", "asterisk_manage"]
    }
  },
  "Authentication": {
    permissions: [],
    subModules: {
      "Login": ["dashboard_view"],
      "Forgot Password": ["dashboard_view"]
    }
  }
};

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
      if (!response) {
        setPermissions([])
        return
      }
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
      if (!response) {
        setRolePermissions([])
        setOriginalPermissions([])
        setRoleName("")
        setHasChanges(false)
        return
      }
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

  const handleModuleToggle = (moduleName: string) => {
    const config = modulePermissionMap[moduleName];
    if (!config) return;
    const allFlat = permissions.flatMap(cat => cat.permissions);
    
    let requiredPermNames: string[] = [];
    if (config.subModules) {
      requiredPermNames = Object.values(config.subModules).flat();
    } else {
      requiredPermNames = config.permissions;
    }
    
    const requiredPermIds = allFlat
      .filter(p => requiredPermNames.includes(p.name))
      .map(p => p.id);

    if (requiredPermIds.length === 0) return;

    const isCurrentlyEnabled = requiredPermIds.every(id => rolePermissions.includes(id));

    setRolePermissions(prev => {
      if (isCurrentlyEnabled) {
        return prev.filter(id => !requiredPermIds.includes(id));
      } else {
        return [...new Set([...prev, ...requiredPermIds])];
      }
    });
    setHasChanges(true);
  };

  const handleSubModuleToggle = (moduleName: string, subName: string) => {
    const config = modulePermissionMap[moduleName];
    if (!config || !config.subModules || !config.subModules[subName]) return;
    
    const requiredPermNames = config.subModules[subName];
    const allFlat = permissions.flatMap(cat => cat.permissions);
    
    const requiredPermIds = allFlat
      .filter(p => requiredPermNames.includes(p.name))
      .map(p => p.id);

    if (requiredPermIds.length === 0) return;

    const isCurrentlyEnabled = requiredPermIds.every(id => rolePermissions.includes(id));

    setRolePermissions(prev => {
      if (isCurrentlyEnabled) {
        return prev.filter(id => !requiredPermIds.includes(id));
      } else {
        return [...new Set([...prev, ...requiredPermIds])];
      }
    });
    setHasChanges(true);
  };

  const isModuleEnabled = (moduleName: string) => {
    const config = modulePermissionMap[moduleName];
    if (!config) return false;
    
    const allFlat = permissions.flatMap(cat => cat.permissions);
    let requiredPermNames: string[] = [];
    if (config.subModules) {
      requiredPermNames = Object.values(config.subModules).flat();
    } else {
      requiredPermNames = config.permissions;
    }
    
    const requiredPermIds = allFlat
      .filter(p => requiredPermNames.includes(p.name))
      .map(p => p.id);

    if (requiredPermIds.length === 0) return false;
    return requiredPermIds.every(id => rolePermissions.includes(id));
  };

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
                  {selectedTab === "all" && !searchQuery && (
                    <div className={`mb-6 p-4 rounded-xl border ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        <Shield className="h-4 w-4 text-primary" />
                        Sidebar Modules & Access Control
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.keys(modulePermissionMap).map((moduleName) => {
                          const config = modulePermissionMap[moduleName];
                          const hasSubModules = !!config.subModules;
                          const enabled = isModuleEnabled(moduleName);
                          const allFlat = permissions.flatMap(cat => cat.permissions);
                          const getIdsForPerms = (perms: string[]) => allFlat.filter(p => perms.includes(p.name)).map(p => p.id);
                          
                          return (
                            <div
                              key={moduleName}
                              className={`p-3.5 rounded-xl border transition-all ${
                                enabled
                                  ? isDarkMode
                                    ? "bg-slate-900/80 border-primary/30"
                                    : "bg-slate-50 border-primary/20"
                                  : isDarkMode
                                  ? "bg-slate-900/40 border-slate-800"
                                  : "bg-white border-gray-100"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  id={`module-${moduleName}`}
                                  checked={enabled}
                                  onCheckedChange={() => handleModuleToggle(moduleName)}
                                />
                                <Label
                                  htmlFor={`module-${moduleName}`}
                                  className="text-sm font-semibold cursor-pointer select-none"
                                >
                                  {moduleName}
                                </Label>
                              </div>
                              
                              {hasSubModules && config.subModules && (
                                <div className="mt-3 pl-4 border-l border-slate-700/60 space-y-2.5 ml-2.5">
                                  {Object.keys(config.subModules).map((subName) => {
                                    const subPerms = config.subModules![subName];
                                    const subIds = getIdsForPerms(subPerms);
                                    const isSubEnabled = subIds.length > 0 && subIds.every(id => rolePermissions.includes(id));
                                    
                                    return (
                                      <div
                                        key={subName}
                                        onClick={() => handleSubModuleToggle(moduleName, subName)}
                                        className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                                          isSubEnabled
                                            ? isDarkMode
                                              ? "bg-primary/10 border-primary/40 text-white"
                                              : "bg-primary/5 border-primary/30 text-primary-dark"
                                            : isDarkMode
                                            ? "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                        }`}
                                      >
                                        <Checkbox
                                          id={`sub-${moduleName}-${subName}`}
                                          checked={isSubEnabled}
                                          onCheckedChange={() => {}}
                                          className="pointer-events-none"
                                        />
                                        <span className="text-xs font-medium cursor-pointer select-none">{subName}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
