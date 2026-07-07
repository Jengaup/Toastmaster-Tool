import { useRef, useState } from 'react'
import { Upload, FileText, Wand2, Check, Users, BookOpen, ListOrdered, Mic, Copy } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useMeetingClock } from '../contexts/MeetingClockContext'
import { TKey } from '../i18n'
import { MeetingRoles, GrammarData } from '../types'
import { storageGet, storageSet, STORAGE_KEYS } from '../utils/storage'
import { extractPdfText } from '../utils/pdfText'
import { parseAgenda, ParsedAgenda, ParsedSpeaker } from '../utils/agendaParser'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

const ROLE_FIELDS: { key: keyof MeetingRoles; labelKey: TKey }[] = [
  { key: 'presidente',        labelKey: 'rolePresidente'        },
  { key: 'toastmaster',       labelKey: 'roleToastmaster'       },
  { key: 'evaluadorGeneral',  labelKey: 'roleEvaluadorGeneral'  },
  { key: 'monitorMuletillas', labelKey: 'roleMonitorMuletillas' },
  { key: 'monitorGramatica',  labelKey: 'roleMonitorGramatica'  },
  { key: 'monitorPalabra',    labelKey: 'roleMonitorPalabra'    },
  { key: 'cronometrador',     labelKey: 'roleCronometrador'     },
  { key: 'monitorChat',       labelKey: 'roleMonitorChat'       },
  { key: 'sargentoArmas',     labelKey: 'roleSargento'          },
]

const secsToMin = (s: number) => (s ? Math.round(s / 60) : '')

const inputCls = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all'

