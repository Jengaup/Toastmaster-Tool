import { useState, useRef, useCallback, useEffect } from 'react'
import { TimerPhase, TimerConfig } from '../types'

export function getPhase(elapsed: number, config: TimerConfig): TimerPhase {
  if (elapsed === 0) return 'neutral'
  if (elapsed < config.greenTime) return 'verde'
  if (elapsed < config.yellowTime) return 'amarillo'
  if (elapsed < config.redTime) return 'rojo'
  return 'excedido'
}

export function getPhaseColor(phase: TimerPhase): string {
  switch (phase) {
    case 'verde': return '#22c55e'
    case 'amarillo': return '#f59e0b'
    case 'rojo': return '#ef4444'
    case 'excedido': return '#dc2626'
    default: return '#94a3b8'
  }
}

export function useTimer() {
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const baseElapsedRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const update = useCallback(() => {
    if (startTimeRef.current !== null) {
      setElapsed(baseElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000))
    }
  }, [])

  const start = useCallback(() => {
    if (startTimeRef.current !== null) return
    startTimeRef.current = Date.now()
    setIsRunning(true)
    intervalRef.current = setInterval(update, 200)
  }, [update])

  const pause = useCallback(() => {
    if (startTimeRef.current !== null) {
      baseElapsedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000)
      startTimeRef.current = null
    }
    setIsRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    startTimeRef.current = null
    baseElapsedRef.current = 0
    setElapsed(0)
    setIsRunning(false)
  }, [])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  return { elapsed, isRunning, start, pause, reset }
}
