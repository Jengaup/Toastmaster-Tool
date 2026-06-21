import { useState } from 'react'
import { Plus, Trash2, RotateCcw, UserPlus, Minus } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { AhParticipant, MULETILLAS_DEFAULT } from '../types'
import { STORAGE_KEYS } from '../utils/storage'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

const SAMPLE_PARTICIPANTS: AhParticipant[] = [
  { id: '1', nombre: 'María García', muletillas: { 'Eh': 2, 'Este': 1 } },
  { id: '2', nombre: 'Carlos López', muletillas: { 'Mm': 3, 'O sea': 2 } },
]

export default function AhCounter() {
  const [participants, setParticipants] = useLocalStorage<AhParticipant[]>(STORAGE_KEYS.AH_PARTICIPANTS, SAMPLE_PARTICIPANTS)
  const [newName, setNewName] = useState('')
  const [selectedMuletilla, setSelectedMuletilla] = useState(MULETILLAS_DEFAULT[0])
  const [customMuletilla, setCustomMuletilla] = useState('')
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const addParticipant = () => {
    if (!newName.trim()) return
    const p: AhParticipant = { id: newId(), nombre: newName.trim(), muletillas: {} }
    setParticipants((prev) => [...prev, p])
    setNewName('')
  }

  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id))
    if (activeTab === id) setActiveTab(null)
  }

  const increment = (participantId: string, muletilla: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? { ...p, muletillas: { ...p.muletillas, [muletilla]: (p.muletillas[muletilla] || 0) + 1 } }
          : p
      )
    )
  }

  const decrement = (participantId: string, muletilla: string) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== participantId) return p
        const current = p.muletillas[muletilla] || 0
        const updated = { ...p.muletillas }
        if (current <= 1) delete updated[muletilla]
        else updated[muletilla] = current - 1
        return { ...p, muletillas: updated }
      })
    )
  }

  const resetParticipant = (id: string) => {
    setParticipants((prev) => prev.map((p) => p.id === id ? { ...p, muletillas: {} } : p))
  }

  const getMuletillaToUse = () => {
    if (selectedMuletilla === 'Personalizado') return customMuletilla.trim() || 'Personalizado'
    return selectedMuletilla
  }

  const totalByParticipant = (p: AhParticipant) => Object.values(p.muletillas).reduce((a, b) => a + b, 0)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Ah-Counter</h1>
        <p className="text-slate-500 text-sm mt-1">Registro de muletillas por participante</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left panel */}
        <div className="md:col-span-1 space-y-4">
          <Card title="Agregar participante">
            <div className="space-y-3">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del participante"
                onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
              />
              <Button variant="primary" icon={<UserPlus size={16} />} className="w-full" onClick={addParticipant}>
                Agregar
              </Button>
            </div>
          </Card>

          <Card title="Muletilla activa">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {MULETILLAS_DEFAULT.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMuletilla(m)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                      selectedMuletilla === m
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {selectedMuletilla === 'Personalizado' && (
                <Input
                  value={customMuletilla}
                  onChange={(e) => setCustomMuletilla(e.target.value)}
                  placeholder="Escribe la muletilla..."
                />
              )}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Muletilla activa: <strong className="text-slate-700">{getMuletillaToUse()}</strong>
                </p>
              </div>
            </div>
          </Card>

          {/* Summary */}
          {participants.length > 0 && (
            <Card title="Resumen">
              <div className="space-y-2">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-700 font-medium truncate">{p.nombre}</span>
                    <Badge variant={totalByParticipant(p) === 0 ? 'neutral' : totalByParticipant(p) < 3 ? 'warning' : 'danger'}>
                      {totalByParticipant(p)}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right panel - participant cards */}
        <div className="md:col-span-2 space-y-4">
          {participants.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
              <p className="text-lg font-medium">Sin participantes</p>
              <p className="text-sm mt-1">Agrega participantes desde el panel izquierdo</p>
            </div>
          ) : (
            participants.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {p.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{p.nombre}</div>
                      <div className="text-xs text-slate-400">
                        {totalByParticipant(p) === 0 ? 'Sin muletillas' : `${totalByParticipant(p)} muletillas`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => increment(p.id, getMuletillaToUse())}
                      className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center font-bold text-lg transition-all active:scale-95 shadow-sm"
                      title={`Registrar "${getMuletillaToUse()}"`}
                    >
                      <Plus size={20} />
                    </button>
                    <button onClick={() => resetParticipant(p.id)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Reiniciar conteo">
                      <RotateCcw size={14} />
                    </button>
                    <button onClick={() => removeParticipant(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar participante">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {Object.entries(p.muletillas).length > 0 && (
                  <div className="px-5 py-3 flex flex-wrap gap-2">
                    {Object.entries(p.muletillas).map(([key, count]) => (
                      <div
                        key={key}
                        className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200 px-2.5 py-1.5"
                      >
                        <span className="text-xs text-slate-600 font-medium">{key}</span>
                        <span className="text-sm font-bold text-red-500 font-mono min-w-[1.5rem] text-center">{count}</span>
                        <button
                          onClick={() => decrement(p.id, key)}
                          className="text-slate-300 hover:text-slate-500 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
