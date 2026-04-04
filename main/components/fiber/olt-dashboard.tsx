// components/fiber/olt-dashboard.tsx
"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Download, Upload } from "lucide-react"
import { OLTList } from "@/components/fiber/olt-list"
import { OLTStatistics } from "@/components/fiber/olt-statistics"
import { OLTPortsVisualization } from "@/components/fiber/olt-ports-visualization"
import { OLTAlarms } from "@/components/fiber/olt-alarms"
import { OLTForm } from "@/components/fiber/olt-form"
import { toast } from "react-hot-toast"
import { oltApi } from "@/lib/olt-splitter.api"
import { useConfirmToast } from "@/hooks/use-confirm-toast"
import type { OLT } from "@/types"

export function OLTDashboard() {
  const [activeTab, setActiveTab] = useState("olts")
  const [olts, setOlts] = useState<OLT[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedOlt, setSelectedOlt] = useState<OLT | null>(null)
  const { confirm, ConfirmDialog } = useConfirmToast()

  const fetchOlts = async () => {
    try {
      setLoading(true)
      const data = await oltApi.getAll()
      setOlts(data)
    } catch (error) {
      console.error("Failed to fetch OLTs:", error)
      toast.error("Failed to load OLTs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOlts()
  }, [])

  const handleRefresh = () => {
    fetchOlts()
    toast.success("Data refreshed")
  }

  const handleAddOlt = () => {
    setSelectedOlt(null)
    setShowForm(true)
  }

  const handleEditOlt = (olt: OLT) => {
    setSelectedOlt(olt)
    setShowForm(true)
  }

  const handleDeleteOlt = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete OLT",
      message: "Are you sure you want to delete this OLT? This action cannot be undone.",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    })

    if (!isConfirmed) return

    try {
      await oltApi.delete(id)
      toast.success("OLT deleted successfully")
      fetchOlts()
    } catch (error: any) {
      console.error("Delete error:", error)
      toast.error(error.message || "Failed to delete OLT")
    }
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedOlt) {
        await oltApi.update(selectedOlt.id, data)
        toast.success("OLT updated successfully")
      } else {
        await oltApi.create(data)
        toast.success("OLT created successfully")
      }
      setShowForm(false)
      fetchOlts()
    } catch (error: any) {
      console.error("Save error:", error)
      toast.error(error.message || "Failed to save OLT")
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog />

      {showForm ? (
        <OLTForm
          olt={selectedOlt}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <>
          <PageHeader
            title="OLT Management"
            description="Monitor and manage your Optical Line Terminals"
            actions={
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-transparent"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="ghost" size="sm" className="hover:bg-transparent">
                  <Download size={16} className="mr-2" />
                  Export
                </Button>
                <Button variant="ghost" size="sm" className="hover:bg-transparent">
                  <Upload size={16} className="mr-2" />
                  Import
                </Button>
                <Button size="sm" onClick={handleAddOlt}>
                  <Plus size={16} className="mr-2" />
                  Add OLT
                </Button>
              </div>
            }
          />

          <Tabs defaultValue="olts" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="olts">OLTs</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="ports">Ports</TabsTrigger>
              <TabsTrigger value="alarms">Alarms</TabsTrigger>
            </TabsList>

            <TabsContent value="olts" className="mt-6">
              <OLTList
                olts={olts}
                loading={loading}
                onEdit={handleEditOlt}
                onDelete={handleDeleteOlt}
                onRefresh={fetchOlts}
              />
            </TabsContent>

            <TabsContent value="statistics" className="mt-6">
              <OLTStatistics />
            </TabsContent>

            <TabsContent value="ports" className="mt-6">
              <OLTPortsVisualization olts={olts} />
            </TabsContent>

            <TabsContent value="alarms" className="mt-6">
              <OLTAlarms />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}