'use client'

import React, { useState } from 'react'
import {
  Upload,
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  CreditCard,
  Building2,
  TrendingUp,
  TrendingDown,
  Scale,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { formatCurrency } from '@/lib/utils/format'
import { formatExcelDate } from '@/lib/utils/parseAmount'
import {
  parseAndSaveKlikBcaCsvAction,
  importBcaMutationsArrayAction,
  RawBcaRow,
  createManualBcaMutationAction,
  deleteBcaMutationAction,
  clearAllBcaMutationsAction,
} from '@/app/actions/bcaMutationActions'



interface BcaMutationItem {
  id: string
  accountNo: string
  accountName: string | null
  currency: string
  date: Date | null
  dateRaw: string
  description: string
  branch: string
  amount: number
  type: string
  balance: number
  createdAt: Date
}

interface BcaSummary {
  accountNo: string
  accountName: string
  currency: string
  startingBalance: number
  totalCredit: number
  totalDebit: number
  endingBalance: number
  count: number
}

interface BcaMutationViewProps {
  initialMutations: BcaMutationItem[]
  initialSummary: BcaSummary
}

export function BcaMutationView({ initialMutations, initialSummary }: BcaMutationViewProps) {
  const [mutations, setMutations] = useState<BcaMutationItem[]>(initialMutations)
  const [summary, setSummary] = useState<BcaSummary>(initialSummary)
  const [searchQuery, setSearchQuery] = useState('')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [csvContent, setCsvContent] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  // Manual create form state
  const [manualForm, setManualForm] = useState({
    dateRaw: '05/08/2026',
    description: '',
    branch: '0000',
    amount: '',
    type: 'CR' as 'CR' | 'DB',
    balance: '',
  })

  // Filtered mutations
  const filteredMutations = mutations.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      item.description.toLowerCase().includes(q) ||
      item.branch.toLowerCase().includes(q) ||
      item.dateRaw.toLowerCase().includes(q) ||
      item.amount.toString().includes(q)
    )
  })

  // Excel Sheet Selection States
  const [excelWorkbook, setExcelWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [parsedExcelRows, setParsedExcelRows] = useState<RawBcaRow[]>([])

  function parseBcaSheetRows(wb: XLSX.WorkBook, sName: string): RawBcaRow[] {
    const worksheet = wb.Sheets[sName]
    if (!worksheet) return []

    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    const rawRows: RawBcaRow[] = []
    let inTable = false

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length === 0) continue

      const col0Raw = row[0] !== undefined ? row[0] : ''
      const col1Raw = row[1] !== undefined ? row[1] : ''

      const col0 = formatExcelDate(col0Raw)
      const col1 = String(col1Raw).trim()

      if (!inTable) {
        if (col0.toLowerCase().includes('date') || col1.toLowerCase().includes('description') || col0.toLowerCase().includes('tanggal')) {
          inTable = true
          continue
        }
      }

      if (inTable) {
        if (col0.toLowerCase().includes('starting balance') || col0.toLowerCase().includes('ending balance')) {
          inTable = false
          continue
        }

        if (col0 || col1) {
          if (col0.toLowerCase().includes('date') || col1.toLowerCase().includes('description')) {
            continue
          }
          rawRows.push({
            dateRaw: col0,
            description: col1,
            branch: row[2] !== undefined ? String(row[2]) : '0000',
            amount: row[3],
            type: row[4] !== undefined ? String(row[4]) : 'CR',
            balance: row[5] !== undefined ? row[5] : row[4],
          })
        }
      }
    }
    return rawRows
  }

  function handleSheetChange(sName: string) {
    setSelectedSheet(sName)
    if (excelWorkbook) {
      const rows = parseBcaSheetRows(excelWorkbook, sName)
      setParsedExcelRows(rows)
    }
  }

  // Handle File Upload Read (Supports .xlsx, .xls, .csv)
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

    const reader = new FileReader()
    if (isExcel) {
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })

          setExcelWorkbook(workbook)
          const names = workbook.SheetNames || []
          setSheetNames(names)

          if (names.length > 0) {
            const firstSheet = names[0]
            setSelectedSheet(firstSheet)
            const rows = parseBcaSheetRows(workbook, firstSheet)
            setParsedExcelRows(rows)
          } else {
            setUploadError('Tidak ada sheet yang ditemukan pada file Excel.')
          }
        } catch (err: any) {
          setUploadError('Gagal membaca file Excel: ' + err.message)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      setExcelWorkbook(null)
      setSheetNames([])
      setSelectedSheet('')
      setParsedExcelRows([])

      reader.onload = (event) => {
        const text = event.target?.result as string
        setCsvContent(text || '')
      }
      reader.readAsText(file)
    }
  }

  // Handle Import Submit
  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploadError(null)

    if (excelWorkbook && parsedExcelRows.length > 0) {
      setLoading(true)
      try {
        const res = await importBcaMutationsArrayAction(parsedExcelRows)
        if ('error' in res && res.error) {
          setUploadError(res.error)
        } else if ('count' in res && res.count) {
          setUploadSuccess(`Berhasil mengimpor ${res.count} baris mutasi dari Sheet "${selectedSheet}"!`)
          setIsImportModalOpen(false)
          window.location.reload()
        }
      } catch (err: any) {
        setUploadError(err.message || 'Gagal mengimpor data Excel.')
      } finally {
        setLoading(false)
      }
      return
    }

    if (!csvContent.trim()) {
      setUploadError('Silakan pilih file Excel / CSV terlebih dahulu.')
      return
    }

    setLoading(true)
    try {
      const res = await parseAndSaveKlikBcaCsvAction(csvContent)
      if ('error' in res && res.error) {
        setUploadError(res.error)
      } else if ('count' in res && res.count) {
        setUploadSuccess(`Berhasil mengimpor ${res.count} baris mutasi rekening BCA!`)
        setIsImportModalOpen(false)
        setCsvContent('')
        window.location.reload()
      }
    } catch (err: any) {
      setUploadError(err.message || 'Gagal mengimpor file CSV KlikBCA.')
    } finally {
      setLoading(false)
    }
  }



  // Handle Manual Form Submit
  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualForm.description || !manualForm.amount || !manualForm.balance) {
      alert('Mohon lengkapi Keterangan, Jumlah Nominal, dan Saldo.')
      return
    }

    setLoading(true)
    try {
      const res = await createManualBcaMutationAction({
        dateRaw: manualForm.dateRaw,
        description: manualForm.description,
        branch: manualForm.branch,
        amount: parseFloat(manualForm.amount) || 0,
        type: manualForm.type,
        balance: parseFloat(manualForm.balance) || 0,
        accountNo: summary.accountNo,
        accountName: summary.accountName,
      })

      if (res.success) {
        setIsCreateModalOpen(false)
        setManualForm({
          dateRaw: '05/08/2026',
          description: '',
          branch: '0000',
          amount: '',
          type: 'CR',
          balance: '',
        })
        window.location.reload()
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan mutasi.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Delete Single Row
  async function handleDelete(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus baris mutasi ini?')) return
    await deleteBcaMutationAction(id)
    setMutations(prev => prev.filter(item => item.id !== id))
  }

  // Handle Clear All Data
  async function handleClearAll() {
    if (!confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA data mutasi rekening BCA? Action ini tidak dapat dibatalkan.')) return
    setLoading(true)
    await clearAllBcaMutationsAction()
    setMutations([])
    setSummary({
      accountNo: '3445565568',
      accountName: 'HARIHARTO SURYA AN',
      currency: 'IDR',
      startingBalance: 0,
      totalCredit: 0,
      totalDebit: 0,
      endingBalance: 0,
      count: 0,
    })
    setLoading(false)
  }

  // Export to CSV
  function handleExportCsv() {
    if (mutations.length === 0) return
    let csv = `Account No.,=,'${summary.accountNo}\nName,=,${summary.accountName}\nCurrency,=,${summary.currency}\n\nDate,Description,Branch,Amount,,Balance\n`
    mutations.forEach((item) => {
      csv += `'${item.dateRaw},"${item.description.replace(/"/g, '""')}",'${item.branch},${item.amount.toFixed(2)},${item.type},${item.balance.toFixed(2)}\n`
    })
    csv += `Starting Balance,=,${summary.startingBalance.toFixed(2)}\nCredit,=,${summary.totalCredit.toFixed(2)}\nDebet,=,${summary.totalDebit.toFixed(2)}\nEnding Balance,=,${summary.endingBalance.toFixed(2)}\n`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Mutasi_BCA_${summary.accountNo}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Top Notification Banner */}
      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-semibold">{uploadSuccess}</span>
          </div>
          <button onClick={() => setUploadSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Info Section (Matches Image 1 Header Card) */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-xs font-bold border border-[#007AFF]/20">
            <Building2 className="w-3.5 h-3.5" />
            <span>KlikBCA Bank Statement Parser</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
              Mutasi Rekening BCA
            </h1>
            <p className="text-xs text-[#6E6E73] font-medium mt-1">
              Catatan mutasi rekening bank resmi BCA sesuai format ekspor CSV KlikBCA.
            </p>
          </div>
        </div>

        {/* Account Details Box matching Image 1 */}
        <div className="bg-[#F5F5F7] border border-black/[0.08] rounded-xl p-4 min-w-[280px] space-y-2">
          <div className="flex items-center justify-between text-xs border-b border-black/[0.06] pb-1.5">
            <span className="font-semibold text-[#6E6E73]">Account No.</span>
            <span className="font-mono font-bold text-[#1D1D1F]">{summary.accountNo}</span>
          </div>
          <div className="flex items-center justify-between text-xs border-b border-black/[0.06] pb-1.5">
            <span className="font-semibold text-[#6E6E73]">Name</span>
            <span className="font-bold text-[#1D1D1F] uppercase">{summary.accountName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#6E6E73]">Currency</span>
            <span className="font-bold text-[#007AFF]">{summary.currency}</span>
          </div>
        </div>
      </div>

      {/* Summary Footer Cards matching Image 1 Bottom Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-black/[0.06] p-5 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-[#8E8E93] mb-2">
            <span className="text-xs font-semibold">Starting Balance</span>
            <Scale className="w-4 h-4 text-[#8E8E93]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#1D1D1F]">
            {formatCurrency(summary.startingBalance)}
          </p>
          <span className="text-[10px] text-[#6E6E73] mt-1 block">Saldo Awal Periode</span>
        </div>

        <div className="bg-white rounded-xl border border-black/[0.06] p-5 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-[#34C759] mb-2">
            <span className="text-xs font-semibold text-[#6E6E73]">Total Credit (CR)</span>
            <TrendingUp className="w-4 h-4 text-[#34C759]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#34C759]">
            {formatCurrency(summary.totalCredit)}
          </p>
          <span className="text-[10px] text-[#34C759] font-medium mt-1 block">+ Pemasukan Transfer</span>
        </div>

        <div className="bg-white rounded-xl border border-black/[0.06] p-5 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-[#FF3B30] mb-2">
            <span className="text-xs font-semibold text-[#6E6E73]">Total Debet (DB)</span>
            <TrendingDown className="w-4 h-4 text-[#FF3B30]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#FF3B30]">
            {formatCurrency(summary.totalDebit)}
          </p>
          <span className="text-[10px] text-[#FF3B30] font-medium mt-1 block">- Pengeluaran & Admin</span>
        </div>

        <div className="bg-white rounded-xl border border-[#007AFF]/20 bg-gradient-to-br from-white to-[#007AFF]/5 p-5 shadow-xs hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-[#007AFF] mb-2">
            <span className="text-xs font-semibold">Ending Balance</span>
            <CreditCard className="w-4 h-4 text-[#007AFF]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#007AFF]">
            {formatCurrency(summary.endingBalance)}
          </p>
          <span className="text-[10px] text-[#007AFF] font-medium mt-1 block">Saldo Akhir Mutasi</span>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="bg-white rounded-xl border border-black/[0.06] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
          <input
            type="text"
            placeholder="Cari keterangan, cabang, tanggal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF] font-medium"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#007AFF] text-white hover:bg-[#0066CC] transition-all shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV KlikBCA</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA] border border-black/[0.08] transition-all"
          >
            <Plus className="w-4 h-4 text-[#007AFF]" />
            <span>Tambah Baris</span>
          </button>

          {mutations.length > 0 && (
            <>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] border border-black/[0.08] transition-all"
                title="Export CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Export</span>
              </button>

              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#FF3B30] hover:bg-rose-50 border border-rose-200 transition-all"
                title="Reset Data Mutasi"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Reset</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Mutasi Data Table matching Image 1 */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#F5F5F7] text-[#1D1D1F] uppercase font-bold tracking-wider border-b border-black/[0.08]">
              <tr>
                <th className="py-3 px-4 w-32 border-r border-black/[0.06]">Date</th>
                <th className="py-3 px-4 border-r border-black/[0.06]">Description</th>
                <th className="py-3 px-4 w-28 text-center border-r border-black/[0.06]">Branch</th>
                <th className="py-3 px-4 w-40 text-right border-r border-black/[0.06]">Amount</th>
                <th className="py-3 px-4 w-20 text-center border-r border-black/[0.06]">Type</th>
                <th className="py-3 px-4 w-44 text-right border-r border-black/[0.06]">Balance</th>
                <th className="py-3 px-4 w-12 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06] font-mono text-[11px]">
              {filteredMutations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8E8E93] font-sans">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#007AFF]" />
                    <p className="font-semibold text-[#1D1D1F]">Belum ada data mutasi BCA</p>
                    <p className="text-xs text-[#6E6E73] mt-1">
                      Klik <span className="font-bold text-[#007AFF]">"Import CSV KlikBCA"</span> di atas untuk mengunggah file CSV mutasi rekening dari KlikBCA.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMutations.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-[#F0F6FF] transition-colors ${
                      idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                    }`}
                  >
                    {/* Date */}
                    <td className="py-2.5 px-4 font-bold text-[#1D1D1F] whitespace-nowrap border-r border-black/[0.06]">
                      {row.dateRaw.startsWith("'") ? row.dateRaw : `'${row.dateRaw}`}
                    </td>

                    {/* Description */}
                    <td className="py-2.5 px-4 font-sans text-[#1D1D1F] border-r border-black/[0.06] leading-snug">
                      {row.description}
                    </td>

                    {/* Branch */}
                    <td className="py-2.5 px-4 text-center font-bold text-[#6E6E73] border-r border-black/[0.06]">
                      {row.branch.startsWith("'") ? row.branch : `'${row.branch}`}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-4 text-right font-bold border-r border-black/[0.06]">
                      <span className={row.type === 'CR' ? 'text-[#34C759]' : 'text-[#FF3B30]'}>
                        {row.amount.toFixed(2)}
                      </span>
                    </td>

                    {/* Type CR / DB */}
                    <td className="py-2.5 px-4 text-center border-r border-black/[0.06]">
                      {row.type === 'CR' ? (
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-[#34C759]/10 text-[#248A3D] border border-[#34C759]/30">
                          CR
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30">
                          DB
                        </span>
                      )}
                    </td>

                    {/* Balance */}
                    <td className="py-2.5 px-4 text-right font-bold text-[#1D1D1F] border-r border-black/[0.06]">
                      {row.balance.toFixed(2)}
                    </td>

                    {/* Delete Action */}
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-rose-50 rounded transition-colors"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary Row matching Image 1 */}
        {filteredMutations.length > 0 && (
          <div className="bg-[#F5F5F7] border-t border-black/[0.08] p-4 text-xs font-mono font-bold space-y-1.5">
            <div className="flex justify-between items-center text-[#6E6E73] border-b border-black/[0.06] pb-1">
              <span>Starting Balance =</span>
              <span className="text-[#1D1D1F]">{summary.startingBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[#34C759] border-b border-black/[0.06] pb-1">
              <span>Credit =</span>
              <span>{summary.totalCredit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[#FF3B30] border-b border-black/[0.06] pb-1">
              <span>Debet =</span>
              <span>{summary.totalDebit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[#007AFF] pt-1 text-sm">
              <span>Ending Balance =</span>
              <span>{summary.endingBalance.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal Import CSV KlikBCA */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-black/[0.08] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#1D1D1F]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#007AFF]" />
                <h3 className="text-base font-bold">Import CSV Mutasi KlikBCA</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-[#8E8E93] hover:text-[#1D1D1F] rounded-lg hover:bg-[#F5F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-5">
              {uploadError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#1D1D1F]">
                  1. Pilih File Excel (.xlsx / .xls) atau CSV / TXT Ekspor dari KlikBCA:
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-[#6E6E73] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#007AFF]/10 file:text-[#007AFF] hover:file:bg-[#007AFF]/20 cursor-pointer"
                />
              </div>

              {/* Sheet Selector & Live Preview for Excel Files */}
              {sheetNames.length > 0 && (
                <div className="space-y-3 p-4 rounded-xl bg-blue-50/80 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0033CC] flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#007AFF]" />
                      <span>Pilih Sheet / Lembar Kerja ({sheetNames.length} Sheet Ditemukan):</span>
                    </label>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {parsedExcelRows.length} Mutasi Ditemukan
                    </span>
                  </div>

                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="w-full text-xs font-bold bg-white text-[#1D1D1F] border border-blue-300 rounded-xl px-3 py-2 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 cursor-pointer"
                  >
                    {sheetNames.map((name) => (
                      <option key={name} value={name}>
                        📄 Sheet: {name}
                      </option>
                    ))}
                  </select>

                  {/* Preview Table */}
                  {parsedExcelRows.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[11px] font-semibold text-[#6E6E73]">Pratinjau Data (3 Baris Pertama):</p>
                      <div className="bg-white rounded-lg border border-black/[0.08] overflow-hidden text-[11px]">
                        <table className="w-full text-left">
                          <thead className="bg-[#003B6D] text-white text-[10px] uppercase font-bold">
                            <tr>
                              <th className="p-1.5">Tanggal</th>
                              <th className="p-1.5">Keterangan</th>
                              <th className="p-1.5 text-center">Tipe</th>
                              <th className="p-1.5 text-right">Nominal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {parsedExcelRows.slice(0, 3).map((r, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-1.5 text-[#0033CC] font-bold">{r.dateRaw}</td>
                                <td className="p-1.5 truncate max-w-[200px] text-slate-700 font-sans">{r.description}</td>
                                <td className="p-1.5 text-center font-bold">{r.type}</td>
                                <td className="p-1.5 text-right">{r.amount ? `Rp ${Number(r.amount).toLocaleString('id-ID')}` : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {sheetNames.length === 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#1D1D1F]">
                    2. Atau Tempelkan Text CSV KlikBCA di sini:
                  </label>
                  <textarea
                    rows={6}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    placeholder={`Contoh format KlikBCA:
Account No.,=,'3445565568
Name,=,HARIHARTO SURYA AN
Currency,=,IDR

Date,Description,Branch,Amount,,Balance
'05/08/2026,"BI-FAST CR TRANSFER DR 023 RACHMAT SENDJAJA",'0000,500000.00,CR,500000.00`}
                    className="w-full p-3 text-xs font-mono bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                  />
                </div>
              )}


              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold bg-[#007AFF] text-white rounded-xl hover:bg-[#0066CC] disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Proses &amp; Simpan Mutasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Create Manual Row */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-black/[0.08] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#1D1D1F]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
              <h3 className="text-base font-bold">Tambah Baris Mutasi Manual</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[#8E8E93] hover:text-[#1D1D1F] rounded-lg hover:bg-[#F5F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Date (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    value={manualForm.dateRaw}
                    onChange={(e) => setManualForm({ ...manualForm, dateRaw: e.target.value })}
                    placeholder="05/08/2026"
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Branch (Cabang)</label>
                  <input
                    type="text"
                    value={manualForm.branch}
                    onChange={(e) => setManualForm({ ...manualForm, branch: e.target.value })}
                    placeholder="0000"
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description (Keterangan)</label>
                <textarea
                  rows={2}
                  value={manualForm.description}
                  onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                  placeholder="TRANSFER BI-FAST DR..."
                  className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nominal Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualForm.amount}
                    onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                    placeholder="500000"
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Tipe (CR/DB)</label>
                  <select
                    value={manualForm.type}
                    onChange={(e) => setManualForm({ ...manualForm, type: e.target.value as 'CR' | 'DB' })}
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF] font-bold"
                  >
                    <option value="CR">CR (Credit)</option>
                    <option value="DB">DB (Debit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Running Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualForm.balance}
                    onChange={(e) => setManualForm({ ...manualForm, balance: e.target.value })}
                    placeholder="500000"
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold bg-[#007AFF] text-white rounded-xl hover:bg-[#0066CC] disabled:opacity-50"
                >
                  Tambah Baris
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
