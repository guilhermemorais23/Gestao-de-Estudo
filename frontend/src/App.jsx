import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getToken } from './api'
import Layout from './components/Layout'
import Login from './pages/Login'
import Prospectar from './pages/Prospectar'
import Leads from './pages/Leads'
import Respostas from './pages/Respostas'
import Config from './pages/Config'
import Questionario from './pages/Questionario'
import LandingPreview from './pages/LandingPreview'

function Privado({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Páginas públicas que o cliente abre */}
        <Route path="/q/:token" element={<Questionario />} />
        <Route path="/lp/:token" element={<LandingPreview />} />

        {/* Painel (precisa de login) */}
        <Route element={<Privado><Layout /></Privado>}>
          <Route path="/" element={<Navigate to="/prospectar" replace />} />
          <Route path="/prospectar" element={<Prospectar regiao="pb" />} />
          <Route path="/exterior" element={<Prospectar regiao="exterior" />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/respostas" element={<Respostas />} />
          <Route path="/config" element={<Config />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
