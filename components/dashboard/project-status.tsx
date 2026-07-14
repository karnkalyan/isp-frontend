"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

const projects = [
  {
    name: "Network Upgrade",
    completion: 75,
    color: "#10B981",
  },
  {
    name: "Customer Portal",
    completion: 45,
    color: "#10B981",
  },
  {
    name: "Billing System",
    completion: 90,
    color: "#10B981",
  },
]

export function ProjectStatus() {
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"))

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

  return (
    <Card
      className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} rounded-xl overflow-hidden relative`}
    >
      {/* Top-left corner gradient - increased size */}
      <div
        className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, #10B981 0%, transparent 70%)`,
        }}
      />

      {/* Bottom-right corner gradient - increased size */}
      <div
        className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, #10B981 0%, transparent 70%)`,
        }}
      />

      <CardHeader className={`pb-2 ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} border-b relative z-10`}>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>Project Status</CardTitle>
            <CardDescription className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
              Current project completion
            </CardDescription>
          </div>
          <button
            className={`text-sm ${isDarkMode ? "text-slate-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
          >
            •••
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4 relative z-10">
        <div className="space-y-6">
          {(projects || []).map((project, index) => (
            <motion.div
              key={project.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {project.name}
                  </span>
                  <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {project.completion}%
                  </span>
                </div>
                <div className={`h-2 ${isDarkMode ? "bg-[#1e293b]" : "bg-gray-100"} rounded-full overflow-hidden`}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: project.color,
                      boxShadow: `0 0 10px ${project.color}80`,
                      width: `${project.completion}%`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${project.completion}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-6">
          <button
            className={`w-full py-2.5 ${isDarkMode ? "bg-[#1e293b] hover:bg-[#2d3748] text-slate-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"} font-medium rounded-md transition-colors`}
          >
            View All Projects
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
