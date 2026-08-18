'use client'

import React, { useState } from 'react'
import { deleteCustomerAction } from '@/app/actions/customerActions'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface DeleteCustomerButtonProps {
  customerId: string
  customerName: string
}

export function DeleteCustomerButton({ customerId, customerName }: DeleteCustomerButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleConfirmDelete() {
    try {
      setLoading(true)
      setError(null)
      const res = await deleteCustomerAction(customerId)
      if (res.error) {
        setError(res.error)
        setIsOpen(false)
      } else {
        router.push('/customers')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Pelanggan"
        description={`Apakah Anda yakin ingin menghapus pelanggan "${customerName}"? Data pelanggan akan dihapus.`}
        confirmText="Ya, Hapus Pelanggan"
        cancelText="Batal"
        variant="danger"
        loading={loading}
      />

      {error && (
        <div className="mb-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-900">
          {error}
        </div>
      )}
      <button
        onClick={() => setIsOpen(true)}
        disabled={loading}
        className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
        {loading ? 'Menghapus...' : 'Hapus Pelanggan'}
      </button>
    </div>
  )
}
