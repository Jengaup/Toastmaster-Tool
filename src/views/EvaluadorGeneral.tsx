import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Plus, Trash2, Check, RotateCcw, Copy, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'
import { TKey } from '../i18n'
import { EvaluadorData, EvalSegmento, EvalChecklist, MeetingRoles } from '../types'
import { STORAGE_KEYS } from '../utils/storage'
import { copyToClipboard } from '../utils/export'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

const DEFAULT_ROLES: MeetingRoles = {
  presidente: '', toastmaster: '', evaluadorGeneral: '',
  monitorMuletillas: '', monitorGramatica: '', monitorPalabra: '',
  cronometrador: '', monitorChat: '', sargentoArmas: '',
}

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

const DEFAULT_SEGMENTOS: EvalSegmento[] = [
  { id: 's1', titulo: '', notas: '' },
  { id: 's2', titulo: '', notas: '' },
  { id: 's3', titulo: '', notas: '' },
  { id: 's4', titulo: '', notas: '' },
  { id: 's5', titulo: '', notas: '' },
  { id: 's6', titulo: '', notas: '' },
  { id: 's7', titulo: '', notas: '' },
]

const DEFAULT_CHECKLIST: EvalChecklist[] = [
  { id: 'c1', texto: '', completado: false },
  { id: 'c2', texto: '', completado: false },
  { id: 'c3', texto: '', completado: false },
  { id: 'c4', texto: '', completado: false },
  { id: 'c5', texto: '', completado: false },
  { id: 'c6', texto: '', completado: false },
  { id: 'c7', texto: '', completado: false },
  { id: 'c8', texto: '', completado: false },
]

const DEFAULT_DATA: EvaluadorData = {
  segmentos: DEFAULT_SEGMENTOS,
  checklist: DEFAULT_CHECKLIST,
  resumenFinal: '',
}

const SEG_KEYS: Record<string, TKey> = {
  s1: 'evalSeg1', s2: 'evalSeg2', s3: 'evalSeg3', s4: 'evalSeg4',
  s5: 'evalSeg5', s6: 'evalSeg6', s7: 'evalSeg7',
}

const SEG_ACCENTS = [
  'border-l-sky-400',
  'border-l-violet-400',
  'border-l-indigo-400',
  'border-l-pink-400',
  'border-l-emerald-400',
  'border-l-amber-400',
  'border-l-slate-400',
]

const CHECK_KEYS: Record<string, TKey> = {
  c1: 'evalCheck1', c2: 'evalCheck2', c3: 'evalCheck3', c4: 'evalCheck4',
  c5: 'evalCheck5', c6: 'evalCheck6', c7: 'evalCheck7', c8: 'evalCheck8',
}

