import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api, urlPublica } from '../api'

export default function Config() {
  const { usuario, setUsuario } = useOutletContext()
  const [form, setForm] = useState({
    nome: usuario.nome, empresa: usuario.empresa || '', whatsapp: usuario.whatsapp || '',
    msg_pt: usuario.msg_pt, msg_en: usuario.msg_en, msg_es: usuario.msg_es,
  })
  const [salvo, setSalvo] = useState(false)
  const linkPublico = urlPublica(`/q/${usuario.token_publico}`)

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  async function salvar(e) {
    e.preventDefault()
    setUsuario(await api('/auth/config', { method: 'PUT', body: form }))
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <section className="config">
      <header className="cabecalho">
        <h1>Configurações</h1>
        <p>Seus dados aparecem nas mensagens e nas prévias que o cliente recebe.</p>
      </header>
      <form className="bloco" onSubmit={salvar}>
        <div className="filtros linha">
          <label className="cresce">Seu nome<input value={form.nome} onChange={set('nome')} /></label>
          <label className="cresce">Nome da sua empresa/marca<input value={form.empresa} onChange={set('empresa')} placeholder="ex: GM Sites" /></label>
          <label className="cresce">
            Seu WhatsApp (recebe os clientes)
            <input value={form.whatsapp} onChange={set('whatsapp')} placeholder="83 99999-9999" />
          </label>
        </div>
        <h2>Mensagens de abordagem</h2>
        <p className="muted">
          Use estes campos no texto: <code>{'{empresa}'}</code> para o nome do cliente, <code>{'{meu_nome}'}</code>, <code>{'{minha_empresa}'}</code> e{' '}
          <code>{'{link}'}</code> para o link do questionário.
        </p>
        <label>Português<textarea rows={6} value={form.msg_pt} onChange={set('msg_pt')} /></label>
        <label>Inglês<textarea rows={4} value={form.msg_en} onChange={set('msg_en')} /></label>
        <label>Espanhol<textarea rows={4} value={form.msg_es} onChange={set('msg_es')} /></label>
        <button className="btn">{salvo ? 'Salvo' : 'Salvar alterações'}</button>
      </form>

      <div className="bloco qr-publico">
        <div>
          <h2>Link geral do questionário</h2>
          <p className="muted">
            Coloque na bio do Instagram, no cartão de visita ou imprima o QR code. Quem responder aparece em Respostas.
          </p>
          <input readOnly value={linkPublico} onFocus={(e) => e.target.select()} />
        </div>
        <QRCodeSVG value={linkPublico} size={148} marginSize={1} fgColor="#18211E" />
      </div>
    </section>
  )
}
