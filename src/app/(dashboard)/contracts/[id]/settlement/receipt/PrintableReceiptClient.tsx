'use client'

import React from 'react'
import Link from 'next/link'
import { formatCurrency, formatKm } from '@/lib/utils/format'
import { Printer, ArrowLeft, Download, CheckCircle2 } from 'lucide-react'

interface PrintableReceiptClientProps {
  contract: any
}

export function PrintableReceiptClient({ contract }: PrintableReceiptClientProps) {
  function handlePrint() {
    window.print()
  }

  // Calculate ERP details
  const erp1 = contract.legs.find((l: any) => l.legNumber === 1) || contract.legs[0]
  const erp2 = contract.legs.find((l: any) => l.legNumber === 2) || contract.legs[1]

  const driverShareErp1 = Number(erp1?.contractValue || 0) * ((erp1?.driverPercentage || 53) / 100)
  const driverShareErp2 = Number(erp2?.contractValue || 0) * ((erp2?.driverPercentage || 53) / 100)
  const totalDriverShare = driverShareErp1 + driverShareErp2
  const totalCompanyToll = contract.totalCompanyToll !== undefined
    ? Number(contract.totalCompanyToll)
    : contract.legs.reduce((sum: number, l: any) => sum + Number(l.companyTollCost || 0), 0)

  const totalDriverEntitlement = totalDriverShare + totalCompanyToll
  const totalAdvances = contract.advances.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0)
  const difference = totalDriverEntitlement - totalAdvances

  const settlement = contract.settlements[0] || null

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-6">
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/contracts/${contract.id}`}
          className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Kembalikan ke Kontrak
        </Link>
        <button
          onClick={handlePrint}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Cetak / Export PDF
        </button>
      </div>

      {/* Printable Receipt Container */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Receipt Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-6">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">PANCA UTAMA CARGO</h1>
            <p className="text-xs text-slate-600 font-medium">Enterprise Fleet Operations &amp; Logistics Management</p>
            <p className="text-[11px] text-slate-500 mt-1">Jl. Raya Magelang - Jogja KM 12, Magelang • Telp: (0293) 555-123</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900">
              KUITANSI TOTALAN SUPIR
            </span>
            <p className="text-xs font-mono font-bold text-slate-700 mt-1.5">{contract.contractNumber}</p>
            <p className="text-[11px] text-slate-500">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Contract & Driver Summary */}
        <div className="grid grid-cols-2 gap-6 text-xs mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">Pengemudi (Driver)</span>
            <p className="font-bold text-sm text-slate-900">{contract.driver ? contract.driver.name : contract.driverName}</p>
            {contract.driver && <p className="text-[11px] text-slate-600 font-mono">Kode: {contract.driver.driverCode}</p>}
            {contract.driver?.licenseNumber && <p className="text-[11px] text-slate-600">SIM: {contract.driver.licenseNumber}</p>}
          </div>

          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">Unit Armada &amp; Pelanggan</span>
            <p className="font-bold text-sm text-slate-900">Truk: {contract.truck?.policeNumber}</p>
            <p className="text-[11px] text-slate-600">Pelanggan: {contract.customer?.name}</p>
            <p className="text-[11px] text-slate-600">Tanggal Kontrak: {new Date(contract.startDate).toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* ERP Legs Breakdown Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">1. Rincian Perjalanan Round-Trip (2 ERP Legs)</h3>
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                <th className="p-2.5 border-r border-slate-300">ERP Leg</th>
                <th className="p-2.5 border-r border-slate-300">Rute (Origin → Destination)</th>
                <th className="p-2.5 border-r border-slate-300">Muatan &amp; Berat</th>
                <th className="p-2.5 border-r border-slate-300 text-right">Nilai Kontrak</th>
                <th className="p-2.5 text-right">Driver Share (53%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {erp1 && (
                <tr>
                  <td className="p-2.5 font-bold border-r border-slate-300">ERP 1 (Berangkat)</td>
                  <td className="p-2.5 border-r border-slate-300">{erp1.origin} → {erp1.destination}</td>
                  <td className="p-2.5 border-r border-slate-300">{erp1.cargoType} ({erp1.cargoWeightTon} Ton)</td>
                  <td className="p-2.5 text-right font-medium border-r border-slate-300">{formatCurrency(Number(erp1.contractValue))}</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(driverShareErp1)}</td>
                </tr>
              )}
              {erp2 && (
                <tr>
                  <td className="p-2.5 font-bold border-r border-slate-300">ERP 2 (Pulang)</td>
                  <td className="p-2.5 border-r border-slate-300">{erp2.origin} → {erp2.destination}</td>
                  <td className="p-2.5 border-r border-slate-300">{erp2.cargoType} ({erp2.cargoWeightTon} Ton)</td>
                  <td className="p-2.5 text-right font-medium border-r border-slate-300">{formatCurrency(Number(erp2.contractValue))}</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(driverShareErp2)}</td>
                </tr>
              )}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={4} className="p-2.5 text-right uppercase border-r border-slate-300">Subtotal Driver Share (53% Kotor)</td>
                <td className="p-2.5 text-right text-sm text-slate-900">{formatCurrency(totalDriverShare)}</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td colSpan={4} className="p-2.5 text-right uppercase border-r border-slate-300">+ Reimbursement Tol Perusahaan (60%)</td>
                <td className="p-2.5 text-right text-sm text-emerald-700">+{formatCurrency(totalCompanyToll)}</td>
              </tr>
              <tr className="bg-blue-50/70 font-black">
                <td colSpan={4} className="p-2.5 text-right uppercase border-r border-slate-300">TOTAL HAK SUPIR (TOTALAN KOTOR)</td>
                <td className="p-2.5 text-right text-sm text-blue-700">{formatCurrency(totalDriverEntitlement)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Driver Advance Ledger Breakdown */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">2. Rincian Uang Jalan (Driver Advances Given)</h3>
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                <th className="p-2.5 border-r border-slate-300">#</th>
                <th className="p-2.5 border-r border-slate-300">Tanggal Pemberian</th>
                <th className="p-2.5 border-r border-slate-300">Keterangan / Notes</th>
                <th className="p-2.5 text-right">Nominal Uang Jalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {contract.advances.map((a: any, idx: number) => (
                <tr key={a.id}>
                  <td className="p-2.5 font-bold border-r border-slate-300">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-300">{new Date(a.givenAt).toLocaleDateString('id-ID')}</td>
                  <td className="p-2.5 border-r border-slate-300">{a.notes || 'Uang jalan operasional trip'}</td>
                  <td className="p-2.5 text-right font-semibold">{formatCurrency(Number(a.amount))}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={3} className="p-2.5 text-right uppercase border-r border-slate-300">Total Uang Jalan Diterima Driver</td>
                <td className="p-2.5 text-right text-sm">{formatCurrency(totalAdvances)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Final Settlement Reconciliation Summary Box */}
        <div className="p-4 bg-slate-100 rounded-xl border border-slate-300 mb-8 text-xs space-y-2">
          <div className="flex justify-between font-semibold">
            <span>Total Hak Supir (53% Kontrak Kotor + 60% Tol):</span>
            <span>{formatCurrency(totalDriverEntitlement)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Dikurangi Total Uang Jalan Diberikan:</span>
            <span>- {formatCurrency(totalAdvances)}</span>
          </div>
          <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-300">
            <span>SISA TOTALAN SUPIR (SETTLEMENT BALANCE):</span>
            <span className={difference >= 0 ? 'text-emerald-700' : 'text-amber-700'}>
              {formatCurrency(difference)}
            </span>
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-700 pt-1">
            <span>Resolusi Pembayaran:</span>
            <span className="uppercase">{settlement?.differenceResolution || (difference >= 0 ? 'ADDITIONAL_PAYMENT' : 'RETURN_TO_COMPANY')}</span>
          </div>
        </div>

        {/* Signature Section */}
        <div className="grid grid-cols-2 gap-12 text-center text-xs pt-6 border-t border-slate-300">
          <div>
            <p className="text-slate-500 mb-12">Disetujui Oleh (Panca Utama Cargo)</p>
            <p className="font-bold border-b border-slate-900 pb-1 inline-block min-w-44">Hariharto (Owner)</p>
          </div>
          <div>
            <p className="text-slate-500 mb-12">Diterima Oleh (Pengemudi / Driver)</p>
            <p className="font-bold border-b border-slate-900 pb-1 inline-block min-w-44">
              {contract.driver ? contract.driver.name : contract.driverName}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
