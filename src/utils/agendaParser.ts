import { MeetingRoles } from '../types'

export interface ParsedSpeaker {
  orador: string
  nombre: string
  titulo: string
  ruta: string
  nivel: string
  proyecto: string
  evaluador: string
}

export interface ParsedSegment {
  label: string
  targetSecs: number
}

export interface ParsedAgenda {
  fecha: string
  palabra: string
  roles: Partial<Record<keyof MeetingRoles, string>>
  speakers: ParsedSpeaker[]
  segments: ParsedSegment[]
}

// Etiquetas de rol → clave de MeetingRoles. El orden importa: se prueba de
// arriba a abajo, así que las variantes más específicas van primero.
const ROLE_PATTERNS: { key: keyof MeetingRoles; re: RegExp }[] = [
  { key: 'sargentoArmas',     re: /sargento\s+de\s+armas|oficial\s+de\s+asamblea/i },
  { key: 'presidente',        re: /presidente/i },
  { key: 'toastmaster',       re: /toastmaster/i },
  { key: 'evaluadorGeneral',  re: /evaluador(?:a)?\s+general/i },
  { key: 'monitorMuletillas', re: /muletillas/i },
  { key: 'monitorGramatica',  re: /gram[aá]tic/i },
  { key: 'monitorPalabra',    re: /(?:monitor(?:a)?\s+(?:de\s+)?(?:la\s+)?palabra|palabra\s+de\s+la\s+noche.*monitor)/i },
  { key: 'cronometrador',     re: /cron[oó]metr|monitor(?:a)?\s+(?:de|del)\s+tiempo/i },
  { key: 'monitorChat',       re: /chat|t[eé]cnico/i },
]

// Nombre propio: 1-4 palabras capitalizadas, admite acentos, iniciales y "DTM".
const NAME_RE = "[A-ZÁÉÍÓÚÑ][\\wáéíóúñ.]*(?:\\s+(?:de|del|la|los|N\\.?|[A-ZÁÉÍÓÚÑ][\\wáéíóúñ.]*)){0,4}"

// Palabras que NO forman parte de un nombre: si aparecen, el nombre termina antes.
// Cubre verbos/sustantivos de actividad frecuentes en las agendas.
const STOP_WORDS = new Set([
  'inicia', 'ofrece', 'evalua', 'presenta', 'comienza', 'orienta', 'solicita',
  'seleccion', 'transicion', 'cierra', 'continua', 'ofreci', 'votaciones',
  'cotejo', 'bienvenida', 'presentacion', 'discurso', 'ruta', 'nivel',
  'proyecto', 'titulo', 'da', 'ejecuta', 'realiza', 'anuncia', 'introduce',
  'comparte', 'entrega', 'recibe', 'lee', 'explica', 'menciona', 'agradece',
])

function normalizeWord(w: string): string {
  return w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.,;:]/g, '')
}

