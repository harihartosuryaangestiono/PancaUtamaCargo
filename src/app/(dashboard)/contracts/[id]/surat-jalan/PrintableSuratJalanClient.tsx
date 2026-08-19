'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'

interface PrintableSuratJalanClientProps {
  contract: any
}

export function PrintableSuratJalanClient({ contract }: PrintableSuratJalanClientProps) {
  const [legMode, setLegMode] = useState<'all' | '1' | '2'>('all')

  const leg1 = contract.legs?.find((l: any) => l.legNumber === 1) || contract.legs?.[0]
  const leg2 = contract.legs?.find((l: any) => l.legNumber === 2) || contract.legs?.[1]

  const activeLegs = legMode === '1' ? (leg1 ? [leg1] : []) : legMode === '2' ? (leg2 ? [leg2] : []) : (contract.legs || [])

  // Shipper Customer depending on mode
  let targetCustomer = contract.customer
  if (legMode === '1' && leg1?.customer) targetCustomer = leg1.customer
  if (legMode === '2' && leg2?.customer) targetCustomer = leg2.customer

  const sjSuffix = legMode === '1' ? '-L1' : legMode === '2' ? '-L2' : ''
  const suratJalanNumber = `SJ-${contract.contractNumber}${sjSuffix}`

  const dateStr = new Date(contract.startDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-[#1D1D1F]">
      {/* Top Action Bar & Leg Selector (Hidden on print) */}
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
          <Printer className="w-4 h-4" /> Cetak / Simpan PDF Surat Jalan
        </button>
      </div>

      {/* Document Box */}
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
                Surat Pengangkutan &amp; Manifest Cargo Armada Tronton
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-md">
                Jl. Raya Transportasi Tronton No. 88, Kertajaya, Surabaya · Telp: (031) 889-7766 / 0812-3456-7890 · Email: operasional@pancautamacargo.com
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white font-extrabold text-xs tracking-wider uppercase rounded-md mb-2">
              {legMode === '1' ? 'SURAT JALAN (LEG 1 - BERANGKAT)' : legMode === '2' ? 'SURAT JALAN (LEG 2 - PULANG)' : 'SURAT JALAN CARGO'}
            </span>
            <p className="text-xs font-mono font-bold text-slate-900">{suratJalanNumber}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Tanggal: {dateStr}</p>
            <p className="text-[11px] text-slate-500">No. Kontrak: {contract.contractNumber}</p>
          </div>
        </div>

        {/* Expedition & Driver Info */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
              INFORMASI EKSPEDISI &amp; ARMADA:
            </span>
            <p className="font-bold text-sm text-slate-900">
              Nopol Truck: {contract.truck?.policeNumber} ({contract.truck?.truckCode})
            </p>
            <p className="text-slate-600 font-medium">
              Tipe Armada: {contract.truck?.vehicleType || 'Tronton'} ({contract.truck?.driveConfiguration || '6x2'})
            </p>
            <p className="text-slate-600">Merk / Model: {contract.truck?.brand} {contract.truck?.model}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
              INFORMASI PENGEMUDI (DRIVER):
            </span>
            <p className="font-bold text-sm text-slate-900">Driver: {contract.driverName}</p>
            {contract.driver?.phone && <p className="text-slate-600">Kontak Driver: {contract.driver.phone}</p>}
            {contract.driver?.licenseNumber && (
              <p className="text-slate-600 font-mono">No. SIM: {contract.driver.licenseNumber} ({contract.driver.licenseType || 'B2 Umum'})</p>
            )}
          </div>
        </div>

        {/* Customer / Shipper Info */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-8 text-xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
            PENGIRIM (SHIPPER / CUSTOMER CLIENT):
          </span>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-slate-900">{targetCustomer?.name || contract.customer?.name}</p>
              <p className="font-mono text-slate-600">Kode Mitra: {targetCustomer?.code || contract.customer?.code}</p>
            </div>
            <div>
              {(targetCustomer?.phone || contract.customer?.phone) && (
                <p className="text-slate-600">Telepon: {targetCustomer?.phone || contract.customer?.phone}</p>
              )}
              {(targetCustomer?.address || contract.customer?.address) && (
                <p className="text-slate-600">Alamat: {targetCustomer?.address || contract.customer?.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Manifest Table */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            RINCIAN RUTE &amp; MUATAN CARGO ({legMode === 'all' ? 'FULL ROUND TRIP' : `LEG ${legMode}`}):
          </h3>
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] tracking-wider border-b border-slate-300">
              <tr>
                <th className="py-3 px-4 border-r border-slate-300 text-center">Leg</th>
                <th className="py-3 px-4 border-r border-slate-300">Arah (Direction)</th>
                <th className="py-3 px-4 border-r border-slate-300">Kota Asal &rarr; Tujuan</th>
                <th className="py-3 px-4 border-r border-slate-300">Jenis Barang / Muatan</th>
                <th className="py-3 px-4 text-center">Berat / Volume (Ton)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {activeLegs.map((leg: any, idx: number) => (
                <tr key={leg.id || idx}>
                  <td className="py-3.5 px-4 text-center font-mono border-r border-slate-200">{leg.legNumber}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 border-r border-slate-200">
                    {leg.direction === 'OUTBOUND' ? 'Berangkat (Leg 1)' : 'Pulang (Leg 2)'}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 border-r border-slate-200">
                    {leg.origin} &rarr; {leg.destination}
                  </td>
                  <td className="py-3.5 px-4 border-r border-slate-200">
                    {leg.cargoType || 'General Cargo'} {leg.customer?.name ? `(${leg.customer.name})` : ''}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                    {leg.cargoWeightTon ? `${leg.cargoWeightTon} Ton` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Terms & Notes */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-8 text-[11px] text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Catatan &amp; Ketentuan Pengangkutan Cargo:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Barang diangkut dan diserahkan dalam kondisi segel baik &amp; sesuai dokumen pengiriman.</li>
            <li>Pengemudi wajib memastikan tonase muatan tidak melebihi kapasitas aman armada tronton.</li>
            <li>Segala kerusakan/kekurangan saat penerimaan wajib dicatat pada kolom keterangan.</li>
          </ul>
        </div>

        {/* 4 Signatures Grid */}
        <div className="grid grid-cols-4 gap-4 pt-6 border-t border-slate-200 text-center text-[11px]">
          <div>
            <p className="text-slate-500 mb-16">Pengirim (Shipper),</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 pb-1">
              ( {targetCustomer?.name || contract.customer?.name || 'Customer'} )
            </p>
          </div>

          <div>
            <p className="text-slate-500 mb-16">Pengemudi (Driver),</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 pb-1">
              ( {contract.driverName} )
            </p>
          </div>

          <div>
            <p className="text-slate-500 mb-16">Penerima Barang,</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 pb-1">
              ( ............................. )
            </p>
          </div>

          <div>
            <p className="text-slate-500 mb-16">Petugas Cargo / Dispatcher,</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 pb-1">
              ( Panca Utama Cargo )
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
