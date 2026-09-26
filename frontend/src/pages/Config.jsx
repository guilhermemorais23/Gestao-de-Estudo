import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../api'

export default function Config() {
  const { usuario, setUsuario } = useOutletContext()
  const [form, setForm] = useState({
    nome: usuario.nome, empresa: usuario.empresa || '', whatsapp: usuario.whatsapp || '',
    msg_pt: usuario.msg_pt, msg_en: usuario.msg_en, msg_es: usuario.msg_es,
  })
  const [salvo, setSalvo] = useState(false)
  const linkPublico = `${window.location.origin}/q/${usuario.token_publico}`

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  async function salvar(e) {
    e.preventDefault()
    setUsuario(await api('/auth/config', { method: 'PUT', body: form }))
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <section className="config">
      <h1>⚙️ Configurações</h1>
      <form className="card" onSubmit={salvar}>
        <div className="filtros linha">
          <label className="cresce">Seu nome<input value={form.nome} onChange={set('nome')} /></label>
          <label className="cresce">Nome da sua empresa/marca<input value={form.empresa} onChange={set('empresa')} placeholder="ex: GM Sites" /></label>
          <label className="cresce">
            Seu WhatsApp (recebe os clientes)
            <input value={form.whatsapp} onChange={set('whatsapp')} placeholder="83 99999-9999" />
          </label>
        </div>
        <h3>Mensagens de abordagem</h3>
        <p className="muted pequeno">
          Variáveis: <code>{'{empresa}'}</code> nome do cliente, <code>{'{meu_nome}'}</code>, <code>{'{minha_empresa}'}</code>,{' '}
          <code>{'{link}'}</code> link do questionário.
        </p>
        <label>Português<textarea rows={6} value={form.msg_pt} onChange={set('msg_pt')} /></label>
        <label>Inglês<textarea rows={4} value={form.msg_en} onChange={set('msg_en')} /></label>
        <label>Espanhol<textarea rows={4} value={form.msg_es} onChange={set('msg_es')} /></label>
        <button className="btn">{salvo ? 'Salvo ✓' : 'Salvar'}</button>
      </form>

      <div className="card qr-publico">
        <div>
          <h3>Seu link geral do questionário</h3>
          <p className="muted">
            Use no Instagram, cartão de visita ou imprima o QR code. Quem responder aparece em "Respostas".
          </p>
          <input readOnly value={linkPublico} onFocus={(e) => e.target.select()} />
        </div>
        <QRCodeSVG value={linkPublico} size={160} marginSize={2} />
      </div>
    </section>
  )
}
