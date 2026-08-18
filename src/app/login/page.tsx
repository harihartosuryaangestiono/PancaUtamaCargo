'use client'

import React, { useState } from 'react'
import { Lock, Mail, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')?.toString()
    const password = formData.get('password')?.toString()

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Kredensial tidak valid. Silakan periksa email & password.')
        setLoading(false)
      } else {
        window.location.href = data.redirectUrl || '/dashboard'
      }
    } catch (err: any) {
      setError('Terjadi kesalahan jaringan. Silakan coba beberapa saat lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center p-4 selection:bg-[#007AFF] selection:text-white">
      <div className="w-full max-w-md bg-white border border-black/[0.06] rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] relative">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border border-black/[0.08] bg-[#F5F5F7] shadow-2xs mb-3 p-1">
            <img
              src="/LogoPancaUtamaCargoCircular.png"
              alt="Logo Panca Utama Cargo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h1 className="text-xl font-bold text-[#1D1D1F] tracking-tight">Panca Utama Cargo</h1>
          <p className="text-xs text-[#34C759] font-bold tracking-wide mt-0.5">
            Aman · Tepat · Terpercaya
          </p>
          <p className="text-[11px] text-[#6E6E73] mt-1">
            Enterprise Fleet &amp; Financial Management System
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-[#FF3B30] text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
              <input
                type="email"
                name="email"
                required
                placeholder="nama@pancautamacargo.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-[#1D1D1F] placeholder-[#8E8E93] text-xs focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-[#1D1D1F] placeholder-[#8E8E93] text-xs focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Memproses Sign In...' : 'Sign In ke System'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-black/[0.06] pt-4">
          <p className="text-[11px] text-[#6E6E73]">
            Akses Terbatas: Owner (Hariharto) &amp; Finance (Emily)
          </p>
        </div>
      </div>
    </div>
  )
}
