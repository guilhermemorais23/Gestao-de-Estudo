import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DEMO, api, linkWhatsapp, urlPublica } from '../api'
import { IconeWhatsapp } from '../components/Icones'

// Transforma "preto e dourado" em cores de verdade para a prévia
const CORES = {
  preto: '#111111', black: '#111111', negro: '#111111', branco: '#ffffff', white: '#ffffff',
  dourado: '#c9a227', gold: '#c9a227', ouro: '#c9a227', azul: '#1d4ed8', blue: '#1d4ed8',
  vermelho: '#dc2626', red: '#dc2626', rojo: '#dc2626', verde: '#15803d', green: '#15803d',
  rosa: '#db2777', pink: '#db2777', roxo: '#7c3aed', lilas: '#a78bfa', purple: '#7c3aed',
  laranja: '#ea580c', orange: '#ea580c', naranja: '#ea580c', amarelo: '#eab308', yellow: '#eab308',
  marrom: '#78350f', brown: '#78350f', cinza: '#4b5563', gray: '#4b5563', bege: '#d6c3a5', nude: '#d6c3a5',
  vinho: '#7f1d1d', turquesa: '#0d9488', ciano: '#0891b2',
}

function paleta(texto) {
  const achadas = (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z]+/)
    .map((p) => CORES[p])
    .filter(Boolean)
    .filter((c) => c !== '#ffffff')
  return { principal: achadas[0] || '#0f172a', destaque: achadas[1] || achadas[0] || '#16a34a' }
}

const T = {
  pt: { falar: 'Chamar no WhatsApp', porque: 'Por que escolher a gente', servicos: 'Serviços', onde: 'Onde estamos', horario: 'Horário', depo: 'O que dizem nossos clientes', faixa: 'Prévia gratuita criada por', gostou: 'Gostou? Quero meu site' },
  en: { falar: 'Message us on WhatsApp', porque: 'Why choose us', servicos: 'Services', onde: 'Find us', horario: 'Opening hours', depo: 'What our customers say', faixa: 'Free preview made by', gostou: 'Love it? I want my site' },
  es: { falar: 'Escríbenos por WhatsApp', porque: 'Por qué elegirnos', servicos: 'Servicios', onde: 'Dónde estamos', horario: 'Horario', depo: 'Lo que dicen nuestros clientes', faixa: 'Vista previa gratuita creada por', gostou: '¿Te gustó? Quiero mi sitio' },
}

export default function LandingPreview() {
  const { token } = useParams()
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api(`/publico/lp/${token}`).then(setDados).catch((e) => setErro(e.message))
  }, [token])

  useEffect(() => {
    if (dados) document.title = dados.briefing.empresa
  }, [dados])

  if (erro) return <div className="publico"><p className="erro">{erro}</p></div>
  if (!dados) return <div className="publico"><p>…</p></div>

  const { briefing, vendedor } = dados
  const r = briefing.respostas
  const tx = briefing.textos || {}
  const t = T[r._idioma] || T.pt
  const { principal, destaque } = paleta(r.cores)
  const servicos = tx.servicos?.length
    ? tx.servicos
    : (r.servicos || '').split('\n').map((s) => s.trim()).filter(Boolean).map((nome) => ({ nome, descricao: '' }))
  const diferenciais = tx.diferenciais?.filter(Boolean) || []
  const recursos = (r.recursos || []).join(' ').toLowerCase()
  const zapCliente = linkWhatsapp(briefing.contato_whatsapp || r.contato_whatsapp, '')
  const zapVendedor = linkWhatsapp(vendedor.whatsapp, `Quero o site da ${briefing.empresa}! (${urlPublica(`/lp/${token}`)})`)
  const instagram = (r.instagram || '').replace('@', '').trim()
  const botao = tx.texto_botao || t.falar

  return (
    <div className="lp" style={{ '--lp-principal': principal, '--lp-destaque': destaque }}>
      <div className="lp-faixa">
        {DEMO && <Link to="/respostas">Voltar ao painel</Link>}
        <span>{t.faixa} <b>{vendedor.empresa || vendedor.nome}</b></span>
        {vendedor.whatsapp && <a href={zapVendedor} target="_blank" rel="noreferrer">{t.gostou}</a>}
      </div>

      <nav className="lp-nav">
        <span className="lp-nome">
          <span className="lp-logo">{briefing.empresa.slice(0, 1).toUpperCase()}</span>
          {briefing.empresa}
        </span>
        <a className="lp-cta pequeno" href={zapCliente} target="_blank" rel="noreferrer"><IconeWhatsapp size={16} /> {botao}</a>
      </nav>

      <header className="lp-hero">
        <p className="lp-seg">{r.segmento}{r.endereco ? `, ${r.endereco.split(',').slice(-1)[0].trim()}` : ''}</p>
        <h1>{tx.titulo || briefing.empresa}</h1>
        <p className="lp-dif">{tx.subtitulo || r.diferencial}</p>
        <a className="lp-cta" href={zapCliente} target="_blank" rel="noreferrer"><IconeWhatsapp size={18} /> {botao}</a>
      </header>

      {tx.sobre && (
        <section className="lp-sec lp-sobre">
          <p>{tx.sobre}</p>
        </section>
      )}

      {servicos.length > 0 && (
        <section className="lp-sec">
          <h2>{t.servicos}</h2>
          <div className="lp-grid">
            {servicos.map((s) => (
              <div key={s.nome} className="lp-card">
                <strong>{s.nome}</strong>
                {s.descricao && <p>{s.descricao}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {diferenciais.length > 0 && (
        <section className="lp-sec claro">
          <h2>{t.porque}</h2>
          <ul className="lp-difs">
            {diferenciais.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </section>
      )}

      {(recursos.includes('depoimento') || recursos.includes('review') || recursos.includes('testimonio')) && (
        <section className="lp-sec">
          <h2>{t.depo}</h2>
          <div className="lp-grid">
            {['Atendimento excelente, saí muito satisfeito.', 'Recomendo demais, preço justo.', 'Voltarei com certeza.'].map((d) => (
              <figure key={d} className="lp-card lp-depo">
                <span className="lp-estrelas" aria-label="5 de 5 estrelas">★★★★★</span>
                <blockquote>{d}</blockquote>
              </figure>
            ))}
          </div>
          <p className="pequeno muted">Depoimentos ilustrativos. No site final entram as avaliações reais do Google.</p>
        </section>
      )}

      {(r.endereco || r.horario) && (
        <section className="lp-sec">
          <h2>{t.onde}</h2>
          <div className="lp-onde">
            {r.endereco && <p>{r.endereco}</p>}
            {r.horario && <p><b>{t.horario}:</b> {r.horario}</p>}
          </div>
          {r.endereco && (
            <iframe
              title="mapa"
              className="lp-mapa"
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(r.endereco)}&output=embed`}
            />
          )}
        </section>
      )}

      <footer className="lp-rodape">
        {tx.chamada_final && <p className="lp-chamada">{tx.chamada_final}</p>}
        <a className="lp-cta" href={zapCliente} target="_blank" rel="noreferrer"><IconeWhatsapp size={18} /> {botao}</a>
        {instagram && (
          <p><a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer">@{instagram}</a></p>
        )}
        <p className="pequeno">© {new Date().getFullYear()} {briefing.empresa}</p>
      </footer>
      <a className="lp-flutuante" href={zapCliente} target="_blank" rel="noreferrer" aria-label="WhatsApp"><IconeWhatsapp size={26} /></a>
    </div>
  )
}
