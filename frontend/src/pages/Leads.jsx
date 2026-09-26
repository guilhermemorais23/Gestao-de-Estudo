import { useEffect, useState } from 'react'
import { api } from '../api'
import { Clock, Plus, Search } from 'lucide-react'
import TabelaLeads, { STATUS } from '../components/TabelaLeads'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [resumo, setResumo] = useState({})
  const [filtro, setFiltro] = useState({ status: '', regiao: '', q: '', pendentes: '' })
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
      <header className="cabecalho linha">
        <div>
          <h1>Leads</h1>
          <p>Acompanhe cada empresa da primeira mensagem até o fechamento.</p>
        </div>
        <button className="btn btn-secundario" onClick={() => setNovo({ nome: '', telefone: '', cidade: '', categoria: '' })}>
          <Plus size={16} /> Adicionar lead
        </button>
      </header>

      <div className="funil">
        {Object.entries(STATUS).map(([v, t]) => (
          <button
            key={v}
            className={filtro.status === v ? 'etapa ativa' : 'etapa'}
            onClick={() => setFiltro({ ...filtro, pendentes: '', status: filtro.status === v ? '' : v })}
          >
            <span>{t}</span>
            <b>{resumo[v] || 0}</b>
          </button>
        ))}
      </div>

      {resumo._pendentes > 0 && (
        <button
          className={filtro.pendentes ? 'lembrete ativo' : 'lembrete'}
          onClick={() => setFiltro({ ...filtro, pendentes: filtro.pendentes ? '' : 'true', status: '' })}
        >
          <Clock size={16} />
          <span>
            <b>{resumo._pendentes} {resumo._pendentes === 1 ? 'lead espera' : 'leads esperam'} retorno hoje.</b>{' '}
            Mandaram a mensagem anterior há alguns dias e ninguém respondeu.
          </span>
          <span className="lembrete-acao">{filtro.pendentes ? 'Mostrar todos' : 'Ver quais'}</span>
        </button>
      )}

      {novo && (
        <form className="busca" onSubmit={salvarNovo}>
          <label className="cresce">Nome<input required value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></label>
          <label>Telefone<input value={novo.telefone} onChange={(e) => setNovo({ ...novo, telefone: e.target.value })} /></label>
          <label>Cidade<input value={novo.cidade} onChange={(e) => setNovo({ ...novo, cidade: e.target.value })} /></label>
          <label>Categoria<input value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} /></label>
          <button className="btn">Salvar</button>
          <button type="button" className="btn-texto" onClick={() => setNovo(null)}>Cancelar</button>
        </form>
      )}

      <div className="filtros linha">
        <div className="campo-busca cresce">
          <Search size={16} />
          <input aria-label="Buscar" placeholder="Buscar por nome, categoria ou bairro" value={filtro.q} onChange={set('q')} />
        </div>
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
