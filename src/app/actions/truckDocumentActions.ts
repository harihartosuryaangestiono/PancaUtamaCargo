'use server'

import { prisma } from '@/lib/prisma'
import { requireOwner, requireAuth } from '@/lib/session'
import { createAuditLog } from '@/lib/services/auditService'
import { revalidatePath } from 'next/cache'

export interface CreateTruckDocumentInput {
  truckId: string
  docName: string
  docType: string // STNK, KIR, INSURANCE, PURCHASE_INVOICE, CHASSIS_DOCUMENT, VEHICLE_REGISTRATION, OTHER
  issueDate?: string
  expiryDate?: string
  attachmentUrl?: string
  notes?: string
}

export async function createTruckDocumentAction(input: CreateTruckDocumentInput) {
  await requireOwner()

  if (!input.truckId || !input.docName || !input.docType) {
    return { error: 'Truck ID, Nama Dokumen, dan Tipe Dokumen wajib diisi.' }
  }

  const doc = await prisma.truckDocument.create({
    data: {
      truckId: input.truckId,
      docName: input.docName,
      docType: input.docType,
      issueDate: input.issueDate ? new Date(input.issueDate) : null,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      attachmentUrl: input.attachmentUrl || null,
      notes: input.notes || null,
    },
  })

  await createAuditLog({
    action: 'CREATE_TRUCK_DOCUMENT',
    module: 'TRUCK_DOCUMENT',
    recordId: doc.id,
    afterValue: doc,
  })

  revalidatePath(`/trucks/${input.truckId}`)
  revalidatePath('/documents')
  revalidatePath('/dashboard')
  return { success: true, document: doc }
}

export async function deleteTruckDocumentAction(documentId: string) {
  await requireOwner()

  const doc = await prisma.truckDocument.findUnique({ where: { id: documentId } })
  if (!doc) return { error: 'Dokumen tidak ditemukan.' }

  await prisma.truckDocument.delete({ where: { id: documentId } })

  await createAuditLog({
    action: 'DELETE_TRUCK_DOCUMENT',
    module: 'TRUCK_DOCUMENT',
    recordId: documentId,
    beforeValue: doc,
  })

  revalidatePath(`/trucks/${doc.truckId}`)
  revalidatePath('/documents')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getTruckDocumentsAction(truckId?: string) {
  await requireAuth()

  const whereClause = truckId ? { truckId } : {}
  const docs = await prisma.truckDocument.findMany({
    where: whereClause,
    include: { truck: true },
    orderBy: { expiryDate: 'asc' },
  })

  const now = Date.now()

  return docs.map((doc: any) => {
    let status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' = 'VALID'
    let daysUntilExpiry: number | null = null

    if (doc.expiryDate) {
      const diffTime = doc.expiryDate.getTime() - now
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (daysUntilExpiry < 0) {
        status = 'EXPIRED'
      } else if (daysUntilExpiry <= 30) {
        status = 'EXPIRING_SOON'
      }
    }

    return {
      ...doc,
      status,
      daysUntilExpiry,
    }
  })
}
