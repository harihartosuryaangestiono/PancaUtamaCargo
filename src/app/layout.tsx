import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Panca Utama Cargo — Fleet & Financial Management System',
  description: 'Sistem Operasional Tronton & Pembukuan Keuangan Panca Utama Cargo — Aman · Tepat · Terpercaya',
  icons: {
    icon: '/LogoPancaUtamaCargoCircular.png',
    shortcut: '/LogoPancaUtamaCargoCircular.png',
    apple: '/LogoPancaUtamaCargoCircular.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="h-full light" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/LogoPancaUtamaCargoCircular.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/LogoPancaUtamaCargoCircular.png" type="image/png" />
        <link rel="apple-touch-icon" href="/LogoPancaUtamaCargoCircular.png" />
      </head>
      <body className={`${inter.className} h-full bg-[#F5F5F7] text-[#1D1D1F] antialiased selection:bg-[#007AFF] selection:text-white`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
