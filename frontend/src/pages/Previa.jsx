import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Clock, MapPin, Monitor, Smartphone, Star } from 'lucide-react'
import { DEMO, api, linkWhatsapp, urlPublica } from '../api'
import { IconeWhatsapp } from '../components/Icones'

// Cada segmento tem seu visual. As cores do questionário, quando existem, substituem o destaque.
const SEGMENTOS = {
  beleza: { fundo: '#141211', texto: '#f4efe8', destaque: '#c9a15b', escuro: true, secoes: ['precos', 'galeria', 'avaliacoes', 'diferenciais', 'horarios'] },
  saude: { fundo: '#f5f9fa', texto: '#12303a', destaque: '#1f6f8b', escuro: false, secoes: ['servicos', 'passos', 'avaliacoes', 'galeria', 'horarios'] },
  comida: { fundo: '#fffaf5', texto: '#2a1a12', destaque: '#c2410c', escuro: false, secoes: ['cardapio', 'galeria', 'avaliacoes', 'diferenciais', 'horarios'] },
  servicos: { fundo: '#f6f7f9', texto: '#151c28', destaque: '#1d4ed8', escuro: false, secoes: ['servicos', 'passos', 'avaliacoes', 'galeria', 'horarios'] },
}

const PASSOS_SEGMENTO = {
  saude: ['Chame no WhatsApp e conte o que precisa', 'Escolha o melhor dia e horário', 'Seja atendido com calma'],
  servicos: ['Mande uma mensagem explicando o serviço', 'Receba o orçamento antes de começar', 'Serviço feito no prazo combinado'],
}

const T = {
  pt: {
    servicos: 'Serviços', precos: 'Serviços e valores', cardapio: 'Cardápio', consulte: 'Consulte', galeria: 'Nosso espaço',
    avaliacoes: 'Quem já veio, recomenda', google: 'avaliações no Google', porque: 'Por que escolher a gente',
    horarios: 'Horários e endereço', passos: 'Como funciona', rota: 'Ver no mapa', hoje: 'Hoje', faixa: 'Prévia do site feita por',
    gostou: 'Quero esse site', celular: 'Celular', computador: 'Computador', fonte: 'Avaliação do Google',
    fotoExemplo: 'Aqui entram as fotos do estabelecimento, direto do Google Maps', fotoDe: 'Foto',
  },
  en: {
    servicos: 'Services', precos: 'Services and prices', cardapio: 'Menu', consulte: 'Ask us', galeria: 'Our place',
    avaliacoes: 'What customers say', google: 'Google reviews', porque: 'Why choose us', horarios: 'Hours and address',
    passos: 'How it works', rota: 'Open in Maps', hoje: 'Today', faixa: 'Website preview by', gostou: 'I want this site',
    celular: 'Phone', computador: 'Desktop', fonte: 'Google review', fotoExemplo: 'Your photos from Google Maps go here', fotoDe: 'Photo',
  },
  es: {
    servicos: 'Servicios', precos: 'Servicios y precios', cardapio: 'Menú', consulte: 'Consultar', galeria: 'Nuestro espacio',
    avaliacoes: 'Lo que dicen los clientes', google: 'reseñas en Google', porque: 'Por qué elegirnos', horarios: 'Horarios y dirección',
    passos: 'Cómo funciona', rota: 'Ver en el mapa', hoje: 'Hoy', faixa: 'Vista previa hecha por', gostou: 'Quiero este sitio',
    celular: 'Celular', computador: 'Computadora', fonte: 'Reseña de Google', fotoExemplo: 'Aquí van las fotos del lugar, desde Google Maps', fotoDe: 'Foto',
  },
}

