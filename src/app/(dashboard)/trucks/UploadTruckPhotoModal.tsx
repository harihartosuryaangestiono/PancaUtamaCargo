'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateTruckMainPhotoAction } from '@/app/actions/truckActions'
import {
  Camera,
  X,
  Crop,
  AlertCircle,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Move,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'

interface UploadTruckPhotoModalProps {
  truckId: string
  truckCode: string
  policeNumber: string
  currentPhotoUrl?: string | null
  triggerText?: string
  buttonClassName?: string
}

export function UploadTruckPhotoModal({
  truckId,
  truckCode,
  policeNumber,
  currentPhotoUrl,
  triggerText = 'Ganti / Crop Foto Truck',
  buttonClassName = 'px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#1D1D1F] border border-black/[0.08] font-semibold text-xs transition-all inline-flex items-center gap-1.5 shadow-2xs',
}: UploadTruckPhotoModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Image & Crop state
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null)
  const [zoom, setZoom] = useState<number>(1)
  const [rotate, setRotate] = useState<number>(0)
  const [panX, setPanX] = useState<number>(0)
  const [panY, setPanY] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  function handleOpen() {
    setPreview(currentPhotoUrl || null)
    setZoom(1)
    setRotate(0)
    setPanX(0)
    setPanY(0)
    setError(null)
    setIsOpen(true)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Mohon pilih file gambar yang valid (JPG, PNG, WebP).')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran file gambar maksimal 10MB.')
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result as string)
      setZoom(1)
      setRotate(0)
      setPanX(0)
      setPanY(0)
    }
    reader.readAsDataURL(file)
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!preview) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return
    setPanX(e.clientX - dragStart.x)
    setPanY(e.clientY - dragStart.y)
  }

  function handleMouseUp() {
    setIsDragging(false)
  }

  function resetAdjustments() {
    setZoom(1)
    setRotate(0)
    setPanX(0)
    setPanY(0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!preview) {
      setError('Silakan pilih foto armada terlebih dahulu.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Create a canvas to apply crop, scale, rotate
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = preview

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      const targetWidth = 1200
      const targetHeight = 675 // 16:9 aspect ratio
      canvas.width = targetWidth
      canvas.height = targetHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Gagal menginisialisasi canvas context.')

      // Fill background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, targetWidth, targetHeight)

      // Apply transformations
      ctx.save()
      ctx.translate(targetWidth / 2 + (panX * 3), targetHeight / 2 + (panY * 3))
      ctx.rotate((rotate * Math.PI) / 180)
      ctx.scale(zoom, zoom)

      // Draw image centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      ctx.restore()

      const processedDataUrl = canvas.toDataURL('image/jpeg', 0.88)

      const res = await updateTruckMainPhotoAction(truckId, processedDataUrl)

      if (res.error) {
        setError(res.error)
        return
      }

      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan dan memotong foto armada.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className={buttonClassName}>
        <Camera className="w-3.5 h-3.5 text-[#007AFF]" />
        {triggerText}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none text-[#1D1D1F]">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-black/[0.08] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3.5">
              <div>
                <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest flex items-center gap-1">
                  <Crop className="w-3 h-3" /> TRUCK IMAGE CROPPER &amp; EDITOR
                </span>
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Upload &amp; Sesuaikan Foto {policeNumber} ({truckCode})
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Interactive Crop Box Viewport */}
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative rounded-xl overflow-hidden bg-[#F5F5F7] border-2 ${
                  isDragging ? 'border-[#007AFF] cursor-grabbing' : 'border-black/[0.08] cursor-grab'
                } h-60 flex items-center justify-center group shadow-inner`}
              >
                {preview ? (
                  <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-75"
                    style={{
                      transform: `translate(${panX}%, ${panY}%) scale(${zoom}) rotate(${rotate}deg)`,
                    }}
                  >
                    <img src={preview} alt="Preview Truck" className="max-w-full max-h-full object-contain pointer-events-none" />
                  </div>
                ) : (
                  <div className="text-center text-[#8E8E93] p-4 space-y-2 pointer-events-none">
                    <ImageIcon className="w-10 h-10 mx-auto opacity-30 text-[#007AFF]" />
                    <p className="text-xs font-semibold text-[#1D1D1F]">Belum Ada Foto Terpasang</p>
                    <p className="text-[10px] text-[#6E6E73]">Pilih foto truk dari komputer/HP Anda di bawah ini</p>
                  </div>
                )}

                {/* 16:9 Rule-of-Thirds Grid Overlay */}
                {preview && (
                  <div className="absolute inset-0 border border-black/10 pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between text-[10px] font-mono text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs w-fit">
                      <Move className="w-3 h-3 inline mr-1" /> Geser mouse untuk posisi
                    </div>
                  </div>
                )}

                <label className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-[#1D1D1F] backdrop-blur-md px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer flex items-center gap-1.5 border border-black/[0.08] shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-[#007AFF]" /> Pilih Foto Lain
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              {/* Editing & Crop Adjustment Controls */}
              {preview && (
                <div className="p-4 rounded-xl bg-[#FAFAFA] border border-black/[0.06] space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                    <span className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                      <Crop className="w-3.5 h-3.5 text-[#007AFF]" /> Kontrol Zoom, Rotasi &amp; Posisi
                    </span>
                    <button
                      type="button"
                      onClick={resetAdjustments}
                      className="text-[11px] font-semibold text-[#007AFF] hover:underline inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Ukuran
                    </button>
                  </div>

                  {/* Zoom Controls */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[#1D1D1F] font-semibold">
                      <span className="flex items-center gap-1">
                        <ZoomIn className="w-3.5 h-3.5 text-[#8E8E93]" /> Ukuran Zoom
                      </span>
                      <span className="font-mono text-[#007AFF]">{zoom.toFixed(1)}x</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                        className="p-1.5 rounded-lg bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA]"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-[#007AFF] h-1.5 bg-[#F5F5F7] rounded-lg appearance-none cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                        className="p-1.5 rounded-lg bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA]"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Rotate Control */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold text-[#1D1D1F]">Rotasi Gambar</span>
                    <button
                      type="button"
                      onClick={() => setRotate((r) => (r + 90) % 360)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-black/[0.08] text-[#1D1D1F] font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-[#F5F5F7] transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-[#007AFF]" /> Putar 90° ({rotate}°)
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl font-semibold text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] transition-colors text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !preview}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-[#007AFF] hover:bg-[#0062CC] text-white shadow-2xs transition-all disabled:opacity-50 inline-flex items-center gap-1.5 text-xs"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Mengolah &amp; Menyimpan...' : 'Simpan Foto Truck (Crop)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
