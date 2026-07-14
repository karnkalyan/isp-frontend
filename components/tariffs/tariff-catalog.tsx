"use client"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Download, Upload, Wifi, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data for tariff plans
const tariffPlans = [
  {
    id: "plan-1",
    name: "Residential Basic",
    description: "Basic internet for residential customers",
    price: 29.99,
    setupFee: 0,
    downloadSpeed: 50,
    uploadSpeed: 10,
    dataLimit: "Unlimited",
    services: ["internet"],
    popular: false,
    active: true,
    gradientFrom: "#3B82F6",
    gradientTo: "#10B981",
  },
  {
    id: "plan-2",
    name: "Residential Plus",
    description: "High-speed internet for residential customers",
    price: 49.99,
    setupFee: 0,
    downloadSpeed: 100,
    uploadSpeed: 20,
    dataLimit: "Unlimited",
    services: ["internet"],
    popular: true,
    active: true,
    gradientFrom: "#10B981",
    gradientTo: "#3B82F6",
  },
  {
    id: "plan-3",
    name: "Residential Premium",
    description: "Premium internet with TV bundle",
    price: 79.99,
    setupFee: 0,
    downloadSpeed: 250,
    uploadSpeed: 50,
    dataLimit: "Unlimited",
    services: ["internet", "tv"],
    popular: false,
    active: true,
    gradientFrom: "#8B5CF6",
    gradientTo: "#3B82F6",
  },
]

export function TariffCatalog() {
  return (
    <CardContainer title="Tariff Plans" description="Available service plans and packages">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {tariffPlans.map((plan) => (
          <div key={plan.id} className="relative bg-slate-800/20 rounded-lg overflow-hidden">
            {/* Top-left corner gradient */}
            <div
              className="absolute -top-16 -left-16 w-32 h-32 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, ${plan.gradientFrom} 0%, transparent 70%)`,
              }}
            />

            {/* Bottom-right corner gradient */}
            <div
              className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, ${plan.gradientTo} 0%, transparent 70%)`,
              }}
            />

            {plan.popular && (
              <div className="absolute -right-8 top-4 bg-amber-500 text-white px-10 py-1 rotate-45 text-xs font-semibold">
                Popular
              </div>
            )}

            <div className="p-4 border-b border-slate-700 flex justify-between items-center relative z-10">
              <div>
                <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                <p className="text-sm text-slate-400">{plan.description}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px] bg-slate-900 border-slate-800">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem className="text-slate-400 hover:text-white focus:text-white hover:bg-slate-800 focus:bg-slate-800">
                    Edit Plan
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-400 hover:text-white focus:text-white hover:bg-slate-800 focus:bg-slate-800">
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem className="text-red-500 hover:text-red-400 focus:text-red-400 hover:bg-slate-800 focus:bg-slate-800">
                    Delete Plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="p-4 relative z-10">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-3xl font-bold text-white">${plan.price}</p>
                  <p className="text-xs text-slate-400">per month</p>
                </div>
                {plan.setupFee > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">${plan.setupFee}</p>
                    <p className="text-xs text-slate-400">setup fee</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Download</span>
                  </div>
                  <span className="font-medium text-white">{plan.downloadSpeed} Mbps</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Upload</span>
                  </div>
                  <span className="font-medium text-white">{plan.uploadSpeed} Mbps</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Data Limit</span>
                  </div>
                  <span className="font-medium text-white">{plan.dataLimit}</span>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Select Plan</Button>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 flex justify-center border-t border-slate-800">
        <Button variant="outline" className="text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white">
          View All Plans
        </Button>
      </div>
    </CardContainer>
  )
}
