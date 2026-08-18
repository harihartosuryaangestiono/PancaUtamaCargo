import { requireAuth } from '@/lib/session'
import { getTrucksAction } from '@/app/actions/truckActions'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatKm } from '@/lib/utils/format'
import { Truck as TruckIcon, Eye, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { CreateTruckModal } from './CreateTruckModal'
import { UploadTruckPhotoModal } from './UploadTruckPhotoModal'

export default async function TrucksPage() {
  const session = await requireAuth()
  const trucks = await getTrucksAction()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.06]">
        <div>
          <h2 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
            Truck Tronton Management
          </h2>
          <p className="text-xs text-[#6E6E73] font-medium mt-1">
            Kelola armada truck, foto fisik, spesifikasi sasis, dan status operasional.
          </p>
        </div>

        {session.role === 'OWNER' && <CreateTruckModal />}
      </div>

      {/* Truck List or Empty State */}
      {trucks.length === 0 ? (
        <EmptyState
          icon={TruckIcon}
          title="Belum Ada Truck Terdaftar"
          description="Database armada truck saat ini masih 0. Tambahkan truck pertama Anda (Mitsubishi Fighter F61L HD R 6×2 M/T Double Tank)."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trucks.map((truck: any) => {
            const contractCount = truck.tripContracts?.length || 0
            const legCount = truck.tripContracts?.reduce((sum: number, c: any) => sum + (c.legs?.length || 2), 0) || 0
            const totalTrips = Math.max(truck.shipments?.length || 0, legCount || (contractCount * 2))

            return (
              <div
                key={truck.id}
                className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-4 hover:-translate-y-[1px] transition-all duration-200 flex flex-col justify-between"
              >
                {/* Photo Banner Area - Light Apple Canvas */}
                <div className="relative h-52 bg-[#F5F5F7] rounded-xl flex items-center justify-center overflow-hidden group border border-black/[0.06]">
                  {truck.photoUrl ? (
                    <img
                      src={truck.photoUrl}
                      alt={`${truck.brand} ${truck.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center text-[#8E8E93] p-6 space-y-2">
                      <TruckIcon className="w-12 h-12 mx-auto opacity-40 text-[#007AFF]" />
                      <p className="text-xs font-medium text-[#6E6E73]">Belum ada foto fisik truck</p>
                    </div>
                  )}

                  {/* Status Badge Over Image */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-[#34C759] border border-black/[0.06] backdrop-blur-md flex items-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" /> {truck.status}
                    </span>
                  </div>

                  {/* Upload Photo Button Over Image */}
                  {session.role === 'OWNER' && (
                    <div className="absolute bottom-3 right-3">
                      <UploadTruckPhotoModal
                        truckId={truck.id}
                        truckCode={truck.truckCode}
                        policeNumber={truck.policeNumber}
                        currentPhotoUrl={truck.photoUrl}
                        triggerText={truck.photoUrl ? 'Ganti Foto Truck' : 'Upload Foto Truck'}
                        buttonClassName="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#1D1D1F] backdrop-blur-md font-semibold text-xs transition-all inline-flex items-center gap-1.5 shadow-xs border border-black/[0.08]"
                      />
                    </div>
                  )}
                </div>

                {/* Truck Info Content */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 uppercase tracking-wider">
                        {truck.truckCode}
                      </span>
                      <h3 className="text-lg font-semibold text-[#1D1D1F] mt-1">
                        {truck.brand} {truck.model} {truck.variant}
                      </h3>
                      <p className="text-xs font-mono font-medium text-[#6E6E73] mt-0.5">
                        {truck.policeNumber} · {truck.driveConfiguration} · {truck.fuelTankConfiguration}
                      </p>
                    </div>
                  </div>

                  {/* Clean Light KPI Row */}
                  <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#FAFAFA] border border-black/[0.06] text-xs">
                    <div>
                      <span className="text-[#6E6E73] block text-[10px]">Total Distance</span>
                      <span className="font-semibold text-[#1D1D1F]">
                        {formatKm(truck.totalKm)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6E6E73] block text-[10px]">Jumlah Pengiriman</span>
                      <span className="font-semibold text-[#1D1D1F]">
                        {totalTrips} Trip ({contractCount} Kontrak)
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6E6E73] block text-[10px]">Posisi Roda</span>
                      <span className="font-semibold text-[#1D1D1F]">
                        {truck.wheelPositions?.length || 10} Roda (6x2)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/[0.06]">
                    <span className="text-xs text-[#6E6E73]">
                      Harga Beli: {formatCurrency(truck.purchasePrice ? Number(truck.purchasePrice) : null)}
                    </span>
                    <Link
                      href={`/trucks/${truck.id}`}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Detail Profile Truck
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
