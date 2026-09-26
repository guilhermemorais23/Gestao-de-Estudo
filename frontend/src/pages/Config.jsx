import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api, urlPublica } from '../api'
import { PASSOS, TONS } from '../mensagens'

const IDIOMAS = { pt: 'Português', en: 'Inglês', es: 'Espanhol' }

export default function Config() {
  const { usuario, setUsuario } = useOutletContext()
  const [form, setForm] = useState({
    nome: usuario.nome, empresa: usuario.empresa || '', whatsapp: usuario.whatsapp || '',
    modelos: usuario.modelos, meta_mensal: usuario.meta_mensal || 4,
  })
  const [aba, setAba] = useState('pt.descontraido')
  const [idiomaAba, tomAba] = aba.split('.')

  function setModelo(passo, texto) {
    const modelos = structuredClone(form.modelos)
    modelos[idiomaAba][tomAba][passo] = texto
    setForm({ ...form, modelos })
  }
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
          <label className="curto">
            Meta de clientes por mês
            <input type="number" min="1" max="100" value={form.meta_mensal} onChange={(e) => setForm({ ...form, meta_mensal: Number(e.target.value) })} />
          </label>
        </div>
        <h2>Mensagens de abordagem</h2>
        <p className="muted">
          Cada lead recebe um tom sorteado para você comparar em Resultados qual funciona melhor. Campos que você
          pode usar: <code>{'{saudacao}'}</code>, <code>{'{empresa}'}</code>, <code>{'{meu_nome}'}</code>,{' '}
          <code>{'{minha_empresa}'}</code>, <code>{'{categoria}'}</code>, <code>{'{nota_texto}'}</code> (nota e
          avaliações do Google) e <code>{'{link}'}</code> (questionário).
        </p>
        <div className="abas-texto">
          {Object.keys(form.modelos).flatMap((idioma) =>
            Object.keys(form.modelos[idioma]).map((tom) => {
              const chave = `${idioma}.${tom}`
              return (
                <button type="button" key={chave} className={aba === chave ? 'chip ativo' : 'chip'} onClick={() => setAba(chave)}>
                  {IDIOMAS[idioma]}{idioma === 'pt' ? `, ${TONS[tom].toLowerCase()}` : ''}
                </button>
              )
            }),
          )}
        </div>
        <div className="modelos-grid">
          {PASSOS.map((p) => (
            <label key={p.id} htmlFor={`modelo-${p.id}`}>
              {p.nome}
              <textarea
                id={`modelo-${p.id}`}
                rows={6}
                value={form.modelos[idiomaAba][tomAba][p.id] || ''}
                onChange={(e) => setModelo(p.id, e.target.value)}
              />
            </label>
          ))}
        </div>
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
