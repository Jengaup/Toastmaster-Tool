import { storageGet, storageSet, STORAGE_KEYS } from './storage'

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export function soundEnabled(): boolean {
  return storageGet(STORAGE_KEYS.SOUND_ENABLED, false)
}

export function setSoundEnabled(on: boolean): void {
  storageSet(STORAGE_KEYS.SOUND_ENABLED, on)
}

function tone(audio: AudioContext, freq: number, startAt: number, duration: number, volume = 0.25) {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.01)
  gain.gain.linearRampToValueAtTime(0, startAt + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.02)
}

/** count beeps de `freq` Hz separados 250 ms */
export function playBeep(count: number, freq: number): void {
  if (!soundEnabled()) return
  const audio = getCtx()
  if (!audio) return
  const now = audio.currentTime
  for (let i = 0; i < count; i++) {
    tone(audio, freq, now + i * 0.25, 0.15)
  }
}

export function playPhaseSound(phase: 'verde' | 'amarillo' | 'rojo'): void {
  switch (phase) {
    case 'verde':    playBeep(1, 880);  break
    case 'amarillo': playBeep(2, 988);  break
    case 'rojo':     playBeep(3, 1175); break
  }
}

/** alarma grave doble cuando se agota el reloj de la reunión */
export function playMeetingOverSound(): void {
  if (!soundEnabled()) return
  const audio = getCtx()
  if (!audio) return
  const now = audio.currentTime
  tone(audio, 330, now, 0.4, 0.3)
  tone(audio, 262, now + 0.5, 0.6, 0.3)
}
