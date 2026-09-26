import { Fragment, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { DEMO, api, linkWhatsapp, urlPublica } from '../api'
import { PERGUNTAS, SECOES, TEXTOS, resumoTexto } from '../perguntas'
import { IconeWhatsapp } from '../components/Icones'

const POR_ID = Object.fromEntries(PERGUNTAS.map((p) => [p.id, p]))

export default function Questionario() {
  const { token } = useParams()
  const [info, setInfo] = useState(null)
  const [erro, setErro] = useState('')
  const [respostas, setRespostas] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [final, setFinal] = useState(null)

  useEffect(() => {
    api(`/publico/q/${token}`)
      .then((d) => {
        setInfo(d)
        if (d.empresa_cliente) setRespostas({ empresa: d.empresa_cliente.replace(/\s*\((exemplo|example)\)$/i, '') })
      })
      .catch((e) => setErro(e.message))
  }, [token])

  if (erro && !info) return <div className="publico"><p className="erro">{erro}</p></div>
  if (!info) return <div className="publico"><p className="muted">Carregando</p></div>

  const idioma = info.idioma || 'pt'
  const t = TEXTOS[idioma]
  const obrigatorias = PERGUNTAS.filter((p) => p.obrigatoria)
  const respondidas = PERGUNTAS.filter((p) => [].concat(respostas[p.id] || []).join('').trim()).length
  const progresso = Math.round((respondidas / PERGUNTAS.length) * 100)
  const vendedor = info.empresa_vendedor || info.vendedor

  function set(id, valor) {
    setRespostas((r) => ({ ...r, [id]: valor }))
  }

  function alternar(id, opcao) {
    const atual = respostas[id] || []
    set(id, atual.includes(opcao) ? atual.filter((o) => o !== opcao) : [...atual, opcao])
  }

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    try {
      const r = await api(`/publico/q/${token}`, {
        method: 'POST',
        body: {
          empresa: respostas.empresa,
          contato_nome: respostas.contato_nome,
          contato_whatsapp: respostas.contato_whatsapp || '',
          respostas: { ...respostas, _idioma: idioma },
        },
      })
      const saudacao = { pt: 'Olá! Acabei de responder o questionário do site.', en: 'Hi! I just filled in the website form.', es: '¡Hola! Acabo de responder el formulario del sitio.' }[idioma]
      const msg = `${saudacao}\n\n${resumoTexto(respostas, idioma)}\n\n${urlPublica(`/p/${r.token}`)}`
      setFinal({ ...r, link: linkWhatsapp(r.whatsapp_vendedor, msg) })
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  function campo(p) {
    const id = `q-${p.id}`
    return (
      <fieldset key={p.id} className={`pergunta ${p.tipo}`}>
        <legend>
          {p[idioma]}
          {!p.obrigatoria && <span className="opcional">{{ pt: 'opcional', en: 'optional', es: 'opcional' }[idioma]}</span>}
        </legend>
        {p.tipo === 'texto' && (
          <input id={id} aria-label={p[idioma]} value={respostas[p.id] || ''} onChange={(e) => set(p.id, e.target.value)} required={p.obrigatoria} />
        )}
        {p.tipo === 'area' && (
          <textarea id={id} aria-label={p[idioma]} rows={4} value={respostas[p.id] || ''} onChange={(e) => set(p.id, e.target.value)} />
        )}
        {(p.tipo === 'unica' || p.tipo === 'multipla') && (
          <div className="opcoes">
            {p.opcoes[idioma].map((o) => (
              <label key={o} className="opcao">
                {p.tipo === 'unica' ? (
                  <input type="radio" name={p.id} checked={respostas[p.id] === o} onChange={() => set(p.id, o)} required={p.obrigatoria} />
                ) : (
                  <input type="checkbox" checked={(respostas[p.id] || []).includes(o)} onChange={() => alternar(p.id, o)} />
                )}
                <span>{o}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>
    )
  }

  if (final) {
    return (
      <div className="publico">
        {DEMO && <Link className="voltar-demo" to="/respostas">Ver no painel</Link>}
        <div className="q-fim">
          <p className="q-marca">{vendedor}</p>
          <h1>{t.obrigado}</h1>
          <p className="muted">{{ pt: 'Sua prévia já está pronta. Dá uma olhada e me chama no WhatsApp para ajustarmos.', en: 'Your preview is ready. Take a look and message me on WhatsApp.', es: 'Tu vista previa está lista. Mírala y escríbeme por WhatsApp.' }[idioma]}</p>
          <div className="acoes centro">
            <Link className="btn grande" to={`/p/${final.token}`}>{t.verPrevia}</Link>
            {final.whatsapp_vendedor && (
              <a className="btn btn-secundario grande" href={final.link} target="_blank" rel="noreferrer">
                <IconeWhatsapp size={17} /> {t.falar}
              </a>
            )}
          </div>
          {final.whatsapp_vendedor && (
            <div className="q-qr">
              <QRCodeSVG value={final.link} size={132} marginSize={1} fgColor="#15201c" />
              <p className="muted">{t.qrTexto}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="publico">
      {DEMO && <Link className="voltar-demo" to="/leads">Voltar ao painel</Link>}
      <div className="q-progresso" aria-hidden="true"><span style={{ width: `${progresso}%` }} /></div>
      <form className="questionario" onSubmit={enviar}>
        <header className="q-topo">
          <p className="q-marca">{vendedor}</p>
          <h1>{t.titulo}</h1>
          <p className="muted">{t.sub}</p>
          <p className="q-meta">
            {{ pt: `${PERGUNTAS.length} perguntas, ${obrigatorias.length} obrigatórias`, en: `${PERGUNTAS.length} questions, ${obrigatorias.length} required`, es: `${PERGUNTAS.length} preguntas, ${obrigatorias.length} obligatorias` }[idioma]}
          </p>
        </header>
        {SECOES.map((s, i) => (
          <Fragment key={s.id}>
            <section className="q-secao">
              <h2><span className="q-num">{i + 1}</span>{s[idioma]}</h2>
              {s.perguntas.map((id) => campo(POR_ID[id]))}
            </section>
          </Fragment>
        ))}
        {erro && <p className="erro">{erro}</p>}
        <button className="btn grande" disabled={enviando}>{enviando ? t.enviando : t.enviar}</button>
      </form>
    </div>
  )
}
