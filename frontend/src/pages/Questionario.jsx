import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { DEMO, api, linkWhatsapp, urlPublica } from '../api'
import { PERGUNTAS, TEXTOS, resumoTexto } from '../perguntas'

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
        if (d.empresa_cliente) setRespostas({ empresa: d.empresa_cliente })
      })
      .catch((e) => setErro(e.message))
  }, [token])

  if (erro && !info) return <div className="publico"><p className="erro">{erro}</p></div>
  if (!info) return <div className="publico"><p>…</p></div>

  const idioma = info.idioma || 'pt'
  const t = TEXTOS[idioma]

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
      const msg = `${saudacao}\n\n${resumoTexto(respostas, idioma)}\n\n${urlPublica(`/lp/${r.token}`)}`
      setFinal({ ...r, link: linkWhatsapp(r.whatsapp_vendedor, msg) })
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (final) {
    return (
      <div className="publico">
        {DEMO && <Link className="voltar-demo" to="/respostas">← Ver no painel</Link>}
        <div className="card centro">
          <h1>{t.obrigado}</h1>
          <div className="acoes centro">
            <Link className="btn" to={`/lp/${final.token}`}>{t.verPrevia}</Link>
            {final.whatsapp_vendedor && (
              <a className="btn verde" href={final.link} target="_blank" rel="noreferrer">{t.falar}</a>
            )}
          </div>
          {final.whatsapp_vendedor && (
            <>
              <p className="muted">{t.qrTexto}</p>
              <QRCodeSVG value={final.link} size={180} marginSize={2} />
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="publico">
      {DEMO && <Link className="voltar-demo" to="/leads">← Voltar ao painel</Link>}
      <form className="card questionario" onSubmit={enviar}>
        <h1>{t.titulo}</h1>
        <p className="muted">{t.sub}{info.empresa_vendedor ? ` — ${info.empresa_vendedor}` : ''}</p>
        {PERGUNTAS.map((p) => (
          <fieldset key={p.id}>
            <legend>{p[idioma]}{p.obrigatoria && ' *'}</legend>
            {p.tipo === 'texto' && (
              <input value={respostas[p.id] || ''} onChange={(e) => set(p.id, e.target.value)} required={p.obrigatoria} />
            )}
            {p.tipo === 'area' && (
              <textarea rows={4} value={respostas[p.id] || ''} onChange={(e) => set(p.id, e.target.value)} />
            )}
            {p.tipo === 'unica' && p.opcoes[idioma].map((o) => (
              <label key={o} className="opcao">
                <input type="radio" name={p.id} checked={respostas[p.id] === o} onChange={() => set(p.id, o)} required={p.obrigatoria} />
                {o}
              </label>
            ))}
            {p.tipo === 'multipla' && p.opcoes[idioma].map((o) => (
              <label key={o} className="opcao">
                <input type="checkbox" checked={(respostas[p.id] || []).includes(o)} onChange={() => alternar(p.id, o)} />
                {o}
              </label>
            ))}
          </fieldset>
        ))}
        {erro && <p className="erro">{erro}</p>}
        <button className="btn grande" disabled={enviando}>{enviando ? t.enviando : t.enviar}</button>
      </form>
    </div>
  )
}
