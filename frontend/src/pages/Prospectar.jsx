import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { api } from '../api'
import TabelaLeads from '../components/TabelaLeads'

// Maiores cidades da Paraíba, começando pela Grande João Pessoa
const CIDADES_PB = [
  'João Pessoa - PB', 'Cabedelo - PB', 'Bayeux - PB', 'Santa Rita - PB', 'Conde - PB', 'Lucena - PB',
  'Campina Grande - PB', 'Patos - PB', 'Sousa - PB', 'Cajazeiras - PB', 'Guarabira - PB', 'Sapé - PB',
  'Queimadas - PB', 'Mamanguape - PB', 'Esperança - PB', 'Monteiro - PB', 'Pombal - PB', 'São Bento - PB',
  'Catolé do Rocha - PB', 'Itabaiana - PB', 'Pedras de Fogo - PB', 'Alhandra - PB', 'Rio Tinto - PB',
  'Bananeiras - PB', 'Areia - PB', 'Solânea - PB', 'Picuí - PB', 'Princesa Isabel - PB', 'Itaporanga - PB',
  'Lagoa Seca - PB', 'Alagoa Grande - PB', 'Caaporã - PB',
]
const BAIRROS_JP = [
  'Manaíra', 'Tambaú', 'Cabo Branco', 'Bessa', 'Aeroclube', 'Jardim Oceania', 'Altiplano', 'Bancários',
  'Mangabeira', 'Valentina', 'Cristo Redentor', 'Torre', 'Tambauzinho', 'Expedicionários', 'Centro',
  'Jaguaribe', 'Cruz das Armas', 'Oitizeiro', 'José Américo', 'Água Fria', 'Castelo Branco', 'Bairro dos Estados',
]
const SUGESTOES_PT = {
  Beleza: ['barbearia', 'salão de beleza', 'clínica de estética', 'manicure', 'estúdio de sobrancelha'],
  Saúde: ['dentista', 'fisioterapia', 'psicólogo', 'nutricionista', 'academia', 'personal trainer'],
  Comida: ['restaurante', 'hamburgueria', 'pizzaria', 'açaí', 'confeitaria', 'marmitaria'],
  Serviços: ['oficina mecânica', 'pet shop', 'advogado', 'contabilidade', 'imobiliária', 'lava jato'],
}
const SUGESTOES_EXT = {
  Inglês: ['barber shop', 'hair salon', 'dentist', 'plumber', 'cleaning services'],
  Espanhol: ['peluquería', 'restaurante', 'dentista', 'taller mecánico'],
}

