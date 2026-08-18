import { requireAuth } from '@/lib/session'
import { getAuditLogsAction } from '@/app/actions/auditActions'
import { Shield, Lock, Activity, Database, User as UserIcon } from 'lucide-react'
import Link from 'next/link'

interface AuditPageProps {
  searchParams: Promise<{
    search?: string
    module?: string
    action?: string
    page?: string
  }>
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const session = await requireAuth()
  const params = await searchParams

  if (session.role !== 'OWNER') {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] max-w-xl mx-auto space-y-4 text-[#1D1D1F]">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#FF3B30] flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-[#1D1D1F]">Akses Ditolak (HTTP 403)</h2>
        <p className="text-xs text-[#6E6E73] leading-relaxed">
          Fitur Audit Log &amp; System Audit Center secara ketat hanya dapat diakses oleh peran **OWNER**. Akun FINANCE tidak memiliki izin melihat jejak audit sistem.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D1D1F] text-white text-xs font-semibold rounded-xl hover:bg-black transition-colors"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    )
  }

  const search = params.search || ''
  const moduleFilter = params.module || ''
  const page = Number(params.page || 1)

  const result = await getAuditLogsAction({
    search,
    module: moduleFilter || undefined,
    page,
    pageSize: 25,
  })

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#007AFF]" />
            <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
              Enterprise Audit Log &amp; Security Center
            </h2>
          </div>
          <p className="text-xs text-[#6E6E73] mt-1">
            Jejak aktivitas, perubahan data, dan log keamanan seluruh pengguna sistem (Owner Only).
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-5 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#007AFF]" />
            <h3 className="font-semibold text-[#1D1D1F] text-sm">Riwayat Aktivitas System Audit</h3>
          </div>
          <span className="text-xs text-[#6E6E73] font-mono">{result.totalCount} Catatan Audit</span>
        </div>

        {result.logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8E8E93] space-y-2">
            <Database className="w-8 h-8 mx-auto text-[#8E8E93]" />
            <p className="font-semibold text-[#1D1D1F]">Belum Ada Catatan Audit Log</p>
            <p className="text-[11px] text-[#6E6E73]">Catatan audit akan otomatis terisi saat pengguna melakukan mutasi data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-black/[0.06] text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Modul</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Detail Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] text-xs font-medium">
                {result.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F5F5F7] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#6E6E73] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1D1D1F]">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-[#8E8E93]" />
                        <span>{log.userName}</span>
                        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#F5F5F7] text-[#6E6E73] border border-black/[0.06]">
                          {log.role}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded-md font-semibold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-[#1D1D1F]">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#6E6E73] truncate max-w-[120px]">
                      {log.recordId || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-[#6E6E73] max-w-xs truncate">
                      {log.afterValue ? (
                        <span className="font-mono text-[10px] text-[#6E6E73]">{log.afterValue}</span>
                      ) : (
                        <span className="italic text-[#8E8E93]">Tanpa metadata tambahan</span>
                      )}
                    </td>
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
