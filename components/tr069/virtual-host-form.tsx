"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"

const formSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(2, {
      message: "Virtual host name must be at least 2 characters.",
    })
    .max(50),
  description: z
    .string()
    .min(5, {
      message: "Description must be at least 5 characters.",
    })
    .max(200),
  parameter: z.string().min(5, {
    message: "Parameter path must be at least 5 characters.",
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  status: z.boolean().default(true),
})

interface VirtualHostFormProps {
  initialData?: any
  onSubmit?: (data: any) => void
  onCancel?: () => void
  isDialog?: boolean
}

export function VirtualHostForm({ initialData, onSubmit, onCancel, isDialog = false }: VirtualHostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          status: initialData.status === "active",
        }
      : {
          name: "",
          description: "",
          parameter: "",
          category: "",
          status: true,
        },
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const formattedValues = {
        ...values,
        id: values.id || Date.now().toString(),
        status: values.status ? "active" : "inactive",
        lastUsed: new Date().toISOString(),
      }

      if (onSubmit) {
        onSubmit(formattedValues)
      } else {
        toast({
          title: initialData ? "Virtual host updated" : "Virtual host created",
          description: initialData
            ? "The virtual host has been updated successfully."
            : "The virtual host has been created successfully.",
        })

        if (!initialData) {
          form.reset({
            name: "",
            description: "",
            parameter: "",
            category: "",
            status: true,
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = [
    { value: "Optical", label: "Optical" },
    { value: "WiFi", label: "WiFi" },
    { value: "System", label: "System" },
    { value: "WAN", label: "WAN" },
    { value: "LAN", label: "LAN" },
    { value: "VoIP", label: "VoIP" },
    { value: "Security", label: "Security" },
    { value: "Other", label: "Other" },
  ]

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Virtual Host Name</FormLabel>
                <FormControl>
                  <Input placeholder="PowerRx" {...field} />
                </FormControl>
                <FormDescription>A short, descriptive name for the virtual host.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Group similar virtual hosts together.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="parameter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>TR-069 Parameter Path</FormLabel>
              <FormControl>
                <Input placeholder="Device.Optical.Interface.1.RxPower" {...field} />
              </FormControl>
              <FormDescription>The full TR-069 parameter path that this virtual host will access.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Optical interface receive power measurement" {...field} />
              </FormControl>
              <FormDescription>A detailed description of what this virtual host is used for.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>Enable or disable this virtual host.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          >
            {isSubmitting ? "Saving..." : initialData ? "Update Virtual Host" : "Create Virtual Host"}
          </Button>
        </div>
      </form>
    </Form>
  )

  if (isDialog) {
    return content
  }

  return <div className="space-y-6">{content}</div>
}
