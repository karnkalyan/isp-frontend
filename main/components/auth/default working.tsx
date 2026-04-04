"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Mail, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContainer } from "@/components/ui/card-container"
import { Checkbox } from "@/components/ui/checkbox"
import { useTheme } from "next-themes"

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

  useEffect(() => {
    // Force apply theme based on system preference or stored preference
    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const isDarkMode = darkModeMediaQuery.matches || localStorage.getItem("theme") === "dark"

    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const toastId = toast.loading("Signing in...")

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...formData, rememberMe }),
        }
      )
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      // Save user info to localStorage (or wherever you want)
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      toast.dismiss(toastId);
      toast.success("Signed in successfully!");
      setTimeout(() => router.push("/dashboard/overview"), 100);
      
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err.message)
      setError(err.message)
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="relative w-[450px]">
      {/* Top left gradient */}
      <div className="absolute -left-4 -top-4 w-32 h-32 bg-gradient-to-br from-primary to-primary-foreground rounded-full opacity-20 blur-xl"></div>

      {/* Bottom right gradient */}
      <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-gradient-to-tl from-primary to-primary-foreground rounded-full opacity-20 blur-xl"></div>

      <CardContainer
        title="Sign In"
        gradientColor={isDarkMode ? "#10b981" : "#10b981"}
        forceDarkMode={isDarkMode}
        className="rounded-xl shadow-lg backdrop-blur-sm bg-white/80 dark:bg-black/40 border border-white/10 z-10 relative px-8 py-6"
      >
        {/* {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )} */}

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
                value={formData.email}
                onChange={handleChange}
                className="bg-card/60 backdrop-blur-sm border-border/50 pl-10 rounded-lg"
                disabled={isLoading}
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="font-normal">
                Password
              </Label>
              <Button
                variant="link"
                type="button"
                className={`p-0 h-auto text-xs ${isDarkMode ? "text-primary hover:text-primary/90" : "text-primary hover:text-primary/90"}`}
                onClick={() => router.push("/forgot-password")}
              >
                Forgot password?
              </Button>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="bg-card/60 backdrop-blur-sm border-border/50 pl-4 pr-10 rounded-lg"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <Label htmlFor="remember" className="text-sm font-medium leading-none cursor-pointer select-none">
              Remember me for 30 days
            </Label>
          </div>

          <Button
            type="submit"
            className={`w-full rounded-lg ${
              isDarkMode
                ? "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                : "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white"
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card/60 backdrop-blur-sm px-4 py-1 rounded-full text-muted-foreground border border-border/30">
                  Or continue with
                </span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                type="button"
                disabled={isLoading}
                className="bg-card/60 backdrop-blur-sm rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-80 transition-all border-border/50"
                onClick={() => toast.error("Google login not configured")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="h-5 w-5">
                  <path
                    fill="#EA4335"
                    d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"
                  />
                  <path
                    fill="#34A853"
                    d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2970142 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"
                  />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                type="button"
                disabled={isLoading}
                className="bg-card/60 backdrop-blur-sm rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-80 transition-all border-border/50"
                onClick={() => toast.error("Microsoft login not configured")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" width="23" height="23" className="h-5 w-5">
                  <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                Microsoft
              </Button>
            </div>
          </div>
        </form>
      </CardContainer>
    </div>
  )
}
