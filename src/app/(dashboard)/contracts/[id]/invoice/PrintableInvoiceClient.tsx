'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Printer } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { formatCargoWeight } from '@/lib/utils/cargo'

interface PrintableInvoiceClientProps {
  contract: any
}

export function PrintableInvoiceClient({ contract }: PrintableInvoiceClientProps) {
  const [legMode, setLegMode] = useState<'all' | '1' | '2'>('all')
  const [showWatermark, setShowWatermark] = useState(true)
  const [dueDateValue, setDueDateValue] = useState(() => {
    const date = new Date(contract.startDate)
    date.setDate(date.getDate() + 14)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })

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
  const dueDate = dueDateValue
    ? new Date(`${dueDateValue}T00:00:00`).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

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
    <div className="invoice-print-root max-w-4xl mx-auto space-y-6 text-[#1D1D1F] print:max-w-none print:w-full print:mx-0 print:space-y-0">
      {/* Top Action Bar & Leg Filter Selector (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-4 print:hidden">
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

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-[#6E6E73]">
            Jatuh Tempo
            <input
              type="date"
              value={dueDateValue}
              onChange={(event) => setDueDateValue(event.target.value)}
              className="min-h-9 rounded-xl border border-black/[0.1] bg-white px-3 text-xs font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowWatermark((visible) => !visible)}
            aria-pressed={showWatermark}
            className="px-4 py-2 text-xs font-semibold text-[#1D1D1F] bg-white border border-black/[0.1] hover:bg-[#F5F5F7] rounded-xl transition-colors flex items-center gap-2"
          >
            {showWatermark ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showWatermark ? 'Sembunyikan watermark' : 'Tampilkan watermark'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Cetak / Simpan PDF Invoice
          </button>
        </div>
      </div>

      {/* Invoice Document Box */}
      <div className="invoice-print-document relative isolate bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 sm:p-10 shadow-xs print:border-none print:rounded-none print:shadow-none print:p-0">
        {showWatermark && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
            <img
              src="/LogoPancaUtamaCargoCircular.png"
              alt=""
              className="w-[55%] max-w-[420px] object-contain opacity-[0.07]"
            />
          </div>
        )}
        <div className="invoice-print-content relative z-10">
        {/* Header Company Info */}
        <div className="invoice-print-header flex flex-row justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
          <div className="invoice-print-company flex items-center gap-4">
            <div className="invoice-print-logo w-16 h-16 rounded-full overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
              <img
                src="/LogoPancaUtamaCargoCircular.png"
                alt="Logo Panca Utama Cargo"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div className="invoice-print-company-details">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                PT Karunia Panca Gemilang
              </h1>
              <p className="text-xs font-semibold text-emerald-600 tracking-wider">
                Enterprise Fleet Operations &amp; Logistics Service
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Jl. Raya Krangan - Pringsurat, Kenteng, Kebumen, Kec. Pringsurat, Kabupaten Temanggung, Jawa Tengah 56272
              </p>
              <p className="invoice-print-contact text-[11px] text-slate-500 leading-relaxed">
                Telp: 085195500577 <span aria-hidden="true">·</span> Email: kpancagemilang@gmail.com
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                NPWP: 1000 0000 1150 9529
              </p>
            </div>
          </div>

          <div className="invoice-print-meta text-right">
            <h2 className="text-2xl font-black tracking-widest text-slate-900">INVOICE</h2>
            <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              {legMode === '1' ? 'Leg 1 · Berangkat' : legMode === '2' ? 'Leg 2 · Pulang' : 'Tagihan'}
            </p>
            <p className="text-xs font-mono font-bold text-slate-900 mt-2">{invoiceNumber}</p>
            <p className="text-[11px] text-slate-500 mt-1">Tanggal: {invoiceDate}</p>
            <p className="text-[11px] text-slate-500">Jatuh Tempo: {dueDate}</p>
          </div>
        </div>

        {/* Bill To & Expedition Detail */}
        <div className="invoice-print-parties grid grid-cols-2 gap-6 mb-8 text-xs">
          <div className="invoice-print-card p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
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

          <div className="invoice-print-card p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
              DETAIL ARMADA &amp; OPERASIONAL:
            </span>
            <p className="font-semibold text-slate-900">Armada: {contract.truck?.policeNumber} ({contract.truck?.truckCode})</p>
            <p className="text-slate-600">Pengemudi: {contract.driverName}</p>
            <p className="text-slate-600">No. Kontrak ERP: {contract.contractNumber}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="invoice-print-table-wrap mb-8">
          <table className="invoice-print-table w-full text-xs text-left border-collapse border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] tracking-wider border-b border-slate-300">
              <tr>
                <th className="py-3 px-4 border-r border-slate-300 text-center">No</th>
                <th className="py-3 px-4 border-r border-slate-300">Deskripsi Layanan / Rute Cargo</th>
                <th className="py-3 px-4 text-center border-r border-slate-300">Muatan</th>
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
                    {leg.cargoWeightTon ? formatCargoWeight(leg.cargoWeightTon, leg.cargoWeightUnit) : '-'}
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
        <div className="invoice-print-summary flex flex-row justify-between items-start mb-8 text-xs">
          <div className="invoice-print-payment p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
              PEMBAYARAN DILAKUKAN KE REKENING:
            </span>
            <p className="font-bold text-slate-900">Bank Central Asia (BCA)</p>
            <p className="font-mono text-sm font-bold text-[#007AFF]">3442992999</p>
            <p className="text-slate-600 font-semibold">a.n. PT Karunia Panca Gemilang</p>
          </div>

          <div className="invoice-print-totals w-72 space-y-2 text-xs">
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
        <div className="invoice-print-signatures grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs">
          <div>
            <p className="text-slate-500 mb-16">Penerima Tagihan (Client),</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 pb-1 inline-block min-w-[180px]">
              ( {targetCustomer?.name || contract.customer?.name || 'Customer'} )
            </p>
          </div>

          <div>
            <p className="text-slate-500 mb-2">Hormat Kami,</p>
            <p className="font-extrabold text-slate-900 uppercase">PT Karunia Panca Gemilang</p>
            <div className="h-10"></div>
            <p className="font-bold text-slate-900 border-b border-slate-400 pb-1 inline-block min-w-[180px]">
              ( Departemen Keuangan / Finance )
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
