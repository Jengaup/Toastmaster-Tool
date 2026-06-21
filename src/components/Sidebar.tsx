import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Timer, ClipboardList, MessageSquare, BookOpen, Star, Settings, X, Mic, Printer } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { TKey } from '../i18n'

interface NavItem {
  path: string
  labelKey: TKey
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { path: '/temporizador', labelKey: 'navTimer', icon: <Timer size={18} /> },
  { path: '/reporte', labelKey: 'navReport', icon: <ClipboardList size={18} /> },
  { path: '/ah-counter', labelKey: 'navAhCounter', icon: <MessageSquare size={18} /> },
  { path: '/gramatical', labelKey: 'navGrammar', icon: <BookOpen size={18} /> },
  { path: '/evaluador', labelKey: 'navEvaluator', icon: <Star size={18} /> },
  { path: '/personalizado', labelKey: 'navCustom', icon: <Settings size={18} /> },
  { path: '/imprimir', labelKey: 'navPrint', icon: <Printer size={18} /> },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const { t, toggleLang, lang } = useLanguage()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 z-30 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-auto print:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Mic size={16} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none">TM Meeting</div>
              <div className="text-slate-400 text-xs mt-0.5">Assistant</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/temporizador')
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}>{item.icon}</span>
                <span className="font-medium">{t(item.labelKey)}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-700/50 space-y-3">
          <button
            onClick={toggleLang}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all text-sm font-medium"
          >
            <span>{lang === 'es' ? '🇺🇸' : '🇪🇸'}</span>
            <span>{t('langToggle')}</span>
          </button>
          <p className="text-xs text-slate-500 leading-relaxed text-center">
            {t('localData')}
          </p>
        </div>
      </aside>
    </>
  )
}
