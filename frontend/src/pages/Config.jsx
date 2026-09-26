import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Plus, Trash2 } from 'lucide-react'
import { api, urlPublica } from '../api'
import { PASSOS, TONS } from '../mensagens'

const IDIOMAS = { pt: 'Português', en: 'Inglês', es: 'Espanhol' }

// Produto de entrada: mais barato que o site, abre a porta para vender o site depois
const PACOTE_GOOGLE = {
  id: 'google', nome: 'Otimização do Google', preco: 250, mensalidade: 0, prazo_dias: 3, recomendado: false,
  descricao: 'Deixa o perfil da empresa no Google Maps completo para aparecer melhor nas buscas do bairro.',
  itens: ['Descrição completa com os serviços', 'Horários, categorias e área de atendimento revisados', 'Fotos organizadas', 'Link direto para o WhatsApp', 'Estratégia simples para ganhar mais avaliações'],
}

export default function Config() {
  const { usuario, setUsuario } = useOutletContext()
  const [form, setForm] = useState({
    nome: usuario.nome, empresa: usuario.empresa || '', whatsapp: usuario.whatsapp || '',
    modelos: usuario.modelos, meta_mensal: usuario.meta_mensal || 4,
    pacotes: usuario.pacotes || [], pix_chave: usuario.pix_chave || '', pix_nome: usuario.pix_nome || '',
    pix_cidade: usuario.pix_cidade || '', entrada_percentual: usuario.entrada_percentual ?? 50,
    limite_diario: usuario.limite_diario || 20,
  })

  function setPacote(i, campo, valor) {
    setForm({ ...form, pacotes: form.pacotes.map((p, j) => (j === i ? { ...p, [campo]: valor } : campo === 'recomendado' ? { ...p, recomendado: false } : p)) })
  }
  function novoPacote() {
    setForm({ ...form, pacotes: [...form.pacotes, { id: `pacote${Date.now()}`, nome: 'Novo pacote', preco: 0, mensalidade: 0, prazo_dias: 7, descricao: '', itens: [], recomendado: false }] })
  }
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
    const pacotes = form.pacotes.map((p) => ({ ...p, itens: p.itens.map((x) => x.trim()).filter(Boolean) }))
    setUsuario(await api('/auth/config', { method: 'PUT', body: { ...form, pacotes } }))
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
          <label className="curto" htmlFor="limite">
            Limite de mensagens por dia
            <input id="limite" type="number" min="1" max="500" value={form.limite_diario} onChange={(e) => setForm({ ...form, limite_diario: Number(e.target.value) })} />
          </label>
          <label className="curto">
            Meta de clientes por mês
            <input type="number" min="1" max="100" value={form.meta_mensal} onChange={(e) => setForm({ ...form, meta_mensal: Number(e.target.value) })} />
          </label>
        </div>
        <h2>Mensagens de abordagem</h2>
        <p className="muted">
          Cada lead recebe um tom sorteado para você comparar em Resultados qual funciona melhor. Campos que você
          pode usar: <code>{'{onde_atuo}'}</code> (vira "aqui em João Pessoa" ou "em João Pessoa e atendo toda a
          Paraíba", conforme a cidade da empresa), <code>{'{saudacao}'}</code>, <code>{'{empresa}'}</code>, <code>{'{meu_nome}'}</code>,{' '}
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
        <h2>Pacotes da proposta</h2>
        <p className="muted">É o que o cliente vê na página de proposta. O pacote marcado como recomendado aparece em destaque.</p>
        <div className="pacotes-editor">
          {form.pacotes.map((p, i) => (
            <fieldset key={p.id} className="pacote-editor">
              <div className="pacote-linha">
                <label className="cresce" htmlFor={`pn-${i}`}>Nome<input id={`pn-${i}`} value={p.nome} onChange={(e) => setPacote(i, 'nome', e.target.value)} /></label>
                <label htmlFor={`pp-${i}`}>Preço (R$)<input id={`pp-${i}`} type="number" min="0" step="10" value={p.preco} onChange={(e) => setPacote(i, 'preco', Number(e.target.value))} /></label>
                <label htmlFor={`pm-${i}`}>Mensalidade (R$)<input id={`pm-${i}`} type="number" min="0" step="10" value={p.mensalidade} onChange={(e) => setPacote(i, 'mensalidade', Number(e.target.value))} /></label>
                <label htmlFor={`pz-${i}`}>Prazo (dias úteis)<input id={`pz-${i}`} type="number" min="1" value={p.prazo_dias} onChange={(e) => setPacote(i, 'prazo_dias', Number(e.target.value))} /></label>
              </div>
              <label htmlFor={`pd-${i}`}>Descrição<input id={`pd-${i}`} value={p.descricao} onChange={(e) => setPacote(i, 'descricao', e.target.value)} /></label>
              <label htmlFor={`pi-${i}`}>O que está incluso (um por linha)
                <textarea id={`pi-${i}`} rows={4} value={p.itens.join('\n')} onChange={(e) => setPacote(i, 'itens', e.target.value.split('\n'))} />
              </label>
              <div className="pacote-rodape">
                <label className="check"><input type="radio" name="recomendado" checked={!!p.recomendado} onChange={() => setPacote(i, 'recomendado', true)} /> Recomendado</label>
                <button type="button" className="btn-texto perigo" onClick={() => setForm({ ...form, pacotes: form.pacotes.filter((_, j) => j !== i) })}><Trash2 size={15} /> Remover</button>
              </div>
            </fieldset>
          ))}
          <div className="acoes">
            <button type="button" className="btn-texto" onClick={novoPacote}><Plus size={15} /> Adicionar pacote</button>
            {!form.pacotes.some((p) => p.id === 'google') && (
              <button type="button" className="btn-texto" onClick={() => setForm({ ...form, pacotes: [...form.pacotes, structuredClone(PACOTE_GOOGLE)] })}>
                <Plus size={15} /> Adicionar "Otimização do Google" (porta de entrada)
              </button>
            )}
          </div>
        </div>

        <h2>Pagamento com PIX</h2>
        <p className="muted">Com a chave preenchida, a proposta mostra o QR code e o código copia e cola da entrada, já com o valor.</p>
        <div className="filtros">
          <label htmlFor="pix-chave">Chave PIX<input id="pix-chave" value={form.pix_chave} onChange={set('pix_chave')} placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória" /></label>
          <label htmlFor="pix-nome">Nome do recebedor<input id="pix-nome" value={form.pix_nome} onChange={set('pix_nome')} placeholder="Como aparece no banco" /></label>
          <label htmlFor="pix-cidade">Cidade<input id="pix-cidade" value={form.pix_cidade} onChange={set('pix_cidade')} placeholder="João Pessoa" /></label>
          <label className="curto" htmlFor="entrada">Entrada (%)<input id="entrada" type="number" min="0" max="100" value={form.entrada_percentual} onChange={(e) => setForm({ ...form, entrada_percentual: Number(e.target.value) })} /></label>
        </div>
        <p className="muted pequeno">Celular como chave PIX vai com +55 e DDD, por exemplo +5583999990000.</p>

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
