import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
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
      <h1>📝 Respostas dos clientes</h1>
      <p className="muted">
        Cada resposta gera uma prévia de landing page automática — mande o link para o cliente e feche a venda.
      </p>
      {!lista.length && <p className="muted">Ninguém respondeu ainda. Envie o link do questionário pelo WhatsApp.</p>}
      {lista.map((b) => {
        const lp = urlPublica(`/lp/${b.token}`)
        const msg = `Oi ${b.contato_nome}! Aqui é ${usuario.nome}. Fiz uma prévia do site da ${b.empresa}, dá uma olhada: ${lp}`
        return (
          <div key={b.id} className={`card resposta ${b.lido ? '' : 'nao-lida'}`}>
            <div className="titulo-linha" onClick={() => abrir(b)} role="button">
              <div>
                <strong>{b.empresa}</strong> — {b.contato_nome}
                <div className="muted pequeno">
                  {new Date(b.criado_em + 'Z').toLocaleString('pt-BR')} · {b.respostas.objetivo} · {b.respostas.investimento}
                </div>
              </div>
              <span>{aberto === b.id ? '▲' : '▼'}</span>
            </div>
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
                    <a className="btn verde" href={linkWhatsapp(b.contato_whatsapp, msg)} target="_blank" rel="noreferrer">
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
