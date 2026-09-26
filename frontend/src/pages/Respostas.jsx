import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { DEMO, api, linkWhatsapp, urlPublica } from '../api'
import { PERGUNTAS } from '../perguntas'
import EditorTextos from '../components/EditorTextos'
import { IconeWhatsapp } from '../components/Icones'

export default function Respostas() {
  const { usuario } = useOutletContext()
  const [lista, setLista] = useState([])
  const [aberto, setAberto] = useState(null)
  const [ia, setIa] = useState(null)

  useEffect(() => {
    api('/briefings').then((l) => {
      setLista(l)
      if (l.length) setAberto(l[0].id)
    })
    api('/briefings/ia').then(setIa).catch(() => {})
  }, [])

  async function abrir(b) {
    setAberto(aberto === b.id ? null : b.id)
    if (!b.lido) {
      await api(`/briefings/${b.id}/lido`, { method: 'POST' })
      setLista((l) => l.map((x) => (x.id === b.id ? { ...x, lido: true } : x)))
    }
  }

  const atualizar = (novo) => setLista((l) => l.map((x) => (x.id === novo.id ? novo : x)))
  const naoLidas = lista.filter((b) => !b.lido).length

  return (
    <section>
      <header className="cabecalho linha">
        <div>
          <h1>Respostas</h1>
          <p>Cada questionário respondido vira uma prévia de site. Revise os textos, mande o link e combine a proposta.</p>
        </div>
        {lista.length > 0 && (
          <p className="cabecalho-numero"><b>{lista.length}</b> {lista.length === 1 ? 'resposta' : 'respostas'}{naoLidas ? `, ${naoLidas} nova${naoLidas > 1 ? 's' : ''}` : ''}</p>
        )}
      </header>
      {!lista.length && <p className="vazio">Ninguém respondeu ainda. Quando alguém responder o questionário, aparece aqui.</p>}
      <div className="respostas-lista">
        {lista.map((b) => {
          const lp = urlPublica(`/lp/${b.token}`)
          const msg = `Oi ${b.contato_nome}! Aqui é ${usuario.nome}. Fiz uma prévia do site da ${b.empresa}, dá uma olhada: ${lp}`
          const estaAberto = aberto === b.id
          return (
            <article key={b.id} className={`resposta ${b.lido ? '' : 'nao-lida'} ${estaAberto ? 'aberta' : ''}`}>
              <button className="resposta-topo" onClick={() => abrir(b)} aria-expanded={estaAberto}>
                <span className="monograma">{b.empresa.slice(0, 1).toUpperCase()}</span>
                <span className="resposta-titulo">
                  <strong>{b.empresa}</strong>
                  {!b.lido && <span className="novo">Nova</span>}
                  <span className="sub">
                    {b.contato_nome}, {new Date(b.criado_em + 'Z').toLocaleDateString('pt-BR')}. {b.respostas.objetivo}
                  </span>
                </span>
                <span className="resposta-valor">{b.respostas.investimento}</span>
                <ChevronDown size={18} className="seta" />
              </button>
              {estaAberto && (
                <div className="resposta-corpo">
                  <dl className="respostas">
                    {PERGUNTAS.filter((p) => b.respostas[p.id] && !['empresa', 'contato_nome'].includes(p.id)).map((p) => (
                      <div key={p.id}>
                        <dt>{p.pt}</dt>
                        <dd>{[].concat(b.respostas[p.id]).join(', ')}</dd>
                      </div>
                    ))}
                  </dl>
                  <EditorTextos key={b.id} briefing={b} ia={ia} onAtualizado={atualizar} />
                  <div className="acoes">
                    {DEMO ? (
                      <Link className="btn" to={`/lp/${b.token}`}><ExternalLink size={16} /> Ver prévia do site</Link>
                    ) : (
                      <a className="btn" href={lp} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Ver prévia do site</a>
                    )}
                    {b.contato_whatsapp && (
                      <a className="btn btn-secundario" href={linkWhatsapp(b.contato_whatsapp, msg)} target="_blank" rel="noreferrer">
                        <IconeWhatsapp size={16} /> Mandar prévia no WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
