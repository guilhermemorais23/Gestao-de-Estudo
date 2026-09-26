import { urlPublica } from './api'

// Todas as mensagens editáveis em Configurações, agrupadas nas abas da janela de abordagem
export const PASSOS = [
  { id: 'abertura', aba: 'abertura', nome: '1ª mensagem', ajuda: 'Curta e sem link. Termina com uma pergunta.' },
  { id: 'previa', aba: 'previa', nome: 'Prévia', ajuda: 'Depois que a pessoa responder: mande a prévia pronta do site.' },
  { id: 'video', aba: 'video', nome: 'Vídeo', ajuda: 'Grave a tela mostrando a prévia e mande junto com este texto. É o que mais aumenta resposta.' },
  { id: 'proposta', aba: 'proposta', nome: 'Proposta', ajuda: 'Pacotes, prazo e PIX da entrada. Mande quando a pessoa gostar da prévia.' },
  { id: 'retorno1', aba: 'retornos', nome: 'Sem resposta, 2º dia', ajuda: 'Não respondeu a 1ª mensagem: traga um argumento novo.' },
  { id: 'retorno2', aba: 'retornos', nome: 'Sem resposta, encerrar', ajuda: 'Última tentativa, com educação. Costuma trazer respostas.' },
  { id: 'pos1', aba: 'retornos', nome: 'Após a prévia, 1º dia', ajuda: 'Pergunte se conseguiu ver e ofereça ajustes.' },
  { id: 'pos2', aba: 'retornos', nome: 'Após a prévia, 3º dia', ajuda: 'Um benefício novo e a oferta de mandar a proposta.' },
  { id: 'pos3', aba: 'retornos', nome: 'Após a prévia, 7º dia', ajuda: 'Encerramento educado, deixando a porta aberta.' },
  { id: 'obj_instagram', aba: 'objecoes', nome: '"Já tenho Instagram"', ajuda: 'Site e Instagram fazem coisas diferentes.' },
  { id: 'obj_caro', aba: 'objecoes', nome: '"Tá caro"', ajuda: 'Ofereça a entrada menor e mostre que se paga.' },
  { id: 'obj_pensar', aba: 'objecoes', nome: '"Vou pensar"', ajuda: 'Descubra a dúvida real com uma pergunta.' },
  { id: 'obj_nao_preciso', aba: 'objecoes', nome: '"Não preciso"', ajuda: 'O site também organiza o atendimento.' },
  { id: 'obj_preco', aba: 'objecoes', nome: '"Quanto custa?"', ajuda: 'Mande a proposta com as opções.' },
  { id: 'questionario', aba: 'questionario', nome: 'Questionário', ajuda: 'Opcional: para o dono contar mais e personalizar a prévia.' },
]

export const ABAS = [
  { id: 'abertura', nome: '1ª mensagem' },
  { id: 'previa', nome: 'Prévia' },
  { id: 'video', nome: 'Vídeo' },
  { id: 'proposta', nome: 'Proposta' },
  { id: 'retornos', nome: 'Retornos' },
  { id: 'objecoes', nome: 'Objeções' },
  { id: 'questionario', nome: 'Questionário' },
]

// O backend registra o vídeo como envio da prévia e as objeções só como contato
export function passoDoEnvio(passo) {
  if (passo === 'video') return 'previa'
  if (passo.startsWith('obj_')) return 'objecao'
  return passo
}

export const TONS = { formal: 'Formal', descontraido: 'Descontraído' }

// Qual mensagem faz sentido mandar agora para esse lead
export function proximoPasso(lead) {
  if (lead.proposta_escolha || lead.status === 'fechado') return 'proposta'
  if (lead.previa_enviada_em) {
    // abriu a prévia e ainda não recebeu a proposta: é hora da proposta
    if (lead.previa_vista_em && !lead.proposta_enviada_em) return 'proposta'
    const pos = lead.pos_passo || 0
    return pos < 3 ? `pos${pos + 1}` : 'proposta'
  }
  if (lead.respondeu) return 'previa'
  if (lead.passo >= 2) return 'retorno2'
  if (lead.passo === 1) return 'retorno1'
  return 'abertura'
}

