import { TimerRecord } from '../types'
import { formatTime } from './formatTime'

export function exportTimerCSV(records: TimerRecord[]): void {
  const headers = ['Nombre', 'Tipo', 'Tiempo', 'Notas', 'Fecha']
  const rows = records.map((r) => [
    r.nombre,
    r.tipo,
    formatTime(r.tiempoFinal),
    r.notas,
    r.fecha,
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte-temporizador-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function timerRecordsSummary(records: TimerRecord[]): string {
  if (records.length === 0) return 'Sin registros.'
  const lines = records.map(
    (r) => `• ${r.nombre} (${r.tipo}): ${formatTime(r.tiempoFinal)}${r.notas ? ` — ${r.notas}` : ''}`
  )
  return `Reporte de tiempos — ${new Date().toLocaleDateString('es-ES')}\n\n${lines.join('\n')}`
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  }
}