export default function Prospectar({ regiao }) {
  const exterior = regiao === 'exterior'
  const [form, setForm] = useState({
    termo: '',
    cidade: exterior ? '' : CIDADES_PB[0],
    bairro: '',
    fonte: 'google',
    idioma: exterior ? 'en' : 'pt',
    paginas: 1,
    incluir_so_rede_social: true,
  })
  const [opcoes, setOpcoes] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [leads, setLeads] = useState([])
  const [erro, setErro] = useState('')
  const [buscando, setBuscando] = useState(false)

  const set = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const temBairro = !exterior && form.cidade.startsWith('João Pessoa') && form.fonte === 'google'

  async function buscar(e) {
    e?.preventDefault()
    setErro('')
    setBuscando(true)
    try {
      const cidade = temBairro && form.bairro ? `${form.bairro}, ${form.cidade}` : form.cidade
      const { bairro, ...resto } = form // eslint-disable-line no-unused-vars
      const r = await api('/leads/buscar', {
        method: 'POST',
        body: { ...resto, cidade, paginas: Number(form.paginas), regiao },
      })
      setResultado(r)
      setLeads(r.leads)
    } catch (err) {
      setErro(err.message)
    } finally {
      setBuscando(false)
    }
  }

  const sugestoes = exterior ? SUGESTOES_EXT : SUGESTOES_PT

  return (
    <section>
      <header className="cabecalho">
        <h1>{exterior ? 'Outras regiões' : 'Prospectar'}</h1>
        <p>
          {exterior
            ? 'Qualquer cidade do Brasil ou de outro país. A mensagem de abordagem sai no idioma que você escolher.'
            : 'Encontre no Google Maps os negócios da Paraíba que ainda não têm site. Comece por João Pessoa e expanda para as outras cidades.'}
        </p>
      </header>

      <form className="busca-hero" onSubmit={buscar}>
        <div className="busca-linha">
          <label className="busca-campo termo">
            <span>O que</span>
            <input value={form.termo} onChange={set('termo')} placeholder="barbearia, dentista, pizzaria" required minLength={2} />
          </label>
          <label className="busca-campo">
            <span>Onde</span>
            {exterior ? (
              <input value={form.cidade} onChange={set('cidade')} placeholder="Lisboa, Portugal" required />
            ) : (
              <input list="cidades-pb" value={form.cidade} onChange={set('cidade')} placeholder="Digite ou escolha a cidade" required />
            )}
            <datalist id="cidades-pb">{CIDADES_PB.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          {temBairro && (
            <label className="busca-campo bairro">
              <span>Bairro</span>
              <input list="bairros-jp" value={form.bairro} onChange={set('bairro')} placeholder="Todos" />
              <datalist id="bairros-jp">{BAIRROS_JP.map((b) => <option key={b} value={b} />)}</datalist>
            </label>
          )}
          <button className="btn busca-botao" disabled={buscando}>
            <Search size={18} /> {buscando ? 'Buscando' : 'Buscar'}
          </button>
        </div>

        <div className="busca-rodape">
          <button type="button" className="btn-texto" onClick={() => setOpcoes(!opcoes)} aria-expanded={opcoes}>
            <SlidersHorizontal size={15} /> Opções
          </button>
          {!opcoes && (
            <span className="muted">
              {form.fonte === 'google' ? 'Google Maps' : 'OpenStreetMap'}, até {form.paginas * 20} resultados
              {form.incluir_so_rede_social ? ', inclui quem só tem rede social' : ''}
            </span>
          )}
          {opcoes && (
            <div className="busca-opcoes">
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
                  Quantidade
                  <select value={form.paginas} onChange={set('paginas')}>
                    <option value={1}>até 20</option>
                    <option value={2}>até 40</option>
                    <option value={3}>até 60</option>
                  </select>
                </label>
              )}
              <label className="check">
                <input type="checkbox" checked={form.incluir_so_rede_social} onChange={set('incluir_so_rede_social')} />
                Incluir quem só tem rede social
              </label>
            </div>
          )}
        </div>
      </form>

      {erro && <p className="erro">{erro}</p>}

      {!resultado && (
        <div className="ideias">
          {Object.entries(sugestoes).map(([grupo, itens]) => (
            <div key={grupo} className="ideias-grupo">
              <h3>{grupo}</h3>
              <div className="ideias-lista">
                {itens.map((s) => (
                  <button key={s} type="button" className={form.termo === s ? 'chip ativo' : 'chip'} onClick={() => setForm({ ...form, termo: s })}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!exterior && (
            <div className="dica">
              <p>Cada busca traz no máximo 60 empresas. Para achar mais, repita o mesmo segmento trocando o bairro ou a cidade.</p>
              <div className="ideias-lista">
                <span className="muted">Outras cidades:</span>
                {CIDADES_PB.slice(1, 13).map((c) => (
                  <button key={c} type="button" className={form.cidade === c ? 'chip ativo' : 'chip'} onClick={() => setForm({ ...form, cidade: c, bairro: '' })}>
                    {c.replace(' - PB', '')}
                  </button>
                ))}
              </div>
              <p>
                Nas mensagens, você diz que faz sites "aqui em João Pessoa" só para empresas de João Pessoa. Nas outras
                cidades, o texto diz que você é de João Pessoa e atende toda a Paraíba.
              </p>
            </div>
          )}
        </div>
      )}

      {resultado && (
        <>
          <div className="resultado-busca">
            <p>
              <b>{resultado.sem_site}</b> de {resultado.total_encontrado} empresas não têm site.{' '}
              <span className="muted">
                {resultado.novos > 0 ? `${resultado.novos} novas foram salvas em Leads.` : 'Todas já estavam em Leads.'}
              </span>
            </p>
            <button className="btn-texto" onClick={() => setResultado(null)}>Nova busca</button>
          </div>
          <TabelaLeads leads={leads} setLeads={setLeads} mostrarGestao={false} />
        </>
      )}
    </section>
  )
}
