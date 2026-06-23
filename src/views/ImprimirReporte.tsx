import { useState } from 'react'
import { Printer, Copy, Check } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { TKey } from '../i18n'
import { TimerRecord, AhParticipant, GrammarData, EvaluadorData, CampoPersonalizado, EvalContextoData, EvalContextoStore, SpeechType, TimerConfig, SPEECH_PRESETS } from '../types'
import { DEFAULT_EVAL_STORE } from './EvaluacionesContexto'
import { STORAGE_KEYS } from '../utils/storage'
import { formatTime } from '../utils/formatTime'
import { getPhase, getPhaseColor } from '../hooks/useTimer'
import { copyToClipboard } from '../utils/export'
import { Button } from '../components/ui/Button'

const SEG_KEYS: Record<string, TKey> = {
  s1: 'evalSeg1', s2: 'evalSeg2', s3: 'evalSeg3', s4: 'evalSeg4',
  s5: 'evalSeg5', s6: 'evalSeg6', s7: 'evalSeg7',
}
const CHECK_KEYS: Record<string, TKey> = {
  c1: 'evalCheck1', c2: 'evalCheck2', c3: 'evalCheck3', c4: 'evalCheck4',
  c5: 'evalCheck5', c6: 'evalCheck6', c7: 'evalCheck7', c8: 'evalCheck8',
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4 print:mb-3">
      <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">{children}</h2>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )
}

const DEFAULT_TIMER_CONFIG: Record<SpeechType, TimerConfig> = {
  preparado:      SPEECH_PRESETS.preparado,
  'table-topics': SPEECH_PRESETS['table-topics'],
  evaluacion:     SPEECH_PRESETS.evaluacion,
  personalizado:  SPEECH_PRESETS.personalizado,
}

function speechTypeKey(tipoLabel: string): SpeechType | null {
  const entry = Object.entries(SPEECH_PRESETS).find(([, p]) => p.label === tipoLabel)
  return entry ? (entry[0] as SpeechType) : null
}

