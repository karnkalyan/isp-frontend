"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Mail, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContainer } from "@/components/ui/card-container"
import { Checkbox } from "@/components/ui/checkbox"
import { useTheme } from "next-themes"

/**
 * Helper to get the correct API URL based on the current browser domain
 */
const getDynamicApiUrl = (endpoint: string) => {
  const hostname = typeof window !== "undefined" ? window.location.hostname : ""
  let base = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.cms.arrownet.com.np"

  if (hostname.includes("namaste.net.np")) {
    base = "https://api.radius.namaste.net.np"
  } else if (hostname.includes("kisan.net.np")) {
    base = "https://api.radius.kisan.net.np"
  }
  else if (hostname.includes("arrownet.com.np")) {
    base = "https://api.cms.arrownet.com.np"
  }

  return `${base}${endpoint}`
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  const googleButtonRef = useRef<HTMLDivElement>(null)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const handleAuthSuccess = (data: any) => {
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user))
    }
    toast.success("Signed in successfully!")
    // Small delay to ensure cookies are settled before redirecting
    setTimeout(() => router.push("/dashboard/overview"), 150)
  }

  const handleAuthError = (err: any, toastId?: string) => {
    if (toastId) toast.dismiss(toastId)
    const message = err.message || "An unknown error occurred."
    toast.error(message)
    setError(message)
    setIsLoading(false)
  }

  const handleGoogleSignIn = async (credentialResponse: any) => {
    setIsLoading(true)
    setError(null)
    const toastId = toast.loading("Verifying with Google...")

    try {
      // DYNAMIC URL APPLIED HERE
      const res = await fetch(getDynamicApiUrl("/auth/google"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: credentialResponse.credential }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Google login failed")

      toast.dismiss(toastId)
      handleAuthSuccess(data)
    } catch (err: any) {
      handleAuthError(err, toastId)
    }
  }

  useEffect(() => {
    if (!googleClientId) {
      console.error("Google Client ID is missing.");
      return;
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => {
      if ((window as any).google && googleButtonRef.current) {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleSignIn,
        });
        (window as any).google.accounts.id.renderButton(googleButtonRef.current, {
          theme: isDarkMode ? "filled_black" : "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          width: "190",
        });
      }
    }
    document.body.appendChild(script)
    return () => {
      const scriptElement = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (scriptElement) document.body.removeChild(scriptElement);
    }
  }, [isDarkMode, googleClientId])



  const handleAdminLogin = async () => {
    setError(null)
    setIsLoading(true)
    const toastId = toast.loading("Signing in as Admin...")

    try {
      const res = await fetch(getDynamicApiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: "karnkalyan@gmail.com",
          password: "kalyan_vickey",
          rememberMe: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Admin login failed")

      toast.dismiss(toastId)
      handleAuthSuccess(data)
    } catch (err: any) {
      handleAuthError(err, toastId)
    }
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const toastId = toast.loading("Signing in...")

    try {
      // DYNAMIC URL APPLIED HERE
      const res = await fetch(getDynamicApiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData, rememberMe }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Login failed")

      toast.dismiss(toastId)
      handleAuthSuccess(data)
    } catch (err: any) {
      handleAuthError(err, toastId)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="relative w-[450px]">
      <div className="absolute -left-4 -top-4 w-32 h-32 bg-gradient-to-br from-primary to-primary-foreground rounded-full opacity-20 blur-xl"></div>
      <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-gradient-to-tl from-primary to-primary-foreground rounded-full opacity-20 blur-xl"></div>

      <CardContainer
        title="Sign In"
        gradientColor="#10b981"
        forceDarkMode={isDarkMode}
        className="rounded-xl shadow-lg backdrop-blur-sm bg-white/80 dark:bg-black/40 border border-white/10 z-10 relative px-8 py-6"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-normal">Email</Label>
            <div className="relative">
              <Input id="email" name="email" type="email" placeholder="name@example.com" required value={formData.email} onChange={handleChange} className="bg-card/60 border-border/50 pl-10 rounded-lg" disabled={isLoading} />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="font-normal">Password</Label>
              <Button variant="link" type="button" className="p-0 h-auto text-xs text-primary" onClick={() => router.push("/forgot-password")}>Forgot password?</Button>
            </div>
            <div className="relative">
              <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" required value={formData.password} onChange={handleChange} className="bg-card/60 border-border/50 pl-4 pr-10 rounded-lg" disabled={isLoading} />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
            <Label htmlFor="remember" className="text-sm font-medium cursor-pointer">Remember me for 30 days</Label>
          </div>

          <Button type="submit" className="w-full rounded-lg bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white" disabled={isLoading}>
            {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>) : ("Sign in")}
          </Button>


          {/* <Button
            type="button" // IMPORTANT: prevent default form submit
            className="w-full rounded-lg bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
            onClick={handleAdminLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : (
              "Admin Login"
            )}
          </Button> */}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60"></div></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card/60 px-4 py-1 rounded-full text-muted-foreground border border-border/30">Or continue with</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <div ref={googleButtonRef}></div>
            </div>
          </div>
        </form>
      </CardContainer>
    </div>
  )
}