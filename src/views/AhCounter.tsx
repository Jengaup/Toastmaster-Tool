import { useState } from 'react'
import { Plus, Trash2, RotateCcw, X, Download, Copy, Check } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'
import { AhParticipant } from '../types'
import { STORAGE_KEYS } from '../utils/storage'
import { exportAhCounterCSV, exportAhCounterPersonCSV, ahCounterSummaryText, copyToClipboard } from '../utils/export'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

const DEFAULT_WORDS = ['Eh', 'Mm', 'Este', 'O sea', 'Básicamente', 'Entonces', '¿Verdad?']

export default function AhCounter() {
  const { t } = useLanguage()
  const [participants, setParticipants] = useLocalStorage<AhParticipant[]>(STORAGE_KEYS.AH_PARTICIPANTS, [])
  const [activeWords, setActiveWords] = useLocalStorage<string[]>(STORAGE_KEYS.AH_WORDS, DEFAULT_WORDS)
  const [nameInput, setNameInput] = useState('')
  const [wordInput, setWordInput] = useState('')
  const [copied, setCopied] = useState(false)

  const addParticipant = () => {
    if (!nameInput.trim()) return
    setParticipants((prev) => [...prev, { id: newId(), nombre: nameInput.trim(), muletillas: {} }])
    setNameInput('')
  }

  const removeParticipant = (id: string) => setParticipants((prev) => prev.filter((p) => p.id !== id))

  const addWord = () => {
    const w = wordInput.trim()
    if (!w || activeWords.includes(w)) return
    setActiveWords((prev) => [...prev, w])
    setWordInput('')
  }

  const removeWord = (word: string) => setActiveWords((prev) => prev.filter((w) => w !== word))

  const increment = (participantId: string, word: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? { ...p, muletillas: { ...p.muletillas, [word]: (p.muletillas[word] || 0) + 1 } }
          : p
      )
    )
  }

  const decrement = (participantId: string, word: string) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== participantId) return p
        const cur = p.muletillas[word] || 0
        if (cur === 0) return p
        const updated = { ...p.muletillas }
        if (cur === 1) delete updated[word]
        else updated[word] = cur - 1
        return { ...p, muletillas: updated }
      })
    )
  }

  const resetParticipant = (id: string) =>
    setParticipants((prev) => prev.map((p) => p.id === id ? { ...p, muletillas: {} } : p))

  const totalFor = (p: AhParticipant) => Object.values(p.muletillas).reduce((a, b) => a + b, 0)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('ahTitle')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('ahSubtitle')}</p>
        </div>
        {participants.length > 0 && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={async () => {
                const ok = await copyToClipboard(ahCounterSummaryText(participants))
                if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000) }
              }}
            >
              {copied ? t('copied') : t('copy')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={() => exportAhCounterCSV(participants, activeWords)}
            >
              {t('exportAll')}
            </Button>
          </div>
        )}
      </div>

      {/* Top controls */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t('ahAddSpeaker')}</p>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              placeholder={t('ahSpeakerPlaceholder')}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
            />
            <button
              onClick={addParticipant}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus size={16} /> {t('add')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t('ahActiveWords')}</p>
          <div className="flex gap-2 mb-3">
            <input
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              placeholder={t('ahNewWordPlaceholder')}
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addWord()}
            />
            <button
              onClick={addWord}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus size={16} /> {t('add')}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeWords.map((w) => (
              <span key={w} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-medium text-indigo-700">
                {w}
                <button onClick={() => removeWord(w)} className="text-indigo-400 hover:text-red-500 transition-colors ml-0.5">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Participant cards */}
      {participants.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          <p className="text-base font-medium">{t('ahEmpty')}</p>
          <p className="text-sm mt-1">{t('ahEmptySub')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {participants.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-orange-400 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                    {p.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{p.nombre}</div>
                    <div className="text-xs text-slate-400">
                      {totalFor(p) === 0
                        ? t('ahNoRecords')
                        : `${totalFor(p)} ${totalFor(p) === 1 ? t('ahFillerWord') : t('ahFillerWords')}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {totalFor(p) > 0 && (
                    <Badge variant={totalFor(p) < 3 ? 'warning' : 'danger'}>{totalFor(p)}</Badge>
                  )}
                  {totalFor(p) > 0 && (
                    <button
                      onClick={() => exportAhCounterPersonCSV(p, activeWords)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors ml-1"
                      title={t('ahExportPerson')}
                    >
                      <Download size={14} />
                    </button>
                  )}
                  <button onClick={() => resetParticipant(p.id)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title={t('ahResetCount')}>
                    <RotateCcw size={14} />
                  </button>
                  <button onClick={() => removeParticipant(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title={t('ahRemoveSpeaker')}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                {activeWords.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">{t('ahAddWordsAbove')}</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {activeWords.map((word) => {
                      const count = p.muletillas[word] || 0
                      return (
                        <div key={word} className="flex items-center rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          <button
                            onClick={() => decrement(p.id, word)}
                            disabled={count === 0}
                            className="px-3 py-3.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200"
                          >
                            <span className="text-sm font-bold leading-none">−</span>
                          </button>
                          <button
                            onClick={() => increment(p.id, word)}
                            className="px-4 py-3.5 flex items-center gap-3 hover:bg-red-50 active:bg-red-100 transition-colors group"
                          >
                            <span className="text-base text-slate-700 group-hover:text-red-600 font-medium leading-none">{word}</span>
                            <span className={`text-lg font-bold font-mono min-w-[1.5rem] text-center leading-none ${count > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                              {count}
                            </span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Summary */}
          {participants.some(p => totalFor(p) > 0) && (() => {
            const grandTotal = participants.reduce((sum, p) => sum + totalFor(p), 0)
            const wordTotals: Record<string, number> = {}
            participants.forEach((p) => {
              Object.entries(p.muletillas).forEach(([w, c]) => { wordTotals[w] = (wordTotals[w] || 0) + c })
            })
            const topWord = Object.entries(wordTotals).sort((a, b) => b[1] - a[1])[0]

            return (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
                  <div className="px-5 py-4 text-center">
                    <div className="text-2xl font-bold text-slate-900 font-mono">{grandTotal}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t('ahGrandTotal')}</div>
                  </div>
                  <div className="px-5 py-4 text-center">
                    {topWord ? (
                      <>
                        <div className="text-2xl font-bold text-red-500 font-mono">{topWord[1]}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {t('ahTopWordTimes')} "<span className="font-semibold text-slate-700">{topWord[0]}</span>"
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 py-2">—</div>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t('ahBySpeaker')}</p>
                  <div className="space-y-2">
                    {participants.filter(p => totalFor(p) > 0).map((p) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700 w-28 truncate shrink-0">{p.nombre}</span>
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {Object.entries(p.muletillas).map(([word, count]) => (
                            <span key={word} className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-2 py-0.5 font-medium">
                              {word}: {count}
                            </span>
                          ))}
                        </div>
                        <Badge variant={totalFor(p) < 3 ? 'warning' : 'danger'}>{totalFor(p)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => { if (confirm(t('ahClearConfirm'))) setParticipants([]) }}
            >
              {t('ahClearSession')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
