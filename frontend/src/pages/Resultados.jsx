import { useEffect, useState } from 'react'
import { api } from '../api'

// Metas de conversão de cada etapa em relação à anterior (estimativas iniciais, ajuste com seus números)
const ETAPAS = [
  { id: 'contatados', nome: 'Receberam a 1ª mensagem' },
  { id: 'responderam', nome: 'Responderam', meta: 15, dica: 'Teste o outro tom, mande em outro horário ou troque o segmento.' },
  { id: 'previa_aberta', nome: 'Abriram a prévia', meta: 60, dica: 'Mande o vídeo junto: ver a prévia sendo mostrada dá vontade de abrir.' },
  { id: 'proposta_vista', nome: 'Abriram a proposta', meta: 30, dica: 'Faça os retornos do 1º, 3º e 7º dia e ofereça ajustes na prévia.' },
  { id: 'fechados', nome: 'Fecharam', meta: 30, dica: 'Responda rápido quando abrirem a proposta e use as respostas prontas para objeções.' },
]
const MSGS = { 1: '1ª mensagem', 2: 'Retorno 1', 3: 'Retorno 2' }
const DEPOIS = { 1: 'Depois da 1ª mensagem', 2: 'Depois do retorno 1', 3: 'Depois do retorno 2' }

const CENARIOS = {
  cauteloso: { nome: 'Cauteloso', resposta: 10, questionario: 30, fechamento: 20 },
  realista: { nome: 'Realista', resposta: 15, questionario: 35, fechamento: 25 },
  otimista: { nome: 'Otimista', resposta: 20, questionario: 40, fechamento: 30 },
}

const reais = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const pct = (a, b) => (b ? `${Math.min(100, Math.round((a / b) * 100))}%` : '–')

function calcular(c) {
  const conversao = (c.resposta / 100) * (c.questionario / 100) * (c.fechamento / 100)
  const novosMes = conversao ? Math.ceil(c.meta / conversao) : 0
  const novosDia = Math.ceil(novosMes / c.dias)
  // quem não responde recebe até 2 retornos
  const mensagensDia = Math.ceil(novosDia * (1 + 2 * (1 - c.resposta / 100)))
  const vendasMes = c.meta * c.preco
  const assinantesMes = c.meta * (c.adesao / 100)
  const mensalidadeNoMes = (m) => Math.round(assinantesMes * m) * c.mensalidade
  return { conversao, novosMes, novosDia, mensagensDia, vendasMes, mensalidadeNoMes }
}

function Campo({ id, rotulo, sufixo, valor, onChange, passo = 1 }) {
  return (
    <label htmlFor={id}>
      {rotulo}
      <span className="campo-sufixo">
        <input id={id} type="number" min="0" step={passo} value={valor} onChange={(e) => onChange(Number(e.target.value))} />
        {sufixo && <span>{sufixo}</span>}
      </span>
    </label>
  )
}

