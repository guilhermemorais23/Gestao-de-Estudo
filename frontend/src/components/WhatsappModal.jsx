import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, ExternalLink, RefreshCw, ShieldAlert, Sparkles, X } from 'lucide-react'
import { DEMO, api, linkWhatsapp } from '../api'
import { ABAS, PASSOS, TONS, montarMensagem, passoDoEnvio, proximoPasso, roteiroVideo, situacaoContato } from '../mensagens'
import { IconeWhatsapp } from './Icones'

async function copiarTexto(texto, seletor) {
  try {
    await navigator.clipboard.writeText(texto)
  } catch {
    const el = document.querySelector(seletor)
    if (el) window.getSelection()?.selectAllChildren(el)
  }
}

export default function WhatsappModal({ usuario, lead: leadInicial, onFechar, onAtualizado }) {
  const { resumo = {}, atualizarResumo } = useOutletContext() || {}
  const [lead, setLead] = useState(leadInicial)
  const [passo, setPasso] = useState(() => proximoPasso(leadInicial))
  const [tom, setTom] = useState(leadInicial.idioma === 'pt' ? leadInicial.tom : 'formal')
  const [numero, setNumero] = useState(leadInicial.whatsapp || '')
  const [mensagem, setMensagem] = useState(() => montarMensagem(usuario, leadInicial, proximoPasso(leadInicial), tom))
  const [copiado, setCopiado] = useState('')
  const [notas, setNotas] = useState(leadInicial.notas || '')
  const [gerando, setGerando] = useState(false)
  const [erroPrevia, setErroPrevia] = useState('')

  const link = linkWhatsapp(numero, mensagem)
  const sugerido = proximoPasso(lead)
  const temTons = lead.idioma === 'pt'
  const info = PASSOS.find((p) => p.id === passo)
  const aba = info?.aba
  const subitens = PASSOS.filter((p) => p.aba === aba)
  const enviados = resumo._envios_hoje || 0
  const limite = resumo._limite_diario || usuario.limite_diario || 20

  function atualizar(novo) {
    setLead(novo)
    onAtualizado?.(novo)
  }

  function trocar(novoPasso, novoTom = tom) {
    setPasso(novoPasso)
    setTom(novoTom)
    setMensagem(montarMensagem(usuario, lead, novoPasso, novoTom))
  }

  function abrirAba(idAba) {
    const itens = PASSOS.filter((p) => p.aba === idAba)
    trocar(itens.find((p) => p.id === sugerido)?.id || itens[0].id)
  }

  async function trocarTom(novoTom) {
    trocar(passo, novoTom)
    if (novoTom !== lead.tom && !lead.passo) {
      atualizar(await api(`/leads/${lead.id}`, { method: 'PATCH', body: { tom: novoTom } }))
    }
  }

  async function registrarEnvio() {
    atualizar(await api(`/leads/${lead.id}/envio`, { method: 'POST', body: { passo: passoDoEnvio(passo), whatsapp: numero } }))
    atualizarResumo?.()
  }

  async function alternarResposta() {
    const novo = await api(`/leads/${lead.id}/resposta`, { method: 'POST' })
    atualizar(novo)
    trocar(proximoPasso(novo))
  }

  async function gerarPrevia() {
    setGerando(true)
    setErroPrevia('')
    try {
      atualizar(await api(`/leads/${lead.id}/previa`, { method: 'POST' }))
    } catch (e) {
      setErroPrevia(e.message)
    } finally {
      setGerando(false)
    }
  }

  async function salvarNotas() {
    if (notas !== (lead.notas || '')) atualizar(await api(`/leads/${lead.id}`, { method: 'PATCH', body: { notas } }))
  }

  async function copiar(texto, qual, seletor) {
    await copiarTexto(texto, seletor)
    setCopiado(qual)
    setTimeout(() => setCopiado(''), 1500)
  }

  const caixaPrevia = (
    <div className="caixa-previa">
      {lead.previa_gerada_em ? (
        <>
          <span>
            <strong>Prévia pronta.</strong>{' '}
            {lead.fonte === 'google' ? 'Com fotos, avaliações e horários do Google.' : 'Com o modelo do segmento.'}
          </span>
          <Link className="btn-texto" to={`/p/${lead.token}`} target={DEMO ? undefined : '_blank'}><ExternalLink size={15} /> Ver</Link>
          <button className="btn-texto" onClick={gerarPrevia} disabled={gerando}><RefreshCw size={15} /> {gerando ? 'Gerando' : 'Gerar de novo'}</button>
        </>
      ) : (
        <>
          <span>Gere a prévia antes de mandar: o sistema busca fotos, avaliações e horários no Google e escreve os textos.</span>
          <button className="btn btn-ia btn-pequeno" onClick={gerarPrevia} disabled={gerando}><Sparkles size={15} /> {gerando ? 'Gerando' : 'Gerar prévia'}</button>
        </>
      )}
      {erroPrevia && <p className="erro">{erroPrevia}</p>}
    </div>
  )

  return (
    <div className="fundo-modal" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-topo">
          <div>
            <h2>{lead.nome}</h2>
            <p className="muted">{situacaoContato(lead) || 'Negociação encerrada'}</p>
          </div>
          <button className="icone-btn" onClick={onFechar} aria-label="Fechar"><X size={18} /></button>
        </div>

        <div className="passos" role="tablist" aria-label="Mensagem">
          {ABAS.map((a) => (
            <button key={a.id} role="tab" aria-selected={aba === a.id} className={aba === a.id ? 'passo ativo' : 'passo'} onClick={() => abrirAba(a.id)}>
              {a.nome}
              {PASSOS.some((p) => p.aba === a.id && p.id === sugerido) && <span className="agora">agora</span>}
            </button>
          ))}
        </div>

        <div className="modal-grid">
          <div>
            {subitens.length > 1 && (
              <div className="subpassos">
                {subitens.map((p) => (
                  <button key={p.id} className={passo === p.id ? 'chip ativo' : 'chip'} onClick={() => trocar(p.id)}>
                    {p.nome}{p.id === sugerido ? ' (agora)' : ''}
                  </button>
                ))}
              </div>
            )}
            <p className="ajuda">{info?.ajuda}</p>

            {(aba === 'previa' || aba === 'video') && caixaPrevia}
            {aba === 'video' && (
              <div className="roteiro">
                <div className="roteiro-topo">
                  <strong>Roteiro do vídeo (30 a 45 segundos)</strong>
                  <button className="btn-texto" onClick={() => copiar(roteiroVideo(usuario, lead), 'roteiro', '.roteiro pre')}>
                    <Copy size={15} /> {copiado === 'roteiro' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <pre>{roteiroVideo(usuario, lead)}</pre>
                <p className="muted pequeno">
                  Abra a prévia no seu celular e grave a tela (no iPhone, pela Central de Controle; no Android, pelo atalho
                  "Gravar tela"). Fale com naturalidade, não precisa ser perfeito. Mande o vídeo no WhatsApp e, logo depois,
                  a mensagem abaixo.
                </p>
              </div>
            )}
            {aba === 'proposta' && (
              <div className="caixa-previa">
                <span>A proposta mostra seus pacotes de Configurações, o prazo e o PIX da entrada.</span>
                <Link className="btn-texto" to={`/proposta/${lead.token}`} target={DEMO ? undefined : '_blank'}><ExternalLink size={15} /> Ver proposta</Link>
              </div>
            )}

            {temTons && (
              <div className="tons">
                <span className="muted">Tom</span>
                {Object.entries(TONS).map(([v, t]) => (
                  <button key={v} className={tom === v ? 'chip ativo' : 'chip'} onClick={() => trocarTom(v)}>{t}</button>
                ))}
                <span className="muted pequeno">{lead.passo ? 'sorteado para este lead' : 'sorteado, você pode trocar antes de enviar'}</span>
              </div>
            )}
            <label>
              Mensagem
              <textarea className="texto-mensagem" rows={6} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
            </label>
            <label>
              WhatsApp da empresa, com 55 e DDD
              <input value={numero} onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))} />
            </label>
            {!lead.whatsapp_provavel && numero && (
              <p className="alerta">Esse número parece fixo e pode não ter WhatsApp. Confira no Maps ou no Instagram da empresa.</p>
            )}
            {enviados >= limite && (
              <p className="alerta forte"><ShieldAlert size={16} /> Você já mandou {enviados} mensagens hoje, seu limite é {limite}. Para proteger seu número, continue amanhã.</p>
            )}
            <div className="acoes">
              <a className={enviados >= limite ? 'btn btn-secundario' : 'btn'} href={link} target="_blank" rel="noreferrer" onClick={registrarEnvio}>
                <IconeWhatsapp size={16} /> Abrir no WhatsApp
              </a>
              <button className="btn btn-secundario" onClick={() => copiar(mensagem, 'msg', '.texto-mensagem')}>{copiado === 'msg' ? 'Copiado' : 'Copiar mensagem'}</button>
              {DEMO && aba === 'questionario' && (
                <Link className="btn-texto" to={`/q/${lead.token}`}>Ver o questionário como o cliente</Link>
              )}
            </div>
          </div>
          <div className="lateral-modal">
            <div className="qr">
              <QRCodeSVG value={link} size={150} marginSize={1} fgColor="#18211E" />
              <p className="muted">Aponte a câmera do celular para abrir a conversa com a mensagem pronta.</p>
            </div>
            {lead.passo > 0 && (
              <button className={lead.respondeu ? 'btn btn-marcado' : 'btn btn-secundario'} onClick={alternarResposta}>
                <Check size={16} /> {lead.respondeu ? 'Respondeu' : 'Marcar que respondeu'}
              </button>
            )}
            <label htmlFor="notas-lead">
              Anotações
              <textarea id="notas-lead" rows={4} value={notas} placeholder="Ex.: pediu pra chamar depois das 18h" onChange={(e) => setNotas(e.target.value)} onBlur={salvarNotas} />
            </label>
          </div>
        </div>
        <p className="nota-rodape">
          Hoje: <b>{enviados} de {limite}</b> mensagens. Ao clicar em Abrir no WhatsApp, o envio fica registrado. Com número
          pessoal, mande com calma: 2 a 3 minutos entre uma e outra, e priorize quem já respondeu.
        </p>
      </div>
    </div>
  )
}
