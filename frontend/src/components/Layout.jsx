import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Globe, Inbox, LogOut, MapPin, Settings, Users } from 'lucide-react'
import { DEMO, api, sair } from '../api'

const ABAS = [
  { to: '/prospectar', label: 'Prospectar na Paraíba', icone: MapPin },
  { to: '/exterior', label: 'Outras regiões', icone: Globe },
  { to: '/leads', label: 'Leads', icone: Users },
  { to: '/respostas', label: 'Respostas', icone: Inbox },
  { to: '/config', label: 'Configurações', icone: Settings },
]

export default function Layout() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    api('/auth/eu').then(setUsuario).catch(() => {})
  }, [])

  return (
    <div className="painel">
      <aside className="lateral">
        <div className="marca">
          <span className="marca-simbolo" aria-hidden="true" />
          Prospecta
        </div>
        <nav className="menu">
          {ABAS.map(({ to, label, icone: Icone }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'item ativo' : 'item')}>
              <Icone size={17} strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        {usuario && (
          <div className="conta">
            <div className="avatar">{usuario.nome.slice(0, 1).toUpperCase()}</div>
            <div className="conta-nome">
              <strong>{usuario.nome}</strong>
              <span>{usuario.empresa || usuario.email}</span>
            </div>
            <button className="icone-btn" onClick={sair} title="Sair" aria-label="Sair">
              <LogOut size={16} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </aside>

      <div className="area">
        {DEMO && (
          <div className="faixa-info">
            Demonstração com empresas de exemplo. No sistema real, os dados vêm do Google Maps.
          </div>
        )}
        {usuario && !usuario.whatsapp && (
          <div className="faixa-alerta">
            Cadastre seu WhatsApp em <NavLink to="/config">Configurações</NavLink>. É para ele que os clientes
            mandam mensagem depois do questionário.
          </div>
        )}
        <main className="conteudo">
          {usuario ? <Outlet context={{ usuario, setUsuario }} /> : <p className="muted">Carregando</p>}
        </main>
      </div>
    </div>
  )
}
