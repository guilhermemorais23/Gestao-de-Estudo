import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { X } from 'lucide-react'
import { IconeWhatsapp } from './Icones'
import { DEMO, api, linkWhatsapp, urlPublica } from '../api'

export function montarMensagem(usuario, lead) {
  const modelo = usuario[`msg_${lead.idioma}`] || usuario.msg_pt || ''
  return modelo
    .replaceAll('{empresa}', lead.nome)
    .replaceAll('{meu_nome}', usuario.nome)
    .replaceAll('{minha_empresa}', usuario.empresa ? `, da ${usuario.empresa}` : '')
    .replaceAll('{link}', urlPublica(`/q/${lead.token}`))
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
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      window.getSelection()?.selectAllChildren(document.querySelector('.modal textarea'))
    }
    setCopiado(qual)
    setTimeout(() => setCopiado(''), 1500)
  }

  return (
    <div className="fundo-modal" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-topo">
          <div>
            <h2>Abordar {lead.nome}</h2>
            <p className="muted">Revise a mensagem e abra a conversa no WhatsApp.</p>
          </div>
          <button className="icone-btn" onClick={onFechar} aria-label="Fechar"><X size={18} /></button>
        </div>

        <div className="modal-grid">
          <div>
            <label>
              WhatsApp da empresa, com 55 e DDD
              <input value={numero} onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))} />
            </label>
            {!lead.whatsapp_provavel && numero && (
              <p className="alerta">Esse número parece fixo e pode não ter WhatsApp. Confira no Maps ou no Instagram da empresa.</p>
            )}
            <label>
              Mensagem
              <textarea rows={9} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
            </label>
            <div className="acoes">
              <a className="btn" href={link} target="_blank" rel="noreferrer" onClick={marcarContatado}>
                <IconeWhatsapp size={16} /> Abrir no WhatsApp
              </a>
              <button className="btn btn-secundario" onClick={() => copiar(mensagem, 'msg')}>
                {copiado === 'msg' ? 'Copiado!' : 'Copiar mensagem'}
              </button>
              <button className="btn btn-secundario" onClick={() => copiar(urlPublica(`/q/${lead.token}`), 'q')}>
                {copiado === 'q' ? 'Copiado!' : 'Copiar link do questionário'}
              </button>
              {DEMO && (
                <Link className="btn-texto" to={`/q/${lead.token}`}>Ver o questionário como o cliente</Link>
              )}
            </div>
          </div>
          <div className="qr">
            <QRCodeSVG value={link} size={168} marginSize={1} fgColor="#18211E" />
            <p className="muted">Aponte a câmera do celular para abrir a conversa com a mensagem pronta.</p>
          </div>
        </div>
        <p className="nota-rodape">
          Envie aos poucos, algo como 20 a 30 por dia. Disparo em massa faz o WhatsApp bloquear o número.
        </p>
      </div>
    </div>
  )
}
