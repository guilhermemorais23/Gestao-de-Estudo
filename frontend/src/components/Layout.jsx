import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { api, sair } from '../api'

const ABAS = [
  { to: '/prospectar', label: '📍 Prospectar PB' },
  { to: '/exterior', label: '🌎 Outras regiões / exterior' },
  { to: '/leads', label: '📋 Meus leads' },
  { to: '/respostas', label: '📝 Respostas' },
  { to: '/config', label: '⚙️ Configurações' },
]

export default function Layout() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    api('/auth/eu').then(setUsuario).catch(() => {})
  }, [])

  return (
    <div className="painel">
      <header className="topo">
        <strong className="marca">🔎 Prospecta PB</strong>
        <nav className="abas">
          {ABAS.map((a) => (
            <NavLink key={a.to} to={a.to} className={({ isActive }) => (isActive ? 'aba ativa' : 'aba')}>
              {a.label}
            </NavLink>
          ))}
        </nav>
        <div className="usuario">
          {usuario && <span>{usuario.nome}</span>}
          <button className="btn-link" onClick={sair}>Sair</button>
        </div>
      </header>
      {usuario && !usuario.whatsapp && (
        <div className="aviso">
          Configure seu WhatsApp em <NavLink to="/config">Configurações</NavLink> — é para ele que os clientes
          vão mandar mensagem depois de responder o questionário.
        </div>
      )}
      <main className="conteudo">
        {usuario ? <Outlet context={{ usuario, setUsuario }} /> : <p>Carregando…</p>}
      </main>
    </div>
  )
}
