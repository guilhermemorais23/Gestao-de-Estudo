import { useEffect, useState } from 'react'
import { api } from '../api'
import TabelaLeads, { STATUS } from '../components/TabelaLeads'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [resumo, setResumo] = useState({})
  const [filtro, setFiltro] = useState({ status: '', regiao: '', q: '' })
  const [novo, setNovo] = useState(null)

  async function carregar() {
    const params = new URLSearchParams(Object.entries(filtro).filter(([, v]) => v))
    setLeads(await api(`/leads?${params}`))
    setResumo(await api('/leads/resumo'))
  }

  useEffect(() => {
    const t = setTimeout(carregar, 250)
    return () => clearTimeout(t)
  }, [filtro]) // eslint-disable-line react-hooks/exhaustive-deps

  async function salvarNovo(e) {
    e.preventDefault()
    await api('/leads', { method: 'POST', body: novo })
    setNovo(null)
    carregar()
  }

  const set = (campo) => (e) => setFiltro({ ...filtro, [campo]: e.target.value })

  return (
    <section>
      <div className="titulo-linha">
        <h1>📋 Meus leads</h1>
        <button className="btn claro" onClick={() => setNovo({ nome: '', telefone: '', cidade: '', categoria: '' })}>
          + Adicionar manualmente
        </button>
      </div>

      <div className="funil">
        {Object.entries(STATUS).map(([v, t]) => (
          <button
            key={v}
            className={filtro.status === v ? 'etapa ativa' : 'etapa'}
            onClick={() => setFiltro({ ...filtro, status: filtro.status === v ? '' : v })}
          >
            <b>{resumo[v] || 0}</b>
            <span>{t}</span>
          </button>
        ))}
      </div>

      {novo && (
        <form className="card filtros" onSubmit={salvarNovo}>
          <label className="cresce">Nome<input required value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></label>
          <label>Telefone<input value={novo.telefone} onChange={(e) => setNovo({ ...novo, telefone: e.target.value })} /></label>
          <label>Cidade<input value={novo.cidade} onChange={(e) => setNovo({ ...novo, cidade: e.target.value })} /></label>
          <label>Categoria<input value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} /></label>
          <button className="btn">Salvar</button>
          <button type="button" className="btn-link" onClick={() => setNovo(null)}>cancelar</button>
        </form>
      )}

      <div className="filtros linha">
        <input className="cresce" placeholder="Buscar por nome, categoria, bairro…" value={filtro.q} onChange={set('q')} />
        <select value={filtro.regiao} onChange={set('regiao')}>
          <option value="">Todas as regiões</option>
          <option value="pb">Paraíba</option>
          <option value="exterior">Outras / exterior</option>
        </select>
      </div>

      <TabelaLeads leads={leads} setLeads={setLeads} />
    </section>
  )
}
