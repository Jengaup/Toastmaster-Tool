import { useState, useMemo } from 'react'
import {
  GraduationCap, Plus, Trash2, Bookmark, BookmarkCheck, Search, X, ChevronDown, ChevronUp,
  ClipboardList, FileDown,
} from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'
import {
  EvalDiscursoStore, EvalDiscursoInstance, EvalDiscursoData, EvalDiscursoRating,
} from '../types'
import { STORAGE_KEYS } from '../utils/storage'
import { EVALUACIONES } from '../data/evaluaciones'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

const DEFAULT_STORE: EvalDiscursoStore = { instances: [], activeId: null, reportId: null }

function emptyData(evaluacionId: string): EvalDiscursoData {
  const def = EVALUACIONES.find(e => e.id === evaluacionId)
  const ratings: Record<string, EvalDiscursoRating> = {}
  if (def) def.criteria.forEach(c => { ratings[c.id] = { rating: null, comment: '' } })
  return {
    evaluacionId,
    header: { nombreOrador: '', fecha: '', evaluador: '', duracion: '', titulo: '' },
    comments: { destacaste: '', trabajar: '', desafio: '' },
    ratings,
  }
}

const RATING_LABELS_ES = ['', 'En desarrollo', 'Emergente', 'Experimentado', 'Destacado', 'Ejemplar']
const RATING_LABELS_EN = ['', 'Developing', 'Emerging', 'Accomplished', 'Excels', 'Exemplary']
const RATING_COLORS = ['', 'bg-red-100 text-red-700 border-red-300', 'bg-orange-100 text-orange-700 border-orange-300', 'bg-yellow-100 text-yellow-700 border-yellow-300', 'bg-green-100 text-green-700 border-green-300', 'bg-emerald-100 text-emerald-800 border-emerald-300']
const RATING_ACTIVE = ['', 'bg-red-500 text-white border-red-500', 'bg-orange-500 text-white border-orange-500', 'bg-yellow-500 text-white border-yellow-500', 'bg-green-500 text-white border-green-500', 'bg-emerald-600 text-white border-emerald-600']

function instanceLabel(inst: EvalDiscursoInstance): string {
  const def = EVALUACIONES.find(e => e.id === inst.data.evaluacionId)
  const title = def?.title ?? inst.data.evaluacionId
  const orador = inst.data.header.nombreOrador
  return orador ? `${title} — ${orador}` : title
}

