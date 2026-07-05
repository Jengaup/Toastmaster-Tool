import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { storageGet, storageSet, STORAGE_KEYS } from '../utils/storage'

export interface MeetingClockState {
  durationMins: number
  startedAt: number | null
  pausedElapsed: number
}

export interface MeetingSegment {
  id: string
  label: string
  startedAt: number | null
  accumulated: number
  targetSecs?: number
}

const DEFAULT_CLOCK: MeetingClockState = {
  durationMins: 90,
  startedAt: null,
  pausedElapsed: 0,
}

const DEFAULT_SEGMENTS: MeetingSegment[] = [
  { id: 's_apertura',   label: 'Apertura',             startedAt: null, accumulated: 0 },
  { id: 's_discursos',  label: 'Discursos preparados',  startedAt: null, accumulated: 0 },
  { id: 's_topics',     label: 'Table Topics',          startedAt: null, accumulated: 0 },
  { id: 's_evaluacion', label: 'Evaluaciones',          startedAt: null, accumulated: 0 },
  { id: 's_cierre',     label: 'Cierre',                startedAt: null, accumulated: 0 },
]

const STANDARD_TM_SEGMENTS: MeetingSegment[] = [
  { id: 'std_social',    label: 'Socialización',             startedAt: null, accumulated: 0 },
  { id: 'std_apertura',  label: 'Apertura y presentación',   startedAt: null, accumulated: 0 },
  { id: 'std_topics',    label: 'Tópicos de Mesa',           startedAt: null, accumulated: 0 },
  { id: 'std_discursos', label: 'Discursos preparados',      startedAt: null, accumulated: 0 },
  { id: 'std_eval',      label: 'Sección de Evaluación',     startedAt: null, accumulated: 0 },
  { id: 'std_cierre',    label: 'Cierre y reconocimientos',  startedAt: null, accumulated: 0 },
]

interface MeetingClockCtx {
  clock: MeetingClockState
  segments: MeetingSegment[]
  clockElapsedMs: number
  totalMs: number
  remainingMs: number
  isRunning: boolean
  isOver: boolean
  startMeeting: () => void
  pauseMeeting: () => void
  resetMeeting: () => void
  setDuration: (mins: number) => void
  segmentElapsedMs: (seg: MeetingSegment) => number
  toggleSegment: (id: string) => void
  resetSegment: (id: string) => void
  setSegmentTarget: (id: string, secs: number) => void
  addSegment: (label: string) => void
  deleteSegment: (id: string) => void
  resetAll: () => void
  loadStandardAgenda: () => void
}

const MeetingClockContext = createContext<MeetingClockCtx>(null!)

export function MeetingClockProvider({ children }: { children: ReactNode }) {
  const [clock, setClock] = useState<MeetingClockState>(() =>
    storageGet(STORAGE_KEYS.MEETING_CLOCK, DEFAULT_CLOCK)
  )
  const [segments, setSegments] = useState<MeetingSegment[]>(() =>
    storageGet(STORAGE_KEYS.MEETING_SEGMENTS, DEFAULT_SEGMENTS)
  )
  const [now, setNow] = useState(Date.now())

  const anyRunning = clock.startedAt !== null || segments.some(s => s.startedAt !== null)
  useEffect(() => {
    if (!anyRunning) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [anyRunning])

  const saveClock = useCallback((next: MeetingClockState) => {
    setClock(next)
    storageSet(STORAGE_KEYS.MEETING_CLOCK, next)
  }, [])

  const saveSegments = useCallback((next: MeetingSegment[]) => {
    setSegments(next)
    storageSet(STORAGE_KEYS.MEETING_SEGMENTS, next)
  }, [])

  const clockElapsedMs = clock.startedAt !== null
    ? clock.pausedElapsed + (now - clock.startedAt)
    : clock.pausedElapsed

  const totalMs = clock.durationMins * 60 * 1000
  const remainingMs = Math.max(0, totalMs - clockElapsedMs)
  const isOver = clockElapsedMs > totalMs
  const isRunning = clock.startedAt !== null

  const startMeeting = () => { if (!isRunning) saveClock({ ...clock, startedAt: Date.now() }) }
  const pauseMeeting = () => { if (isRunning) saveClock({ ...clock, startedAt: null, pausedElapsed: clockElapsedMs }) }
  const resetMeeting = () => {
    saveClock({ ...clock, startedAt: null, pausedElapsed: 0 })
    saveSegments(segments.map(s => ({ ...s, startedAt: null, accumulated: 0 })))
  }
  const setDuration = (mins: number) => { if (!isRunning) saveClock({ ...clock, durationMins: mins }) }

  const segmentElapsedMs = useCallback((seg: MeetingSegment): number =>
    seg.startedAt !== null ? seg.accumulated + (now - seg.startedAt) : seg.accumulated,
  [now])

  const toggleSegment = (id: string) => {
    saveSegments(segments.map(s => {
      if (s.id !== id) return s
      if (s.startedAt !== null) return { ...s, startedAt: null, accumulated: segmentElapsedMs(s) }
      return { ...s, startedAt: Date.now() }
    }))
  }

  const resetSegment = (id: string) =>
    saveSegments(segments.map(s => s.id === id ? { ...s, startedAt: null, accumulated: 0 } : s))

  const setSegmentTarget = (id: string, secs: number) =>
    saveSegments(segments.map(s => s.id === id ? { ...s, targetSecs: secs > 0 ? secs : undefined } : s))

  const addSegment = (label: string) => {
    const seg: MeetingSegment = { id: 'seg_' + Date.now().toString(36), label, startedAt: null, accumulated: 0 }
    saveSegments([...segments, seg])
  }

  const deleteSegment = (id: string) => saveSegments(segments.filter(s => s.id !== id))

  const loadStandardAgenda = () => saveSegments(STANDARD_TM_SEGMENTS.map(s => ({ ...s })))

  const resetAll = () => {
    saveClock(DEFAULT_CLOCK)
    saveSegments(DEFAULT_SEGMENTS)
  }

  return (
    <MeetingClockContext.Provider value={{
      clock, segments, clockElapsedMs, totalMs, remainingMs,
      isRunning, isOver,
      startMeeting, pauseMeeting, resetMeeting, setDuration,
      segmentElapsedMs, toggleSegment, resetSegment, setSegmentTarget, addSegment, deleteSegment, resetAll, loadStandardAgenda,
    }}>
      {children}
    </MeetingClockContext.Provider>
  )
}

export function useMeetingClock() {
  return useContext(MeetingClockContext)
}
