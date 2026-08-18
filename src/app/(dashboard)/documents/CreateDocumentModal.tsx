'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Upload, FileText, Image as ImageIcon, QrCode, Check, AlertCircle } from 'lucide-react'
import { createTruckDocumentAction } from '@/app/actions/truckDocumentActions'

interface CreateDocumentModalProps {
  trucks: Array<{ id: string; policeNumber: string; brand: string; model: string }>
}

export function CreateDocumentModal({ trucks }: CreateDocumentModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [truckId, setTruckId] = useState(trucks[0]?.id || '')
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('BUKTI_CICILAN')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [hasExpiry, setHasExpiry] = useState(false)
  const [expiryDate, setExpiryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [previewFile, setPreviewFile] = useState<string | null>(null)

  const quickTypes = [
    { type: 'BUKTI_CICILAN', label: '💳 Bukti Bayar Cicilan', defaultName: 'Bukti Bayar Cicilan Leasing' },
    { type: 'BARCODE_E_TOLL', label: '📱 Barcode E-Toll / Solar', defaultName: 'Barcode Solar Subsidized MyPertamina' },
    { type: 'STNK', label: '📜 STNK Armada', defaultName: 'STNK Armada Tronton' },
    { type: 'KIR', label: '🛠️ KIR / Uji Berkala', defaultName: 'Sertifikat Uji Berkala (KIR)' },
    { type: 'ASURANSI', label: '🛡️ Polis Asuransi', defaultName: 'Polis Asuransi All-Risk Armada' },
    { type: 'FAKTUR', label: '🧾 Faktur Pembelian', defaultName: 'Faktur & Kwitansi Pembelian' },
    { type: 'LAINNYA', label: '📁 Dokumen Lainnya', defaultName: 'Dokumen Operasional Armada' },
  ]

  function handleQuickTypeSelect(item: typeof quickTypes[0]) {
    setDocType(item.type)
    if (!docName || quickTypes.some((q) => q.defaultName === docName || docName.startsWith(q.defaultName))) {
      const selectedTruck = trucks.find((t) => t.id === truckId)
      const truckTag = selectedTruck ? ` ${selectedTruck.policeNumber}` : ''
      setDocName(`${item.defaultName}${truckTag}`)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      setError('Ukuran file terlalu besar (Maksimal 8 MB).')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setAttachmentUrl(result)
      setPreviewFile(result)
    }
    reader.readAsDataURL(file)
  }

  function resetForm() {
    setError(null)
    setTruckId(trucks[0]?.id || '')
    setDocName('')
    setDocType('BUKTI_CICILAN')
    setIssueDate(new Date().toISOString().split('T')[0])
    setHasExpiry(false)
    setExpiryDate('')
    setNotes('')
    setAttachmentUrl('')
    setPreviewFile(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!truckId) {
      setError('Silakan pilih Truck Armada.')
      return
    }
    if (!docName.trim()) {
      setError('Nama dokumen wajib diisi.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const res = await createTruckDocumentAction({
        truckId,
        docName: docName.trim(),
        docType,
        issueDate,
        expiryDate: hasExpiry && expiryDate ? expiryDate : undefined,
        attachmentUrl,
        notes: notes.trim() || undefined,
      })

      if (res.error) {
        setError(res.error)
        return
      }

      setIsOpen(false)
      resetForm()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan dokumen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          resetForm()
          setIsOpen(true)
        }}
        className="px-4 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white font-semibold text-xs shadow-2xs transition-colors inline-flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Tambah Dokumen / Gambar / Barcode
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 text-[#1D1D1F]">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-black/[0.08] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3.5">
              <div>
                <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">
                  DOCUMENT &amp; MEDIA HUB
                </span>
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Tambah Dokumen, Gambar &amp; Barcode
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#8E8E93] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[#FF3B30] text-xs flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Type Selection Chips */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider">
                Pilih Kategori Dokumen Cepat
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickTypes.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleQuickTypeSelect(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      docType === item.type
                        ? 'bg-[#007AFF] text-white shadow-2xs'
                        : 'bg-[#F2F2F7] text-[#1D1D1F] hover:bg-[#E5E5EA]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Truck Selector */}
              <div>
                <label className="block font-semibold text-[#1D1D1F] mb-1">
                  Pilih Truck Armada *
                </label>
                <select
                  value={truckId}
                  onChange={(e) => setTruckId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium"
                >
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.policeNumber} ({t.brand} {t.model})
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Name */}
              <div>
                <label className="block font-semibold text-[#1D1D1F] mb-1">
                  Nama Dokumen / Keterangan File *
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Contoh: Bukti Bayar Cicilan Leasing Agustus 2026 / Barcode E-Toll"
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1">
                    Tanggal Terbit / Bayar
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-[#1D1D1F]">
                      Ada Expiry / Masa Berlaku?
                    </label>
                    <input
                      type="checkbox"
                      checked={hasExpiry}
                      onChange={(e) => setHasExpiry(e.target.checked)}
                      className="rounded border-black/[0.08]"
                    />
                  </div>
                  {hasExpiry ? (
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium"
                    />
                  ) : (
                    <span className="text-[11px] text-[#8E8E93] italic block pt-2">
                      Tanpa tanggal jatuh tempo
                    </span>
                  )}
                </div>
              </div>

              {/* File / Image Upload Box */}
              <div>
                <label className="block font-semibold text-[#1D1D1F] mb-1">
                  Upload Foto / Gambar / Barcode / File PDF
                </label>
                <div className="border-2 border-dashed border-black/[0.08] rounded-xl p-4 text-center hover:bg-[#F5F5F7] transition-colors relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className="flex justify-center gap-2 text-[#007AFF]">
                      <ImageIcon className="w-6 h-6" />
                      <QrCode className="w-6 h-6" />
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-[#1D1D1F]">
                      Klik atau seret foto bukti bayar / barcode di sini
                    </p>
                    <p className="text-[10px] text-[#6E6E73]">
                      Mendukung format JPG, PNG, WEBP, Barcode QR &amp; PDF (Maks. 8MB)
                    </p>
                  </div>
                </div>

                {/* File Preview */}
                {previewFile && (
                  <div className="mt-3 p-3 rounded-xl bg-[#FAFAFA] border border-black/[0.06] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {previewFile.startsWith('data:image/') ? (
                        <img src={previewFile} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-black/[0.06] shrink-0" />
                      ) : (
                        <FileText className="w-8 h-8 text-[#007AFF] shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="text-xs font-semibold text-[#1D1D1F] truncate">File Terlampir</p>
                        <p className="text-[10px] text-[#248A3D] font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Siap diunggah ke database
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentUrl('')
                        setPreviewFile(null)
                      }}
                      className="p-1.5 text-[#FF3B30] hover:bg-rose-50 rounded-lg text-xs font-semibold"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-[#1D1D1F] mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Cicilan bulan ke-12 leasing BCA Finance / Barcode solar aktif"
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-[#1D1D1F] font-medium"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl font-semibold text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-[#007AFF] hover:bg-[#0062CC] text-white shadow-2xs transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Simpan...' : 'Simpan Dokumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
