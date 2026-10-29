'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Printer } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

function getLocalDateValue() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatInvoiceDate(value: string) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ManualInvoiceClient() {
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(getLocalDateValue)
  const [dueDate, setDueDate] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [deliveryNumber, setDeliveryNumber] = useState('')
  const [route, setRoute] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [showWatermark, setShowWatermark] = useState(true)
  const [error, setError] = useState('')
  const numericAmount = Number(amount)

  function handlePrint() {
    if (
      !invoiceNumber.trim() ||
      !customerName.trim() ||
      !deliveryNumber.trim() ||
      !route.trim() ||
      !description.trim() ||
      !amount ||
      !Number.isFinite(numericAmount) ||
      numericAmount < 0
    ) {
      setError('Lengkapi nomor invoice, nama pelanggan, nomor surat jalan, rute, deskripsi, dan nominal sebelum mencetak.')
      return
    }

    setError('')
    window.print()
  }

  return (
    <div className="invoice-print-root max-w-4xl mx-auto space-y-6 text-[#1D1D1F] print:max-w-none print:w-full print:mx-0 print:space-y-0">
      <div className="print:hidden space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/contracts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <button
            type="button"
            onClick={() => setShowWatermark((visible) => !visible)}
            aria-pressed={showWatermark}
            className="px-4 py-2 text-xs font-semibold text-[#1D1D1F] bg-white border border-black/[0.1] hover:bg-[#F5F5F7] rounded-xl transition-colors flex items-center gap-2"
          >
            {showWatermark ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showWatermark ? 'Sembunyikan watermark' : 'Tampilkan watermark'}
          </button>
        </div>

        <section className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Buat Invoice Manual</h1>
            <p className="text-xs text-[#6E6E73] mt-1">
              Isi data invoice lalu cetak atau simpan sebagai PDF. Data ini tidak disimpan ke kontrak atau pembukuan.
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold text-[#6E6E73]">
              Nomor Invoice *
              <input
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
                placeholder="Contoh: INV/001/2026"
                className="w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF]"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-[#6E6E73]">
              Nomor Surat Jalan *
              <input
                value={deliveryNumber}
                onChange={(event) => setDeliveryNumber(event.target.value)}
                placeholder="Masukkan nomor surat jalan"
                className="w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF]"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-[#6E6E73]">
              Tanggal Invoice *
              <input
                type="date"
                value={invoiceDate}
                onChange={(event) => setInvoiceDate(event.target.value)}
                className="w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF]"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-[#6E6E73]">
              Jatuh Tempo
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF]"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-[#6E6E73]">
              Nama Pelanggan *
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Nama perusahaan atau pelanggan"
                className="w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF]"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-[#6E6E73]">
              Nomor Telepon
              <input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                className="w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF]"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-[#6E6E73] sm:col-span-2">
              Alamat Pelanggan
              <input
                value={customerAddress}
                onChange={(event) => setCustomerAddress(event.target.value)}
                className="w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF]"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-[#6E6E73] sm:col-span-2">
              Rute *
              <input
                value={route}
                onChange={(event) => setRoute(event.target.value)}
                placeholder="Contoh: Temanggung - Jakarta"
                className="w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF]"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-[#6E6E73] sm:col-span-2">
              Deskripsi Layanan *
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Contoh: Jasa pengiriman cargo"
                className="w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF]"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-[#6E6E73] sm:col-span-2">
              Nominal Tagihan (Rp) *
              <input
                type="number"
                min="0"
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Masukkan nominal invoice"
                className="w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none focus:border-[#007AFF]"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl shadow-2xs transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Cetak / Simpan PDF Invoice
          </button>
        </section>
      </div>

      <div className="invoice-print-document relative isolate bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 sm:p-10 shadow-xs print:border-none print:rounded-none print:shadow-none print:p-0">
        {showWatermark && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
            <Image
              src="/LogoPancaUtamaCargoCircular.png"
              alt=""
              width={512}
              height={512}
              className="w-[55%] max-w-[420px] object-contain opacity-[0.07]"
            />
          </div>
        )}
        <div className="invoice-print-content relative z-10">
          <div className="invoice-print-header flex flex-row justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
            <div className="invoice-print-company flex items-center gap-4">
              <div className="invoice-print-logo w-16 h-16 rounded-full overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                <Image
                  src="/LogoPancaUtamaCargoCircular.png"
                  alt="Logo Panca Utama Cargo"
                  width={512}
                  height={512}
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
              <div className="invoice-print-company-details">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">PT Karunia Panca Gemilang</h1>
                <p className="text-xs font-semibold text-emerald-600 tracking-wider">Enterprise Fleet Operations &amp; Logistics Service</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Jl. Raya Krangan - Pringsurat, Kenteng, Kebumen, Kec. Pringsurat, Kabupaten Temanggung, Jawa Tengah 56272
                </p>
                <p className="invoice-print-contact text-[11px] text-slate-500 leading-relaxed">
                  Telp: 085195500577 <span aria-hidden="true">·</span> Email: kpancagemilang@gmail.com
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">NPWP: 1000 0000 1150 9529</p>
              </div>
            </div>
            <div className="invoice-print-meta text-right">
              <h2 className="text-2xl font-black tracking-widest text-slate-900">INVOICE</h2>
              <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Tagihan</p>
              <p className="text-xs font-mono font-bold text-slate-900 mt-2">{invoiceNumber || '—'}</p>
              <p className="text-[11px] text-slate-500 mt-1">Tanggal: {formatInvoiceDate(invoiceDate)}</p>
              {dueDate && <p className="text-[11px] text-slate-500">Jatuh Tempo: {formatInvoiceDate(dueDate)}</p>}
            </div>
          </div>

          <div className="invoice-print-parties grid grid-cols-2 gap-6 mb-8 text-xs">
            <div className="invoice-print-card p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                TAGIHAN KEPADA (BILL TO CLIENT):
              </span>
              <p className="font-bold text-sm text-slate-900">{customerName || 'Pelanggan'}</p>
              {customerPhone && <p className="text-slate-600">Telp: {customerPhone}</p>}
              {customerAddress && <p className="text-slate-600">Alamat: {customerAddress}</p>}
            </div>
            <div className="invoice-print-card p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                DETAIL PENGIRIMAN:
              </span>
              <p className="font-semibold text-slate-900">No. Surat Jalan: {deliveryNumber || '—'}</p>
              <p className="text-slate-600">Rute: {route || '—'}</p>
            </div>
          </div>

          <div className="invoice-print-table-wrap mb-8">
            <table className="invoice-print-table w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] tracking-wider border-b border-slate-300">
                <tr>
                  <th className="py-3 px-4 border-r border-slate-300 text-center">No</th>
                  <th className="py-3 px-4 border-r border-slate-300">Deskripsi Layanan / Rute Cargo</th>
                  <th className="py-3 px-4 text-center border-r border-slate-300">Muatan</th>
                  <th className="py-3 px-4 text-right border-r border-slate-300">Tarif / Nilai</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="py-3.5 px-4 text-center font-mono border-r border-slate-200">1</td>
                  <td className="py-3.5 px-4 border-r border-slate-200 font-bold text-slate-900">{description || '—'}</td>
                  <td className="py-3.5 px-4 text-center font-mono border-r border-slate-200">-</td>
                  <td className="py-3.5 px-4 text-right font-mono border-r border-slate-200">
                    {amount ? formatCurrency(numericAmount) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {amount ? formatCurrency(numericAmount) : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

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
                <span className="font-mono font-semibold text-slate-900">{amount ? formatCurrency(numericAmount) : '—'}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold border-t-2 border-slate-900 pt-2 text-slate-900">
                <span>TOTAL TAGIHAN:</span>
                <span className="font-mono text-emerald-700">{amount ? formatCurrency(numericAmount) : '—'}</span>
              </div>
            </div>
          </div>

          <div className="invoice-print-signatures grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs">
            <div>
              <p className="text-slate-500 mb-16">Penerima Tagihan (Client),</p>
              <p className="font-bold text-slate-900 border-b border-slate-400 pb-1 inline-block min-w-[180px]">
                ( {customerName || 'Customer'} )
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-2">Hormat Kami,</p>
              <p className="font-extrabold text-slate-900 uppercase">PT Karunia Panca Gemilang</p>
              <Image
                src="/signature-hariharto.png"
                alt="Tanda tangan Hariharto Surya Angestiono"
                width={800}
                height={410}
                className="mx-auto h-20 w-40 object-contain"
              />
              <p className="font-bold text-slate-900 border-b border-slate-400 pb-1 inline-block min-w-[180px]">
                Hariharto Surya Angestiono
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