export default function EvaluadorGeneral() {
  const { t } = useLanguage()
  const [data, setData] = useLocalStorage<EvaluadorData>(STORAGE_KEYS.EVALUADOR_DATA, DEFAULT_DATA)
  const [roles] = useLocalStorage<MeetingRoles>(STORAGE_KEYS.MEETING_ROLES, DEFAULT_ROLES)
  const [newSegmento, setNewSegmento] = useState('')
  const [newCheck, setNewCheck] = useState('')
  const [copied, setCopied] = useState(false)
  const [showRoles, setShowRoles] = useLocalStorage('tm_ui_eval_roles', true)

  const ROLE_DISPLAY: { key: keyof MeetingRoles; labelKey: Parameters<typeof t>[0]; reporter?: boolean }[] = [
    { key: 'presidente',        labelKey: 'rolePresidente'        },
    { key: 'toastmaster',       labelKey: 'roleToastmaster'       },
    { key: 'evaluadorGeneral',  labelKey: 'roleEvaluadorGeneral'  },
    { key: 'cronometrador',     labelKey: 'roleCronometrador',     reporter: true },
    { key: 'monitorMuletillas', labelKey: 'roleMonitorMuletillas', reporter: true },
    { key: 'monitorGramatica',  labelKey: 'roleMonitorGramatica',  reporter: true },
    { key: 'monitorPalabra',    labelKey: 'roleMonitorPalabra',    reporter: true },
    { key: 'monitorChat',       labelKey: 'roleMonitorChat'       },
    { key: 'sargentoArmas',     labelKey: 'roleSargento'          },
  ]

  const filledRoles = ROLE_DISPLAY.filter(r => roles[r.key].trim())

  const updateNota = (id: string, notas: string) => {
    setData((prev) => ({ ...prev, segmentos: prev.segmentos.map((s) => s.id === id ? { ...s, notas } : s) }))
  }

  const addSegmento = () => {
    if (!newSegmento.trim()) return
    const s: EvalSegmento = { id: newId(), titulo: newSegmento.trim(), notas: '' }
    setData((prev) => ({ ...prev, segmentos: [...prev.segmentos, s] }))
    setNewSegmento('')
  }

  const removeSegmento = (id: string) => {
    setData((prev) => ({ ...prev, segmentos: prev.segmentos.filter((s) => s.id !== id) }))
  }

  const toggleChecklist = (id: string) => {
    setData((prev) => ({
      ...prev,
      checklist: prev.checklist.map((c) => c.id === id ? { ...c, completado: !c.completado } : c),
    }))
  }

  const addCheck = () => {
    if (!newCheck.trim()) return
    const c: EvalChecklist = { id: newId(), texto: newCheck.trim(), completado: false }
    setData((prev) => ({ ...prev, checklist: [...prev.checklist, c] }))
    setNewCheck('')
  }

  const removeCheck = (id: string) => {
    setData((prev) => ({ ...prev, checklist: prev.checklist.filter((c) => c.id !== id) }))
  }

  const resetChecklist = () => {
    setData((prev) => ({ ...prev, checklist: prev.checklist.map((c) => ({ ...c, completado: false })) }))
  }

  const segTitle = (seg: EvalSegmento) => SEG_KEYS[seg.id] ? t(SEG_KEYS[seg.id]) : seg.titulo
  const checkText = (item: EvalChecklist) => CHECK_KEYS[item.id] ? t(CHECK_KEYS[item.id]) : item.texto

  const buildSummary = () => {
    const date = new Date().toLocaleDateString('es-ES')
    const checkOk = data.checklist.filter((c) => c.completado).length
    const checkTotal = data.checklist.length
    const segments = data.segmentos
      .filter((s) => s.notas.trim())
      .map((s) => `**${segTitle(s)}**\n${s.notas}`)
      .join('\n\n')
    return `${t('evalSummaryHeader')} — ${date}\n${t('evalSummaryChecklist')}: ${checkOk}/${checkTotal} ✓\n\n${segments}${data.resumenFinal ? `\n\n${t('evalSummaryFinal')}:\n${data.resumenFinal}` : ''}`
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(buildSummary())
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  const completedCount = data.checklist.filter((c) => c.completado).length
  const totalCount = data.checklist.length
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <PageHeader
        title={t('evalTitle')}
        subtitle={t('evalSubtitle')}
        action={
          <Button variant="secondary" size="sm" icon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={handleCopy}>
            {copied ? t('copied') : t('evalCopyBtn')}
          </Button>
        }
      />

      {/* Roles reference panel */}
      <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowRoles(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users size={14} className="text-rose-500" />
            <span>{t('evalRolesRef')}</span>
            {filledRoles.length > 0 && (
              <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-semibold">
                {filledRoles.length}
              </span>
            )}
          </div>
          {showRoles ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showRoles && (
          <div className="border-t border-slate-100 px-5 py-4">
            {filledRoles.length === 0 ? (
              <div className="text-center py-2">
                <p className="text-sm text-slate-400">{t('evalRolesEmpty')}</p>
                <NavLink to="/roles" className="text-xs text-rose-500 hover:text-rose-700 underline mt-1 inline-block">
                  {t('evalRolesEmptyHint')}
                </NavLink>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-2">
                {filledRoles.map(r => (
                  <div key={r.key} className="min-w-0">
                    <p className={`text-xs font-medium truncate ${r.reporter ? 'text-rose-600' : 'text-slate-400'}`}>
                      {t(r.labelKey)}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{roles[r.key]}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card
            title={t('evalChecklistTitle')}
            subtitle={`${completedCount} / ${totalCount} ${t('evalCompleted')}`}
            accentColor="#f59e0b"
            action={
              <button onClick={resetChecklist} className="text-slate-400 hover:text-amber-500 transition-colors p-1">
                <RotateCcw size={14} />
              </button>
            }
          >
            <div className="mb-4">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-1 text-right">{pct}%</p>
            </div>

            <div className="space-y-1">
              {data.checklist.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 group">
                  <button
                    onClick={() => toggleChecklist(item.id)}
                    className={`mt-0.5 w-[18px] h-[18px] rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      item.completado ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    {item.completado && <Check size={10} className="text-white" strokeWidth={3} />}
                  </button>
                  <span className={`text-sm flex-1 leading-tight ${item.completado ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {checkText(item)}
                  </span>
                  <button
                    onClick={() => removeCheck(item.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all p-0.5"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
              <input
                value={newCheck}
                onChange={(e) => setNewCheck(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCheck()}
                placeholder={t('evalNewTask')}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-slate-300"
              />
              <button onClick={addCheck} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-3">
          {data.segmentos.map((seg, i) => {
            const accent = SEG_ACCENTS[i % SEG_ACCENTS.length]
            return (
              <div key={seg.id} className={`bg-white rounded-xl border border-slate-200 border-l-4 shadow-sm ${accent}`}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 text-sm">{segTitle(seg)}</h3>
                  <button onClick={() => removeSegmento(seg.id)} className="text-slate-300 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="px-4 py-3">
                  <textarea
                    value={seg.notas}
                    onChange={(e) => updateNota(seg.id, e.target.value)}
                    placeholder={t('evalNotesPlaceholder')}
                    rows={3}
                    className="w-full text-sm text-slate-700 placeholder-slate-300 border-0 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded-lg leading-relaxed"
                  />
                </div>
              </div>
            )
          })}

          <div className="flex gap-2">
            <input
              value={newSegmento}
              onChange={(e) => setNewSegmento(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSegmento()}
              placeholder={t('evalNewSegmentPlaceholder')}
              className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white placeholder-slate-300"
            />
            <button
              onClick={addSegmento}
              className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus size={16} /> {t('evalSegmentBtn')}
            </button>
          </div>

          <Card title={t('evalFinalSummary')} accentColor="#f59e0b">
            <Textarea
              value={data.resumenFinal}
              onChange={(e) => setData((prev) => ({ ...prev, resumenFinal: e.target.value }))}
              placeholder={t('evalFinalPlaceholder')}
              rows={5}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
