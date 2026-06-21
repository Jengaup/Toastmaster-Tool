import { useState } from 'react'
import { Plus, Trash2, Download, Copy, Check, Pencil, X } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'
import { TimerRecord, SPEECH_PRESETS } from '../types'
import { formatTime, parseTimeInput, secondsToInput } from '../utils/formatTime'
import { exportTimerCSV, timerRecordsSummary, copyToClipboard } from '../utils/export'
import { STORAGE_KEYS } from '../utils/storage'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Card } from '../components/ui/Card'

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

export default function ReporteTemporizador() {
  const { t } = useLanguage()
  const [records, setRecords] = useLocalStorage<TimerRecord[]>(STORAGE_KEYS.TIMER_RECORDS, [])
  const [form, setForm] = useState({ nombre: '', tipo: SPEECH_PRESETS.preparado.label, tiempoFinal: '', notas: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const speechTypes = Object.values(SPEECH_PRESETS).map((p) => p.label).concat([t('other')])

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
    setForm({ nombre: '', tipo: SPEECH_PRESETS.preparado.label, tiempoFinal: '', notas: '' })
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
    setForm({ nombre: '', tipo: SPEECH_PRESETS.preparado.label, tiempoFinal: '', notas: '' })
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(timerRecordsSummary(records))
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('reportTitle')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('reportSubtitle')}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" icon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={handleCopy}>
            {copied ? t('copied') : t('copy')}
          </Button>
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => exportTimerCSV(records)}>
            {t('csv')}
          </Button>
        </div>
      </div>

      <Card title={editId ? t('reportEditRecord') : t('reportAddRecord')} className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            label={t('reportName')}
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            placeholder={t('reportParticipantPlaceholder')}
          />
          <Select
            label={t('reportType')}
            value={form.tipo}
            onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
          >
            {speechTypes.map((tp) => <option key={tp}>{tp}</option>)}
          </Select>
          <Input
            label={t('reportTime')}
            value={form.tiempoFinal}
            onChange={(e) => setForm((p) => ({ ...p, tiempoFinal: e.target.value }))}
            placeholder="06:10"
          />
          <Input
            label={t('reportNotes')}
            value={form.notas}
            onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
            placeholder={t('reportObservationsPlaceholder')}
          />
        </div>
        <div className="flex gap-2 mt-4">
          {editId ? (
            <>
              <Button variant="primary" onClick={saveEdit}>{t('saveChanges')}</Button>
              <Button variant="ghost" icon={<X size={14} />} onClick={() => { setEditId(null); setForm({ nombre: '', tipo: SPEECH_PRESETS.preparado.label, tiempoFinal: '', notas: '' }) }}>
                {t('cancel')}
              </Button>
            </>
          ) : (
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleAdd}>
              {t('add')}
            </Button>
          )}
        </div>
      </Card>

      <Card>
        {records.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-lg">{t('reportEmpty')}</p>
            <p className="text-sm mt-1">{t('reportEmptySub')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('reportName')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('reportType')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('reportTime')}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">{t('reportNotes')}</th>
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
                  <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                    {t('reportTotal')}: {records.length} {t('reportParticipants')}
                  </td>
                  <td className="px-5 py-3 font-mono font-bold text-slate-700">
                    {formatTime(Math.round(records.reduce((sum, r) => sum + r.tiempoFinal, 0) / records.length))} {t('reportAvg')}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
