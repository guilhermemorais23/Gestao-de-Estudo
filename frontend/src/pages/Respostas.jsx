import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { DEMO, api, linkWhatsapp, urlPublica } from '../api'
import { PERGUNTAS } from '../perguntas'

export default function Respostas() {
  const { usuario } = useOutletContext()
  const [lista, setLista] = useState([])
  const [aberto, setAberto] = useState(null)

  useEffect(() => {
    api('/briefings').then(setLista)
  }, [])

  async function abrir(b) {
    setAberto(aberto === b.id ? null : b.id)
    if (!b.lido) {
      await api(`/briefings/${b.id}/lido`, { method: 'POST' })
      setLista((l) => l.map((x) => (x.id === b.id ? { ...x, lido: true } : x)))
    }
  }

  return (
    <section>
      <header className="cabecalho">
        <h1>Respostas</h1>
        <p>Cada questionário respondido vira uma prévia de site. Mande o link para o cliente e combine a proposta.</p>
      </header>
      {!lista.length && <p className="vazio">Ninguém respondeu ainda. Envie o link do questionário pelo WhatsApp.</p>}
      {lista.map((b) => {
        const lp = urlPublica(`/lp/${b.token}`)
        const msg = `Oi ${b.contato_nome}! Aqui é ${usuario.nome}. Fiz uma prévia do site da ${b.empresa}, dá uma olhada: ${lp}`
        return (
          <div key={b.id} className={`resposta ${b.lido ? '' : 'nao-lida'} ${aberto === b.id ? 'aberta' : ''}`}>
            <button className="resposta-topo" onClick={() => abrir(b)} aria-expanded={aberto === b.id}>
              <span>
                <strong>{b.empresa}</strong>
                {!b.lido && <span className="novo">Nova</span>}
                <span className="sub">
                  {b.contato_nome}, {new Date(b.criado_em + 'Z').toLocaleDateString('pt-BR')}. Objetivo: {b.respostas.objetivo}
                </span>
              </span>
              <span className="resposta-valor">{b.respostas.investimento}</span>
              <ChevronDown size={18} className="seta" />
            </button>
            {aberto === b.id && (
              <>
                <dl className="respostas">
                  {PERGUNTAS.filter((p) => b.respostas[p.id]).map((p) => (
                    <div key={p.id}>
                      <dt>{p.pt}</dt>
                      <dd>{[].concat(b.respostas[p.id]).join(', ')}</dd>
                    </div>
                  ))}
                </dl>
                <div className="acoes">
                  {DEMO ? (
                    <Link className="btn" to={`/lp/${b.token}`}>Ver prévia da landing page</Link>
                  ) : (
                    <a className="btn" href={lp} target="_blank" rel="noreferrer">Ver prévia da landing page</a>
                  )}
                  {b.contato_whatsapp && (
                    <a className="btn btn-secundario" href={linkWhatsapp(b.contato_whatsapp, msg)} target="_blank" rel="noreferrer">
                      Mandar prévia no WhatsApp
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        )
      })}
    </section>
  )
}
