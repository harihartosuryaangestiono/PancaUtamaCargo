'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, RefreshCw } from 'lucide-react'
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  clearReadNotificationsAction,
  AppNotification,
} from '@/app/actions/notificationActions'
import Link from 'next/link'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO' | 'UNREAD'>('ALL')

  async function loadNotifications() {
    try {
      setLoading(true)
      const res = await getNotificationsAction()
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  async function handleMarkRead(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await markNotificationAsReadAction(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  async function handleMarkAllRead() {
    await markAllNotificationsAsReadAction()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  async function handleClearRead() {
    await clearReadNotificationsAction()
    setNotifications((prev) => prev.filter((n) => !n.isRead))
  }

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.isRead
    if (activeFilter === 'CRITICAL') return n.severity === 'CRITICAL'
    if (activeFilter === 'WARNING') return n.severity === 'WARNING'
    if (activeFilter === 'INFO') return n.severity === 'INFO'
    return true
  })

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">CRITICAL</span>
      case 'WARNING':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FF9500]/10 text-[#C67300] border border-[#FF9500]/20">WARNING</span>
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">INFO</span>
    }
  }

  return (
    <div className="relative text-[#1D1D1F]">
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) loadNotifications()
        }}
        className="relative p-2 rounded-xl text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF3B30] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-black/[0.08] rounded-2xl shadow-xl z-50 overflow-hidden text-xs">
            <div className="p-3 border-b border-black/[0.06] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1D1D1F]">Smart Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] font-semibold text-[10px]">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadNotifications}
                  disabled={loading}
                  className="p-1 text-[#8E8E93] hover:text-[#1D1D1F]"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-[#007AFF] font-medium hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark All
                  </button>
                )}
                <button
                  onClick={handleClearRead}
                  className="text-[10px] text-[#6E6E73] hover:text-[#FF3B30] font-medium flex items-center gap-1"
                  title="Hapus notifikasi yang sudah dibaca"
                >
                  <Trash2 className="w-3 h-3" /> Clear Read
                </button>
              </div>
            </div>

            {/* Severity & Unread Filter Pills */}
            <div className="p-2 border-b border-black/[0.06] flex items-center gap-1 overflow-x-auto text-[10px] font-semibold bg-[#FAFAFA]">
              {(['ALL', 'UNREAD', 'CRITICAL', 'WARNING', 'INFO'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    activeFilter === filter
                      ? 'bg-[#007AFF] text-white shadow-2xs'
                      : 'text-[#6E6E73] hover:bg-[#E5E5EA]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-black/[0.06]">
              {filteredNotifications.length === 0 ? (
                <div className="p-6 text-center text-[#8E8E93] text-xs">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#007AFF]" />
                  <p>Tidak ada notifikasi untuk filter ini.</p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 transition-colors ${
                      n.isRead ? 'opacity-70 bg-white' : 'bg-[#007AFF]/[0.03]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        {getSeverityBadge(n.severity)}
                        <span className="font-semibold text-[#1D1D1F] truncate max-w-[180px]">
                          {n.title}
                        </span>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={(e) => handleMarkRead(n.id, e)}
                          className="text-[#8E8E93] hover:text-[#007AFF] p-0.5"
                          title="Tandai dibaca"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[#6E6E73] text-[11px] mb-2 leading-relaxed">{n.message}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#8E8E93]">
                      <span>{new Date(n.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => setIsOpen(false)}
                          className="font-medium text-[#007AFF] hover:underline"
                        >
                          Lihat Detail &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
