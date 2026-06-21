import { useState, useRef } from 'react'
import { Lock, Mic } from 'lucide-react'
import { verifyPin, setSessionUnlocked } from '../utils/pin'
import { useLanguage } from '../contexts/LanguageContext'

export function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const { t } = useLanguage()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUnlock = async () => {
    if (!pin || loading) return
    setLoading(true)
    const ok = await verifyPin(pin)
    setLoading(false)
    if (ok) {
      setSessionUnlocked()
      onUnlock()
    } else {
      setError(true)
      setPin('')
      setTimeout(() => {
        setError(false)
        inputRef.current?.focus()
      }, 900)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mic size={28} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">TM Meeting Assistant</h1>
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-sm mt-1 mb-7">
          <Lock size={13} />
          <span>{t('pinLocked')}</span>
        </div>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUnlock()}
          placeholder="••••"
          autoFocus
          autoComplete="current-password"
          className={`w-full text-center text-3xl tracking-[0.6em] border-2 rounded-xl px-4 py-3 focus:outline-none transition-all duration-200 ${
            error
              ? 'border-red-400 bg-red-50 text-red-500 pin-shake'
              : 'border-slate-200 focus:border-indigo-500'
          }`}
        />
        {error && (
          <p className="text-red-500 text-sm mt-2 font-medium">{t('pinWrong')}</p>
        )}

        <button
          onClick={handleUnlock}
          disabled={!pin || loading}
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {t('pinUnlock')}
        </button>
      </div>
    </div>
  )
}
