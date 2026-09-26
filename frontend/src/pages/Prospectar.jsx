import { useState } from 'react'
import { api } from '../api'
import TabelaLeads from '../components/TabelaLeads'

const CIDADES_PB = [
  'João Pessoa - PB', 'Cabedelo - PB', 'Bayeux - PB', 'Santa Rita - PB', 'Conde - PB',
  'Campina Grande - PB', 'Patos - PB', 'Sousa - PB', 'Cajazeiras - PB', 'Guarabira - PB',
]
const SUGESTOES_PT = [
  'barbearia', 'salão de beleza', 'clínica de estética', 'dentista', 'academia', 'pet shop',
  'restaurante', 'hamburgueria', 'pizzaria', 'oficina mecânica', 'advogado', 'contabilidade',
  'imobiliária', 'loja de roupas', 'pousada', 'personal trainer',
]
const SUGESTOES_EXT = ['barber shop', 'hair salon', 'dentist', 'restaurant', 'peluquería', 'restaurante', 'plumber', 'cleaning services']

export default function Prospectar({ regiao }) {
  const exterior = regiao === 'exterior'
  const [form, setForm] = useState({
    termo: '',
    cidade: exterior ? '' : CIDADES_PB[0],
    fonte: 'google',
    idioma: exterior ? 'en' : 'pt',
    paginas: 1,
    incluir_so_rede_social: true,
  })
  const [resultado, setResultado] = useState(null)
  const [leads, setLeads] = useState([])
  const [erro, setErro] = useState('')
  const [buscando, setBuscando] = useState(false)

  const set = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function buscar(e) {
    e.preventDefault()
    setErro('')
    setBuscando(true)
    try {
      const r = await api('/leads/buscar', {
        method: 'POST',
        body: { ...form, paginas: Number(form.paginas), regiao },
      })
      setResultado(r)
      setLeads(r.leads)
    } catch (err) {
      setErro(err.message)
    } finally {
      setBuscando(false)
    }
  }

  return (
    <section>
      <h1>{exterior ? '🌎 Outras regiões e exterior' : '📍 Prospectar na Paraíba'}</h1>
      <p className="muted">
        {exterior
          ? 'Busque em qualquer cidade do Brasil ou de outro país. A mensagem vai no idioma escolhido.'
          : 'Busca empresas no Google Maps e mostra só as que não têm site (ou têm só Instagram/Facebook).'}
      </p>

      <form className="card filtros" onSubmit={buscar}>
        <label className="cresce">
          O que procurar
          <input value={form.termo} onChange={set('termo')} placeholder="ex: barbearia" required minLength={2} />
        </label>
        <label className="cresce">
          Cidade
          {exterior ? (
            <input value={form.cidade} onChange={set('cidade')} placeholder="ex: Lisboa, Portugal" required />
          ) : (
            <input list="cidades-pb" value={form.cidade} onChange={set('cidade')} required />
          )}
          <datalist id="cidades-pb">{CIDADES_PB.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        {exterior && (
          <label>
            Idioma da mensagem
            <select value={form.idioma} onChange={set('idioma')}>
              <option value="en">Inglês</option>
              <option value="es">Espanhol</option>
              <option value="pt">Português</option>
            </select>
          </label>
        )}
        <label>
          Fonte
          <select value={form.fonte} onChange={set('fonte')}>
            <option value="google">Google Maps</option>
            <option value="osm">OpenStreetMap (grátis)</option>
          </select>
        </label>
        {form.fonte === 'google' && (
          <label>
            Resultados
            <select value={form.paginas} onChange={set('paginas')}>
              <option value={1}>até 20</option>
              <option value={2}>até 40</option>
              <option value={3}>até 60</option>
            </select>
          </label>
        )}
        <label className="check">
          <input type="checkbox" checked={form.incluir_so_rede_social} onChange={set('incluir_so_rede_social')} />
          Incluir quem só tem Instagram/Facebook
        </label>
        <button className="btn" disabled={buscando}>{buscando ? 'Buscando…' : 'Buscar'}</button>
      </form>

      <div className="chips">
        {(exterior ? SUGESTOES_EXT : SUGESTOES_PT).map((s) => (
          <button key={s} className="chip" onClick={() => setForm({ ...form, termo: s })}>{s}</button>
        ))}
      </div>

      {erro && <p className="erro">{erro}</p>}
      {resultado && (
        <p className="resumo">
          Encontradas <b>{resultado.total_encontrado}</b> empresas · <b>{resultado.sem_site}</b> sem site ·{' '}
          <b>{resultado.novos}</b> novas salvas em "Meus leads".
        </p>
      )}
      {resultado && <TabelaLeads leads={leads} setLeads={setLeads} mostrarGestao={false} />}
    </section>
  )
}
