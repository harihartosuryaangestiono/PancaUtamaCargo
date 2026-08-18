'use client'

import React, { useState } from 'react'
import { updateCompanySettingsAction } from '@/app/actions/settingsActions'

interface SettingsFormProps {
  settings: {
    companyName: string
    defaultTireLifetimeKm: number
    tireWarningPercent: number
    tireCriticalPercent: number
  }
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const input = {
      companyName: formData.get('companyName')?.toString(),
      defaultTireLifetimeKm: Number(formData.get('defaultTireLifetimeKm')),
      tireWarningPercent: Number(formData.get('tireWarningPercent')),
      tireCriticalPercent: Number(formData.get('tireCriticalPercent')),
    }

    const res = await updateCompanySettingsAction(input)
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setMessage('Pengaturan berhasil diperbarui. Perubahan baseline hanya berlaku untuk ban baru.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl text-[#1D1D1F]">
      {message && (
        <div className="p-3 rounded-xl bg-[#34C759]/10 text-[#248A3D] text-xs font-semibold border border-[#34C759]/20">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-semibold border border-[#FF3B30]/20">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
          Nama Perusahaan
        </label>
        <input
          type="text"
          name="companyName"
          defaultValue={settings.companyName}
          required
          className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 focus:bg-white outline-none font-medium transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
            Default Lifetime (KM)
          </label>
          <input
            type="number"
            name="defaultTireLifetimeKm"
            defaultValue={settings.defaultTireLifetimeKm}
            required
            className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 focus:bg-white outline-none font-mono font-medium transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
            Warning Alert (%)
          </label>
          <input
            type="number"
            name="tireWarningPercent"
            defaultValue={settings.tireWarningPercent}
            required
            className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 focus:bg-white outline-none font-mono font-medium transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
            Critical Alert (%)
          </label>
          <input
            type="number"
            name="tireCriticalPercent"
            defaultValue={settings.tireCriticalPercent}
            required
            className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 focus:bg-white outline-none font-mono font-medium transition-all"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-colors disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </form>
  )
}