const CORES = {
  preto: '#111111', black: '#111111', negro: '#111111', dourado: '#c9a15b', gold: '#c9a15b', ouro: '#c9a15b',
  azul: '#1d4ed8', blue: '#1d4ed8', vermelho: '#c62828', red: '#c62828', rojo: '#c62828', verde: '#15803d',
  green: '#15803d', rosa: '#d63384', pink: '#d63384', roxo: '#7c3aed', lilas: '#9b7ede', purple: '#7c3aed',
  laranja: '#ea580c', orange: '#ea580c', naranja: '#ea580c', amarelo: '#d4a017', yellow: '#d4a017',
  marrom: '#7a4b24', brown: '#7a4b24', vinho: '#7f1d1d', turquesa: '#0d9488', nude: '#c8a98b', bege: '#c8a98b',
}

function corDestaque(texto) {
  const achadas = (texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z]+/).map((p) => CORES[p]).filter((c) => c && c !== '#111111')
  return achadas[0]
}

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
function horarioDeHoje(horarios) {
  const hoje = DIAS[new Date().getDay()]
  const linha = horarios.find((h) => h.toLowerCase().startsWith(hoje))
  return linha ? linha.split(/:\s(.+)/)[1] : null
}

function Foto({ foto, t, classe = '' }) {
  if (!foto) return null
  if (!foto.url) {
    return <div className={`pv-foto pv-foto-exemplo ${classe}`}><span>{t.fotoExemplo}</span></div>
  }
  return (
    <figure className={`pv-foto ${classe}`}>
      <img src={urlFoto(foto.url)} alt="" loading="lazy" />
      {foto.autor && <figcaption>{t.fotoDe}: {foto.autor}</figcaption>}
    </figure>
  )
}

function urlFoto(url) {
  return url.startsWith('/api') ? `${import.meta.env.VITE_API_URL || ''}${url}` : url
}

