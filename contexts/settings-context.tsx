"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import  { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { Description } from "@radix-ui/react-toast"
// Define types for our settings
export type ISPType = {
  id: string
  name: string
  code: string
  description: string
  icon: string
}

export type InternetPlan = {
  id: string
  name: string
  code: string
  ispType: string
  downloadSpeed: number
  uploadSpeed: number
  dataLimit: number
  price: number
  isPopular: boolean
  description: string
}

export type BillingCycle = {
  id: string
  name: string
  code: string
  months: number
  discountPercentage: number
  isDefault: boolean
}

export type PaymentMethod = {
  id: string
  name: string
  code: string
  isEnabled: boolean
  isDefault: boolean
  processingFee: number
}

export type ServiceArea = {
  id: string
  name: string
  code: string
  country: string
  state: string
  cities: string
  zipCodes: string
  notes: string
}

// Mock data for ISP types
const INITIAL_ISP_TYPES: ISPType[] = [
  { id: "1", name: "Fiber ISP", code: "FIBER", description: "Fiber optic internet service provider", icon: "Globe" },
  { id: "2", name: "Cable ISP", code: "CABLE", description: "Cable internet service provider", icon: "Cable" },
  { id: "3", name: "Wireless ISP", code: "WISP", description: "Wireless internet service provider", icon: "Wifi" },
  { id: "4", name: "Satellite ISP", code: "SAT", description: "Satellite internet service provider", icon: "Radio" },
  { id: "5", name: "DSL Provider", code: "DSL", description: "Digital Subscriber Line provider", icon: "Network" },
]

// Mock data for internet plans
const INITIAL_INTERNET_PLANS: InternetPlan[] = [
  {
    id: "1",
    name: "Basic Fiber",
    code: "FIBER-BASIC",
    ispType: "FIBER",
    downloadSpeed: 100,
    uploadSpeed: 20,
    dataLimit: 0,
    price: 49.99,
    isPopular: true,
    description: "Basic fiber internet plan with 100 Mbps download speed",
  },
  {
    id: "2",
    name: "Premium Fiber",
    code: "FIBER-PREMIUM",
    ispType: "FIBER",
    downloadSpeed: 500,
    uploadSpeed: 100,
    dataLimit: 0,
    price: 79.99,
    isPopular: false,
    description: "Premium fiber internet plan with 500 Mbps download speed",
  },
  {
    id: "3",
    name: "Standard Cable",
    code: "CABLE-STD",
    ispType: "CABLE",
    downloadSpeed: 50,
    uploadSpeed: 10,
    dataLimit: 500,
    price: 39.99,
    isPopular: false,
    description: "Standard cable internet plan with 50 Mbps download speed",
  },
  {
    id: "4",
    name: "Wireless Basic",
    code: "WISP-BASIC",
    ispType: "WISP",
    downloadSpeed: 25,
    uploadSpeed: 5,
    dataLimit: 250,
    price: 29.99,
    isPopular: false,
    description: "Basic wireless internet plan with 25 Mbps download speed",
  },
]

// Mock data for billing cycles
const INITIAL_BILLING_CYCLES: BillingCycle[] = [
  {
    id: "1",
    name: "Monthly",
    code: "MONTHLY",
    months: 1,
    discountPercentage: 0,
    isDefault: true,
  },
  {
    id: "2",
    name: "Quarterly",
    code: "QUARTERLY",
    months: 3,
    discountPercentage: 5,
    isDefault: false,
  },
  {
    id: "3",
    name: "Semi-Annual",
    code: "SEMI_ANNUAL",
    months: 6,
    discountPercentage: 10,
    isDefault: false,
  },
  {
    id: "4",
    name: "Annual",
    code: "ANNUAL",
    months: 12,
    discountPercentage: 15,
    isDefault: false,
  },
]

// Mock data for payment methods
const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "1",
    name: "Credit Card",
    code: "CREDIT_CARD",
    isEnabled: true,
    isDefault: true,
    processingFee: 2.9,
  },
  {
    id: "2",
    name: "PayPal",
    code: "PAYPAL",
    isEnabled: true,
    isDefault: false,
    processingFee: 3.5,
  },
  {
    id: "3",
    name: "Bank Transfer",
    code: "BANK_TRANSFER",
    isEnabled: true,
    isDefault: false,
    processingFee: 1.0,
  },
  {
    id: "4",
    name: "Cash",
    code: "CASH",
    isEnabled: false,
    isDefault: false,
    processingFee: 0,
  },
]

