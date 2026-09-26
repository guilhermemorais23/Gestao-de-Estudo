import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DEMO, getToken } from './api'
import Layout from './components/Layout'
import Login from './pages/Login'
import Prospectar from './pages/Prospectar'
import Leads from './pages/Leads'
import Respostas from './pages/Respostas'
import Resultados from './pages/Resultados'
import Config from './pages/Config'
import Questionario from './pages/Questionario'
import Previa from './pages/Previa'
import Proposta from './pages/Proposta'

// Na demonstração (página única, sem servidor) as rotas ficam depois do #
const Router = DEMO ? HashRouter : BrowserRouter

function Privado({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Páginas públicas que o cliente abre */}
        <Route path="/q/:token" element={<Questionario />} />
        <Route path="/p/:token" element={<Previa />} />
        <Route path="/lp/:token" element={<Previa />} />
        <Route path="/proposta/:token" element={<Proposta />} />

        {/* Painel (precisa de login) */}
        <Route element={<Privado><Layout /></Privado>}>
          <Route path="/" element={<Navigate to="/prospectar" replace />} />
          <Route path="/prospectar" element={<Prospectar regiao="pb" />} />
          <Route path="/exterior" element={<Prospectar regiao="exterior" />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/respostas" element={<Respostas />} />
          <Route path="/resultados" element={<Resultados />} />
          <Route path="/config" element={<Config />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