export default function Resultados() {
  const [m, setM] = useState(null)
  const [conta, setConta] = useState({
    preco: 650, meta: 5, dias: 22, ...CENARIOS.realista, mensalidade: 100, adesao: 60,
  })
  const set = (campo) => (v) => setConta({ ...conta, [campo]: v })

  useEffect(() => {
    api('/leads/metricas').then(setM)
  }, [])

  const r = calcular(conta)
  const g = m?.geral
  const temDados = g && g.contatados >= 20

  function usarMeusNumeros() {
    setConta({
      ...conta,
      resposta: Math.round((g.responderam / g.contatados) * 100),
      questionario: g.responderam ? Math.round((g.questionario_respondido / g.responderam) * 100) : conta.questionario,
      fechamento: g.questionario_respondido ? Math.round((g.fechados / g.questionario_respondido) * 100) : conta.fechamento,
    })
  }

  return (
    <section>
      <header className="cabecalho">
        <h1>Resultados</h1>
        <p>Veja em que etapa as pessoas param de responder e qual tom de mensagem funciona melhor.</p>
      </header>

      {m && g.contatados === 0 && (
        <p className="bloco muted">
          Ainda não há abordagens registradas. Os números aparecem aqui quando você começar a mandar mensagens
          pelo botão Abordar.
        </p>
      )}

      {m && g.contatados > 0 && (
        <>
          <div className="bloco">
            <h2>Metas do funil</h2>
            <div className="metas">
              {ETAPAS.slice(1).map((e, i) => {
                const anterior = g[ETAPAS[i].id]
                const taxa = anterior ? Math.min(100, Math.round((g[e.id] / anterior) * 100)) : null
                const estado = taxa === null || anterior < 10 ? 'poucos' : taxa >= e.meta ? 'ok' : 'baixo'
                return (
                  <div key={e.id} className={`meta-etapa ${estado}`}>
                    <span className="meta-nome">{e.nome}</span>
                    <b>{taxa === null ? '–' : `${taxa}%`}</b>
                    <span className="meta-alvo">meta: {e.meta}% ou mais</span>
                    <p>
                      {estado === 'poucos' && 'Poucos dados ainda. Continue mandando.'}
                      {estado === 'ok' && 'Dentro da meta.'}
                      {estado === 'baixo' && e.dica}
                    </p>
                  </div>
                )
              })}
            </div>
            <p className="muted pequeno">Cada porcentagem é sobre a etapa anterior. As metas são estimativas iniciais baseadas em pesquisas de vendas para pequenos negócios.</p>
          </div>

          <div className="bloco">
            <h2>Onde as pessoas param</h2>
            <div className="tabela-wrap sem-borda">
              <table className="tabela funil-tabela">
                <thead>
                  <tr>
                    <th>Etapa</th>
                    <th>Todos</th>
                    <th>Tom formal</th>
                    <th>Tom descontraído</th>
                  </tr>
                </thead>
                <tbody>
                  {ETAPAS.map((e, i) => (
                    <tr key={e.id}>
                      <td>{e.nome}</td>
                      {['geral', 'formal', 'descontraido'].map((grupo) => {
                        const atual = m[grupo][e.id]
                        const anterior = i ? m[grupo][ETAPAS[i - 1].id] : null
                        return (
                          <td key={grupo} className="num">
                            <div className="barra-celula">
                              <b>{atual}</b>
                              {i > 0 && <span className="muted">{pct(atual, anterior)} da etapa anterior</span>}
                              <span className="barra"><span style={{ width: pct(atual, m[grupo].contatados).replace('–', '0%') }} /></span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted pequeno">
              Com menos de 30 leads em cada tom, a diferença entre eles ainda pode ser sorte. Continue sorteando.
            </p>
          </div>

          <div className="duas-colunas">
            <div className="bloco">
              <h2>Qual mensagem fez responder</h2>
              <ul className="lista-numeros">
                {[1, 2, 3].map((p) => (
                  <li key={p}>
                    <span>{MSGS[p]}</span>
                    <b>{g.respondeu_no_passo[p]}</b>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bloco">
              <h2>Pararam sem responder</h2>
              <ul className="lista-numeros">
                {[1, 2, 3].map((p) => (
                  <li key={p}>
                    <span>{DEPOIS[p]}</span>
                    <b>{g.parou_sem_resposta[p]}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      <div className="bloco">
        <div className="bloco-topo">
          <div>
            <h2>Calculadora de metas</h2>
            <p className="muted">Quantas empresas abordar para fechar a meta do mês, de segunda a sexta.</p>
          </div>
          <div className="acoes">
            {Object.entries(CENARIOS).map(([k, c]) => (
              <button
                key={k}
                className={conta.resposta === c.resposta && conta.questionario === c.questionario && conta.fechamento === c.fechamento ? 'chip ativo' : 'chip'}
                onClick={() => setConta({ ...conta, ...c })}
              >
                {c.nome}
              </button>
            ))}
            {temDados && <button className="chip" onClick={usarMeusNumeros}>Meus números reais</button>}
          </div>
        </div>

        <div className="calc-grid">
          <fieldset>
            <legend>Venda</legend>
            <Campo id="preco" rotulo="Preço médio do site" sufixo="R$" valor={conta.preco} onChange={set('preco')} passo={50} />
            <Campo id="meta" rotulo="Clientes por mês" valor={conta.meta} onChange={set('meta')} />
            <Campo id="dias" rotulo="Dias úteis no mês" valor={conta.dias} onChange={set('dias')} />
          </fieldset>
          <fieldset>
            <legend>Taxas</legend>
            <Campo id="resposta" rotulo="Respondem a abordagem" sufixo="%" valor={conta.resposta} onChange={set('resposta')} />
            <Campo id="questionario" rotulo="Dos que respondem, fazem o questionário" sufixo="%" valor={conta.questionario} onChange={set('questionario')} />
            <Campo id="fechamento" rotulo="Dos que fazem o questionário, fecham" sufixo="%" valor={conta.fechamento} onChange={set('fechamento')} />
          </fieldset>
          <fieldset>
            <legend>Mensalidade</legend>
            <Campo id="mensalidade" rotulo="Valor da manutenção" sufixo="R$/mês" valor={conta.mensalidade} onChange={set('mensalidade')} passo={10} />
            <Campo id="adesao" rotulo="Clientes que assinam" sufixo="%" valor={conta.adesao} onChange={set('adesao')} />
          </fieldset>
        </div>

        <div className="resultado-calc">
          <div className="destaque-calc">
            <span>Novas empresas por dia útil</span>
            <b>{r.novosDia}</b>
            <span className="muted">
              {r.novosMes} por mês. Contando os retornos, cerca de {r.mensagensDia} mensagens por dia.
            </span>
          </div>
          <dl className="numeros-calc">
            <div><dt>A cada 100 abordagens</dt><dd>{(r.conversao * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} vendas</dd></div>
            <div><dt>Vendas de sites no mês</dt><dd>{reais(r.vendasMes)}</dd></div>
            <div><dt>Mensalidades no 6º mês</dt><dd>{reais(r.mensalidadeNoMes(6))}</dd></div>
            <div><dt>Renda no 12º mês</dt><dd>{reais(r.vendasMes + r.mensalidadeNoMes(12))}</dd></div>
          </dl>
          {r.mensagensDia > 40 && (
            <p className="alerta">
              Mais de 40 mensagens por dia aumenta o risco de o WhatsApp bloquear o número. Melhore as taxas antes de
              aumentar o volume.
            </p>
          )}
        </div>
        <p className="muted pequeno">
          As taxas dos cenários são estimativas iniciais, não dados medidos. Depois de umas 30 abordagens, use seus
          números reais.
        </p>
      </div>
    </section>
  )
}
