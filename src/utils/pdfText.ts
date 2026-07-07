import * as pdfjsLib from 'pdfjs-dist'
// El worker se sirve desde el mismo origen (compatible con la CSP `script-src 'self'`)
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

/**
 * Extrae el texto de un PDF conservando el orden de lectura por filas.
 * Agrupa los fragmentos por su posición vertical (Y) para reconstruir
 * líneas coherentes, ya que las agendas suelen venir en tablas.
 */
export async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages: string[] = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()

    // Agrupar por línea usando la coordenada Y (redondeada) del transform
    const rows = new Map<number, { x: number; str: string }[]>()
    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue
      const tr = item.transform as number[]
      const y = Math.round(tr[5])
      const x = tr[4]
      if (!rows.has(y)) rows.set(y, [])
      rows.get(y)!.push({ x, str: item.str })
    }

    const orderedY = [...rows.keys()].sort((a, b) => b - a) // arriba → abajo
    const lines = orderedY.map(y =>
      rows.get(y)!
        .sort((a, b) => a.x - b.x)
        .map(c => c.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    pages.push(lines.join('\n'))
  }

  return pages.join('\n')
}
