"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ISPRegistrationForm } from "@/components/auth/isp-registration-form"
import { PageHeader } from "@/components/ui/page-header"

export default function RegisterISPPage() {
  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6 space-y-6">
        <PageHeader
          title="Register New ISP"
          description="Create a new Internet Service Provider account in the system"
          className="mb-6 w-full"
        />

        <ISPRegistrationForm />
      </div>
    </DashboardLayout>
  )
}
