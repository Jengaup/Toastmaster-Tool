import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ── Anti-clickjacking ──────────────────────────────────────────────────────
// Si la app se carga dentro de un iframe (posible ataque de superposición de
// clics / secuestro), rompemos el marco. Si el marco es de otro origen y no
// podemos acceder a él, no renderizamos nada.
if (window.self !== window.top) {
  try {
    window.top!.location.replace(window.self.location.href)
  } catch {
    document.documentElement.innerHTML =
      '<p style="font-family:sans-serif;padding:2rem">Esta aplicación no puede mostrarse dentro de otra página.</p>'
    throw new Error('Framing not allowed')
  }
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )

  // ── Auto-recarga al publicar una versión nueva ────────────────────────────
  // El Service Worker (PWA) sirve la copia cacheada. Cuando se despliega una
  // versión nueva, el SW se activa (skipWaiting/clientsClaim) y toma el control;
  // recargamos una sola vez para que el usuario vea el cambio sin tener que
  // limpiar caché. La guarda evita recargar en la primera instalación.
  if ('serviceWorker' in navigator) {
    const hadController = !!navigator.serviceWorker.controller
    let reloaded = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded) return
      reloaded = true
      window.location.reload()
    })
  }
}
