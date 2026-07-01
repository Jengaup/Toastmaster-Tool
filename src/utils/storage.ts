export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function storageSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage not available (private mode, quota exceeded)
  }
}

export function storageClear(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export const STORAGE_KEYS = {
  TIMER_CONFIG: 'tm_timer_config',
  TIMER_RECORDS: 'tm_timer_records',
  AH_PARTICIPANTS: 'tm_ah_participants',
  AH_WORDS: 'tm_ah_words',
  GRAMMAR_DATA: 'tm_grammar_data',
  EVALUADOR_DATA: 'tm_evaluador_data',
  CAMPOS_PERSONALIZADOS: 'tm_campos_personalizados',
  EVAL_CONTEXTO: 'tm_eval_contexto',
  EVAL_DISCURSO: 'tm_eval_discurso',
  MEETING_CLOCK: 'tm_meeting_clock',
  MEETING_SEGMENTS: 'tm_meeting_segments',
  MEETING_ROLES: 'tm_meeting_roles',
} as const
