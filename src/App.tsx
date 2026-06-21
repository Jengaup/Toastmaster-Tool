import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import { Layout } from './components/Layout'
import Temporizador from './views/Temporizador'
import ReporteTemporizador from './views/ReporteTemporizador'
import AhCounter from './views/AhCounter'
import Gramatical from './views/Gramatical'
import EvaluadorGeneral from './views/EvaluadorGeneral'
import DatosPersonalizados from './views/DatosPersonalizados'

export default function App() {
  return (
    <LanguageProvider>
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
          </Routes>
        </Layout>
      </HashRouter>
    </LanguageProvider>
  )
}
