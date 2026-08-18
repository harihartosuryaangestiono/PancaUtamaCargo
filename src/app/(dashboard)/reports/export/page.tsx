'use client'

import React, { useState } from 'react'
import { exportDataCsvAction } from '@/app/actions/exportActions'
import { FileSpreadsheet, Download, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ExportCenterPage() {
  const [downloading, setDownloading] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleExport(type: 'financial' | 'shipment' | 'fuel' | 'maintenance' | 'tire' | 'sparepart' | 'fleet', label: string) {
    setDownloading(type)
    setSuccess(null)

    try {
      const csvData = await exportDataCsvAction(type)
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `PancaUtamaCargo_${type}_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setSuccess(`Laporan CSV ${label} berhasil diunduh.`)
    } catch (err: any) {
      console.error(err)
    } finally {
      setDownloading(null)
    }
  }

  const exportOptions: Array<{
    type: 'financial' | 'shipment' | 'fuel' | 'maintenance' | 'tire' | 'sparepart' | 'fleet'
    title: string
    description: string
    color: string
  }> = [
    {
      type: 'financial',
      title: 'Laporan Keuangan & Jurnal Transaksi',
      description: 'Seluruh transaksi pemasukan, pengeluaran, kategori, dan metode pembayaran.',
      color: 'bg-[#34C759]/10 text-[#248A3D] border-[#34C759]/20',
    },
    {
      type: 'shipment',
      title: 'Laporan Surat Jalan & Cargo Shipment',
      description: 'Detail pengiriman cargo, nopol truck, driver, pendapatan, dan total cost.',
      color: 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20',
    },
    {
      type: 'fuel',
      title: 'Laporan BBM & Konsumsi Tangki',
      description: 'Catatan pengisian BBM Double Tank, liter, biaya, Odometer KM, dan SPBU.',
      color: 'bg-[#FF9500]/10 text-[#C67300] border-[#FF9500]/20',
    },
    {
      type: 'maintenance',
      title: 'Laporan Maintenance & Bengkel',
      description: 'Riwayat servis rutin, perbaikan, labor cost, sparepart cost, dan total biaya.',
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    },
    {
      type: 'tire',
      title: 'Laporan Inventaris & Lifecycle Ban',
      description: 'Nomor seri ban, brand, ukuran, status, posisi roda terpasang, dan KM usage.',
      color: 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20',
    },
    {
      type: 'sparepart',
      title: 'Laporan Stok Sparepart & Inventaris',
      description: 'Daftar sparepart, part number, stok saat ini, min stok, dan estimasi nilai barang.',
      color: 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20',
    },
    {
      type: 'fleet',
      title: 'Laporan Performa & Statistik Fleet',
      description: 'Ringkasan total jarak tempuh, jumlah pengiriman, dan biaya operasional per truck.',
      color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    },
  ]

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>

        <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 uppercase tracking-wider">
                EXPORT CENTER
              </span>
            </div>
            <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">Export Data Real Database (CSV)</h2>
            <p className="text-xs text-[#6E6E73] mt-1">
              Unduh data operasional dan keuangan resmi Panca Utama Cargo dalam format CSV standar.
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center border border-[#007AFF]/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/20 text-[#248A3D] text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {exportOptions.map((opt) => (
          <div
            key={opt.type}
            className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold border ${opt.color}`}>
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[#1D1D1F]">{opt.title}</h3>
              <p className="text-xs text-[#6E6E73]">{opt.description}</p>
            </div>

            <button
              onClick={() => handleExport(opt.type, opt.title)}
              disabled={downloading === opt.type}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F5F5F7] border border-black/[0.08] hover:bg-[#007AFF] hover:text-white transition-all text-xs font-semibold text-[#1D1D1F] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading === opt.type ? 'Menyiapkan CSV...' : 'Download CSV File'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
