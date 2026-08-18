import { requireAuth } from '@/lib/session'
import { getTruckDocumentsAction } from '@/app/actions/truckDocumentActions'
import { getTrucksAction } from '@/app/actions/truckActions'
import { FileText, QrCode, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { CreateDocumentModal } from './CreateDocumentModal'
import { DocumentPreviewModal } from './DocumentPreviewModal'
import { DeleteDocumentButton } from './DeleteDocumentButton'

export default async function DocumentCenterPage() {
  const session = await requireAuth()
  const [documents, trucks] = await Promise.all([getTruckDocumentsAction(), getTrucksAction()])

  const validCount = documents.filter((d: any) => d.status === 'VALID').length
  const expiringCount = documents.filter((d: any) => d.status === 'EXPIRING_SOON').length
  const expiredCount = documents.filter((d: any) => d.status === 'EXPIRED').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20 uppercase">VALID</span>
      case 'EXPIRING_SOON':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9500]/10 text-[#C67300] border border-[#FF9500]/20 uppercase">EXPIRING SOON</span>
      case 'EXPIRED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 uppercase">EXPIRED</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F5F7] text-[#6E6E73] border border-black/[0.08] uppercase">{status}</span>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BUKTI_CICILAN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF9500]/10 text-[#C67300] border border-[#FF9500]/20 uppercase inline-flex items-center gap-1"><CreditCard className="w-3 h-3" /> Bukti Cicilan</span>
      case 'BARCODE_E_TOLL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 uppercase inline-flex items-center gap-1"><QrCode className="w-3 h-3" /> Barcode E-Toll/Solar</span>
      case 'STNK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 uppercase">STNK</span>
      case 'KIR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20 uppercase">KIR</span>
      case 'ASURANSI':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20 uppercase">Asuransi</span>
      case 'FAKTUR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 uppercase">Faktur</span>
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5F5F7] text-[#1D1D1F] font-mono uppercase">{type}</span>
    }
  }

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
            Centralized Document &amp; Media Hub
          </h1>
          <p className="text-xs text-[#6E6E73]">
            Manajemen dokumen fleet, STNK, KIR, Bukti Bayar Cicilan Leasing, Barcode E-Toll/Solar, Asuransi &amp; Faktur.
          </p>
        </div>

        {session.role === 'OWNER' && (
          <CreateDocumentModal
            trucks={trucks.map((t: any) => ({ id: t.id, policeNumber: t.policeNumber, brand: t.brand, model: t.model }))}
          />
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-medium text-[#6E6E73]">Total Dokumen Fleet</span>
          <p className="text-xl font-semibold text-[#1D1D1F] mt-1">{documents.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-medium text-[#248A3D]">Dokumen Valid</span>
          <p className="text-xl font-semibold text-[#248A3D] mt-1">{validCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-medium text-[#C67300]">Mendekati Expired (&le;30 hari)</span>
          <p className="text-xl font-semibold text-[#C67300] mt-1">{expiringCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-medium text-[#FF3B30]">Sudah Expired</span>
          <p className="text-xl font-semibold text-[#FF3B30] mt-1">{expiredCount}</p>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#1D1D1F] text-sm">Arsip Dokumen &amp; Foto Bukti Armada</h3>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center text-[#8E8E93] text-xs space-y-2">
            <FileText className="w-10 h-10 mx-auto opacity-30 text-[#007AFF]" />
            <p className="font-semibold text-[#1D1D1F]">Belum ada dokumen yang terdaftar dalam database.</p>
            <p className="text-[11px] text-[#6E6E73]">Klik tombol "+ Tambah Dokumen / Gambar / Barcode" di kanan atas untuk mengunggah berkas pertama.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[#6E6E73] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Truck Armada</th>
                  <th className="py-3 px-4">Nama Dokumen</th>
                  <th className="py-3 px-4">Kategori / Tipe</th>
                  <th className="py-3 px-4">Tgl Terbit / Expiry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Lampiran Media</th>
                  {session.role === 'OWNER' && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] font-medium">
                {documents.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-[#F5F5F7] transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[#007AFF]">
                      <Link href={`/trucks/${doc.truckId}`} className="hover:underline">
                        {doc.truck?.policeNumber || doc.truckId}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#1D1D1F]">
                      {doc.docName}
                      {doc.notes && <p className="text-[11px] text-[#6E6E73] font-normal mt-0.5">{doc.notes}</p>}
                    </td>
                    <td className="py-3 px-4">
                      {getTypeBadge(doc.docType)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {doc.issueDate && <div>Terbit: {new Date(doc.issueDate).toLocaleDateString('id-ID')}</div>}
                      {doc.expiryDate ? (
                        <div className="text-[#6E6E73]">Exp: {new Date(doc.expiryDate).toLocaleDateString('id-ID')}</div>
                      ) : (
                        <div className="text-[#8E8E93] italic">No Expiry</div>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(doc.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <DocumentPreviewModal doc={doc} />
                    </td>
                    {session.role === 'OWNER' && (
                      <td className="py-3 px-4 text-right">
                        <DeleteDocumentButton documentId={doc.id} docName={doc.docName} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