// Onde o lead está na sequência, em texto curto
export function situacaoContato(lead) {
  if (['fechado', 'perdido'].includes(lead.status)) return ''
  if (lead.proposta_escolha) return `Escolheu um pacote na proposta ${haQuanto(lead.proposta_escolha_em)}`
  if (lead.proposta_vista_em) return `Abriu a proposta ${haQuanto(lead.proposta_vista_em)}`
  if (lead.proposta_enviada_em) return `Proposta enviada ${haQuanto(lead.proposta_enviada_em)}`
  if (lead.previa_vista_em) {
    const vezes = lead.previa_visualizacoes > 1 ? ` (${lead.previa_visualizacoes} vezes)` : ''
    return `Abriu a prévia ${haQuanto(lead.previa_ultima_vista_em)}${vezes}`
  }
  if (lead.previa_enviada_em) {
    const pos = lead.pos_passo ? `, ${lead.pos_passo}º retorno feito` : ''
    return `Prévia enviada ${haQuanto(lead.previa_enviada_em)}, ainda não abriu${pos}`
  }
  if (lead.status === 'questionario') return 'Respondeu o questionário'
  if (lead.questionario_enviado) return 'Questionário enviado, aguardando'
  if (lead.respondeu) return 'Respondeu, falta mandar o questionário'
  if (!lead.passo) return 'Ainda não abordado'
  const nomes = { 1: '1ª mensagem enviada', 2: 'Retorno 1 enviado', 3: 'Retorno 2 enviado' }
  return `${nomes[lead.passo]} ${haQuanto(lead.ultimo_envio_em)}`
}

export function haQuanto(data) {
  if (!data) return ''
  const ms = Date.now() - new Date(data.endsWith('Z') ? data : data + 'Z').getTime()
  const horas = Math.floor(ms / 3600000)
  if (horas < 1) return 'agora há pouco'
  if (horas < 24) return `há ${horas}h`
  const dias = Math.floor(ms / 86400000)
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

// Só diz que é "daqui" para empresas de João Pessoa. Nas outras cidades, diz de onde é e que atende a Paraíba.
export function ondeAtuo(lead) {
  const lugar = `${lead.cidade || ''} ${lead.endereco || ''}`.toLowerCase()
  if (lugar.includes('joão pessoa') || lugar.includes('joao pessoa')) return 'aqui em João Pessoa'
  return 'em João Pessoa e atendo toda a Paraíba'
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
    .replaceAll('{onde_atuo}', ondeAtuo(lead))
    .replaceAll('{empresa}', nomeEmpresa)
    .replaceAll('{meu_nome}', usuario.nome)
    .replaceAll('{minha_empresa}', usuario.empresa ? `, da ${usuario.empresa}` : '')
    .replaceAll('{categoria}', categoria)
    .replaceAll('{nota_texto}', nota)
    .replaceAll('{link_previa}', urlPublica(`/p/${lead.token}`))
    .replaceAll('{link_proposta}', urlPublica(`/proposta/${lead.token}`))
    .replaceAll('{link}', urlPublica(`/q/${lead.token}`))
}

// Roteiro do vídeo de 30 a 45 segundos, montado com os dados do lead
export function roteiroVideo(usuario, lead) {
  const nome = lead.nome.replace(/\s*\((exemplo|example)\)$/i, '')
  const nota = lead.avaliacao && lead.num_avaliacoes >= 10
    ? `as avaliações que vocês já têm no Google, ${String(lead.avaliacao).replace('.', ',')} com ${lead.num_avaliacoes} avaliações`
    : 'as informações que vocês já têm no Google'
  const onde = ondeAtuo(lead)
  return [
    `[0 a 5s, seu rosto ou a tela] "Oi! Aqui é o ${usuario.nome}, faço sites ${onde}."`,
    `[5 a 15s, mostre o topo da prévia] "Montei como ficaria o site da ${nome}. Olha o nome de vocês aqui em cima e o botão que manda direto pro WhatsApp."`,
    `[15 a 30s, role a tela devagar] "Aqui entram os serviços, as fotos e ${nota}. Tudo pronto pra quem procurar ${(lead.categoria || 'vocês').toLowerCase()} no Google."`,
    `[30 a 40s, volte para o topo] "Se gostar, eu ajusto cores e textos do jeito de vocês. Te mando o link pra ver no seu celular."`,
  ].join('\n\n')
}
