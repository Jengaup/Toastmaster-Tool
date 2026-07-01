import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import { MeetingClockProvider } from './contexts/MeetingClockContext'
import { Layout } from './components/Layout'
import { PinLock } from './components/PinLock'
import { hasPinEnabled, isSessionUnlocked } from './utils/pin'
import { useLanguage } from './contexts/LanguageContext'
import Temporizador from './views/Temporizador'
import ReporteTemporizador from './views/ReporteTemporizador'
import AhCounter from './views/AhCounter'
import Gramatical from './views/Gramatical'
import EvaluadorGeneral from './views/EvaluadorGeneral'
import DatosPersonalizados from './views/DatosPersonalizados'
import ImprimirReporte from './views/ImprimirReporte'
import EvaluacionesContexto from './views/EvaluacionesContexto'
import EvaluacionDiscurso from './views/EvaluacionDiscurso'
import Roles from './views/Roles'

function NotFound() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="text-6xl font-bold text-slate-200 mb-4">404</div>
      <h1 className="text-xl font-bold text-slate-700 mb-2">{t('notFound')}</h1>
      <p className="text-slate-400 text-sm mb-6">{t('notFoundSub')}</p>
      <Link to="/temporizador" className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
        {t('notFoundBack')}
      </Link>
    </div>
  )
}

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
          <Route path="/roles" element={<Roles />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <MeetingClockProvider>
        <AppInner />
      </MeetingClockProvider>
    </LanguageProvider>
  )
}

