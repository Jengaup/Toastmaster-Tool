import { Volume2, User, LayoutList } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'
import { EvalContextoData, EvalContextoTipo, LCOption, VVRatings } from '../types'
import { STORAGE_KEYS } from '../utils/storage'
import { Card } from '../components/ui/Card'
import { Input, Textarea } from '../components/ui/Input'

// ── Default data ─────────────────────────────────────────────────────────────

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

// ── Static content data ───────────────────────────────────────────────────────

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
      { key: 'voz_abierta',     left: 'Nasal — Susurrante', right: 'Abierta' },
      { key: 'voz_suave',       left: 'Fuerte, áspera', right: 'Suave, agradable' },
      { key: 'voz_entusiasta',  left: 'Sin vida', right: 'Entusiasta, interesante' },
    ]
  },
  {
    title: 'Articulación (Uso de las palabras)',
    rows: [
      { key: 'artic_clara',          left: 'Murmuración', right: 'Articulación clara' },
      { key: 'artic_pronunciacion',  left: 'Pronunciación incorrecta', right: 'Pronunciación correcta' },
      { key: 'artic_pausas',         left: 'Mala elección de pausas', right: 'Uso eficaz de pausas' },
    ]
  },
  {
    title: 'Cadencia o velocidad',
    rows: [
      { key: 'cadencia_regular',     left: 'Errático', right: 'Regular' },
      { key: 'cadencia_fluido',      left: 'Lento, pesado — Rápido, en carrera', right: 'Fluido' },
      { key: 'cadencia_variado',     left: 'Sin variación', right: 'Variado, entretenido' },
      { key: 'cadencia_deliberado',  left: 'Vacilante', right: 'Deliberado' },
      { key: 'cadencia_fluido2',     left: 'Alta velocidad', right: 'Fluido' },
    ]
  },
  {
    title: 'Variedad Vocal',
    rows: [
      { key: 'variedad_emocion',  left: 'Sin emoción — Emociones exageradas', right: 'Transmite bien la emoción' },
      { key: 'variedad_genial',   left: 'Antipático', right: 'Genial' },
      { key: 'variedad_natural',  left: 'Tenso', right: 'Natural' },
    ]
  },
]