export default function ImportarAgenda() {
  const { t } = useLanguage()
  const { importSegments } = useMeetingClock()
  const fileRef = useRef<HTMLInputElement>(null)

  const [pasted, setPasted] = useState('')
  const [reading, setReading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parsed, setParsed] = useState<ParsedAgenda | null>(null)
  const [empty, setEmpty] = useState(false)
  const [applied, setApplied] = useState(false)

  // Secciones seleccionadas para aplicar
  const [useRoles, setUseRoles] = useState(true)
  const [usePalabra, setUsePalabra] = useState(true)
  const [useSegments, setUseSegments] = useState(true)

  const runParse = (text: string) => {
    const result = parseAgenda(text)
    const hasData = Object.keys(result.roles).length > 0 || result.palabra || result.speakers.length > 0 || result.segments.length > 0
    setEmpty(!hasData)
    setParsed(hasData ? result : null)
    setApplied(false)
  }

  const handleFile = async (file: File) => {
    setReading(true)
    setFileName(file.name)
    try {
      const text = await extractPdfText(file)
      setPasted(text)
      runParse(text)
    } catch {
      setEmpty(true)
      setParsed(null)
    } finally {
      setReading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // ── Editores del preview ──────────────────────────────────────────────────
  const setRole = (key: keyof MeetingRoles, v: string) =>
    setParsed(p => p && ({ ...p, roles: { ...p.roles, [key]: v } }))
  const setPalabra = (v: string) => setParsed(p => p && ({ ...p, palabra: v }))
  const setSpeaker = (i: number, patch: Partial<ParsedSpeaker>) =>
    setParsed(p => p && ({ ...p, speakers: p.speakers.map((s, j) => j === i ? { ...s, ...patch } : s) }))
  const setSegLabel = (i: number, v: string) =>
    setParsed(p => p && ({ ...p, segments: p.segments.map((s, j) => j === i ? { ...s, label: v } : s) }))
  const setSegMin = (i: number, v: string) =>
    setParsed(p => p && ({ ...p, segments: p.segments.map((s, j) => j === i ? { ...s, targetSecs: (parseInt(v) || 0) * 60 } : s) }))
  const removeSeg = (i: number) =>
    setParsed(p => p && ({ ...p, segments: p.segments.filter((_, j) => j !== i) }))

  const copySpeaker = (s: ParsedSpeaker) => {
    const parts = [s.nombre, s.titulo && `${t('importSpeakerTitle')}: ${s.titulo}`, s.ruta && `${t('importSpeakerPath')}: ${s.ruta}`, s.nivel && `${t('importSpeakerLevel')}: ${s.nivel}`, s.proyecto && `${t('importSpeakerProject')}: ${s.proyecto}`, s.evaluador && `${t('importSpeakerEval')}: ${s.evaluador}`].filter(Boolean)
    navigator.clipboard.writeText(parts.join('\n'))
  }

  const applyAll = () => {
    if (!parsed) return
    if (useRoles) {
      const current = storageGet<MeetingRoles>(STORAGE_KEYS.MEETING_ROLES, {
        presidente: '', toastmaster: '', evaluadorGeneral: '', monitorMuletillas: '',
        monitorGramatica: '', monitorPalabra: '', cronometrador: '', monitorChat: '', sargentoArmas: '',
      })
      const merged = { ...current }
      for (const { key } of ROLE_FIELDS) {
        const v = parsed.roles[key]
        if (v) merged[key] = v
      }
      storageSet(STORAGE_KEYS.MEETING_ROLES, merged)
    }
    if (usePalabra && parsed.palabra) {
      const g = storageGet<GrammarData>(STORAGE_KEYS.GRAMMAR_DATA, {
        palabraDelDia: '', definicion: '', ejemplo: '', observaciones: [], usosDelDia: {},
      })
      storageSet(STORAGE_KEYS.GRAMMAR_DATA, { ...g, palabraDelDia: parsed.palabra })
    }
    if (useSegments && parsed.segments.length) {
      importSegments(parsed.segments)
    }
    setApplied(true)
    setTimeout(() => setApplied(false), 3000)
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <PageHeader title={t('importTitle')} subtitle={t('importSubtitle')} />

      {/* Zona de carga */}
      <Card className="mb-4">
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors text-center"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
            {reading ? <FileText size={22} className="text-indigo-500 animate-pulse" /> : <Upload size={22} className="text-indigo-500" />}
          </div>
          <p className="font-semibold text-slate-700 text-sm">{reading ? t('importReading') : t('importDropTitle')}</p>
          <p className="text-xs text-slate-400">{fileName || t('importDropHint')}</p>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('importPasteLabel')}</label>
          <textarea
            value={pasted}
            onChange={e => setPasted(e.target.value)}
            placeholder={t('importPastePlaceholder')}
            rows={4}
            className={`${inputCls} resize-y font-mono text-xs`}
          />
          <div className="mt-3">
            <Button variant="primary" icon={<Wand2 size={15} />} onClick={() => runParse(pasted)} disabled={!pasted.trim() || reading}>
              {t('importParseBtn')}
            </Button>
          </div>
        </div>
      </Card>

      {empty && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 mb-4">
          {t('importNothing')}
        </div>
      )}

      {parsed && (
        <>
          <div className="flex items-center gap-3 mb-4 mt-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">{t('importPreviewTitle')}</p>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Roles */}
          <Card className="mb-4" padding="none">
            <SectionHead icon={<Users size={14} className="text-rose-500" />} title={t('importSecRoles')} checked={useRoles} onToggle={() => setUseRoles(v => !v)} />
            <div className="divide-y divide-slate-50">
              {ROLE_FIELDS.map(({ key, labelKey }) => (
                <div key={key} className="flex items-center gap-4 px-5 py-2.5">
                  <span className="text-sm font-medium text-slate-600 w-44 shrink-0">{t(labelKey)}</span>
                  <input className={inputCls} value={parsed.roles[key] ?? ''} onChange={e => setRole(key, e.target.value)} />
                </div>
              ))}
            </div>
          </Card>

          {/* Palabra */}
          <Card className="mb-4" padding="none">
            <SectionHead icon={<BookOpen size={14} className="text-violet-500" />} title={t('importSecPalabra')} checked={usePalabra} onToggle={() => setUsePalabra(v => !v)} />
            <div className="px-5 py-3">
              <input className={inputCls} value={parsed.palabra} onChange={e => setPalabra(e.target.value)} placeholder={t('importNoData')} />
            </div>
          </Card>

          {/* Segmentos */}
          <Card className="mb-4" padding="none">
            <SectionHead icon={<ListOrdered size={14} className="text-indigo-500" />} title={`${t('importSecSegments')} (${parsed.segments.length})`} checked={useSegments} onToggle={() => setUseSegments(v => !v)} />
            <div className="divide-y divide-slate-50">
              {parsed.segments.map((s, i) => (
                <div key={i} className="flex items-center gap-2 px-5 py-2">
                  <input className={`${inputCls} flex-1`} value={s.label} onChange={e => setSegLabel(i, e.target.value)} />
                  <input type="number" min={0} className="w-16 text-center text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" value={secsToMin(s.targetSecs)} onChange={e => setSegMin(i, e.target.value)} />
                  <span className="text-xs text-slate-400">min</span>
                  <button onClick={() => removeSeg(i)} className="p-1 text-slate-300 hover:text-red-500 transition-colors" aria-label={t('delete')}>×</button>
                </div>
              ))}
              {parsed.segments.length > 0 && (
                <p className="px-5 py-2 text-xs text-slate-400">{t('importSegNote')}</p>
              )}
            </div>
          </Card>

          {/* Oradores */}
          {parsed.speakers.length > 0 && (
            <Card className="mb-4" padding="none">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <Mic size={14} className="text-teal-500" />
                <span className="text-sm font-semibold text-slate-700">{t('importSecSpeakers')} ({parsed.speakers.length})</span>
              </div>
              <div className="divide-y divide-slate-100">
                {parsed.speakers.map((s, i) => (
                  <div key={i} className="px-5 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input className={`${inputCls} flex-1 font-semibold`} value={s.nombre} onChange={e => setSpeaker(i, { nombre: e.target.value })} />
                      <button onClick={() => copySpeaker(s)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" aria-label={t('copy')}>
                        <Copy size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <LabeledInput label={t('importSpeakerTitle')}  value={s.titulo}    onChange={v => setSpeaker(i, { titulo: v })} />
                      <LabeledInput label={t('importSpeakerEval')}   value={s.evaluador} onChange={v => setSpeaker(i, { evaluador: v })} />
                      <LabeledInput label={t('importSpeakerPath')}   value={s.ruta}      onChange={v => setSpeaker(i, { ruta: v })} />
                      <LabeledInput label={t('importSpeakerLevel')}  value={s.nivel}     onChange={v => setSpeaker(i, { nivel: v })} />
                      <LabeledInput label={t('importSpeakerProject')} value={s.proyecto} onChange={v => setSpeaker(i, { proyecto: v })} className="sm:col-span-2" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Aplicar */}
          <div className="sticky bottom-4 mt-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg px-5 py-4 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500">{t('importApplyHint')}</p>
              <Button variant={applied ? 'success' : 'primary'} icon={applied ? <Check size={16} /> : <Wand2 size={16} />} onClick={applyAll}>
                {applied ? t('importApplied') : t('importApply')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SectionHead({ icon, title, checked, onToggle }: { icon: React.ReactNode; title: string; checked: boolean; onToggle: () => void }) {
  return (
    <label className="px-5 py-3 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-slate-700">{title}</span>
      </div>
      <input type="checkbox" checked={checked} onChange={onToggle} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400" />
    </label>
  )
}

function LabeledInput({ label, value, onChange, className = '' }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-medium text-slate-400 block mb-0.5">{label}</span>
      <input
        className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  )
}
