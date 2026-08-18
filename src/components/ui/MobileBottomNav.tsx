'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Truck, Disc, Package, Menu } from 'lucide-react'

export function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Trucks', href: '/trucks', icon: Truck },
    { label: 'Ban', href: '/tires', icon: Disc },
    { label: 'Kontrak', href: '/contracts', icon: Package },
    { label: 'Lainnya', href: '/financials', icon: Menu },
  ]

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-t border-black/[0.08] z-30 flex items-center justify-around px-2 text-[#1D1D1F]">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] transition-colors ${
              isActive
                ? 'text-[#007AFF] font-semibold'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
