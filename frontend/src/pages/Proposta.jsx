import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy } from 'lucide-react'
import { DEMO, api, linkWhatsapp, urlPublica } from '../api'
import { codigoPix } from '../pix'
import { IconeWhatsapp } from '../components/Icones'

const reais = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: v % 1 ? 2 : 0 })

export default function Proposta() {
  const { token } = useParams()
  const [d, setD] = useState(null)
  const [erro, setErro] = useState('')
  const [escolhido, setEscolhido] = useState(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    api(`/publico/proposta/${token}`)
      .then((r) => {
        setD(r)
        setEscolhido(r.escolha || r.recomendado)
      })
      .catch((e) => setErro(e.message))
  }, [token])

  useEffect(() => {
    if (d) document.title = `Proposta para ${d.empresa}`
  }, [d])

  if (erro) return <div className="publico"><p className="erro">{erro}</p></div>
  if (!d) return <div className="publico"><p className="muted">Carregando</p></div>

  const pacote = d.pacotes.find((p) => p.id === escolhido)
  const entrada = pacote ? Math.round(pacote.preco * d.entrada_percentual) / 100 : 0
  const pix = d.pix && pacote && entrada > 0 ? codigoPix({ ...d.pix, valor: entrada }) : null
  const vendedor = d.vendedor.empresa || d.vendedor.nome
  const msg = pacote
    ? `Oi! Escolhi o pacote ${pacote.nome} para a ${d.empresa}${pix ? ` e vou pagar a entrada de ${reais(entrada)} pelo PIX` : ''}. ${urlPublica(`/proposta/${token}`)}`
    : ''
  const validade = d.valida_ate ? new Date(d.valida_ate).toLocaleDateString('pt-BR') : null

  async function escolher(id) {
    setEscolhido(id)
    await api(`/publico/proposta/${token}/escolha`, { method: 'POST', body: { pacote: id } }).catch(() => {})
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pix)
    } catch {
      document.getElementById('pix-codigo')?.select()
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="proposta-pagina">
      {DEMO && <Link className="voltar-demo" to="/leads">Voltar ao painel</Link>}
      <header className="pr-topo">
        <p className="q-marca">{vendedor}</p>
        <h1>Proposta para {d.empresa}</h1>
        <p className="muted">
          {d.contato ? `${d.contato}, a` : 'A'}qui estão as opções para colocar o site da {d.empresa} no ar.
          {validade && ` Valores válidos até ${validade}.`}
        </p>
        <Link className="btn-texto" to={`/p/${token}`}>Ver a prévia do site de novo</Link>
      </header>

      <section className="pr-pacotes" aria-label="Pacotes">
        {d.pacotes.map((p) => (
          <article key={p.id} className={`pr-pacote ${escolhido === p.id ? 'escolhido' : ''}`}>
            {p.id === d.recomendado && <span className="pr-selo">Recomendado para vocês</span>}
            <h2>{p.nome}</h2>
            <p className="pr-preco">
              <b>{reais(p.preco)}</b>
              {p.mensalidade > 0 && <span> + {reais(p.mensalidade)}/mês</span>}
            </p>
            <p className="pr-desc">{p.descricao}</p>
            <ul>{p.itens.map((i) => <li key={i}><Check size={16} /> {i}</li>)}</ul>
            <p className="pr-prazo">Pronto em até {p.prazo_dias} dias úteis</p>
            <button className={escolhido === p.id ? 'btn grande' : 'btn btn-secundario grande'} onClick={() => escolher(p.id)}>
              {escolhido === p.id ? 'Pacote escolhido' : 'Escolher este'}
            </button>
          </article>
        ))}
      </section>

      {pacote && (
        <section className="pr-pagamento">
          <div className="pr-pag-texto">
            <h2>Como fica o pagamento</h2>
            <dl>
              <div><dt>Entrada para começar ({d.entrada_percentual}%)</dt><dd>{reais(entrada)}</dd></div>
              {d.entrada_percentual < 100 && <div><dt>Na entrega, com o site aprovado</dt><dd>{reais(pacote.preco - entrada)}</dd></div>}
              {pacote.mensalidade > 0 && <div><dt>Mensalidade, a partir do 2º mês</dt><dd>{reais(pacote.mensalidade)}</dd></div>}
            </dl>
            <p className="muted">
              Depois de pagar a entrada, me mande o comprovante pelo WhatsApp. O prazo começa a contar a partir daí.
            </p>
            {d.vendedor.whatsapp && (
              <a className="btn grande" href={linkWhatsapp(d.vendedor.whatsapp, msg)} target="_blank" rel="noreferrer">
                <IconeWhatsapp size={17} /> Confirmar pelo WhatsApp
              </a>
            )}
          </div>
          {pix ? (
            <div className="pr-pix">
              <p className="pr-pix-titulo">Pague a entrada com PIX</p>
              <QRCodeSVG value={pix} size={176} marginSize={1} />
              <p className="muted pequeno">Abra o app do banco, escolha PIX e leia o código, ou copie abaixo.</p>
              <textarea id="pix-codigo" readOnly rows={3} value={pix} onFocus={(e) => e.target.select()} aria-label="PIX copia e cola" />
              <button className="btn btn-secundario" onClick={copiar}><Copy size={15} /> {copiado ? 'Código copiado' : 'Copiar código PIX'}</button>
              <p className="pequeno muted">Recebedor: {d.pix.nome}</p>
            </div>
          ) : (
            <div className="pr-pix">
              <p className="muted">Combine a forma de pagamento pelo WhatsApp.</p>
            </div>
          )}
        </section>
      )}

      <section className="pr-duvidas">
        <h2>Dúvidas comuns</h2>
        <details><summary>O que acontece depois que eu pago a entrada?</summary><p>Eu confirmo o recebimento, ajusto a prévia com vocês e coloco o site no ar no prazo do pacote.</p></details>
        <details><summary>O domínio (o endereço do site) fica no nome de quem?</summary><p>No nome da empresa de vocês. O site e o endereço são de vocês.</p></details>
        <details><summary>Posso pedir alterações depois?</summary><p>Sim. Nos pacotes com mensalidade, alterações de texto, foto e preço estão incluídas. Sem mensalidade, cada alteração é combinada à parte.</p></details>
      </section>
    </div>
  )
}
