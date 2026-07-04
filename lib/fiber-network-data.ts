"use client"

import { apiRequest } from "@/lib/api"

export type FiberNodeType = "core" | "olt" | "service-port" | "splitter-master" | "splitter-slave" | "onu"

export interface FiberTreeNode {
  id: string
  name: string
  type: FiberNodeType
  status: "active" | "inactive" | "maintenance"
  children?: FiberTreeNode[]
  meta?: Record<string, any>
}

export interface FiberNetworkRow {
  id: string
  name: string
  type: string
  location: string
  subscribers: number
  oltCount: number
  splitterCount: number
  onuCount: number
  status: "active" | "inactive" | "maintenance"
  signalQuality: "excellent" | "good" | "fair" | "poor" | "unknown"
}

export interface FiberNetworkDataset {
  olts: any[]
  splitters: any[]
  customers: any[]
  rows: FiberNetworkRow[]
  tree: FiberTreeNode
  stats: {
    totalNetworks: number
    activeSubscribers: number
    signalQuality: string
    activeAlerts: number
  }
}

const unwrapList = (response: any) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.items)) return response.items
  return []
}

const toNumber = (value: any) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeStatus = (status?: string): "active" | "inactive" | "maintenance" => {
  const value = (status || "").toLowerCase()
  if (["online", "active", "enabled", "provisioned"].includes(value)) return "active"
  if (["maintenance", "warning"].includes(value)) return "maintenance"
  return "inactive"
}

const getCustomerName = (customer: any) => {
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim()
  return name || customer.customerUniqueId || `Customer ${customer.id}`
}

const getCustomerOnt = (customer: any) => {
  return (customer.devices || []).find((device: any) => String(device.deviceType || "").toUpperCase() === "ONT")
}

const getPrimaryService = (customer: any) => {
  return (customer.serviceDetails || []).find((detail: any) => detail.status === "active") || customer.serviceDetails?.[0] || null
}

const customerMatchesOlt = (customer: any, oltId: number) => {
  const service = getPrimaryService(customer)
  return toNumber(service?.oltId || service?.olt?.id || customer.oltId) === oltId
}

const customerMatchesSplitter = (customer: any, splitterId: number) => {
  const service = getPrimaryService(customer)
  return toNumber(service?.splitterId || service?.splitter?.id || customer.splitterId) === splitterId
}

const buildOntNode = (customer: any): FiberTreeNode => {
  const ont = getCustomerOnt(customer)
  const serial = ont?.serialNumber || ont?.serialNo || customer.customerUniqueId || customer.id
  return {
    id: `ont-${customer.id}`,
    name: `${getCustomerName(customer)} (${serial || "ONT"})`,
    type: "onu",
    status: normalizeStatus(customer.ontRealtimeStatus || ont?.status || customer.radiusRealtimeStatus || customer.status),
    meta: {
      customerId: customer.customerUniqueId,
      phone: customer.phoneNumber,
      macAddress: ont?.macAddress,
      acsStatus: customer.ontRealtimeStatus || ont?.status || "offline",
      radiusStatus: customer.radiusRealtimeStatus || customer.radiusAccounting?.status || "offline",
    },
  }
}

const splitterKeyMatches = (splitter: any, master: any) => {
  return (
    String(splitter.masterSplitterId || "") === String(master.splitterId || "") ||
    String(splitter.masterSplitterId || "") === String(master.id || "")
  )
}

function buildSplitterNode(splitter: any, allSplitters: any[], customers: any[], visited = new Set<string>()): FiberTreeNode {
  const key = String(splitter.id)
  if (visited.has(key)) {
    return {
      id: `splitter-loop-${key}`,
      name: `${splitter.name || splitter.splitterId} (linked already)`,
      type: splitter.isMaster ? "splitter-master" : "splitter-slave",
      status: normalizeStatus(splitter.status),
    }
  }

  visited.add(key)

  const childSplitters = allSplitters.filter((candidate) => splitterKeyMatches(candidate, splitter))
  const connectedCustomers = customers.filter((customer) => customerMatchesSplitter(customer, Number(splitter.id)))

  return {
    id: `splitter-${splitter.id}`,
    name: `${splitter.name || splitter.splitterId || "Splitter"}${splitter.splitRatio ? ` (${splitter.splitRatio})` : ""}`,
    type: splitter.isMaster ? "splitter-master" : "splitter-slave",
    status: normalizeStatus(splitter.status),
    meta: {
      splitterId: splitter.splitterId,
      ports: splitter.portCount,
      usedPorts: splitter.usedPorts,
      coreColor: splitter.upstreamFiber?.coreColor || "Blue",
    },
    children: [
      ...childSplitters.map((child) => buildSplitterNode(child, allSplitters, customers, new Set(visited))),
      ...connectedCustomers.map(buildOntNode),
    ].filter(Boolean),
  }
}

