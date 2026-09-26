import { Fragment, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ExternalLink, Trash2 } from 'lucide-react'
import { api } from '../api'
import WhatsappModal from './WhatsappModal'
import { IconeWhatsapp } from './Icones'

export const STATUS = {
  novo: 'Novo',
  contatado: 'Contatado',
  respondeu: 'Respondeu',
  proposta: 'Proposta enviada',
  fechado: 'Fechado',
  perdido: 'Perdido',
}

function temperatura(score) {
  if (score >= 70) return { classe: 'quente', texto: 'Quente' }
  if (score >= 45) return { classe: 'morno', texto: 'Morno' }
  return { classe: 'frio', texto: 'Frio' }
}

export default function TabelaLeads({ leads, setLeads, mostrarGestao = true }) {
  const { usuario } = useOutletContext()
  const [aberto, setAberto] = useState(null)
  const [confirmando, setConfirmando] = useState(null)

  function substituir(atualizado) {
    setLeads((lista) => lista.map((l) => (l.id === atualizado.id ? atualizado : l)))
  }

  async function mudar(lead, campos) {
    substituir(await api(`/leads/${lead.id}`, { method: 'PATCH', body: campos }))
  }

  async function excluir(lead) {
    setConfirmando(null)
    await api(`/leads/${lead.id}`, { method: 'DELETE' })
    setLeads((lista) => lista.filter((l) => l.id !== lead.id))
  }

  if (!leads.length) return <p className="vazio">Nenhum lead encontrado com esses filtros.</p>

  return (
    <>
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Empresa</th>
              <th title="De 0 a 100. Considera falta de site, WhatsApp e movimento no Google.">Potencial</th>
              <th>Contato</th>
              <th>No Google</th>
              {mostrarGestao && <th>Etapa</th>}
              {mostrarGestao && <th>Anotações</th>}
              <th><span className="sr">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => {
              const temp = temperatura(l.score)
              return (
                <tr key={l.id}>
                  <td className="col-empresa">
                    <strong>{l.nome}</strong>
                    <span className="sub">{[l.categoria, l.endereco || l.cidade].filter(Boolean).join(', ')}</span>
                    <span className="sub">
                      {l.so_rede_social ? (
                        <>Só tem <a href={l.website} target="_blank" rel="noreferrer">rede social</a></>
                      ) : (
                        'Sem site'
                      )}
                      {l.regiao === 'exterior' && `, mensagem em ${{ pt: 'português', en: 'inglês', es: 'espanhol' }[l.idioma]}`}
                    </span>
                  </td>
                  <td>
                    <span className={`potencial ${temp.classe}`}>
                      <b>{l.score}</b> {temp.texto}
                    </span>
                  </td>
                  <td className="nowrap">
                    {l.telefone || <span className="muted">Sem telefone</span>}
                    <span className="sub">{l.whatsapp_provavel ? 'Celular, deve ter WhatsApp' : l.telefone ? 'Parece fixo' : ''}</span>
                  </td>
                  <td className="nowrap">
                    {l.avaliacao ? (
                      <>
                        {String(l.avaliacao).replace('.', ',')} <span className="muted">({l.num_avaliacoes} avaliações)</span>
                      </>
                    ) : (
                      <span className="muted">Sem avaliações</span>
                    )}
                    {l.maps_url && (
                      <a className="sub link-icone" href={l.maps_url} target="_blank" rel="noreferrer">
                        Abrir no Maps <ExternalLink size={12} />
                      </a>
                    )}
                  </td>
                  {mostrarGestao && (
                    <td>
                      <select aria-label="Etapa" value={l.status} onChange={(e) => mudar(l, { status: e.target.value })}>
                        {Object.entries(STATUS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                      </select>
                    </td>
                  )}
                  {mostrarGestao && (
                    <td>
                      <textarea
                        aria-label="Anotações"
                        className="notas"
                        defaultValue={l.notas}
                        placeholder="Anotar"
                        onBlur={(e) => e.target.value !== l.notas && mudar(l, { notas: e.target.value })}
                      />
                    </td>
                  )}
                  <td className="col-acoes">
                    <button className="btn btn-pequeno" onClick={() => setAberto(l)}>
                      <IconeWhatsapp size={15} /> Abordar
                    </button>
                    {mostrarGestao && (confirmando === l.id ? (
                      <Fragment>
                        <button className="btn-texto perigo" onClick={() => excluir(l)}>Excluir</button>
                        <button className="btn-texto" onClick={() => setConfirmando(null)}>Manter</button>
                      </Fragment>
                    ) : (
                      <button className="icone-btn" title="Excluir lead" aria-label="Excluir lead" onClick={() => setConfirmando(l.id)}>
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    ))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {aberto && (
        <WhatsappModal usuario={usuario} lead={aberto} onFechar={() => setAberto(null)} onAtualizado={substituir} />
      )}
    </>
  )
}
