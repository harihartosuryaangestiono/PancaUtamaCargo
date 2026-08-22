'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Plus, DollarSign, Printer, FileText, Receipt } from 'lucide-react'
import { recordDriverAdvanceAction, settleDriverAction } from '@/app/actions/driverSettlementActions'
import { updateContractStatusAction } from '@/app/actions/contractActions'
import { formatCurrency } from '@/lib/utils/format'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EditContractCostsModal } from '../EditContractCostsModal'

interface ContractDetailClientProps {
  contract: any
  userRole: 'OWNER' | 'FINANCE'
  customers?: Array<{ id: string; name: string }>
  trucks?: Array<{ id: string; policeNumber: string; brand: string; model: string }>
  drivers?: Array<{ id: string; driverCode: string; name: string; status?: string }>
}

export function ContractDetailClient({ contract, userRole, customers = [], trucks = [], drivers = [] }: ContractDetailClientProps) {
  const router = useRouter()
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false)
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false)
  const [isConfirmCompleteOpen, setIsConfirmCompleteOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [advanceAmount, setAdvanceAmount] = useState('3000000')
  const [resolution, setResolution] = useState<'RETURN_TO_COMPANY' | 'ADDITIONAL_PAYMENT' | 'OFFSET_TO_NEXT_TRIP' | 'OTHER'>('RETURN_TO_COMPANY')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOwner = userRole === 'OWNER'

  async function handleRecordAdvance() {
    try {
      setLoading(true)
      setError(null)
      const res = await recordDriverAdvanceAction({
        contractId: contract.id,
        driverName: contract.driverName,
        amount: Number(advanceAmount),
      })
      if (res.error) {
        setError(res.error)
        return
      }
      setIsAdvanceModalOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan uang jalan.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSettleDriver() {
    try {
      setLoading(true)
      setError(null)
      const res = await settleDriverAction({
        contractId: contract.id,
        driverName: contract.driverName,
        driverShare: contract.driverAllocation,
        driverToll: contract.totalDriverToll,
        companyToll: contract.totalCompanyToll,
        totalDriverEntitlement: contract.totalDriverEntitlement,
        advanceAmount: contract.totalAdvance,
        resolution,
      })
      if (res.error) {
        setError(res.error)
        return
      }
      setIsSettlementModalOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Gagal memproses totalan supir.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={isConfirmCompleteOpen}
        onClose={() => setIsConfirmCompleteOpen(false)}
        onConfirm={async () => {
          try {
            setActionLoading(true)
            await updateContractStatusAction(contract.id, 'COMPLETED')
            setIsConfirmCompleteOpen(false)
            router.refresh()
          } finally {
            setActionLoading(false)
          }
        }}
        title="Tandai Kontrak Perjalanan Selesai"
        description={`Apakah Anda yakin ingin menandai Kontrak ${contract.contractNumber} ini sebagai COMPLETED? Perjalanan armada dianggap telah selesai.`}
        confirmText="Ya, Tandai Completed"
        cancelText="Batal"
        variant="success"
        loading={actionLoading}
      />

      {/* Primary Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {isOwner && (
          <>
            <button
              onClick={() => setIsAdvanceModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white font-semibold text-xs shadow-2xs transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Catat Uang Jalan Tambahan
            </button>

            <button
              onClick={() => setIsSettlementModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#34C759] hover:bg-[#28A745] text-white font-semibold text-xs shadow-2xs transition-colors inline-flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" /> Proses Totalan Supir (Settlement)
            </button>

            <EditContractCostsModal
              contract={contract}
              customers={customers}
              trucks={trucks}
              drivers={drivers}
              buttonClassName="px-4 py-2.5 rounded-xl bg-[#FF9500] hover:bg-[#E08200] text-white font-semibold text-xs shadow-2xs transition-colors inline-flex items-center gap-2"
              triggerText="Edit Kontrak & Nilai (ERP 1 & 2)"
            />

            {contract.status !== 'COMPLETED' && (
              <button
                onClick={() => setIsConfirmCompleteOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white font-semibold text-xs shadow-2xs transition-colors inline-flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Tandai Kontrak Selesai
              </button>
            )}
          </>
        )}

        {/* Print Document Shortcuts */}
        <Link
          href={`/contracts/${contract.id}/surat-jalan`}
          className="px-4 py-2.5 rounded-xl bg-white text-[#1D1D1F] hover:bg-[#F5F5F7] border border-black/[0.08] font-semibold text-xs shadow-2xs transition-colors inline-flex items-center gap-2"
        >
          <Printer className="w-4 h-4 text-[#007AFF]" /> Cetak Surat Jalan
        </Link>

        <Link
          href={`/contracts/${contract.id}/invoice`}
          className="px-4 py-2.5 rounded-xl bg-white text-[#1D1D1F] hover:bg-[#F5F5F7] border border-black/[0.08] font-semibold text-xs shadow-2xs transition-colors inline-flex items-center gap-2"
        >
          <FileText className="w-4 h-4 text-[#34C759]" /> Cetak Invoice Tagihan
        </Link>

        <Link
          href={`/contracts/${contract.id}/settlement/receipt`}
          className="px-4 py-2.5 rounded-xl bg-white text-[#1D1D1F] hover:bg-[#F5F5F7] border border-black/[0.08] font-semibold text-xs shadow-2xs transition-colors inline-flex items-center gap-2"
        >
          <Receipt className="w-4 h-4 text-[#FF9500]" /> Cetak Kuitansi Totalan
        </Link>
      </div>

      {/* Record Advance Modal */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-black/[0.08] shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-[#1D1D1F]">Catat Uang Jalan Supir</h3>
            {error && <p className="text-xs text-[#FF3B30] font-semibold">{error}</p>}
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Nominal Uang Jalan (Rp)</label>
              <input
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-xs font-semibold text-[#1D1D1F]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsAdvanceModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F5F5F7] text-[#1D1D1F]">
                Batal
              </button>
              <button onClick={handleRecordAdvance} disabled={loading} className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#007AFF] text-white">
                {loading ? 'Simpan...' : 'Simpan Uang Jalan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Totalan Supir Settlement Modal */}
      {isSettlementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-black/[0.08] shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-semibold text-[#1D1D1F]">Proses Totalan Supir (Driver Settlement)</h3>
            {error && <p className="text-xs text-[#FF3B30] font-semibold">{error}</p>}

            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-2">
              <div className="flex justify-between text-[#6E6E73]">
                <span>Nilai Kontrak Kotor (ERP 1 + ERP 2):</span>
                <span className="font-semibold text-[#1D1D1F]">{formatCurrency(contract.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-[#007AFF] font-medium">
                <span>Bagian Supir (53% dari Kontrak Kotor):</span>
                <span className="font-semibold">{formatCurrency(contract.driverAllocation)}</span>
              </div>
              <div className="flex justify-between text-[#248A3D] font-medium">
                <span>+ Reimbursement Tol Perusahaan (60%):</span>
                <span className="font-semibold">+{formatCurrency(contract.totalCompanyToll)}</span>
              </div>
              <div className="flex justify-between text-[#1D1D1F] font-bold border-t border-black/[0.06] pt-1.5">
                <span>Total Hak Supir (Totalan Kotor):</span>
                <span>{formatCurrency(contract.totalDriverEntitlement)}</span>
              </div>
              <div className="flex justify-between text-[#FF9500]">
                <span>Total Uang Jalan Diberikan (Advance):</span>
                <span className="font-semibold">-{formatCurrency(contract.totalAdvance)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-black/[0.06] pt-2 text-[#1D1D1F]">
                <span>Selisih Totalan (Difference):</span>
                <span className={contract.settlementDiff >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}>
                  {formatCurrency(contract.settlementDiff)}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1D1D1F] mb-1">Penyelesaian Selisih Totalan</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] font-medium text-[#1D1D1F]"
              >
                <option value="RETURN_TO_COMPANY">Pengembalian Ke Perusahaan (Jika Advance Kelebihan)</option>
                <option value="ADDITIONAL_PAYMENT">Pembayaran Kekurangan Ke Supir</option>
                <option value="OFFSET_TO_NEXT_TRIP">Potong Uang Jalan Trip Berikutnya</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsSettlementModalOpen(false)} className="px-4 py-2 rounded-xl font-semibold bg-[#F5F5F7] text-[#1D1D1F]">
                Batal
              </button>
              <button onClick={handleSettleDriver} disabled={loading} className="px-4 py-2 rounded-xl font-semibold bg-[#34C759] text-white">
                {loading ? 'Memproses...' : 'Konfirmasi Totalan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
