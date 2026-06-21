import { useState } from 'react'
import { Plus, Trash2, Check, RotateCcw, Copy } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'
import { EvaluadorData, EvalSegmento, EvalChecklist } from '../types'
import { STORAGE_KEYS } from '../utils/storage'
import { copyToClipboard } from '../utils/export'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Input'
import { Card } from '../components/ui/Card'

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

const DEFAULT_SEGMENTOS: EvalSegmento[] = [
  { id: 's1', titulo: 'Apertura de la reunión', notas: '' },
  { id: 's2', titulo: 'Palabra del día', notas: '' },
  { id: 's3', titulo: 'Discursos preparados', notas: '' },
  { id: 's4', titulo: 'Table Topics', notas: '' },
  { id: 's5', titulo: 'Evaluaciones', notas: '' },
  { id: 's6', titulo: 'Reportes de roles', notas: '' },
  { id: 's7', titulo: 'Cierre de la reunión', notas: '' },
]

const DEFAULT_CHECKLIST: EvalChecklist[] = [
  { id: 'c1', texto: 'La reunión inició a tiempo', completado: false },
  { id: 'c2', texto: 'El Toastmaster del día guió correctamente', completado: false },
  { id: 'c3', texto: 'Los roles estaban bien asignados', completado: false },
  { id: 'c4', texto: 'Los discursos cumplieron sus objetivos', completado: false },
  { id: 'c5', texto: 'Table Topics fue dinámico y participativo', completado: false },
  { id: 'c6', texto: 'Las evaluaciones fueron constructivas', completado: false },
  { id: 'c7', texto: 'La reunión terminó en el tiempo previsto', completado: false },
  { id: 'c8', texto: 'El ambiente fue positivo y motivador', completado: false },
]

const DEFAULT_DATA: EvaluadorData = {
  segmentos: DEFAULT_SEGMENTOS,
  checklist: DEFAULT_CHECKLIST,
  resumenFinal: '',
}

export default function EvaluadorGeneral() {
  const { t } = useLanguage()
  const [data, setData] = useLocalStorage<EvaluadorData>(STORAGE_KEYS.EVALUADOR_DATA, DEFAULT_DATA)
  const [newSegmento, setNewSegmento] = useState('')
  const [newCheck, setNewCheck] = useState('')
  const [copied, setCopied] = useState(false)

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

  const buildSummary = () => {
    const date = new Date().toLocaleDateString('es-ES')
    const checkOk = data.checklist.filter((c) => c.completado).length
    const checkTotal = data.checklist.length
    const segments = data.segmentos
      .filter((s) => s.notas.trim())
      .map((s) => `**${s.titulo}**\n${s.notas}`)
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('evalTitle')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('evalSubtitle')}</p>
        </div>
        <Button variant="secondary" size="sm" icon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={handleCopy}>
          {copied ? t('copied') : t('evalCopyBtn')}
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card
            title={t('evalChecklistTitle')}
            subtitle={`${completedCount} / ${totalCount} ${t('evalCompleted')}`}
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
                    {item.texto}
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

        <div className="md:col-span-2 space-y-4">
          {data.segmentos.map((seg) => (
            <div key={seg.id} className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 text-sm">{seg.titulo}</h3>
                <button onClick={() => removeSegmento(seg.id)} className="text-slate-300 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="p-4">
                <textarea
                  value={seg.notas}
                  onChange={(e) => updateNota(seg.id, e.target.value)}
                  placeholder={t('evalNotesPlaceholder')}
                  rows={3}
                  className="w-full text-sm text-slate-700 placeholder-slate-300 border-0 resize-none focus:outline-none focus:ring-0 leading-relaxed"
                />
              </div>
            </div>
          ))}

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

          <Card title={t('evalFinalSummary')}>
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