function parseTimeToSecs(s: string): number {
  const m = s.match(/^(\d{1,3}):(\d{2})$/)
  if (!m) return 0
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

function roleKeyFor(label: string): keyof MeetingRoles | null {
  for (const { key, re } of ROLE_PATTERNS) {
    if (re.test(label)) return key
  }
  return null
}

/** Recorta un nombre en el primer token que sea palabra de actividad (no-nombre). */
function cleanName(raw: string): string {
  const tokens = raw.replace(/\s+/g, ' ').trim().split(' ')
  const out: string[] = []
  for (const tok of tokens) {
    if (STOP_WORDS.has(normalizeWord(tok))) break
    out.push(tok)
    if (out.length >= 4) break
  }
  return out.join(' ').replace(/[.,;:]+$/, '').trim()
}

/** Limpieza para texto libre (ruta/proyecto/título/etiquetas): sin recorte de tokens. */
function cleanText(raw: string): string {
  return raw.replace(/\s+/g, ' ').replace(/[.,;:\s]+$/, '').trim()
}

/** Etiqueta breve para un segmento, cortada en límite de palabra. */
function shortLabel(raw: string, max = 48): string {
  const s = cleanText(raw)
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const sp = cut.lastIndexOf(' ')
  return (sp > 20 ? cut.slice(0, sp) : cut).trim()
}

export function parseAgenda(text: string): ParsedAgenda {
  const lines = text.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean)

  const roles: Partial<Record<keyof MeetingRoles, string>> = {}
  const setRole = (key: keyof MeetingRoles, name: string) => {
    const n = cleanName(name)
    if (n && !roles[key]) roles[key] = n
  }

  // ── Fecha ────────────────────────────────────────────────────────────────
  let fecha = ''
  for (const l of lines) {
    const m = l.match(/(\d{1,2}\s+de\s+[a-záéíóú]+\s+(?:de\s+)?\d{4})/i)
    if (m) { fecha = m[1]; break }
  }

  // ── Palabra de la noche (solo la variante con dos puntos) ─────────────────
  let palabra = ''
  for (const l of lines) {
    const m = l.match(/palabra\s+de\s+la\s+noche\s*:\s*([^0-9]+?)(?:\s{2,}|$)/i)
    if (m) {
      const val = cleanText(m[1])
      if (val && val.length <= 40) { palabra = val; break }
    }
  }

  // ── Roles desde el bloque "Rol - Nombre" ──────────────────────────────────
  const dashRe = new RegExp(`^(.{3,40}?)\\s*[-–:]\\s*(${NAME_RE})$`)
  for (const l of lines) {
    const m = l.match(dashRe)
    if (!m) continue
    const key = roleKeyFor(m[1])
    if (key) setRole(key, m[2])
  }

  // ── Roles y segmentos desde las filas de la tabla ─────────────────────────
  // Fila típica: "7.16 Presidente Bernardita López Inicia reunión ... 7:00"
  const rowRe = new RegExp(`^(\\d{1,2})[.:](\\d{2})\\s*(?:PM|AM)?\\s+(.*)$`, 'i')
  const speakers: ParsedSpeaker[] = []
  const segments: ParsedSegment[] = []

  for (const l of lines) {
    const m = l.match(rowRe)
    if (!m) continue
    let rest = m[3]

    // Extraer los tiempos finales (verde/amarillo/rojo o duración única)
    const times: number[] = []
    rest = rest.replace(/\b(\d{1,3}:\d{2})\b/g, (_g, t) => { times.push(parseTimeToSecs(t)); return '' }).trim()

    // Detectar la etiqueta de rol anclada al INICIO de la fila y tomar el
    // nombre justo después (evita que un cuantificador perezoso parta "Sargento
    // de Armas" en "Sargento de" + "Armas ...").
    const nameAfter = (from: number): string => {
      const m = rest.slice(from).match(new RegExp(`^\\s*(${NAME_RE})`))
      return m ? cleanName(m[1]) : ''
    }

    // ¿Orador N? → candidato a discurso preparado
    const orM = rest.match(/^orador(?:a)?\s*(\d+)?/i)
    if (orM) {
      const nombre = nameAfter(orM[0].length)
      if (nombre) speakers.push({
        orador: `Orador ${orM[1] ?? speakers.length + 1}`,
        nombre, titulo: '', ruta: '', nivel: '', proyecto: '', evaluador: '',
      })
    } else {
      for (const { key, re } of ROLE_PATTERNS) {
        const m = re.exec(rest)
        if (m && m.index <= 2) {
          const nombre = nameAfter(m.index + m[0].length)
          if (nombre) setRole(key, nombre)
          break
        }
      }
    }

    // Segmento: usar la mayor duración de la fila como objetivo
    if (times.length) {
      const target = Math.max(...times)
      const label = shortLabel(rest)
      if (target >= 60 && label) segments.push({ label, targetSecs: target })
    }
  }

  // ── Detalles del orador: bloque Ruta / Nivel / Proyecto / Título ──────────
  // El nombre del orador viene del último "(Nombre)" antes de la línea "Ruta:";
  // la línea "Ruta:" suele empezar con el nombre del EVALUADOR, no del orador.
  const findOrCreate = (nombre: string): ParsedSpeaker => {
    const found = speakers.find(s => s.nombre.toLowerCase() === nombre.toLowerCase())
    if (found) return found
    const created: ParsedSpeaker = {
      orador: `Orador ${speakers.length + 1}`, nombre, titulo: '', ruta: '', nivel: '', proyecto: '', evaluador: '',
    }
    speakers.push(created)
    return created
  }

  let lastParen = ''
  for (let i = 0; i < lines.length; i++) {
    const pm = lines[i].match(/\(([A-ZÁÉÍÓÚÑ][^)]{2,40})\)/)
    if (pm) lastParen = cleanName(pm[1])

    if (/ruta\s*:/i.test(lines[i]) && lastParen) {
      const sp = findOrCreate(lastParen)
      const window = lines.slice(i, i + 6).join('\n')
      const rutaM = window.match(/ruta\s*:\s*([^\n]+)/i)
      const nivelM = window.match(/nivel\s*(\d+)/i)
      const proyM = window.match(/proyecto\s*:\s*([^\n]+)/i)
      const titM = window.match(/t[ií]tulo\s*:\s*([^\n]+)/i)
      if (rutaM) sp.ruta = cleanText(rutaM[1])
      if (nivelM) sp.nivel = nivelM[1]
      if (proyM) sp.proyecto = cleanText(proyM[1])
      if (titM) sp.titulo = cleanText(titM[1])
      lastParen = ''
    }
  }

  // ── Evaluador de cada orador: "Evalúa Discurso ofrecido por: <orador>" ────
  // Fila: "Evaluador(a) de Discurso N <Evaluador> Evalúa ... por: <Orador>"
  for (const l of lines) {
    const em = l.match(new RegExp(`evaluador(?:a)?\\s+de\\s+discurso\\s*\\d*\\s+(${NAME_RE}).*?por:\\s*(${NAME_RE})`, 'i'))
    if (em) {
      const evaluador = cleanName(em[1])
      const orador = cleanName(em[2])
      const sp = speakers.find(s => s.nombre.toLowerCase() === orador.toLowerCase())
      if (sp && !sp.evaluador) sp.evaluador = evaluador
    }
  }

  return { fecha, palabra, roles, speakers, segments }
}