export default function ImprimirReporte() {
  const { t } = useLanguage()
  const [timerRecords] = useLocalStorage<TimerRecord[]>(STORAGE_KEYS.TIMER_RECORDS, [])
  const [ahParticipants] = useLocalStorage<AhParticipant[]>(STORAGE_KEYS.AH_PARTICIPANTS, [])
  const [activeWords] = useLocalStorage<string[]>(STORAGE_KEYS.AH_WORDS, [])
  const [gramData] = useLocalStorage<GrammarData>(STORAGE_KEYS.GRAMMAR_DATA, { palabraDelDia: '', definicion: '', observaciones: [], usosDelDia: {} })
  const [evalData] = useLocalStorage<EvaluadorData>(STORAGE_KEYS.EVALUADOR_DATA, { segmentos: [], checklist: [], resumenFinal: '' })
  const [campos] = useLocalStorage<CampoPersonalizado[]>(STORAGE_KEYS.CAMPOS_PERSONALIZADOS, [])
  const [timerConfig] = useLocalStorage<Record<SpeechType, TimerConfig>>(STORAGE_KEYS.TIMER_CONFIG, DEFAULT_TIMER_CONFIG)

  const getTimeColor = (r: TimerRecord): string => {
    const key = speechTypeKey(r.tipo)
    if (!key) return '#94a3b8'
    const cfg = timerConfig[key] ?? SPEECH_PRESETS[key]
    return getPhaseColor(getPhase(r.tiempoFinal, cfg))
  }
  const [rawEvalStore] = useLocalStorage<EvalContextoStore>(STORAGE_KEYS.EVAL_CONTEXTO, DEFAULT_EVAL_STORE)
  const evalStore: EvalContextoStore = Array.isArray(rawEvalStore?.instances) ? rawEvalStore : DEFAULT_EVAL_STORE
  const evalContexto: EvalContextoData | null = (
    evalStore.instances.find(i => i.id === evalStore.reportId) ?? evalStore.instances[0]
  )?.data ?? null
  const [copied, setCopied] = useState(false)

  const clubName = campos.find(c => c.etiqueta.toLowerCase().includes('club'))?.valor
  const meetingDate = campos.find(c => c.etiqueta.toLowerCase().includes('fecha'))?.valor

  const segTitle = (seg: { id: string; titulo: string }) =>
    SEG_KEYS[seg.id] ? t(SEG_KEYS[seg.id] as TKey) : seg.titulo

  const checkText = (item: { id: string; texto: string }) =>
    CHECK_KEYS[item.id] ? t(CHECK_KEYS[item.id] as TKey) : item.texto

  const totalFillerWords = (p: AhParticipant) => Object.values(p.muletillas).reduce((a, b) => a + b, 0)

  const evalDone = evalData.checklist.filter(c => c.completado).length

  const buildText = () => {
    const lines: string[] = [
      `${t('printTitle').toUpperCase()} — ${new Date().toLocaleDateString()}`,
      '='.repeat(50),
      '',
    ]

    if (timerRecords.length > 0) {
      lines.push(t('printSectionTimes').toUpperCase())
      lines.push('-'.repeat(30))
      timerRecords.forEach((r, i) => {
        lines.push(`${i + 1}. ${r.nombre} (${r.tipo}): ${formatTime(r.tiempoFinal)}${r.notas ? ` — ${r.notas}` : ''}`)
      })
      lines.push('')
    }

    const ahWithData = ahParticipants.filter(p => totalFillerWords(p) > 0)
    if (ahWithData.length > 0) {
      lines.push(t('printSectionAh').toUpperCase())
      lines.push('-'.repeat(30))
      ahWithData.forEach(p => {
        const detail = Object.entries(p.muletillas).map(([w, c]) => `${w}: ${c}`).join(', ')
        lines.push(`• ${p.nombre}: ${totalFillerWords(p)} (${detail})`)
      })
      lines.push('')
    }

    if (gramData.palabraDelDia) {
      lines.push(t('printSectionGram').toUpperCase())
      lines.push('-'.repeat(30))
      lines.push(`${t('printWordOfDay')}: ${gramData.palabraDelDia}`)
      if (gramData.definicion) lines.push(`  ${gramData.definicion}`)
      const usos = gramData.usosDelDia ?? {}
      if (Object.keys(usos).length > 0) {
        lines.push(`${t('printUsesOfWord')}:`)
        Object.entries(usos).forEach(([n, c]) => lines.push(`  • ${n}: ${c}`))
      }
      if (gramData.observaciones.length > 0) {
        lines.push(`${t('printObservations')}:`)
        gramData.observaciones.forEach(o => lines.push(`  • [${o.tipo}] ${o.nombre}: ${o.texto}`))
      }
      lines.push('')
    }

    const segWithNotes = evalData.segmentos.filter(s => s.notas.trim())
    if (segWithNotes.length > 0 || evalData.resumenFinal) {
      lines.push(t('printSectionEval').toUpperCase())
      lines.push('-'.repeat(30))
      lines.push(`${t('printChecklist')}: ${evalDone}/${evalData.checklist.length} ✓`)
      segWithNotes.forEach(s => {
        lines.push(`\n${segTitle(s)}:`)
        lines.push(s.notas)
      })
      if (evalData.resumenFinal) {
        lines.push(`\n${t('printFinalSummary')}:`)
        lines.push(evalData.resumenFinal)
      }
      lines.push('')
    }

    if (evalContexto?.tipo) {
      lines.push(t('printSectionContext').toUpperCase())
      lines.push('-'.repeat(30))
      const tipoLabel = evalContexto.tipo === 'variedad-vocal' ? t('contextVVTitle') : evalContexto.tipo === 'lenguaje-corporal' ? t('contextLCTitle') : t('contextOrgTitle')
      lines.push(`${tipoLabel} — ${evalContexto.nombreOrador || '—'}`)
      if (evalContexto.evaluador) lines.push(`${t('contextEvaluador')}: ${evalContexto.evaluador}`)
      if (evalContexto.tipo === 'variedad-vocal') {
        if (evalContexto.vv.destacaste) lines.push(`${t('contextVVDestacaste')} ${evalContexto.vv.destacaste}`)
        if (evalContexto.vv.trabajar)   lines.push(`${t('contextVVTrabajar')} ${evalContexto.vv.trabajar}`)
        if (evalContexto.vv.desafio)    lines.push(`${t('contextVVDesafio')} ${evalContexto.vv.desafio}`)
      } else if (evalContexto.tipo === 'lenguaje-corporal') {
        if (evalContexto.lc.diferente) lines.push(`${t('contextLCDiferente')}\n${evalContexto.lc.diferente}`)
        if (evalContexto.lc.gusto)     lines.push(`${t('contextLCGusto')}\n${evalContexto.lc.gusto}`)
      } else if (evalContexto.tipo === 'organizacion') {
        Object.entries(evalContexto.org).filter(([, v]) => v).forEach(([, v]) => lines.push(`• ${v}`))
      }
      lines.push('')
    }

    if (campos.length > 0) {
      lines.push(t('printSectionCustom').toUpperCase())
      lines.push('-'.repeat(30))
      campos.forEach(c => {
        const val = c.tipo === 'si-no' ? (c.valor === 'true' ? t('customYes') : c.valor === 'false' ? t('customNo') : '—') : (c.valor || '—')
        lines.push(`• ${c.etiqueta}: ${val}`)
      })
    }

    return lines.join('\n')
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(buildText())
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto print:p-0 print:max-w-none">
      {/* Action bar — hidden on print */}
      <div className="print:hidden mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('printTitle')}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {clubName ? <span className="font-semibold text-indigo-600">{clubName} · </span> : null}
            {t('printSubtitle')}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopy}
          >
            {copied ? t('printCopied') : t('printCopyAll')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Printer size={14} />}
            onClick={() => window.print()}
          >
            {t('printBtn')}
          </Button>
        </div>
      </div>

      {/* Report content */}
      <div className="space-y-8 print:space-y-6">

        {/* Print header — only visible on print */}
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-800">
          <div className="text-xl font-bold text-slate-900">{clubName || 'TM Meeting Assistant'}</div>
          {clubName && <div className="text-xs text-slate-400 mt-0.5">TM Meeting Assistant</div>}
          <div className="text-sm text-slate-500 mt-1">{t('printTitle')} — {meetingDate || new Date().toLocaleDateString()}</div>
        </div>

        {/* Times */}
        {timerRecords.length > 0 && (
          <section>
            <SectionHeader>{t('printSectionTimes')}</SectionHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase">#</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase">{t('printParticipant')}</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase">{t('printType')}</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase">{t('printTime')}</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell print:table-cell">{t('reportNotes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {timerRecords.map((r, i) => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                      <td className="py-2 pr-4 font-medium text-slate-800">{r.nombre}</td>
                      <td className="py-2 pr-4 text-slate-600 text-xs">{r.tipo}</td>
                      <td className="py-2 pr-4 font-mono font-semibold" style={{ color: getTimeColor(r) }}>{formatTime(r.tiempoFinal)}</td>
                      <td className="py-2 text-slate-500 text-xs hidden md:table-cell print:table-cell">{r.notas || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200">
                    <td colSpan={3} className="py-2 pr-4 text-xs font-semibold text-slate-500">
                      {t('printTotal')}: {timerRecords.length}
                    </td>
                    <td className="py-2 font-mono font-bold text-slate-700 text-sm">
                      {formatTime(Math.round(timerRecords.reduce((s, r) => s + r.tiempoFinal, 0) / timerRecords.length))} {t('reportAvg')}
                    </td>
                    <td className="hidden md:table-cell print:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* Ah-Counter */}
        {ahParticipants.some(p => totalFillerWords(p) > 0) && (
          <section>
            <SectionHeader>{t('printSectionAh')}</SectionHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase">{t('printParticipant')}</th>
                    {activeWords.map(w => (
                      <th key={w} className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase">{w}</th>
                    ))}
                    <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase">{t('printTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ahParticipants.filter(p => totalFillerWords(p) > 0).map(p => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-800">{p.nombre}</td>
                      {activeWords.map(w => (
                        <td key={w} className="py-2 px-2 text-center font-mono text-sm">
                          <span className={p.muletillas[w] ? 'text-red-500 font-bold' : 'text-slate-300'}>
                            {p.muletillas[w] || 0}
                          </span>
                        </td>
                      ))}
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">
                        {totalFillerWords(p)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Grammar */}
        {(gramData.palabraDelDia || gramData.observaciones.length > 0) && (
          <section>
            <SectionHeader>{t('printSectionGram')}</SectionHeader>
            <div className="space-y-4">
              {gramData.palabraDelDia && (
                <div className="bg-indigo-50 rounded-lg p-4 print:border print:border-indigo-200 print:bg-white">
                  <div className="text-xs font-semibold text-indigo-500 uppercase mb-1">{t('printWordOfDay')}</div>
                  <div className="text-lg font-bold text-indigo-700">{gramData.palabraDelDia}</div>
                  {gramData.definicion && <p className="text-sm text-slate-600 mt-1">{gramData.definicion}</p>}
                  {Object.keys(gramData.usosDelDia ?? {}).length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-slate-500 mb-1">{t('printUsesOfWord')}</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(gramData.usosDelDia ?? {}).map(([n, c]) => (
                          <span key={n} className="text-xs bg-white border border-indigo-200 text-indigo-700 rounded px-2 py-0.5 font-medium">
                            {n}: {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {gramData.observaciones.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2">{t('printObservations')}</div>
                  <div className="space-y-2">
                    {gramData.observaciones.map(obs => (
                      <div key={obs.id} className="flex gap-3 py-2 border-b border-slate-100 last:border-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 self-start ${
                          obs.tipo === 'bueno' ? 'bg-green-100 text-green-700' :
                          obs.tipo === 'error' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {obs.tipo === 'bueno' ? t('gramTypeGood') : obs.tipo === 'error' ? t('gramTypeError') : t('gramTypeNeutral')}
                        </span>
                        <div>
                          <span className="font-semibold text-sm text-slate-800">{obs.nombre}</span>
                          <span className="text-sm text-slate-600 ml-2">{obs.texto}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* General Evaluator */}
        {(evalData.segmentos.some(s => s.notas.trim()) || evalData.resumenFinal) && (
          <section>
            <SectionHeader>{t('printSectionEval')}</SectionHeader>
            <div className="space-y-4">
              {/* Checklist summary */}
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-slate-700">{t('printChecklist')}:</div>
                <div className="flex flex-wrap gap-1.5">
                  {evalData.checklist.map(item => (
                    <span key={item.id} className={`text-xs px-2 py-0.5 rounded-full ${
                      item.completado ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400 line-through'
                    }`}>
                      {checkText(item)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Segment notes */}
              {evalData.segmentos.filter(s => s.notas.trim()).map(seg => (
                <div key={seg.id}>
                  <div className="text-sm font-semibold text-slate-700 mb-1">{segTitle(seg)}</div>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{seg.notas}</p>
                </div>
              ))}

              {evalData.resumenFinal && (
                <div className="bg-slate-50 rounded-lg p-4 print:border print:border-slate-200 print:bg-white">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2">{t('printFinalSummary')}</div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{evalData.resumenFinal}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Context Evaluation */}
        {evalContexto?.tipo && (
          <section>
            <SectionHeader>{t('printSectionContext')}</SectionHeader>
            <div className="space-y-4">
              {/* Header info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: evalContexto.tipo === 'variedad-vocal' ? t('contextVVTitle') : evalContexto.tipo === 'lenguaje-corporal' ? t('contextLCTitle') : t('contextOrgTitle'), value: '' },
                  { label: t('reportName'), value: evalContexto.nombreOrador },
                  { label: t('contextEvaluador'), value: evalContexto.evaluador },
                  { label: 'Fecha', value: evalContexto.fecha },
                ].map((item, i) => item.value !== undefined ? (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 print:border print:border-slate-200 print:bg-white">
                    <div className="text-xs text-slate-500 font-medium">{item.label}</div>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">{item.value || '—'}</div>
                  </div>
                ) : null)}
              </div>

              {/* VV */}
              {evalContexto.tipo === 'variedad-vocal' && (
                <div className="space-y-4">
                  {/* Ratings summary */}
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">{t('contextVVProfile')}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-1.5 pr-4 text-slate-500 font-medium">{t('contextVVIneficaz')}</th>
                            <th className="text-center py-1.5 px-1 text-slate-400 w-8">1</th>
                            <th className="text-center py-1.5 px-1 text-slate-400 w-8">2</th>
                            <th className="text-center py-1.5 px-1 text-slate-400 w-8">3</th>
                            <th className="text-center py-1.5 px-1 text-slate-400 w-8">4</th>
                            <th className="text-center py-1.5 px-1 text-slate-400 w-8">5</th>
                            <th className="text-left py-1.5 pl-4 text-slate-500 font-medium">{t('contextVVEficaz')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(evalContexto.vv.ratings).map(([key, val]) => (
                            <tr key={key} className="border-b border-slate-100 last:border-0">
                              <td className="py-1 pr-4 text-slate-500 font-medium capitalize">{key.replace(/_/g, ' ')}</td>
                              {[1,2,3,4,5].map(n => (
                                <td key={n} className="text-center py-1 px-1">
                                  <span className={`inline-block w-5 h-5 rounded-full text-xs font-bold leading-5 ${
                                    val === n
                                      ? n <= 2 ? 'bg-red-500 text-white' : n === 3 ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'
                                      : 'bg-slate-100 text-slate-300'
                                  }`}>{n}</span>
                                </td>
                              ))}
                              <td />
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {[
                    { label: t('contextVVDestacaste'), value: evalContexto.vv.destacaste },
                    { label: t('contextVVTrabajar'),   value: evalContexto.vv.trabajar },
                    { label: t('contextVVDesafio'),    value: evalContexto.vv.desafio },
                  ].filter(f => f.value).map((f, i) => (
                    <div key={i}>
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-1">{f.label}</div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{f.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* LC */}
              {evalContexto.tipo === 'lenguaje-corporal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(evalContexto.lc)
                      .filter(([key]) => !['diferente', 'gusto'].includes(key))
                      .map(([key, val]) => (
                        <div key={key} className="bg-slate-50 rounded-lg p-3 print:border print:border-slate-200 print:bg-white">
                          <div className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <div className={`text-sm font-semibold mt-0.5 ${
                            val === 'bueno' ? 'text-green-700' : val === 'regular' ? 'text-amber-700' : val === 'mejorar' ? 'text-red-700' : 'text-slate-400'
                          }`}>{val || '—'}</div>
                        </div>
                      ))}
                  </div>
                  {[
                    { label: t('contextLCDiferente'), value: evalContexto.lc.diferente },
                    { label: t('contextLCGusto'),     value: evalContexto.lc.gusto },
                  ].filter(f => f.value).map((f, i) => (
                    <div key={i}>
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-1">{f.label}</div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{f.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Org */}
              {evalContexto.tipo === 'organizacion' && (
                <div className="space-y-3">
                  {Object.entries(evalContexto.org).filter(([, v]) => v).map(([key, val]) => (
                    <div key={key}>
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{val}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Custom fields */}
        {campos.length > 0 && (
          <section>
            <SectionHeader>{t('printSectionCustom')}</SectionHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 print:grid-cols-3">
              {campos.map(campo => {
                const val = campo.tipo === 'si-no'
                  ? (campo.valor === 'true' ? t('customYes') : campo.valor === 'false' ? t('customNo') : '—')
                  : (campo.valor || '—')
                return (
                  <div key={campo.id} className="bg-slate-50 rounded-lg p-3 print:border print:border-slate-200 print:bg-white">
                    <div className="text-xs text-slate-500 font-medium">{campo.etiqueta}</div>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">{val}</div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {timerRecords.length === 0 && ahParticipants.length === 0 && !gramData.palabraDelDia && !evalData.resumenFinal && !evalContexto?.tipo && (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center text-slate-400 print:hidden">
            <Printer size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">{t('printNoData')}</p>
            <p className="text-sm mt-1">Completa los módulos y vuelve aquí para exportar.</p>
          </div>
        )}
      </div>

      {/* Print footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-slate-300 text-xs text-slate-400 text-center">
        {clubName ? `${clubName} · ` : ''}TM Meeting Assistant · {meetingDate || new Date().toLocaleDateString()}
      </div>
    </div>
  )
}
