import { requireOwner } from '@/lib/session'
import { getCompanySettingsAction, getUsersAction, getAuditLogsAction } from '@/app/actions/settingsActions'
import { formatDate } from '@/lib/utils/format'
import { Settings, Shield, Users } from 'lucide-react'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  // Server-Side RBAC Guard: Strictly OWNER only! Finance gets 403 / redirect
  const session = await requireOwner()

  const settings = await getCompanySettingsAction()
  const users = await getUsersAction()
  const auditLogs = await getAuditLogsAction()

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      <div>
        <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
          Pengaturan Sistem &amp; Security Audit
        </h2>
        <p className="text-xs text-[#6E6E73]">
          Konfigurasi default tire lifetime, manajemen pengguna, dan riwayat aktivitas audit log.
        </p>
      </div>

      {/* Fleet & Tire Settings */}
      <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-black/[0.06]">
          <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1D1D1F]">
              Pengaturan Armada &amp; Baseline Ban
            </h3>
            <p className="text-xs text-[#6E6E73]">
              Baseline expected lifetime ban baru (Standard: 60.000 KM)
            </p>
          </div>
        </div>

        <SettingsForm settings={settings} />
      </div>

      {/* Authorized Users */}
      <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-black/[0.06]">
          <div className="w-8 h-8 rounded-xl bg-[#34C759]/10 text-[#248A3D] flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1D1D1F]">
              Pengguna Terdaftar System (RBAC)
            </h3>
            <p className="text-xs text-[#6E6E73]">Akses terbatas: Hariharto (Owner) &amp; Emily (Finance)</p>
          </div>
        </div>

        <div className="divide-y divide-black/[0.06]">
          {users.map((u) => (
            <div key={u.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-[#1D1D1F] block">
                  {u.name}
                </span>
                <span className="text-[11px] text-[#6E6E73]">{u.email}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                u.role === 'OWNER'
                  ? 'bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20'
                  : 'bg-[#FF9500]/10 text-[#C67300] border border-[#FF9500]/20'
              }`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log */}
      <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-black/[0.06]">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1D1D1F]">
              Audit Log Aktivitas System
            </h3>
            <p className="text-xs text-[#6E6E73]">Pencatatan real-time seluruh mutasi data oleh pengguna</p>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-[#8E8E93] italic py-4 text-center">Belum ada catatan audit log.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-[#FAFAFA] border border-black/[0.06] text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#007AFF] font-mono mr-2">
                    [{log.action}]
                  </span>
                  <span className="text-[#1D1D1F] font-medium">
                    {log.module} · {log.userName} ({log.role})
                  </span>
                </div>
                <span className="text-[10px] text-[#6E6E73] font-mono">
                  {formatDate(log.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