const LC_FIELDS: Array<{
  key: keyof EvalContextoData['lc'] & string
  label: string
  options: Array<{ value: LCOption; label: string }>
}> = [
  {
    key: 'manera', label: 'Manera',
    options: [
      { value: 'bueno', label: 'Confiado, entusiasta' },
      { value: 'regular', label: 'Satisfactorio' },
      { value: 'mejorar', label: 'Nervioso, tenso' },
    ]
  },
  {
    key: 'postura', label: 'Postura',
    options: [
      { value: 'bueno', label: 'Ecuánime, equilibrado' },
      { value: 'regular', label: 'Satisfactorio' },
      { value: 'mejorar', label: 'Puede mejorar' },
    ]
  },
  {
    key: 'gestos', label: 'Gestos',
    options: [
      { value: 'bueno', label: 'Naturales, evocativos' },
      { value: 'regular', label: 'Satisfactorio' },
      { value: 'mejorar', label: 'Puede mejorar' },
    ]
  },
  {
    key: 'movimiento', label: 'Movimiento corporal',
    options: [
      { value: 'bueno', label: 'Determinado, directo' },
      { value: 'regular', label: 'Satisfactorio' },
      { value: 'mejorar', label: 'Inadecuado, distrae la atención' },
    ]
  },
  {
    key: 'contactoVisual', label: 'Contacto visual',
    options: [
      { value: 'bueno', label: 'Vínculos visuales establecidos' },
      { value: 'regular', label: 'Satisfactorio' },
      { value: 'mejorar', label: 'Puede mejorar' },
    ]
  },
  {
    key: 'expresionFacial', label: 'Expresión facial',
    options: [
      { value: 'bueno', label: 'Animado, amistoso, genuino' },
      { value: 'regular', label: 'Satisfactorio' },
      { value: 'mejorar', label: 'Puede mejorar' },
    ]
  },
  {
    key: 'general', label: 'Lenguaje corporal general',
    options: [
      { value: 'bueno', label: 'Natural, expresivo' },
      { value: 'regular', label: 'Satisfactorio' },
      { value: 'mejorar', label: 'Poco natural, distrae la atención' },
    ]
  },
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

function RatingScale({
  left, right, value, onChange,
}: { left: string; right: string; value: number; onChange: (v: number) => void }) {
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

function RadioGroup({
  label, value, options, onChange,
}: {
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
              value === opt.value
                ? `${optColor[opt.value]} font-medium`
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              value === opt.value ? 'border-current' : 'border-slate-300'
            }`}>
              {value === opt.value && <div className="w-2 h-2 rounded-full bg-current" />}
            </div>
            <input
              type="radio"
              className="sr-only"
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
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
  const [data, setData] = useLocalStorage<EvalContextoData>(STORAGE_KEYS.EVAL_CONTEXTO, DEFAULT_EVAL_CONTEXTO)

  const setTipo = (tipo: EvalContextoTipo) => setData(d => ({ ...d, tipo: d.tipo === tipo ? null : tipo }))
  const setHeader = (field: 'nombreOrador' | 'evaluador' | 'fecha' | 'titulo', value: string) =>
    setData(d => ({ ...d, [field]: value }))
  const setVV = (field: 'destacaste' | 'trabajar' | 'desafio', value: string) =>
    setData(d => ({ ...d, vv: { ...d.vv, [field]: value } }))
  const setVVRating = (key: keyof VVRatings, value: number) =>
    setData(d => ({ ...d, vv: { ...d.vv, ratings: { ...d.vv.ratings, [key]: value } } }))
  const setLC = (field: keyof EvalContextoData['lc'], value: string) =>
    setData(d => ({ ...d, lc: { ...d.lc, [field]: value } }))
  const setOrg = (field: keyof EvalContextoData['org'], value: string) =>
    setData(d => ({ ...d, org: { ...d.org, [field]: value } }))

  const EVAL_OPTIONS: Array<{
    tipo: EvalContextoTipo
    icon: React.ReactNode
    title: string
    desc: string
    color: string
    border: string
    iconBg: string
  }> = [
    {
      tipo: 'variedad-vocal',
      icon: <Volume2 size={22} />,
      title: t('contextVVTitle'),
      desc: t('contextVVDesc'),
      color: 'text-rose-700',
      border: 'border-rose-300 bg-rose-50',
      iconBg: 'bg-rose-100 text-rose-600',
    },
    {
      tipo: 'lenguaje-corporal',
      icon: <User size={22} />,
      title: t('contextLCTitle'),
      desc: t('contextLCDesc'),
      color: 'text-sky-700',
      border: 'border-sky-300 bg-sky-50',
      iconBg: 'bg-sky-100 text-sky-600',
    },
    {
      tipo: 'organizacion',
      icon: <LayoutList size={22} />,
      title: t('contextOrgTitle'),
      desc: t('contextOrgDesc'),
      color: 'text-teal-700',
      border: 'border-teal-300 bg-teal-50',
      iconBg: 'bg-teal-100 text-teal-600',
    },
  ]

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('contextTitle')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('contextSubtitle')}</p>
      </div>

      {/* Selection cards */}
      <div className="mb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('contextChooseEval')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {EVAL_OPTIONS.map(opt => {
            const isActive = data.tipo === opt.tipo
            return (
              <button
                key={opt.tipo}
                type="button"
                onClick={() => setTipo(opt.tipo)}
                className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all active:scale-[0.97] ${
                  isActive
                    ? `${opt.border} shadow-sm`
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? opt.iconBg : 'bg-slate-100 text-slate-500'}`}>
                  {opt.icon}
                </div>
                <div>
                  <div className={`font-semibold text-sm ${isActive ? opt.color : 'text-slate-700'}`}>
                    {opt.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                </div>
                {isActive && (
                  <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${opt.iconBg}`}>
                    Activa
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Form — only shown when a tipo is selected */}
      {data.tipo && (
        <div className="mt-6 space-y-4">
          {/* Common header fields */}
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('contextNombreOrador')}
                value={data.nombreOrador}
                onChange={e => setHeader('nombreOrador', e.target.value)}
                placeholder="María García"
              />
              <Input
                label={t('contextEvaluador')}
                value={data.evaluador}
                onChange={e => setHeader('evaluador', e.target.value)}
                placeholder="Tu nombre"
              />
              <Input
                label={t('contextFecha')}
                value={data.fecha}
                onChange={e => setHeader('fecha', e.target.value)}
                type="date"
              />
              <Input
                label={t('contextTitulo')}
                value={data.titulo}
                onChange={e => setHeader('titulo', e.target.value)}
                placeholder="Título del discurso"
              />
            </div>
          </Card>

          {/* ── Variedad Vocal ── */}
          {data.tipo === 'variedad-vocal' && (
            <>
              {/* Page 1: General comments */}
              <Card title={t('contextVVComments')}>
                <div className="space-y-4">
                  <Textarea
                    label={t('contextVVDestacaste')}
                    value={data.vv.destacaste}
                    onChange={e => setVV('destacaste', e.target.value)}
                    rows={3}
                    placeholder="Puntos fuertes del orador..."
                  />
                  <Textarea
                    label={t('contextVVTrabajar')}
                    value={data.vv.trabajar}
                    onChange={e => setVV('trabajar', e.target.value)}
                    rows={3}
                    placeholder="Áreas de mejora..."
                  />
                  <Textarea
                    label={t('contextVVDesafio')}
                    value={data.vv.desafio}
                    onChange={e => setVV('desafio', e.target.value)}
                    rows={3}
                    placeholder="Sugerencias para el siguiente nivel..."
                  />
                </div>
              </Card>

              {/* Page 2: Rating scales */}
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
                            value={data.vv.ratings[row.key]}
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
          {data.tipo === 'lenguaje-corporal' && (
            <Card title={t('contextLCTitle')}>
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-5 text-xs text-sky-700 leading-relaxed">
                <span className="font-semibold">{t('contextLCNote')}: </span>
                El orador debe usar la postura, movimiento corporal, gestos, expresiones faciales y contacto visual que ilustren y realcen su mensaje verbal. El mensaje que ves debe ser el mismo que oyes.
              </div>

              <div className="divide-y divide-slate-100">
                {LC_FIELDS.map(field => (
                  <RadioGroup
                    key={field.key}
                    label={field.label}
                    value={data.lc[field.key as keyof typeof data.lc] as string}
                    options={field.options}
                    onChange={v => setLC(field.key as keyof EvalContextoData['lc'], v)}
                  />
                ))}
              </div>

              <div className="mt-5 space-y-4 pt-4 border-t border-slate-100">
                <Textarea
                  label={t('contextLCDiferente')}
                  value={data.lc.diferente}
                  onChange={e => setLC('diferente', e.target.value)}
                  rows={3}
                  placeholder="Sugerencias de mejora en lenguaje corporal..."
                />
                <Textarea
                  label={t('contextLCGusto')}
                  value={data.lc.gusto}
                  onChange={e => setLC('gusto', e.target.value)}
                  rows={3}
                  placeholder="Aspectos positivos del discurso..."
                />
              </div>
            </Card>
          )}

          {/* ── Organización del Discurso ── */}
          {data.tipo === 'organizacion' && (
            <Card title={t('contextOrgTitle')}>
              <div className="grid grid-cols-[1fr_1.5fr] gap-x-3 gap-y-0 text-xs font-semibold text-slate-500 uppercase tracking-wide pb-2 border-b border-slate-200 mb-1 hidden sm:grid">
                <span>{t('contextOrgTable')}</span>
                <span>Observaciones</span>
              </div>
              <div className="space-y-1">
                {ORG_ITEMS.map(item => (
                  <div
                    key={item.key}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-x-3 gap-y-1 py-3 border-b border-slate-100 last:border-0 items-start"
                  >
                    <div className="text-sm font-medium text-slate-700 leading-snug pt-1">
                      {item.label}
                      {item.hint && (
                        <span className="block text-xs text-slate-400 font-normal mt-0.5">{item.hint}</span>
                      )}
                    </div>
                    <Textarea
                      value={data.org[item.key]}
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
