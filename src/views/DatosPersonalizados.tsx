import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, GripVertical } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
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
  { id: '4', etiqueta: 'Reunión híbrida', tipo: 'si-no', valor: 'true' },
  { id: '5', etiqueta: 'Tema de la reunión', tipo: 'texto', valor: 'Superando obstáculos' },
]

const TIPO_LABELS: Record<CampoPersonalizado['tipo'], string> = {
  texto: 'Texto',
  numero: 'Número',
  'si-no': 'Sí / No',
  lista: 'Lista',
}

export default function DatosPersonalizados() {
  const [campos, setCampos] = useLocalStorage<CampoPersonalizado[]>(STORAGE_KEYS.CAMPOS_PERSONALIZADOS, SAMPLE_CAMPOS)
  const [form, setForm] = useState<{ etiqueta: string; tipo: CampoPersonalizado['tipo']; valor: string; opciones: string }>({
    etiqueta: '',
    tipo: 'texto',
    valor: '',
    opciones: '',
  })
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

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
    setForm({
      etiqueta: c.etiqueta,
      tipo: c.tipo,
      valor: c.valor,
      opciones: c.opciones ? c.opciones.join('\n') : '',
    })
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
          <h1 className="text-2xl font-bold text-slate-900">Datos personalizados</h1>
          <p className="text-slate-500 text-sm mt-1">Campos libres adaptados a tu club o reunión</p>
        </div>
        {!showForm && (
          <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
            Nuevo campo
          </Button>
        )}
      </div>

      {showForm && (
        <Card title={editId ? 'Editar campo' : 'Nuevo campo'} className="mb-6">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nombre del campo"
                value={form.etiqueta}
                onChange={(e) => setForm((p) => ({ ...p, etiqueta: e.target.value }))}
                placeholder="Ej: Tema de reunión"
                autoFocus
              />
              <Select
                label="Tipo"
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
                label="Valor por defecto"
                value={form.valor}
                onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                placeholder="Opcional"
              />
            )}
            {form.tipo === 'numero' && (
              <Input
                label="Valor por defecto"
                type="number"
                value={form.valor}
                onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                placeholder="0"
              />
            )}
            {form.tipo === 'si-no' && (
              <Select
                label="Valor por defecto"
                value={form.valor}
                onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
              >
                <option value="">Sin seleccionar</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </Select>
            )}
            {form.tipo === 'lista' && (
              <Textarea
                label="Opciones (una por línea)"
                value={form.opciones}
                onChange={(e) => setForm((p) => ({ ...p, opciones: e.target.value }))}
                placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                rows={4}
              />
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="primary" icon={<Check size={14} />} onClick={handleSave}>
                {editId ? 'Guardar cambios' : 'Crear campo'}
              </Button>
              <Button variant="ghost" icon={<X size={14} />} onClick={cancelForm}>Cancelar</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Fields list */}
      {campos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <p className="text-lg font-medium">Sin campos personalizados</p>
          <p className="text-sm mt-1">Crea campos para guardar información relevante de tu reunión</p>
          <Button variant="primary" icon={<Plus size={16} />} className="mt-4" onClick={() => setShowForm(true)}>
            Crear primer campo
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
                    placeholder="Escribe el valor..."
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
                    {['true', 'false', ''].map((v) => (
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
                        {v === 'true' ? 'Sí' : v === 'false' ? 'No' : 'Sin seleccionar'}
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
                    <option value="">Seleccionar...</option>
                    {campo.opciones.map((op) => <option key={op}>{op}</option>)}
                  </select>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => startEdit(campo)}
                  className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(campo.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
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
