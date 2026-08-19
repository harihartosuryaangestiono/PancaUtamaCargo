'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface PrintableInvoiceClientProps {
  contract: any
}

export function PrintableInvoiceClient({ contract }: PrintableInvoiceClientProps) {
  const [legMode, setLegMode] = useState<'all' | '1' | '2'>('all')

  const leg1 = contract.legs?.find((l: any) => l.legNumber === 1) || contract.legs?.[0]
  const leg2 = contract.legs?.find((l: any) => l.legNumber === 2) || contract.legs?.[1]

  const activeLegs = legMode === '1' ? (leg1 ? [leg1] : []) : legMode === '2' ? (leg2 ? [leg2] : []) : (contract.legs || [])

  // Bill-to customer depending on mode
  let targetCustomer = contract.customer
  if (legMode === '1' && leg1?.customer) targetCustomer = leg1.customer
  if (legMode === '2' && leg2?.customer) targetCustomer = leg2.customer

  const invoiceSuffix = legMode === '1' ? '-L1' : legMode === '2' ? '-L2' : ''
  const invoiceNumber = `INV-${contract.contractNumber}${invoiceSuffix}`

  const invoiceDate = new Date(contract.startDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const dueDate = new Date(new Date(contract.startDate).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Calculate totals for active legs
  let activeRevenue = 0
  let activeToll = 0
  for (const leg of activeLegs) {
    activeRevenue += Number(leg.contractValue || 0)
    activeToll += Number(leg.companyTollCost || 0)
  }

  const subtotal = activeRevenue + activeToll
  const taxDeduction = subtotal * 0.02
  const netTotal = subtotal - taxDeduction

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-[#1D1D1F]">
      {/* Top Action Bar & Leg Filter Selector (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          href={`/contracts/${contract.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Detail Kontrak
        </Link>

        {/* Filter Leg Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F2F2F7] border border-black/[0.06]">
          <button
            onClick={() => setLegMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              legMode === 'all' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Gabungan Round-Trip (Leg 1 + 2)
          </button>
          <button
            onClick={() => setLegMode('1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              legMode === '1' ? 'bg-white text-[#007AFF] shadow-xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Leg 1 Only (Berangkat)
          </button>

          {leg2 && (
            <button
              onClick={() => setLegMode('2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                legMode === '2' ? 'bg-white text-[#34C759] shadow-xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Leg 2 Only (Pulang)
            </button>
          )}
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-colors flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Cetak / Simpan PDF Invoice
        </button>
      </div>

      {/* Invoice Document Box */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 sm:p-10 shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Header Company Info */}
        <div className="flex flex-row justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
              <img
                src="/LogoPancaUtamaCargoCircular.png"
                alt="Logo Panca Utama Cargo"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                PT PANCA UTAMA CARGO
              </h1>
              <p className="text-xs font-semibold text-emerald-600 tracking-wider">
                Enterprise Fleet Operations &amp; Logistics Service
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-md">
                Jl. Raya Transportasi Tronton No. 88, Kertajaya, Surabaya · Telp: (031) 889-7766 / 0812-3456-7890 · Email: billing@pancautamacargo.com
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white font-extrabold text-xs tracking-wider uppercase rounded-md mb-2">
              {legMode === '1' ? 'INVOICE (LEG 1 - BERANGKAT)' : legMode === '2' ? 'INVOICE (LEG 2 - PULANG)' : 'INVOICE / TAGIHAN'}
            </span>
            <p className="text-xs font-mono font-bold text-slate-900">{invoiceNumber}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Tanggal: {invoiceDate}</p>
            <p className="text-[11px] text-slate-500">Jatuh Tempo: {dueDate}</p>
          </div>
        </div>

        {/* Bill To & Expedition Detail */}
        <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
              TAGIHAN KEPADA (BILL TO CLIENT):
            </span>
            <p className="font-bold text-sm text-slate-900">{targetCustomer?.name || contract.customer?.name || 'Pelanggan'}</p>
            <p className="font-mono text-slate-600">Kode Mitra: {targetCustomer?.code || contract.customer?.code || '-'}</p>
            {(targetCustomer?.phone || contract.customer?.phone) && (
              <p className="text-slate-600">Telp: {targetCustomer?.phone || contract.customer?.phone}</p>
            )}
            {(targetCustomer?.address || contract.customer?.address) && (
              <p className="text-slate-600">Alamat: {targetCustomer?.address || contract.customer?.address}</p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
              DETAIL ARMADA &amp; OPERASIONAL:
            </span>
            <p className="font-semibold text-slate-900">Armada: {contract.truck?.policeNumber} ({contract.truck?.truckCode})</p>
            <p className="text-slate-600">Pengemudi: {contract.driverName}</p>
            <p className="text-slate-600">No. Kontrak ERP: {contract.contractNumber}</p>
            <p className="text-slate-600">Opsi Cetak: <span className="font-bold text-blue-700 uppercase">{legMode === 'all' ? 'Round-Trip Full' : `Leg ${legMode}`}</span></p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] tracking-wider border-b border-slate-300">
              <tr>
                <th className="py-3 px-4 border-r border-slate-300 text-center">No</th>
                <th className="py-3 px-4 border-r border-slate-300">Deskripsi Layanan / Rute Cargo</th>
                <th className="py-3 px-4 text-center border-r border-slate-300">Muatan (Ton)</th>
                <th className="py-3 px-4 text-right border-r border-slate-300">Tarif / Nilai Leg</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {activeLegs.map((leg: any, idx: number) => (
                <tr key={leg.id || idx}>
                  <td className="py-3.5 px-4 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                  <td className="py-3.5 px-4 border-r border-slate-200">
                    <p className="font-bold text-slate-900">
                      Leg {leg.legNumber} ({leg.direction}): {leg.origin} &rarr; {leg.destination}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Jenis Cargo: {leg.cargoType || 'General Cargo'} {leg.customer?.name ? `· Client: ${leg.customer.name}` : ''}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono border-r border-slate-200">
                    {leg.cargoWeightTon ? `${leg.cargoWeightTon} Ton` : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono border-r border-slate-200">
                    {formatCurrency(Number(leg.contractValue || 0))}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(Number(leg.contractValue || 0))}
                  </td>
                </tr>
              ))}
              {activeToll > 0 && (
                <tr>
                  <td className="py-3 px-4 text-center font-mono border-r border-slate-200">
                    {activeLegs.length + 1}
                  </td>
                  <td className="py-3 px-4 border-r border-slate-200 font-semibold text-slate-900" colSpan={3}>
                    Tambahan Biaya Tol Ditagihkan ({legMode === 'all' ? 'Gabungan' : `Leg ${legMode}`})
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(activeToll)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="flex flex-row justify-between items-start mb-8 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
              PEMBAYARAN DILAKUKAN KE REKENING:
            </span>
            <p className="font-bold text-slate-900">Bank Central Asia (BCA)</p>
            <p className="font-mono text-sm font-bold text-[#007AFF]">3445565568</p>
            <p className="text-slate-600 font-semibold">a.n. Hariharto Surya Anggestiono</p>
          </div>

          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Tagihan:</span>
              <span className="font-mono font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            {taxDeduction > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Potongan PPh 2%:</span>
                <span className="font-mono font-semibold text-rose-600">-{formatCurrency(taxDeduction)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold border-t-2 border-slate-900 pt-2 text-slate-900">
              <span>TOTAL TAGIHAN:</span>
              <span className="font-mono text-emerald-700">{formatCurrency(netTotal)}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs">
          <div>
            <p className="text-slate-500 mb-16">Penerima Tagihan (Client),</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 pb-1 inline-block min-w-[180px]">
              ( {targetCustomer?.name || contract.customer?.name || 'Customer'} )
            </p>
          </div>

          <div>
            <p className="text-slate-500 mb-2">Hormat Kami,</p>
            <p className="font-extrabold text-slate-900 uppercase">PT PANCA UTAMA CARGO</p>
            <div className="h-10"></div>
            <p className="font-bold text-slate-900 border-b border-slate-400 pb-1 inline-block min-w-[180px]">
              ( Departemen Keuangan / Finance )
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
