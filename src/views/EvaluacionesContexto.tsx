import { Volume2, User, LayoutList, Plus, Trash2, Bookmark, BookmarkCheck } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'
import {
  EvalContextoData, EvalContextoStore, EvalInstance, EvalContextoTipo, LCOption, VVRatings,
} from '../types'
import { STORAGE_KEYS } from '../utils/storage'
import { Card } from '../components/ui/Card'
import { Input, Textarea } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_VV_RATINGS: VVRatings = {
  volumen_proyeccion: 0, volumen_dinamico: 0,
  inflexion_variado: 0, inflexion_pleno: 0,
  voz_abierta: 0, voz_suave: 0, voz_entusiasta: 0,
  artic_clara: 0, artic_pronunciacion: 0, artic_pausas: 0,
  cadencia_regular: 0, cadencia_fluido: 0, cadencia_variado: 0, cadencia_deliberado: 0, cadencia_fluido2: 0,
  variedad_emocion: 0, variedad_genial: 0, variedad_natural: 0,
}

export const DEFAULT_EVAL_CONTEXTO: EvalContextoData = {
  tipo: null,
  nombreOrador: '', evaluador: '', fecha: '', titulo: '',
  vv: { destacaste: '', trabajar: '', desafio: '', ratings: { ...DEFAULT_VV_RATINGS } },
  lc: { manera: '', postura: '', gestos: '', movimiento: '', contactoVisual: '', expresionFacial: '', general: '', diferente: '', gusto: '' },
  org: { propGeneral: '', propEspecifico: '', cautivoTitulo: '', hiloConductor: '', puntos: '', ejemplos: '', transiciones: '', apertura: '', cierre: '', mejor: '' },
}

export const DEFAULT_EVAL_STORE: EvalContextoStore = { instances: [], activeId: null, reportId: null }

// ── Helpers ───────────────────────────────────────────────────────────────────

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

function createInstance(tipo: EvalContextoTipo): EvalInstance {
  return {
    id: newId(),
    createdAt: new Date().toISOString(),
    data: {
      ...DEFAULT_EVAL_CONTEXTO,
      tipo,
      vv: { ...DEFAULT_EVAL_CONTEXTO.vv, ratings: { ...DEFAULT_VV_RATINGS } },
      lc: { ...DEFAULT_EVAL_CONTEXTO.lc },
      org: { ...DEFAULT_EVAL_CONTEXTO.org },
    },
  }
}

const TIPO_CLASSES = {
  'variedad-vocal':    { icon: <Volume2 size={18} />,   iconBg: 'bg-rose-100 text-rose-600',  color: 'text-rose-700',  border: 'border-rose-300 bg-rose-50',  label: 'Variedad Vocal' },
  'lenguaje-corporal': { icon: <User size={18} />,       iconBg: 'bg-sky-100 text-sky-600',    color: 'text-sky-700',   border: 'border-sky-300 bg-sky-50',    label: 'Lenguaje Corporal' },
  'organizacion':      { icon: <LayoutList size={18} />, iconBg: 'bg-teal-100 text-teal-600',  color: 'text-teal-700',  border: 'border-teal-300 bg-teal-50',  label: 'Organización' },
}

function instanceLabel(inst: EvalInstance, all: EvalInstance[]): string {
  const tipo = inst.data.tipo!
  const meta = TIPO_CLASSES[tipo]
  const sameType = all.filter(i => i.data.tipo === tipo)
  const n = sameType.findIndex(i => i.id === inst.id) + 1
  const numSuffix = sameType.length > 1 ? ` #${n}` : ''
  const oradorPart = inst.data.nombreOrador ? ` — ${inst.data.nombreOrador}` : ''
  return `${meta.label}${numSuffix}${oradorPart}`
}

// ── Static form data ──────────────────────────────────────────────────────────