// Revela cada seção com uma subida suave quando ela entra na tela (funciona dentro da moldura de celular também)
function useRevelar(ref) {
  useEffect(() => {
    const raiz = ref.current
    if (!raiz || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    const alvos = raiz.querySelectorAll('.pv-sec, .pv-rodape')
    alvos.forEach((el) => el.classList.add('pv-revelar'))
    raiz.classList.add('animado')
    const obs = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visivel')
          obs.unobserve(e.target)
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    alvos.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [ref])
}

function Site({ d, t, cfg }) {
  const ref = useRef(null)
  useRevelar(ref)
  const tx = d.textos
  const zap = linkWhatsapp(d.whatsapp, '')
  const botao = tx.texto_botao || 'Chamar no WhatsApp'
  const hoje = horarioDeHoje(d.horarios)
  const [capa, ...resto] = d.fotos
  const instagram = (d.instagram || '').replace('@', '').trim()

  const secoes = {
    servicos: tx.servicos?.length > 0 && (
      <section className="pv-sec" key="servicos">
        <h2>{t.servicos}</h2>
        <div className="pv-cards">
          {tx.servicos.map((s) => (
            <article key={s.nome} className="pv-card"><h3>{s.nome}</h3>{s.descricao && <p>{s.descricao}</p>}</article>
          ))}
        </div>
      </section>
    ),
    precos: tx.servicos?.length > 0 && (
      <section className="pv-sec" key="precos">
        <h2>{t.precos}</h2>
        <ul className="pv-precos">
          {tx.servicos.map((s) => (
            <li key={s.nome}>
              <div><strong>{s.nome}</strong>{s.descricao && <p>{s.descricao}</p>}</div>
              <span className="pv-pontilhado" aria-hidden="true" />
              <em>{t.consulte}</em>
            </li>
          ))}
        </ul>
      </section>
    ),
    cardapio: tx.servicos?.length > 0 && (
      <section className="pv-sec" key="cardapio">
        <h2>{t.cardapio}</h2>
        <div className="pv-cardapio">
          {tx.servicos.map((s) => (
            <article key={s.nome}><h3>{s.nome}</h3>{s.descricao && <p>{s.descricao}</p>}</article>
          ))}
        </div>
        <a className="pv-botao" href={zap} target="_blank" rel="noreferrer"><IconeWhatsapp size={17} /> {botao}</a>
      </section>
    ),
    passos: PASSOS_SEGMENTO[d.modelo] && (
      <section className="pv-sec pv-sec-alt" key="passos">
        <h2>{t.passos}</h2>
        <ol className="pv-passos">{PASSOS_SEGMENTO[d.modelo].map((p) => <li key={p}>{p}</li>)}</ol>
      </section>
    ),
    galeria: resto.length > 0 && (
      <section className="pv-sec" key="galeria">
        <h2>{t.galeria}</h2>
        <div className="pv-galeria">{resto.slice(0, 6).map((f, i) => <Foto key={i} foto={f} t={t} />)}</div>
      </section>
    ),
    avaliacoes: d.avaliacoes.length > 0 && (
      <section className="pv-sec pv-sec-alt" key="avaliacoes">
        <h2>{t.avaliacoes}</h2>
        {d.avaliacao && (
          <p className="pv-nota"><b>{String(d.avaliacao).replace('.', ',')}</b> <Star size={18} fill="currentColor" /> {d.num_avaliacoes} {t.google}</p>
        )}
        <div className="pv-avaliacoes">
          {d.avaliacoes.slice(0, 3).map((a, i) => (
            <figure key={i} className="pv-avaliacao">
              <span className="pv-estrelas" aria-label={`${a.nota} de 5`}>{'★'.repeat(a.nota || 5)}</span>
              <blockquote>{a.texto.length > 220 ? `${a.texto.slice(0, 217)}...` : a.texto}</blockquote>
              <figcaption>{a.autor}{a.quando ? `, ${a.quando}` : ''}. <span>{t.fonte}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>
    ),
    diferenciais: tx.diferenciais?.length > 0 && (
      <section className="pv-sec" key="diferenciais">
        <h2>{t.porque}</h2>
        <ul className="pv-difs">{tx.diferenciais.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
    ),
    horarios: (d.horarios.length > 0 || d.endereco) && (
      <section className="pv-sec pv-sec-alt" key="horarios">
        <h2>{t.horarios}</h2>
        <div className="pv-onde">
          {d.horarios.length > 0 && (
            <ul className="pv-horarios">
              {d.horarios.map((h) => {
                const [dia, hora] = h.split(/:\s(.+)/)
                return <li key={h} className={h === d.horarios.find((x) => x.toLowerCase().startsWith(DIAS[new Date().getDay()])) ? 'hoje' : ''}><span>{dia}</span><span>{hora}</span></li>
              })}
            </ul>
          )}
          <div className="pv-endereco">
            {d.endereco && <p><MapPin size={18} /> {d.endereco}</p>}
            {d.maps_url && <a className="pv-botao secundario" href={d.maps_url} target="_blank" rel="noreferrer">{t.rota}</a>}
          </div>
        </div>
      </section>
    ),
  }

  return (
    <div ref={ref} className={`pv-site pv-${d.modelo} ${cfg.escuro ? 'escuro' : ''}`}>
      <nav className="pv-nav">
        <span className="pv-marca"><span className="pv-mono">{d.empresa.slice(0, 1).toUpperCase()}</span>{d.empresa}</span>
        <a className="pv-botao pequeno" href={zap} target="_blank" rel="noreferrer"><IconeWhatsapp size={15} /> {botao}</a>
      </nav>

      <header className={`pv-hero ${capa ? 'com-foto' : 'sem-foto'}`}>
        {capa && <Foto foto={capa} t={t} classe="pv-capa" />}
        <div className="pv-hero-texto">
          <p className="pv-seg">{[d.categoria, d.bairro !== 'seu bairro' && d.bairro].filter(Boolean).join(', ')}</p>
          <h1>{tx.titulo}</h1>
          <p className="pv-sub">{tx.subtitulo}</p>
          <div className="pv-hero-acoes">
            <a className="pv-botao" href={zap} target="_blank" rel="noreferrer"><IconeWhatsapp size={18} /> {botao}</a>
            {d.avaliacao && (
              <span className="pv-selo"><Star size={15} fill="currentColor" /> {String(d.avaliacao).replace('.', ',')} {t.google.split(' ')[0]} ({d.num_avaliacoes})</span>
            )}
          </div>
          {hoje && <p className="pv-hoje"><Clock size={15} /> {t.hoje}: {hoje}</p>}
        </div>
      </header>

      {tx.sobre && <section className="pv-sec pv-sobre"><p>{tx.sobre}</p></section>}
      {cfg.secoes.map((s) => secoes[s])}

      <footer className="pv-rodape">
        {tx.chamada_final && <p className="pv-chamada">{tx.chamada_final}</p>}
        <a className="pv-botao" href={zap} target="_blank" rel="noreferrer"><IconeWhatsapp size={18} /> {botao}</a>
        {instagram && <a className="pv-insta" href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer">@{instagram}</a>}
        <p className="pv-copy">© {new Date().getFullYear()} {d.empresa}</p>
      </footer>
    </div>
  )
}

export default function Previa() {
  const { token } = useParams()
  const [d, setD] = useState(null)
  const [erro, setErro] = useState('')
  const largo = typeof window !== 'undefined' && window.innerWidth > 900
  const [modo, setModo] = useState(largo ? 'celular' : 'cheio')

  useEffect(() => {
    api(`/publico/previa/${token}`).then(setD).catch((e) => setErro(e.message))
  }, [token])

  useEffect(() => {
    if (d) document.title = d.empresa
  }, [d])

  if (erro) return <div className="publico"><p className="erro">{erro}</p></div>
  if (!d) return <div className="publico"><p className="muted">Carregando</p></div>

  const t = T[d.idioma] || T.pt
  const base = SEGMENTOS[d.modelo] || SEGMENTOS.servicos
  const cfg = { ...base, destaque: corDestaque(d.cores) || base.destaque }
  const estilo = { '--pv-fundo': cfg.fundo, '--pv-texto': cfg.texto, '--pv-destaque': cfg.destaque }
  const zap = linkWhatsapp(d.whatsapp, '')
  const zapVendedor = linkWhatsapp(d.vendedor.whatsapp, `Quero o site da ${d.empresa}! ${urlPublica(`/p/${token}`)}`)

  return (
    <div className={`pv-pagina modo-${modo}`} style={estilo}>
      <div className="pv-barra">
        {DEMO && <Link to="/leads" className="pv-barra-link">Voltar ao painel</Link>}
        <span>{t.faixa} <b>{d.vendedor.empresa || d.vendedor.nome}</b></span>
        {largo && (
          <span className="pv-modos" role="group" aria-label="Ver como">
            <button className={modo === 'celular' ? 'ativo' : ''} onClick={() => setModo('celular')}><Smartphone size={15} /> {t.celular}</button>
            <button className={modo === 'cheio' ? 'ativo' : ''} onClick={() => setModo('cheio')}><Monitor size={15} /> {t.computador}</button>
          </span>
        )}
        {d.vendedor.whatsapp && <a className="pv-barra-cta" href={zapVendedor} target="_blank" rel="noreferrer">{t.gostou}</a>}
      </div>

      {modo === 'celular' ? (
        <div className="pv-palco">
          <div className="pv-celular">
            <div className="pv-tela"><Site d={d} t={t} cfg={cfg} /></div>
            <a className="pv-flutuante" href={zap} target="_blank" rel="noreferrer" aria-label="WhatsApp"><IconeWhatsapp size={24} /></a>
          </div>
        </div>
      ) : (
        <div className="pv-tela cheia">
          <Site d={d} t={t} cfg={cfg} />
          <a className="pv-flutuante" href={zap} target="_blank" rel="noreferrer" aria-label="WhatsApp"><IconeWhatsapp size={26} /></a>
        </div>
      )}
    </div>
  )
}
