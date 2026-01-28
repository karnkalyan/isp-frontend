"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react"

export function NetworkTopology() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeView, setActiveView] = useState("logical")
  const [zoom, setZoom] = useState(1)

  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), [])

  const isDarkMode = !mounted ? true : resolvedTheme === "dark"

  // Draw network topology on canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set colors based on theme
    const bgColor = isDarkMode ? "#0f172a" : "#f8fafc"
    const lineColor = isDarkMode ? "#334155" : "#cbd5e1"
    const nodeStrokeColor = isDarkMode ? "#475569" : "#94a3b8"
    const textColor = isDarkMode ? "#e2e8f0" : "#334155"
    const routerColor = "#3b82f6"
    const switchColor = "#10b981"
    const clientColor = "#8b5cf6"

    // Fill background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Apply zoom
    ctx.save()
    ctx.scale(zoom, zoom)
    ctx.translate((canvas.width / zoom - canvas.width) / -2, (canvas.height / zoom - canvas.height) / -2)

    // Draw network topology based on active view
    if (activeView === "logical") {
      // Draw logical view
      drawLogicalView(
        ctx,
        canvas.width,
        canvas.height,
        lineColor,
        nodeStrokeColor,
        routerColor,
        switchColor,
        clientColor,
        textColor,
      )
    } else {
      // Draw physical view
      drawPhysicalView(
        ctx,
        canvas.width,
        canvas.height,
        lineColor,
        nodeStrokeColor,
        routerColor,
        switchColor,
        clientColor,
        textColor,
      )
    }

    ctx.restore()
  }, [canvasRef, activeView, zoom, isDarkMode])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth
        canvasRef.current.height = canvasRef.current.offsetHeight
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const drawLogicalView = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    lineColor: string,
    nodeStrokeColor: string,
    routerColor: string,
    switchColor: string,
    clientColor: string,
    textColor: string,
  ) => {
    // Draw core router at center
    const centerX = width / 2
    const centerY = height / 2

    // Draw core router
    drawNode(ctx, centerX, centerY, 40, routerColor, nodeStrokeColor, "Core Router", textColor)

    // Draw switches
    const switchCount = 4
    const radius = 150
    for (let i = 0; i < switchCount; i++) {
      const angle = (i * 2 * Math.PI) / switchCount
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      // Draw line from router to switch
      ctx.beginPath()
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 2
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()

      // Draw switch
      drawNode(ctx, x, y, 30, switchColor, nodeStrokeColor, `Switch ${i + 1}`, textColor)

      // Draw clients for each switch
      const clientCount = 3
      const clientRadius = 80
      for (let j = 0; j < clientCount; j++) {
        const clientAngle = angle + ((j - 1) * Math.PI) / 6
        const clientX = x + clientRadius * Math.cos(clientAngle)
        const clientY = y + clientRadius * Math.sin(clientAngle)

        // Draw line from switch to client
        ctx.beginPath()
        ctx.strokeStyle = lineColor
        ctx.lineWidth = 1
        ctx.moveTo(x, y)
        ctx.lineTo(clientX, clientY)
        ctx.stroke()

        // Draw client
        drawNode(
          ctx,
          clientX,
          clientY,
          20,
          clientColor,
          nodeStrokeColor,
          `Client ${i * clientCount + j + 1}`,
          textColor,
        )
      }
    }
  }

  const drawPhysicalView = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    lineColor: string,
    nodeStrokeColor: string,
    routerColor: string,
    switchColor: string,
    clientColor: string,
    textColor: string,
  ) => {
    // Draw building outline
    ctx.beginPath()
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 2
    ctx.rect(width * 0.1, height * 0.1, width * 0.8, height * 0.8)
    ctx.stroke()

    // Draw floors/rooms
    ctx.beginPath()
    ctx.moveTo(width * 0.1, height * 0.4)
    ctx.lineTo(width * 0.9, height * 0.4)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(width * 0.1, height * 0.7)
    ctx.lineTo(width * 0.9, height * 0.7)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(width * 0.5, height * 0.1)
    ctx.lineTo(width * 0.5, height * 0.9)
    ctx.stroke()

    // Draw server room
    ctx.fillStyle = isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.1)"
    ctx.fillRect(width * 0.6, height * 0.15, width * 0.25, height * 0.2)
    ctx.fillStyle = textColor
    ctx.font = "12px sans-serif"
    ctx.fillText("Server Room", width * 0.65, height * 0.25)

    // Draw devices
    // Core router in server room
    drawNode(ctx, width * 0.7, height * 0.25, 30, routerColor, nodeStrokeColor, "Core Router", textColor)

    // Switches on each floor
    drawNode(ctx, width * 0.3, height * 0.25, 25, switchColor, nodeStrokeColor, "Switch 1", textColor)
    drawNode(ctx, width * 0.3, height * 0.55, 25, switchColor, nodeStrokeColor, "Switch 2", textColor)
    drawNode(ctx, width * 0.3, height * 0.8, 25, switchColor, nodeStrokeColor, "Switch 3", textColor)

    // Clients
    drawNode(ctx, width * 0.2, height * 0.2, 15, clientColor, nodeStrokeColor, "Client 1", textColor)
    drawNode(ctx, width * 0.4, height * 0.2, 15, clientColor, nodeStrokeColor, "Client 2", textColor)
    drawNode(ctx, width * 0.2, height * 0.5, 15, clientColor, nodeStrokeColor, "Client 3", textColor)
    drawNode(ctx, width * 0.4, height * 0.5, 15, clientColor, nodeStrokeColor, "Client 4", textColor)
    drawNode(ctx, width * 0.2, height * 0.8, 15, clientColor, nodeStrokeColor, "Client 5", textColor)
    drawNode(ctx, width * 0.4, height * 0.8, 15, clientColor, nodeStrokeColor, "Client 6", textColor)

    // Draw connections
    // Router to switches
    ctx.beginPath()
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 2
    ctx.moveTo(width * 0.7, height * 0.25)
    ctx.lineTo(width * 0.3, height * 0.25)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(width * 0.7, height * 0.25)
    ctx.lineTo(width * 0.7, height * 0.55)
    ctx.lineTo(width * 0.3, height * 0.55)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(width * 0.7, height * 0.55)
    ctx.lineTo(width * 0.7, height * 0.8)
    ctx.lineTo(width * 0.3, height * 0.8)
    ctx.stroke()

    // Switches to clients
    ctx.beginPath()
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1
    ctx.moveTo(width * 0.3, height * 0.25)
    ctx.lineTo(width * 0.2, height * 0.2)
    ctx.moveTo(width * 0.3, height * 0.25)
    ctx.lineTo(width * 0.4, height * 0.2)
    ctx.moveTo(width * 0.3, height * 0.55)
    ctx.lineTo(width * 0.2, height * 0.5)
    ctx.moveTo(width * 0.3, height * 0.55)
    ctx.lineTo(width * 0.4, height * 0.5)
    ctx.moveTo(width * 0.3, height * 0.8)
    ctx.lineTo(width * 0.2, height * 0.8)
    ctx.moveTo(width * 0.3, height * 0.8)
    ctx.lineTo(width * 0.4, height * 0.8)
    ctx.stroke()
  }

  const drawNode = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    fillColor: string,
    strokeColor: string,
    label: string,
    textColor: string,
  ) => {
    // Draw circle
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = fillColor
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = strokeColor
    ctx.stroke()

    // Draw label
    ctx.fillStyle = textColor
    ctx.font = `${radius / 2}px sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // If label is too long, truncate it
    let displayLabel = label
    const maxWidth = radius * 1.8
    if (ctx.measureText(label).width > maxWidth) {
      // Truncate and add ellipsis
      let truncated = ""
      for (let i = 0; i < label.length; i++) {
        const testLabel = label.substring(0, i) + "..."
        if (ctx.measureText(testLabel).width > maxWidth) {
          break
        }
        truncated = testLabel
      }
      displayLabel = truncated
    }

    ctx.fillText(displayLabel, x, y)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5))
  }

  const handleReset = () => {
    setZoom(1)
  }

  return (
    <CardContainer
      title="Network Topology"
      description="Visual representation of your network infrastructure"
      forceDarkMode={!mounted}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-between">
          <Tabs value={activeView} onValueChange={setActiveView} className="w-auto">
            <TabsList className={isDarkMode ? "bg-slate-800" : "bg-slate-100"}>
              <TabsTrigger value="logical">Logical View</TabsTrigger>
              <TabsTrigger value="physical">Physical View</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              className={
                isDarkMode
                  ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200"
                  : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
              }
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className={
                isDarkMode
                  ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200"
                  : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
              }
            >
              {Math.round(zoom * 100)}%
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              className={
                isDarkMode
                  ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200"
                  : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
              }
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={
                isDarkMode
                  ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200"
                  : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
              }
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          className={`relative border rounded-md overflow-hidden ${
            isDarkMode ? "border-slate-800" : "border-slate-200"
          }`}
          style={{ height: "500px" }}
        >
          <canvas ref={canvasRef} className="w-full h-full" />

          <div className={`absolute bottom-4 left-4 p-3 rounded-md ${isDarkMode ? "bg-slate-900/80" : "bg-white/80"}`}>
            <div className="text-sm font-medium mb-2">Legend</div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>Router</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>Switch</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>Client</span>
            </div>
          </div>
        </div>
      </div>
    </CardContainer>
  )
}
