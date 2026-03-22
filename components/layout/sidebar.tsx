"use client"

import type React from "react"
import type { Metadata } from "next"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  BarChart3,
  CreditCard,
  HelpCircle,
  Settings,
  Users,
  ChevronLeft,
  FileText,
  Phone,
  Tv,
  Wifi,
  MonitorCheck,
  FileCode,
  Package,
  PenTool as Tool,
  Map,
  ChevronDown,
  ChevronRight,
  ListChecks,
  Shield,
  Globe,
  Activity,
  Cpu,
  Cloud,
  Headphones,
  Video,
  MessageSquare,
  Server,
  Share2,
  Wrench,
  Plug,
  Milestone,
  Radar,
  Cable,
  Workflow,
  Hourglass,
  Laptop,
  FileSpreadsheet,
  Receipt,
  Coins,
  Truck,
  Sliders,
  Crown,
  UserPlus,
  Building,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { TooltipProvider } from "@/components/ui/tooltip"
import { apiRequest } from "@/lib/api"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

type MenuItem = {
  title: string
  icon: React.ElementType
  href?: string
  submenu?: { title: string; href: string }[]
  highlight?: boolean
  exactMatch?: boolean
}

type MenuCategory = {
  category: string
  items: MenuItem[]
}




// Organize menu items into categories
const menuCategories: MenuCategory[] = [
  {
    category: "Main",
    items: [
      {
        title: "Dashboard",
        icon: Activity,
        href: "/",
        submenu: [
          { title: "Overview", href: "/dashboard/overview" },
          // { title: "Real-Time Stats", href: "/dashboard/real-time" },
          // { title: "System Health", href: "/dashboard/system-health" },
          // { title: "Quick Insights", href: "/dashboard/insights" },
        ],
      },
    ],
  },
  {
    category: "Management",
    items: [
      {
        title: "Administration",
        icon: Shield,
        submenu: [
          { title: "User Management", href: "/admin/users" },
          { title: "User Roles", href: "/admin/roles" },
          // { title: "Permissions", href: "/admin/permissions" },
          // { title: "API Keys & Webhooks", href: "/admin/api-keys" },
          // { title: "Audit Logs", href: "/admin/audit-logs" },
        ],
      },
      {
        title: "Customers",
        icon: Users,
        href: "/customers",
        submenu: [
          { title: "All Customers", href: "/customers/all" },
          { title: "Onboard New", href: "/customers/new" },
          // { title: "Register ISP", href: "/register-isp" },
          // { title: "Bulk Import/Export", href: "/customers/bulk" },
          // { title: "Segments", href: "/customers/segments" },
          // { title: "VIP List", href: "/customers/vip" },
          // { title: "Check Package", href: "/customers/check-package" },
          // { title: "Push to Services", href: "/customers/push-services" },
        ],
      },
      {
        title: "Branch",
        icon: Building,
        href: "/branch",
        submenu: [
          { title: "Branch Management", href: "/branch" },
        ],
      },

      {
        title: "Department",
        icon: Building,
        href: "/department",
        submenu: [
          { title: "Department Management", href: "/department" },
        ],
      },

      {
        title: "Membership",
        icon: Crown,
        href: "/membership",
        submenu: [
          { title: "Manage Membership", href: "/membership" },
        ],
      },
    ],
  },
  {
    category: "Sales & Marketing",
    items: [
      {
        title: "Leads",
        icon: UserPlus,
        href: "/leads",
        submenu: [
          { title: "Create Lead", href: "/leads/create" },
          { title: "Lead Management", href: "/leads" },
          { title: "Qualified", href: "/leads/qualified" },
          { title: "Unqualified", href: "/leads/unqualified" },
          { title: "Converted", href: "/leads/converted" },
          { title: "Follow-up Tracking", href: "/leads/follow-ups" },

          { title: "Import Leads", href: "/leads/import" },
          { title: "Lead Reports", href: "/leads/reports" },
          // { title: "Conversion Tracking", href: "/leads/conversion" },
        ],
      },





      {
        title: "Existing ISP",
        icon: Building,
        href: "/existing-isp",
        submenu: [
          { title: "ISP Management", href: "/existing-isp" },
          // { title: "Add ISP", href: "/existing-isp/add" },
          // { title: "ISP Comparison", href: "/existing-isp/comparison" },
          // { title: "Migration Tools", href: "/existing-isp/migration" },
        ],
      },
    ],
  },
  {
    category: "Network Infrastructure",
    items: [
      // {
      //   title: "Networking",
      //   icon: Globe,
      //   submenu: [
      //     { title: "Topology Map", href: "/networking/topology" },
      //     { title: "Devices", href: "/networking/devices" },
      //     { title: "VLANs/Subnets", href: "/networking/vlans" },
      //     { title: "Routing Policies", href: "/networking/routing" },
      //     { title: "Firewall Rules", href: "/networking/firewall" },
      //   ],
      // },
      // {
      //   title: "Peering & Transit",
      //   icon: Share2,
      //   submenu: [
      //     { title: "Peering Partners", href: "/peering/partners" },
      //     { title: "BGP Sessions", href: "/peering/bgp-sessions" },
      //     { title: "Transit Providers", href: "/peering/transit" },
      //     { title: "IX Management", href: "/peering/ix" },
      //     { title: "AS Path Analysis", href: "/peering/as-path" },
      //     { title: "Traffic Exchange", href: "/peering/traffic" },
      //   ],
      // },
      {
        title: "TR-069 ACS",
        icon: Cpu,
        submenu: [
          { title: "Dashboard", href: "/tr069" },
          // { title: "Device Management", href: "/tr069/devices" },
          // { title: "Device Details", href: "/tr069/device" },
          // { title: "Virtual Hosts", href: "/tr069/virtual-hosts" },
          // { title: "Provisioning", href: "/tr069/provisioning" },
          // { title: "Firmware Updates", href: "/tr069/firmware" },
          // { title: "Configuration", href: "/tr069/config" },
        ],
      },
      {
        title: "NAS Management",
        icon: Server,
        submenu: [
          { title: "NAS List", href: "/nas" },
          { title: "Add NAS", href: "/nas/new" }
        ],
      },
    ],
  },
  {
    category: "Access Networks",
    items: [
      {
        title: "Fiber Management",
        icon: Cable,
        submenu: [
          // { title: "FTTH/FTTB Networks", href: "/fiber/networks" },
          { title: "OLT Management", href: "/fiber/olt" },
          // { title: "ONT/ONU Inventory", href: "/fiber/ont" },
          // { title: "Splitter Management", href: "/fiber/splitters" },
          { title: "Fiber Mapping", href: "/fiber/map" },
          // { title: "PON Diagnostics", href: "/fiber/diagnostics" },
        ],
      },
      // {
      //   title: "Wireless Networks",
      //   icon: Radar,
      //   submenu: [
      //     { title: "WISP Infrastructure", href: "/wireless/infrastructure" },
      //     { title: "Access Points", href: "/wireless/access-points" },
      //     { title: "CPE Management", href: "/wireless/cpe" },
      //     { title: "Frequency Planning", href: "/wireless/frequency" },
      //     { title: "Signal Analysis", href: "/wireless/signal" },
      //     { title: "Interference Mgmt", href: "/wireless/interference" },
      //   ],
      // },
    ],
  },
  {
    category: "Services",
    items: [
      {
        title: "3rd Party Services",
        icon: ListChecks,
        submenu: [
          { title: "Service List", href: "/services" },
        ],
      },
      // {
      //   title: "Service List",
      //   icon: RefreshCw,
      //   submenu: [
      //     { title: "eSewa", href: "/services/esewa" },
      //     { title: "Khalti", href: "/services/khalti" },
      //     { title: "IME Pay", href: "/services/imepay" },
      //     { title: "TSHUL", href: "/services/tshul" },
      //     { title: "RADIUS", href: "/services/radius" },
      //     { title: "IPTV", href: "/services/iptv" },
      //   ],
      // },
      // {
      //   title: "WiFi",
      //   icon: Wifi,
      //   submenu: [
      //     { title: "SSID Config", href: "/wifi/config" },
      //     { title: "AP Management", href: "/wifi/ap" },
      //     { title: "Usage Heatmap", href: "/wifi/heatmap" },
      //     { title: "Guest Controls", href: "/wifi/guest" },
      //   ],
      // },
      // {
      //   title: "IPTV",
      //   icon: Tv,
      //   submenu: [
      //     { title: "Channel Lineup", href: "/iptv/channels" },
      //     { title: "EPG Scheduler", href: "/iptv/epg" },
      //     { title: "Quality Metrics", href: "/iptv/quality" },
      //     { title: "PPV Modules", href: "/iptv/ppv" },
      //   ],
      // },
      // {
      //   title: "OTT",
      //   icon: Video,
      //   submenu: [
      //     { title: "Content Library", href: "/ott/library" },
      //     { title: "Subscription Management", href: "/ott/subscriptions" },
      //     { title: "Stream Analytics", href: "/ott/analytics" },
      //     { title: "DRM Settings", href: "/ott/drm" },
      //   ],
      // },
      // {
      //   title: "Voice",
      //   icon: Headphones,
      //   submenu: [
      //     { title: "Call Logs", href: "/voice/logs" },
      //     { title: "SIP Accounts", href: "/voice/sip" },
      //     { title: "QoS Monitoring", href: "/voice/qos" },
      //     { title: "Recordings Manager", href: "/voice/recordings" },
      //   ],
      // },
      // {
      //   title: "IVR",
      //   icon: Phone,
      //   submenu: [
      //     { title: "Menu Designer", href: "/ivr/designer" },
      //     { title: "Call Flow Simulator", href: "/ivr/simulator" },
      //     { title: "Recording Archive", href: "/ivr/recordings" },
      //     { title: "Performance Stats", href: "/ivr/stats" },
      //   ],
      // },
      // {
      //   title: "CDN & Caching",
      //   icon: Server,
      //   submenu: [
      //     { title: "Cache Servers", href: "/cdn/servers" },
      //     { title: "Content Distribution", href: "/cdn/distribution" },
      //     { title: "Cache Rules", href: "/cdn/rules" },
      //     { title: "Performance Analytics", href: "/cdn/performance" },
      //     { title: "Origin Servers", href: "/cdn/origin" },
      //     { title: "Edge Locations", href: "/cdn/edge" },
      //   ],
      // },
    ],
  },
  // {
  //   category: "Finance",
  //   items: [
  //     {
  //       title: "Finance",
  //       icon: CreditCard,
  //       href: "/finance",
  //       submenu: [
  //         { title: "Invoices & Statements", href: "/finance/invoices" },
  //         { title: "Transactions Ledger", href: "/finance/transactions" },
  //         { title: "Payment Gateways", href: "/finance/gateways" },
  //         { title: "Refunds/Disputes", href: "/finance/refunds" },
  //         { title: "Tax Reports", href: "/finance/tax" },
  //       ],
  //     },
  //     {
  //       title: "Billing",
  //       icon: Receipt,
  //       submenu: [
  //         { title: "Billing Cycles", href: "/billing/cycles" },
  //         { title: "Invoice Generation", href: "/billing/invoice-generation" },
  //         { title: "Payment Processing", href: "/billing/payment-processing" },
  //         { title: "Dunning Management", href: "/billing/dunning" },
  //         { title: "Credit Management", href: "/billing/credit" },
  //         { title: "Billing Reports", href: "/billing/reports" },
  //       ],
  //     },
  //     {
  //       title: "Revenue Management",
  //       icon: Coins,
  //       submenu: [
  //         { title: "Revenue Dashboard", href: "/revenue/dashboard" },
  //         { title: "Revenue Forecasting", href: "/revenue/forecasting" },
  //         { title: "Revenue Analysis", href: "/revenue/analysis" },
  //         { title: "Churn Impact", href: "/revenue/churn-impact" },
  //         { title: "Revenue Optimization", href: "/revenue/optimization" },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   category: "Sales & Support",
  //   items: [
  //     {
  //       title: "Complaints",
  //       icon: MessageSquare,
  //       submenu: [
  //         { title: "Open Tickets", href: "/complaints/open" },
  //         { title: "Escalation Matrix", href: "/complaints/escalation" },
  //         { title: "SLA Dashboards", href: "/complaints/sla" },
  //         { title: "Resolution History", href: "/complaints/history" },
  //       ],
  //     },
  //     {
  //       title: "Support",
  //       icon: HelpCircle,
  //       href: "/support",
  //     },
  //     {
  //       title: "SLA Management",
  //       icon: Hourglass,
  //       submenu: [
  //         { title: "SLA Definitions", href: "/sla/definitions" },
  //         { title: "SLA Monitoring", href: "/sla/monitoring" },
  //         { title: "Compliance Reports", href: "/sla/compliance" },
  //         { title: "Violation Alerts", href: "/sla/violations" },
  //         { title: "Customer SLAs", href: "/sla/customer" },
  //       ],
  //     },
  //     {
  //       title: "Customer Portal",
  //       icon: Laptop,
  //       submenu: [
  //         { title: "Portal Management", href: "/portal/management" },
  //         { title: "Self-Service Tools", href: "/portal/self-service" },
  //         { title: "Knowledge Base", href: "/portal/knowledge-base" },
  //         { title: "Usage Monitoring", href: "/portal/usage" },
  //         { title: "Bill Payment", href: "/portal/payment" },
  //         { title: "Support Tickets", href: "/portal/tickets" },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   category: "Analytics & Reporting",
  //   items: [
  //     {
  //       title: "Reports",
  //       icon: FileText,
  //       href: "/reports",
  //       submenu: [
  //         { title: "Custom Builder", href: "/reports/builder" },
  //         { title: "Scheduled Reports", href: "/reports/scheduled" },
  //         { title: "Export CSV/PDF", href: "/reports/export" },
  //         { title: "Templates", href: "/reports/templates" },
  //       ],
  //     },
  //     {
  //       title: "Analytics",
  //       icon: BarChart3,
  //       submenu: [
  //         { title: "User Behavior", href: "/analytics/behavior" },
  //         { title: "Traffic Sources", href: "/analytics/traffic" },
  //         { title: "Churn Predictions", href: "/analytics/churn" },
  //         { title: "Heatmaps", href: "/analytics/heatmaps" },
  //       ],
  //     },
  //     {
  //       title: "Network Analytics",
  //       icon: Activity,
  //       submenu: [
  //         { title: "Traffic Analysis", href: "/network-analytics/traffic" },
  //         { title: "Bandwidth Utilization", href: "/network-analytics/bandwidth" },
  //         { title: "Congestion Points", href: "/network-analytics/congestion" },
  //         { title: "Latency Monitoring", href: "/network-analytics/latency" },
  //         { title: "Packet Loss Analysis", href: "/network-analytics/packet-loss" },
  //         { title: "Network Forecasting", href: "/network-analytics/forecasting" },
  //       ],
  //     },
  //     {
  //       title: "Regulatory Reporting",
  //       icon: FileSpreadsheet,
  //       submenu: [
  //         { title: "Compliance Reports", href: "/regulatory/compliance" },
  //         { title: "Data Retention", href: "/regulatory/data-retention" },
  //         { title: "Legal Intercept", href: "/regulatory/legal-intercept" },
  //         { title: "Regulatory Filings", href: "/regulatory/filings" },
  //         { title: "Audit Trails", href: "/regulatory/audit" },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   category: "Infrastructure",
  //   items: [
  //     {
  //       title: "Network Monitoring",
  //       icon: MonitorCheck,
  //       submenu: [
  //         { title: "Live Dashboard", href: "/monitoring/live" },
  //         { title: "Alert Rules", href: "/monitoring/alerts" },
  //         { title: "Historical Uptime", href: "/monitoring/uptime" },
  //         { title: "SNMP/ICMP Tools", href: "/monitoring/tools" },
  //       ],
  //     },
  //     {
  //       title: "TR-069",
  //       icon: Cpu,
  //       submenu: [
  //         { title: "Device Profiles", href: "/tr069/profiles" },
  //         { title: "Provisioning Templates", href: "/tr069/templates" },
  //         { title: "Session Logs", href: "/tr069/logs" },
  //         { title: "Firmware Management", href: "/tr069/firmware" },
  //       ],
  //     },
  //     {
  //       title: "SysLog Mgmt",
  //       icon: FileCode,
  //       submenu: [
  //         { title: "Log Servers", href: "/syslog/servers" },
  //         { title: "Live Viewer", href: "/syslog/viewer" },
  //         { title: "Alert Rules", href: "/syslog/alerts" },
  //         { title: "Archive & Export", href: "/syslog/archive" },
  //       ],
  //     },
  //     {
  //       title: "Server Info",
  //       icon: Cloud,
  //       submenu: [
  //         { title: "Real-Time Metrics", href: "/server/metrics" },
  //         { title: "Resource Usage", href: "/server/resources" },
  //         { title: "Service Status", href: "/server/status" },
  //         { title: "Maintenance Scheduler", href: "/server/maintenance" },
  //       ],
  //     },
  //     {
  //       title: "Capacity Planning",
  //       icon: Sliders,
  //       submenu: [
  //         { title: "Bandwidth Planning", href: "/capacity/bandwidth" },
  //         { title: "Growth Forecasting", href: "/capacity/forecasting" },
  //         { title: "Upgrade Planning", href: "/capacity/upgrades" },
  //         { title: "Capacity Reports", href: "/capacity/reports" },
  //         { title: "Bottleneck Analysis", href: "/capacity/bottlenecks" },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   category: "Advanced Networking",
  //   items: [
  //     {
  //       title: "Traffic Management",
  //       icon: Sliders,
  //       submenu: [
  //         { title: "Bandwidth Control", href: "/traffic/bandwidth" },
  //         { title: "QoS Policies", href: "/traffic/qos" },
  //         { title: "Traffic Shaping", href: "/traffic/shaping" },
  //         { title: "Deep Packet Inspection", href: "/traffic/dpi" },
  //         { title: "Traffic Graphs", href: "/traffic/graphs" },
  //       ],
  //     },
  //     {
  //       title: "Hotspot System",
  //       icon: Milestone,
  //       submenu: [
  //         { title: "Hotspot Servers", href: "/hotspot/servers" },
  //         { title: "User Profiles", href: "/hotspot/profiles" },
  //         { title: "Walled Garden", href: "/hotspot/walled-garden" },
  //         { title: "Voucher Generator", href: "/hotspot/vouchers" },
  //         { title: "Captive Portal", href: "/hotspot/captive-portal" },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   category: "Resources",
  //   items: [
  //     {
  //       title: "Inventory",
  //       icon: Package,
  //       submenu: [
  //         { title: "Hardware Catalog", href: "/inventory/catalog" },
  //         { title: "Stock Levels", href: "/inventory/stock" },
  //         { title: "Stock Management", href: "/inventory/stock-management" },
  //         { title: "Inventory Tracking", href: "/inventory/tracking" },
  //         { title: "Supplier Management", href: "/inventory/suppliers" },
  //         { title: "Reorder Points", href: "/inventory/reorder" },
  //         { title: "Asset Assignment", href: "/inventory/assets" },
  //         { title: "Purchase Orders", href: "/inventory/orders" },
  //       ],
  //     },
  //     {
  //       title: "Location Mgmt",
  //       icon: Map,
  //       submenu: [
  //         { title: "Site Directory", href: "/locations/directory" },
  //         { title: "Geofencing Rules", href: "/locations/geofencing" },
  //         { title: "Map Dashboard", href: "/locations/map" },
  //         { title: "GPS Sync Logs", href: "/locations/gps" },
  //       ],
  //     },
  //     {
  //       title: "Tools",
  //       icon: Tool,
  //       submenu: [
  //         { title: "Diagnostics Suite", href: "/tools/diagnostics" },
  //         { title: "API Explorer", href: "/tools/api" },
  //         { title: "CLI/SSH Access", href: "/tools/cli" },
  //         { title: "Debug Console", href: "/tools/debug" },
  //       ],
  //     },
  //     {
  //       title: "Maintenance",
  //       icon: Wrench,
  //       submenu: [
  //         { title: "Scheduled Tasks", href: "/maintenance/scheduled" },
  //         { title: "Maintenance Windows", href: "/maintenance/windows" },
  //         { title: "Change Management", href: "/maintenance/change" },
  //         { title: "Backup Schedules", href: "/maintenance/backup" },
  //       ],
  //     },
  //     {
  //       title: "Field Operations",
  //       icon: Truck,
  //       submenu: [
  //         { title: "Technician Dispatch", href: "/field/dispatch" },
  //         { title: "Installation Jobs", href: "/field/installations" },
  //         { title: "Service Calls", href: "/field/service-calls" },
  //         { title: "Field Equipment", href: "/field/equipment" },
  //         { title: "Mobile Apps", href: "/field/mobile-apps" },
  //       ],
  //     },
  //   ],
  // },
  {
    category: "System",
    items: [
      {
        title: "Settings",
        icon: Settings,
        submenu: [
          { title: "System Settings & Packages", href: "/dashboard/settings" },
          // { title: "Security & SSO", href: "/settings/security" },
          // { title: "Notifications", href: "/settings/notifications" },
          // { title: "Localization", href: "/settings/localization" },
        ],
      },
      // {
      //   title: "Master Settings",
      //   icon: Sliders,
      //   href: "/master-settings",
      //   // highlight: true,
      //   submenu: [
      //     { title: "Service Settings", href: "/master-settings" },
      //     { title: "System Configuration", href: "/master-settings/system" },
      //     { title: "Integration Settings", href: "/master-settings/integrations" },
      //   ],
      // },
      // {
      //   title: "Integration",
      //   icon: Plug,
      //   submenu: [
      //     { title: "API Management", href: "/integration/api" },
      //     { title: "Webhooks", href: "/integration/webhooks" },
      //     { title: "Third-Party Services", href: "/integration/third-party" },
      //     { title: "Data Exchange", href: "/integration/data-exchange" },
      //   ],
      // },
      // {
      //   title: "Automation",
      //   icon: Workflow,
      //   submenu: [
      //     { title: "Workflow Builder", href: "/automation/workflows" },
      //     { title: "Scheduled Tasks", href: "/automation/scheduled" },
      //     { title: "Event Triggers", href: "/automation/triggers" },
      //     { title: "Automation Logs", href: "/automation/logs" },
      //     { title: "Templates", href: "/automation/templates" },
      //   ],
      // },
    ],
  },
]





