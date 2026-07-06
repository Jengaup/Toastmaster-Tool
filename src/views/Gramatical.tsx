import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, BookOpen } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'
import { GrammarData, GrammarObservacion } from '../types'
import { STORAGE_KEYS } from '../utils/storage'
import { Button } from '../components/ui/Button'
import { Input, Textarea, Select } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

const DEFAULT_DATA: GrammarData = {
  palabraDelDia: 'Elocuente',
  definicion: 'Que tiene la capacidad de expresarse con claridad y persuasión.',
  ejemplo: '',
  observaciones: [],
  usosDelDia: {},
}

export default function Gramatical() {
  const { t } = useLanguage()
  const [data, setData] = useLocalStorage<GrammarData>(STORAGE_KEYS.GRAMMAR_DATA, DEFAULT_DATA)
  const [form, setForm] = useState({ nombre: '', tipo: 'bueno' as GrammarObservacion['tipo'], texto: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [editPalabra, setEditPalabra] = useState(false)
  const [palabraForm, setPalabraForm] = useState({ palabraDelDia: data.palabraDelDia, definicion: data.definicion, ejemplo: data.ejemplo ?? '' })
  const [usoNombre, setUsoNombre] = useState('')

  const TIPO_LABELS: Record<GrammarObservacion['tipo'], string> = {
    bueno: t('gramTypeGood'),
    error: t('gramTypeError'),
    neutro: t('gramTypeNeutral'),
  }
  const TIPO_VARIANTS: Record<string, 'success' | 'danger' | 'neutral'> = {
    bueno: 'success',
    error: 'danger',
    neutro: 'neutral',
  }

  const usosDelDia = data.usosDelDia ?? {}

  const handleAddObservacion = () => {
    if (!form.nombre.trim() || !form.texto.trim()) return
    const obs: GrammarObservacion = { id: newId(), ...form, nombre: form.nombre.trim(), texto: form.texto.trim() }
    setData((prev) => ({ ...prev, observaciones: [...prev.observaciones, obs] }))
    setForm({ nombre: '', tipo: 'bueno', texto: '' })
  }

  const handleDelete = (id: string) => {
    if (!window.confirm(t('confirmDelete'))) return
    setData((prev) => ({ ...prev, observaciones: prev.observaciones.filter((o) => o.id !== id) }))
    if (editId === id) setEditId(null)
  }

  const startEdit = (obs: GrammarObservacion) => {
    setEditId(obs.id)
    setForm({ nombre: obs.nombre, tipo: obs.tipo, texto: obs.texto })
  }

  const saveEdit = () => {
    if (!editId) return
    setData((prev) => ({
      ...prev,
      observaciones: prev.observaciones.map((o) =>
        o.id === editId ? { ...o, ...form, nombre: form.nombre.trim(), texto: form.texto.trim() } : o
      ),
    }))
    setEditId(null)
    setForm({ nombre: '', tipo: 'bueno', texto: '' })
  }

  const savePalabra = () => {
    setData((prev) => ({ ...prev, palabraDelDia: palabraForm.palabraDelDia, definicion: palabraForm.definicion, ejemplo: palabraForm.ejemplo }))
    setEditPalabra(false)
  }

  const addUso = () => {
    const nombre = usoNombre.trim()
    if (!nombre) return
    setData((prev) => ({
      ...prev,
      usosDelDia: { ...(prev.usosDelDia ?? {}), [nombre]: ((prev.usosDelDia ?? {})[nombre] || 0) + 1 },
    }))
  }

  const incrementUso = (nombre: string) => {
    setData((prev) => ({
      ...prev,
      usosDelDia: { ...(prev.usosDelDia ?? {}), [nombre]: ((prev.usosDelDia ?? {})[nombre] || 0) + 1 },
    }))
  }

  const decrementUso = (nombre: string) => {
    setData((prev) => {
      const cur = (prev.usosDelDia ?? {})[nombre] || 0
      if (cur <= 0) return prev
      const updated = { ...(prev.usosDelDia ?? {}) }
      if (cur === 1) delete updated[nombre]
      else updated[nombre] = cur - 1
      return { ...prev, usosDelDia: updated }
    })
  }

  const removeUso = (nombre: string) => {
    setData((prev) => {
      const updated = { ...(prev.usosDelDia ?? {}) }
      delete updated[nombre]
      return { ...prev, usosDelDia: updated }
    })
  }

  const byParticipant = () => {
    const map: Record<string, { buenos: number; errores: number; neutros: number }> = {}
    data.observaciones.forEach((o) => {
      if (!map[o.nombre]) map[o.nombre] = { buenos: 0, errores: 0, neutros: 0 }
      if (o.tipo === 'bueno') map[o.nombre].buenos++
      else if (o.tipo === 'error') map[o.nombre].errores++
      else map[o.nombre].neutros++
    })
    return Object.entries(map)
  }

  const totalUsos = Object.values(usosDelDia).reduce((a, b) => a + b, 0)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <PageHeader title={t('gramTitle')} subtitle={t('gramSubtitle')} />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          {/* Palabra del día */}
          <Card accentColor="#7c3aed">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BookOpen size={14} className="text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{t('gramWordOfDay')}</h3>
            </div>

            {editPalabra ? (
              <div className="space-y-3">
                <Input
                  label={t('gramWordLabel')}
                  value={palabraForm.palabraDelDia}
                  onChange={(e) => setPalabraForm((p) => ({ ...p, palabraDelDia: e.target.value }))}
                />
                <Textarea
                  label={t('gramDefinitionLabel')}
                  value={palabraForm.definicion}
                  onChange={(e) => setPalabraForm((p) => ({ ...p, definicion: e.target.value }))}
                  rows={3}
                />
                <Input
                  label={t('gramExampleLabel')}
                  value={palabraForm.ejemplo}
                  onChange={(e) => setPalabraForm((p) => ({ ...p, ejemplo: e.target.value }))}
                  placeholder={t('gramExamplePlaceholder')}
                />
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" icon={<Check size={14} />} onClick={savePalabra}>{t('gramSave')}</Button>
                  <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={() => setEditPalabra(false)}>{t('cancel')}</Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xl font-bold text-indigo-700 mb-1">{data.palabraDelDia}</div>
                <p className="text-sm text-slate-600 leading-relaxed">{data.definicion || t('gramNoDefinition')}</p>
                {data.ejemplo && (
                  <p className="mt-2 text-xs text-slate-500 italic border-l-2 border-indigo-200 pl-2 leading-relaxed">"{data.ejemplo}"</p>
                )}
                <button
                  onClick={() => { setEditPalabra(true); setPalabraForm({ palabraDelDia: data.palabraDelDia, definicion: data.definicion, ejemplo: data.ejemplo ?? '' }) }}
                  className="mt-3 text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  <Pencil size={12} /> {t('gramEditWordOfDay')}
                </button>
              </div>
            )}
          </Card>

          {/* Usos de la palabra del día */}
          <Card accentColor="#7c3aed">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 text-sm">{t('gramUsesOf')} "{data.palabraDelDia}"</h3>
              {totalUsos > 0 && <Badge variant="info">{totalUsos} {t('gramUsesTotal')}</Badge>}
            </div>

            <div className="flex gap-2 mb-3">
              <input
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                placeholder={t('gramSpeakerPlaceholder')}
                value={usoNombre}
                onChange={(e) => setUsoNombre(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addUso()}
              />
              <button
                onClick={addUso}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            {Object.keys(usosDelDia).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">{t('gramNoUses')}</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(usosDelDia).map(([nombre, count]) => (
                  <div key={nombre} className="flex items-center gap-2">
                    <span className="text-sm text-slate-700 flex-1 truncate font-medium">{nombre}</span>
                    <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden">
                      <button onClick={() => decrementUso(nombre)} className="px-2 py-1 text-slate-500 hover:bg-slate-100 text-xs font-bold transition-colors">−</button>
                      <span className="px-2 text-sm font-bold text-indigo-600 font-mono min-w-[1.5rem] text-center">{count}</span>
                      <button onClick={() => incrementUso(nombre)} className="px-2 py-1 text-slate-500 hover:bg-slate-100 text-xs font-bold transition-colors">+</button>
                    </div>
                    <button onClick={() => removeUso(nombre)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {byParticipant().length > 0 && (
            <Card title={t('gramByParticipant')}>
              <div className="space-y-3">
                {byParticipant().map(([nombre, counts]) => (
                  <div key={nombre}>
                    <div className="text-sm font-medium text-slate-800 mb-1 truncate">{nombre}</div>
                    <div className="flex gap-1.5">
                      {counts.buenos > 0 && <Badge variant="success">{counts.buenos} {t('gramGoodBadge')}</Badge>}
                      {counts.errores > 0 && <Badge variant="danger">{counts.errores} {t('gramErrorsBadge')}</Badge>}
                      {counts.neutros > 0 && <Badge variant="neutral">{counts.neutros} {t('gramNeutralBadge')}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="md:col-span-2 space-y-4">
          <Card title={editId ? t('gramEditObs') : t('gramNewObs')}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('gramParticipant')}
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder={t('gramNamePlaceholder')}
                />
                <Select
                  label={t('gramType')}
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as GrammarObservacion['tipo'] }))}
                >
                  {(Object.entries(TIPO_LABELS) as [GrammarObservacion['tipo'], string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </Select>
              </div>
              <Textarea
                label={t('gramObservation')}
                value={form.texto}
                onChange={(e) => setForm((p) => ({ ...p, texto: e.target.value }))}
                placeholder={t('gramObsPlaceholder')}
                rows={2}
              />
              <div className="flex gap-2">
                {editId ? (
                  <>
                    <Button variant="primary" size="sm" onClick={saveEdit}>{t('saveChanges')}</Button>
                    <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={() => { setEditId(null); setForm({ nombre: '', tipo: 'bueno', texto: '' }) }}>
                      {t('cancel')}
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={handleAddObservacion}>
                    {t('gramAddObs')}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            {data.observaciones.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <BookOpen size={18} className="text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-500">{t('gramNoObs')}</p>
                <p className="text-xs text-slate-400">{t('gramAddObsHint')}</p>
              </div>
            ) : (
              data.observaciones.map((obs) => (
                <div
                  key={obs.id}
                  className={`bg-white rounded-xl border shadow-sm p-4 flex gap-4 ${
                    obs.tipo === 'bueno' ? 'border-green-200' : obs.tipo === 'error' ? 'border-red-200' : 'border-slate-200'
                  }`}
                >
                  <div className={`w-1 rounded-full shrink-0 ${obs.tipo === 'bueno' ? 'bg-green-400' : obs.tipo === 'error' ? 'bg-red-400' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800 text-sm">{obs.nombre}</span>
                      <Badge variant={TIPO_VARIANTS[obs.tipo]}>{TIPO_LABELS[obs.tipo]}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{obs.texto}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(obs)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(obs.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
