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
  tipoKey?: SpeechType
  tiempoFinal: number
  notas: string
  fecha: string
  trayecto?: string
  proyecto?: string
  titulo?: string
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
  ejemplo: string
  observaciones: GrammarObservacion[]
  usosDelDia: Record<string, number>
}

export interface MeetingRoles {
  presidente: string
  toastmaster: string
  evaluadorGeneral: string
  monitorMuletillas: string
  monitorGramatica: string
  monitorPalabra: string
  cronometrador: string
  monitorChat: string
  sargentoArmas: string
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

// ── Speech Evaluations (69 PDFs) ────────────────────────────────────────────

export interface EvalCriterion {
  id: string
  label: string
  description?: string
}

export type EvalCategory = 'comunes' | 'electivos' | 'paths_activos' | 'paths_legacy' | 'otros'

export interface EvalDiscursoDefinition {
  id: string
  fileId: string
  title: string
  lang: 'es' | 'en'
  duration?: string
  criteria: EvalCriterion[]
  category?: EvalCategory
  path?: string
  level?: number
}

export interface EvalDiscursoHeader {
  nombreOrador: string
  fecha: string
  evaluador: string
  duracion: string
  titulo: string
}

export interface EvalDiscursoComments {
  destacaste: string
  trabajar: string
  desafio: string
}

export interface EvalDiscursoRating {
  rating: number | null
  comment: string
}

export interface EvalDiscursoData {
  evaluacionId: string
  header: EvalDiscursoHeader
  comments: EvalDiscursoComments
  ratings: Record<string, EvalDiscursoRating>
}

export interface EvalDiscursoInstance {
  id: string
  createdAt: string
  data: EvalDiscursoData
}

export interface EvalDiscursoStore {
  instances: EvalDiscursoInstance[]
  activeId: string | null
  reportId: string | null
}
