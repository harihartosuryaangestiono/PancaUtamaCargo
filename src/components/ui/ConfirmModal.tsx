'use client'

import React from 'react'
import { AlertTriangle, CheckCircle, Trash2, Info, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'success' | 'info'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'warning',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: Trash2,
          iconBg: 'bg-rose-50 text-[#FF3B30] border-rose-200',
          confirmBtn: 'bg-[#FF3B30] hover:bg-[#E03126] text-white',
        }
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'bg-emerald-50 text-[#248A3D] border-emerald-200',
          confirmBtn: 'bg-[#34C759] hover:bg-[#28A745] text-white',
        }
      case 'info':
        return {
          icon: Info,
          iconBg: 'bg-blue-50 text-[#007AFF] border-blue-200',
          confirmBtn: 'bg-[#007AFF] hover:bg-[#0062CC] text-white',
        }
      default:
        return {
          icon: AlertTriangle,
          iconBg: 'bg-amber-50 text-[#C67300] border-amber-200',
          confirmBtn: 'bg-[#FF9500] hover:bg-[#E08200] text-white',
        }
    }
  }

  const styles = getVariantStyles()
  const IconComponent = styles.icon

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 text-[#1D1D1F]">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-black/[0.08] shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-xl border ${styles.iconBg}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1D1D1F] tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-[#6E6E73] mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-[#8E8E93] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-black/[0.06]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${styles.confirmBtn} disabled:opacity-50 inline-flex items-center gap-2`}
          >
            {loading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
