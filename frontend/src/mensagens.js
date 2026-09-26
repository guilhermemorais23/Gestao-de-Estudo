import { urlPublica } from './api'

export const PASSOS = [
  { id: 'abertura', nome: '1ª mensagem', ajuda: 'Curta e sem link. Termina com uma pergunta.' },
  { id: 'questionario', nome: 'Questionário', ajuda: 'Mande só depois que a pessoa responder.' },
  { id: 'retorno1', nome: 'Retorno 1', ajuda: `Se não respondeu em 2 dias. Traz um argumento novo.` },
  { id: 'retorno2', nome: 'Retorno 2', ajuda: 'Se continuou sem resposta. Encerra com educação.' },
]

export const TONS = { formal: 'Formal', descontraido: 'Descontraído' }

// Qual mensagem faz sentido mandar agora para esse lead
export function proximoPasso(lead) {
  if (lead.respondeu) return 'questionario'
  if (lead.passo >= 2) return 'retorno2'
  if (lead.passo === 1) return 'retorno1'
  return 'abertura'
}

// Onde o lead está na sequência, em texto curto
export function situacaoContato(lead) {
  if (['fechado', 'perdido'].includes(lead.status)) return ''
  if (lead.status === 'questionario') return 'Respondeu o questionário'
  if (lead.questionario_enviado) return 'Questionário enviado, aguardando'
  if (lead.respondeu) return 'Respondeu, falta mandar o questionário'
  if (!lead.passo) return 'Ainda não abordado'
  const nomes = { 1: '1ª mensagem enviada', 2: 'Retorno 1 enviado', 3: 'Retorno 2 enviado' }
  return `${nomes[lead.passo]} ${haQuanto(lead.ultimo_envio_em)}`
}

export function haQuanto(data) {
  if (!data) return ''
  const dias = Math.floor((Date.now() - new Date(data + 'Z').getTime()) / 86400000)
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  return `há ${dias} dias`
}

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function modeloDe(usuario, lead, passo, tom) {
  const porIdioma = usuario.modelos?.[lead.idioma] || usuario.modelos?.pt || {}
  const doTom = porIdioma[tom] || porIdioma.formal || Object.values(porIdioma)[0] || {}
  return doTom[passo] || ''
}

export function montarMensagem(usuario, lead, passo, tom) {
  const nota =
    lead.avaliacao && lead.num_avaliacoes >= 10
      ? { pt: ` com nota ${String(lead.avaliacao).replace('.', ',')} em ${lead.num_avaliacoes} avaliações`,
          en: ` rated ${lead.avaliacao} from ${lead.num_avaliacoes} reviews`,
          es: ` con nota ${String(lead.avaliacao).replace('.', ',')} en ${lead.num_avaliacoes} reseñas` }[lead.idioma] || ''
      : ''
  const categoria = (lead.categoria || '').toLowerCase() || { pt: 'esse tipo de serviço', en: 'a business like yours', es: 'este tipo de servicio' }[lead.idioma]
  const nomeEmpresa = lead.nome.replace(/\s*\((exemplo|example)\)$/i, '')
  return modeloDe(usuario, lead, passo, tom)
    .replaceAll('{saudacao}', saudacao())
    .replaceAll('{empresa}', nomeEmpresa)
    .replaceAll('{meu_nome}', usuario.nome)
    .replaceAll('{minha_empresa}', usuario.empresa ? `, da ${usuario.empresa}` : '')
    .replaceAll('{categoria}', categoria)
    .replaceAll('{nota_texto}', nota)
    .replaceAll('{link}', urlPublica(`/q/${lead.token}`))
}
