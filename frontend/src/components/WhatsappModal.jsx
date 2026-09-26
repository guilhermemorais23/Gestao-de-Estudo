import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api, linkWhatsapp } from '../api'

export function montarMensagem(usuario, lead) {
  const modelo = usuario[`msg_${lead.idioma}`] || usuario.msg_pt || ''
  return modelo
    .replaceAll('{empresa}', lead.nome)
    .replaceAll('{meu_nome}', usuario.nome)
    .replaceAll('{minha_empresa}', usuario.empresa ? `, da ${usuario.empresa}` : '')
    .replaceAll('{link}', `${window.location.origin}/q/${lead.token}`)
}

export default function WhatsappModal({ usuario, lead, onFechar, onAtualizado }) {
  const [numero, setNumero] = useState(lead.whatsapp || '')
  const [mensagem, setMensagem] = useState(() => montarMensagem(usuario, lead))
  const [copiado, setCopiado] = useState('')
  const link = linkWhatsapp(numero, mensagem)

  async function marcarContatado() {
    const mudancas = {}
    if (lead.status === 'novo') mudancas.status = 'contatado'
    if (numero !== lead.whatsapp) mudancas.whatsapp = numero
    if (Object.keys(mudancas).length) {
      const atualizado = await api(`/leads/${lead.id}`, { method: 'PATCH', body: mudancas })
      onAtualizado?.(atualizado)
    }
  }

  async function copiar(texto, qual) {
    await navigator.clipboard.writeText(texto)
    setCopiado(qual)
    setTimeout(() => setCopiado(''), 1500)
  }

  return (
    <div className="fundo-modal" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-topo">
          <h2>Mensagem para {lead.nome}</h2>
          <button className="btn-link" onClick={onFechar}>✕</button>
        </div>

        <div className="modal-grid">
          <div>
            <label>
              WhatsApp do cliente (com DDI, ex: 5583999998888)
              <input value={numero} onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))} />
            </label>
            {!lead.whatsapp_provavel && numero && (
              <p className="alerta">Parece telefone fixo — pode não ter WhatsApp. Confira no Google Maps/Instagram.</p>
            )}
            <label>
              Mensagem
              <textarea rows={9} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
            </label>
            <div className="acoes">
              <a className="btn verde" href={link} target="_blank" rel="noreferrer" onClick={marcarContatado}>
                Abrir no WhatsApp
              </a>
              <button className="btn claro" onClick={() => copiar(mensagem, 'msg')}>
                {copiado === 'msg' ? 'Copiado!' : 'Copiar mensagem'}
              </button>
              <button className="btn claro" onClick={() => copiar(`${window.location.origin}/q/${lead.token}`, 'q')}>
                {copiado === 'q' ? 'Copiado!' : 'Copiar link do questionário'}
              </button>
            </div>
          </div>
          <div className="qr">
            <QRCodeSVG value={link} size={190} marginSize={2} />
            <p className="muted">Aponte a câmera do seu celular para abrir a conversa já com a mensagem pronta.</p>
          </div>
        </div>
        <p className="muted pequeno">
          Dica: envie manualmente e aos poucos (ex.: 20–30 por dia). Disparo em massa faz o WhatsApp banir o número.
        </p>
      </div>
    </div>
  )
}
