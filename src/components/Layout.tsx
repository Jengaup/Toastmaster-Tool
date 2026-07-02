import React, { useState } from 'react'
import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MeetingClockBar } from './MeetingClockBar'
import { useLanguage } from '../contexts/LanguageContext'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { t } = useLanguage()
  const location = useLocation()

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="no-print">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden print:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-slate-900 text-sm">{t('appName')}</span>
        </header>

        <div className="no-print"><MeetingClockBar /></div>
        <main className="flex-1 overflow-y-auto">
          <div key={location.pathname} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
