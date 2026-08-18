'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteTruckDocumentAction } from '@/app/actions/truckDocumentActions'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface DeleteDocumentButtonProps {
  documentId: string
  docName: string
}

export function DeleteDocumentButton({ documentId, docName }: DeleteDocumentButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirmDelete() {
    try {
      setLoading(true)
      await deleteTruckDocumentAction(documentId)
      setIsOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Dokumen Armada"
        description={`Apakah Anda yakin ingin menghapus dokumen "${docName}"? Data dan lampiran gambar akan dihapus dari arsip.`}
        confirmText="Ya, Hapus Dokumen"
        cancelText="Batal"
        variant="danger"
        loading={loading}
      />

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        title="Hapus Dokumen"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </>
  )
}
