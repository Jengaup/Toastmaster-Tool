import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Timer, ClipboardList, MessageSquare, BookOpen, Star, Settings, X, Mic, Printer, Lock, Trash2, RotateCcw } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { TKey } from '../i18n'
import { hasPinEnabled, savePin, removePin, lockApp } from '../utils/pin'
import { storageClear, STORAGE_KEYS } from '../utils/storage'

interface NavItem {
  path: string
  labelKey: TKey
  icon: React.ReactNode
  activeBg: string
}

const NAV_ITEMS: NavItem[] = [
  { path: '/temporizador', labelKey: 'navTimer',     icon: <Timer size={18} />,        activeBg: 'bg-emerald-600' },
  { path: '/reporte',      labelKey: 'navReport',    icon: <ClipboardList size={18} />, activeBg: 'bg-sky-600'    },
  { path: '/ah-counter',   labelKey: 'navAhCounter', icon: <MessageSquare size={18} />, activeBg: 'bg-orange-500' },
  { path: '/gramatical',   labelKey: 'navGrammar',   icon: <BookOpen size={18} />,      activeBg: 'bg-violet-600' },
  { path: '/evaluador',    labelKey: 'navEvaluator', icon: <Star size={18} />,          activeBg: 'bg-amber-500'  },
  { path: '/personalizado',labelKey: 'navCustom',    icon: <Settings size={18} />,      activeBg: 'bg-slate-500'  },
  { path: '/imprimir',     labelKey: 'navPrint',     icon: <Printer size={18} />,       activeBg: 'bg-indigo-600' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const { t, toggleLang, lang } = useLanguage()
  const [showPinForm, setShowPinForm] = useState(false)
  const [pinNew, setPinNew] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const hasPin = hasPinEnabled()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleClearSession = () => {
    storageClear(STORAGE_KEYS.TIMER_RECORDS)
    storageClear(STORAGE_KEYS.AH_PARTICIPANTS)
    storageClear(STORAGE_KEYS.GRAMMAR_DATA)
    storageClear(STORAGE_KEYS.EVALUADOR_DATA)
    window.location.reload()
  }

  const closePinForm = () => {
    setShowPinForm(false)
    setPinNew('')
    setPinConfirm('')
    setPinMsg(null)
  }

  const handleSavePin = async () => {
    if (pinNew.length < 4) { setPinMsg({ ok: false, text: t('pinTooShort') }); return }
    if (pinNew !== pinConfirm) { setPinMsg({ ok: false, text: t('pinMismatch') }); return }
    await savePin(pinNew)
    setPinMsg({ ok: true, text: t('pinSaved') })
    setTimeout(closePinForm, 1200)
  }

  const handleRemovePin = () => {
    removePin()
    setPinMsg({ ok: true, text: t('pinRemoved') })
    setTimeout(closePinForm, 1200)
  }

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
                    ? `${item.activeBg} text-white`
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}>{item.icon}</span>
                <span className="font-medium">{t(item.labelKey)}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-700/50 space-y-2">
          {/* Nueva sesión */}
          {showClearConfirm ? (
            <div className="rounded-lg bg-red-950/60 border border-red-800/50 p-3 space-y-2">
              <p className="text-xs font-semibold text-red-300">{t('newSessionConfirm')}</p>
              <p className="text-xs text-red-400/80">{t('newSessionHint')}</p>
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={handleClearSession}
                  className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 transition-colors font-medium"
                >
                  {t('newSessionYes')}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {t('newSessionNo')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-700/50 text-slate-500 hover:text-red-400 hover:border-red-800/50 hover:bg-red-950/30 transition-all text-xs font-medium"
            >
              <RotateCcw size={12} />
              {t('newSession')}
            </button>
          )}

          <button
            onClick={toggleLang}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all text-sm font-medium"
          >
            <span>{lang === 'es' ? '🇺🇸' : '🇪🇸'}</span>
            <span>{t('langToggle')}</span>
          </button>

          {/* PIN lock section */}
          {showPinForm ? (
            <div className="rounded-lg bg-slate-800 p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {hasPin ? t('pinChange') : t('pinSetup')}
              </p>
              <input
                type="password"
                value={pinNew}
                onChange={e => setPinNew(e.target.value)}
                placeholder={t('pinNew')}
                autoFocus
                className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="password"
                value={pinConfirm}
                onChange={e => setPinConfirm(e.target.value)}
                placeholder={t('pinConfirm')}
                onKeyDown={e => e.key === 'Enter' && handleSavePin()}
                className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {pinMsg && (
                <p className={`text-xs px-0.5 ${pinMsg.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {pinMsg.text}
                </p>
              )}
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={handleSavePin}
                  className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 transition-colors font-medium"
                >
                  {t('gramSave')}
                </button>
                {hasPin && (
                  <button
                    onClick={handleRemovePin}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded-lg transition-colors"
                    title={t('pinChange')}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <button
                  onClick={closePinForm}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1">
              {hasPin && (
                <button
                  onClick={lockApp}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors border border-slate-700/50"
                >
                  <Lock size={12} /> {t('pinLockNow')}
                </button>
              )}
              <button
                onClick={() => setShowPinForm(true)}
                title={hasPin ? t('pinChange') : t('pinSetup')}
                className={`${hasPin ? '' : 'flex-1'} flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-xs transition-colors`}
              >
                <Lock size={12} />
                {!hasPin && <span>{t('pinSetup')}</span>}
              </button>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed text-center pt-1">
            {t('localData')}
          </p>
        </div>
      </aside>
    </>
  )
}
