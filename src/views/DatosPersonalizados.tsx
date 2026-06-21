import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, GripVertical } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'
import { CampoPersonalizado } from '../types'
import { STORAGE_KEYS } from '../utils/storage'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

const SAMPLE_CAMPOS: CampoPersonalizado[] = [
  { id: '1', etiqueta: 'Club', tipo: 'texto', valor: 'Toastmasters Club 1234' },
  { id: '2', etiqueta: 'Fecha de reunión', tipo: 'texto', valor: new Date().toLocaleDateString('es-ES') },
  { id: '3', etiqueta: 'Número de reunión', tipo: 'numero', valor: '42' },
  { id: '4', etiqueta: 'Modalidad', tipo: 'lista', valor: 'Presencial', opciones: ['Presencial', 'Virtual', 'Híbrida'] },
  { id: '5', etiqueta: 'Tema de la reunión', tipo: 'texto', valor: 'Superando obstáculos' },
]

export default function DatosPersonalizados() {
  const { t } = useLanguage()
  const [campos, setCampos] = useLocalStorage<CampoPersonalizado[]>(STORAGE_KEYS.CAMPOS_PERSONALIZADOS, SAMPLE_CAMPOS)
  const [form, setForm] = useState<{ etiqueta: string; tipo: CampoPersonalizado['tipo']; valor: string; opciones: string }>({
    etiqueta: '',
    tipo: 'texto',
    valor: '',
    opciones: '',
  })
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const TIPO_LABELS: Record<CampoPersonalizado['tipo'], string> = {
    texto: t('customTypeText'),
    numero: t('customTypeNumber'),
    'si-no': t('customTypeYesNo'),
    lista: t('customTypeList'),
  }

  const handleSave = () => {
    if (!form.etiqueta.trim()) return
    const campo: CampoPersonalizado = {
      id: editId || newId(),
      etiqueta: form.etiqueta.trim(),
      tipo: form.tipo,
      valor: form.valor,
      opciones: form.tipo === 'lista' ? form.opciones.split('\n').map((o) => o.trim()).filter(Boolean) : undefined,
    }
    if (editId) {
      setCampos((prev) => prev.map((c) => c.id === editId ? campo : c))
      setEditId(null)
    } else {
      setCampos((prev) => [...prev, campo])
    }
    setForm({ etiqueta: '', tipo: 'texto', valor: '', opciones: '' })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    setCampos((prev) => prev.filter((c) => c.id !== id))
    if (editId === id) { setEditId(null); setShowForm(false) }
  }

  const startEdit = (c: CampoPersonalizado) => {
    setEditId(c.id)
    setForm({ etiqueta: c.etiqueta, tipo: c.tipo, valor: c.valor, opciones: c.opciones ? c.opciones.join('\n') : '' })
    setShowForm(true)
  }

  const updateValor = (id: string, valor: string) => {
    setCampos((prev) => prev.map((c) => c.id === id ? { ...c, valor } : c))
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditId(null)
    setForm({ etiqueta: '', tipo: 'texto', valor: '', opciones: '' })
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('customTitle')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('customSubtitle')}</p>
        </div>
        {!showForm && (
          <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
            {t('customNewField')}
          </Button>
        )}
      </div>

      {showForm && (
        <Card title={editId ? t('customEditField') : t('customNewField')} className="mb-6">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('customFieldName')}
                value={form.etiqueta}
                onChange={(e) => setForm((p) => ({ ...p, etiqueta: e.target.value }))}
                placeholder={t('customFieldPlaceholder')}
                autoFocus
              />
              <Select
                label={t('customTypeLabel')}
                value={form.tipo}
                onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as CampoPersonalizado['tipo'] }))}
              >
                {(Object.entries(TIPO_LABELS) as [CampoPersonalizado['tipo'], string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </div>

            {form.tipo === 'texto' && (
              <Input
                label={t('customDefaultValue')}
                value={form.valor}
                onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                placeholder={t('customOptional')}
              />
            )}
            {form.tipo === 'numero' && (
              <Input
                label={t('customDefaultValue')}
                type="number"
                value={form.valor}
                onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                placeholder="0"
              />
            )}
            {form.tipo === 'si-no' && (
              <Select
                label={t('customDefaultValue')}
                value={form.valor}
                onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
              >
                <option value="">{t('customNoSelection')}</option>
                <option value="true">{t('customYes')}</option>
                <option value="false">{t('customNo')}</option>
              </Select>
            )}
            {form.tipo === 'lista' && (
              <Textarea
                label={t('customListOptions')}
                value={form.opciones}
                onChange={(e) => setForm((p) => ({ ...p, opciones: e.target.value }))}
                placeholder={`${t('customOptional')} 1\n${t('customOptional')} 2`}
                rows={4}
              />
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="primary" icon={<Check size={14} />} onClick={handleSave}>
                {editId ? t('saveChanges') : t('customCreateField')}
              </Button>
              <Button variant="ghost" icon={<X size={14} />} onClick={cancelForm}>{t('cancel')}</Button>
            </div>
          </div>
        </Card>
      )}

      {campos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <p className="text-lg font-medium">{t('customEmpty')}</p>
          <p className="text-sm mt-1">{t('customEmptySub')}</p>
          <Button variant="primary" icon={<Plus size={16} />} className="mt-4" onClick={() => setShowForm(true)}>
            {t('customCreateFirst')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {campos.map((campo) => (
            <div key={campo.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-3 group">
              <div className="text-slate-300 mt-1 cursor-grab">
                <GripVertical size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-slate-800">{campo.etiqueta}</span>
                  <Badge variant="neutral">{TIPO_LABELS[campo.tipo]}</Badge>
                </div>

                {campo.tipo === 'texto' && (
                  <input
                    type="text"
                    value={campo.valor}
                    onChange={(e) => updateValor(campo.id, e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-slate-300"
                    placeholder={t('customValuePlaceholder')}
                  />
                )}
                {campo.tipo === 'numero' && (
                  <input
                    type="number"
                    value={campo.valor}
                    onChange={(e) => updateValor(campo.id, e.target.value)}
                    className="w-32 text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                )}
                {campo.tipo === 'si-no' && (
                  <div className="flex gap-2">
                    {(['true', 'false', ''] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => updateValor(campo.id, v)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          campo.valor === v
                            ? v === 'true' ? 'bg-green-600 text-white border-green-600'
                              : v === 'false' ? 'bg-red-500 text-white border-red-500'
                              : 'bg-slate-600 text-white border-slate-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {v === 'true' ? t('customYes') : v === 'false' ? t('customNo') : t('customNoSelection')}
                      </button>
                    ))}
                  </div>
                )}
                {campo.tipo === 'lista' && campo.opciones && (
                  <select
                    value={campo.valor}
                    onChange={(e) => updateValor(campo.id, e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  >
                    <option value="">{t('customSelectPlaceholder')}</option>
                    {campo.opciones.map((op) => <option key={op}>{op}</option>)}
                  </select>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(campo)} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(campo.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
