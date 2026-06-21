import { TimerRecord, AhParticipant } from '../types'
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
  downloadCSV([headers, ...rows], `reporte-temporizador-${new Date().toISOString().split('T')[0]}.csv`)
}

export function exportAhCounterCSV(participants: AhParticipant[], activeWords: string[]): void {
  const headers = ['Orador', ...activeWords, 'Total']
  const rows = participants.map((p) => {
    const wordCounts = activeWords.map((w) => String(p.muletillas[w] || 0))
    const total = Object.values(p.muletillas).reduce((a, b) => a + b, 0)
    return [p.nombre, ...wordCounts, String(total)]
  })
  downloadCSV([headers, ...rows], `ah-counter-${new Date().toISOString().split('T')[0]}.csv`)
}

export function exportAhCounterPersonCSV(participant: AhParticipant, activeWords: string[]): void {
  const headers = ['Muletilla', 'Cantidad']
  const rows = activeWords
    .filter((w) => (participant.muletillas[w] || 0) > 0)
    .map((w) => [w, String(participant.muletillas[w] || 0)])
  const total = Object.values(participant.muletillas).reduce((a, b) => a + b, 0)
  rows.push(['TOTAL', String(total)])
  const name = participant.nombre.replace(/\s+/g, '-').toLowerCase()
  downloadCSV([headers, ...rows], `ah-counter-${name}-${new Date().toISOString().split('T')[0]}.csv`)
}

export function ahCounterSummaryText(participants: AhParticipant[]): string {
  if (participants.length === 0) return 'Sin participantes.'
  const date = new Date().toLocaleDateString('es-ES')
  const lines = participants.map((p) => {
    const total = Object.values(p.muletillas).reduce((a, b) => a + b, 0)
    const detail = Object.entries(p.muletillas)
      .map(([w, c]) => `${w}: ${c}`)
      .join(', ')
    return `• ${p.nombre}: ${total} muletilla${total !== 1 ? 's' : ''}${detail ? ` (${detail})` : ''}`
  })
  return `Ah-Counter — ${date}\n\n${lines.join('\n')}`
}

function downloadCSV(rows: string[][], filename: string): void {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
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