// Mock data for service areas
const INITIAL_SERVICE_AREAS: ServiceArea[] = [
  {
    id: "1",
    name: "New York Metro",
    code: "NY_METRO",
    country: "us",
    state: "New York",
    cities: "New York City, Brooklyn, Queens, Bronx, Staten Island",
    zipCodes: "10001-10999",
    notes: "Full coverage in Manhattan, partial coverage in outer boroughs",
  },
  {
    id: "2",
    name: "San Francisco Bay Area",
    code: "SF_BAY",
    country: "us",
    state: "California",
    cities: "San Francisco, Oakland, San Jose, Palo Alto",
    zipCodes: "94000-95000",
    notes: "Full fiber coverage in San Francisco, expanding to East Bay",
  },
  {
    id: "3",
    name: "Greater Toronto",
    code: "TOR_GTA",
    country: "ca",
    state: "Ontario",
    cities: "Toronto, Mississauga, Brampton, Markham",
    zipCodes: "M1A-M9Z",
    notes: "Full coverage in downtown Toronto, expanding to suburbs",
  },
]

// Define the context type
type SettingsContextType = {
  ispTypes: ISPType[]
  setIspTypes: React.Dispatch<React.SetStateAction<ISPType[]>>
  internetPlans: InternetPlan[]
  setInternetPlans: React.Dispatch<React.SetStateAction<InternetPlan[]>>
  billingCycles: BillingCycle[]
  setBillingCycles: React.Dispatch<React.SetStateAction<BillingCycle[]>>
  paymentMethods: PaymentMethod[]
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>
  serviceAreas: ServiceArea[]
  setServiceAreas: React.Dispatch<React.SetStateAction<ServiceArea[]>>
}

// Create the context with default values
const SettingsContext = createContext<SettingsContextType>({
  ispTypes: [],
  setIspTypes: () => {},
  internetPlans: [],
  setInternetPlans: () => {},
  billingCycles: [],
  setBillingCycles: () => {},
  paymentMethods: [],
  setPaymentMethods: () => {},
  serviceAreas: [],
  setServiceAreas: () => {},
})

// Create a provider component
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [ispTypes, setIspTypes] = useState<ISPType[]>(INITIAL_ISP_TYPES)
  const [internetPlans, setInternetPlans] = useState<InternetPlan[]>(INITIAL_INTERNET_PLANS)
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>(INITIAL_BILLING_CYCLES)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(INITIAL_PAYMENT_METHODS)
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>(INITIAL_SERVICE_AREAS)



const ispTypesApi = async () => {
  try {
    const raw = await apiRequest("/connection"); // Your API call
    console.log("API Raw Response:", raw); // DEBUG: Log the raw response

    // 1. Check if it's an array and handle specific non-array cases
    if (!Array.isArray(raw)) {
      console.error("API response is not an array:", raw);
      throw new Error("Expected an array of connection types from API.");
    }

    const mapped: ISPType[] = raw.map((r: any) => {
      // DEBUG: Log each item being mapped
      console.log("Mapping item:", r);
      return {
        id: String(r.id),
        name: r.name,
        code: r.code,
        description: r.description ?? "", // Assuming 'description' from API maps to ISPType's 'description'
        icon: r.iconUrl ?? "", // Assuming 'iconUrl' from API maps to ISPType's 'icon'
      };
    });

    console.log("Mapped ISP Types:", mapped); // DEBUG: Log the mapped data

    // 3. CORRECTED: Use setIspTypes to update the state
    setIspTypes(mapped);

  } catch (err: any) {
    // console.error("Failed to load connection types:", err); // Log the actual error
    // toast.error("Failed to load connection types. Please try again.");
    setIspTypes([]); // Ensure state is reset on error
  }
};

useEffect(() => {
  ispTypesApi();
}, []); 

















  // In a real application, you would fetch these settings from an API
  useEffect(() => {
    // Simulate loading from API or localStorage
    const loadSettings = async () => {
      try {
        // In a real app, you would fetch from API
        // const response = await fetch('/api/settings');
        // const data = await response.json();
        // setIspTypes(data.ispTypes);
        // setInternetPlans(data.internetPlans);
        // ...etc
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }

    loadSettings()
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        ispTypes,
        setIspTypes,
        internetPlans,
        setInternetPlans,
        billingCycles,
        setBillingCycles,
        paymentMethods,
        setPaymentMethods,
        serviceAreas,
        setServiceAreas,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

// Create a custom hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
