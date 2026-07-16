import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { OntInventory } from "@/components/fiber/ont-inventory"
export default function OntsPage() { return <DashboardLayout><div className="w-full space-y-3"><div><h1 className="text-2xl font-semibold">ONU / ONT Inventory</h1><p className="text-sm text-muted-foreground">Live synchronized optical inventory and customer assignment status.</p></div><OntInventory /></div></DashboardLayout> }
