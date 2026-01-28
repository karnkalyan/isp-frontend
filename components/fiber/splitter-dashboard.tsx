// components/fiber/splitter-dashboard.tsx
"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Download, Upload } from "lucide-react"
// import { SplitterList } from "@/components/fiber/splitter-list"
// import { SplitterStatistics } from "@/components/fiber/splitter-statistics"
import { SplitterForm } from "@/components/fiber/splitter-form"
import { toast } from "react-hot-toast"
import { splitterApi } from "@/lib/olt-splitter.api"
import { useConfirmToast } from "@/hooks/use-confirm-toast"
import type { Splitter } from "@/types"

export function SplitterDashboard() {
  const [activeTab, setActiveTab] = useState("splitters")
  const [splitters, setSplitters] = useState<Splitter[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedSplitter, setSelectedSplitter] = useState<Splitter | null>(null)
  const { confirm, ConfirmDialog } = useConfirmToast()

  const fetchSplitters = async () => {
    try {
      setLoading(true)
      const data = await splitterApi.getAll()
      setSplitters(data)
    } catch (error) {
      console.error("Failed to fetch splitters:", error)
      toast.error("Failed to load splitters")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSplitters()
  }, [])

  const handleRefresh = () => {
    fetchSplitters()
    toast.success("Data refreshed")
  }

  const handleAddSplitter = () => {
    setSelectedSplitter(null)
    setShowForm(true)
  }

  const handleEditSplitter = (splitter: Splitter) => {
    setSelectedSplitter(splitter)
    setShowForm(true)
  }

  const handleDeleteSplitter = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Splitter",
      message: "Are you sure you want to delete this splitter? This action cannot be undone.",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    })

    if (!isConfirmed) return

    try {
      await splitterApi.delete(id)
      toast.success("Splitter deleted successfully")
      fetchSplitters()
    } catch (error: any) {
      console.error("Delete error:", error)
      toast.error(error.message || "Failed to delete splitter")
    }
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedSplitter) {
        await splitterApi.update(selectedSplitter.id, data)
        toast.success("Splitter updated successfully")
      } else {
        await splitterApi.create(data)
        toast.success("Splitter created successfully")
      }
      setShowForm(false)
      fetchSplitters()
    } catch (error: any) {
      console.error("Save error:", error)
      toast.error(error.message || "Failed to save splitter")
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog />

      {showForm ? (
        <SplitterForm
          splitter={selectedSplitter}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <>
          <PageHeader
            title="Splitter Management"
            description="Monitor and manage optical splitters"
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
                <Button size="sm" onClick={handleAddSplitter}>
                  <Plus size={16} className="mr-2" />
                  Add Splitter
                </Button>
              </div>
            }
          />

          <Tabs defaultValue="splitters" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="splitters">Splitters</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="splitters" className="mt-6">
              <SplitterList
                splitters={splitters}
                loading={loading}
                onEdit={handleEditSplitter}
                onDelete={handleDeleteSplitter}
                onRefresh={fetchSplitters}
              />
            </TabsContent>

            <TabsContent value="statistics" className="mt-6">
              <SplitterStatistics />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}