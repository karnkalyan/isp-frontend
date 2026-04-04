"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContainer } from "@/components/ui/card-container"
import { useTheme } from "next-themes"

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState("")
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API request
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 1500)
  }

  return (
    <CardContainer
      title="Reset Password"
      gradientColor={isDarkMode ? "#10b981" : "#10b981"}
      forceDarkMode={isDarkMode}
      className="rounded-xl shadow-lg"
    >
      {!isSubmitted ? (
        <>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-normal">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-card border-border pl-10 rounded-lg"
                  disabled={isLoading}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Button
              type="submit"
              className={`w-full rounded-lg ${isDarkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-600 hover:bg-green-700"}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        </>
      ) : (
        <div className="text-center py-4">
          <div className="flex justify-center mb-4">
            <CheckCircle className={`h-12 w-12 ${isDarkMode ? "text-green-400" : "text-green-600"}`} />
          </div>
          <h3 className="text-lg font-medium mb-2">Check your email</h3>
          <p className="text-sm text-muted-foreground mb-6">
            We've sent a password reset link to <span className="font-medium">{email}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            If you don't see it, check your spam folder or request another link.
          </p>
        </div>
      )}
      <div className="mt-6">
        <Link
          href="/login"
          className={`flex items-center justify-center text-sm font-medium ${
            isDarkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-700"
          }`}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Link>
      </div>
    </CardContainer>
  )
}
