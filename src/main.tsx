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
}
