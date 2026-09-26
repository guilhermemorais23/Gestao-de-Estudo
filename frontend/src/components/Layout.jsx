import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ChartNoAxesColumn, Globe, Inbox, LogOut, MapPin, Settings, Users } from 'lucide-react'
import { DEMO, api, sair } from '../api'

const GRUPOS = [
  {
    nome: 'Encontrar',
    itens: [
      { to: '/prospectar', label: 'Prospectar na Paraíba', icone: MapPin },
      { to: '/exterior', label: 'Outras regiões', icone: Globe },
    ],
  },
  {
    nome: 'Vender',
    itens: [
      { to: '/leads', label: 'Leads', icone: Users, contador: '_pendentes' },
      { to: '/respostas', label: 'Respostas', icone: Inbox },
      { to: '/resultados', label: 'Resultados', icone: ChartNoAxesColumn },
    ],
  },
  {
    nome: 'Ajustes',
    itens: [{ to: '/config', label: 'Configurações', icone: Settings }],
  },
]

function MetaDoMes({ fechados, meta }) {
  const pct = Math.min(100, Math.round((fechados / meta) * 100))
  const falta = Math.max(0, meta - fechados)
  const mes = new Date().toLocaleDateString('pt-BR', { month: 'long' })
  return (
    <div className="meta-mes">
      <div className="meta-topo">
        <span>Meta de {mes}</span>
        <b>{fechados}<small>/{meta}</small></b>
      </div>
      <div className="meta-barra" role="progressbar" aria-valuenow={fechados} aria-valuemax={meta}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <p>{falta === 0 ? 'Meta batida. Parabéns!' : `Faltam ${falta} ${falta === 1 ? 'cliente' : 'clientes'}.`}</p>
    </div>
  )
}

export default function Layout() {
  const [usuario, setUsuario] = useState(null)
  const [resumo, setResumo] = useState({})
  const local = useLocation()

  useEffect(() => {
    api('/auth/eu').then(setUsuario).catch(() => {})
  }, [])

  useEffect(() => {
    api('/leads/resumo').then(setResumo).catch(() => {})
  }, [local.pathname])

  return (
    <div className="painel">
      <aside className="lateral">
        <div className="marca">
          <span className="marca-simbolo" aria-hidden="true" />
          Prospecta
        </div>
        <nav className="menu">
          {GRUPOS.map((g) => (
            <div key={g.nome} className="menu-grupo">
              <span className="menu-titulo">{g.nome}</span>
              {g.itens.map(({ to, label, icone: Icone, contador }) => (
                <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'item ativo' : 'item')}>
                  <Icone size={17} strokeWidth={1.75} />
                  <span>{label}</span>
                  {contador && resumo[contador] > 0 && (
                    <em className="contador" title="Esperando retorno">{resumo[contador]}</em>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        {usuario && <MetaDoMes fechados={resumo._fechados_mes || 0} meta={usuario.meta_mensal || 4} />}
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
            Você está vendo uma demonstração com empresas de exemplo. No sistema real, os dados vêm do Google Maps.
          </div>
        )}
        {usuario && !usuario.whatsapp && (
          <div className="faixa-alerta">
            Cadastre seu WhatsApp em <NavLink to="/config">Configurações</NavLink>. É para ele que os clientes
            mandam mensagem depois do questionário.
          </div>
        )}
        <main className="conteudo" key={local.pathname}>
          {usuario ? <Outlet context={{ usuario, setUsuario }} /> : <p className="muted">Carregando</p>}
        </main>
      </div>
    </div>
  )
}
