"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"

// Define the tariff plan type
interface TariffPlan {
  id: string
  name: string
  speed: string
  price: number
  features: {
    name: string
    included: boolean
    details?: string
  }[]
  popular: boolean
  type: "residential" | "business" | "enterprise"
}

// Sample data
const tariffPlans: TariffPlan[] = [
  {
    id: "tp1",
    name: "Basic Home",
    speed: "50 Mbps",
    price: 29.99,
    features: [
      { name: "Unlimited data", included: true },
      { name: "Basic support", included: true, details: "Email support with 24-hour response time" },
      { name: "Multiple devices", included: false },
      { name: "Static IP", included: false },
      { name: "Parental controls", included: true },
      { name: "Security suite", included: false },
      { name: "Cloud storage", included: false },
      { name: "Uptime guarantee", included: false },
    ],
    popular: false,
    type: "residential",
  },
  {
    id: "tp2",
    name: "Premium Home",
    speed: "200 Mbps",
    price: 49.99,
    features: [
      { name: "Unlimited data", included: true },
      { name: "Basic support", included: true, details: "Email and phone support with 12-hour response time" },
      { name: "Multiple devices", included: true },
      { name: "Static IP", included: true },
      { name: "Parental controls", included: true },
      { name: "Security suite", included: true },
      { name: "Cloud storage", included: true, details: "100GB included" },
      { name: "Uptime guarantee", included: false },
    ],
    popular: true,
    type: "residential",
  },
  {
    id: "tp3",
    name: "Business Starter",
    speed: "500 Mbps",
    price: 99.99,
    features: [
      { name: "Unlimited data", included: true },
      { name: "Basic support", included: true, details: "Priority support with 4-hour response time" },
      { name: "Multiple devices", included: true },
      { name: "Static IP", included: true },
      { name: "Parental controls", included: true },
      { name: "Security suite", included: true },
      { name: "Cloud storage", included: true, details: "500GB included" },
      { name: "Uptime guarantee", included: true, details: "99.5% uptime SLA" },
    ],
    popular: false,
    type: "business",
  },
]

export function TariffComparison() {
  const [selectedPlans, setSelectedPlans] = useState<string[]>(["tp1", "tp2"])
  const [showAllFeatures, setShowAllFeatures] = useState(false)

  const filteredPlans = tariffPlans.filter((plan) => selectedPlans.includes(plan.id))

  // Get all unique features across selected plans
  const allFeatures = Array.from(
    new Set(
      tariffPlans.filter((plan) => selectedPlans.includes(plan.id)).flatMap((plan) => plan.features.map((f) => f.name)),
    ),
  )

  // Display only the first 5 features unless showAllFeatures is true
  const displayFeatures = showAllFeatures ? allFeatures : allFeatures.slice(0, 5)

  const togglePlan = (planId: string) => {
    if (selectedPlans.includes(planId)) {
      // Don't remove if it's the last plan
      if (selectedPlans.length > 1) {
        setSelectedPlans(selectedPlans.filter((id) => id !== planId))
      }
    } else {
      setSelectedPlans([...selectedPlans, planId])
    }
  }

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm shadow-lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Compare Tariff Plans</h2>
          <div className="flex gap-2">
            {tariffPlans.map((plan) => (
              <Button
                key={plan.id}
                variant={selectedPlans.includes(plan.id) ? "default" : "outline"}
                size="sm"
                onClick={() => togglePlan(plan.id)}
                className={selectedPlans.includes(plan.id) ? "bg-gradient-to-r from-blue-600 to-indigo-600" : ""}
              >
                {plan.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[200px_repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {/* Header row */}
          <div className="text-gray-400">Plans</div>
          {filteredPlans.map((plan) => (
            <div key={plan.id} className="relative">
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500">
                  Most Popular
                </Badge>
              )}
              <h3 className="font-bold text-white">{plan.name}</h3>
            </div>
          ))}

          {/* Speed row */}
          <div className="text-gray-400 py-3">Speed</div>
          {filteredPlans.map((plan) => (
            <div key={`${plan.id}-speed`} className="font-semibold text-white py-3">
              {plan.speed}
            </div>
          ))}

          {/* Price row */}
          <div className="text-gray-400 py-3">Monthly Price</div>
          {filteredPlans.map((plan) => (
            <div key={`${plan.id}-price`} className="py-3">
              <span className="text-xl font-bold text-white">${plan.price}</span>
              <span className="text-gray-400">/mo</span>
            </div>
          ))}

          {/* Features */}
          {displayFeatures.map((feature) => (
            <div key={feature} className="text-gray-400 py-3 border-t border-gray-800">
              {feature}
            </div>
          ))}

          {/* Feature values */}
          {displayFeatures.map((feature) => (
            <div key={feature}>
              {filteredPlans.map((plan) => {
                const featureData = plan.features.find((f) => f.name === feature)
                return (
                  <div key={`${plan.id}-${feature}`} className="py-3 border-t border-gray-800">
                    {featureData?.included ? (
                      <div className="flex items-center">
                        <span className="bg-gradient-to-r from-green-500 to-emerald-500 p-1 rounded-full mr-2">
                          <Check size={14} className="text-white" />
                        </span>
                        {featureData.details && <span className="text-sm text-gray-400">{featureData.details}</span>}
                      </div>
                    ) : (
                      <span className="text-gray-600">
                        <X size={18} />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Show more/less features button */}
          {allFeatures.length > 5 && (
            <div className="col-span-full mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllFeatures(!showAllFeatures)}
                className="text-gray-400 border-gray-700 hover:bg-gray-800"
              >
                {showAllFeatures ? "Show fewer features" : `Show ${allFeatures.length - 5} more features`}
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className="text-gray-400 py-3 border-t border-gray-800">&nbsp;</div>
          {filteredPlans.map((plan) => (
            <div key={`${plan.id}-action`} className="py-3 border-t border-gray-800">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Select Plan
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
