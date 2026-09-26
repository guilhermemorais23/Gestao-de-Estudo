import { useEffect, useState } from 'react'
import { api } from '../api'
import { Clock, Eye, FileText, Plus, Search, ShoppingBag } from 'lucide-react'
import { haQuanto } from '../mensagens'
import TabelaLeads, { STATUS } from '../components/TabelaLeads'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [resumo, setResumo] = useState({})
  const [filtro, setFiltro] = useState({ status: '', regiao: '', q: '', pendentes: '' })
  const [novo, setNovo] = useState(null)
  const [atividade, setAtividade] = useState([])

  useEffect(() => {
    api('/leads/atividade').then(setAtividade).catch(() => {})
  }, [])

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
        <p className="cabecalho-numero">
          <b>{Object.entries(resumo).filter(([k]) => !k.startsWith('_')).reduce((s, [, v]) => s + v, 0)}</b> empresas na lista
        </p>
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

      {atividade.length > 0 && (
        <div className="atividade">
          <h2>Atividade dos clientes</h2>
          <ul>
            {atividade.slice(0, 5).map((e, i) => {
              const Icone = { previa: Eye, proposta: FileText, escolha: ShoppingBag }[e.tipo]
              const texto = {
                previa: `abriu a prévia${e.detalhe > 1 ? ` (${e.detalhe} vezes)` : ''}`,
                proposta: 'abriu a proposta',
                escolha: 'escolheu um pacote na proposta',
              }[e.tipo]
              return (
                <li key={i}>
                  <Icone size={16} />
                  <button className="atividade-nome" onClick={() => setFiltro({ ...filtro, q: e.lead.nome, status: '', pendentes: '' })}>{e.lead.nome}</button>
                  <span>{texto}</span>
                  <time>{haQuanto(e.quando)}</time>
                </li>
              )
            })}
          </ul>
          <p className="muted pequeno">Mande mensagem logo depois que o cliente abre a prévia: é quando ele está pensando no assunto.</p>
        </div>
      )}

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