export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>([])
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null)
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 })
  const submenuRef = useRef<HTMLDivElement>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [showTooltip, setShowTooltip] = useState(true)
  const [brand, setBrand] = useState<string>("ISP Manager")
  // Check for dark mode
  useEffect(() => {
    // Initial check
    setIsDarkMode(document.documentElement.classList.contains("dark"))

    // Set up observer for theme changes
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


  const ispData = async () => {
    try {
      const response = await apiRequest("/isp/active");
      // console.log("API Response:", response); // Debug log

      // Check different possible response structures
      if (response && response.companyName) {
        setBrand(response.companyName);
      } else if (response && response.data && response.data.companyName) {
        setBrand(response.data.companyName);
      } else if (response && response.isp && response.isp.companyName) {
        setBrand(response.isp.companyName);
      } else if (response && response.name) {
        setBrand(response.name);
      }
    } catch (error) {
      console.error("Error fetching ISP data:", error);
    }
  }

  useEffect(() => {
    ispData()
  }, [])



  // 1. HELPER FUNCTION to generate initials
  const getBrandInitials = (name: string): string => {
    // Return a default if the brand name isn't loaded yet
    if (!name) return "SI";

    const words = name.split(" ").filter(Boolean); // Split by space and remove any empty items

    if (words.length === 1) {
      // If one word, take the first two letters
      return words[0].substring(0, 2).toUpperCase();
    } else {
      // If multiple words, take the first letter of the first two words
      return (words[0][0] + (words[1]?.[0] || "")).toUpperCase();
    }
  };


  const brandInitials = useMemo(() => getBrandInitials(brand), [brand]);


  // Add keyboard shortcut (Cmd/Ctrl + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault()
        setOpen(!open)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, setOpen])

  // Set open submenu based on current path
  useEffect(() => {
    let foundMenuItem: MenuItem | undefined

    if (menuCategories) {
      menuCategories.forEach((category) => {
        const item = category.items.find(
          (item) => item.submenu?.some((subitem) => pathname === subitem.href) || pathname === item.href,
        )
        if (item) foundMenuItem = item
      })

      if (foundMenuItem) {
        setOpenMenus((prev) => (prev.includes(foundMenuItem!.title) ? prev : [...prev, foundMenuItem!.title]))
      }
    }
  }, [pathname])

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // For submenu handling (existing code)
      if (submenuRef.current && !submenuRef.current.contains(event.target as Node)) {
        setHoveredMenu(null)
        setShowTooltip(true)
      }

      // For sidebar in mobile view
      // Check if we're in mobile view (window width < 768px), sidebar is open, and click is outside sidebar
      if (window.innerWidth < 768 && open && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen])

  // Toggle menu open/closed
  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  // Handle hover for collapsed sidebar
  const handleMenuHover = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
    title: string,
    hasSubmenu: boolean,
  ) => {
    if (!open && hasSubmenu) {
      const rect = e.currentTarget.getBoundingClientRect()
      setSubmenuPosition({
        top: rect.top,
        left: rect.right + 10,
      })
      setHoveredMenu(title)
      setShowTooltip(false) // Hide tooltip when showing submenu
    }
  }

  // Handle mouse leave for collapsed sidebar
  const handleMenuLeave = () => {
    // Small delay to allow moving mouse to submenu
    setTimeout(() => {
      if (!submenuRef.current?.matches(":hover")) {
        setHoveredMenu(null)
        setShowTooltip(true) // Show tooltip again when submenu is closed
      }
    }, 100)
  }

  // Function to determine if a menu item is active
  const isMenuItemActive = (item: MenuItem): boolean => {
    // For items with exactMatch property, check for exact path match
    if (item.exactMatch) {
      return pathname === item.href
    }

    // For items with submenu, check if any submenu item matches the current path
    if (item.submenu) {
      return item.submenu.some((subitem) => pathname === subitem.href)
    }

    // For regular items, check if the path starts with the item's href
    // This ensures parent routes stay active when on child routes
    return item.href ? pathname === item.href || (!item.exactMatch && pathname.startsWith(item.href)) : false
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
          "md:relative md:z-0 md:translate-x-0",
          !open && window.innerWidth >= 768 ? "md:w-16" : "md:w-64",
        )}
        style={{
          background: isDarkMode ? "rgba(17, 25, 40, 0.95)" : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRight: isDarkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: isDarkMode ? "4px 0 30px rgba(0, 0, 0, 0.1)" : "4px 0 30px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className={cn("h-full flex flex-col", !open && "md:items-center")}>
          {/* Sidebar header */}
          <div
            className={cn(
              "flex h-14 items-center border-b border-border/40 px-4",
              open ? "justify-center" : "md:justify-center",
            )}
            style={{
              borderBottom: isDarkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            {open && <span className="text-xl font-bold gradient-text">{brand}</span>}
            {!open && <span className="text-xl font-bold gradient-text">{brandInitials}</span>}
            {open && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="absolute right-2"
                aria-label="Close sidebar"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Sidebar content */}
          <div className={cn("flex-1 overflow-auto py-4 scrollbar-thin hover:overflow-auto", open ? "px-2" : "px-0")}>
            <nav className="grid gap-1" aria-label="Main navigation">
              {menuCategories &&
                menuCategories.map((category, categoryIndex) => (
                  <div key={category.category} className="mb-4">
                    {/* Category header - only show when sidebar is open */}
                    {open && (
                      <div className="px-3 mb-1">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {category.category}
                        </h3>
                      </div>
                    )}

                    {/* Category divider for collapsed sidebar */}
                    {!open && categoryIndex > 0 && <div className="my-2 mx-auto w-4 border-t border-border/40"></div>}

                    {/* Menu items */}
                    {category.items.map((item) => {
                      const isActive = isMenuItemActive(item)
                      const isOpen = openMenus.includes(item.title)
                      const hasSubmenu = item.submenu && item.submenu.length > 0

                      // Special styling for highlighted items
                      const highlightStyle = item.highlight ? "bg-primary/10 text-primary hover:bg-primary/20" : ""

                      if (hasSubmenu) {
                        return (
                          <div key={item.title} className={cn(!open && "md:w-10 md:mx-auto")}>
                            <div className="flex items-center">
                              {!open ? (
                                <div key={item.title} className="relative w-full">
                                  <button
                                    onMouseEnter={(e) => handleMenuHover(e, item.title, true)}
                                    onMouseLeave={handleMenuLeave}
                                    className={cn(
                                      "flex w-full items-center justify-center rounded-md p-2 text-sm font-medium transition-colors",
                                      isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-adaptive hover:bg-muted hover:text-foreground",
                                      highlightStyle,
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "sidebar-icon",
                                        `sidebar-icon-${category.category.toLowerCase().includes("management")
                                          ? "management"
                                          : category.category.toLowerCase().includes("services")
                                            ? "services"
                                            : category.category.toLowerCase().includes("finance")
                                              ? "finance"
                                              : category.category.toLowerCase().includes("support")
                                                ? "support"
                                                : category.category.toLowerCase().includes("analytics")
                                                  ? "analytics"
                                                  : category.category.toLowerCase().includes("infrastructure")
                                                    ? "infrastructure"
                                                    : category.category.toLowerCase().includes("resources")
                                                      ? "resources"
                                                      : category.category.toLowerCase().includes("system")
                                                        ? "system"
                                                        : "dashboard"
                                        }`,
                                        isActive && "sidebar-icon-active",
                                      )}
                                    >
                                      <item.icon aria-hidden="true" />
                                    </div>
                                    <span className="sr-only">{item.title}</span>
                                  </button>
                                  {/* Only show tooltip when not showing submenu */}
                                  {showTooltip && hoveredMenu !== item.title && (
                                    <div className="absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2">
                                      <div className="rounded bg-popover px-2 py-1 text-sm text-popover-foreground shadow-md">
                                        {item.title}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => toggleMenu(item.title)}
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                      ? "bg-primary/10 text-primary"
                                      : "text-adaptive hover:bg-muted hover:text-foreground",
                                    highlightStyle,
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={cn(
                                        "sidebar-icon",
                                        `sidebar-icon-${category.category.toLowerCase().includes("management")
                                          ? "management"
                                          : category.category.toLowerCase().includes("services")
                                            ? "services"
                                            : category.category.toLowerCase().includes("finance")
                                              ? "finance"
                                              : category.category.toLowerCase().includes("support")
                                                ? "support"
                                                : category.category.toLowerCase().includes("analytics")
                                                  ? "analytics"
                                                  : category.category.toLowerCase().includes("infrastructure")
                                                    ? "infrastructure"
                                                    : category.category.toLowerCase().includes("resources")
                                                      ? "resources"
                                                      : category.category.toLowerCase().includes("system")
                                                        ? "system"
                                                        : "dashboard"
                                        }`,
                                        isActive && "sidebar-icon-active",
                                      )}
                                    >
                                      <item.icon aria-hidden="true" />
                                    </div>
                                    <span>{item.title}</span>
                                  </div>
                                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                            {open && isOpen && (
                              <div className="pl-10 pr-2">
                                <div className="mt-1 space-y-1">
                                  {item.submenu.map((subitem) => {
                                    const isSubActive = pathname === subitem.href
                                    return (
                                      <a
                                        key={subitem.title}
                                        href={subitem.href}
                                        className={cn(
                                          "flex items-center rounded-md px-3 py-1.5 text-sm transition-colors submenu-item",
                                          isSubActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-adaptive hover:bg-muted hover:text-foreground",
                                        )}
                                        aria-current={isSubActive ? "page" : undefined}
                                      >
                                        <span className="submenu-bullet"></span>
                                        {subitem.title}
                                      </a>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      }

                      return !open ? (
                        <div key={item.title} className="relative w-full">
                          <a
                            href={item.href}
                            className={cn(
                              "flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-adaptive hover:bg-muted hover:text-foreground",
                              highlightStyle,
                            )}
                            aria-current={isActive ? "page" : undefined}
                            onMouseEnter={() => setShowTooltip(true)}
                          >
                            <div
                              className={cn(
                                "sidebar-icon",
                                `sidebar-icon-${category.category.toLowerCase().includes("management")
                                  ? "management"
                                  : category.category.toLowerCase().includes("services")
                                    ? "services"
                                    : category.category.toLowerCase().includes("finance")
                                      ? "finance"
                                      : category.category.toLowerCase().includes("support")
                                        ? "support"
                                        : category.category.toLowerCase().includes("analytics")
                                          ? "analytics"
                                          : category.category.toLowerCase().includes("infrastructure")
                                            ? "infrastructure"
                                            : category.category.toLowerCase().includes("resources")
                                              ? "resources"
                                              : category.category.toLowerCase().includes("system")
                                                ? "system"
                                                : "dashboard"
                                }`,
                                isActive && "sidebar-icon-active",
                              )}
                            >
                              <item.icon aria-hidden="true" />
                            </div>
                            <span className="sr-only">{item.title}</span>
                          </a>
                          {/* Simple tooltip */}
                          {showTooltip && (
                            <div className="absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2">
                              <div className="rounded bg-popover px-2 py-1 text-sm text-popover-foreground shadow-md">
                                {item.title}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <a
                          key={item.title}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-adaptive hover:bg-muted hover:text-foreground",
                            highlightStyle,
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <div
                            className={cn(
                              "sidebar-icon",
                              `sidebar-icon-${category.category.toLowerCase().includes("management")
                                ? "management"
                                : category.category.toLowerCase().includes("services")
                                  ? "services"
                                  : category.category.toLowerCase().includes("finance")
                                    ? "finance"
                                    : category.category.toLowerCase().includes("support")
                                      ? "support"
                                      : category.category.toLowerCase().includes("analytics")
                                        ? "analytics"
                                        : category.category.toLowerCase().includes("infrastructure")
                                          ? "infrastructure"
                                          : category.category.toLowerCase().includes("resources")
                                            ? "resources"
                                            : category.category.toLowerCase().includes("system")
                                              ? "system"
                                              : "dashboard"
                              }`,
                              isActive && "sidebar-icon-active",
                            )}
                          >
                            <item.icon aria-hidden="true" />
                          </div>
                          <span>{item.title}</span>
                        </a>
                      )
                    })}
                  </div>
                ))}
            </nav>
          </div>

          {/* Sidebar footer */}
          <div
            className={cn("border-t border-border/40 p-4", !open && "md:hidden", "hidden md:block")}
            style={{
              borderTop: isDarkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <p className="text-xs text-muted-foreground">Simul ISP Admin v1.0</p>
            <p className="text-xs text-muted-foreground mt-1">Press Ctrl+B to toggle sidebar</p>
          </div>
        </div>
      </div>

      {/* Floating submenu for collapsed sidebar */}
      {hoveredMenu && !open && (
        <div
          ref={submenuRef}
          className="fixed sidebar-submenu"
          style={{
            top: `${submenuPosition.top}px`,
            left: `${submenuPosition.left}px`,
            zIndex: 50,
            minWidth: "200px",
            padding: "8px",
            background: isDarkMode ? "rgba(17, 25, 40, 0.25)" : "rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: isDarkMode ? "0 8px 32px rgba(0, 0, 0, 0.2)" : "0 8px 32px rgba(31, 38, 135, 0.1)",
            borderRadius: "var(--radius)",
          }}
          onMouseEnter={() => {
            setHoveredMenu(hoveredMenu)
            setShowTooltip(false)
          }}
          onMouseLeave={() => {
            setHoveredMenu(null)
            setShowTooltip(true)
          }}
        >
          {/* Parent menu name */}
          <div className="px-3 py-2 font-medium text-sm">{hoveredMenu}</div>

          {/* Divider */}
          <div className="h-px bg-border/40 mx-2 my-1"></div>

          {/* Submenu items */}
          <div className="py-1">
            {menuCategories
              .flatMap((category) => category.items)
              .find((item) => item.title === hoveredMenu)
              ?.submenu?.map((subitem) => {
                const isSubActive = pathname === subitem.href
                return (
                  <a
                    key={subitem.title}
                    href={subitem.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-1.5 text-sm transition-colors submenu-item",
                      isSubActive ? "bg-primary/10 text-primary" : "text-adaptive hover:bg-muted hover:text-foreground",
                    )}
                    aria-current={isSubActive ? "page" : undefined}
                  >
                    <span className="submenu-bullet"></span>
                    {subitem.title}
                  </a>
                )
              })}
          </div>
        </div>
      )}
    </TooltipProvider>
  )
}
