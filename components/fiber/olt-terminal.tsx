"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Terminal, 
  Send, 
  X, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Copy,
  History,
  Command,
  Server
} from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"

interface OLT {
  id: string
  name: string
  ipAddress: string
  sshConfig: {
    host: string
    port: number
    username: string
  }
}

interface TerminalProps {
  olt: OLT
  isOpen: boolean
  onClose: () => void
}

export function OLTTerminal({ olt, isOpen, onClose }: TerminalProps) {
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    `Connecting to ${olt.name} (${olt.sshConfig.host}) via SSH...`,
    `Username: ${olt.sshConfig.username}`,
    `Port: ${olt.sshConfig.port}`,
    ""
  ])
  const [terminalInput, setTerminalInput] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalOutput])

  // Focus input on mount
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Connect to terminal
  const connectTerminal = async () => {
    if (isConnecting || isConnected) return
    
    setIsConnecting(true)
    addOutput("Establishing SSH connection...")
    
    try {
      const response = await apiRequest<{
        success: boolean
        sessionId: string
        message: string
        initialOutput: string
      }>(`/olt/${olt.id}/terminal/connect`, {
        method: "POST",
        body: JSON.stringify({ protocol: "ssh" })
      })
      
      if (response.success) {
        setSessionId(response.sessionId)
        setIsConnected(true)
        addOutput("✅ Connected successfully!")
        addOutput(response.initialOutput)
        toast.success("Terminal connected")
      }
    } catch (error: any) {
      addOutput(`❌ Connection failed: ${error.message}`)
      toast.error("Failed to connect to terminal")
    } finally {
      setIsConnecting(false)
    }
  }

  // Disconnect terminal
  const disconnectTerminal = async () => {
    if (!sessionId) return
    
    try {
      await apiRequest(`/olt/${olt.id}/terminal/close`, {
        method: "POST",
        body: JSON.stringify({ sessionId })
      })
    } catch (error) {
      console.error("Failed to close session:", error)
    }
    
    setSessionId(null)
    setIsConnected(false)
    addOutput("Disconnected from terminal.")
  }

  // Send command
  const sendCommand = async (command: string) => {
    if (!command.trim() || !isConnected || !sessionId) return
    
    // Add to history
    if (commandHistory[0] !== command) {
      setCommandHistory(prev => [command, ...prev.slice(0, 9)])
    }
    setHistoryIndex(-1)
    
    // Add command to output
    addOutput(`$ ${command}`)
    setTerminalInput("")
    
    try {
      const response = await apiRequest<{
        success: boolean
        output: string
        timestamp: string
      }>(`/olt/${olt.id}/terminal/command`, {
        method: "POST",
        body: JSON.stringify({ 
          command: command.trim(),
          sessionId
        })
      })
      
      if (response.success) {
        addOutput(response.output)
      } else {
        addOutput(`Error: Command execution failed`)
      }
    } catch (error: any) {
      addOutput(`Error: ${error.message || "Failed to execute command"}`)
    }
  }

  // Helper to add output
  const addOutput = (text: string) => {
    setTerminalOutput(prev => [...prev, text])
  }

  // Handle key presses
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && terminalInput.trim()) {
      sendCommand(terminalInput.trim())
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : 0
        setHistoryIndex(newIndex)
        setTerminalInput(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setTerminalInput(commandHistory[newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setTerminalInput("")
      }
    }
  }

  // Common commands
  const commonCommands = [
    { cmd: "display version", desc: "Show OLT version" },
    { cmd: "display board", desc: "Show service boards" },
    { cmd: "display cpu-usage", desc: "Show CPU usage" },
    { cmd: "display memory-usage", desc: "Show memory usage" },
    { cmd: "display ont info 0/1/1 all", desc: "Show ONTs on port 0/1/1" },
    { cmd: "display interface gpon 0/1/1", desc: "Show GPON interface info" },
    { cmd: "display temperature", desc: "Show temperature" },
    { cmd: "display alarm active", desc: "Show active alarms" }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Terminal className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  SSH Terminal - {olt.name}
                  <Badge variant={isConnected ? "default" : "outline"} className={isConnected ? "bg-green-500" : ""}>
                    {isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {olt.sshConfig.host}:{olt.sshConfig.port} • {olt.sshConfig.username}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Terminal Output */}
          <div 
            ref={terminalRef}
            className="flex-1 font-mono text-sm bg-black text-green-400 p-4 rounded-lg overflow-y-auto"
            style={{ 
              fontFamily: "'Courier New', monospace",
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {terminalOutput.map((line, index) => (
              <div key={index} className="mb-1">
                {line}
              </div>
            ))}
            {!isConnected && !isConnecting && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>Click "Connect" to establish SSH connection</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Command Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400">$</span>
                <Input
                  ref={inputRef}
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isConnected ? "Type command and press Enter..." : "Connect to start..."}
                  className="font-mono pl-8"
                  disabled={!isConnected}
                />
              </div>
              <Button 
                onClick={() => terminalInput.trim() && sendCommand(terminalInput.trim())}
                disabled={!isConnected || !terminalInput.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
            
            {/* Status Bar */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>Session: {sessionId ? sessionId.substring(0, 8) + "..." : "Not connected"}</span>
                <span>Commands: {commandHistory.length}</span>
                <span>Press ↑/↓ for history</span>
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Button variant="outline" size="sm" onClick={disconnectTerminal}>
                    <X className="h-3 w-3 mr-1" />
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={connectTerminal}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Terminal className="h-3 w-3 mr-1" />
                        Connect
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Common Commands */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Command className="h-4 w-4" />
              <Label>Common Commands</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {commonCommands.map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTerminalInput(item.cmd)
                    if (isConnected) {
                      setTimeout(() => inputRef.current?.focus(), 10)
                    }
                  }}
                  disabled={!isConnected}
                  className="text-xs"
                >
                  {item.cmd}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTerminalOutput([])
                addOutput("Terminal cleared.")
                addOutput("")
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Clear Output
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const text = terminalOutput.join('\n')
                navigator.clipboard.writeText(text)
                toast.success("Terminal output copied to clipboard")
              }}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Output
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const commands = [
                  'display version',
                  'display board',
                  'display cpu-usage',
                  'display memory-usage',
                  'display temperature'
                ];
                commands.forEach((cmd, i) => {
                  setTimeout(() => {
                    setTerminalInput(cmd);
                    setTimeout(() => {
                      if (isConnected) sendCommand(cmd);
                    }, 100);
                  }, i * 1000);
                });
              }}
              disabled={!isConnected}
            >
              <Server className="h-3 w-3 mr-1" />
              Run Diagnostics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}