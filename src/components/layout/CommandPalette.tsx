'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Truck,
  Disc,
  FileText,
  DollarSign,
  Wrench,
  Users,
  Settings,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

interface CommandItem {
  icon: any
  label: string
  href: string
  category: 'Truck' | 'Tires' | 'Financial' | 'Contract' | 'Maintenance' | 'Customer' | 'Settings'
}

const COMMANDS: CommandItem[] = [
  { icon: Truck, label: 'Armada Tronton (H 9752 OV)', href: '/trucks', category: 'Truck' },
  { icon: Disc, label: 'Stok & Lifecycle Ban (60k KM)', href: '/tires', category: 'Tires' },
  { icon: FileText, label: 'Kontrak Perjalanan ERP (Magelang - Surabaya)', href: '/contracts', category: 'Contract' },
  { icon: DollarSign, label: 'Pembukuan & Transaksi Keuangan', href: '/financials', category: 'Financial' },
  { icon: Wrench, label: 'Jadwal Perawatan & Bengkel Armada', href: '/maintenance', category: 'Maintenance' },
  { icon: Users, label: 'Direktori Pelanggan & Customer Cargo', href: '/customers', category: 'Customer' },
  { icon: ShieldCheck, label: 'Audit Trail Logs & Keamanan System', href: '/audit', category: 'Settings' },
  { icon: Settings, label: 'Pengaturan Perusahaan & Sistem ERP', href: '/settings', category: 'Settings' },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  )

  function handleKeyDownModal(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1))
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault()
      handleSelect(filteredCommands[selectedIndex].href)
    }
  }

  function handleSelect(href: string) {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3.5 py-1.5 text-xs bg-[#F5F5F7] border border-black/[0.08] rounded-full text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#E5E5EA] transition-all shadow-2xs font-medium"
      >
        <Search className="w-3.5 h-3.5 text-[#8E8E93]" />
        <span className="hidden sm:inline">Search &amp; Commands (Cmd+K)...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-[#6E6E73] bg-white border border-black/[0.08] rounded-md font-mono shadow-2xs">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-black/[0.08] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#1D1D1F]">
            <div className="flex items-center px-4 py-3.5 border-b border-black/[0.06] gap-3">
              <Search className="w-4 h-4 text-[#007AFF] shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Cari Truck, Ban, Customer, Shipment, Maintenance, Keuangan..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDownModal}
                className="w-full text-xs bg-transparent text-[#1D1D1F] placeholder-[#8E8E93] outline-none font-medium"
              />
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-[#8E8E93] hover:text-[#1D1D1F] rounded-lg hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto space-y-1 text-xs">
              {filteredCommands.length === 0 ? (
                <div className="p-6 text-center text-[#8E8E93]">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Tidak ada hasil pencarian untuk "{query}".</p>
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon
                  const isSelected = idx === selectedIndex
                  return (
                    <button
                      key={cmd.label + idx}
                      onClick={() => handleSelect(cmd.href)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left font-medium ${
                        isSelected
                          ? 'bg-[#007AFF] text-white'
                          : 'hover:bg-[#F5F5F7] text-[#1D1D1F]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#007AFF]'}`} />
                        <span>{cmd.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-[#F2F2F7] text-[#6E6E73]'
                          }`}
                        >
                          {cmd.category}
                        </span>
                        {isSelected && <ArrowRight className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <div className="px-4 py-2.5 bg-[#FAFAFA] border-t border-black/[0.06] flex items-center justify-between text-[10px] text-[#6E6E73] font-mono">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
                <span>ESC Close</span>
              </div>
              <span>Chords: ⌘K</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
