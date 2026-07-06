import { SPEECH_PRESETS, SpeechType, TimerRecord } from '../types'

// Etiquetas ES/EN con las que se guardaron registros antiguos (sin tipoKey)
const LEGACY_LABELS: Record<SpeechType, string[]> = {
  preparado:      ['discurso preparado', 'prepared speech'],
  'table-topics': ['table topics'],
  evaluacion:     ['evaluación', 'evaluation'],
  personalizado:  ['personalizado', 'custom'],
}

export function speechTypeKey(record: Pick<TimerRecord, 'tipo' | 'tipoKey'>): SpeechType | null {
  if (record.tipoKey && record.tipoKey in SPEECH_PRESETS) return record.tipoKey
  const label = record.tipo.trim().toLowerCase()
  for (const [key, labels] of Object.entries(LEGACY_LABELS)) {
    if (labels.includes(label)) return key as SpeechType
  }
  return null
}
