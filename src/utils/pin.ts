const PIN_HASH_KEY = 'tm_pin_hash'
const SESSION_KEY = 'tm_unlocked'

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function hasPinEnabled(): boolean {
  return !!localStorage.getItem(PIN_HASH_KEY)
}

export function isSessionUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function setSessionUnlocked(): void {
  sessionStorage.setItem(SESSION_KEY, '1')
}

export function lockApp(): void {
  sessionStorage.removeItem(SESSION_KEY)
  window.location.reload()
}

export async function savePin(pin: string): Promise<void> {
  localStorage.setItem(PIN_HASH_KEY, await sha256(pin))
}

export function removePin(): void {
  localStorage.removeItem(PIN_HASH_KEY)
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_HASH_KEY)
  if (!stored) return false
  return (await sha256(pin)) === stored
}
