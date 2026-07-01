"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContainer } from "@/components/ui/card-container"

export default function ResetPasswordForm() {
  const router = useRouter(); const params = useSearchParams(); const token = params.get("token") || ""
  const [password,setPassword] = useState(""); const [confirm,setConfirm] = useState(""); const [loading,setLoading] = useState(false)
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!token) return toast.error("This reset link is invalid."); if (password.length < 8) return toast.error("Password must be at least 8 characters."); if (password !== confirm) return toast.error("Passwords do not match."); setLoading(true); try { await apiRequest("/auth/reset-password", { method:"POST", body:JSON.stringify({token,password}) }); toast.success("Password changed successfully."); router.replace("/login") } catch (error:any) { toast.error(error.message || "Unable to reset password.") } finally { setLoading(false) } }
  return <CardContainer title="Choose New Password" gradientColor="#10b981"><form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="password">New password</Label><Input id="password" type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8}/></div><div className="space-y-2"><Label htmlFor="confirmPassword">Confirm password</Label><Input id="confirmPassword" type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={8}/></div><Button type="submit" className="w-full" disabled={loading || !token}>{loading ? "Changing Password..." : "Change Password"}</Button>{!token && <p className="text-sm text-destructive">The reset token is missing.</p>}<Link href="/login" className="block text-center text-sm text-primary hover:underline">Back to login</Link></form></CardContainer>
}
