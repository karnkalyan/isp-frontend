import { LoginForm } from "@/components/auth/login-form"
import type { Metadata } from "next"
import { Suspense } from "react"
import { BrandLogo } from "@/components/brand-logo"



export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Kashtrix"
}

export default function LoginPage() {
 
  return (
    <main className="grid min-h-screen bg-[radial-gradient(circle_at_85%_10%,rgba(74,27,122,0.10),transparent_34%),linear-gradient(135deg,#ffffff_0%,#faf7fc_100%)] dark:bg-[radial-gradient(circle_at_85%_10%,rgba(74,27,122,0.24),transparent_36%),linear-gradient(135deg,#120619_0%,#2B0D3A_100%)] lg:grid-cols-[1.1fr_.9fr]">
      <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#2B0D3A_0%,#351147_55%,#4A1B7A_100%)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <img src="/kashtrix-login-particles.png?v=2" alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover opacity-20" />
        <div aria-hidden="true" className="absolute -right-32 -top-28 size-96 rounded-full bg-[#4A1B7A]/45 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-24 size-96 rounded-full bg-[#351147]/70 blur-3xl" />
        <div className="relative z-10"><BrandLogo variant="wide" priority className="h-9 brightness-0 invert" /></div>
        <div className="relative z-10 max-w-xl"><p className="mb-5 inline-flex rounded-full border border-white/20 bg-[#4A1B7A]/45 px-3 py-1 text-xs font-medium">AI-native telecom operations</p><h1 className="font-heading text-5xl font-semibold leading-[1.12] tracking-[-.04em] text-white">One command center for networks, customers, revenue, and AI workforce.</h1><p className="mt-6 max-w-lg text-base leading-7 text-white/70">Operate your OSS/BSS with live visibility, controlled automation, and specialist AI agents built into every workflow.</p><div className="mt-10 grid grid-cols-3 gap-3">{["Network aware","Tenant isolated","Approval controlled"].map(item=><div key={item} className="rounded-xl border border-white/15 bg-[#351147]/70 p-3 text-xs text-white/80 shadow-sm backdrop-blur-sm">{item}</div>)}</div></div>
        <p className="relative z-10 text-xs text-white/40">Kashtrix · Every System. One Platform.</p>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10"><div className="w-full max-w-md"><div className="mb-8 lg:hidden"><BrandLogo variant="wide" priority className="h-9" /></div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#4A1B7A] dark:text-purple-200">Secure workspace</p><h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-[#2B0D3A] dark:text-white">Welcome back</h2><p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your operations command center.</p><div className="mt-7">
        <Suspense fallback={
          <div className="flex h-[320px] w-full flex-col items-center justify-center rounded-2xl border bg-card p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div></div></section>
    </main>
  )
}