export default function EvaluacionDiscurso() {
  const { t, lang } = useLanguage()
  const [rawStore, setStore] = useLocalStorage<EvalDiscursoStore>(STORAGE_KEYS.EVAL_DISCURSO, DEFAULT_STORE)
  const store: EvalDiscursoStore = Array.isArray(rawStore?.instances) ? rawStore : DEFAULT_STORE

  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({})

  const activeInstance = store.instances.find(i => i.id === store.activeId) ?? null
  const activeDef = activeInstance ? EVALUACIONES.find(e => e.id === activeInstance.data.evaluacionId) : null
  const ratingLabels = (activeDef?.lang ?? lang) === 'en' ? RATING_LABELS_EN : RATING_LABELS_ES

  const filteredEvals = useMemo(() => {
    const q = search.toLowerCase()
    return EVALUACIONES.filter(e => {
      if (q && !e.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [search])

  const createInstance = (evaluacionId: string) => {
    const inst: EvalDiscursoInstance = { id: newId(), createdAt: new Date().toISOString(), data: emptyData(evaluacionId) }
    setStore(s => ({ ...s, instances: [...s.instances, inst], activeId: inst.id }))
    setShowPicker(false)
    setSearch('')
  }

  const deleteInstance = (id: string) => {
    setStore(s => ({
      ...s,
      instances: s.instances.filter(i => i.id !== id),
      activeId: s.activeId === id ? (s.instances.find(i => i.id !== id)?.id ?? null) : s.activeId,
      reportId: s.reportId === id ? null : s.reportId,
    }))
  }

  const setActive = (id: string) => setStore(s => ({ ...s, activeId: id }))
  const toggleReport = (id: string) => setStore(s => ({ ...s, reportId: s.reportId === id ? null : id }))

  const updateHeader = (field: keyof EvalDiscursoData['header'], value: string) => {
    if (!store.activeId) return
    setStore(s => ({
      ...s,
      instances: s.instances.map(i =>
        i.id === s.activeId ? { ...i, data: { ...i.data, header: { ...i.data.header, [field]: value } } } : i
      ),
    }))
  }

  const updateComment = (field: keyof EvalDiscursoData['comments'], value: string) => {
    if (!store.activeId) return
    setStore(s => ({
      ...s,
      instances: s.instances.map(i =>
        i.id === s.activeId ? { ...i, data: { ...i.data, comments: { ...i.data.comments, [field]: value } } } : i
      ),
    }))
  }

  const updateRating = (criteriaId: string, field: 'rating' | 'comment', value: number | string | null) => {
    if (!store.activeId) return
    setStore(s => ({
      ...s,
      instances: s.instances.map(i =>
        i.id === s.activeId
          ? { ...i, data: { ...i.data, ratings: { ...i.data.ratings, [criteriaId]: { ...i.data.ratings[criteriaId], [field]: value } } } }
          : i
      ),
    }))
  }

  const toggleCriteria = (id: string) => setExpandedCriteria(p => ({ ...p, [id]: !p[id] }))

  const handlePrint = () => window.print()

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <PageHeader
        title={t('speechEvalTitle')}
        subtitle={t('speechEvalSubtitle')}
        action={
          <div className="flex gap-2">
            {activeInstance && activeDef && (
              <Button variant="secondary" size="sm" icon={<FileDown size={14} />} onClick={handlePrint} className="no-print">
                {t('speechEvalPdf')}
              </Button>
            )}
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowPicker(true)} className="no-print">
              {t('speechEvalNew')}
            </Button>
          </div>
        }
      />

      {/* Evaluation picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <GraduationCap size={20} className="text-purple-600" />
                {t('speechEvalChoose')}
              </h2>
              <button onClick={() => { setShowPicker(false); setSearch('') }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('speechEvalSearch')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                  autoFocus
                />
              </div>
              <div className="flex justify-end">
                <span className="text-xs text-slate-400">{filteredEvals.length} evaluaciones</span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1">
              {filteredEvals.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">{t('noResults')}</p>
              ) : filteredEvals.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => createInstance(ev.id)}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-colors group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-800 group-hover:text-purple-700">{ev.title}</div>
                      {ev.duration && <div className="text-xs text-slate-400 mt-0.5">{ev.duration}</div>}
                    </div>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${ev.lang === 'es' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                      {ev.lang.toUpperCase()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Saved instances */}
      {store.instances.length > 0 && (
        <Card title={t('speechEvalSaved')} className="mb-6">
          <div className="space-y-1 -mx-1">
            {store.instances.map(inst => (
              <div
                key={inst.id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors ${store.activeId === inst.id ? 'bg-purple-50 border border-purple-200' : 'hover:bg-slate-50 border border-transparent'}`}
              >
                <button
                  onClick={() => setActive(inst.id)}
                  className="flex-1 text-left"
                >
                  <span className={`text-sm font-medium ${store.activeId === inst.id ? 'text-purple-800' : 'text-slate-700'}`}>
                    {instanceLabel(inst)}
                  </span>
                  {(() => { const def = EVALUACIONES.find(e => e.id === inst.data.evaluacionId); return def ? <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${def.lang === 'es' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-600'}`}>{def.lang.toUpperCase()}</span> : null })()}
                </button>
                <button
                  onClick={() => toggleReport(inst.id)}
                  title={store.reportId === inst.id ? t('speechEvalInReport') : t('speechEvalUseReport')}
                  className={`p-1.5 rounded-lg transition-colors ${store.reportId === inst.id ? 'text-purple-600 bg-purple-100' : 'text-slate-300 hover:text-purple-500 hover:bg-purple-50'}`}
                >
                  {store.reportId === inst.id ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                </button>
                <button
                  onClick={() => deleteInstance(inst.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Form */}
      {activeInstance && activeDef ? (
        <div id="eval-print-area">
          {/* Print header — only visible when printing */}
          <div className="hidden print:block mb-6 border-b-2 border-slate-800 pb-3">
            <h1 className="text-xl font-bold text-slate-900">FORMULARIO DE EVALUACIÓN</h1>
            <p className="text-base font-semibold text-slate-700 mt-1">{activeDef.title}</p>
            {activeDef.duration && <p className="text-sm text-slate-500">Duración del discurso: {activeDef.duration}</p>}
          </div>

          {/* Rating scale legend — only in print */}
          <div className="hidden print:flex gap-4 mb-5 text-xs font-semibold">
            {[5,4,3,2,1].map(n => (
              <span key={n}><span className="font-bold">{n}</span> = {RATING_LABELS_ES[n]}</span>
            ))}
          </div>

          {/* Report badge */}
          <div className="mb-4 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">{activeDef.title}</span>
              {activeDef.duration && <span className="text-xs text-slate-400">· {activeDef.duration}</span>}
            </div>
            <button
              onClick={() => toggleReport(activeInstance.id)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${store.reportId === activeInstance.id ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-500 border-slate-200 hover:border-purple-300 hover:text-purple-600'}`}
            >
              {store.reportId === activeInstance.id ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
              {store.reportId === activeInstance.id ? t('speechEvalInReport') : t('speechEvalUseReport')}
            </button>
          </div>

          {/* Header fields */}
          <Card title={t('speechEvalHeader')} className="mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <Input
                label={t('speechEvalNombreOrador')}
                value={activeInstance.data.header.nombreOrador}
                onChange={e => updateHeader('nombreOrador', e.target.value)}
                placeholder="María García"
              />
              <Input
                label={t('speechEvalFecha')}
                value={activeInstance.data.header.fecha}
                onChange={e => updateHeader('fecha', e.target.value)}
                placeholder={new Date().toLocaleDateString('es-ES')}
              />
              <Input
                label={t('speechEvalEvaluador')}
                value={activeInstance.data.header.evaluador}
                onChange={e => updateHeader('evaluador', e.target.value)}
                placeholder="Tu nombre"
              />
              <Input
                label={t('speechEvalDuracion')}
                value={activeInstance.data.header.duracion}
                onChange={e => updateHeader('duracion', e.target.value)}
                placeholder={activeDef.duration ?? '05:30'}
              />
              <div className="sm:col-span-2">
                <Input
                  label={t('speechEvalTitulo')}
                  value={activeInstance.data.header.titulo}
                  onChange={e => updateHeader('titulo', e.target.value)}
                  placeholder="Título del discurso"
                />
              </div>
            </div>
          </Card>

          {/* General comments */}
          <Card title={t('speechEvalComments')} className="mb-4">
            <div className="space-y-3">
              {(
                [
                  ['destacaste', t('speechEvalDestacaste')] as const,
                  ['trabajar',   t('speechEvalTrabajar')] as const,
                  ['desafio',    t('speechEvalDesafio')] as const,
                ]
              ).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <textarea
                    value={activeInstance.data.comments[field]}
                    onChange={e => updateComment(field, e.target.value)}
                    rows={3}
                    placeholder="..."
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 resize-none transition-colors"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Criteria */}
          <Card title={t('speechEvalCriteria')}>
            <div className="space-y-3">
              {activeDef.criteria.map((criterion) => {
                const rating = activeInstance.data.ratings[criterion.id] ?? { rating: null, comment: '' }
                const isExpanded = expandedCriteria[criterion.id] ?? false
                return (
                  <div key={criterion.id} className={`border rounded-xl transition-colors ${rating.rating !== null ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1">
                          <div className="font-medium text-slate-800 text-sm">{criterion.label}</div>
                          {criterion.description && (
                            <button
                              onClick={() => toggleCriteria(criterion.id)}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-0.5 transition-colors"
                            >
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              {isExpanded ? 'Ocultar' : 'Ver descripción'}
                            </button>
                          )}
                        </div>
                        {rating.rating !== null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${RATING_ACTIVE[rating.rating]}`}>
                            {ratingLabels[rating.rating]}
                          </span>
                        )}
                      </div>

                      {isExpanded && criterion.description && (
                        <p className="text-xs text-slate-500 mb-3 bg-slate-50 rounded-lg px-3 py-2">{criterion.description}</p>
                      )}

                      {/* Rating buttons */}
                      <div className="flex gap-1.5 mb-3 no-print">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => updateRating(criterion.id, 'rating', rating.rating === n ? null : n)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-all ${rating.rating === n ? RATING_ACTIVE[n] : RATING_COLORS[n]} hover:scale-105`}
                            title={ratingLabels[n]}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      {/* Print-only score display */}
                      <div className="hidden print:flex gap-1.5 mb-3">
                        {[1, 2, 3, 4, 5].map(n => (
                          <div
                            key={n}
                            className={`flex-1 py-1 text-center text-xs font-bold border-2 rounded ${rating.rating === n ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 text-slate-400'}`}
                          >
                            {n}
                          </div>
                        ))}
                      </div>

                      {/* Comment */}
                      <textarea
                        value={rating.comment}
                        onChange={e => updateRating(criterion.id, 'comment', e.target.value)}
                        rows={2}
                        placeholder={t('speechEvalCommentPlaceholder')}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 text-slate-600 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none transition-colors"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <ClipboardList size={24} className="text-slate-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-600">{t('speechEvalEmpty')}</p>
              <p className="text-sm text-slate-400 mt-0.5">{t('speechEvalEmptySub')}</p>
            </div>
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowPicker(true)} className="mt-2">
              {t('speechEvalNew')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export { DEFAULT_STORE as DEFAULT_EVAL_DISCURSO_STORE }
