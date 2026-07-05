"use client"

import { useEffect, useMemo, useRef, useState } from "react"
// @ts-ignore - this project does not include local d3 type declarations.
import * as d3 from "d3"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Maximize2, Minimize2, RefreshCw, Search, X } from "lucide-react"
import { useTheme } from "next-themes"
import { fetchFiberNetworkDataset, type FiberTreeNode } from "@/lib/fiber-network-data"

interface TreeNode extends FiberTreeNode {
  _children?: TreeNode[]
  x0?: number
  y0?: number
}

let generatedId = 0
const genId = () => `generated-node-${generatedId++}`

export function NetworkTopologyD3() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement | null>(null)
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  const [data, setData] = useState<TreeNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const searchableNodes = useMemo(() => {
    const results: FiberTreeNode[] = []
    const visit = (node: FiberTreeNode) => {
      if (node.type === "onu" || node.type === "splitter-master" || node.type === "splitter-slave") results.push(node)
      node.children?.forEach(visit)
    }
    if (data) visit(data)
    return results
  }, [data])

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []
    return searchableNodes.filter(node => [node.name, node.meta?.splitterId, node.meta?.customerId, node.meta?.phone, node.meta?.macAddress]
      .filter(Boolean).some(value => String(value).toLowerCase().includes(query))).slice(0, 10)
  }, [searchQuery, searchableNodes])

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener("fullscreenchange", syncFullscreen)
    return () => document.removeEventListener("fullscreenchange", syncFullscreen)
  }, [])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await containerRef.current?.requestFullscreen()
  }

  const loadTopology = async () => {
    try {
      setLoading(true)
      setError(null)
      const dataset = await fetchFiberNetworkDataset()
      setData(dataset.tree)
    } catch (err: any) {
      setError(err?.message || "Failed to load topology")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTopology()
  }, [])

  useEffect(() => {
    if (!svgRef.current || !data) return

    const width = 2200
    const dx = 90
    const dy = 330

    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [-120, -120, width, 1100])
      .style("font", "12px sans-serif")
      .call(
        d3.zoom<SVGSVGElement, unknown>().on("zoom", (event: any) => {
          d3.select(gRef.current).attr("transform", event.transform)
        }) as any
      )

    const g = svg.append("g")
    gRef.current = g.node()

    const gLink = g.append("g").attr("fill", "none").attr("stroke-width", 1.4)
    const gNode = g.append("g").attr("cursor", "pointer")
    const root = d3.hierarchy(data) as any

    root.x0 = 0
    root.y0 = 0
    root.children?.forEach(collapse)

    if (selectedNodeId) {
      const findNode = (node: any): any => {
        if (node.data.id === selectedNodeId) return node
        for (const child of [...(node.children || []), ...(node._children || [])]) {
          const match = findNode(child)
          if (match) return match
        }
        return null
      }
      const selected = findNode(root)
      let ancestor = selected?.parent
      while (ancestor) {
        if (ancestor._children) {
          ancestor.children = ancestor._children
          ancestor._children = null
        }
        ancestor = ancestor.parent
      }
    }

    function update(source: any) {
      d3.tree().nodeSize([dx, dy])(root)

      const nodes = root.descendants()
      const links = root.links()

      const node = gNode.selectAll("g").data(nodes, (d: any) => d.id || (d.id = genId()))

      const nodeEnter = node
        .enter()
        .append("g")
        .attr("transform", `translate(${source.y0},${source.x0})`)
        .on("click", (_: any, d: any) => {
          if (d.children) {
            d._children = d.children
            d.children = null
          } else {
            d.children = d._children
            d._children = null
          }
          update(d)
        })

      nodeEnter
        .append("circle")
        .attr("r", (d: any) => d.data.id === selectedNodeId ? 12 : 8)
        .attr("fill", (d: any) => (d._children ? nodeColor(d.data) : "#fff"))
        .attr("stroke", (d: any) => nodeColor(d.data))
        .attr("stroke", (d: any) => d.data.id === selectedNodeId ? "#a855f7" : nodeColor(d.data))
        .attr("stroke-width", (d: any) => d.data.id === selectedNodeId ? 5 : 2)

      nodeEnter
        .append("text")
        .attr("dy", "0.32em")
        .attr("x", (d: any) => (d._children ? -14 : 14))
        .attr("text-anchor", (d: any) => (d._children ? "end" : "start"))
        .text((d: any) => d.data.name)
        .attr("fill", dark ? "#e5e7eb" : "#0f172a")

      node
        .merge(nodeEnter as any)
        .transition()
        .duration(300)
        .attr("transform", (d: any) => `translate(${d.y},${d.x})`)

      node
        .exit()
        .transition()
        .duration(300)
        .attr("transform", `translate(${source.y},${source.x})`)
        .remove()

      const link = gLink.selectAll("path").data(links, (d: any) => d.target.id)

      link
        .enter()
        .append("path")
        .attr("stroke", (d: any) => linkColor(d.target.data, dark))
        .attr("d", () => diagonal(source, source))
        .merge(link as any)
        .transition()
        .duration(300)
        .attr("d", (d: any) => diagonal(d.source, d.target))

      link.exit().transition().duration(300).attr("d", () => diagonal(source, source)).remove()

      root.eachBefore((d: any) => {
        d.x0 = d.x
        d.y0 = d.y
      })
    }

    function collapse(d: any) {
      if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
      }
    }

    function diagonal(source: any, target: any) {
      return `
        M ${source.y} ${source.x}
        C ${(source.y + target.y) / 2} ${source.x},
          ${(source.y + target.y) / 2} ${target.x},
          ${target.y} ${target.x}
      `
    }

    update(root)
  }, [data, dark, selectedNodeId])

  const isEmpty = !loading && !error && (!data?.children || data.children.length === 0)

  return (
    <div ref={containerRef} className={isFullscreen ? "h-screen w-screen overflow-hidden bg-background p-0" : ""}>
    <Card className={isFullscreen ? "h-screen w-screen rounded-none border-0" : ""}>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle>GPON Physical Topology</CardTitle>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <div className="relative min-w-[280px] flex-1 lg:w-[360px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={event => { setSearchQuery(event.target.value); setSelectedNodeId(null) }} placeholder="Search customer or splitter..." className="pl-9 pr-9" />
            {searchQuery && <button type="button" onClick={() => { setSearchQuery(""); setSelectedNodeId(null) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
            {searchQuery.trim() && !selectedNodeId && <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
              {searchResults.length ? searchResults.map(node => <button key={node.id} type="button" className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { setSelectedNodeId(node.id); setSearchQuery(node.name) }}><span className="truncate">{node.name}</span><span className="ml-3 shrink-0 text-xs text-muted-foreground">{node.type === "onu" ? "Customer" : "Splitter"}</span></button>) : <div className="px-3 py-3 text-sm text-muted-foreground">No customer or splitter found.</div>}
            </div>}
          </div>
          <div className="flex gap-2"><Button size="sm" variant="outline" onClick={loadTopology} disabled={loading}>
          {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <RefreshCw size={14} className="mr-2" />}
          Refresh
        </Button><Button size="sm" variant="outline" onClick={toggleFullscreen}>{isFullscreen ? <Minimize2 size={14} className="mr-2" /> : <Maximize2 size={14} className="mr-2" />}{isFullscreen ? "Exit" : "Fullscreen"}</Button></div></div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {isEmpty && (
          <div className="mb-3 flex h-[180px] items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
            No OLT, splitter, or ONT topology data found.
          </div>
        )}
        <div className="mb-3 flex flex-wrap gap-3 text-xs"><span>Fiber core:</span>{["Blue", "Green", "Orange", "Red"].map(core => <span key={core} className="flex items-center gap-1"><i className="h-3 w-3 rounded-full" style={{ backgroundColor: coreColor(core) }} />{core}</span>)}</div>
        <svg ref={svgRef} className={`${isFullscreen ? "h-[calc(100vh-120px)]" : "h-[1000px]"} w-full rounded-lg bg-muted`} />
      </CardContent>
    </Card>
    </div>
  )
}

const coreColor = (value: any) => ({ blue: "#2563eb", green: "#16a34a", orange: "#f97316", red: "#dc2626", yellow: "#eab308", white: "#cbd5e1", black: "#111827", brown: "#92400e", violet: "#7c3aed", pink: "#ec4899", gray: "#64748b" }[String(value || "").trim().toLowerCase()] || "#2563eb")
const nodeColor = (node: FiberTreeNode) => node.type === "onu" ? (node.status === "active" ? "#16a34a" : "#dc2626") : node.type.startsWith("splitter-") ? coreColor(node.meta?.coreColor) : color(node.type)
const linkColor = (node: FiberTreeNode, dark: boolean) => node.type.startsWith("splitter-") ? coreColor(node.meta?.coreColor) : (dark ? "#475569" : "#cbd5e1")

function color(type: FiberTreeNode["type"]) {
  return {
    core: "#ec4899",
    olt: "#3b82f6",
    "service-port": "#6366f1",
    "splitter-master": "#f59e0b",
    "splitter-slave": "#d97706",
    onu: "#10b981",
  }[type]
}