export function buildFiberNetworkDataset(olts: any[], splitters: any[], customers: any[]): FiberNetworkDataset {
  const splitterById = new Map(splitters.map((splitter) => [Number(splitter.id), splitter]))

  const rows = olts.map((olt) => {
    const oltId = Number(olt.id)
    const oltSplitters = splitters.filter((splitter) => toNumber(splitter.oltId || splitter.olt?.id) === oltId)
    const oltCustomers = customers.filter((customer) => customerMatchesOlt(customer, oltId))
    const ontCustomers = oltCustomers.filter((customer) => getCustomerOnt(customer))
    const activeOnts = ontCustomers.filter((customer) => normalizeStatus(getCustomerOnt(customer)?.status || customer.status) === "active").length
    const signalRatio = ontCustomers.length ? activeOnts / ontCustomers.length : null
    const splitterLocation = oltSplitters.find((splitter) => splitter.location?.site || splitter.location?.description)?.location

    return {
      id: `OLT-${olt.id}`,
      name: olt.name || `OLT ${olt.id}`,
      type: "FTTH/FTTB",
      location:
        olt.site ||
        olt.region ||
        olt.location?.site ||
        olt.location?.region ||
        splitterLocation?.site ||
        splitterLocation?.description ||
        "Unassigned",
      subscribers: oltCustomers.length,
      oltCount: 1,
      splitterCount: oltSplitters.length,
      onuCount: ontCustomers.length,
      status: normalizeStatus(olt.status),
      signalQuality:
        signalRatio === null ? "unknown" :
        signalRatio >= 0.95 ? "excellent" :
        signalRatio >= 0.8 ? "good" :
        signalRatio >= 0.6 ? "fair" : "poor",
    } satisfies FiberNetworkRow
  })

  const tree: FiberTreeNode = {
    id: "fiber-core",
    name: "ISP Fiber Network",
    type: "core",
    status: olts.some((olt) => normalizeStatus(olt.status) === "active") ? "active" : "inactive",
    children: olts.map((olt) => {
      const oltId = Number(olt.id)
      const oltSplitters = splitters.filter((splitter) => toNumber(splitter.oltId || splitter.olt?.id) === oltId)
      const childSplitterIds = new Set(
        oltSplitters
          .filter((splitter) => splitter.masterSplitterId)
          .map((splitter) => String(splitter.id))
      )
      const rootSplitters = oltSplitters.filter((splitter) => {
        if (!splitter.masterSplitterId) return true
        const master = splitters.find((candidate) => splitterKeyMatches(splitter, candidate))
        return !master || toNumber(master.oltId || master.olt?.id) !== oltId
      })
      const customersOnOlt = customers.filter((customer) => customerMatchesOlt(customer, oltId))
      const directCustomers = customersOnOlt.filter((customer) => {
        const service = getPrimaryService(customer)
        const splitterId = toNumber(service?.splitterId || service?.splitter?.id || customer.splitterId)
        return !splitterId || !splitterById.has(splitterId)
      })

      return {
        id: `olt-${olt.id}`,
        name: `${olt.name || `OLT ${olt.id}`}${olt.ipAddress ? ` (${olt.ipAddress})` : ""}`,
        type: "olt",
        status: normalizeStatus(olt.status),
        meta: {
          vendor: olt.vendor,
          model: olt.model,
          ports: olt.totalPorts,
        },
        children: [
          ...rootSplitters
            .filter((splitter) => !childSplitterIds.has(String(splitter.id)) || !splitter.masterSplitterId)
            .map((splitter) => buildSplitterNode(splitter, splitters, customers)),
          ...directCustomers.map((customer) => {
            const service = getPrimaryService(customer)
            return {
              id: `direct-port-${customer.id}`,
              name: service?.oltPort ? `OLT Port ${service.oltPort}` : "Direct OLT Connection",
              type: "service-port" as FiberNodeType,
              status: normalizeStatus(customer.status),
              children: [buildOntNode(customer)],
            }
          }),
        ],
      }
    }),
  }

  const allOntCustomers = customers.filter((customer) => getCustomerOnt(customer))
  const activeOnts = allOntCustomers.filter((customer) => normalizeStatus(getCustomerOnt(customer)?.status || customer.status) === "active").length
  const signalQuality = allOntCustomers.length ? `${Math.round((activeOnts / allOntCustomers.length) * 100)}%` : "N/A"
  const activeAlerts =
    olts.filter((olt) => normalizeStatus(olt.status) !== "active").length +
    allOntCustomers.filter((customer) => normalizeStatus(getCustomerOnt(customer)?.status || customer.status) !== "active").length

  return {
    olts,
    splitters,
    customers,
    rows,
    tree,
    stats: {
      totalNetworks: olts.length,
      activeSubscribers: customers.filter((customer) => normalizeStatus(customer.status) === "active").length,
      signalQuality,
      activeAlerts,
    },
  }
}

export async function fetchFiberNetworkDataset(): Promise<FiberNetworkDataset> {
  const [oltResponse, splitterResponse, customerResponse] = await Promise.all([
    apiRequest<any>("/olt?limit=1000"),
    apiRequest<any>("/splitters?limit=1000"),
    apiRequest<any>("/customer?limit=5000"),
  ])

  return buildFiberNetworkDataset(
    unwrapList(oltResponse),
    unwrapList(splitterResponse),
    unwrapList(customerResponse)
  )
}