const VV_GROUPS: Array<{ title: string; rows: Array<{ key: keyof VVRatings; left: string; right: string }> }> = [
  {
    title: 'Volumen',
    rows: [
      { key: 'volumen_proyeccion', left: 'Demasiado bajo — Demasiado alto', right: 'Buena proyección' },
      { key: 'volumen_dinamico',   left: 'Sin cambios — Demasiado expresivo', right: 'Vivo y dinámico' },
    ]
  },
  {
    title: 'Inflexión',
    rows: [
      { key: 'inflexion_variado', left: 'Demasiado alto — Demasiado bajo', right: 'Variado con éxito' },
      { key: 'inflexion_pleno',   left: 'Estridente', right: 'Pleno' },
    ]
  },
  {
    title: 'Calidad de la voz',
    rows: [
      { key: 'voz_abierta',    left: 'Nasal — Susurrante',  right: 'Abierta' },
      { key: 'voz_suave',      left: 'Fuerte, áspera',      right: 'Suave, agradable' },
      { key: 'voz_entusiasta', left: 'Sin vida',             right: 'Entusiasta, interesante' },
    ]
  },
  {
    title: 'Articulación (Uso de las palabras)',
    rows: [
      { key: 'artic_clara',         left: 'Murmuración',              right: 'Articulación clara' },
      { key: 'artic_pronunciacion', left: 'Pronunciación incorrecta', right: 'Pronunciación correcta' },
      { key: 'artic_pausas',        left: 'Mala elección de pausas',  right: 'Uso eficaz de pausas' },
    ]
  },
  {
    title: 'Cadencia o velocidad',
    rows: [
      { key: 'cadencia_regular',    left: 'Errático',                              right: 'Regular' },
      { key: 'cadencia_fluido',     left: 'Lento, pesado — Rápido, en carrera',   right: 'Fluido' },
      { key: 'cadencia_variado',    left: 'Sin variación',                         right: 'Variado, entretenido' },
      { key: 'cadencia_deliberado', left: 'Vacilante',                             right: 'Deliberado' },
      { key: 'cadencia_fluido2',    left: 'Alta velocidad',                        right: 'Fluido' },
    ]
  },
  {
    title: 'Variedad Vocal',
    rows: [
      { key: 'variedad_emocion', left: 'Sin emoción — Emociones exageradas', right: 'Transmite bien la emoción' },
      { key: 'variedad_genial',  left: 'Antipático',                         right: 'Genial' },
      { key: 'variedad_natural', left: 'Tenso',                              right: 'Natural' },
    ]
  },
]

const LC_FIELDS: Array<{
  key: keyof EvalContextoData['lc'] & string
  label: string
  options: Array<{ value: LCOption; label: string }>
}> = [
  { key: 'manera',         label: 'Manera',                    options: [{ value: 'bueno', label: 'Confiado, entusiasta' }, { value: 'regular', label: 'Satisfactorio' }, { value: 'mejorar', label: 'Nervioso, tenso' }] },
  { key: 'postura',        label: 'Postura',                   options: [{ value: 'bueno', label: 'Ecuánime, equilibrado' }, { value: 'regular', label: 'Satisfactorio' }, { value: 'mejorar', label: 'Puede mejorar' }] },
  { key: 'gestos',         label: 'Gestos',                    options: [{ value: 'bueno', label: 'Naturales, evocativos' }, { value: 'regular', label: 'Satisfactorio' }, { value: 'mejorar', label: 'Puede mejorar' }] },
  { key: 'movimiento',     label: 'Movimiento corporal',       options: [{ value: 'bueno', label: 'Determinado, directo' }, { value: 'regular', label: 'Satisfactorio' }, { value: 'mejorar', label: 'Inadecuado, distrae la atención' }] },
  { key: 'contactoVisual', label: 'Contacto visual',           options: [{ value: 'bueno', label: 'Vínculos visuales establecidos' }, { value: 'regular', label: 'Satisfactorio' }, { value: 'mejorar', label: 'Puede mejorar' }] },
  { key: 'expresionFacial',label: 'Expresión facial',          options: [{ value: 'bueno', label: 'Animado, amistoso, genuino' }, { value: 'regular', label: 'Satisfactorio' }, { value: 'mejorar', label: 'Puede mejorar' }] },
  { key: 'general',        label: 'Lenguaje corporal general', options: [{ value: 'bueno', label: 'Natural, expresivo' }, { value: 'regular', label: 'Satisfactorio' }, { value: 'mejorar', label: 'Poco natural, distrae la atención' }] },
]

