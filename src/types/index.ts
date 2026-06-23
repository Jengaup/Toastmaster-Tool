export type SpeechType = 'preparado' | 'table-topics' | 'evaluacion' | 'personalizado'

export interface TimerConfig {
  greenTime: number
  yellowTime: number
  redTime: number
}

export const SPEECH_PRESETS: Record<SpeechType, TimerConfig & { label: string }> = {
  preparado: { label: 'Discurso preparado', greenTime: 300, yellowTime: 360, redTime: 420 },
  'table-topics': { label: 'Table Topics', greenTime: 60, yellowTime: 90, redTime: 120 },
  evaluacion: { label: 'Evaluación', greenTime: 120, yellowTime: 150, redTime: 180 },
  personalizado: { label: 'Personalizado', greenTime: 180, yellowTime: 240, redTime: 300 },
}

export type TimerPhase = 'neutral' | 'verde' | 'amarillo' | 'rojo' | 'excedido'

export interface TimerRecord {
  id: string
  nombre: string
  tipo: string
  tiempoFinal: number
  notas: string
  fecha: string
}

export interface AhParticipant {
  id: string
  nombre: string
  muletillas: Record<string, number>
}

export const MULETILLAS_DEFAULT = ['Eh', 'Mm', 'Este', 'O sea', 'Básicamente', 'Entonces', '¿Verdad?', 'Personalizado']

export interface GrammarObservacion {
  id: string
  nombre: string
  tipo: 'bueno' | 'error' | 'neutro'
  texto: string
}

export interface GrammarData {
  palabraDelDia: string
  definicion: string
  observaciones: GrammarObservacion[]
  usosDelDia: Record<string, number>
}

export interface EvalSegmento {
  id: string
  titulo: string
  notas: string
}

export interface EvalChecklist {
  id: string
  texto: string
  completado: boolean
}

export interface EvaluadorData {
  segmentos: EvalSegmento[]
  checklist: EvalChecklist[]
  resumenFinal: string
}

export interface CampoPersonalizado {
  id: string
  etiqueta: string
  tipo: 'texto' | 'numero' | 'si-no' | 'lista'
  valor: string
  opciones?: string[]
}

// ── Context Evaluations ─────────────────────────────────────────────────────

export type EvalContextoTipo = 'variedad-vocal' | 'lenguaje-corporal' | 'organizacion'

export type LCOption = 'bueno' | 'regular' | 'mejorar' | ''

export interface VVRatings {
  volumen_proyeccion: number
  volumen_dinamico: number
  inflexion_variado: number
  inflexion_pleno: number
  voz_abierta: number
  voz_suave: number
  voz_entusiasta: number
  artic_clara: number
  artic_pronunciacion: number
  artic_pausas: number
  cadencia_regular: number
  cadencia_fluido: number
  cadencia_variado: number
  cadencia_deliberado: number
  cadencia_fluido2: number
  variedad_emocion: number
  variedad_genial: number
  variedad_natural: number
}

export interface EvalContextoData {
  tipo: EvalContextoTipo | null
  nombreOrador: string
  evaluador: string
  fecha: string
  titulo: string
  vv: {
    destacaste: string
    trabajar: string
    desafio: string
    ratings: VVRatings
  }
  lc: {
    manera: LCOption
    postura: LCOption
    gestos: LCOption
    movimiento: LCOption
    contactoVisual: LCOption
    expresionFacial: LCOption
    general: LCOption
    diferente: string
    gusto: string
  }
  org: {
    propGeneral: string
    propEspecifico: string
    cautivoTitulo: string
    hiloConductor: string
    puntos: string
    ejemplos: string
    transiciones: string
    apertura: string
    cierre: string
    mejor: string
  }
}

export interface EvalInstance {
  id: string
  createdAt: string
  data: EvalContextoData
}

export interface EvalContextoStore {
  instances: EvalInstance[]
  activeId: string | null
  reportId: string | null
}
