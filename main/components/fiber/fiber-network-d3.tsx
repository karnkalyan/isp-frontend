"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useTheme } from "next-themes"

/* ------------------------------------------------ */
/* Types */
/* ------------------------------------------------ */

type NodeType =
    | "core"
    | "olt"
    | "service-port"
    | "odf"
    | "splitter-master"
    | "splitter-slave"
    | "onu"

interface TreeNode {
    name: string
    type: NodeType
    status: "active" | "inactive" | "maintenance"
    children?: TreeNode[]
    _children?: TreeNode[]
    x0?: number
    y0?: number
    id?: string
}

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

const genId = () => Math.random().toString(36).slice(2)

const rand = (p: number) => Math.random() < p

/* ------------------------------------------------ */
/* RANDOM SPLITTER CHAIN GENERATOR */
/* ------------------------------------------------ */

function buildBranch(
    depth: number,
    maxDepth: number,
    label: string
): TreeNode {
    // Stop condition → ONT
    if (depth >= maxDepth || rand(0.5)) {
        return {
            name: `ONT-${label}`,
            type: "onu",
            status: rand(0.2) ? "inactive" : "active"
        }
    }

    // Continue splitting
    return {
        name: `Slave Splitter (${label})`,
        type: "splitter-slave",
        status: "active",
        children: Array.from({ length: rand(0.5) ? 2 : 4 }, (_, i) =>
            buildBranch(depth + 1, maxDepth, `${label}.${i + 1}`)
        )
    }
}

/* ------------------------------------------------ */
/* BUILD CORRECT GPON TOPOLOGY */
/* ------------------------------------------------ */

function buildTopology(): TreeNode {
    return {
        name: "ISP Core Network",
        type: "core",
        status: "active",
        children: [
            {
                name: "OLT-01 (Huawei MA5800)",
                type: "olt",
                status: "active",
                children: Array.from({ length: 16 }, (_, p) => ({
                    name: `PON Port ${p + 1}`,
                    type: "service-port",
                    status: "active",
                    children: [
                        {
                            name: `ODF Port ${p + 1}`,
                            type: "odf",
                            status: "active",
                            children: [
                                {
                                    name: `Master Splitter L1 (2:8)`,
                                    type: "splitter-master",
                                    status: "active",
                                    // Master se hamesha Slave Splitters niklenge
                                    children: Array.from({ length: 8 }, (_, s) => ({
                                        name: `Slave Splitter L2 (S${s + 1})`,
                                        type: "splitter-slave",
                                        status: "active",
                                        // Slave splitter se ONTs connect honge
                                        children: Array.from({ length: 4 }, (_, o) => ({
                                            name: `ONT-P${p + 1}-S${s + 1}-U${o + 1}`,
                                            type: "onu",
                                            status: Math.random() > 0.1 ? "active" : "inactive"
                                        }))
                                    }))
                                }
                            ]
                        }
                    ]
                }))
            }
        ]
    }
}

/* ------------------------------------------------ */
/* Component */
/* ------------------------------------------------ */

export function NetworkTopologyD3() {
    const svgRef = useRef<SVGSVGElement>(null)
    const gRef = useRef<SVGGElement | null>(null)

    const { resolvedTheme } = useTheme()
    const dark = resolvedTheme === "dark"

    const [data, setData] = useState<TreeNode>(() => buildTopology())

    useEffect(() => {
        if (!svgRef.current) return

        const width = 2000
        const dx = 90
        const dy = 320

        d3.select(svgRef.current).selectAll("*").remove()

        const svg = d3
            .select(svgRef.current)
            .attr("viewBox", [-120, -120, width, 1100])
            .style("font", "12px sans-serif")
            .call(
                d3.zoom<SVGSVGElement, unknown>().on("zoom", e => {
                    d3.select(gRef.current).attr("transform", e.transform)
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

            const node = gNode.selectAll("g")
                .data(nodes, d => d.id || (d.id = genId()))

            const nodeEnter = node.enter()
                .append("g")
                .attr("transform", `translate(${source.y0},${source.x0})`)
                .on("click", (_, d) => {
                    d.children ? (d._children = d.children, d.children = null)
                        : (d.children = d._children, d._children = null)
                    update(d)
                })

            nodeEnter.append("circle")
                .attr("r", 8)
                .attr("fill", d => d._children ? color(d.data.type) : "#fff")
                .attr("stroke", d => color(d.data.type))
                .attr("stroke-width", 2)

            nodeEnter.append("text")
                .attr("dy", "0.32em")
                .attr("x", d => d._children ? -14 : 14)
                .attr("text-anchor", d => d._children ? "end" : "start")
                .text(d => d.data.name)
                .attr("fill", dark ? "#e5e7eb" : "#0f172a")

            node.merge(nodeEnter)
                .transition().duration(300)
                .attr("transform", d => `translate(${d.y},${d.x})`)

            node.exit()
                .transition().duration(300)
                .attr("transform", `translate(${source.y},${source.x})`)
                .remove()

            const link = gLink.selectAll("path")
                .data(links, d => d.target.id)

            link.enter()
                .append("path")
                .attr("stroke", dark ? "#475569" : "#cbd5e1")
                .attr("d", () => diagonal(source, source))
                .merge(link as any)
                .transition().duration(300)
                .attr("d", d => diagonal(d.source, d.target))

            link.exit()
                .transition().duration(300)
                .attr("d", () => diagonal(source, source))
                .remove()

            root.eachBefore(d => {
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

        function diagonal(s: any, d: any) {
            return `
        M ${s.y} ${s.x}
        C ${(s.y + d.y) / 2} ${s.x},
          ${(s.y + d.y) / 2} ${d.x},
          ${d.y} ${d.x}
      `
        }

        update(root)
    }, [data, dark])

    return (
        <Card>
            <CardHeader className="flex justify-between">
                <CardTitle>GPON Physical Topology (Field Accurate)</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setData(buildTopology())}>
                    <RefreshCw size={14} className="mr-2" /> Randomize
                </Button>
            </CardHeader>
            <CardContent>
                <svg ref={svgRef} className="w-full h-[1000px] bg-muted rounded-lg" />
            </CardContent>
        </Card>
    )
}

/* ------------------------------------------------ */
/* Colors */
/* ------------------------------------------------ */

function color(type: NodeType) {
    return {
        core: "#ec4899",
        olt: "#3b82f6",
        "service-port": "#6366f1",
        odf: "#64748b",
        "splitter-master": "#f59e0b",
        "splitter-slave": "#d97706",
        onu: "#10b981"
    }[type]
}