const ORG_ITEMS: Array<{ key: keyof EvalContextoData['org']; label: string; hint?: string }> = [
  { key: 'propGeneral',    label: 'Propósito General' },
  { key: 'propEspecifico', label: 'Propósito Específico' },
  { key: 'cautivoTitulo',  label: '¿Cautivó desde el Título?' },
  { key: 'hiloConductor',  label: '¿Hubo Hilo Conductor?', hint: 'Claridad, Lógica, Secuencia' },
  { key: 'puntos',         label: '¿Se pudo percibir cuáles eran los puntos del discurso?' },
  { key: 'ejemplos',       label: '¿Fueron apropiados los ejemplos para respaldar los puntos del discurso?' },
  { key: 'transiciones',   label: '¿Cómo ejecutó las transiciones entre los puntos del discurso?' },
  { key: 'apertura',       label: '¿Capturó la atención en la apertura del discurso?', hint: 'Pregunta reflexiva, Declaración Impactante, Cita, Anécdota Corta' },
  { key: 'cierre',         label: '¿Cómo ejecutó el cierre?', hint: '¿Resumió los puntos? ¿Hubo llamado a la acción? ¿Cerró con impacto?' },
  { key: 'mejor',          label: '¿Qué pudo haber hecho mejor?' },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function RatingScale({ left, right, value, onChange }: {
  left: string; right: string; value: number; onChange: (v: number) => void
}) {
  const dotColor = (n: number) => {
    if (value !== n) return 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500'
    if (n <= 2) return 'bg-red-500 border-red-500 text-white'
    if (n === 3) return 'bg-amber-500 border-amber-500 text-white'
    return 'bg-green-600 border-green-600 text-white'
  }
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-xs text-slate-500 w-44 shrink-0 text-right leading-snug">{left}</span>
      <div className="flex gap-1.5 shrink-0">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            className={`w-7 h-7 rounded-full text-xs font-bold border-2 transition-all active:scale-90 ${dotColor(n)}`}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-700 font-medium leading-snug">{right}</span>
    </div>
  )
}

