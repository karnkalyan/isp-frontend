"use client"

import { useEffect, useRef, useState } from "react"
// @ts-ignore - this project does not include local d3 type declarations.
import * as d3 from "d3"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Maximize2, Minimize2, RefreshCw } from "lucide-react"
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
        .attr("r", 8)
        .attr("fill", (d: any) => (d._children ? nodeColor(d.data) : "#fff"))
        .attr("stroke", (d: any) => nodeColor(d.data))
        .attr("stroke-width", 2)

      nodeEnter
        .append("text")
        .attr("dy", "0.32em")
        .attr("x", (d: any) => (d._children ? -14 : 14))
        .attr("text-anchor", (d: any) => (d._children ? "end" : "start"))
        .text((d: any) => d.data.name)
        .attr("fill", dark ? "#e5e7eb" : "#0f172a")

      nodeEnter
        .filter((d: any) => d.data.type === "onu")
        .append("text")
        .attr("dy", "1.7em")
        .attr("x", 14)
        .text((d: any) => `ACS: ${onlineLabel(d.data.meta?.acsStatus)} • RADIUS: ${onlineLabel(d.data.meta?.radiusStatus)}`)
        .attr("fill", (d: any) => isOnline(d.data.meta?.acsStatus) || isOnline(d.data.meta?.radiusStatus) ? "#16a34a" : "#dc2626")
        .style("font-size", "10px")

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
  }, [data, dark])

  const isEmpty = !loading && !error && (!data?.children || data.children.length === 0)

  return (
    <div ref={containerRef} className={isFullscreen ? "h-screen w-screen overflow-hidden bg-background p-0" : ""}>
    <Card className={isFullscreen ? "h-screen w-screen rounded-none border-0" : ""}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>GPON Physical Topology</CardTitle>
        <div className="flex gap-2"><Button size="sm" variant="outline" onClick={loadTopology} disabled={loading}>
          {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <RefreshCw size={14} className="mr-2" />}
          Refresh
        </Button><Button size="sm" variant="outline" onClick={toggleFullscreen}>{isFullscreen ? <Minimize2 size={14} className="mr-2" /> : <Maximize2 size={14} className="mr-2" />}{isFullscreen ? "Exit" : "Fullscreen"}</Button></div>
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
        <div className="mb-3 flex flex-wrap gap-3 text-xs"><span>Fiber core:</span>{["Blue", "Green", "Orange", "Red"].map(core => <span key={core} className="flex items-center gap-1"><i className="h-3 w-3 rounded-full" style={{ backgroundColor: coreColor(core) }} />{core}</span>)}<span className="flex items-center gap-1"><i className="h-3 w-3 rounded-full bg-green-500" />Customer online</span><span className="flex items-center gap-1"><i className="h-3 w-3 rounded-full bg-red-500" />Customer offline</span></div>
        <svg ref={svgRef} className={`${isFullscreen ? "h-[calc(100vh-120px)]" : "h-[1000px]"} w-full rounded-lg bg-muted`} />
      </CardContent>
    </Card>
    </div>
  )
}

const isOnline = (status: any) => ["online", "active", "up", "enabled"].includes(String(status || "").toLowerCase())
const onlineLabel = (status: any) => isOnline(status) ? "ONLINE" : "OFFLINE"
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
