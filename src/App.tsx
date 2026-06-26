import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import { Layout } from './components/Layout'
import { PinLock } from './components/PinLock'
import { hasPinEnabled, isSessionUnlocked } from './utils/pin'
import Temporizador from './views/Temporizador'
import ReporteTemporizador from './views/ReporteTemporizador'
import AhCounter from './views/AhCounter'
import Gramatical from './views/Gramatical'
import EvaluadorGeneral from './views/EvaluadorGeneral'
import DatosPersonalizados from './views/DatosPersonalizados'
import ImprimirReporte from './views/ImprimirReporte'
import EvaluacionesContexto from './views/EvaluacionesContexto'
import EvaluacionDiscurso from './views/EvaluacionDiscurso'

function AppInner() {
  const [locked, setLocked] = useState(() => hasPinEnabled() && !isSessionUnlocked())

  if (locked) return <PinLock onUnlock={() => setLocked(false)} />

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/temporizador" replace />} />
          <Route path="/temporizador" element={<Temporizador />} />
          <Route path="/reporte" element={<ReporteTemporizador />} />
          <Route path="/ah-counter" element={<AhCounter />} />
          <Route path="/gramatical" element={<Gramatical />} />
          <Route path="/evaluador" element={<EvaluadorGeneral />} />
          <Route path="/personalizado" element={<DatosPersonalizados />} />
          <Route path="/evaluaciones" element={<EvaluacionesContexto />} />
          <Route path="/eval-discurso" element={<EvaluacionDiscurso />} />
          <Route path="/imprimir" element={<ImprimirReporte />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  )
}

