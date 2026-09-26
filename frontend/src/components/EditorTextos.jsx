import { useState } from 'react'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { api } from '../api'

// Mostra e edita os textos da prévia gerados pela IA. Nada vai para o cliente sem você salvar.
export default function EditorTextos({ briefing, ia, onAtualizado }) {
  const [textos, setTextos] = useState(briefing.textos)
  const [gerando, setGerando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  async function gerar() {
    setErro('')
    setGerando(true)
    try {
      const b = await api(`/briefings/${briefing.id}/gerar-textos`, { method: 'POST' })
      setTextos(b.textos)
      onAtualizado(b)
    } catch (e) {
      setErro(e.message)
    } finally {
      setGerando(false)
    }
  }

  async function salvar() {
    setSalvando(true)
    setErro('')
    try {
      onAtualizado(await api(`/briefings/${briefing.id}/textos`, { method: 'PUT', body: textos }))
      setSalvo(true)
      setTimeout(() => setSalvo(false), 1800)
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  const set = (campo) => (e) => setTextos({ ...textos, [campo]: e.target.value })
  const setServico = (i, campo, valor) =>
    setTextos({ ...textos, servicos: textos.servicos.map((s, j) => (j === i ? { ...s, [campo]: valor } : s)) })
  const setDif = (i, valor) => setTextos({ ...textos, diferenciais: textos.diferenciais.map((d, j) => (j === i ? valor : d)) })

  if (!textos) {
    return (
      <div className="ia-vazio">
        <div>
          <strong>Textos da prévia</strong>
          <p className="muted">
            A IA transforma as respostas em título, descrição dos serviços e chamada para o WhatsApp. Você revisa
            antes de mandar.
            {ia && !ia.configurada && ' Para usar, coloque a ANTHROPIC_API_KEY no backend/.env.'}
          </p>
        </div>
        <button className="btn btn-ia" onClick={gerar} disabled={gerando || (ia && !ia.configurada)}>
          <Sparkles size={16} /> {gerando ? 'Escrevendo' : 'Gerar textos com IA'}
        </button>
        {erro && <p className="erro">{erro}</p>}
      </div>
    )
  }

  const id = (nome) => `t-${briefing.id}-${nome}`
  return (
    <div className="ia-editor">
      <div className="ia-topo">
        <div>
          <strong>Textos da prévia</strong>
          <p className="muted pequeno">
            {briefing.textos_modelo ? `Escritos por ${ia?.modelos?.[briefing.textos_modelo] || briefing.textos_modelo}. ` : ''}
            Revise, ajuste o que quiser e salve.
          </p>
        </div>
        <button className="btn-texto" onClick={gerar} disabled={gerando}>
          <Sparkles size={15} /> {gerando ? 'Escrevendo' : 'Gerar de novo'}
        </button>
      </div>
      <div className="ia-campos">
        <label htmlFor={id('titulo')}>Título<input id={id('titulo')} value={textos.titulo} onChange={set('titulo')} /></label>
        <label htmlFor={id('subtitulo')}>Subtítulo<input id={id('subtitulo')} value={textos.subtitulo} onChange={set('subtitulo')} /></label>
        <label htmlFor={id('sobre')} className="largo">Sobre<textarea id={id('sobre')} rows={3} value={textos.sobre} onChange={set('sobre')} /></label>
        <div className="largo">
          <span className="rotulo">Serviços</span>
          <div className="ia-lista">
            {textos.servicos.map((s, i) => (
              <div key={i} className="ia-servico">
                <input aria-label="Nome do serviço" value={s.nome} onChange={(e) => setServico(i, 'nome', e.target.value)} />
                <input aria-label="Descrição do serviço" value={s.descricao} onChange={(e) => setServico(i, 'descricao', e.target.value)} />
                <button className="icone-btn" aria-label="Remover serviço" onClick={() => setTextos({ ...textos, servicos: textos.servicos.filter((_, j) => j !== i) })}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {textos.servicos.length < 8 && (
              <button className="btn-texto" onClick={() => setTextos({ ...textos, servicos: [...textos.servicos, { nome: '', descricao: '' }] })}>
                <Plus size={15} /> Adicionar serviço
              </button>
            )}
          </div>
        </div>
        <div className="largo">
          <span className="rotulo">Diferenciais</span>
          <div className="ia-lista">
            {textos.diferenciais.map((d, i) => (
              <input key={i} aria-label={`Diferencial ${i + 1}`} value={d} onChange={(e) => setDif(i, e.target.value)} />
            ))}
          </div>
        </div>
        <label htmlFor={id('chamada')}>Chamada final<input id={id('chamada')} value={textos.chamada_final} onChange={set('chamada_final')} /></label>
        <label htmlFor={id('botao')}>Texto do botão<input id={id('botao')} value={textos.texto_botao} onChange={set('texto_botao')} /></label>
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button className="btn" onClick={salvar} disabled={salvando}>{salvo ? 'Textos salvos' : salvando ? 'Salvando' : 'Salvar textos'}</button>
    </div>
  )
}
