import { requireAuth } from '@/lib/session'
import { getTruckByIdAction, getTruckHealthScore2Action, getTruckDigitalLogbookAction } from '@/app/actions/truckActions'
import { getTiresAction } from '@/app/actions/tireActions'
import { TruckWorkspaceTabs } from '@/components/trucks/TruckWorkspaceTabs'
import { notFound } from 'next/navigation'
import { Truck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

import { UploadTruckPhotoModal } from '../UploadTruckPhotoModal'

interface TruckDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TruckDetailPage({ params }: TruckDetailPageProps) {
  const session = await requireAuth()
  const { id } = await params

  const [truck, healthScore, digitalLogbook, allTires] = await Promise.all([
    getTruckByIdAction(id),
    getTruckHealthScore2Action(id),
    getTruckDigitalLogbookAction(id),
    getTiresAction(),
  ])

  if (!truck) {
    notFound()
  }

  const unmountedTires = allTires.filter((t: any) => t.status === 'NEW' || !t.currentPosition)

  return (
    <div className="space-y-8 text-[#1D1D1F]">
      {/* Back CTA */}
      <div>
        <Link
          href="/trucks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Fleet Truck
        </Link>

        {/* Header Profile Card - Light Apple Aesthetic */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {truck.photoUrl ? (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-black/[0.08] shadow-xs shrink-0 group">
                <Image src={truck.photoUrl} alt={truck.policeNumber} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center border border-[#007AFF]/20 shrink-0">
                <Truck className="w-10 h-10" />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 uppercase tracking-wider">
                  {truck.truckCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/20 uppercase">
                  {truck.status}
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
                {truck.brand} {truck.model} {truck.variant}
              </h1>
              <p className="text-xs font-mono font-medium text-[#6E6E73]">
                {truck.policeNumber} · {truck.driveConfiguration} · {truck.transmission} · {truck.fuelTankConfiguration}
              </p>
              {session.role === 'OWNER' && (
                <div className="pt-1">
                  <UploadTruckPhotoModal
                    truckId={truck.id}
                    truckCode={truck.truckCode}
                    policeNumber={truck.policeNumber}
                    currentPhotoUrl={truck.photoUrl}
                    triggerText={truck.photoUrl ? 'Ganti Foto Truck' : 'Upload Foto Truck'}
                    buttonClassName="px-3 py-1 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] font-semibold text-[11px] border border-black/[0.06] transition-colors inline-flex items-center gap-1.5"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-medium text-[#6E6E73] border-t md:border-t-0 md:border-l border-black/[0.06] pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="block text-[10px] text-[#6E6E73]">Nomor Rangka</span>
              <span className="font-mono font-semibold text-[#1D1D1F]">
                {truck.chassisNumber || 'Not recorded'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#6E6E73]">Nomor Mesin</span>
              <span className="font-mono font-semibold text-[#1D1D1F]">
                {truck.engineNumber || 'Not recorded'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#6E6E73]">Health Score 2.0</span>
              <span className="font-mono font-bold text-[#34C759]">
                {healthScore.status === 'CALCULATED' ? `${healthScore.score} (${healthScore.label})` : 'Not enough data'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 9-Tab Workspace Container */}
      <TruckWorkspaceTabs
        truck={truck}
        healthScore={healthScore}
        digitalLogbook={digitalLogbook}
        availableUnmountedTires={unmountedTires}
        userRole={session.role}
      />
    </div>
  )
}
