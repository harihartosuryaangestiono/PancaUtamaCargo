'use client'

import React, { useState } from 'react'
import {
  Upload,
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Scale,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Check,
  Edit2,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { formatCurrency } from '@/lib/utils/format'
import { formatExcelDate } from '@/lib/utils/parseAmount'
import { KAS_CATEGORIES } from '@/lib/constants/kasCategories'
import {
  parseAndSaveKasSpreadsheetCsvAction,
  importKasMutationsArrayAction,
  RawKasRow,
  updateKasMutationAction,
  createManualKasMutationAction,
  deleteKasMutationAction,
  clearAllKasMutationsAction,
} from '@/app/actions/kasMutationActions'



interface KasMutationItem {
  id: string
  tanggal: Date | null
  tanggalRaw: string
  keterangan: string
  cabang: string | null
  debit: number
  kredit: number
  saldo: number
  kategori: string
  jenis: string
  catatan: string | null
  pihakUtang: string | null
  statusUtang: string | null
  createdAt: Date
}

interface SummaryData {
  selectedYear: number
  monthlySummary: {
    bulan: string
    pemasukan: number
    pengeluaran: number
    labaRugi: number
  }[]
  totalYearIncome: number
  totalYearExpense: number
  totalYearNet: number
  categoryRecapList: {
    kategori: string
    jenis: string
    total: number
  }[]
}

interface SpreadsheetMutationViewProps {
  initialMutations: KasMutationItem[]
  initialSummary: SummaryData
}

export function SpreadsheetMutationView({
  initialMutations,
  initialSummary,
}: SpreadsheetMutationViewProps) {
  const [activeTab, setActiveTab] = useState<'JURNAL' | 'RINGKASAN'>('JURNAL')
  const [mutations, setMutations] = useState<KasMutationItem[]>(initialMutations)
  const [summaryData, setSummaryData] = useState<SummaryData>(initialSummary)
  const [selectedYear, setSelectedYear] = useState<number>(initialSummary.selectedYear || 2026)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  // Modals & Loaders
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [csvContent, setCsvContent] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  // Manual create form
  const [manualForm, setManualForm] = useState({
    tanggalRaw: '05/08/2026',
    keterangan: '',
    cabang: '0',
    debit: '',
    kredit: '',
    saldo: '',
    kategori: 'Biaya Lain-lain',
    catatan: '',
    pihakUtang: '',
    statusUtang: '',
  })

  // Filtered rows for Tab 1
  const filteredMutations = mutations.filter((item) => {
    const matchesCategory = categoryFilter === 'ALL' || item.kategori === categoryFilter
    if (!matchesCategory) return false

    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      item.keterangan.toLowerCase().includes(q) ||
      (item.catatan && item.catatan.toLowerCase().includes(q)) ||
      (item.pihakUtang && item.pihakUtang.toLowerCase().includes(q)) ||
      item.tanggalRaw.toLowerCase().includes(q) ||
      item.kategori.toLowerCase().includes(q)
    )
  })

  // Handle Inline Update of Kategori, Catatan, Pihak Utang, Status Utang
  async function handleFieldUpdate(id: string, field: 'kategori' | 'catatan' | 'pihakUtang' | 'statusUtang', value: string) {
    // Optimistic update
    setMutations(prev =>
      prev.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value }
          if (field === 'kategori') {
            const matched = KAS_CATEGORIES.find(c => c.name.toLowerCase() === value.toLowerCase())
            if (matched) updatedRow.jenis = matched.jenis
          }
          return updatedRow
        }
        return row
      })
    )

    try {
      await updateKasMutationAction(id, { [field]: value })
    } catch (err) {
      console.error('Failed to save update:', err)
    }
  }

  // Excel Sheet Selection States
  const [excelWorkbook, setExcelWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [parsedExcelRows, setParsedExcelRows] = useState<RawKasRow[]>([])

  function parseKasSheetRows(wb: XLSX.WorkBook, sName: string): RawKasRow[] {
    const worksheet = wb.Sheets[sName]
    if (!worksheet) return []

    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    const rawRows: RawKasRow[] = []
    let foundHeader = false

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length === 0) continue

      const col0Raw = row[0] !== undefined ? row[0] : ''
      const col1Raw = row[1] !== undefined ? row[1] : ''

      const col0 = formatExcelDate(col0Raw)
      const col1 = String(col1Raw).trim()

      if (!foundHeader) {
        if (col0.toLowerCase().includes('tanggal') || col1.toLowerCase().includes('keterangan')) {
          foundHeader = true
          continue
        }
      }

      if (col0 || col1) {
        if (col0.toLowerCase().includes('tanggal') || col1.toLowerCase().includes('keterangan')) {
          continue
        }
        rawRows.push({
          tanggalRaw: col0,
          keterangan: col1,
          cabang: row[2] !== undefined ? String(row[2]) : '0',
          debit: row[3],
          kredit: row[4],
          saldo: row[5],
          kategori: row[6] !== undefined ? String(row[6]).trim() : 'Biaya Lain-lain',
          jenis: row[7] !== undefined ? String(row[7]).trim() : '',
          catatan: row[8] !== undefined ? String(row[8]).trim() : '',
          pihakUtang: row[9] !== undefined ? String(row[9]).trim() : '',
          statusUtang: row[10] !== undefined ? String(row[10]).trim() : '',
        })
      }
    }
    return rawRows
  }

  function handleSheetChange(sName: string) {
    setSelectedSheet(sName)
    if (excelWorkbook) {
      const rows = parseKasSheetRows(excelWorkbook, sName)
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
            const rows = parseKasSheetRows(workbook, firstSheet)
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
        const res = await importKasMutationsArrayAction(parsedExcelRows)
        if ('error' in res && res.error) {
          setUploadError(res.error)
        } else if ('count' in res && res.count) {
          setUploadSuccess(`Berhasil mengimpor ${res.count} baris transaksi dari Sheet "${selectedSheet}"!`)
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
      const res = await parseAndSaveKasSpreadsheetCsvAction(csvContent)
      if ('error' in res && res.error) {
        setUploadError(res.error)
      } else if ('count' in res && res.count) {
        setUploadSuccess(`Berhasil mengimpor ${res.count} baris pembukuan kas!`)
        setIsImportModalOpen(false)
        setCsvContent('')
        window.location.reload()
      }
    } catch (err: any) {
      setUploadError(err.message || 'Gagal mengimpor file CSV spreadsheet.')
    } finally {
      setLoading(false)
    }
  }


  // Handle Manual Form Submit
  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualForm.keterangan) {
      alert('Keterangan transaksi wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const res = await createManualKasMutationAction({
        tanggalRaw: manualForm.tanggalRaw,
        keterangan: manualForm.keterangan,
        cabang: manualForm.cabang,
        debit: parseFloat(manualForm.debit) || 0,
        kredit: parseFloat(manualForm.kredit) || 0,
        saldo: parseFloat(manualForm.saldo) || 0,
        kategori: manualForm.kategori,
        catatan: manualForm.catatan,
        pihakUtang: manualForm.pihakUtang,
        statusUtang: manualForm.statusUtang,
      })

      if (res.success) {
        setIsCreateModalOpen(false)
        setManualForm({
          tanggalRaw: '05/08/2026',
          keterangan: '',
          cabang: '0',
          debit: '',
          kredit: '',
          saldo: '',
          kategori: 'Biaya Lain-lain',
          catatan: '',
          pihakUtang: '',
          statusUtang: '',
        })
        window.location.reload()
      }
    } catch (err: any) {
      alert(err.message || 'Gagal membuat baris baru.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Delete Single Row
  async function handleDelete(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus baris mutasi kas ini?')) return
    await deleteKasMutationAction(id)
    setMutations(prev => prev.filter(item => item.id !== id))
  }

  // Handle Clear All Data
  async function handleClearAll() {
    if (!confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA data pembukuan buku kas? Action ini tidak dapat dibatalkan.')) return
    setLoading(true)
    await clearAllKasMutationsAction()
    setMutations([])
    setLoading(false)
  }

  // Export to CSV matching Image 2 format
  function handleExportCsv() {
    if (mutations.length === 0) return
    let csv = `Tanggal,Keterangan (dari mutasi BCA),Cabang,Debit (Rp),Kredit (Rp),Saldo (Rp),Kategori,Jenis,Catatan,Pihak Utang/Piutang,Status Utang\n`
    mutations.forEach((item) => {
      const debitStr = item.debit > 0 ? `Rp ${item.debit.toLocaleString('id-ID')}` : ''
      const kreditStr = item.kredit > 0 ? `Rp ${item.kredit.toLocaleString('id-ID')}` : ''
      const saldoStr = item.saldo > 0 ? `Rp ${item.saldo.toLocaleString('id-ID')}` : ''
      
      csv += `"${item.tanggalRaw}","${item.keterangan.replace(/"/g, '""')}","${item.cabang || '0'}","${debitStr}","${kreditStr}","${saldoStr}","${item.kategori}","${item.jenis}","${(item.catatan || '').replace(/"/g, '""')}","${(item.pihakUtang || '').replace(/"/g, '""')}","${item.statusUtang || ''}"\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Pembukuan_Buku_Kas_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {/* Top Banner */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.06]">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
            Pembukuan Buku Kas &amp; Spreadsheet Mutasi
          </h1>
          <p className="text-xs text-[#6E6E73] font-medium mt-1">
            Impor dari Excel/Google Spreadsheet, pengkategorian transaksi, dan rekapitulasi laba rugi otomatis.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F7] border border-black/[0.08] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('JURNAL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'JURNAL'
                ? 'bg-white text-[#007AFF] shadow-xs border border-black/[0.04]'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Data Mutasi Buku Kas (Gambar 2)</span>
          </button>
          <button
            onClick={() => setActiveTab('RINGKASAN')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'RINGKASAN'
                ? 'bg-white text-[#007AFF] shadow-xs border border-black/[0.04]'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Ringkasan Pembukuan (Gambar 3)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DATA MUTASI BUKU KAS (Matching Image 2) */}
      {activeTab === 'JURNAL' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              {/* Search */}
              <div className="relative flex-1 md:max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                <input
                  type="text"
                  placeholder="Cari keterangan, catatan, pihak utang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF] font-medium"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF] font-semibold text-[#1D1D1F]"
                >
                  <option value="ALL">Semua Kategori</option>
                  {KAS_CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} ({cat.jenis})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#007AFF] text-white hover:bg-[#0066CC] transition-all shadow-xs"
              >
                <Upload className="w-4 h-4" />
                <span>Import Spreadsheet CSV</span>
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
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>

                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#FF3B30] hover:bg-rose-50 border border-rose-200 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Table matching Image 2 Styling & Columns */}
          <div className="bg-[#0B3558] rounded-2xl border border-black/[0.08] shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#003B6D] text-white font-bold uppercase tracking-wider text-[11px] border-b border-blue-900">
                  <tr>
                    <th className="py-3 px-3 w-24 border-r border-blue-900/40">Tanggal</th>
                    <th className="py-3 px-4 border-r border-blue-900/40">Keterangan (dari mutasi BCA)</th>
                    <th className="py-3 px-2 text-center w-16 border-r border-blue-900/40">Cabang</th>
                    <th className="py-3 px-3 text-right w-28 border-r border-blue-900/40">Debit (Rp)</th>
                    <th className="py-3 px-3 text-right w-28 border-r border-blue-900/40">Kredit (Rp)</th>
                    <th className="py-3 px-3 text-right w-32 border-r border-blue-900/40">Saldo (Rp)</th>
                    <th className="py-3 px-3 w-44 border-r border-blue-900/40">Kategori</th>
                    <th className="py-3 px-3 w-28 border-r border-blue-900/40">Jenis</th>
                    <th className="py-3 px-3 border-r border-blue-900/40">Catatan</th>
                    <th className="py-3 px-3 w-36 border-r border-blue-900/40">Pihak Utang/Piutang</th>
                    <th className="py-3 px-3 w-28 border-r border-blue-900/40">Status Utang</th>
                    <th className="py-3 px-2 text-center w-10">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200/40 bg-[#FFFDF0] font-sans text-[11px]">
                  {filteredMutations.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-500 bg-white">
                        <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#007AFF]" />
                        <p className="font-semibold text-[#1D1D1F]">Belum ada data pembukuan kas</p>
                        <p className="text-xs text-[#6E6E73] mt-1">
                          Klik <span className="font-bold text-[#007AFF]">"Import Spreadsheet CSV"</span> untuk mengunggah file CSV data mutasi pembukuan.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredMutations.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-amber-100/60 transition-colors">
                        {/* Tanggal */}
                        <td className="py-2.5 px-3 text-[#0033CC] font-semibold font-mono whitespace-nowrap border-r border-amber-200/60">
                          {row.tanggalRaw}
                        </td>

                        {/* Keterangan */}
                        <td className="py-2.5 px-4 text-[#0033CC] font-semibold border-r border-amber-200/60 leading-snug">
                          {row.keterangan}
                        </td>

                        {/* Cabang */}
                        <td className="py-2.5 px-2 text-center text-[#0033CC] font-mono border-r border-amber-200/60">
                          {row.cabang || '0'}
                        </td>

                        {/* Debit (Rp) */}
                        <td className="py-2.5 px-3 text-right text-[#0033CC] font-mono font-medium border-r border-amber-200/60">
                          {row.debit > 0 ? `Rp ${row.debit.toLocaleString('id-ID')}` : ''}
                        </td>

                        {/* Kredit (Rp) */}
                        <td className="py-2.5 px-3 text-right text-[#0033CC] font-mono font-medium border-r border-amber-200/60">
                          {row.kredit > 0 ? `Rp ${row.kredit.toLocaleString('id-ID')}` : ''}
                        </td>

                        {/* Saldo (Rp) */}
                        <td className="py-2.5 px-3 text-right text-[#0033CC] font-mono font-semibold border-r border-amber-200/60">
                          {row.saldo > 0 ? `Rp ${row.saldo.toLocaleString('id-ID')}` : ''}
                        </td>

                        {/* Kategori Dropdown */}
                        <td className="py-2 px-2 border-r border-amber-200/60">
                          <select
                            value={row.kategori}
                            onChange={(e) => handleFieldUpdate(row.id, 'kategori', e.target.value)}
                            className="w-full text-[11px] font-semibold text-[#0033CC] bg-amber-50/80 border border-amber-300 rounded px-1.5 py-1 outline-none cursor-pointer focus:bg-white"
                          >
                            {KAS_CATEGORIES.map((cat) => (
                              <option key={cat.name} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Jenis */}
                        <td className="py-2.5 px-3 font-bold border-r border-amber-200/60">
                          {row.jenis === 'Pemasukan' ? (
                            <span className="text-[#007AFF] font-bold">Pemasukan</span>
                          ) : (
                            <span className="text-[#FF9500] font-bold">Pengeluaran</span>
                          )}
                        </td>

                        {/* Catatan Editable Text */}
                        <td className="py-2 px-2 border-r border-amber-200/60">
                          <input
                            type="text"
                            defaultValue={row.catatan || ''}
                            onBlur={(e) => handleFieldUpdate(row.id, 'catatan', e.target.value)}
                            placeholder="Catatan..."
                            className="w-full text-[11px] uppercase text-slate-800 bg-transparent px-1.5 py-1 border border-transparent hover:border-amber-300 focus:border-[#007AFF] focus:bg-white rounded outline-none font-medium"
                          />
                        </td>

                        {/* Pihak Utang/Piutang Editable Text */}
                        <td className="py-2 px-2 border-r border-amber-200/60">
                          <input
                            type="text"
                            defaultValue={row.pihakUtang || ''}
                            onBlur={(e) => handleFieldUpdate(row.id, 'pihakUtang', e.target.value)}
                            placeholder="Pihak..."
                            className="w-full text-[11px] text-[#0033CC] font-bold bg-transparent px-1.5 py-1 border border-transparent hover:border-amber-300 focus:border-[#007AFF] focus:bg-white rounded outline-none"
                          />
                        </td>

                        {/* Status Utang Dropdown */}
                        <td className="py-2 px-2 border-r border-amber-200/60">
                          <select
                            value={row.statusUtang || ''}
                            onChange={(e) => handleFieldUpdate(row.id, 'statusUtang', e.target.value)}
                            className="w-full text-[11px] font-bold bg-amber-50/80 border border-amber-300 rounded px-1 py-1 outline-none text-slate-800"
                          >
                            <option value="">-</option>
                            <option value="Belum Lunas">Belum Lunas</option>
                            <option value="Lunas">Lunas</option>
                          </select>
                        </td>

                        {/* Delete Action */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
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
          </div>
        </div>
      )}

      {/* TAB 2: RINGKASAN PEMBUKUAN TRONTON (Matching Image 3) */}
      {activeTab === 'RINGKASAN' && (
        <div className="space-y-6">
          {/* Year Filter Header */}
          <div className="bg-white rounded-xl border border-black/[0.06] p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#007AFF]" />
              <h2 className="text-lg font-bold text-[#1D1D1F] uppercase tracking-wide">
                RINGKASAN PEMBUKUAN TRONTON
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-[#6E6E73]">Tahun:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="px-4 py-1.5 text-xs font-bold bg-amber-100/80 border border-amber-300 rounded-lg text-[#0033CC] outline-none"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>
          </div>

          {/* Table 1: Monthly Summary matching Image 3 Top Table */}
          <div className="bg-white rounded-xl border border-black/[0.08] shadow-sm overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-[#1A5276] text-white font-bold uppercase text-center border-b border-[#154360]">
                <tr>
                  <th className="py-3 px-4 w-48 text-left border-r border-[#154360]">Bulan</th>
                  <th className="py-3 px-4 text-right border-r border-[#154360]">Pemasukan (Rp)</th>
                  <th className="py-3 px-4 text-right border-r border-[#154360]">Pengeluaran (Rp)</th>
                  <th className="py-3 px-4 text-right">Laba/Rugi (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] font-sans">
                {summaryData.monthlySummary.map((item, idx) => (
                  <tr
                    key={item.bulan}
                    className={`hover:bg-[#F5F5F7] transition-colors ${
                      idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-bold text-[#1D1D1F] border-r border-black/[0.06]">
                      {item.bulan}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-[#1D1D1F] border-r border-black/[0.06]">
                      {item.pemasukan > 0 ? `Rp ${item.pemasukan.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-[#1D1D1F] border-r border-black/[0.06]">
                      {item.pengeluaran > 0 ? `Rp ${item.pengeluaran.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                      item.labaRugi >= 0 ? 'text-[#1D1D1F]' : 'text-[#FF3B30]'
                    }`}>
                      {item.labaRugi !== 0 ? `Rp ${item.labaRugi.toLocaleString('id-ID')}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* TOTAL ROW matching Image 3 */}
              <tfoot className="bg-[#D6EAF8] border-t-2 border-[#1A5276] text-xs font-bold text-[#154360]">
                <tr>
                  <td className="py-3 px-4 border-r border-[#154360]">TOTAL</td>
                  <td className="py-3 px-4 text-right font-mono border-r border-[#154360]">
                    {summaryData.totalYearIncome > 0 ? `Rp ${summaryData.totalYearIncome.toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono border-r border-[#154360]">
                    {summaryData.totalYearExpense > 0 ? `Rp ${summaryData.totalYearExpense.toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm">
                    {`Rp ${summaryData.totalYearNet.toLocaleString('id-ID')}`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Table 2: Category Recap matching Image 3 Bottom Table */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-[#1A5276] uppercase tracking-wide">
              REKAP PER KATEGORI (SEMUA TAHUN)
            </h3>

            <div className="bg-white rounded-xl border border-black/[0.08] shadow-sm overflow-hidden max-w-2xl">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-[#1A5276] text-white font-bold uppercase text-left border-b border-[#154360]">
                  <tr>
                    <th className="py-3 px-4 border-r border-[#154360]">Kategori</th>
                    <th className="py-3 px-4 w-36 border-r border-[#154360]">Jenis</th>
                    <th className="py-3 px-4 text-right w-44">Total (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] font-sans">
                  {summaryData.categoryRecapList.map((item, idx) => (
                    <tr
                      key={item.kategori}
                      className={`hover:bg-[#F5F5F7] transition-colors ${
                        idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-bold text-[#1D1D1F] border-r border-black/[0.06]">
                        {item.kategori}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#1D1D1F] border-r border-black/[0.06]">
                        {item.jenis}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-[#1D1D1F]">
                        {item.total > 0 ? `Rp ${item.total.toLocaleString('id-ID')}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import CSV Spreadsheet */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-black/[0.08] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#1D1D1F]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#007AFF]" />
                <h3 className="text-base font-bold">Import CSV Spreadsheet Buku Kas</h3>
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
                  1. Pilih File Excel (.xlsx / .xls) atau CSV dari Google Sheets:
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
                      <Layers className="w-4 h-4 text-[#007AFF]" />
                      <span>Pilih Sheet / Lembar Kerja ({sheetNames.length} Sheet Ditemukan):</span>
                    </label>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {parsedExcelRows.length} Baris Ditemukan
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
                              <th className="p-1.5 text-right">Debit</th>
                              <th className="p-1.5 text-right">Kredit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {parsedExcelRows.slice(0, 3).map((r, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-1.5 text-[#0033CC] font-bold">{r.tanggalRaw}</td>
                                <td className="p-1.5 truncate max-w-[200px] text-slate-700 font-sans">{r.keterangan}</td>
                                <td className="p-1.5 text-right">{r.debit ? `Rp ${Number(r.debit).toLocaleString('id-ID')}` : '-'}</td>
                                <td className="p-1.5 text-right">{r.kredit ? `Rp ${Number(r.kredit).toLocaleString('id-ID')}` : '-'}</td>
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
                    2. Atau Tempelkan Text CSV di sini:
                  </label>
                  <textarea
                    rows={6}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    placeholder={`Format CSV:
Tanggal,Keterangan (dari mutasi BCA),Cabang,Debit (Rp),Kredit (Rp),Saldo (Rp),Kategori,Jenis,Catatan,Pihak Utang/Piutang,Status Utang
05/08/2026,TRANSFER DR 023 RACHMAT SENDJAJA,0,,500000,500000,Setoran Modal,Pemasukan,SALDO AWAL PEMBUATAN REKENING,,`}
                    className="w-full p-3 text-xs font-mono bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                  />
                </div>
              )}


              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold bg-[#007AFF] text-white rounded-xl hover:bg-[#0066CC] disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Proses &amp; Simpan Buku Kas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Create Manual Row */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-black/[0.08] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#1D1D1F]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
              <h3 className="text-base font-bold">Tambah Baris Buku Kas</h3>
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
                  <label className="block text-xs font-semibold mb-1">Tanggal</label>
                  <input
                    type="text"
                    value={manualForm.tanggalRaw}
                    onChange={(e) => setManualForm({ ...manualForm, tanggalRaw: e.target.value })}
                    placeholder="05/08/2026"
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Cabang</label>
                  <input
                    type="text"
                    value={manualForm.cabang}
                    onChange={(e) => setManualForm({ ...manualForm, cabang: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Keterangan (dari mutasi BCA)</label>
                <textarea
                  rows={2}
                  value={manualForm.keterangan}
                  onChange={(e) => setManualForm({ ...manualForm, keterangan: e.target.value })}
                  placeholder="TRANSFER DR..."
                  className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Debit (Rp)</label>
                  <input
                    type="number"
                    value={manualForm.debit}
                    onChange={(e) => setManualForm({ ...manualForm, debit: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Kredit (Rp)</label>
                  <input
                    type="number"
                    value={manualForm.kredit}
                    onChange={(e) => setManualForm({ ...manualForm, kredit: e.target.value })}
                    placeholder="500000"
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Saldo (Rp)</label>
                  <input
                    type="number"
                    value={manualForm.saldo}
                    onChange={(e) => setManualForm({ ...manualForm, saldo: e.target.value })}
                    placeholder="500000"
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Kategori</label>
                  <select
                    value={manualForm.kategori}
                    onChange={(e) => setManualForm({ ...manualForm, kategori: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF] font-bold"
                  >
                    {KAS_CATEGORIES.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name} ({cat.jenis})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Status Utang</label>
                  <select
                    value={manualForm.statusUtang}
                    onChange={(e) => setManualForm({ ...manualForm, statusUtang: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF] font-bold"
                  >
                    <option value="">-</option>
                    <option value="Belum Lunas">Belum Lunas</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Catatan</label>
                  <input
                    type="text"
                    value={manualForm.catatan}
                    onChange={(e) => setManualForm({ ...manualForm, catatan: e.target.value })}
                    placeholder="SALDO AWAL..."
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-xl outline-none focus:border-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Pihak Utang/Piutang</label>
                  <input
                    type="text"
                    value={manualForm.pihakUtang}
                    onChange={(e) => setManualForm({ ...manualForm, pihakUtang: e.target.value })}
                    placeholder="Trading Plywood"
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
