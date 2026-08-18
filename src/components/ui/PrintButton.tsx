'use client'

import React from 'react'
import { Printer } from 'lucide-react'

export function PrintButton({ label = 'Cetak Laporan (PDF / Print)' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs print:hidden"
    >
      <Printer className="w-4 h-4 text-blue-500" />
      <span>{label}</span>
    </button>
  )
}
