'use client'

import React, { useState } from 'react'
import { Eye, X, Download, ExternalLink, Image as ImageIcon, QrCode, FileText } from 'lucide-react'

interface DocumentPreviewModalProps {
  doc: any
}

export function DocumentPreviewModal({ doc }: DocumentPreviewModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!doc.attachmentUrl) {
    return <span className="text-[#8E8E93] italic text-xs">Tanpa Lampiran</span>
  }

  const isImage = doc.attachmentUrl.startsWith('data:image/') || doc.attachmentUrl.match(/\.(jpeg|jpg|png|webp|gif|svg)$/i)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20 border border-[#007AFF]/20 text-xs font-semibold transition-all shadow-2xs"
      >
        <Eye className="w-3.5 h-3.5" />
        Preview / Lihat Gambar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 text-[#1D1D1F]">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-black/[0.08] shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                  {doc.docType === 'BARCODE_E_TOLL' ? <QrCode className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">{doc.docName}</h3>
                  <p className="text-xs text-[#6E6E73] font-mono">Truck: {doc.truck?.policeNumber || doc.truckId} · Tipe: {doc.docType}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#8E8E93] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Container */}
            <div className="flex-1 overflow-auto bg-[#F5F5F7] rounded-xl p-4 flex items-center justify-center min-h-[300px] border border-black/[0.06]">
              {isImage ? (
                <img
                  src={doc.attachmentUrl}
                  alt={doc.docName}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xs border border-black/[0.08]"
                />
              ) : (
                <div className="text-center text-[#1D1D1F] space-y-3">
                  <FileText className="w-16 h-16 mx-auto text-[#007AFF]" />
                  <p className="text-sm font-semibold">Dokumen Format PDF / Berkas Digital</p>
                  <a
                    href={doc.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] text-white font-semibold text-xs shadow-2xs hover:bg-[#0062CC] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Buka di Tab Baru
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer / Notes */}
            <div className="flex items-center justify-between border-t border-black/[0.06] pt-3 text-xs">
              <div className="text-[#6E6E73]">
                {doc.notes && <p><span className="font-semibold text-[#1D1D1F]">Catatan:</span> {doc.notes}</p>}
                {doc.issueDate && <p className="text-[11px] font-mono">Tgl Terbit/Bayar: {new Date(doc.issueDate).toLocaleDateString('id-ID')}</p>}
              </div>

              <a
                href={doc.attachmentUrl}
                download={`${doc.docName.replace(/\s+/g, '_')}_${doc.id}`}
                className="px-4 py-2 rounded-xl bg-[#1D1D1F] text-white font-semibold text-xs inline-flex items-center gap-2 hover:bg-black transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" /> Download File
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
