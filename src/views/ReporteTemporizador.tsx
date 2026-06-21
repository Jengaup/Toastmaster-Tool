import { useState } from 'react'
import { Plus, Trash2, Download, Copy, Check, Pencil, X } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { TimerRecord, SPEECH_PRESETS } from '../types'
import { formatTime, parseTimeInput, secondsToInput } from '../utils/formatTime'
import { exportTimerCSV, timerRecordsSummary, copyToClipboard } from '../utils/export'
import { STORAGE_KEYS } from '../utils/storage'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Card } from '../components/ui/Card'

const SAMPLE_RECORDS: TimerRecord[] = [
  { id: '1', nombre: 'María García', tipo: 'Discurso preparado', tiempoFinal: 362, notas: '', fecha: new Date().toLocaleDateString('es-ES') },
  { id: '2', nombre: 'Carlos López', tipo: 'Table Topics', tiempoFinal: 98, notas: '', fecha: new Date().toLocaleDateString('es-ES') },
  { id: '3', nombre: 'Ana Rodríguez', tipo: 'Evaluación', tiempoFinal: 155, notas: 'Muy buena entrega', fecha: new Date().toLocaleDateString('es-ES') },
]

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

export default function ReporteTemporizador() {
  const [records, setRecords] = useLocalStorage<TimerRecord[]>(STORAGE_KEYS.TIMER_RECORDS, SAMPLE_RECORDS)
  const [form, setForm] = useState({ nombre: '', tipo: 'Discurso preparado', tiempoFinal: '', notas: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const speechTypes = Object.values(SPEECH_PRESETS).map((p) => p.label).concat(['Otro'])

  const handleAdd = () => {
    if (!form.nombre.trim() || !form.tiempoFinal.trim()) return
    const record: TimerRecord = {
      id: newId(),
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      tiempoFinal: parseTimeInput(form.tiempoFinal),
      notas: form.notas.trim(),
      fecha: new Date().toLocaleDateString('es-ES'),
    }
    setRecords((prev) => [...prev, record])
    setForm({ nombre: '', tipo: 'Discurso preparado', tiempoFinal: '', notas: '' })
  }

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id))
    if (editId === id) setEditId(null)
  }

  const startEdit = (r: TimerRecord) => {
    setEditId(r.id)
    setForm({ nombre: r.nombre, tipo: r.tipo, tiempoFinal: secondsToInput(r.tiempoFinal), notas: r.notas })
  }

  const saveEdit = () => {
    if (!editId) return
    setRecords((prev) =>
      prev.map((r) =>
        r.id === editId
          ? { ...r, nombre: form.nombre, tipo: form.tipo, tiempoFinal: parseTimeInput(form.tiempoFinal), notas: form.notas }
          : r
      )
    )
    setEditId(null)
    setForm({ nombre: '', tipo: 'Discurso preparado', tiempoFinal: '', notas: '' })
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(timerRecordsSummary(records))
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reporte de tiempos</h1>
          <p className="text-slate-500 text-sm mt-1">Registro manual de participantes y sus tiempos</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" icon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={handleCopy}>
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => exportTimerCSV(records)}>
            CSV
          </Button>
        </div>
      </div>

      {/* Form */}
      <Card title={editId ? 'Editar registro' : 'Agregar registro'} className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Nombre del participante"
          />
          <Select
            label="Tipo"
            value={form.tipo}
            onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
          >
            {speechTypes.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Input
            label="Tiempo (MM:SS)"
            value={form.tiempoFinal}
            onChange={(e) => setForm((p) => ({ ...p, tiempoFinal: e.target.value }))}
            placeholder="06:10"
          />
          <Input
            label="Notas (opcional)"
            value={form.notas}
            onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
            placeholder="Observaciones..."
          />
        </div>
        <div className="flex gap-2 mt-4">
          {editId ? (
            <>
              <Button variant="primary" onClick={saveEdit}>Guardar cambios</Button>
              <Button variant="ghost" icon={<X size={14} />} onClick={() => { setEditId(null); setForm({ nombre: '', tipo: 'Discurso preparado', tiempoFinal: '', notas: '' }) }}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleAdd}>
              Agregar
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {records.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-lg">Sin registros aún</p>
            <p className="text-sm mt-1">Agrega el primer participante arriba</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiempo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Notas</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Fecha</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{r.nombre}</td>
                    <td className="px-5 py-3 text-slate-600">{r.tipo}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono font-semibold text-slate-800">{formatTime(r.tiempoFinal)}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{r.notas || '—'}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs hidden md:table-cell">{r.fecha}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => startEdit(r)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Total: {records.length} participantes</td>
                  <td className="px-5 py-3 font-mono font-bold text-slate-700">
                    {formatTime(Math.round(records.reduce((sum, r) => sum + r.tiempoFinal, 0) / records.length))} prom.
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
