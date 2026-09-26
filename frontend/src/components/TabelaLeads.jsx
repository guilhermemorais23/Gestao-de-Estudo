import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api'
import WhatsappModal from './WhatsappModal'

export const STATUS = {
  novo: 'Novo',
  contatado: 'Contatado',
  respondeu: 'Respondeu',
  proposta: 'Proposta enviada',
  fechado: 'Fechado ✅',
  perdido: 'Perdido',
}

function corScore(score) {
  if (score >= 70) return 'quente'
  if (score >= 45) return 'morno'
  return 'frio'
}

export default function TabelaLeads({ leads, setLeads, mostrarGestao = true }) {
  const { usuario } = useOutletContext()
  const [aberto, setAberto] = useState(null)

  function substituir(atualizado) {
    setLeads((lista) => lista.map((l) => (l.id === atualizado.id ? atualizado : l)))
  }

  async function mudar(lead, campos) {
    substituir(await api(`/leads/${lead.id}`, { method: 'PATCH', body: campos }))
  }

  async function excluir(lead) {
    if (!confirm(`Excluir ${lead.nome}?`)) return
    await api(`/leads/${lead.id}`, { method: 'DELETE' })
    setLeads((lista) => lista.filter((l) => l.id !== lead.id))
  }

  if (!leads.length) return <p className="muted">Nenhum lead por aqui.</p>

  return (
    <>
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th title="Quanto maior, mais chance de fechar">Score</th>
              <th>Empresa</th>
              <th>Contato</th>
              <th>Google</th>
              {mostrarGestao && <th>Status</th>}
              {mostrarGestao && <th>Notas</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td><span className={`score ${corScore(l.score)}`}>{l.score}</span></td>
                <td>
                  <strong>{l.nome}</strong>
                  <div className="muted pequeno">{l.categoria} · {l.endereco || l.cidade}</div>
                  <div className="etiquetas">
                    {l.so_rede_social ? (
                      <a className="etiqueta rosa" href={l.website} target="_blank" rel="noreferrer">só rede social</a>
                    ) : (
                      <span className="etiqueta">sem site</span>
                    )}
                    {l.fonte !== 'google' && <span className="etiqueta cinza">{l.fonte}</span>}
                    {l.regiao === 'exterior' && <span className="etiqueta azul">{l.idioma.toUpperCase()}</span>}
                  </div>
                </td>
                <td className="nowrap">
                  {l.telefone || <span className="muted">sem telefone</span>}
                  {l.whatsapp_provavel && <div className="pequeno verde-txt">provável WhatsApp</div>}
                </td>
                <td className="nowrap">
                  {l.avaliacao ? `⭐ ${l.avaliacao} (${l.num_avaliacoes})` : '—'}
                  {l.maps_url && (
                    <div><a className="pequeno" href={l.maps_url} target="_blank" rel="noreferrer">ver no Maps</a></div>
                  )}
                </td>
                {mostrarGestao && (
                  <td>
                    <select value={l.status} onChange={(e) => mudar(l, { status: e.target.value })}>
                      {Object.entries(STATUS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                    </select>
                  </td>
                )}
                {mostrarGestao && (
                  <td>
                    <textarea
                      className="notas"
                      defaultValue={l.notas}
                      placeholder="Anotações…"
                      onBlur={(e) => e.target.value !== l.notas && mudar(l, { notas: e.target.value })}
                    />
                  </td>
                )}
                <td className="nowrap">
                  <button className="btn verde pequeno-btn" onClick={() => setAberto(l)}>WhatsApp</button>
                  {mostrarGestao && <button className="btn-link perigo" onClick={() => excluir(l)}>excluir</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {aberto && (
        <WhatsappModal
          usuario={usuario}
          lead={aberto}
          onFechar={() => setAberto(null)}
          onAtualizado={substituir}
        />
      )}
    </>
  )
}
