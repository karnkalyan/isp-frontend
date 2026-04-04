"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Save, X, Wifi, Network, Globe, Cable, Radio } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useSettings } from "@/contexts/settings-context"
import { apiRequest } from "@/lib/api"

export type ISPType = {
  id: string
  name: string
  code: string
  description: string
  icon: string
  isEnabled: boolean
}



const ICON_OPTIONS: Option[] = [
  { value: "Globe", label: "Globe" },
  { value: "Wifi", label: "Wifi" },
  { value: "Network", label: "Network" },
  { value: "Cable", label: "Cable" },
  { value: "Radio", label: "Radio" },
]


const IconComponent = ({ name }: { name: string }) => {
  switch (name) {
    case "Globe":
      return <Globe className="h-5 w-5" />
    case "Wifi":
      return <Wifi className="h-5 w-5" />
    case "Network":
      return <Network className="h-5 w-5" />
    case "Cable":
      return <Cable className="h-5 w-5" />
    case "Radio":
      return <Radio className="h-5 w-5" />
    default:
      return <Globe className="h-5 w-5" />
  }
}

export function ISPTypesSettings() {
  const [ispTypes, setIspTypes] = useState<ISPType[]>([]);
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [reloadCounter, setReloadCounter] = useState(0);


  const [newIspType, setNewIspType] = useState<Omit<(typeof ispTypes)[0], "id"> & { isEnabled: boolean }>({
    name: "",
    code: "",
    description: "",
    icon: "Globe",
    isEnabled: false,
  })

  const resetForm = () => {
    setNewIspType({
      name: "",
      code: "",
      description: "",
      icon: "Globe",
      isEnabled: false,
    })
  }



const ispTypesApi = async () => {
  try {
    const raw = await apiRequest("/connection"); // Your API call
    // console.log("API Raw Response:", raw); // DEBUG: Log the raw response

    // 1. Check if it's an array and handle specific non-array cases
    if (!Array.isArray(raw)) {
      console.error("API response is not an array:", raw);
      throw new Error("Expected an array of connection types from API.");
    }

  const mapped: ISPType[] = raw.map((r: any) => ({
  id: String(r.id),
  name: r.name,
  code: r.code,
  description: r.description ?? "",
  icon: r.iconUrl ?? r.icon ?? "Globe", // Default to "Globe" if iconUrl is not provided
  isEnabled: Boolean(r.isExtra)
}));

    

    // console.log("Mapped ISP Types:", mapped); // DEBUG: Log the mapped data

    setIspTypes(mapped);

  } catch (err: any) {
    // console.error("Failed to load connection types:", err); // Log the actual error
    // toast.error("Failed to load connection types. Please try again.");
    setIspTypes([]); // Ensure state is reset on error
  }
};


useEffect(() => {
  ispTypesApi();
}, [reloadCounter]); // Add dependencies to re-fetch when these functions change




const handleAdd = async () => {
  if (!newIspType.name || !newIspType.code) {
    toast.error("Name and code are required")
    return
  }

  const payload = {
    name: newIspType.name,
    code: newIspType.code,
    description: newIspType.description,
    iconUrl: newIspType.icon,    // API expects iconUrl
    isExtra: newIspType.isEnabled,
    isActive: true
  }

  setIsAdding(true)
  try {
    await apiRequest(`/connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    resetForm()
    toast.success("Connection type added successfully")
    setReloadCounter((c) => c + 1)
  } catch (error) {
    console.error("adding error:", error)
    toast.error("An error occurred while adding")
  } finally {
    setIsAdding(false)
  }
}

  const handleEdit = (id: string) => {
    const ispType = ispTypes.find((type) => type.id === id)
    if (ispType) {
      setNewIspType({
        name:       ispType.name,
        code:       ispType.code,
        description: ispType.description,
        icon:       ispType.icon,
        isEnabled:  ispType.isEnabled,  // ← now this will be `true` if isExtra was true
      });
      
      setEditingId(id)
    }
  }
  const handleUpdate = async () => {
    // alert("Updating ISP type...");
    if (!editingId) return;
  
    if (!newIspType.name || !newIspType.code) {
      toast.error("Name and code are required");
      return;
    }
  
    // const userinfo = JSON.parse(localStorage.getItem('user') || '{}');
    // console.log("User Info:", userinfo);
    // const ispid = userinfo?.ispId;
  
    // console.log("ISP ID:", ispid);


    try {
  await apiRequest(`/connection/${editingId}`, {
  method: 'PUT',
 
  body: JSON.stringify({
    name: newIspType.name,             // Changed from connName
    code: newIspType.code,             // Changed from connCode
    iconUrl: newIspType.icon,          // Changed from iconLink
    isExtra: newIspType.isEnabled,     // Changed from extraAllowed
    description: newIspType.description, // Changed from desc
    isActive: true                    // Changed from active
  }),
});

      setEditingId(null);
      resetForm();
      setReloadCounter((c) => c + 1);
      toast.success("ISP type updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("An error occurred while updating");
    }
  };
  
  const handleDelete = async (id: string) => {
   
    try {
      await apiRequest(`/connection/${id}`, {
      method: 'DELETE'
    });
    toast.success("ISP type deleted successfully")
    setReloadCounter((c) => c + 1);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting");
    }
  
  }

  const handleCancel = () => {
    setReloadCounter((c) => c + 1);
    setIsAdding(false)
    setEditingId(null)
    resetForm()
  }


  


  return (
    <div className="space-y-6">
      {(isAdding || editingId) && (
        <div className="bg-card border rounded-md p-4 mb-6">
          <h3 className="text-lg font-medium mb-4">
            {isAdding ? "Add New ISP Type" : "Edit ISP Type"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newIspType.name}
                onChange={(e) => setNewIspType({ ...newIspType, name: e.target.value })}
                placeholder="e.g., Fiber ISP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={newIspType.code}
                onChange={(e) => setNewIspType({ ...newIspType, code: e.target.value.toUpperCase() })}
                placeholder="e.g., FIBER"
              />
            </div>
          </div>

      

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <SearchableSelect
                options={ICON_OPTIONS}
                value={newIspType.icon}
                onValueChange={(value) => setNewIspType({ ...newIspType, icon: value })}
                placeholder="Select an icon"
              />
            </div>

            <div className="flex flex-col space-y-2">

            <Label htmlFor="icon">Enable Extra Devices</Label>
              <Switch
                id="isEnabled"
                checked={newIspType.isEnabled}
                style={{
                  backgroundColor: !newIspType.isEnabled ? '#3e4d65' : undefined,
                  marginTop: '25px',
                }}
                onCheckedChange={(checked) =>
                  setNewIspType({ ...newIspType, isEnabled: checked })
                }
              />
              {/* <Label htmlFor="isEnabled">Enable Extra Devices</Label> */}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newIspType.description}
              onChange={(e) => setNewIspType({ ...newIspType, description: e.target.value })}
              placeholder="Describe this ISP type"
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={isAdding ? handleAdd : handleUpdate}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {isAdding ? "Add Connection Type" : "Update Connection Type"}
            </Button>
          </div>
        </div>
      )}

      {!isAdding && !editingId && (
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Connection Type
        </Button>
      )}

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Icon</TableHead>
                <TableHead className="w-[180px]">Name</TableHead>
                <TableHead className="w-[120px]">Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ispTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No Connection types found. Add your first Connection type.
                  </TableCell>
                </TableRow>
              ) : (
                ispTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                        <IconComponent name={type.icon} />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.code}</TableCell>
                    <TableCell className="max-w-md">{type.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(type.id)} className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(type.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