function RadioGroup({ label, value, options, onChange }: {
  label: string
  value: string
  options: Array<{ value: LCOption; label: string }>
  onChange: (v: LCOption) => void
}) {
  const optColor: Record<string, string> = {
    bueno:   'bg-green-50 text-green-700 border-green-200',
    regular: 'bg-amber-50 text-amber-700 border-amber-200',
    mejorar: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="text-sm font-semibold text-slate-700 mb-2">{label}</div>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-3">
        {options.map(opt => (
          <label
            key={opt.value}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm flex-1 ${
              value === opt.value ? `${optColor[opt.value]} font-medium` : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${value === opt.value ? 'border-current' : 'border-slate-300'}`}>
              {value === opt.value && <div className="w-2 h-2 rounded-full bg-current" />}
            </div>
            <input type="radio" className="sr-only" checked={value === opt.value} onChange={() => onChange(opt.value)} />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function EvaluacionesContexto() {
  const { t } = useLanguage()
  const [rawStore, setStore] = useLocalStorage<EvalContextoStore>(STORAGE_KEYS.EVAL_CONTEXTO, DEFAULT_EVAL_STORE)

  // Migration guard: old format had 'tipo' field, new format has 'instances'
  const store: EvalContextoStore = Array.isArray(rawStore?.instances) ? rawStore : DEFAULT_EVAL_STORE

  const activeInst = store.instances.find(i => i.id === store.activeId) ?? null

  // ── Store mutations ──────────────────────────────────────────────────────

  const addInstance = (tipo: EvalContextoTipo) => {
    const inst = createInstance(tipo)
    setStore(s => {
      const base = Array.isArray(s?.instances) ? s : DEFAULT_EVAL_STORE
      return { ...base, instances: [...base.instances, inst], activeId: inst.id }
    })
  }

  const setActive = (id: string) => setStore(s => ({ ...s, activeId: id }))

  const toggleReport = (id: string) =>
    setStore(s => ({ ...s, reportId: s.reportId === id ? null : id }))

  const deleteInst = (id: string) =>
    setStore(s => ({
      ...s,
      instances: s.instances.filter(i => i.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
      reportId: s.reportId === id ? null : s.reportId,
    }))

  const updateActiveData = (updater: (d: EvalContextoData) => EvalContextoData) =>
    setStore(s => ({
      ...s,
      instances: s.instances.map(inst =>
        inst.id === s.activeId ? { ...inst, data: updater(inst.data) } : inst
      ),
    }))

  const setHeader = (field: 'nombreOrador' | 'evaluador' | 'fecha' | 'titulo', value: string) =>
    updateActiveData(d => ({ ...d, [field]: value }))
  const setVV = (field: 'destacaste' | 'trabajar' | 'desafio', value: string) =>
    updateActiveData(d => ({ ...d, vv: { ...d.vv, [field]: value } }))
  const setVVRating = (key: keyof VVRatings, value: number) =>
    updateActiveData(d => ({ ...d, vv: { ...d.vv, ratings: { ...d.vv.ratings, [key]: value } } }))
  const setLC = (field: keyof EvalContextoData['lc'], value: string) =>
    updateActiveData(d => ({ ...d, lc: { ...d.lc, [field]: value } }))
  const setOrg = (field: keyof EvalContextoData['org'], value: string) =>
    updateActiveData(d => ({ ...d, org: { ...d.org, [field]: value } }))

  // ── Render ───────────────────────────────────────────────────────────────

  const EVAL_OPTIONS: Array<{ tipo: EvalContextoTipo; title: string; desc: string }> = [
    { tipo: 'variedad-vocal',    title: t('contextVVTitle'),  desc: t('contextVVDesc')  },
    { tipo: 'lenguaje-corporal', title: t('contextLCTitle'),  desc: t('contextLCDesc')  },
    { tipo: 'organizacion',      title: t('contextOrgTitle'), desc: t('contextOrgDesc') },
  ]

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <PageHeader title={t('contextTitle')} subtitle={t('contextSubtitle')} />

      {/* ── Nueva evaluación ── */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('contextNewEval')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {EVAL_OPTIONS.map(opt => {
            const meta = TIPO_CLASSES[opt.tipo]
            return (
              <button
                key={opt.tipo}
                type="button"
                onClick={() => addInstance(opt.tipo)}
                className={`flex flex-col gap-3 p-5 rounded-xl border bg-white shadow-sm text-left transition-all hover:shadow-md active:scale-[0.97] group ${meta.border}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.iconBg}`}>
                  {meta.icon}
                </div>
                <div className="flex-1">
                  <div className={`font-semibold text-sm ${meta.color}`}>{opt.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${meta.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <Plus size={12} /> {t('contextNewEval')}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Evaluaciones guardadas ── */}
      {store.instances.length > 0 && (
        <Card title={`${t('speechEvalSaved')} (${store.instances.length})`} className="mb-6">
          <div className="-mx-5 divide-y divide-slate-100">
            {store.instances.map(inst => {
              const meta = TIPO_CLASSES[inst.data.tipo!]
              const isActive = store.activeId === inst.id
              const isReport = store.reportId === inst.id
              const label = instanceLabel(inst, store.instances)
              return (
                <div
                  key={inst.id}
                  className={`flex items-center border-l-2 transition-colors ${
                    isActive ? 'bg-indigo-50/60 border-l-indigo-400' : 'border-l-transparent hover:bg-slate-50'
                  }`}
                >
                  <button
                    className="flex-1 flex items-center gap-3 px-5 py-3 text-left"
                    onClick={() => setActive(inst.id)}
                  >
                    <div className={`p-1.5 rounded-md shrink-0 ${isActive ? meta.iconBg : 'bg-slate-100 text-slate-500'}`}>
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold truncate ${isActive ? meta.color : 'text-slate-700'}`}>
                        {label}
                      </div>
                      {isReport && (
                        <div className="text-xs text-indigo-500 font-medium">{t('contextForReport')}</div>
                      )}
                    </div>
                    {isActive && (
                      <span className="ml-auto shrink-0 text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                        {t('contextActive')}
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-0.5 pr-4 shrink-0">
                    <button
                      title={isReport ? t('contextRemoveReport') : t('speechEvalUseReport')}
                      onClick={() => toggleReport(inst.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isReport
                          ? 'text-indigo-500 hover:bg-indigo-50'
                          : 'text-slate-300 hover:text-indigo-400 hover:bg-slate-100'
                      }`}
                    >
                      {isReport ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    </button>
                    <button
                      title={t('delete')}
                      onClick={() => deleteInst(inst.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ── Formulario de evaluación activa ── */}
      {activeInst && (
        <div className="space-y-4">
          {/* Editing header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">{t('contextEditing')}</p>
              <p className="text-sm font-bold text-slate-800">{instanceLabel(activeInst, store.instances)}</p>
            </div>
            <button
              onClick={() => toggleReport(activeInst.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shrink-0 ${
                store.reportId === activeInst.id
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {store.reportId === activeInst.id ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
              {store.reportId === activeInst.id ? t('contextForReport') : t('speechEvalUseReport')}
            </button>
          </div>

          {/* Common header fields */}
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('contextNombreOrador')}
                value={activeInst.data.nombreOrador}
                onChange={e => setHeader('nombreOrador', e.target.value)}
                placeholder="María García"
              />
              <Input
                label={t('contextEvaluador')}
                value={activeInst.data.evaluador}
                onChange={e => setHeader('evaluador', e.target.value)}
                placeholder="Tu nombre"
              />
              <Input
                label={t('contextFecha')}
                value={activeInst.data.fecha}
                onChange={e => setHeader('fecha', e.target.value)}
                type="date"
              />
              <Input
                label={t('contextTitulo')}
                value={activeInst.data.titulo}
                onChange={e => setHeader('titulo', e.target.value)}
                placeholder="Título del discurso"
              />
            </div>
          </Card>

          {/* ── Variedad Vocal ── */}
          {activeInst.data.tipo === 'variedad-vocal' && (
            <>
              <Card title={t('contextVVComments')}>
                <div className="space-y-4">
                  <Textarea label={t('contextVVDestacaste')} value={activeInst.data.vv.destacaste} onChange={e => setVV('destacaste', e.target.value)} rows={3} placeholder="Puntos fuertes del orador..." />
                  <Textarea label={t('contextVVTrabajar')}   value={activeInst.data.vv.trabajar}   onChange={e => setVV('trabajar', e.target.value)}   rows={3} placeholder="Áreas de mejora..." />
                  <Textarea label={t('contextVVDesafio')}    value={activeInst.data.vv.desafio}    onChange={e => setVV('desafio', e.target.value)}    rows={3} placeholder="Sugerencias para el siguiente nivel..." />
                </div>
              </Card>
              <Card title={t('contextVVProfile')}>
                <div className="flex justify-between text-xs font-bold mb-4 px-1">
                  <span className="text-red-500 uppercase tracking-wide">{t('contextVVIneficaz')} ←</span>
                  <span className="text-green-600 uppercase tracking-wide">→ {t('contextVVEficaz')}</span>
                </div>
                <div className="space-y-5">
                  {VV_GROUPS.map(group => (
                    <div key={group.title}>
                      <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 pb-1 border-b border-rose-100">
                        {group.title}
                      </h3>
                      <div className="space-y-0.5">
                        {group.rows.map(row => (
                          <RatingScale
                            key={row.key}
                            left={row.left}
                            right={row.right}
                            value={activeInst.data.vv.ratings[row.key]}
                            onChange={v => setVVRating(row.key, v)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ── Lenguaje Corporal ── */}
          {activeInst.data.tipo === 'lenguaje-corporal' && (
            <Card title={t('contextLCTitle')}>
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-5 text-xs text-sky-700 leading-relaxed">
                <span className="font-semibold">{t('contextLCNote')}: </span>
                {t('contextLCNoteText')}
              </div>
              <div className="divide-y divide-slate-100">
                {LC_FIELDS.map(field => (
                  <RadioGroup
                    key={field.key}
                    label={field.label}
                    value={activeInst.data.lc[field.key as keyof typeof activeInst.data.lc] as string}
                    options={field.options}
                    onChange={v => setLC(field.key as keyof EvalContextoData['lc'], v)}
                  />
                ))}
              </div>
              <div className="mt-5 space-y-4 pt-4 border-t border-slate-100">
                <Textarea label={t('contextLCDiferente')} value={activeInst.data.lc.diferente} onChange={e => setLC('diferente', e.target.value)} rows={3} placeholder="Sugerencias de mejora en lenguaje corporal..." />
                <Textarea label={t('contextLCGusto')}     value={activeInst.data.lc.gusto}     onChange={e => setLC('gusto', e.target.value)}     rows={3} placeholder="Aspectos positivos del discurso..." />
              </div>
            </Card>
          )}

          {/* ── Organización del Discurso ── */}
          {activeInst.data.tipo === 'organizacion' && (
            <Card title={t('contextOrgTitle')}>
              <div className="grid grid-cols-[1fr_1.5fr] gap-x-3 text-xs font-semibold text-slate-500 uppercase tracking-wide pb-2 border-b border-slate-200 mb-1 hidden sm:grid">
                <span>{t('contextOrgTable')}</span>
                <span>{t('contextObservations')}</span>
              </div>
              <div className="space-y-1">
                {ORG_ITEMS.map(item => (
                  <div
                    key={item.key}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-x-3 gap-y-1 py-3 border-b border-slate-100 last:border-0 items-start"
                  >
                    <div className="text-sm font-medium text-slate-700 leading-snug pt-1">
                      {item.label}
                      {item.hint && <span className="block text-xs text-slate-400 font-normal mt-0.5">{item.hint}</span>}
                    </div>
                    <Textarea
                      value={activeInst.data.org[item.key]}
                      onChange={e => setOrg(item.key, e.target.value)}
                      rows={2}
                      placeholder="Observaciones..."
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
