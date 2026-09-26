import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Check, X } from 'lucide-react'
import { DEMO, api, linkWhatsapp } from '../api'
import { PASSOS, TONS, montarMensagem, proximoPasso, situacaoContato } from '../mensagens'
import { IconeWhatsapp } from './Icones'

export default function WhatsappModal({ usuario, lead: leadInicial, onFechar, onAtualizado }) {
  const [lead, setLead] = useState(leadInicial)
  const [passo, setPasso] = useState(() => proximoPasso(leadInicial))
  const [tom, setTom] = useState(leadInicial.idioma === 'pt' ? leadInicial.tom : 'formal')
  const [numero, setNumero] = useState(leadInicial.whatsapp || '')
  const [mensagem, setMensagem] = useState(() => montarMensagem(usuario, leadInicial, proximoPasso(leadInicial), tom))
  const [copiado, setCopiado] = useState(false)
  const [notas, setNotas] = useState(leadInicial.notas || '')

  async function salvarNotas() {
    if (notas !== (lead.notas || '')) {
      atualizar(await api(`/leads/${lead.id}`, { method: 'PATCH', body: { notas } }))
    }
  }
  const link = linkWhatsapp(numero, mensagem)
  const sugerido = proximoPasso(lead)
  const temTons = lead.idioma === 'pt'

  function atualizar(novo) {
    setLead(novo)
    onAtualizado?.(novo)
  }

  function trocar(novoPasso, novoTom = tom) {
    setPasso(novoPasso)
    setTom(novoTom)
    setMensagem(montarMensagem(usuario, lead, novoPasso, novoTom))
  }

  async function trocarTom(novoTom) {
    trocar(passo, novoTom)
    if (novoTom !== lead.tom && !lead.passo) {
      atualizar(await api(`/leads/${lead.id}`, { method: 'PATCH', body: { tom: novoTom } }))
    }
  }

  async function registrarEnvio() {
    atualizar(await api(`/leads/${lead.id}/envio`, { method: 'POST', body: { passo, whatsapp: numero } }))
  }

  async function alternarResposta() {
    const novo = await api(`/leads/${lead.id}/resposta`, { method: 'POST' })
    atualizar(novo)
    trocar(proximoPasso(novo))
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensagem)
    } catch {
      window.getSelection()?.selectAllChildren(document.querySelector('.modal textarea'))
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

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

        <div className="passos" role="tablist" aria-label="Mensagem da sequência">
          {PASSOS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={passo === p.id}
              className={passo === p.id ? 'passo ativo' : 'passo'}
              onClick={() => trocar(p.id)}
            >
              {p.nome}
              {sugerido === p.id && <span className="agora">agora</span>}
            </button>
          ))}
        </div>

        <div className="modal-grid">
          <div>
            <p className="ajuda">{PASSOS.find((p) => p.id === passo).ajuda}</p>
            {temTons && (
              <div className="tons">
                <span className="muted">Tom</span>
                {Object.entries(TONS).map(([v, t]) => (
                  <button key={v} className={tom === v ? 'chip ativo' : 'chip'} onClick={() => trocarTom(v)}>{t}</button>
                ))}
                <span className="muted pequeno">
                  {lead.passo ? 'sorteado para este lead' : 'sorteado, você pode trocar antes de enviar'}
                </span>
              </div>
            )}
            <label>
              Mensagem
              <textarea rows={7} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
            </label>
            <label>
              WhatsApp da empresa, com 55 e DDD
              <input value={numero} onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))} />
            </label>
            {!lead.whatsapp_provavel && numero && (
              <p className="alerta">Esse número parece fixo e pode não ter WhatsApp. Confira no Maps ou no Instagram da empresa.</p>
            )}
            <div className="acoes">
              <a className="btn" href={link} target="_blank" rel="noreferrer" onClick={registrarEnvio}>
                <IconeWhatsapp size={16} /> Abrir no WhatsApp
              </a>
              <button className="btn btn-secundario" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar mensagem'}</button>
              {DEMO && passo === 'questionario' && (
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
              <textarea id="notas-lead" rows={4} value={notas} placeholder="Ex.: pediu pra chamar depois das 18h"
                onChange={(e) => setNotas(e.target.value)} onBlur={salvarNotas} />
            </label>
          </div>
        </div>
        <p className="nota-rodape">
          Ao clicar em Abrir no WhatsApp, o envio fica registrado. Mande aos poucos, algo como 20 a 30 por dia:
          disparo em massa faz o WhatsApp bloquear o número.
        </p>
      </div>
    </div>
  )
}
